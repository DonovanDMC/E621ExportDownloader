import type Export from "./Export.js";
import ExportHelper from "./ExportHelper.js";
import {
    parsePool,
    type PoolData,
    parsePost,
    type PostData,
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
    RawPool,
    RawPost,
    RawTag,
    RawTagAlias,
    RawTagImplication,
    RawWikiPage,
    Parser,
    ExportName
} from "./types.js";
import Debug from "./Debug.js";

export interface Options<Pool extends object = PoolData, Post extends object = PostData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
    /**
     * If downloaded exports should be cached for future use. They will be cached in the temporary directory, and deleted if a newer export is downloaded.
     *
     * Note that the cached files are kept uncompressed, and as of 02/24/2026, these total about 5.3GiB
     *
     * * pools: ~14MiB
     * * posts: ~5.2GiB
     * * tag aliases: ~5MiB
     * * tag implications: ~4.1MiB
     * * tags: ~39MiB
     * * wiki pages: ~45MiB
     * @defaultValue true
     */
    cache?: boolean;
    /** Custom parsers. */
    parsers?: {
        pools?: Parser<RawPool, Pool>;
        posts?: Parser<RawPost, Post>;
        tag_aliases?: Parser<RawTagAlias, TagAlias>;
        tag_implications?: Parser<RawTagImplication, TagImplication>;
        tags?: Parser<RawTag, Tag>;
        wiki_pages?: Parser<RawWikiPage, WikiPage>;
    };
    /**
     * If the date should be decreased by one day if no export is found. Provide a number to limit how many days can be rewound. `true` is equivalent to `2`.
     * @defaultValue false
     */
    rewindOnNotFound?: boolean | number;
}

interface ClientOptions<Pool extends object = PoolData, Post extends object = PostData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
    cache: boolean;
    parsers: {
        pools: Parser<RawPool, Pool>;
        posts: Parser<RawPost, Post>;
        tag_aliases: Parser<RawTagAlias, TagAlias>;
        tag_implications: Parser<RawTagImplication, TagImplication>;
        tags: Parser<RawTag, Tag>;
        wiki_pages: Parser<RawWikiPage, WikiPage>;
    };
    rewindOnNotFound: number | false;
}

export default class E621ExportDownloader<Pool extends object = PoolData, Post extends object = PostData, Tag extends object = TagData, TagAlias extends object = TagAliasData, TagImplication extends object = TagImplicationData, WikiPage extends object = WikiPageData> {
    options: ClientOptions<Pool, Post, Tag, TagAlias, TagImplication, WikiPage>;
    constructor(options?: Options<Pool, Post, Tag, TagAlias, TagImplication, WikiPage>) {
        this.options = {
            cache:   options?.cache ?? false,
            parsers: {
                pools:            options?.parsers?.pools ?? parsePool as Parser<RawPool, Pool>,
                posts:            options?.parsers?.posts ?? parsePost as Parser<RawPost, Post>,
                tag_aliases:      options?.parsers?.tag_aliases ?? parseTagAlias as Parser<RawTagAlias, TagAlias>,
                tag_implications: options?.parsers?.tag_implications ?? parseTagImplication as Parser<RawTagImplication, TagImplication>,
                tags:             options?.parsers?.tags ?? parseTag as Parser<RawTag, Tag>,
                wiki_pages:       options?.parsers?.wiki_pages ?? parseWikiPage as Parser<RawWikiPage, WikiPage>
            },
            rewindOnNotFound: options?.rewindOnNotFound === true ? 2 : options?.rewindOnNotFound ?? false
        };
        const overridenParsers = Object.keys(options?.parsers ?? {}) as Array<ExportName>;
        Debug("client", "initialized client with overridden parsers: %o, cache=%s, rewindOnNotFound=%s", overridenParsers, this.options.cache, this.options.rewindOnNotFound);
    }

    get(name: "pools"): ExportHelper<"pools", RawPool, Pool>;
    get(name: "pools", date: Date): Export<"pools", RawPool, Pool>;
    get(name: "posts"): ExportHelper<"posts", RawPost, Post>;
    get(name: "posts", date: Date): Export<"posts", RawPost, Post>;
    get(name: "tag_aliases"): ExportHelper<"tag_aliases", RawTagAlias, TagAlias>;
    get(name: "tag_aliases", date: Date): Export<"tag_aliases", RawTagAlias, TagAlias>;
    get(name: "tag_implications"): ExportHelper<"tag_implications", RawTagImplication, TagImplication>;
    get(name: "tag_implications", date: Date): Export<"tag_implications", RawTagImplication, TagImplication>;
    get(name: "tags"): ExportHelper<"tags", RawTag, Tag>;
    get(name: "tags", date: Date): Export<"tags", RawTag, Tag>;
    get(name: "wiki_pages"): ExportHelper<"wiki_pages", RawWikiPage, WikiPage>;
    get(name: "wiki_pages", date: Date): Export<"wiki_pages", RawWikiPage, WikiPage>;
    get(name: ExportName): ExportHelper<"pools", RawPool, Pool> | ExportHelper<"posts", RawPost, Post> | ExportHelper<"tag_aliases", RawTagAlias, TagAlias> | ExportHelper<"tag_implications", RawTagImplication, TagImplication> | ExportHelper<"tags", RawTag, Tag> | ExportHelper<"wiki_pages", RawWikiPage, WikiPage>;
    get(name: ExportName, date: Date): Export<"pools", RawPool, Pool> | Export<"posts", RawPost, Post> | Export<"tag_aliases", RawTagAlias, TagAlias> | Export<"tag_implications", RawTagImplication, TagImplication> | Export<"tags", RawTag, Tag> | Export<"wiki_pages", RawWikiPage, WikiPage>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get(name: ExportName, date?: Date): ExportHelper<any, any, any> | Export<any, any, any> {
        Debug("client", "creating export helper for %s (date: %s)", name, date?.toISOString() ?? "none");
        const helper = new ExportHelper(name, this.options.parsers[name] as never, this as never);
        if (date === undefined) return helper;
        return helper.get(date) as never;
    }
}
