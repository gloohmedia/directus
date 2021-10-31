"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.down = exports.up = void 0;
async function up(knex) {
    await knex.schema.alterTable('directus_users', (table) => {
        table.dropUnique(['email']);
    });
    await knex.schema.alterTable('directus_users', (table) => {
        table.string('provider', 128).notNullable().defaultTo('default');
        table.string('external_identifier').unique();
        table.string('email', 128).nullable().alter();
    });
    await knex.schema.alterTable('directus_users', (table) => {
        table.unique(['email']);
    });
    await knex.schema.alterTable('directus_sessions', (table) => {
        table.json('data');
    });
}
exports.up = up;
async function down(knex) {
    await knex.schema.alterTable('directus_users', (table) => {
        table.dropColumn('provider');
        table.dropColumn('external_identifier');
        table.string('email', 128).notNullable().alter();
    });
    await knex.schema.alterTable('directus_sessions', (table) => {
        table.dropColumn('data');
    });
}
exports.down = down;
