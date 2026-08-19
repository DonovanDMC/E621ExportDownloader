import type { ExportName } from "./types.js";
import pkg from "../package.json" with { type: "json" };
import { DBExportNameSchema } from "e621/generated/schemas";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const BASE_URL = "https://e621.net/db_export/";
export const EXPORT_NAMES = DBExportNameSchema.enum;
export const EXPORT_URL = (name: ExportName, date: Date): string => `${BASE_URL}${name}-${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}.csv.gz`;
export const TEMP_DIR = join(tmpdir(),"e621-export-downloader");
export const USER_AGENT = `E621ExportDownloader/${pkg.version} (${pkg.homepage})`;
