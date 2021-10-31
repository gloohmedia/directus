"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDatabaseExtensions = exports.validateMigrations = exports.isInstalled = exports.getDatabaseClient = exports.validateDatabaseConnection = exports.hasDatabaseConnection = exports.getSchemaInspector = void 0;
const schema_1 = __importDefault(require("@directus/schema"));
const knex_1 = require("knex");
const perf_hooks_1 = require("perf_hooks");
const env_1 = __importDefault(require("../env"));
const logger_1 = __importDefault(require("../logger"));
const get_config_from_env_1 = require("../utils/get-config-from-env");
const validate_env_1 = require("../utils/validate-env");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const util_1 = require("util");
let database = null;
let inspector = null;
function getDatabase() {
    if (database) {
        return database;
    }
    const connectionConfig = (0, get_config_from_env_1.getConfigFromEnv)('DB_', [
        'DB_CLIENT',
        'DB_SEARCH_PATH',
        'DB_CONNECTION_STRING',
        'DB_POOL',
        'DB_EXCLUDE_TABLES',
    ]);
    const poolConfig = (0, get_config_from_env_1.getConfigFromEnv)('DB_POOL');
    const requiredEnvVars = ['DB_CLIENT'];
    if (env_1.default.DB_CLIENT && env_1.default.DB_CLIENT === 'sqlite3') {
        requiredEnvVars.push('DB_FILENAME');
    }
    else if (env_1.default.DB_CLIENT && env_1.default.DB_CLIENT === 'oracledb') {
        if (!env_1.default.DB_CONNECT_STRING) {
            requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
        }
        else {
            requiredEnvVars.push('DB_USER', 'DB_PASSWORD', 'DB_CONNECT_STRING');
        }
    }
    else {
        if (env_1.default.DB_CLIENT === 'pg') {
            if (!env_1.default.DB_CONNECTION_STRING) {
                requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER');
            }
        }
        else {
            requiredEnvVars.push('DB_HOST', 'DB_PORT', 'DB_DATABASE', 'DB_USER', 'DB_PASSWORD');
        }
    }
    (0, validate_env_1.validateEnv)(requiredEnvVars);
    const knexConfig = {
        client: env_1.default.DB_CLIENT,
        searchPath: env_1.default.DB_SEARCH_PATH,
        connection: env_1.default.DB_CONNECTION_STRING || connectionConfig,
        log: {
            warn: (msg) => {
                // Ignore warnings about returning not being supported in some DBs
                if (msg.startsWith('.returning()'))
                    return;
                // Ignore warning about MySQL not supporting TRX for DDL
                if (msg.startsWith('Transaction was implicitly committed, do not mix transactions and DDL with MySQL'))
                    return;
                return logger_1.default.warn(msg);
            },
            error: (msg) => logger_1.default.error(msg),
            deprecate: (msg) => logger_1.default.info(msg),
            debug: (msg) => logger_1.default.debug(msg),
        },
        pool: poolConfig,
    };
    if (env_1.default.DB_CLIENT === 'sqlite3') {
        knexConfig.useNullAsDefault = true;
        poolConfig.afterCreate = async (conn, callback) => {
            logger_1.default.trace('Enabling SQLite Foreign Keys support...');
            const run = (0, util_1.promisify)(conn.run.bind(conn));
            await run('PRAGMA foreign_keys = ON');
            callback(null, conn);
        };
    }
    if (env_1.default.DB_CLIENT === 'mssql') {
        // This brings MS SQL in line with the other DB vendors. We shouldn't do any automatic
        // timezone conversion on the database level, especially not when other database vendors don't
        // act the same
        (0, lodash_1.merge)(knexConfig, { connection: { options: { useUTC: false } } });
    }
    database = (0, knex_1.knex)(knexConfig);
    const times = {};
    database
        .on('query', (queryInfo) => {
        times[queryInfo.__knexUid] = perf_hooks_1.performance.now();
    })
        .on('query-response', (response, queryInfo) => {
        const delta = perf_hooks_1.performance.now() - times[queryInfo.__knexUid];
        logger_1.default.trace(`[${delta.toFixed(3)}ms] ${queryInfo.sql} [${queryInfo.bindings.join(', ')}]`);
        delete times[queryInfo.__knexUid];
    });
    return database;
}
exports.default = getDatabase;
function getSchemaInspector() {
    if (inspector) {
        return inspector;
    }
    const database = getDatabase();
    inspector = (0, schema_1.default)(database);
    return inspector;
}
exports.getSchemaInspector = getSchemaInspector;
async function hasDatabaseConnection(database) {
    database = database !== null && database !== void 0 ? database : getDatabase();
    try {
        if (getDatabaseClient(database) === 'oracle') {
            await database.raw('select 1 from DUAL');
        }
        else {
            await database.raw('SELECT 1');
        }
        return true;
    }
    catch {
        return false;
    }
}
exports.hasDatabaseConnection = hasDatabaseConnection;
async function validateDatabaseConnection(database) {
    database = database !== null && database !== void 0 ? database : getDatabase();
    try {
        if (getDatabaseClient(database) === 'oracle') {
            await database.raw('select 1 from DUAL');
        }
        else {
            await database.raw('SELECT 1');
        }
    }
    catch (error) {
        logger_1.default.error(`Can't connect to the database.`);
        logger_1.default.error(error);
        process.exit(1);
    }
}
exports.validateDatabaseConnection = validateDatabaseConnection;
function getDatabaseClient(database) {
    database = database !== null && database !== void 0 ? database : getDatabase();
    switch (database.client.constructor.name) {
        case 'Client_MySQL':
            return 'mysql';
        case 'Client_PG':
            return 'postgres';
        case 'Client_SQLite3':
            return 'sqlite';
        case 'Client_Oracledb':
        case 'Client_Oracle':
            return 'oracle';
        case 'Client_MSSQL':
            return 'mssql';
    }
    throw new Error(`Couldn't extract database client`);
}
exports.getDatabaseClient = getDatabaseClient;
async function isInstalled() {
    const inspector = getSchemaInspector();
    // The existence of a directus_collections table alone isn't a "proper" check to see if everything
    // is installed correctly of course, but it's safe enough to assume that this collection only
    // exists when Directus is properly installed.
    return await inspector.hasTable('directus_collections');
}
exports.isInstalled = isInstalled;
async function validateMigrations() {
    const database = getDatabase();
    try {
        let migrationFiles = await fs_extra_1.default.readdir(path_1.default.join(__dirname, 'migrations'));
        const customMigrationsPath = path_1.default.resolve(env_1.default.EXTENSIONS_PATH, 'migrations');
        let customMigrationFiles = ((await fs_extra_1.default.pathExists(customMigrationsPath)) && (await fs_extra_1.default.readdir(customMigrationsPath))) || [];
        migrationFiles = migrationFiles.filter((file) => file.startsWith('run') === false && file.endsWith('.d.ts') === false);
        customMigrationFiles = customMigrationFiles.filter((file) => file.endsWith('.js'));
        migrationFiles.push(...customMigrationFiles);
        const requiredVersions = migrationFiles.map((filePath) => filePath.split('-')[0]);
        const completedVersions = (await database.select('version').from('directus_migrations')).map(({ version }) => version);
        return requiredVersions.every((version) => completedVersions.includes(version));
    }
    catch (error) {
        logger_1.default.error(`Database migrations cannot be found`);
        logger_1.default.error(error);
        throw process.exit(1);
    }
}
exports.validateMigrations = validateMigrations;
/**
 * These database extensions should be optional, so we don't throw or return any problem states when they don't
 */
async function validateDatabaseExtensions() {
    const database = getDatabase();
    const databaseClient = getDatabaseClient(database);
    if (databaseClient === 'postgres') {
        let available = false;
        let installed = false;
        const exists = await database.raw(`SELECT name FROM pg_available_extensions WHERE name = 'postgis';`);
        if (exists.rows.length > 0) {
            available = true;
        }
        if (available) {
            try {
                await database.raw(`SELECT PostGIS_version();`);
                installed = true;
            }
            catch {
                installed = false;
            }
        }
        if (available === false) {
            logger_1.default.warn(`PostGIS isn't installed. Geometry type support will be limited.`);
        }
        else if (available === true && installed === false) {
            logger_1.default.warn(`PostGIS is installed, but hasn't been activated on this database. Geometry type support will be limited.`);
        }
    }
}
exports.validateDatabaseExtensions = validateDatabaseExtensions;
