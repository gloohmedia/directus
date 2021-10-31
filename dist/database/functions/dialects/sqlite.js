"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperSQLite = void 0;
class HelperSQLite {
    constructor(knex) {
        this.knex = knex;
    }
    year(table, column) {
        return this.knex.raw("strftime('%Y', ??.??)", [table, column]);
    }
    month(table, column) {
        return this.knex.raw("strftime('%m', ??.??)", [table, column]);
    }
    week(table, column) {
        return this.knex.raw("strftime('%W', ??.??)", [table, column]);
    }
    day(table, column) {
        return this.knex.raw("strftime('%d', ??.??)", [table, column]);
    }
    weekday(table, column) {
        return this.knex.raw("strftime('%w', ??.??)", [table, column]);
    }
    hour(table, column) {
        return this.knex.raw("strftime('%H', ??.??)", [table, column]);
    }
    minute(table, column) {
        return this.knex.raw("strftime('%M', ??.??)", [table, column]);
    }
    second(table, column) {
        return this.knex.raw("strftime('%S', ??.??)", [table, column]);
    }
}
exports.HelperSQLite = HelperSQLite;
