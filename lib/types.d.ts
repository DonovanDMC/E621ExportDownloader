import type { EXPORT_NAMES } from "./Constants.ts";
import type { CastingContext } from "csv-parse";

export type TF = "t" | "f";
export type Rating = "s" | "q" | "e";
export type PoolCategory = "series" | "collection";
export type TagRelationshipStatus = "active" | "deleted" | "pending" | "processing" | "queued" | "retired" | `error: ${string}`;
export type ExportName = typeof EXPORT_NAMES[number];
export type Parser<R extends object, D extends object> = (this: void, record: R, context: CastingContext) => D | null | undefined;

export interface RawPool {
    category: "series" | "collection";
    created_at: string;
    creator_id: string;
    description: string;
    id: string;
    is_active: TF;
    name: string;
    post_ids: string;
    updated_at: string;
}

export interface RawPost {
    approver_id: string;
    change_seq: string;
    comment_count: string;
    created_at: string;
    description: string;
    down_score: string;
    duration: string;
    fav_count: string;
    file_ext: string;
    file_size: string;
    id: string;
    image_height: string;
    image_width: string;
    is_deleted: TF;
    is_flagged: TF;
    is_note_locked: TF;
    is_pending: TF;
    is_rating_locked: TF;
    is_status_locked: TF;
    locked_tags: string;
    md5: string | null;
    parent_id: string;
    rating: Rating;
    score: string;
    source: string;
    tag_string: string;
    up_score: string;
    updated_at: string;
    uploader_id: string;
}

export interface RawTagAlias {
    antecedent_name: string;
    consequent_name: string;
    created_at: string;
    id: string;
    status: string;
}

export interface RawTagImplication {
    antecedent_name: string;
    consequent_name: string;
    created_at: string;
    id: string;
    status: string;
}

export interface RawTag {
    category: string;
    id: string;
    name: string;
    post_count: string;
}

export interface RawWikiPage {
    body: string;
    created_at: string;
    creator_id: string;
    id: string;
    is_locked: TF;
    title: string;
    updated_at: string;
    updater_id: string;
}
