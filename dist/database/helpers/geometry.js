"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeometryHelper = void 0;
const wellknown_1 = require("wellknown");
const __1 = __importDefault(require(".."));
let geometryHelper;
function getGeometryHelper() {
    if (!geometryHelper) {
        const db = (0, __1.default)();
        const client = db.client.config.client;
        const constructor = {
            mysql: KnexSpatial_MySQL,
            mariadb: KnexSpatial_MySQL,
            sqlite3: KnexSpatial,
            pg: KnexSpatial_PG,
            postgres: KnexSpatial_PG,
            redshift: KnexSpatial_Redshift,
            mssql: KnexSpatial_MSSQL,
            oracledb: KnexSpatial_Oracle,
        }[client];
        if (!constructor) {
            throw new Error(`Geometry helper not implemented on ${client}.`);
        }
        geometryHelper = new constructor(db);
    }
    return geometryHelper;
}
exports.getGeometryHelper = getGeometryHelper;
class KnexSpatial {
    constructor(knex) {
        this.knex = knex;
    }
    isTrue(expression) {
        return expression;
    }
    isFalse(expression) {
        return expression.wrap('NOT ', '');
    }
    createColumn(table, field) {
        var _a, _b;
        const type = (_b = (_a = field.schema) === null || _a === void 0 ? void 0 : _a.geometry_type) !== null && _b !== void 0 ? _b : 'geometry';
        return table.specificType(field.field, type);
    }
    asText(table, column) {
        return this.knex.raw('st_astext(??.??) as ??', [table, column, column]);
    }
    fromText(text) {
        return this.knex.raw('st_geomfromtext(?, 4326)', text);
    }
    fromGeoJSON(geojson) {
        return this.fromText((0, wellknown_1.stringify)(geojson));
    }
    _intersects(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw('st_intersects(??, ?)', [key, geometry]);
    }
    intersects(key, geojson) {
        return this.isTrue(this._intersects(key, geojson));
    }
    nintersects(key, geojson) {
        return this.isFalse(this._intersects(key, geojson));
    }
    _intersects_bbox(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw('st_intersects(??, ?)', [key, geometry]);
    }
    intersects_bbox(key, geojson) {
        return this.isTrue(this._intersects_bbox(key, geojson));
    }
    nintersects_bbox(key, geojson) {
        return this.isFalse(this._intersects_bbox(key, geojson));
    }
    collect(table, column) {
        return this.knex.raw('st_astext(st_collect(??.??))', [table, column]);
    }
}
class KnexSpatial_PG extends KnexSpatial {
    createColumn(table, field) {
        var _a, _b;
        const type = (_b = (_a = field.schema) === null || _a === void 0 ? void 0 : _a.geometry_type) !== null && _b !== void 0 ? _b : 'geometry';
        return table.specificType(field.field, `geometry(${type})`);
    }
    _intersects_bbox(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw('?? && ?', [key, geometry]);
    }
}
class KnexSpatial_MySQL extends KnexSpatial {
    collect(table, column) {
        return this.knex.raw(`concat('geometrycollection(', group_concat(? separator ', '), ')'`, this.asText(table, column));
    }
}
class KnexSpatial_Redshift extends KnexSpatial {
    createColumn(table, field) {
        var _a, _b;
        const type = (_b = (_a = field.schema) === null || _a === void 0 ? void 0 : _a.geometry_type) !== null && _b !== void 0 ? _b : 'geometry';
        if (type !== 'geometry')
            field.meta.special[1] = type;
        return table.specificType(field.field, 'geometry');
    }
}
class KnexSpatial_MSSQL extends KnexSpatial {
    isTrue(expression) {
        return expression.wrap(``, ` = 1`);
    }
    isFalse(expression) {
        return expression.wrap(``, ` = 0`);
    }
    createColumn(table, field) {
        var _a, _b;
        const type = (_b = (_a = field.schema) === null || _a === void 0 ? void 0 : _a.geometry_type) !== null && _b !== void 0 ? _b : 'geometry';
        if (type !== 'geometry')
            field.meta.special[1] = type;
        return table.specificType(field.field, 'geometry');
    }
    asText(table, column) {
        return this.knex.raw('??.??.STAsText() as ??', [table, column, column]);
    }
    fromText(text) {
        return this.knex.raw('geometry::STGeomFromText(?, 4326)', text);
    }
    _intersects(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw('??.STIntersects(?)', [key, geometry]);
    }
    _intersects_bbox(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw('??.STEnvelope().STIntersects(?.STEnvelope())', [key, geometry]);
    }
    collect(table, column) {
        return this.knex.raw('geometry::CollectionAggregate(??.??).STAsText()', [table, column]);
    }
}
class KnexSpatial_Oracle extends KnexSpatial {
    isTrue(expression) {
        return expression.wrap(``, ` = 'TRUE'`);
    }
    isFalse(expression) {
        return expression.wrap(``, ` = 'FALSE'`);
    }
    createColumn(table, field) {
        var _a, _b;
        const type = (_b = (_a = field.schema) === null || _a === void 0 ? void 0 : _a.geometry_type) !== null && _b !== void 0 ? _b : 'geometry';
        if (type !== 'geometry')
            field.meta.special[1] = type;
        return table.specificType(field.field, 'sdo_geometry');
    }
    asText(table, column) {
        return this.knex.raw('sdo_util.from_wktgeometry(??.??) as ??', [table, column, column]);
    }
    fromText(text) {
        return this.knex.raw('sdo_geometry(?, 4326)', text);
    }
    _intersects(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw(`sdo_overlapbdyintersect(??, ?)`, [key, geometry]);
    }
    _intersects_bbox(key, geojson) {
        const geometry = this.fromGeoJSON(geojson);
        return this.knex.raw(`sdo_overlapbdyintersect(sdo_geom.sdo_mbr(??), sdo_geom.sdo_mbr(?))`, [key, geometry]);
    }
    collect(table, column) {
        return this.knex.raw(`concat('geometrycollection(', listagg(?, ', '), ')'`, this.asText(table, column));
    }
}
