import { Knex } from 'knex';
import { SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
export declare function getSchema(options?: {
    accountability?: Accountability;
    database?: Knex;
}): Promise<SchemaOverview>;
