import type { RawBulkUpdateRequest } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawBulkUpdateRequest, _context: CastingContext): BulkUpdateRequestData {
    return {
        approver_id:    record.approver_id === "" ? null : Number(record.approver_id),
        created_at:     new Date(record.created_at),
        down_votes:     Number(record.down_votes),
        forum_topic_id: record.forum_topic_id === "" ? null : Number(record.forum_topic_id),
        id:             Number(record.id),
        meh_votes:      Number(record.meh_votes),
        script:         record.script,
        status:         record.status,
        title:          record.title === "" ? null : record.title,
        up_votes:       Number(record.up_votes),
        updated_at:     new Date(record.updated_at),
        user_id:        Number(record.user_id)
    };
}

export interface BulkUpdateRequestData {
    approver_id: number | null;
    created_at: Date;
    down_votes: number;
    forum_topic_id: number | null;
    id: number;
    meh_votes: number;
    script: string;
    status: string;
    title: string | null;
    up_votes: number;
    updated_at: Date;
    user_id: number;
}
