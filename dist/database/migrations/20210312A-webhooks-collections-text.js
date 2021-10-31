"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
// @ts-ignore
const oracledb_1 = __importDefault(require("knex/lib/dialects/oracledb"));
async function oracleAlterCollections(knex, type) {
    await knex.raw('ALTER TABLE "directus_webhooks" ADD "collections__temp" ?', [knex.raw(type)]);
    await knex.raw('UPDATE "directus_webhooks" SET "collections__temp"="collections"');
    await knex.raw('ALTER TABLE "directus_webhooks" DROP COLUMN "collections"');
    await knex.raw('ALTER TABLE "directus_webhooks" RENAME COLUMN "collections__temp" TO "collections"');
    await knex.raw('ALTER TABLE "directus_webhooks" MODIFY "collections" NOT NULL');
}
async function up(knex) {
    if (knex.client instanceof oracledb_1.default) {
        await oracleAlterCollections(knex, 'CLOB');
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.text('collections').alter();
    });
}
exports.up = up;
async function down(knex) {
    if (knex.client instanceof oracledb_1.default) {
        await oracleAlterCollections(knex, 'VARCHAR2(255)');
        return;
    }
    await knex.schema.alterTable('directus_webhooks', (table) => {
        table.string('collections').notNullable().alter();
    });
}
exports.down = down;
