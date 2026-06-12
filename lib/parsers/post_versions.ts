import type { Rating, RawPostVersion } from "../types.js";
import { pgArray } from "../util.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawPostVersion, _context: CastingContext): PostVersionData {
    return {
        added_locked_tags:   pgArray(record.added_locked_tags),
        added_tags:          pgArray(record.added_tags),
        description:         record.description === "" ? null : record.description,
        description_changed: record.description_changed === "t",
        id:                  Number(record.id),
        locked_tags:         record.locked_tags === "" ? null : record.locked_tags,
        parent_changed:      record.parent_changed === "t",
        parent_id:           record.parent_id === "" ? null : Number(record.parent_id),
        rating:              record.rating === "" ? null : record.rating,
        rating_changed:      record.rating_changed === "t",
        reason:              record.reason === "" ? null : record.reason,
        removed_locked_tags: pgArray(record.removed_locked_tags),
        removed_tags:        pgArray(record.removed_tags),
        source:              record.source === "" ? null : record.source,
        source_changed:      record.source_changed === "t",
        tags:                record.tags === "" ? null : record.tags,
        updated_at:          new Date(record.updated_at),
        updater_id:          Number(record.updater_id),
        version:             Number(record.version)
    };
}

export interface PostVersionData {
    added_locked_tags: Array<string>;
    added_tags: Array<string>;
    description: string | null;
    description_changed: boolean;
    id: number;
    locked_tags: string | null;
    parent_changed: boolean;
    parent_id: number | null;
    rating: Rating | null;
    rating_changed: boolean;
    reason: string | null;
    removed_locked_tags: Array<string>;
    removed_tags: Array<string>;
    source: string | null;
    source_changed: boolean;
    tags: string | null;
    updated_at: Date;
    updater_id: number;
    version: number;
}
