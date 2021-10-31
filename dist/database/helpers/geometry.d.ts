import { Field, RawField } from '@directus/shared/types';
import { Knex } from 'knex';
import { GeoJSONGeometry } from 'wellknown';
export declare function getGeometryHelper(): KnexSpatial;
declare class KnexSpatial {
    protected knex: Knex;
    constructor(knex: Knex);
    isTrue(expression: Knex.Raw): Knex.Raw<any>;
    isFalse(expression: Knex.Raw): Knex.Raw<any>;
    createColumn(table: Knex.CreateTableBuilder, field: RawField | Field): Knex.ColumnBuilder;
    asText(table: string, column: string): Knex.Raw;
    fromText(text: string): Knex.Raw;
    fromGeoJSON(geojson: GeoJSONGeometry): Knex.Raw;
    _intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    intersects(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    nintersects(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    _intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    intersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    nintersects_bbox(key: string, geojson: GeoJSONGeometry): Knex.Raw;
    collect(table: string, column: string): Knex.Raw;
}
export {};
