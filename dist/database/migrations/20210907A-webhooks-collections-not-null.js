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
        // Oracle is already not nullable due to an oversight in
        // "20210312A-webhooks-collections-text.ts"
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.text('collections').notNullable().alter();
    });
}
exports.up = up;
async function down(knex) {
    if (knex.client instanceof oracledb_1.default) {
        // Oracle is already not nullable due to an oversight in
        // "20210312A-webhooks-collections-text.ts"
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.text('collections').alter();
    });
}
exports.down = down;
