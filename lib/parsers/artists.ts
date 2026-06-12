import type { RawArtist } from "../types.js";
import { pgArray } from "../util.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawArtist, _context: CastingContext): ArtistData {
    return {
        created_at:     new Date(record.created_at),
        creator_id:     Number(record.creator_id),
        group_name:     record.group_name === "" ? null : record.group_name,
        id:             Number(record.id),
        is_active:      record.is_active === "t",
        is_locked:      record.is_locked === "t",
        linked_user_id: record.linked_user_id === "" ? null : Number(record.linked_user_id),
        name:           record.name,
        other_names:    pgArray(record.other_names),
        updated_at:     new Date(record.updated_at),
        urls:           record.urls.split("\n")
    };
}

export interface ArtistData {
    created_at: Date;
    creator_id: number;
    group_name: string | null;
    id: number;
    is_active: boolean;
    is_locked: boolean;
    linked_user_id: number | null;
    name: string;
    other_names: Array<string>;
    updated_at: Date;
    urls: Array<string>;
}
