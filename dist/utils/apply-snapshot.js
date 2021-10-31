"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySnapshot = void 0;
const get_snapshot_1 = require("./get-snapshot");
const get_snapshot_diff_1 = require("./get-snapshot-diff");
const database_1 = __importDefault(require("../database"));
const get_schema_1 = require("./get-schema");
const services_1 = require("../services");
const lodash_1 = require("lodash");
async function applySnapshot(snapshot, options) {
    var _a, _b, _c, _d;
    const database = (_a = options === null || options === void 0 ? void 0 : options.database) !== null && _a !== void 0 ? _a : (0, database_1.default)();
    const schema = (_b = options === null || options === void 0 ? void 0 : options.schema) !== null && _b !== void 0 ? _b : (await (0, get_schema_1.getSchema)({ database }));
    const current = (_c = options === null || options === void 0 ? void 0 : options.current) !== null && _c !== void 0 ? _c : (await (0, get_snapshot_1.getSnapshot)({ database, schema }));
    const snapshotDiff = (_d = options === null || options === void 0 ? void 0 : options.diff) !== null && _d !== void 0 ? _d : (0, get_snapshot_diff_1.getSnapshotDiff)(current, snapshot);
    await database.transaction(async (trx) => {
        const collectionsService = new services_1.CollectionsService({ knex: trx, schema });
        for (const { collection, diff } of snapshotDiff.collections) {
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'D') {
                await collectionsService.deleteOne(collection);
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'N' && diff[0].rhs) {
                // We'll nest the to-be-created fields in the same collection creation, to prevent
                // creating a collection without a primary key
                const fields = snapshotDiff.fields
                    .filter((fieldDiff) => fieldDiff.collection === collection)
                    .map((fieldDiff) => fieldDiff.diff[0].rhs);
                await collectionsService.createOne({
                    ...diff[0].rhs,
                    fields,
                });
                // Now that the fields are in for this collection, we can strip them from the field
                // edits
                snapshotDiff.fields = snapshotDiff.fields.filter((fieldDiff) => fieldDiff.collection !== collection);
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'E') {
                const updates = diff.reduce((acc, edit) => {
                    if (edit.kind !== 'E')
                        return acc;
                    (0, lodash_1.set)(acc, edit.path, edit.rhs);
                    return acc;
                }, {});
                await collectionsService.updateOne(collection, updates);
            }
        }
        const fieldsService = new services_1.FieldsService({ knex: trx, schema: await (0, get_schema_1.getSchema)({ database: trx }) });
        for (const { collection, field, diff } of snapshotDiff.fields) {
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'N') {
                await fieldsService.createField(collection, diff[0].rhs);
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'E') {
                const updates = diff.reduce((acc, edit) => {
                    if (edit.kind !== 'E')
                        return acc;
                    (0, lodash_1.set)(acc, edit.path, edit.rhs);
                    return acc;
                }, {});
                await fieldsService.updateField(collection, {
                    field,
                    type: 'unknown',
                    ...updates,
                });
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'D') {
                await fieldsService.deleteField(collection, field);
                // Field deletion also cleans up the relationship. We should ignore any relationship
                // changes attached to this now non-existing field
                snapshotDiff.relations = snapshotDiff.relations.filter((relation) => (relation.collection === collection && relation.field === field) === false);
            }
        }
        const relationsService = new services_1.RelationsService({ knex: trx, schema: await (0, get_schema_1.getSchema)({ database: trx }) });
        for (const { collection, field, diff } of snapshotDiff.relations) {
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'N') {
                await relationsService.createOne(diff[0].rhs);
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'E') {
                const updates = diff.reduce((acc, edit) => {
                    if (edit.kind !== 'E')
                        return acc;
                    (0, lodash_1.set)(acc, edit.path, edit.rhs);
                    return acc;
                }, {});
                await relationsService.updateOne(collection, field, updates);
            }
            if ((diff === null || diff === void 0 ? void 0 : diff[0].kind) === 'D') {
                await relationsService.deleteOne(collection, field);
            }
        }
    });
}
exports.applySnapshot = applySnapshot;
