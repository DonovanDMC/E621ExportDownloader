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
    ExportName,
    APIExportData
} from "./types.js";
import Debug from "./Debug.js";
import { USER_AGENT } from "./Constants.js";
import DeferredExport from "./DeferredExport.js";

export interface Options<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
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

interface ClientOptions<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
    cache: boolean;
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

export default class E621ExportDownloader<Artist extends object = ArtistData, BulkUpdateRequest extends object = BulkUpdateRequestData, Pool extends object = PoolData, Post extends object = PostData, PostReplacement extends object = PostReplacementData, PostVersion extends object = PostVersionData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
    private _exportCache: Array<APIExportData> | null = null;
    options: ClientOptions<Artist, BulkUpdateRequest, Pool, Post, PostReplacement, PostVersion, Tag, TagAlias, TagImplication, WikiPage>;
    constructor(options?: Options<Artist, BulkUpdateRequest, Pool, Post, PostReplacement, PostVersion, Tag, TagAlias, TagImplication, WikiPage>) {
        this.options = {
            cache:   options?.cache ?? false,
            parsers: {
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
    }

    async get(name: "artists"): Promise<Export<"artists", RawArtist, Artist>>;
    async get(name: "bulk_update_requests"): Promise<Export<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest>>;
    async get(name: "pools"): Promise<Export<"pools", RawPool, Pool>>;
    async get(name: "posts"): Promise<Export<"posts", RawPost, Post>>;
    async get(name: "post_replacements"): Promise<Export<"post_replacements", RawPostReplacement, PostReplacement>>;
    async get(name: "post_versions"): Promise<Export<"post_versions", RawPostVersion, PostVersion>>;
    async get(name: "tag_aliases"): Promise<Export<"tag_aliases", RawTagAlias, TagAlias>>;
    async get(name: "tag_implications"): Promise<Export<"tag_implications", RawTagImplication, TagImplication>>;
    async get(name: "tags"): Promise<Export<"tags", RawTag, Tag>>;
    async get(name: "wiki_pages"): Promise<Export<"wiki_pages", RawWikiPage, WikiPage>>;
    async get(name: ExportName): Promise<Export<"artists", RawArtist, Artist> | Export<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest> | Export<"pools", RawPool, Pool> | Export<"posts", RawPost, Post> | Export<"post_replacements", RawPostReplacement, PostReplacement> | Export<"post_versions", RawPostVersion, PostVersion> | Export<"tag_aliases", RawTagAlias, TagAlias> | Export<"tag_implications", RawTagImplication, TagImplication> | Export<"tags", RawTag, Tag> | Export<"wiki_pages", RawWikiPage, WikiPage>>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async get(name: ExportName): Promise<Export<any, any, any>> {
        const data = (await this.getData()).find(d => d.name === name);
        if (!data) throw new Error(`Export data for "${name}" not found.`);
        Debug("client", "creating export for %s (size=%s, updated_at=%s)", name, data.file_size, data.updated_at);
        return new Export(name, this.options.parsers[name] as never, this as never, data);
    }

    async getData(): Promise<Array<APIExportData>> {
        if (this._exportCache !== null) return this._exportCache;
        Debug("client", "fetching export data from api");
        return (this._exportCache! ??= await fetch("https://e621.net/db_exports.json", { headers: { "User-Agent": USER_AGENT } })
            .then(async req => {
                if (req.status !== 200) throw new Error(`Failed to fetch exports: ${req.status} ${req.statusText}`);
                const data = await req.json() as Array<APIExportData>;
                const latest = data.toSorted((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()).at(-1)!;
                Debug("client", `Export data resolved: ${latest.updated_at}`);
                return data;
            }));
    }

    getDeferred(name: "artists"): DeferredExport<"artists", RawArtist, Artist>;
    getDeferred(name: "bulk_update_requests"): DeferredExport<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest>;
    getDeferred(name: "pools"): DeferredExport<"pools", RawPool, Pool>;
    getDeferred(name: "posts"): DeferredExport<"posts", RawPost, Post>;
    getDeferred(name: "post_replacements"): DeferredExport<"post_replacements", RawPostReplacement, PostReplacement>;
    getDeferred(name: "post_versions"): DeferredExport<"post_versions", RawPostVersion, PostVersion>;
    getDeferred(name: "tag_aliases"): DeferredExport<"tag_aliases", RawTagAlias, TagAlias>;
    getDeferred(name: "tag_implications"): DeferredExport<"tag_implications", RawTagImplication, TagImplication>;
    getDeferred(name: "tags"): DeferredExport<"tags", RawTag, Tag>;
    getDeferred(name: "wiki_pages"): DeferredExport<"wiki_pages", RawWikiPage, WikiPage>;
    getDeferred(name: ExportName): DeferredExport<"artists", RawArtist, Artist> | DeferredExport<"bulk_update_requests", RawBulkUpdateRequest, BulkUpdateRequest> | DeferredExport<"pools", RawPool, Pool> | DeferredExport<"posts", RawPost, Post> | DeferredExport<"post_replacements", RawPostReplacement, PostReplacement> | DeferredExport<"post_versions", RawPostVersion, PostVersion> | DeferredExport<"tag_aliases", RawTagAlias, TagAlias> | DeferredExport<"tag_implications", RawTagImplication, TagImplication> | DeferredExport<"tags", RawTag, Tag> | DeferredExport<"wiki_pages", RawWikiPage, WikiPage>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDeferred(name: ExportName): DeferredExport<any, any, any> {
        Debug("client", "creating deferred export for %s ", name);
        return new DeferredExport(name, this.options.parsers[name] as never, this as never) as never;
    }
}
