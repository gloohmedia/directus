"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getExtensionManager = void 0;
const express_1 = __importStar(require("express"));
const path_1 = __importDefault(require("path"));
const node_1 = require("@directus/shared/utils/node");
const constants_1 = require("@directus/shared/constants");
const database_1 = __importDefault(require("./database"));
const emitter_1 = __importDefault(require("./emitter"));
const env_1 = __importDefault(require("./env"));
const exceptions = __importStar(require("./exceptions"));
const logger_1 = __importDefault(require("./logger"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const get_schema_1 = require("./utils/get-schema");
const services = __importStar(require("./services"));
const node_cron_1 = require("node-cron");
const constants_2 = require("@directus/shared/constants");
const rollup_1 = require("rollup");
// @TODO Remove this once a new version of @rollup/plugin-virtual has been released
// @ts-expect-error
const plugin_virtual_1 = __importDefault(require("@rollup/plugin-virtual"));
const plugin_alias_1 = __importDefault(require("@rollup/plugin-alias"));
const url_1 = require("./utils/url");
const get_module_default_1 = __importDefault(require("./utils/get-module-default"));
let extensionManager;
function getExtensionManager() {
    if (extensionManager) {
        return extensionManager;
    }
    extensionManager = new ExtensionManager();
    return extensionManager;
}
exports.getExtensionManager = getExtensionManager;
class ExtensionManager {
    constructor() {
        this.isInitialized = false;
        this.extensions = [];
        this.appExtensions = {};
        this.apiHooks = [];
        this.apiEndpoints = [];
        this.isScheduleHookEnabled = true;
        this.endpointRouter = (0, express_1.Router)();
    }
    async initialize({ schedule } = { schedule: true }) {
        this.isScheduleHookEnabled = schedule;
        if (this.isInitialized)
            return;
        try {
            await (0, node_1.ensureExtensionDirs)(env_1.default.EXTENSIONS_PATH, env_1.default.SERVE_APP ? constants_1.EXTENSION_TYPES : constants_1.API_EXTENSION_TYPES);
            this.extensions = await this.getExtensions();
        }
        catch (err) {
            logger_1.default.warn(`Couldn't load extensions`);
            logger_1.default.warn(err);
        }
        this.registerHooks();
        this.registerEndpoints();
        if (env_1.default.SERVE_APP) {
            this.appExtensions = await this.generateExtensionBundles();
        }
        const loadedExtensions = this.listExtensions();
        if (loadedExtensions.length > 0) {
            logger_1.default.info(`Loaded extensions: ${loadedExtensions.join(', ')}`);
        }
        this.isInitialized = true;
    }
    async reload() {
        if (!this.isInitialized)
            return;
        logger_1.default.info('Reloading extensions');
        this.unregisterHooks();
        this.unregisterEndpoints();
        if (env_1.default.SERVE_APP) {
            this.appExtensions = {};
        }
        this.isInitialized = false;
        await this.initialize();
    }
    listExtensions(type) {
        if (type === undefined) {
            return this.extensions.map((extension) => extension.name);
        }
        else {
            return this.extensions.filter((extension) => extension.type === type).map((extension) => extension.name);
        }
    }
    getAppExtensions(type) {
        return this.appExtensions[type];
    }
    getEndpointRouter() {
        return this.endpointRouter;
    }
    async getExtensions() {
        const packageExtensions = await (0, node_1.getPackageExtensions)('.', env_1.default.SERVE_APP ? constants_1.EXTENSION_PACKAGE_TYPES : constants_1.API_EXTENSION_PACKAGE_TYPES);
        const localExtensions = await (0, node_1.getLocalExtensions)(env_1.default.EXTENSIONS_PATH, env_1.default.SERVE_APP ? constants_1.EXTENSION_TYPES : constants_1.API_EXTENSION_TYPES);
        return [...packageExtensions, ...localExtensions];
    }
    async generateExtensionBundles() {
        const sharedDepsMapping = await this.getSharedDepsMapping(constants_1.APP_SHARED_DEPS);
        const internalImports = Object.entries(sharedDepsMapping).map(([name, path]) => ({
            find: name,
            replacement: path,
        }));
        const bundles = {};
        for (const extensionType of constants_1.APP_EXTENSION_TYPES) {
            const entry = (0, node_1.generateExtensionsEntry)(extensionType, this.extensions);
            const bundle = await (0, rollup_1.rollup)({
                input: 'entry',
                external: Object.values(sharedDepsMapping),
                makeAbsoluteExternalsRelative: false,
                plugins: [(0, plugin_virtual_1.default)({ entry }), (0, plugin_alias_1.default)({ entries: internalImports })],
            });
            const { output } = await bundle.generate({ format: 'es', compact: true });
            bundles[extensionType] = output[0].code;
            await bundle.close();
        }
        return bundles;
    }
    async getSharedDepsMapping(deps) {
        const appDir = await fs_extra_1.default.readdir(path_1.default.join((0, node_1.resolvePackage)('@directus/app'), 'dist'));
        const depsMapping = {};
        for (const dep of deps) {
            const depName = appDir.find((file) => dep.replace(/\//g, '_') === file.substring(0, file.indexOf('.')));
            if (depName) {
                const depUrl = new url_1.Url(env_1.default.PUBLIC_URL).addPath('admin', depName);
                depsMapping[dep] = depUrl.toString({ rootRelative: true });
            }
            else {
                logger_1.default.warn(`Couldn't find shared extension dependency "${dep}"`);
            }
        }
        return depsMapping;
    }
    registerHooks() {
        const hooks = this.extensions.filter((extension) => extension.type === 'hook');
        for (const hook of hooks) {
            try {
                this.registerHook(hook);
            }
            catch (error) {
                logger_1.default.warn(`Couldn't register hook "${hook.name}"`);
                logger_1.default.warn(error);
            }
        }
    }
    registerEndpoints() {
        const endpoints = this.extensions.filter((extension) => extension.type === 'endpoint');
        for (const endpoint of endpoints) {
            try {
                this.registerEndpoint(endpoint, this.endpointRouter);
            }
            catch (error) {
                logger_1.default.warn(`Couldn't register endpoint "${endpoint.name}"`);
                logger_1.default.warn(error);
            }
        }
    }
    registerHook(hook) {
        var _a;
        const hookPath = path_1.default.resolve(hook.path, hook.entrypoint || '');
        const hookInstance = require(hookPath);
        const register = (0, get_module_default_1.default)(hookInstance);
        const events = register({ services, exceptions, env: env_1.default, database: (0, database_1.default)(), logger: logger_1.default, getSchema: get_schema_1.getSchema });
        for (const [event, handler] of Object.entries(events)) {
            if (event.startsWith('cron(')) {
                const cron = (_a = event.match(constants_2.REGEX_BETWEEN_PARENS)) === null || _a === void 0 ? void 0 : _a[1];
                if (!cron || (0, node_cron_1.validate)(cron) === false) {
                    logger_1.default.warn(`Couldn't register cron hook. Provided cron is invalid: ${cron}`);
                }
                else {
                    const task = (0, node_cron_1.schedule)(cron, async () => {
                        if (this.isScheduleHookEnabled) {
                            try {
                                await handler();
                            }
                            catch (error) {
                                logger_1.default.error(error);
                            }
                        }
                    });
                    this.apiHooks.push({
                        type: 'cron',
                        path: hookPath,
                        task,
                    });
                }
            }
            else {
                emitter_1.default.on(event, handler);
                this.apiHooks.push({
                    type: 'event',
                    path: hookPath,
                    event,
                    handler,
                });
            }
        }
    }
    registerEndpoint(endpoint, router) {
        const endpointPath = path_1.default.resolve(endpoint.path, endpoint.entrypoint || '');
        const endpointInstance = require(endpointPath);
        const mod = (0, get_module_default_1.default)(endpointInstance);
        const register = typeof mod === 'function' ? mod : mod.handler;
        const routeName = typeof mod === 'function' ? endpoint.name : mod.id;
        const scopedRouter = express_1.default.Router();
        router.use(`/${routeName}`, scopedRouter);
        register(scopedRouter, { services, exceptions, env: env_1.default, database: (0, database_1.default)(), logger: logger_1.default, getSchema: get_schema_1.getSchema });
        this.apiEndpoints.push({
            path: endpointPath,
        });
    }
    unregisterHooks() {
        for (const hook of this.apiHooks) {
            if (hook.type === 'cron') {
                hook.task.destroy();
            }
            else {
                emitter_1.default.off(hook.event, hook.handler);
            }
            delete require.cache[require.resolve(hook.path)];
        }
        this.apiHooks = [];
    }
    unregisterEndpoints() {
        for (const endpoint of this.apiEndpoints) {
            delete require.cache[require.resolve(endpoint.path)];
        }
        this.endpointRouter.stack = [];
        this.apiEndpoints = [];
    }
}
