import { TEMP_DIR, USER_AGENT } from "./Constants.js";
import type { APIExportData, ExportName, Parser } from "./types.js";
import Debug from "./Debug.js";
import type E621ExportDownloader from "./E621ExportDownloader.js";
import { parse } from "csv-parse";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { access, constants, mkdir, unlink } from "node:fs/promises";
import { createGunzip } from "node:zlib";

export default class Export<N extends ExportName, R extends object = object, D extends object = object> {
    client: E621ExportDownloader;
    data: APIExportData;
    /** If undefined, no check has been performed yet */
    downloaded: boolean | undefined;
    name: N;
    parser: Parser<R, D>;
    constructor(name: N, parser: Parser<R, D>, client: E621ExportDownloader, data: APIExportData) {
        this.data = data;
        this.client = client;
        this.name = name;
        this.parser = parser;
    }

    private _formatDate(): string {
        return this.data.updated_at.split("T")[0]!;
    }

    private async checkDownloaded(): Promise<boolean> {
        if (this.downloaded !== undefined) return this.downloaded;
        this.downloaded = await access(this.filePath, constants.F_OK | constants.W_OK).then(() => true, () => false);
        Debug(`export:${this.name}`, "checked downloaded state: %s", this.downloaded);
        return this.downloaded;
    }

    private get filePath(): string {
        return join(TEMP_DIR, `${this.name}-${this._formatDate()}.csv`);
    }

    async delete(): Promise<boolean> {
        const exists = await this.checkDownloaded();
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

        await mkdir(dirname(this.filePath), { recursive: true });
        const tempFile = this.filePath;
        await pipeline(response.body!, createGunzip(), createWriteStream(tempFile));
        this.downloaded = true;
        Debug(`export:${this.name}`, "download complete: %s", tempFile);
        return tempFile;
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

    async * read(): AsyncGenerator<[record: D, rowCount: number]> {
        if (!(await this.checkDownloaded())) await this.download();
        Debug(`export:${this.name}`, "reading export");
        const csv = parse<unknown>({
            columns:  true,
            onRecord: (record, context) => this.parser(record as R, context)
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
