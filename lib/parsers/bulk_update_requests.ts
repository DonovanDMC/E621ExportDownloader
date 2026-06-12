import type { RawBulkUpdateRequest } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawBulkUpdateRequest, _context: CastingContext): BulkUpdateRequestData {
    return {
        approver_id:    record.approver_id === "" ? null : Number(record.approver_id),
        created_at:     new Date(record.created_at),
        forum_topic_id: record.forum_topic_id === "" ? null : Number(record.forum_topic_id),
        id:             Number(record.id),
        script:         record.script,
        status:         record.status,
        title:          record.title === "" ? null : record.title,
        updated_at:     new Date(record.updated_at),
        user_id:        Number(record.user_id)
    };
}

export interface BulkUpdateRequestData {
    approver_id: number | null;
    created_at: Date;
    forum_topic_id: number | null;
    id: number;
    script: string;
    status: string;
    title: string | null;
    updated_at: Date;
    user_id: number;
}
