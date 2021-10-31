/**
 * Generate an AST based on a given collection and query
 */
import { Knex } from 'knex';
import { Accountability } from '@directus/shared/types';
import { AST, SchemaOverview } from '../types';
import { Query, PermissionsAction } from '@directus/shared/types';
declare type GetASTOptions = {
    accountability?: Accountability | null;
    action?: PermissionsAction;
    knex?: Knex;
};
export default function getASTFromQuery(collection: string, query: Query, schema: SchemaOverview, options?: GetASTOptions): Promise<AST>;
export {};
