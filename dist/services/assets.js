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
exports.AssetsService = void 0;
const async_mutex_1 = require("async-mutex");
const mime_types_1 = require("mime-types");
const object_hash_1 = __importDefault(require("object-hash"));
const path_1 = __importDefault(require("path"));
const sharp_1 = __importDefault(require("sharp"));
const database_1 = __importDefault(require("../database"));
const env_1 = __importDefault(require("../env"));
const exceptions_1 = require("../exceptions");
const storage_1 = __importDefault(require("../storage"));
const authorization_1 = require("./authorization");
const TransformationUtils = __importStar(require("../utils/transformations"));
sharp_1.default.concurrency(1);
// Note: don't put this in the service. The service can be initialized in multiple places, but they
// should all share the same semaphore instance.
const semaphore = new async_mutex_1.Semaphore(env_1.default.ASSETS_TRANSFORM_MAX_CONCURRENT);
class AssetsService {
    constructor(options) {
        this.knex = options.knex || (0, database_1.default)();
        this.accountability = options.accountability || null;
        this.authorizationService = new authorization_1.AuthorizationService(options);
    }
    async getAsset(id, transformation, range) {
        var _a;
        const publicSettings = await this.knex
            .select('project_logo', 'public_background', 'public_foreground')
            .from('directus_settings')
            .first();
        const systemPublicKeys = Object.values(publicSettings || {});
        if (systemPublicKeys.includes(id) === false && ((_a = this.accountability) === null || _a === void 0 ? void 0 : _a.admin) !== true) {
            await this.authorizationService.checkAccess('read', 'directus_files', id);
        }
        const file = (await this.knex.select('*').from('directus_files').where({ id }).first());
        if (range) {
            if (range.start >= file.filesize || (range.end && range.end >= file.filesize)) {
                throw new exceptions_1.RangeNotSatisfiableException(range);
            }
        }
        const type = file.type;
        const transforms = TransformationUtils.resolvePreset(transformation, file);
        // We can only transform JPEG, PNG, and WebP
        if (type && transforms.length > 0 && ['image/jpeg', 'image/png', 'image/webp', 'image/tiff'].includes(type)) {
            const maybeNewFormat = TransformationUtils.maybeExtractFormat(transforms);
            const assetFilename = path_1.default.basename(file.filename_disk, path_1.default.extname(file.filename_disk)) +
                getAssetSuffix(transforms) +
                (maybeNewFormat ? `.${maybeNewFormat}` : path_1.default.extname(file.filename_disk));
            const { exists } = await storage_1.default.disk(file.storage).exists(assetFilename);
            if (maybeNewFormat) {
                file.type = (0, mime_types_1.contentType)(assetFilename) || null;
            }
            if (exists) {
                return {
                    stream: storage_1.default.disk(file.storage).getStream(assetFilename, range),
                    file,
                    stat: await storage_1.default.disk(file.storage).getStat(assetFilename),
                };
            }
            // Check image size before transforming. Processing an image that's too large for the
            // system memory will kill the API. Sharp technically checks for this too in it's
            // limitInputPixels, but we should have that check applied before starting the read streams
            const { width, height } = file;
            if (!width ||
                !height ||
                width > env_1.default.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION ||
                height > env_1.default.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION) {
                throw new exceptions_1.IllegalAssetTransformation(`Image is too large to be transformed, or image size couldn't be determined.`);
            }
            return await semaphore.runExclusive(async () => {
                const readStream = storage_1.default.disk(file.storage).getStream(file.filename_disk, range);
                const transformer = (0, sharp_1.default)({
                    limitInputPixels: Math.pow(env_1.default.ASSETS_TRANSFORM_IMAGE_MAX_DIMENSION, 2),
                    sequentialRead: true,
                }).rotate();
                transforms.forEach(([method, ...args]) => transformer[method].apply(transformer, args));
                await storage_1.default.disk(file.storage).put(assetFilename, readStream.pipe(transformer), type);
                return {
                    stream: storage_1.default.disk(file.storage).getStream(assetFilename, range),
                    stat: await storage_1.default.disk(file.storage).getStat(assetFilename),
                    file,
                };
            });
        }
        else {
            const readStream = storage_1.default.disk(file.storage).getStream(file.filename_disk, range);
            const stat = await storage_1.default.disk(file.storage).getStat(file.filename_disk);
            return { stream: readStream, file, stat };
        }
    }
}
exports.AssetsService = AssetsService;
const getAssetSuffix = (transforms) => {
    if (Object.keys(transforms).length === 0)
        return '';
    return `__${(0, object_hash_1.default)(transforms)}`;
};
