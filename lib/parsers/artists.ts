import type { RawArtist } from "../types.js";
import { pgArray } from "../util.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawArtist, _context: CastingContext): ArtistData {
    return {
        active_urls:    record.active_urls.split("\n"),
        created_at:     new Date(record.created_at),
        creator_id:     Number(record.creator_id),
        group_name:     record.group_name === "" ? null : record.group_name,
        id:             Number(record.id),
        inactive_urls:  record.inactive_urls.split("\n"),
        is_active:      record.is_active === "t",
        is_locked:      record.is_locked === "t",
        linked_user_id: record.linked_user_id === "" ? null : Number(record.linked_user_id),
        name:           record.name,
        other_names:    pgArray(record.other_names),
        updated_at:     new Date(record.updated_at)
    };
}

export interface ArtistData {
    active_urls: Array<string>;
    created_at: Date;
    creator_id: number;
    group_name: string | null;
    id: number;
    inactive_urls: Array<string>;
    is_active: boolean;
    is_locked: boolean;
    linked_user_id: number | null;
    name: string;
    other_names: Array<string>;
    updated_at: Date;
}
