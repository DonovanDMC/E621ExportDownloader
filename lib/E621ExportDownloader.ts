import Export from "./Export.js";
import {
    parseArtist,
    type ArtistData,
    parseBulkUpdateRequest,
    type BulkUpdateRequestData,
    parsePool,
    type PoolData,
    parsePost,
    type PostData,
    parsePostReplacement,
    type PostReplacementData,
    parsePostVersion,
    type PostVersionData,
    parseTagAlias,
    type TagAliasData,
    parseTagImplication,
    type TagImplicationData,
    parseTag,
    type TagData,
    parseWikiPage,
    type WikiPageData
} from "./parsers/index.js";
import type {
    RawArtist,
    RawBulkUpdateRequest,
    RawPool,
    RawPost,
    RawPostReplacement,
    RawPostVersion,
    RawTag,
    RawTagAlias,
    RawTagImplication,
    RawWikiPage,
    Parser,
    ExportName
} from "./types.js";
import Debug from "./Debug.js";
import { USER_AGENT } from "./Constants.js";
import DeferredExport from "./DeferredExport.js";
import { defaultImporters, type DefaultImporters } from "./importers/index.js";
import { createE621Client, createStandalone } from "e621/standalone";
import DBExports from "e621/modules/DbExports";
import { type DBExport } from "e621";

export interface Options<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData, Imports extends object = object> {
    /**
     * If downloaded exports should be cached for future use. They will be cached in the temporary directory, and deleted if a newer export is downloaded.
     *
     * Note that the cached files are kept uncompressed, and as of 06/12/2026, these total about 39.51GiB
     *
     * * artists: ~24.4MiB
     * * bulk_update_requests: ~7.1MiB
     * * pools: ~15.3MiB
     * * posts: ~5.8GiB
     * * post_replacements: ~97.4MiB
     * * post_versions: ~36.4GiB
     * * tag_aliases: ~5.3MiB
     * * tag_implications: ~4.5MiB
     * * tags: ~41.2MiB
     * * wiki pages: ~49.3MiB
     * @defaultValue false
     */
    cache?: boolean;
    /** Importers available through Export.import(). */
    importers?: Partial<DefaultImporters> & Imports;
    /** Custom parsers. */
    parsers?: {
        artists?: Parser<RawArtist, Artist>;
        bulk_update_requests?: Parser<RawBulkUpdateRequest, BulkUpdateRequest>;
        pools?: Parser<RawPool, Pool>;
        post_replacements?: Parser<RawPostReplacement, PostReplacement>;
        post_versions?: Parser<RawPostVersion, PostVersion>;
        posts?: Parser<RawPost, Post>;
        tag_aliases?: Parser<RawTagAlias, TagAlias>;
        tag_implications?: Parser<RawTagImplication, TagImplication>;
        tags?: Parser<RawTag, Tag>;
        wiki_pages?: Parser<RawWikiPage, WikiPage>;
    };
}

interface ClientOptions<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData, Imports extends object = object> {
    cache: boolean;
    importers: DefaultImporters & Imports;
    parsers: {
        artists: Parser<RawArtist, Artist>;
        bulk_update_requests: Parser<RawBulkUpdateRequest, BulkUpdateRequest>;
        pools: Parser<RawPool, Pool>;
        post_replacements: Parser<RawPostReplacement, PostReplacement>;
        post_versions: Parser<RawPostVersion, PostVersion>;
        posts: Parser<RawPost, Post>;
        tag_aliases: Parser<RawTagAlias, TagAlias>;
        tag_implications: Parser<RawTagImplication, TagImplication>;
        tags: Parser<RawTag, Tag>;
        wiki_pages: Parser<RawWikiPage, WikiPage>;
    };
}

export default class E621ExportDownloader<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData, Imports extends object = object> {
    private _exportCache: Array<DBExport> | null = null;
    e621: ReturnType<typeof createStandalone<Array<typeof DBExports>>>;
    options: ClientOptions<Artist, BulkUpdateRequest, Pool, Post, PostReplacement, PostVersion, Tag, TagAlias, TagImplication, WikiPage, Imports>;
    constructor(options?: Options<Artist, BulkUpdateRequest, Pool, Post, PostReplacement, PostVersion, Tag, TagAlias, TagImplication, WikiPage, Imports>) {
        this.options = {
            cache:     options?.cache ?? false,
            importers: { ...defaultImporters, ...options?.importers } as DefaultImporters & Imports,
            parsers:   {
                artists:              options?.parsers?.artists ?? parseArtist as Parser<RawArtist, Artist>,
                bulk_update_requests: options?.parsers?.bulk_update_requests ?? parseBulkUpdateRequest as Parser<RawBulkUpdateRequest, BulkUpdateRequest>,
                pools:                options?.parsers?.pools ?? parsePool as Parser<RawPool, Pool>,
                post_replacements:    options?.parsers?.post_replacements ?? parsePostReplacement as Parser<RawPostReplacement, PostReplacement>,
                post_versions:        options?.parsers?.post_versions ?? parsePostVersion as Parser<RawPostVersion, PostVersion>,
                posts:                options?.parsers?.posts ?? parsePost as Parser<RawPost, Post>,
                tag_aliases:          options?.parsers?.tag_aliases ?? parseTagAlias as Parser<RawTagAlias, TagAlias>,
                tag_implications:     options?.parsers?.tag_implications ?? parseTagImplication as Parser<RawTagImplication, TagImplication>,
                tags:                 options?.parsers?.tags ?? parseTag as Parser<RawTag, Tag>,
                wiki_pages:           options?.parsers?.wiki_pages ?? parseWikiPage as Parser<RawWikiPage, WikiPage>
            }
        };
        const overridenParsers = Object.keys(options?.parsers ?? {}) as Array<ExportName>;
        Debug("client", "initialized client with overridden parsers: %o, cache=%s", overridenParsers, this.options.cache);
        this.e621 = createStandalone([DBExports], createE621Client({ userAgent: USER_AGENT }));
    }

    /** Download the export and get its info. */
    async get(name: "artists"): Promise<Export<"artists", RawArtist, Artist, Imports>>;
    /** Download the export and get its info. */
    async get(name: "bulk_update_requests"): Promise<Export<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest, Imports>>;
    /** Download the export and get its info. */
    async get(name: "pools"): Promise<Export<"pools", RawPool, Pool, Imports>>;
    /** Download the export and get its info. */
    async get(name: "posts"): Promise<Export<"posts", RawPost, Post, Imports>>;
    /** Download the export and get its info. */
    async get(name: "post_replacements"): Promise<Export<"post_replacements", RawPostReplacement, PostReplacement, Imports>>;
    /** Download the export and get its info. */
    async get(name: "post_versions"): Promise<Export<"post_versions", RawPostVersion, PostVersion, Imports>>;
    /** Download the export and get its info. */
    async get(name: "tags"): Promise<Export<"tags", RawTag, Tag, Imports>>;
    /** Download the export and get its info. */
    async get(name: "tag_aliases"): Promise<Export<"tag_aliases", RawTagAlias, TagAlias, Imports>>;
    /** Download the export and get its info. */
    async get(name: "tag_implications"): Promise<Export<"tag_implications", RawTagImplication, TagImplication, Imports>>;
    /** Download the export and get its info. */
    async get(name: "wiki_pages"): Promise<Export<"wiki_pages", RawWikiPage, WikiPage, Imports>>;
    /** Download the export and get its info. */
    async get(name: ExportName): Promise<Export<"artists", RawArtist, Artist, Imports> | Export<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest, Imports> | Export<"pools", RawPool, Pool, Imports> | Export<"posts", RawPost, Post, Imports> | Export<"post_replacements", RawPostReplacement, PostReplacement, Imports> | Export<"post_versions", RawPostVersion, PostVersion, Imports> | Export<"tag_aliases", RawTagAlias, TagAlias, Imports> | Export<"tag_implications", RawTagImplication, TagImplication, Imports> | Export<"tags", RawTag, Tag, Imports> | Export<"wiki_pages", RawWikiPage, WikiPage, Imports>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async get(name: ExportName): Promise<Export<any, any, any>> {
        const data = (await this.getData()).find(d => d.name === name);
        if (!data) throw new Error(`Export data for "${name}" not found.`);
        Debug("client", "creating export for %s (size=%s, updated_at=%s)", name, data.file_size, data.updated_at);
        return new Export(name, this.options.parsers[name] as never, this as never, data);
    }

    /** Gat an export's api data. */
    async getData(): Promise<Array<DBExport>> {
        if (this._exportCache !== null) return this._exportCache;
        Debug("client", "fetching export data from api");
        const data = this._exportCache = await this.e621.dbExports.get();
        const latest = data.toSorted((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()).at(-1)!;
        Debug("client", `Export data resolved: ${latest.updated_at}`);
        return data;
    }

    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "artists"): DeferredExport<"artists", RawArtist, Artist, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "bulk_update_requests"): DeferredExport<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "pools"): DeferredExport<"pools", RawPool, Pool, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "posts"): DeferredExport<"posts", RawPost, Post, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "post_replacements"): DeferredExport<"post_replacements", RawPostReplacement, PostReplacement, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "post_versions"): DeferredExport<"post_versions", RawPostVersion, PostVersion, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "tags"): DeferredExport<"tags", RawTag, Tag, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "tag_aliases"): DeferredExport<"tag_aliases", RawTagAlias, TagAlias, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "tag_implications"): DeferredExport<"tag_implications", RawTagImplication, TagImplication, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: "wiki_pages"): DeferredExport<"wiki_pages", RawWikiPage, WikiPage, Imports>;
    /** Defers downlaoding the export until methods are called. */
    getDeferred(name: ExportName): DeferredExport<"artists", RawArtist, Artist, Imports> | DeferredExport<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest, Imports> | DeferredExport<"pools", RawPool, Pool, Imports> | DeferredExport<"posts", RawPost, Post, Imports> | DeferredExport<"post_replacements", RawPostReplacement, PostReplacement, Imports> | DeferredExport<"post_versions", RawPostVersion, PostVersion, Imports> | DeferredExport<"tag_aliases", RawTagAlias, TagAlias, Imports> | DeferredExport<"tag_implications", RawTagImplication, TagImplication, Imports> | DeferredExport<"tags", RawTag, Tag, Imports> | DeferredExport<"wiki_pages", RawWikiPage, WikiPage, Imports>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDeferred(name: ExportName): DeferredExport<any, any, any> {
        Debug("client", "creating deferred export for %s ", name);
        return new DeferredExport(name, this.options.parsers[name] as never, this as never) as never;
    }

    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "artists"): AsyncGenerator<[record: Artist, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "bulk_update_requests"): AsyncGenerator<[record: BulkUpdateRequest, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "pools"): AsyncGenerator<[record: Pool, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "posts"): AsyncGenerator<[record: Post, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "post_replacements"): AsyncGenerator<[record: PostReplacement, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "post_versions"): AsyncGenerator<[record: PostVersion, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "tags"): AsyncGenerator<[record: Tag, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "tag_aliases"): AsyncGenerator<[record: TagAlias, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "tag_implications"): AsyncGenerator<[record: TagImplication, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: "wiki_pages"): AsyncGenerator<[record: WikiPage, rowCount: number]>;
    /** Returns a reader directly, defers downlaoding the export until the reader is used. */
    getDeferredReader(name: ExportName): AsyncGenerator<[record: Artist, rowCount: number]> | AsyncGenerator<[record: BulkUpdateRequest, rowCount: number]> | AsyncGenerator<[record: Pool, rowCount: number]> | AsyncGenerator<[record: Post, rowCount: number]> | AsyncGenerator<[record: PostReplacement, rowCount: number]> | AsyncGenerator<[record: PostVersion, rowCount: number]> | AsyncGenerator<[record: Tag, rowCount: number]> | AsyncGenerator<[record: TagAlias, rowCount: number]> | AsyncGenerator<[record: TagImplication, rowCount: number]> | AsyncGenerator<[record: WikiPage, rowCount: number]>  ;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDeferredReader(name: ExportName): AsyncGenerator<[record: any, rowCount: number]> {
        return this.getDeferred(name).read();
    }

    /** Returns a reader directly. */
    async getReader(name: "artists"): Promise<AsyncGenerator<[record: Artist, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "bulk_update_requests"): Promise<AsyncGenerator<[record: BulkUpdateRequest, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "pools"): Promise<AsyncGenerator<[record: Pool, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "posts"): Promise<AsyncGenerator<[record: Post, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "post_replacements"): Promise<AsyncGenerator<[record: PostReplacement, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "post_versions"): Promise<AsyncGenerator<[record: PostVersion, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "tags"): Promise<AsyncGenerator<[record: Tag, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "tag_aliases"): Promise<AsyncGenerator<[record: TagAlias, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "tag_implications"): Promise<AsyncGenerator<[record: TagImplication, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: "wiki_pages"): Promise<AsyncGenerator<[record: WikiPage, rowCount: number]>>;
    /** Returns a reader directly. */
    async getReader(name: ExportName): Promise<AsyncGenerator<[record: Artist, rowCount: number]> | AsyncGenerator<[record: BulkUpdateRequest, rowCount: number]> | AsyncGenerator<[record: Pool, rowCount: number]> | AsyncGenerator<[record: Post, rowCount: number]> | AsyncGenerator<[record: PostReplacement, rowCount: number]> | AsyncGenerator<[record: PostVersion, rowCount: number]> | AsyncGenerator<[record: Tag, rowCount: number]> | AsyncGenerator<[record: TagAlias, rowCount: number]> | AsyncGenerator<[record: TagImplication, rowCount: number]> | AsyncGenerator<[record: WikiPage, rowCount: number]>  >;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async getReader(name: ExportName): Promise<AsyncGenerator<[record: any, rowCount: number]>> {
        return (await this.get(name)).read();
    }
}
