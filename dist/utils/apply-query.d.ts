import { Knex } from 'knex';
import { SchemaOverview } from '../types';
import { Aggregate, Filter, Query } from '@directus/shared/types';
/**
 * Apply the Query to a given Knex query builder instance
 */
export default function applyQuery(knex: Knex, collection: string, dbQuery: Knex.QueryBuilder, query: Query, schema: SchemaOverview, subQuery?: boolean): void;
/**
 * Apply a given filter object to the Knex QueryBuilder instance.
 *
 * Relational nested filters, like the following example:
 *
 * ```json
 * // Fetch pages that have articles written by Rijk
 *
 * {
 *   "articles": {
 *     "author": {
 *       "name": {
 *         "_eq": "Rijk"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * are handled by joining the nested tables, and using a where statement on the top level on the
 * nested field through the join. This allows us to filter the top level items based on nested data.
 * The where on the root is done with a subquery to prevent duplicates, any nested joins are done
 * with aliases to prevent naming conflicts.
 *
 * The output SQL for the above would look something like:
 *
 * ```sql
 * SELECT *
 * FROM pages
 * WHERE
 *   pages.id in (
 *     SELECT articles.page_id AS page_id
 *     FROM articles
 *     LEFT JOIN authors AS xviqp ON articles.author = xviqp.id
 *     WHERE xviqp.name = 'Rijk'
 *   )
 * ```
 */
export declare function applyFilter(knex: Knex, schema: SchemaOverview, rootQuery: Knex.QueryBuilder, rootFilter: Filter, collection: string, subQuery?: boolean): void;
export declare function applySearch(schema: SchemaOverview, dbQuery: Knex.QueryBuilder, searchQuery: string, collection: string): Promise<void>;
export declare function applyAggregate(dbQuery: Knex.QueryBuilder, aggregate: Aggregate): void;
