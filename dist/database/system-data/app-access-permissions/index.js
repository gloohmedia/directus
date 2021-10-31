"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appAccessMinimalPermissions = void 0;
const lodash_1 = require("lodash");
const require_yaml_1 = require("../../../utils/require-yaml");
const defaults = {
    role: null,
    permissions: {},
    validation: null,
    presets: null,
    fields: ['*'],
    system: true,
};
const permissions = (0, require_yaml_1.requireYAML)(require.resolve('./app-access-permissions.yaml'));
exports.appAccessMinimalPermissions = permissions.map((row) => (0, lodash_1.merge)({}, defaults, row));
