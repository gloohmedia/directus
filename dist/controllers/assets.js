"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const lodash_1 = require("lodash");
const ms_1 = __importDefault(require("ms"));
const uuid_validate_1 = __importDefault(require("uuid-validate"));
const constants_1 = require("../constants");
const database_1 = __importDefault(require("../database"));
const env_1 = __importDefault(require("../env"));
const exceptions_1 = require("../exceptions");
const use_collection_1 = __importDefault(require("../middleware/use-collection"));
const services_1 = require("../services");
const storage_1 = __importDefault(require("../storage"));
const assets_1 = require("../types/assets");
const async_handler_1 = __importDefault(require("../utils/async-handler"));
const router = (0, express_1.Router)();
router.use((0, use_collection_1.default)('directus_files'));
router.get('/:pk', 
// Check if file exists and if you have permission to read it
(0, async_handler_1.default)(async (req, res, next) => {
    var _a;
    /**
     * We ignore everything in the id after the first 36 characters (uuid length). This allows the
     * user to add an optional extension, or other identifier for use in external software (#4067)
     */
    const id = (_a = req.params.pk) === null || _a === void 0 ? void 0 : _a.substring(0, 36);
    /**
     * This is a little annoying. Postgres will error out if you're trying to search in `where`
     * with a wrong type. In case of directus_files where id is a uuid, we'll have to verify the
     * validity of the uuid ahead of time.
     */
    const isValidUUID = (0, uuid_validate_1.default)(id, 4);
    if (isValidUUID === false)
        throw new exceptions_1.ForbiddenException();
    const database = (0, database_1.default)();
    const file = await database.select('id', 'storage', 'filename_disk').from('directus_files').where({ id }).first();
    if (!file)
        throw new exceptions_1.ForbiddenException();
    const { exists } = await storage_1.default.disk(file.storage).exists(file.filename_disk);
    if (!exists)
        throw new exceptions_1.ForbiddenException();
    return next();
}), 
// Validate query params
(0, async_handler_1.default)(async (req, res, next) => {
    const payloadService = new services_1.PayloadService('directus_settings', { schema: req.schema });
    const defaults = { storage_asset_presets: [], storage_asset_transform: 'all' };
    const database = (0, database_1.default)();
    const savedAssetSettings = await database
        .select('storage_asset_presets', 'storage_asset_transform')
        .from('directus_settings')
        .first();
    if (savedAssetSettings) {
        await payloadService.processValues('read', savedAssetSettings);
    }
    const assetSettings = savedAssetSettings || defaults;
    const transformation = (0, lodash_1.pick)(req.query, constants_1.ASSET_TRANSFORM_QUERY_KEYS);
    if ('key' in transformation && Object.keys(transformation).length > 1) {
        throw new exceptions_1.InvalidQueryException(`You can't combine the "key" query parameter with any other transformation.`);
    }
    if ('transforms' in transformation) {
        let transforms;
        // Try parse the JSON array
        try {
            transforms = JSON.parse(transformation['transforms']);
        }
        catch {
            throw new exceptions_1.InvalidQueryException(`"transforms" Parameter needs to be a JSON array of allowed transformations.`);
        }
        // Check if it is actually an array.
        if (!Array.isArray(transforms)) {
            throw new exceptions_1.InvalidQueryException(`"transforms" Parameter needs to be a JSON array of allowed transformations.`);
        }
        // Check against ASSETS_TRANSFORM_MAX_OPERATIONS
        if (transforms.length > Number(env_1.default.ASSETS_TRANSFORM_MAX_OPERATIONS)) {
            throw new exceptions_1.InvalidQueryException(`"transforms" Parameter is only allowed ${env_1.default.ASSETS_TRANSFORM_MAX_OPERATIONS} transformations.`);
        }
        // Check the transformations are valid
        transforms.forEach((transform) => {
            const name = transform[0];
            if (!assets_1.TransformationMethods.includes(name)) {
                throw new exceptions_1.InvalidQueryException(`"transforms" Parameter does not allow "${name}" as a transformation.`);
            }
        });
        transformation.transforms = transforms;
    }
    const systemKeys = constants_1.SYSTEM_ASSET_ALLOW_LIST.map((transformation) => transformation.key);
    const allKeys = [
        ...systemKeys,
        ...(assetSettings.storage_asset_presets || []).map((transformation) => transformation.key),
    ];
    // For use in the next request handler
    res.locals.shortcuts = [...constants_1.SYSTEM_ASSET_ALLOW_LIST, ...(assetSettings.storage_asset_presets || [])];
    res.locals.transformation = transformation;
    if (Object.keys(transformation).length === 0 ||
        ('transforms' in transformation && transformation.transforms.length === 0)) {
        return next();
    }
    if (assetSettings.storage_asset_transform === 'all') {
        if (transformation.key && allKeys.includes(transformation.key) === false) {
            throw new exceptions_1.InvalidQueryException(`Key "${transformation.key}" isn't configured.`);
        }
        return next();
    }
    else if (assetSettings.storage_asset_transform === 'presets') {
        if (allKeys.includes(transformation.key))
            return next();
        throw new exceptions_1.InvalidQueryException(`Only configured presets can be used in asset generation.`);
    }
    else {
        if (transformation.key && systemKeys.includes(transformation.key))
            return next();
        throw new exceptions_1.InvalidQueryException(`Dynamic asset generation has been disabled for this project.`);
    }
}), 
// Return file
(0, async_handler_1.default)(async (req, res) => {
    var _a, _b;
    const id = (_a = req.params.pk) === null || _a === void 0 ? void 0 : _a.substring(0, 36);
    const service = new services_1.AssetsService({
        accountability: req.accountability,
        schema: req.schema,
    });
    const transformation = res.locals.transformation.key
        ? res.locals.shortcuts.find((transformation) => transformation.key === res.locals.transformation.key)
        : res.locals.transformation;
    let range = undefined;
    if (req.headers.range) {
        // substring 6 = "bytes="
        const rangeParts = req.headers.range.substring(6).split('-');
        range = {
            start: rangeParts[0] ? Number(rangeParts[0]) : 0,
            end: rangeParts[1] ? Number(rangeParts[1]) : undefined,
        };
        if (Number.isNaN(range.start) || Number.isNaN(range.end)) {
            throw new exceptions_1.RangeNotSatisfiableException(range);
        }
    }
    const { stream, file, stat } = await service.getAsset(id, transformation, range);
    const access = ((_b = req.accountability) === null || _b === void 0 ? void 0 : _b.role) ? 'private' : 'public';
    res.attachment(file.filename_download);
    res.setHeader('Content-Type', file.type);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', `${access}, max-age=${(0, ms_1.default)(env_1.default.ASSETS_CACHE_TTL) / 1000}`);
    if (range) {
        res.setHeader('Content-Range', `bytes ${range.start}-${range.end || stat.size - 1}/${stat.size}`);
        res.status(206);
        res.setHeader('Content-Length', (range.end ? range.end + 1 : stat.size) - range.start);
    }
    else {
        res.setHeader('Content-Length', stat.size);
    }
    if ('download' in req.query === false) {
        res.removeHeader('Content-Disposition');
    }
    if (req.method.toLowerCase() === 'head') {
        res.status(200);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Content-Length', stat.size);
        return res.end();
    }
    stream.pipe(res);
}));
exports.default = router;
