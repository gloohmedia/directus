"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperPostgres = void 0;
class HelperPostgres {
    constructor(knex) {
        this.knex = knex;
    }
    year(table, column) {
        return this.knex.raw('EXTRACT(YEAR FROM ??.??)', [table, column]);
    }
    month(table, column) {
        return this.knex.raw('EXTRACT(MONTH FROM ??.??)', [table, column]);
    }
    week(table, column) {
        return this.knex.raw('EXTRACT(WEEK FROM ??.??)', [table, column]);
    }
    day(table, column) {
        return this.knex.raw('EXTRACT(DAY FROM ??.??)', [table, column]);
    }
    weekday(table, column) {
        return this.knex.raw('EXTRACT(DOW FROM ??.??)', [table, column]);
    }
    hour(table, column) {
        return this.knex.raw('EXTRACT(HOUR FROM ??.??)', [table, column]);
    }
    minute(table, column) {
        return this.knex.raw('EXTRACT(MINUTE FROM ??.??)', [table, column]);
    }
    second(table, column) {
        return this.knex.raw('EXTRACT(SECOND FROM ??.??)', [table, column]);
    }
}
exports.HelperPostgres = HelperPostgres;
