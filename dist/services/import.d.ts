/// <reference types="node" />
import { Knex } from 'knex';
import { AbstractServiceOptions, SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
export declare class ImportService {
    knex: Knex;
    accountability: Accountability | null;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    import(collection: string, mimetype: string, stream: NodeJS.ReadableStream): Promise<void>;
    importJSON(collection: string, stream: NodeJS.ReadableStream): Promise<void>;
    importCSV(collection: string, stream: NodeJS.ReadableStream): Promise<void>;
}
