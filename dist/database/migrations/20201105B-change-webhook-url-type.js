"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
// @ts-ignore
const oracledb_1 = __importDefault(require("knex/lib/dialects/oracledb"));
async function oracleAlterUrl(knex, type) {
    await knex.raw('ALTER TABLE "directus_webhooks" ADD "url__temp" ?', [knex.raw(type)]);
    await knex.raw('UPDATE "directus_webhooks" SET "url__temp"="url"');
    await knex.raw('ALTER TABLE "directus_webhooks" DROP COLUMN "url"');
    await knex.raw('ALTER TABLE "directus_webhooks" RENAME COLUMN "url__temp" TO "url"');
    await knex.raw('ALTER TABLE "directus_webhooks" MODIFY "url" NOT NULL');
}
async function up(knex) {
    if (knex.client instanceof oracledb_1.default) {
        await oracleAlterUrl(knex, 'CLOB');
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.text('url').alter();
    });
}
exports.up = up;
async function down(knex) {
    if (knex.client instanceof oracledb_1.default) {
        await oracleAlterUrl(knex, 'VARCHAR2(255)');
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.string('url').notNullable().alter();
    });
}
exports.down = down;
