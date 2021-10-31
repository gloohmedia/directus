import { Knex } from 'knex';
import { HelperFn } from '../types';
export declare class HelperOracle implements HelperFn {
    private knex;
    constructor(knex: Knex);
    year(table: string, column: string): Knex.Raw;
    month(table: string, column: string): Knex.Raw;
    week(table: string, column: string): Knex.Raw;
    day(table: string, column: string): Knex.Raw;
    weekday(table: string, column: string): Knex.Raw;
    hour(table: string, column: string): Knex.Raw;
    minute(table: string, column: string): Knex.Raw;
    second(table: string, column: string): Knex.Raw;
}
