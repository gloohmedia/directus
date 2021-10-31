"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergePermissions = void 0;
const lodash_1 = require("lodash");
function mergePermissions(...permissions) {
    const allPermissions = (0, lodash_1.flatten)(permissions);
    const mergedPermissions = allPermissions
        .reduce((acc, val) => {
        const key = `${val.collection}__${val.action}__${val.role || '$PUBLIC'}`;
        const current = acc.get(key);
        acc.set(key, current ? mergePerm(current, val) : val);
        return acc;
    }, new Map())
        .values();
    const result = Array.from(mergedPermissions).map((perm) => {
        return (0, lodash_1.omit)(perm, ['id', 'system']);
    });
    return result;
}
exports.mergePermissions = mergePermissions;
function mergePerm(currentPerm, newPerm) {
    let permissions = currentPerm.permissions;
    let validation = currentPerm.validation;
    let fields = currentPerm.fields;
    let presets = currentPerm.presets;
    if (newPerm.permissions) {
        if (currentPerm.permissions && Object.keys(currentPerm.permissions)[0] === '_or') {
            permissions = {
                _or: [...currentPerm.permissions._or, newPerm.permissions],
            };
        }
        else if (currentPerm.permissions) {
            permissions = {
                _or: [currentPerm.permissions, newPerm.permissions],
            };
        }
        else {
            permissions = {
                _or: [newPerm.permissions],
            };
        }
    }
    if (newPerm.validation) {
        if (currentPerm.validation && Object.keys(currentPerm.validation)[0] === '_or') {
            validation = {
                _or: [...currentPerm.validation._or, newPerm.validation],
            };
        }
        else if (currentPerm.validation) {
            validation = {
                _or: [currentPerm.validation, newPerm.validation],
            };
        }
        else {
            validation = {
                _or: [newPerm.validation],
            };
        }
    }
    if (newPerm.fields) {
        if (Array.isArray(currentPerm.fields)) {
            fields = [...new Set([...currentPerm.fields, ...newPerm.fields])];
        }
        else {
            fields = newPerm.fields;
        }
        if (fields.includes('*'))
            fields = ['*'];
    }
    if (newPerm.presets) {
        presets = (0, lodash_1.merge)({}, presets, newPerm.presets);
    }
    return {
        ...currentPerm,
        permissions,
        validation,
        fields,
        presets,
    };
}
