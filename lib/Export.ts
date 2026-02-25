import { EXPORT_URL, TEMP_DIR, USER_AGENT } from "./Constants.js";
import type ExportHelper from "./ExportHelper.js";
import type { ExportName } from "./types.js";
import Debug from "./Debug.js";
import { parse } from "csv-parse";
import { pipeline } from "node:stream/promises";
import { createReadStream, createWriteStream } from "node:fs";
import { dirname, join } from "node:path";
import { access, constants, mkdir, unlink } from "node:fs/promises";
import { createGunzip } from "node:zlib";

export default class Export<N extends ExportName, R extends object = object, D extends object = object> {
    date: Date;
    /** If undefined, no check has been performed yet */
    downloaded: boolean | undefined;
    helper: ExportHelper<N, R, D>;
    constructor(date: Date, helper: ExportHelper<N, R, D>) {
        this.date = new Date(date.getTime());
        this.date.setUTCHours(0, 0, 0, 0);
        this.helper = helper;
    }

    private _formatDate(): string {
        return this.date.toISOString().split("T")[0]!;
    }

    private async checkDownloaded(): Promise<boolean> {
        if (this.downloaded !== undefined) return this.downloaded;
        this.downloaded = await access(this.filePath, constants.F_OK | constants.W_OK).then(() => true, () => false);
        Debug(`export:${this._formatDate()}`, "checked downloaded state for %s: %s", this.helper.name, this.downloaded);
        return this.downloaded;
    }

    private get filePath(): string {
        return join(TEMP_DIR, `${this.helper.name}-${this._formatDate()}.csv`);
    }

    async delete(): Promise<boolean> {
        const exists = await this.checkDownloaded();
        if (!exists) return false;
        Debug(`export:${this._formatDate()}`, "deleting cached export for %s", this.helper.name);
        await unlink(this.filePath);
        this.downloaded = false;
        return true;
    }

    async download(): Promise<string> {
        if (!await this.exists()) {
            throw new Error(`Export ${this.helper.name} for ${this._formatDate()} does not exist`);
        }
        if (await this.checkDownloaded()) {
            Debug(`export:${this._formatDate()}`, "using cached export for %s", this.helper.name);
            return this.filePath;
        }
        Debug(`export:${this._formatDate()}`, "downloading export for %s", this.helper.name);
        const response = await fetch(EXPORT_URL(this.helper.name, this.date), { headers: { "User-Agent": USER_AGENT } });
        if (!response.ok) {
            throw new Error(`Failed to download export ${this.helper.name} for ${this._formatDate()}: ${response.status} ${response.statusText}`);
        }

        await mkdir(dirname(this.filePath), { recursive: true });
        const tempFile = this.filePath;
        await pipeline(response.body!, createGunzip(), createWriteStream(tempFile));
        this.downloaded = true;
        Debug(`export:${this._formatDate()}`, "download complete for %s: %s", this.helper.name, tempFile);
        return tempFile;
    }

    async exists(): Promise<boolean> {
        return fetch(EXPORT_URL(this.helper.name, this.date), { method: "HEAD", headers: { "User-Agent": USER_AGENT } })
            .then(res => {
                Debug(`export:${this._formatDate()}`, "checked export existence for %s: %s", this.helper.name, res.ok);
                return res.ok;
            })
            .catch(() => {
                Debug(`export:${this._formatDate()}`, "failed to check export existence for %s", this.helper.name);
                return false;
            });
    }

    async * read(): AsyncGenerator<[record: D, rowCount: number]> {
        if (!(await this.checkDownloaded())) await this.download();
        Debug(`export:${this._formatDate()}`, "reading export for %s", this.helper.name);
        const csv = parse<unknown>({
            columns:  true,
            onRecord: (record, context) => this.helper.parser(record as R, context)
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
        Debug(`export:${this._formatDate()}`, "finished reading export for %s", this.helper.name);
        if (!this.helper.client.options.cache) await this.delete();
    }

    async readAll(): Promise<Array<D>> {
        if (!(await this.checkDownloaded())) await this.download();
        Debug(`export:${this._formatDate()}`, "reading all records for %s", this.helper.name);
        const results: Array<D> = [];
        for await (const [record] of this.read()) {
            results.push(record);
        }
        return results;
    }
}
