import postgresImporter from "./postgres.js";
import type { DBExport } from "e621";
import type { DbExportNames } from "e621/generated/types";

export { default as importPostgres, type PostgresImportOptions } from "./postgres.js";

export interface ExportImportContext {
    data: DBExport;
    name: DbExportNames;
}

export type ExportImporter<Options extends object = object> = (filePath: string, options: Options, context: ExportImportContext) => Promise<void>;

export interface DefaultImporters {
    postgres: ExportImporter<import("./postgres.js").PostgresImportOptions>;
}

export const defaultImporters: DefaultImporters = {
    postgres: postgresImporter
};
