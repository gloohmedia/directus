"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitAsyncSafe = void 0;
const eventemitter2_1 = require("eventemitter2");
const logger_1 = __importDefault(require("./logger"));
const emitter = new eventemitter2_1.EventEmitter2({
    wildcard: true,
    verboseMemoryLeak: true,
    delimiter: '.',
    // This will ignore the "unspecified event" error
    ignoreErrors: true,
});
/**
 * Emit async events without throwing errors. Just log them out as warnings.
 * @param name
 * @param args
 */
async function emitAsyncSafe(name, ...args) {
    try {
        return await emitter.emitAsync(name, ...args);
    }
    catch (err) {
        logger_1.default.warn(`An error was thrown while executing hook "${name}"`);
        logger_1.default.warn(err);
    }
    return [];
}
exports.emitAsyncSafe = emitAsyncSafe;
exports.default = emitter;
