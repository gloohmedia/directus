"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
// @ts-ignore
const oracledb_1 = __importDefault(require("knex/lib/dialects/oracledb"));
async function up(knex) {
    if (knex.client instanceof oracledb_1.default) {
        return;
    }
    await knex.schema.alterTable('directus_files', (table) => {
        table.bigInteger('filesize').nullable().defaultTo(null).alter();
    });
}
exports.up = up;
async function down(knex) {
    if (knex.client instanceof oracledb_1.default) {
        return;
    }
    await knex.schema.alterTable('directus_files', (table) => {
        table.integer('filesize').nullable().defaultTo(null).alter();
    });
}
exports.down = down;
