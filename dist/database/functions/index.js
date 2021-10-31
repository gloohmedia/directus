"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FunctionsHelper = void 0;
const postgres_1 = require("./dialects/postgres");
const mysql_1 = require("./dialects/mysql");
const mssql_1 = require("./dialects/mssql");
const sqlite_1 = require("./dialects/sqlite");
const oracle_1 = require("./dialects/oracle");
function FunctionsHelper(knex) {
    switch (knex.client.constructor.name) {
        case 'Client_MySQL':
            return new mysql_1.HelperMySQL(knex);
        case 'Client_PG':
            return new postgres_1.HelperPostgres(knex);
        case 'Client_SQLite3':
            return new sqlite_1.HelperSQLite(knex);
        case 'Client_Oracledb':
        case 'Client_Oracle':
            return new oracle_1.HelperOracle(knex);
        case 'Client_MSSQL':
            return new mssql_1.HelperMSSQL(knex);
        default:
            throw Error('Unsupported driver used: ' + knex.client.constructor.name);
    }
}
exports.FunctionsHelper = FunctionsHelper;
