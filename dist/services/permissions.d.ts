import { ItemsService, QueryOptions } from '../services/items';
import { AbstractServiceOptions, Item, PrimaryKey } from '../types';
import { Query, PermissionsAction } from '@directus/shared/types';
export declare class PermissionsService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    getAllowedFields(action: PermissionsAction, collection?: string): Record<string, string[]>;
    readByQuery(query: Query, opts?: QueryOptions): Promise<Partial<Item>[]>;
    readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Partial<Item>[]>;
}
