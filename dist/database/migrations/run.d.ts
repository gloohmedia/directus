import { Knex } from 'knex';
export default function run(database: Knex, direction: 'up' | 'down' | 'latest'): Promise<void>;
