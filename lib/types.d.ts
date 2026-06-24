import type { EXPORT_NAMES } from "./Constants.ts";
import type { CastingContext } from "csv-parse";

export type TF = "t" | "f";
export type Rating = "s" | "q" | "e";
export type PoolCategory = "series" | "collection";
export type TagRelationshipStatus = "active" | "deleted" | "pending" | "processing" | "queued" | "retired" | `error: ${string}`;
export type ExportName = typeof EXPORT_NAMES[number];
export type Parser<R extends object, D extends object> = (this: void, record: R, context: CastingContext) => D | null | undefined;

export interface RawArtist {
    active_urls: string;
    created_at: string;
    creator_id: string;
    group_name: string;
    id: string;
    inactive_urls: string;
    is_active: TF;
    is_locked: TF;
    linked_user_id: string;
    name: string;
    other_names: string;
    updated_at: string;
}

export interface RawBulkUpdateRequest {
    approver_id: string;
    created_at: string;
    down_votes: number;
    forum_topic_id: string;
    id: string;
    meh_votes: number;
    script: string;
    status: string;
    title: string;
    up_votes: number;
    updated_at: string;
    user_id: string;
}

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
    bg_color: string;
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
    last_commented_at: string;
    last_noted_at: string;
    locked_tags: string;
    md5: string;
    parent_id: string;
    rating: Rating;
    score: string;
    source: string;
    tag_string: string;
    up_score: string;
    updated_at: string;
    uploader_id: string;
}

export interface RawPostReplacement {
    approver_id: string;
    created_at: string;
    creator_id: string;
    file_ext: string;
    file_name: string;
    file_size: string;
    id: string;
    image_height: string;
    image_width: string;
    md5: string;
    post_id: string;
    reason: string;
    source: string;
    status: string;
    updated_at: string;
}

export interface RawPostVersion {
    added_locked_tags: string;
    added_tags: string;
    description: string;
    description_changed: TF;
    id: string;
    locked_tags: string;
    parent_changed: TF;
    parent_id: string;
    post_id: string;
    rating: Rating | "";
    rating_changed: TF;
    reason: string;
    removed_locked_tags: string;
    removed_tags: string;
    source: string;
    source_changed: TF;
    tags: string;
    updated_at: string;
    updater_id: string;
    version: string;
}

export interface RawTagAlias {
    antecedent_name: string;
    approver_id: string;
    consequent_name: string;
    created_at: string;
    // creator_id: string;
    down_votes: string;
    forum_post_id: string;
    forum_topic_id: string;
    id: string;
    meh_votes: string;
    post_count: string;
    reason: string;
    status: string;
    up_votes: string;
    updated_at: string;
}

export interface RawTagImplication {
    antecedent_name: string;
    approver_id: string;
    consequent_name: string;
    created_at: string;
    // creator_id: string;
    descendant_names: string;
    down_votes: string;
    forum_post_id: string;
    forum_topic_id: string;
    id: string;
    meh_votes: string;
    reason: string;
    status: string;
    up_votes: string;
    updated_at: string;
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
    parent: string | null;
    title: string;
    updated_at: string;
    updater_id: string;
}

export interface APIExportData {
    file_name: string;
    file_size: number;
    name: ExportName;
    updated_at: string;
    url: string;
}
