"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.COLUMN_TRANSFORMS = exports.DEFAULT_AUTH_PROVIDER = exports.ALIAS_TYPES = exports.FILTER_VARIABLES = exports.ASSET_TRANSFORM_QUERY_KEYS = exports.SYSTEM_ASSET_ALLOW_LIST = void 0;
exports.SYSTEM_ASSET_ALLOW_LIST = [
    {
        key: 'system-small-cover',
        transforms: [['resize', { width: 64, height: 64, fit: 'cover' }]],
    },
    {
        key: 'system-small-contain',
        transforms: [['resize', { width: 64, fit: 'contain' }]],
    },
    {
        key: 'system-medium-cover',
        transforms: [['resize', { width: 300, height: 300, fit: 'cover' }]],
    },
    {
        key: 'system-medium-contain',
        transforms: [['resize', { width: 300, fit: 'contain' }]],
    },
    {
        key: 'system-large-cover',
        transforms: [['resize', { width: 800, height: 800, fit: 'cover' }]],
    },
    {
        key: 'system-large-contain',
        transforms: [['resize', { width: 800, fit: 'contain' }]],
    },
];
exports.ASSET_TRANSFORM_QUERY_KEYS = [
    'key',
    'transforms',
    'width',
    'height',
    'format',
    'fit',
    'quality',
    'withoutEnlargement',
];
exports.FILTER_VARIABLES = ['$NOW', '$CURRENT_USER', '$CURRENT_ROLE'];
exports.ALIAS_TYPES = ['alias', 'o2m', 'm2m', 'm2a', 'files', 'translations'];
exports.DEFAULT_AUTH_PROVIDER = 'default';
exports.COLUMN_TRANSFORMS = ['year', 'month', 'day', 'weekday', 'hour', 'minute', 'second'];
