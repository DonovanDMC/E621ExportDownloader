import type E621ExportDownloader from "./E621ExportDownloader.js";
import Export from "./Export.js";
import { type Parser, type ExportName } from "./types.js";
import Debug from "./Debug.js";

export default class ExportHelper<N extends ExportName, R extends object = object, D extends object = object> {
    private _rewindCount = 0;
    client: E621ExportDownloader;
    name: N;
    parser: Parser<R, D>;
    constructor(name: N, parser: Parser<R, D>, client: E621ExportDownloader) {
        this.client = client;
        this.name = name;
        this.parser = parser;
    }

    private _formatDate(date: Date): string {
        return date.toISOString().split("T")[0]!;
    }

    private async _get(date: Date, originalDate = date): Promise<Export<N, R, D>> {
        const exp = this.get(date);
        const exists = await exp.exists();
        if (!exists) {
            if (this.client.options.rewindOnNotFound !== false && this._rewindCount < this.client.options.rewindOnNotFound) {
                this._rewindCount++;
                Debug(
                    `e621-export-downloader:helper:${this._formatDate(date)}`,
                    "rewinding export lookup for %s from %s (attempt %s/%s)",
                    this.name,
                    this._formatDate(originalDate),
                    this._rewindCount,
                    this.client.options.rewindOnNotFound
                );
                const newDate = new Date(date);
                newDate.setDate(newDate.getDate() - 1);
                return this._get(newDate, originalDate);
            } else {
                throw new Error(`Export ${this.name} for ${this._formatDate(originalDate)} does not exist, and either rewinding is not allowed or the maximum rewind limit has been reached`);
            }
        }
        Debug(`helper:${this._formatDate(date)}`, "resolved export for %s", this.name);
        return exp;
    }

    async delete(date: Date): Promise<boolean> {
        Debug(`helper:${this._formatDate(date)}`, "deleting export for %s", this.name);
        return (await this._get(date)).delete();
    }

    async download(date: Date): Promise<string> {
        Debug(`helper:${this._formatDate(date)}`, "downloading export for %s", this.name);
        return (await this._get(date)).download();
    }

    async exists(date: Date): Promise<boolean> {
        Debug(`helper:${this._formatDate(date)}`, "checking export existence for %s", this.name);
        return (await this._get(date)).exists();
    }

    get(date: Date): Export<N, R, D> {
        Debug(`helper:${this._formatDate(date)}`, "creating export handle for %s", this.name);
        return new Export(date, this);
    }

    async * read(date: Date): AsyncGenerator<[record: D, rowCount: number]> {
        Debug(`helper:${this._formatDate(date)}`, "reading export stream for %s", this.name);
        for await (const [record, rowCount] of (await this._get(date)).read()) {
            yield [record, rowCount];
        }
    }

    async readAll(date: Date): Promise<Array<D>> {
        Debug(`helper:${this._formatDate(date)}`, "reading all exports for %s", this.name);
        const records: Array<D> = [];
        for await (const [record] of this.read(date)) {
            records.push(record);
        }
        return records;
    }
}
