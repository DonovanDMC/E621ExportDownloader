import type { PoolCategory, RawPool } from "../types.js";
import { pgArray } from "../util.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawPool, _context: CastingContext): PoolData {
    return {
        category:    record.category,
        created_at:  new Date(record.created_at),
        creator_id:  Number(record.creator_id),
        description: record.description,
        id:          Number(record.id),
        is_active:   record.is_active === "t",
        name:        record.name,
        post_ids:    pgArray(record.post_ids).map(Number),
        updated_at:  record.updated_at === "" ? null : new Date(record.updated_at)
    };
}

export interface PoolData {
    category: PoolCategory;
    created_at: Date;
    creator_id: number;
    description: string;
    id: number;
    is_active: boolean;
    name: string;
    post_ids: Array<number>;
    updated_at: Date | null;
}
