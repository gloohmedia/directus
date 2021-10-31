import { Knex } from 'knex';
import Keyv from 'keyv';
import { Accountability, Query, PermissionsAction } from '@directus/shared/types';
import { AbstractService, AbstractServiceOptions, Item as AnyItem, PrimaryKey, SchemaOverview } from '../types';
export declare type QueryOptions = {
    stripNonRequested?: boolean;
    permissionsAction?: PermissionsAction;
};
export declare type MutationOptions = {
    /**
     * Callback function that's fired whenever a revision is made in the mutation
     */
    onRevisionCreate?: (pk: PrimaryKey) => void;
    /**
     * Flag to disable the auto purging of the cache. Is ignored when CACHE_AUTO_PURGE isn't enabled.
     */
    autoPurgeCache?: false;
    /**
     * Allow disabling the emitting of hooks. Useful if a custom hook is fired (like files.upload)
     */
    emitEvents?: boolean;
};
export declare class ItemsService<Item extends AnyItem = AnyItem> implements AbstractService {
    collection: string;
    knex: Knex;
    accountability: Accountability | null;
    eventScope: string;
    schema: SchemaOverview;
    cache: Keyv<any> | null;
    constructor(collection: string, options: AbstractServiceOptions);
    getKeysByQuery(query: Query): Promise<PrimaryKey[]>;
    /**
     * Create a single new item.
     */
    createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
    /**
     * Create multiple new items at once. Inserts all provided records sequentially wrapped in a transaction.
     */
    createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Get items by query
     */
    readByQuery(query: Query, opts?: QueryOptions): Promise<Item[]>;
    /**
     * Get single item by primary key
     */
    readOne(key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<Item>;
    /**
     * Get multiple items by primary keys
     */
    readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Item[]>;
    /**
     * Update multiple items by query
     */
    updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Update a single item by primary key
     */
    updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
    /**
     * Update many items by primary key
     */
    updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Upsert a single item
     */
    upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
    /**
     * Upsert many items
     */
    upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Delete multiple items by query
     */
    deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Delete a single item by primary key
     */
    deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
    /**
     * Delete multiple items by primary key
     */
    deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
    /**
     * Read/treat collection as singleton
     */
    readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>>;
    /**
     * Upsert/treat collection as singleton
     */
    upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>;
}
