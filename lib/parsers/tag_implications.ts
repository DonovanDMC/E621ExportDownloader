import type { RawTagImplication } from "../types.js";
import type { CastingContext } from "csv-parse";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function parse(record: RawTagImplication, _context: CastingContext): TagImplicationData {
    return {
        antecedent_name: record.antecedent_name,
        consequent_name: record.consequent_name,
        created_at:      record.created_at === "" ? null : new Date(record.created_at),
        id:              Number(record.id),
        status:          record.status
    };
}

export interface TagImplicationData {
    antecedent_name: string;
    consequent_name: string;
    created_at: Date | null;
    id: number;
    status: string;
}
