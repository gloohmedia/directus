"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HelperMSSQL = void 0;
class HelperMSSQL {
    constructor(knex) {
        this.knex = knex;
    }
    year(table, column) {
        return this.knex.raw('DATEPART(year, ??.??)', [table, column]);
    }
    month(table, column) {
        return this.knex.raw('DATEPART(month, ??.??)', [table, column]);
    }
    week(table, column) {
        return this.knex.raw('DATEPART(week, ??.??)', [table, column]);
    }
    day(table, column) {
        return this.knex.raw('DATEPART(day, ??.??)', [table, column]);
    }
    weekday(table, column) {
        return this.knex.raw('DATEPART(weekday, ??.??)', [table, column]);
    }
    hour(table, column) {
        return this.knex.raw('DATEPART(hour, ??.??)', [table, column]);
    }
    minute(table, column) {
        return this.knex.raw('DATEPART(minute, ??.??)', [table, column]);
    }
    second(table, column) {
        return this.knex.raw('DATEPART(second, ??.??)', [table, column]);
    }
}
exports.HelperMSSQL = HelperMSSQL;
