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
});

// get the export for a type — resolves the latest available export from the e621 API
// types: artists, bulk_update_requests, pools, posts, post_replacements, post_versions, tag_aliases, tag_implications, tags, wiki_pages
const exp = await client.get("posts");

// get a deferred export — synchronous, the API call is made lazily on first use
const deferred = client.getDeferred("posts");

// get raw metadata for all exports from the e621 API
// returns APIExportData[]: { file_name, file_size, name, updated_at, url }[]
const data = await client.getData();

// access the metadata for this specific export: { file_name, file_size, name, updated_at, url }
const { file_size, updated_at, url } = exp.data;

// check if the export exists
const exists = await exp.exists();

// download the export, returns the file path — not required before reading
// if you move/remove the file, do not reuse the wrapper!
const file = await exp.download();

// delete the downloaded file, if it exists
await exp.delete();

// get all of the records as a single array, DO NOT use this for large exports, arrays with millions of items do not perform well and will likely crash your process!
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

Available parser keys: `artists`, `bulk_update_requests`, `pools`, `posts`, `post_replacements`, `post_versions`, `tag_aliases`, `tag_implications`, `tags`, `wiki_pages`

## CLI
```bash
# get export metadata from the e621 API as a JSON array
# outputs { file_name, file_size, name, updated_at, url }[] with no trailing newline
npx e621-export-downloader data

# check if an export exists
# outputs "true" or "false" with no trailing newline
npx e621-export-downloader exists posts

# download an export
# outputs the path to the downloaded file with no trailing newline
npx e621-export-downloader download posts

# read an export for a given date, as individual JSON lines
# outputs each record as a JSON string on its own line
npx e621-export-downloader read posts

# read an export for a given date, as a JSON array
# outputs the entire export as a JSON array with no trailing newline
# this still streams the csv, so it's safe to use with large exports
npx e621-export-downloader read-all posts

npx e621-export-downloader --help
npx e621-export-downloader --version
npx e621-export-downloader --cache # enable caching
npx e621-export-downloader --no-cache # disable caching (default)
```
