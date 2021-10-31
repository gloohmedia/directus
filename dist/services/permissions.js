"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsService = void 0;
const app_access_permissions_1 = require("../database/system-data/app-access-permissions");
const items_1 = require("../services/items");
const filter_items_1 = require("../utils/filter-items");
class PermissionsService extends items_1.ItemsService {
    constructor(options) {
        super('directus_permissions', options);
    }
    getAllowedFields(action, collection) {
        const results = this.schema.permissions.filter((permission) => {
            let matchesCollection = true;
            if (collection) {
                matchesCollection = permission.collection === collection;
            }
            const matchesAction = permission.action === action;
            return collection ? matchesCollection && matchesAction : matchesAction;
        });
        const fieldsPerCollection = {};
        for (const result of results) {
            const { collection, fields } = result;
            if (!fieldsPerCollection[collection])
                fieldsPerCollection[collection] = [];
            fieldsPerCollection[collection].push(...(fields !== null && fields !== void 0 ? fields : []));
        }
        return fieldsPerCollection;
    }
    async readByQuery(query, opts) {
        const result = await super.readByQuery(query, opts);
        if (Array.isArray(result) && this.accountability && this.accountability.app === true) {
            result.push(...(0, filter_items_1.filterItems)(app_access_permissions_1.appAccessMinimalPermissions.map((permission) => ({
                ...permission,
                role: this.accountability.role,
            })), query.filter));
        }
        return result;
    }
    async readMany(keys, query = {}, opts) {
        const result = await super.readMany(keys, query, opts);
        if (this.accountability && this.accountability.app === true) {
            result.push(...(0, filter_items_1.filterItems)(app_access_permissions_1.appAccessMinimalPermissions.map((permission) => ({
                ...permission,
                role: this.accountability.role,
            })), query.filter));
        }
        return result;
    }
}
exports.PermissionsService = PermissionsService;
