import type { RawWikiPage } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawWikiPage, _context: CastingContext): WikiPageData {
    return {
        body:       record.body.replaceAll("\r\n", "\n"),
        created_at: new Date(record.created_at),
        creator_id: record.creator_id === "" ? null : Number(record.creator_id),
        id:         Number(record.id),
        is_locked:  record.is_locked === "t",
        title:      record.title,
        updated_at: record.updated_at === "" ? null : new Date(record.updated_at),
        updater_id: record.updater_id === "" ? null : Number(record.updater_id)
    };
}

export interface WikiPageData {
    body: string;
    created_at: Date;
    creator_id: number | null;
    id: number;
    is_locked: boolean;
    title: string;
    updated_at: Date | null;
    updater_id: number | null;
}
