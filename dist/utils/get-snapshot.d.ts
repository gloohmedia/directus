import { SchemaOverview, Snapshot } from '../types';
import { Knex } from 'knex';
export declare function getSnapshot(options?: {
    database?: Knex;
    schema?: SchemaOverview;
}): Promise<Snapshot>;
