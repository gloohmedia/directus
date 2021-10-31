"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    await knex.schema.alterTable('directus_files', (table) => {
        table.integer('filesize').nullable().defaultTo(null).alter();
    });
}
exports.up = up;
async function down(knex) {
    await knex.schema.alterTable('directus_files', (table) => {
        table.integer('filesize').notNullable().defaultTo(0).alter();
    });
}
exports.down = down;
