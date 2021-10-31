"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("knex");
const path_1 = __importDefault(require("path"));
function createDBConnection(client, credentials) {
    let connection = {};
    if (client === 'sqlite3') {
        const { filename } = credentials;
        connection = {
            filename: filename,
        };
    }
    else {
        const { host, port, database, user, password } = credentials;
        connection = {
            host: host,
            port: Number(port),
            database: database,
            user: user,
            password: password,
        };
        if (client === 'pg') {
            const { ssl } = credentials;
            connection['ssl'] = ssl;
        }
        if (client === 'mssql') {
            const { options__encrypt } = credentials;
            connection['options'] = {
                encrypt: options__encrypt,
            };
        }
    }
    const knexConfig = {
        client: client,
        connection: connection,
        seeds: {
            extension: 'js',
            directory: path_1.default.resolve(__dirname, '../../database/seeds/'),
        },
    };
    if (client === 'sqlite3') {
        knexConfig.useNullAsDefault = true;
    }
    const db = (0, knex_1.knex)(knexConfig);
    return db;
}
exports.default = createDBConnection;
