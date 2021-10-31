import { SchemaOverview } from '@directus/schema/dist/types/overview';
import { Column } from 'knex-schema-inspector/dist/types/column';
import { FieldMeta, Type } from '@directus/shared/types';
declare type LocalTypeEntry = {
    type: Type | 'unknown';
    geometry_type?: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
};
export default function getLocalType(column: SchemaOverview[string]['columns'][string] | Column, field?: {
    special?: FieldMeta['special'];
}): LocalTypeEntry;
export {};
