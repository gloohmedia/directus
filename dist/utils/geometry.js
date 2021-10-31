"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNativeGeometry = void 0;
const dbGeometricTypes = new Set([
    'point',
    'polygon',
    'linestring',
    'multipoint',
    'multipolygon',
    'multilinestring',
    'geometry',
    'geometrycollection',
    'sdo_geometry',
    'user-defined',
]);
function isNativeGeometry(field) {
    const { type, dbType } = field;
    return type == 'geometry' && dbGeometricTypes.has(dbType.toLowerCase());
}
exports.isNativeGeometry = isNativeGeometry;
