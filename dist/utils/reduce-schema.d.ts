import { SchemaOverview } from '../types';
import { PermissionsAction } from '@directus/shared/types';
/**
 * Reduces the schema based on the included permissions. The resulting object is the schema structure, but with only
 * the allowed collections/fields/relations included based on the permissions.
 * @param schema The full project schema
 * @param actions Array of permissions actions (crud)
 * @returns Reduced schema
 */
export declare function reduceSchema(schema: SchemaOverview, actions?: PermissionsAction[]): SchemaOverview;
