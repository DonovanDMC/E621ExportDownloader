import type { Rating, RawPost } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawPost, _context: CastingContext): PostData {
    return {
        approver_id:      record.approver_id === "" ? null : Number(record.approver_id),
        change_seq:       Number(record.change_seq),
        comment_count:    Number(record.comment_count),
        created_at:       new Date(record.created_at),
        description:      record.description.replaceAll("\r\n", "\n"),
        down_score:       Number(record.down_score),
        duration:         record.duration === "" ? null : Number(record.duration),
        fav_count:        Number(record.fav_count),
        file_ext:         record.file_ext,
        file_size:        Number(record.file_size),
        id:               Number(record.id),
        image_height:     Number(record.image_height),
        image_width:      Number(record.image_width),
        is_deleted:       record.is_deleted === "t",
        is_flagged:       record.is_flagged === "t",
        is_note_locked:   record.is_note_locked === "t",
        is_pending:       record.is_pending === "t",
        is_rating_locked: record.is_rating_locked === "t",
        is_status_locked: record.is_status_locked === "t",
        locked_tags:      record.locked_tags,
        md5:              record.md5 === "" ? null : record.md5,
        parent_id:        record.parent_id === "" ? null : Number(record.parent_id),
        rating:           record.rating,
        score:            Number(record.score),
        sources:          record.source.replaceAll("\r\n", "\n").split("\n"),
        tags:             record.tag_string.split(" "),
        up_score:         Number(record.up_score),
        updated_at:       record.updated_at === "" ? null : new Date(record.updated_at),
        uploader_id:      record.uploader_id === "" ? null : Number(record.uploader_id)
    };
}

export interface PostData {
    approver_id: number | null;
    change_seq: number;
    comment_count: number;
    created_at: Date;
    description: string;
    down_score: number;
    duration: number | null;
    fav_count: number;
    file_ext: string;
    file_size: number;
    id: number;
    image_height: number;
    image_width: number;
    is_deleted: boolean;
    is_flagged: boolean;
    is_note_locked: boolean;
    is_pending: boolean;
    is_rating_locked: boolean;
    is_status_locked: boolean;
    locked_tags: string;
    md5: string | null;
    parent_id: number | null;
    rating: Rating;
    score: number;
    sources: Array<string>;
    tags: Array<string>;
    up_score: number;
    updated_at: Date | null;
    uploader_id: number | null;
}
