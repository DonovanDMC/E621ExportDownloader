# E621 Export Downloader

A utility for downloading and parsing e621's exports.

## Installation

```bash
npm install e621-export-downloader
```

**This package is ESM only. [Your project should be too.](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)**

## Usage

```js
import E621ExportDownloader from "e621-export-downloader";

const client = new E621ExportDownloader({
    cache: true, // if set to true, export files will be kept even after reading, defaults to false
    rewindOnNotFound: 2, // If the date should be decreased by one day if no export is found. Provide a number to limit how many days can be rewound. `true` is equivalent to `2`. defaults to false
});

// get the helper for interacting with a type of export
// types: pools, posts, tag_aliases, tag_implications, tags, wiki_pages
const helper = client.get("posts");

// get the wrapper for a specific date, the hours/minutes/seconds/milliseconds are ignored
// using this will result in no rewinding regardless of the value of rewindOnNotFound
const exp = helper.get(new Date());

// both at once
// using this will result in no rewinding regardless of the value of rewindOnNotFound
const exp = client.get("posts", new Date());

// all of the following functions can be called on helper with a "date" argument, if rewindOnNotFound is enabled, the helper will remove 1 day from the date until it finds an export or reaches the rewind limit, if it reaches the rewind limit without finding an export, it will throw an error
const exists = await helper.exists(new Date());

// check if the export exists for the date
const exists = await exp.exists();

// download the export for the date, returns the file path - not required before reading
// if you move/remove the file, do not reuse the wrapper!
const file = await exp.download();

// delete the downloaded file, if it exists
await exp.delete();

// get all of the records as a single array, DO NOT use this for large exports, arrays will millions of items do not perform well and will likely crash your process!
// (not to mention that the posts export is more than 5 gigabytes)
const records = await exp.readAll();

// exp.read() returns an AsyncGenerator that yields a record and the total rowCount, this streams the csv and is much more memory efficient
for await (const [record, rowCount] of exp.read()) {
    // do something with the record
}
```

## Replace or extend a parser
```typescript
import type { CastingContext } from "csv-parse";
import E621ExportDownloader, { DefaultParsers, type RawPost } from "e621-export-downloader";

interface ExtendedPostData extends DefaultParsers.PostData {
    // add your own properties
    myCustomProperty: string;
}

const client = new E621ExportDownloader({
    parsers: {
        // replace the default parsers, return null or undefined to skip a record (will not be sent to readers)
        // key-value pairs of export name and a function that takes the record and csv context as arguments and returns the parsed record
        // types are fully supported and will be propagated down into the helpers and export readers based on the return type
        // the return type can be anything that satisfies `object` - objects, classes, etc
        posts: (record: RawPost, context: CastingContext): ExtendedPostData | null | undefined => {
            const parsed = DefaultParsers.parsePost(record, context);
            return {
                ...parsed,
                myCustomProperty: "hello world"
            };
        }
    }
});
```

## CLI
```bash
# check if an export exists for a given date, date is optional and defaults to today
# outputs "true" or "false" with no trailing newline
npx e621-export-downloader exists posts 2024-01-01

# download an export for a given date, date is optional and defaults to today
# outputs the path to the downloaded file with no trailing newline
npx e621-export-downloader download posts 2024-01-01

# read an export for a given date, as individual JSON lines, date is optional and defaults to today
# outputs each record as a JSON string on its own line
npx e621-export-downloader read posts 2024-01-01

# read an export for a given date, as a JSON array, date is optional and defaults to today
# outputs the entire export as a JSON array with no trailing newline
# this still streams the csv, so it's safe to use with large exports
npx e621-export-downloader read-all posts 2024-01-01

npx e621-export-downloader --help
npx e621-export-downloader --version
npx e621-export-downloader --cache # enable caching
npx e621-export-downloader --no-cache # disable caching (default)
npx e621-export-downloader --rewind-on-not-found # enable rewinding of export dates
npx e621-export-downloader --no-rewind-on-not-found # disable rewinding of export dates (default)
```
