import { TEMP_DIR, USER_AGENT } from "./Constants.js";
import type { Parser } from "./types.js";
import Debug from "./Debug.js";
import type { DefaultImporters, ExportImporter } from "./importers/index.js";
import { parse } from "csv-parse";
import { type DBExport } from "e621";
import { type DbExportNames } from "e621/generated/types";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { Readable, Transform } from "node:stream";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import {
    access,
    constants,
    mkdir,
    rename,
    unlink
} from "node:fs/promises";
import { createGunzip } from "node:zlib";

export class ExportDownloadCorruptedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = "ExportDownloadCorruptedError";
    }
}

type ImportOptions<Imports extends object, Type extends keyof Imports> = Imports[Type] extends ExportImporter<infer Options> ? Options : never;

export interface ExportClient<Imports extends object> {
    options: {
        cache: boolean;
        delimiter: string;
        importers: DefaultImporters & Imports;
    };
}

export default class Export<N extends DbExportNames, R extends object = object, D extends object = object, Imports extends object = object> {
    client: ExportClient<Imports>;
    data: DBExport;
    /** If undefined, no check has been performed yet */
    downloaded: boolean | undefined;
    name: N;
    parser: Parser<R, D>;
    constructor(name: N, parser: Parser<R, D>, client: ExportClient<Imports>, data: DBExport) {
        this.data = data;
        this.client = client;
        this.name = name;
        this.parser = parser;
    }

    private _formatDate(): string {
        return this.data.updated_at.split("T")[0]!;
    }

    private async _isCorrupted(): Promise<boolean> {
        const csv = parse({ columns: true });
        const stream = createReadStream(this.filePath);
        stream.pipe(csv);
        try {
            for await (const record of csv) {
                void record;
            }
            return false;
        } catch (error) {
            Debug(`export:${this.name}`, "cached export is corrupted: %o", error);
            stream.destroy();
            return true;
        }
    }

    private async checkDownloaded(): Promise<boolean> {
        if (this.downloaded !== undefined) return this.downloaded;
        this.downloaded = await access(this.filePath, constants.F_OK | constants.W_OK).then(() => true, () => false);
        if (this.downloaded && await this._isCorrupted()) this.downloaded = false;
        Debug(`export:${this.name}`, "checked downloaded state: %s", this.downloaded);
        return this.downloaded;
    }

    private get filePath(): string {
        return join(TEMP_DIR, `${this.name}-${this._formatDate()}.csv`);
    }

    async delete(): Promise<boolean> {
        const exists = await access(this.filePath, constants.F_OK).then(() => true, () => false);
        if (!exists) return false;
        Debug(`export:${this.name}`, "deleting cached export");
        await unlink(this.filePath);
        this.downloaded = false;
        return true;
    }

    async download(): Promise<string> {
        if (!await this.exists()) {
            throw new Error(`Export ${this.name} does not exist`);
        }
        if (await this.checkDownloaded()) {
            Debug(`export:${this.name}`, "using cached export");
            return this.filePath;
        }
        Debug(`export:${this.name}`, "downloading export");
        const response = await fetch(this.data.url, { headers: { "User-Agent": USER_AGENT } });
        if (!response.ok) {
            throw new Error(`Failed to download export ${this.name}: ${response.status} ${response.statusText}`);
        }

        const contentLength = response.headers.get("content-length");
        if (contentLength !== null && Number.isSafeInteger(this.data.file_size) && Number(contentLength) !== this.data.file_size) {
            throw new ExportDownloadCorruptedError(`Downloaded export ${this.name} has an unexpected size: expected ${this.data.file_size} bytes, received ${contentLength} bytes`);
        }

        await mkdir(dirname(this.filePath), { recursive: true });
        const tempFile = `${this.filePath}.download-${process.pid}-${Date.now()}`;
        const checksum = createHash("sha256");
        const hashStream = new Transform({
            transform(chunk: Buffer, _encoding, callback): void {
                checksum.update(chunk);
                callback(null, chunk);
            }
        });
        try {
            await pipeline(response.body!, hashStream, createGunzip(), createWriteStream(tempFile, { flags: "wx" }));
            const expectedChecksum = this.data.checksum.trim().toLowerCase();
            const actualChecksum = checksum.digest("hex");
            if (actualChecksum !== expectedChecksum) {
                throw new ExportDownloadCorruptedError(`Downloaded export ${this.name} has an invalid checksum: expected ${expectedChecksum}, received ${actualChecksum}`);
            }
            await rename(tempFile, this.filePath);
        } catch (error) {
            await unlink(tempFile).catch(() => {});
            if (error instanceof ExportDownloadCorruptedError) throw error;
            throw new ExportDownloadCorruptedError(`Downloaded export ${this.name} is corrupted or incomplete`, { cause: error });
        }
        this.downloaded = true;
        Debug(`export:${this.name}`, "download complete: %s", this.filePath);
        return this.filePath;
    }

    async exists(): Promise<boolean> {
        return fetch(this.data.url, { method: "HEAD", headers: { "User-Agent": USER_AGENT } })
            .then(res => {
                Debug(`export:${this.name}`, "checked export existence: %s", res.ok);
                return res.ok;
            })
            .catch(() => {
                Debug(`export:${this.name}`, "failed to check export existence");
                return false;
            });
    }

    async getColumns(): Promise<Array<string>> {
        Debug(`export:${this.name}`, "getting columns");
        if (!await this.exists()) {
            throw new Error(`Export ${this.name} does not exist`);
        }

        let readable: NodeJS.ReadableStream;
        const teardown: Array<() => void> = [];

        try {
            if (await this.checkDownloaded()) {
                Debug(`export:${this.name}`, "using cached export");
                const stream = createReadStream(this.filePath);
                teardown.push(() => stream.destroy());
                readable = stream;
            } else {
                Debug(`export:${this.name}`, "downloading partial export to read columns");
                const controller = new AbortController();
                const response = await fetch(this.data.url, {
                    headers: { "User-Agent": USER_AGENT },
                    signal:  controller.signal
                });

                if (!response.ok) {
                    throw new Error(`Failed to download export ${this.name}: ${response.status} ${response.statusText}`);
                }

                if (!response.body) {
                    throw new Error(`Export ${this.name} returned no response body`);
                }
                const source = Readable.fromWeb(response.body!);

                const contentLength = Number(response.headers.get("content-length") ?? "0");
                let downloaded = 0;
                source.on("data", chunk => downloaded += (chunk as []).length);

                const gunzip = createGunzip();
                readable = source.pipe(gunzip);

                teardown.push(
                    () => controller.abort(),
                    () => source.destroy(),
                    () => gunzip.destroy(),
                    () => Debug(`export:${this.name}`, `downloaded ${downloaded.toLocaleString()} bytes (out of ${contentLength.toLocaleString()} bytes)`)
                );
            }


            const parser = readable.pipe(parse({
                delimiter: this.client.options.delimiter,
                columns:   false,
                toLine:    1
            }));

            try {
                for await (const record of parser) {
                    return record as Array<string>;
                }
            } finally {
                parser.destroy();
            }

            throw new Error(`Export ${this.name} is empty`);
        } finally {
            for (const fn of teardown) {
                try {
                    fn();
                } catch {}
            }
        }
    }

    async import<Type extends keyof (DefaultImporters & Imports)>(type: Type, options: ImportOptions<DefaultImporters & Imports, Type>): Promise<void> {
        if (!await this.exists()) {
            throw new Error(`Export ${this.name} does not exist`);
        }
        if (await this.isCorrupted()) await this.delete();
        const file = await this.download();
        try {
            const importer = this.client.options.importers[type];
            if (typeof importer !== "function") throw new Error(`Import type "${String(type)}" is not configured`);
            await importer(file, options, { name: this.name, data: this.data });
        } finally {
            if (!this.client.options.cache) await this.delete();
        }
    }

    /** Returns true when the cached CSV cannot be read as a complete CSV export. */
    async isCorrupted(): Promise<boolean> {
        const present = await access(this.filePath, constants.F_OK | constants.R_OK).then(() => true, () => false);
        if (!present) return false;
        const corrupted = await this._isCorrupted();
        if (corrupted) this.downloaded = false;
        return corrupted;
    }

    async * read(): AsyncGenerator<[record: D, rowCount: number]> {
        if (!(await this.checkDownloaded())) await this.download();
        Debug(`export:${this.name}`, "reading export");
        const csv = parse<unknown>({
            columns:   true,
            delimiter: this.client.options.delimiter,
            onRecord:  (record, context) => this.parser(record as R, context)
        });
        await new Promise<void>(resolve => {
            const stream = createReadStream(this.filePath);
            csv.on("readable", resolve);
            csv.on("end", () => stream.close());
            stream.pipe(csv);
        });
        for await (const record of csv) {
            yield [record, csv.info.records];
        }
        Debug(`export:${this.name}`, "finished reading export");
        if (!this.client.options.cache) await this.delete();
    }

    async readAll(): Promise<Array<D>> {
        Debug(`export:${this.name}`, "reading all records");
        const results: Array<D> = [];
        for await (const [record] of this.read()) {
            results.push(record);
        }
        return results;
    }
}
