"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIP = void 0;
const database_1 = __importDefault(require("../database"));
const exceptions_1 = require("../exceptions");
const async_handler_1 = __importDefault(require("../utils/async-handler"));
exports.checkIP = (0, async_handler_1.default)(async (req, res, next) => {
    const database = (0, database_1.default)();
    const role = await database
        .select('ip_access')
        .from('directus_roles')
        .where({ id: req.accountability.role })
        .first();
    const ipAllowlist = ((role === null || role === void 0 ? void 0 : role.ip_access) || '').split(',').filter((ip) => ip);
    if (ipAllowlist.length > 0 && ipAllowlist.includes(req.accountability.ip) === false)
        throw new exceptions_1.InvalidIPException();
    return next();
});
