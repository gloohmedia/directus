"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateDatabaseError = void 0;
const lodash_1 = require("lodash");
const database_1 = require("../../database");
const emitter_1 = __importDefault(require("../../emitter"));
const mssql_1 = require("./dialects/mssql");
const mysql_1 = require("./dialects/mysql");
const oracle_1 = require("./dialects/oracle");
const postgres_1 = require("./dialects/postgres");
const sqlite_1 = require("./dialects/sqlite");
/**
 * Translates an error thrown by any of the databases into a pre-defined Exception. Currently
 * supports:
 * - Invalid Foreign Key
 * - Not Null Violation
 * - Record Not Unique
 * - Value Out of Range
 * - Value Too Long
 */
async function translateDatabaseError(error) {
    const client = (0, database_1.getDatabaseClient)();
    let defaultError;
    switch (client) {
        case 'mysql':
            defaultError = (0, mysql_1.extractError)(error);
            break;
        case 'postgres':
            defaultError = (0, postgres_1.extractError)(error);
            break;
        case 'sqlite':
            defaultError = (0, sqlite_1.extractError)(error);
            break;
        case 'oracle':
            defaultError = (0, oracle_1.extractError)(error);
            break;
        case 'mssql':
            defaultError = await (0, mssql_1.extractError)(error);
            break;
    }
    const hookResult = await emitter_1.default.emitAsync('database.error', defaultError, { client });
    const hookError = Array.isArray(hookResult) ? (0, lodash_1.last)((0, lodash_1.compact)(hookResult)) : hookResult;
    return hookError || defaultError;
}
exports.translateDatabaseError = translateDatabaseError;
