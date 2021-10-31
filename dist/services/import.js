"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
const StreamArray_1 = __importDefault(require("stream-json/streamers/StreamArray"));
const items_1 = require("./items");
const async_1 = require("async");
const destroy_1 = __importDefault(require("destroy"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const lodash_1 = require("lodash");
class ImportService {
    constructor(options) {
        this.knex = options.knex || (0, database_1.default)();
        this.accountability = options.accountability || null;
        this.schema = options.schema;
    }
    async import(collection, mimetype, stream) {
        var _a;
        if (collection.startsWith('directus_'))
            throw new exceptions_1.ForbiddenException();
        const createPermissions = this.schema.permissions.find((permission) => permission.collection === collection && permission.action === 'create');
        const updatePermissions = this.schema.permissions.find((permission) => permission.collection === collection && permission.action === 'update');
        if (((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) !== true && (!createPermissions || !updatePermissions)) {
            throw new exceptions_1.ForbiddenException();
        }
        switch (mimetype) {
            case 'application/json':
                return await this.importJSON(collection, stream);
            case 'text/csv':
                return await this.importCSV(collection, stream);
            default:
                throw new exceptions_1.InvalidPayloadException(`Can't import files of type "${mimetype}"`);
        }
    }
    importJSON(collection, stream) {
        const extractJSON = StreamArray_1.default.withParser();
        return this.knex.transaction((trx) => {
            const service = new items_1.ItemsService(collection, {
                knex: trx,
                schema: this.schema,
                accountability: this.accountability,
            });
            const saveQueue = (0, async_1.queue)(async (value) => {
                return await service.upsertOne(value);
            });
            return new Promise((resolve, reject) => {
                stream.pipe(extractJSON);
                extractJSON.on('data', ({ value }) => {
                    saveQueue.push(value);
                });
                extractJSON.on('error', (err) => {
                    (0, destroy_1.default)(stream);
                    (0, destroy_1.default)(extractJSON);
                    reject(new exceptions_1.InvalidPayloadException(err.message));
                });
                saveQueue.error((err) => {
                    reject(err);
                });
                extractJSON.on('end', () => {
                    saveQueue.drain(() => {
                        return resolve();
                    });
                });
            });
        });
    }
    importCSV(collection, stream) {
        return this.knex.transaction((trx) => {
            const service = new items_1.ItemsService(collection, {
                knex: trx,
                schema: this.schema,
                accountability: this.accountability,
            });
            const saveQueue = (0, async_1.queue)(async (value) => {
                return await service.upsertOne(value);
            });
            return new Promise((resolve, reject) => {
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (value) => {
                    const obj = (0, lodash_1.transform)(value, (result, value, key) => {
                        if (value.length === 0) {
                            delete result[key];
                        }
                        else {
                            try {
                                const parsedJson = JSON.parse(value);
                                (0, lodash_1.set)(result, key, parsedJson);
                            }
                            catch {
                                (0, lodash_1.set)(result, key, value);
                            }
                        }
                    });
                    saveQueue.push(obj);
                })
                    .on('error', (err) => {
                    (0, destroy_1.default)(stream);
                    reject(new exceptions_1.InvalidPayloadException(err.message));
                })
                    .on('end', () => {
                    saveQueue.drain(() => {
                        return resolve();
                    });
                });
                saveQueue.error((err) => {
                    reject(err);
                });
            });
        });
    }
}
exports.ImportService = ImportService;
