import type E621ExportDownloader from "./E621ExportDownloader.js";
import type Export from "./Export.js";
import { type Parser, type ExportName } from "./types.js";
import Debug from "./Debug.js";

export default class DeferredExport<N extends ExportName, R extends object = object, D extends object = object> {
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

    private async _get(): Promise<Export<N, R, D>> {
        return this.client.get(this.name).then(r => {
            Debug(`deferred:${this.name}`, "resolved export: size=%s, updated_at=%s", r.data.file_size, r.data.updated_at);
            return r as unknown as Export<N, R, D>;
        });
    }

    async delete(): Promise<boolean> {
        Debug(`deferred:${this.name}`, "deleting export");
        return (await this._get()).delete();
    }

    async download(): Promise<string> {
        Debug(`deferred:${this.name}`, "downloading export");
        return (await this._get()).download();
    }

    async exists(): Promise<boolean> {
        Debug(`deferred:${this.name}`, "checking export existence");
        return (await this._get()).exists();
    }

    async get(): Promise<Export<N, R, D>> {
        Debug(`deferred:${this.name}`, "creating export handle");
        return this._get();
    }

    async * read(): AsyncGenerator<[record: D, rowCount: number]> {
        Debug(`deferred:${this.name}`, "reading export stream");
        for await (const [record, rowCount] of (await this._get()).read()) {
            yield [record, rowCount];
        }
    }

    async readAll(): Promise<Array<D>> {
        Debug(`deferred:${this.name}`, "reading all exports");
        const records: Array<D> = [];
        for await (const [record] of this.read()) {
            records.push(record);
        }
        return records;
    }
}
