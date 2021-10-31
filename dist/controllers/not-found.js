"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const emitter_1 = __importDefault(require("../emitter"));
const exceptions_1 = require("../exceptions");
/**
 * Handles not found routes.
 *
 * - If a hook throws an error, the error gets forwarded to the error handler.
 * - If a hook returns true, the handler assumes the response has been
 *   processed and won't generate a response.
 *
 * @param req
 * @param res
 * @param next
 */
const notFound = async (req, res, next) => {
    try {
        const hooksResult = await emitter_1.default.emitAsync('request.not_found', req, res);
        if (hooksResult.reduce((prev, current) => current || prev, false)) {
            return next();
        }
        next(new exceptions_1.RouteNotFoundException(req.path));
    }
    catch (err) {
        next(err);
    }
};
exports.default = notFound;
