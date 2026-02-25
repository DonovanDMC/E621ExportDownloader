import type { RawTag } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawTag, _context: CastingContext): TagData {
    return {
        category:   Number(record.category),
        id:         Number(record.id),
        name:       record.name,
        post_count: Number(record.post_count)
    };
}

export interface TagData {
    category: number;
    id: number;
    name: string;
    post_count: number;
}
