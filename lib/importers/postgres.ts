import type { ExportImportContext } from "./index.js";
import { spawn } from "node:child_process";
import { createReadStream } from "node:fs";
import { pipeline } from "node:stream/promises";

export interface PostgresImportOptions {
    connectionString: string;
    tableName?: string;
}

function quoteTableName(tableName: string): string {
    const parts = tableName.split(".");
    if (parts.length === 0 || parts.some(part => !/^[A-Za-z_][A-Za-z0-9_$]*$/.test(part))) {
        throw new Error(`Invalid PostgreSQL table name: ${tableName}`);
    }
    return parts.map(part => `"${part.replaceAll('"', '""')}"`).join(".");
}

/** Streams an export CSV into an existing PostgreSQL table using `psql`. */
export default async function importPostgres(filePath: string, options: PostgresImportOptions, context: ExportImportContext): Promise<void> {
    const tableName = options.tableName ?? context.name;
    const command = `\\copy ${quoteTableName(tableName)} FROM STDIN WITH (FORMAT csv, HEADER true)`;
    const child = spawn("psql", [options.connectionString, "--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--command", command], {
        stdio: ["pipe", "ignore", "pipe"]
    });
    let stderr = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", chunk => {
        stderr += chunk;
    });
    const result = new Promise<void>((resolve, reject) => {
        child.once("error", reject);
        child.once("close", code => {
            if (code === 0) {
                resolve();
            } else {
                const detail = stderr.trim() || `with exit code ${code}`;
                reject(new Error(`PostgreSQL import failed: ${detail}`));
            }
        });
    });
    try {
        if (!child.stdin) throw new Error("Unable to open psql input stream");
        await pipeline(createReadStream(filePath), child.stdin);
        await result;
    } catch (error) {
        if (!child.killed) child.kill();
        await result.catch(() => {});
        throw error;
    }
}
