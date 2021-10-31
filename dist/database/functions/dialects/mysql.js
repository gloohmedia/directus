"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperMySQL = void 0;
class HelperMySQL {
    constructor(knex) {
        this.knex = knex;
    }
    year(table, column) {
        return this.knex.raw('YEAR(??.??)', [table, column]);
    }
    month(table, column) {
        return this.knex.raw('MONTH(??.??)', [table, column]);
    }
    week(table, column) {
        return this.knex.raw('WEEK(??.??)', [table, column]);
    }
    day(table, column) {
        return this.knex.raw('DAYOFMONTH(??.??)', [table, column]);
    }
    weekday(table, column) {
        return this.knex.raw('DAYOFWEEK(??.??)', [table, column]);
    }
    hour(table, column) {
        return this.knex.raw('HOUR(??.??)', [table, column]);
    }
    minute(table, column) {
        return this.knex.raw('MINUTE(??.??)', [table, column]);
    }
    second(table, column) {
        return this.knex.raw('SECOND(??.??)', [table, column]);
    }
}
exports.HelperMySQL = HelperMySQL;
