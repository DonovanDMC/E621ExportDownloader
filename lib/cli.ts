import E621ExportDownloader from "./E621ExportDownloader.js";
import { type ExportName } from "./types.js";
import pkg from "../package.json" with { type: "json" };
import { program } from "commander";

const options = program.storeOptionsAsProperties<{ cache?: boolean; noCache?: boolean; noRewindOnNotFound?: boolean; rewindOnNotFound?: boolean | number; }>();

program.name("e621-export-downloader")
    .description(pkg.description)
    .version(pkg.version)
    .option("--cache", "If downloaded exports should be cached for future use")
    .option("--no-cache", "Disable caching of downloaded exports (default)")
    .option("--rewind-on-not-found [days]", "If the date should be decreased by one day if no export is found. Provide a number to limit how many days can be rewound.")
    .option("--no-rewind-on-not-found", "Disable rewinding of export dates (default)");

program
    .command("exists")
    .description("Check if an export exists for a given date")
    .argument("<name>", "The name of the export")
    .argument("[date]", "The date of the export in YYYY-MM-DD format, defaults to today")
    .action(async (name: ExportName, dateStr: string | undefined) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const client = new E621ExportDownloader({
            cache:            options.cache ?? options.noCache === undefined ? undefined : !options.noCache,
            rewindOnNotFound: options.rewindOnNotFound ?? options.noRewindOnNotFound === undefined ? undefined : !options.noRewindOnNotFound
        });
        await client.get(name).exists(date).then(exists => process.stdout.write(String(exists)));
    });

program
    .command("download")
    .description("Download an export for a given date")
    .argument("<name>", "The name of the export")
    .argument("[date]", "The date of the export in YYYY-MM-DD format, defaults to today")
    .action(async (name: ExportName, dateStr: string | undefined) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const client = new E621ExportDownloader({
            rewindOnNotFound: options.rewindOnNotFound ?? options.noRewindOnNotFound === undefined ? undefined : !options.noRewindOnNotFound
        });
        await client.get(name).download(date).then(path => process.stdout.write(path));
    });

program
    .command("read")
    .description("Read an export for a given date, as individual JSON lines")
    .argument("<name>", "The name of the export")
    .argument("[date]", "The date of the export in YYYY-MM-DD format, defaults to today")
    .action(async (name: ExportName, dateStr: string | undefined) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const client = new E621ExportDownloader({
            cache:            options.cache ?? options.noCache === undefined ? undefined : !options.noCache,
            rewindOnNotFound: options.rewindOnNotFound ?? options.noRewindOnNotFound === undefined ? undefined : !options.noRewindOnNotFound
        });
        for await (const [line] of client.get(name).read(date)) {
            process.stdout.write("\n");
            process.stdout.write(JSON.stringify(line));
        }
        process.stdout.write("\b");
    });

program
    .command("read-all")
    .description("Read an export for a given date, as a JSON array")
    .argument("<name>", "The name of the export")
    .argument("[date]", "The date of the export in YYYY-MM-DD format, defaults to today")
    .action(async (name: ExportName, dateStr: string | undefined) => {
        const date = dateStr ? new Date(dateStr) : new Date();
        const client = new E621ExportDownloader({
            cache:            options.cache ?? options.noCache === undefined ? undefined : !options.noCache,
            rewindOnNotFound: options.rewindOnNotFound ?? options.noRewindOnNotFound === undefined ? undefined : !options.noRewindOnNotFound
        });
        process.stdout.write("[");
        for await (const [line] of client.get(name).read(date)) {
            process.stdout.write(JSON.stringify(line));
            process.stdout.write(",");
        }
        process.stdout.write("\b");
        process.stdout.write("]");
    });

await program.parseAsync();
