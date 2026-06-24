import type { RawTagImplication } from "../types.js";
import { pgArray } from "../util.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawTagImplication, _context: CastingContext): TagImplicationData {
    return {
        antecedent_name:  record.antecedent_name,
        approver_id:      record.approver_id === "" ? null : Number(record.approver_id),
        consequent_name:  record.consequent_name,
        created_at:       record.created_at === "" ? null : new Date(record.created_at),
        // creator_id:      record.creator_id === "" ? null : Number(record.creator_id),
        descendant_names: pgArray(record.descendant_names),
        down_votes:       Number(record.down_votes),
        forum_post_id:    record.forum_post_id === "" ? null : Number(record.forum_post_id),
        forum_topic_id:   record.forum_topic_id === "" ? null : Number(record.forum_topic_id),
        id:               Number(record.id),
        meh_votes:        Number(record.meh_votes),
        reason:           record.reason,
        status:           record.status,
        up_votes:         Number(record.up_votes),
        updated_at:       record.updated_at === "" ? null : new Date(record.updated_at)
    };
}

export interface TagImplicationData {
    antecedent_name: string;
    approver_id: number | null;
    consequent_name: string;
    created_at: Date | null;
    // creator_id: number | null;
    descendant_names: Array<string>;
    down_votes: number;
    forum_post_id: number | null;
    forum_topic_id: number | null;
    id: number;
    meh_votes: number;
    reason: string;
    status: string;
    up_votes: number;
    updated_at: Date | null;
}
