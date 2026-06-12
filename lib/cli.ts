#!/usr/bin/env node
import E621ExportDownloader from "./E621ExportDownloader.js";
import { type ExportName } from "./types.js";
import pkg from "../package.json" with { type: "json" };
import { program } from "commander";

const options = program.storeOptionsAsProperties<{ cache?: boolean; noCache?: boolean; }>();

program.name("e621-export-downloader")
    .description(pkg.description)
    .version(pkg.version)
    .option("--cache", "If downloaded exports should be cached for future use")
    .option("--no-cache", "Disable caching of downloaded exports (default)");

program
    .command("data")
    .description("Get export metadata from the e621 API as a JSON array")
    .action(async () => {
        const client = new E621ExportDownloader();
        const data = await client.getData();
        process.stdout.write(JSON.stringify(data));
    });

program
    .command("exists")
    .description("Check if an export exists")
    .argument("<name>", "The name of the export")
    .action(async (name: ExportName) => {
        const client = new E621ExportDownloader({
            cache: options.cache ?? options.noCache === undefined ? undefined : !options.noCache
        });
        const exists = await (await client.get(name)).exists();
        process.stdout.write(String(exists));
    });

program
    .command("download")
    .description("Download an export")
    .argument("<name>", "The name of the export")
    .action(async (name: ExportName) => {
        const client = new E621ExportDownloader({
            cache: options.cache ?? options.noCache === undefined ? undefined : !options.noCache
        });
        const path = await (await client.get(name)).download();
        process.stdout.write(path);
    });

program
    .command("read")
    .description("Read an export as individual JSON lines")
    .argument("<name>", "The name of the export")
    .action(async (name: ExportName) => {
        const client = new E621ExportDownloader({
            cache: options.cache ?? options.noCache === undefined ? undefined : !options.noCache
        });
        for await (const [line] of (await client.get(name)).read()) {
            process.stdout.write(JSON.stringify(line));
            process.stdout.write("\n");
        }
    });

program
    .command("read-all")
    .description("Read an export as a JSON array")
    .argument("<name>", "The name of the export")
    .action(async (name: ExportName) => {
        const client = new E621ExportDownloader({
            cache: options.cache ?? options.noCache === undefined ? undefined : !options.noCache
        });
        let first = true;
        process.stdout.write("[");
        for await (const [line] of (await client.get(name)).read()) {
            if (!first) process.stdout.write(",");
            process.stdout.write(JSON.stringify(line));
            first = false;
        }
        process.stdout.write("]");
    });

await program.parseAsync();
