import { Knex } from 'knex';
import { AbstractServiceOptions, Item, PrimaryKey, SchemaOverview } from '../types';
import { Accountability } from '@directus/shared/types';
declare type Action = 'create' | 'read' | 'update';
declare type Transformers = {
    [type: string]: (context: {
        action: Action;
        value: any;
        payload: Partial<Item>;
        accountability: Accountability | null;
        specials: string[];
    }) => Promise<any>;
};
/**
 * Process a given payload for a collection to ensure the special fields (hash, uuid, date etc) are
 * handled correctly.
 */
export declare class PayloadService {
    accountability: Accountability | null;
    knex: Knex;
    collection: string;
    schema: SchemaOverview;
    constructor(collection: string, options: AbstractServiceOptions);
    transformers: Transformers;
    processValues(action: Action, payloads: Partial<Item>[]): Promise<Partial<Item>[]>;
    processValues(action: Action, payload: Partial<Item>): Promise<Partial<Item>>;
    processAggregates(payload: Partial<Item>[]): void;
    processField(field: SchemaOverview['collections'][string]['fields'][string], payload: Partial<Item>, action: Action, accountability: Accountability | null): Promise<any>;
    /**
     * Native geometries are stored in custom binary format. We need to insert them with
     * the function st_geomfromtext. For this to work, that function call must not be
     * escaped. It's therefore placed as a Knex.Raw object in the payload. Thus the need
     * to check if the value is a raw instance before stringifying it in the next step.
     */
    processGeometries<T extends Partial<Record<string, any>>[]>(payloads: T, action: Action): T;
    /**
     * Knex returns `datetime` and `date` columns as Date.. This is wrong for date / datetime, as those
     * shouldn't return with time / timezone info respectively
     */
    processDates(payloads: Partial<Record<string, any>>[], action: Action): Partial<Record<string, any>>[];
    /**
     * Recursively save/update all nested related Any-to-One items
     */
    processA2O(data: Partial<Item>): Promise<{
        payload: Partial<Item>;
        revisions: PrimaryKey[];
    }>;
    /**
     * Save/update all nested related m2o items inside the payload
     */
    processM2O(data: Partial<Item>): Promise<{
        payload: Partial<Item>;
        revisions: PrimaryKey[];
    }>;
    /**
     * Recursively save/update all nested related o2m items
     */
    processO2M(data: Partial<Item>, parent: PrimaryKey): Promise<{
        revisions: PrimaryKey[];
    }>;
    /**
     * Transforms the input partial payload to match the output structure, to have consistency
     * between delta and data
     */
    prepareDelta(data: Partial<Item>): Promise<string>;
}
export {};
