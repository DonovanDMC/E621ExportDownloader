import type { RawPostReplacement } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawPostReplacement, _context: CastingContext): PostReplacementData {
    return {
        approver_id:  record.approver_id === "" ? null : Number(record.approver_id),
        created_at:   new Date(record.created_at),
        creator_id:   Number(record.creator_id),
        file_ext:     record.file_ext,
        file_name:    record.file_name,
        file_size:    Number(record.file_size),
        id:           Number(record.id),
        image_height: Number(record.image_height),
        image_width:  Number(record.image_width),
        md5:          record.md5,
        post_id:      Number(record.post_id),
        reason:       record.reason,
        source:       record.source === "" ? null : record.source,
        status:       record.status,
        updated_at:   new Date(record.updated_at)
    };
}

export interface PostReplacementData {
    approver_id: number | null;
    created_at: Date;
    creator_id: number;
    file_ext: string;
    file_name: string;
    file_size: number;
    id: number;
    image_height: number;
    image_width: number;
    md5: string;
    post_id: number;
    reason: string;
    source: string | null;
    status: string;
    updated_at: Date;
}
