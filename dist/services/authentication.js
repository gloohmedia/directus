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
exports.AuthenticationService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const ms_1 = __importDefault(require("ms"));
const nanoid_1 = require("nanoid");
const database_1 = __importDefault(require("../database"));
const emitter_1 = __importStar(require("../emitter"));
const env_1 = __importDefault(require("../env"));
const auth_1 = require("../auth");
const constants_1 = require("../constants");
const exceptions_1 = require("../exceptions");
const rate_limiter_1 = require("../rate-limiter");
const activity_1 = require("./activity");
const tfa_1 = require("./tfa");
const types_1 = require("../types");
const settings_1 = require("./settings");
const lodash_1 = require("lodash");
const perf_hooks_1 = require("perf_hooks");
const stall_1 = require("../utils/stall");
const logger_1 = __importDefault(require("../logger"));
const loginAttemptsLimiter = (0, rate_limiter_1.createRateLimiter)({ duration: 0 });
class AuthenticationService {
    constructor(options) {
        this.knex = options.knex || (0, database_1.default)();
        this.accountability = options.accountability || null;
        this.activityService = new activity_1.ActivityService({ knex: this.knex, schema: options.schema });
        this.schema = options.schema;
    }
    /**
     * Retrieve the tokens for a given user email.
     *
     * Password is optional to allow usage of this function within the SSO flow and extensions. Make sure
     * to handle password existence checks elsewhere
     */
    async login(providerName = constants_1.DEFAULT_AUTH_PROVIDER, payload, otp) {
        var _a, _b;
        const STALL_TIME = 100;
        const timeStart = perf_hooks_1.performance.now();
        const provider = (0, auth_1.getAuthProvider)(providerName);
        const user = await this.knex
            .select('id', 'first_name', 'last_name', 'email', 'password', 'status', 'role', 'tfa_secret', 'provider', 'external_identifier', 'auth_data')
            .from('directus_users')
            .where('id', await provider.getUserID((0, lodash_1.cloneDeep)(payload)))
            .andWhere('provider', providerName)
            .first();
        const updatedPayload = await emitter_1.default.emitAsync('auth.login.before', {
            event: 'auth.login.before',
            action: 'login',
            schema: this.schema,
            payload: payload,
            provider: providerName,
            accountability: this.accountability,
            status: 'pending',
            user: user === null || user === void 0 ? void 0 : user.id,
            database: this.knex,
        });
        if (updatedPayload) {
            payload = updatedPayload.length > 0 ? updatedPayload.reduce((acc, val) => (0, lodash_1.merge)(acc, val), {}) : payload;
        }
        const emitStatus = (status) => {
            (0, emitter_1.emitAsyncSafe)('auth.login', {
                event: 'auth.login',
                action: 'login',
                schema: this.schema,
                payload: payload,
                provider: providerName,
                accountability: this.accountability,
                status,
                user: user === null || user === void 0 ? void 0 : user.id,
                database: this.knex,
            });
        };
        if ((user === null || user === void 0 ? void 0 : user.status) !== 'active') {
            emitStatus('fail');
            if ((user === null || user === void 0 ? void 0 : user.status) === 'suspended') {
                await (0, stall_1.stall)(STALL_TIME, timeStart);
                throw new exceptions_1.UserSuspendedException();
            }
            else {
                await (0, stall_1.stall)(STALL_TIME, timeStart);
                throw new exceptions_1.InvalidCredentialsException();
            }
        }
        const settingsService = new settings_1.SettingsService({
            knex: this.knex,
            schema: this.schema,
        });
        const { auth_login_attempts: allowedAttempts } = await settingsService.readSingleton({
            fields: ['auth_login_attempts'],
        });
        if (allowedAttempts !== null) {
            loginAttemptsLimiter.points = allowedAttempts;
            try {
                await loginAttemptsLimiter.consume(user.id);
            }
            catch {
                await this.knex('directus_users').update({ status: 'suspended' }).where({ id: user.id });
                user.status = 'suspended';
                // This means that new attempts after the user has been re-activated will be accepted
                await loginAttemptsLimiter.set(user.id, 0, 0);
            }
        }
        let sessionData = null;
        try {
            sessionData = await provider.login((0, lodash_1.clone)(user), (0, lodash_1.cloneDeep)(payload));
        }
        catch (e) {
            emitStatus('fail');
            await (0, stall_1.stall)(STALL_TIME, timeStart);
            throw e;
        }
        if (user.tfa_secret && !otp) {
            emitStatus('fail');
            await (0, stall_1.stall)(STALL_TIME, timeStart);
            throw new exceptions_1.InvalidOTPException(`"otp" is required`);
        }
        if (user.tfa_secret && otp) {
            const tfaService = new tfa_1.TFAService({ knex: this.knex, schema: this.schema });
            const otpValid = await tfaService.verifyOTP(user.id, otp);
            if (otpValid === false) {
                emitStatus('fail');
                await (0, stall_1.stall)(STALL_TIME, timeStart);
                throw new exceptions_1.InvalidOTPException(`"otp" is invalid`);
            }
        }
        let tokenPayload = {
            id: user.id,
        };
        const customClaims = await emitter_1.default.emitAsync('auth.jwt.before', tokenPayload, {
            event: 'auth.jwt.before',
            action: 'jwt',
            schema: this.schema,
            payload: tokenPayload,
            provider: providerName,
            accountability: this.accountability,
            status: 'pending',
            user: user === null || user === void 0 ? void 0 : user.id,
            database: this.knex,
        });
        if (customClaims) {
            tokenPayload =
                customClaims.length > 0 ? customClaims.reduce((acc, val) => (0, lodash_1.merge)(acc, val), tokenPayload) : tokenPayload;
        }
        const accessToken = jsonwebtoken_1.default.sign(tokenPayload, env_1.default.SECRET, {
            expiresIn: env_1.default.ACCESS_TOKEN_TTL,
            issuer: 'directus',
        });
        const refreshToken = (0, nanoid_1.nanoid)(64);
        const refreshTokenExpiration = new Date(Date.now() + (0, ms_1.default)(env_1.default.REFRESH_TOKEN_TTL));
        await this.knex('directus_sessions').insert({
            token: refreshToken,
            user: user.id,
            expires: refreshTokenExpiration,
            ip: (_a = this.accountability) === null || _a === void 0 ? void 0 : _a.ip,
            user_agent: (_b = this.accountability) === null || _b === void 0 ? void 0 : _b.userAgent,
            data: sessionData && JSON.stringify(sessionData),
        });
        await this.knex('directus_sessions').delete().where('expires', '<', new Date());
        if (this.accountability) {
            await this.activityService.createOne({
                action: types_1.Action.LOGIN,
                user: user.id,
                ip: this.accountability.ip,
                user_agent: this.accountability.userAgent,
                collection: 'directus_users',
                item: user.id,
            });
        }
        await this.knex('directus_users').update({ last_access: new Date() }).where({ id: user.id });
        emitStatus('success');
        if (allowedAttempts !== null) {
            await loginAttemptsLimiter.set(user.id, 0, 0);
        }
        await (0, stall_1.stall)(STALL_TIME, timeStart);
        return {
            accessToken,
            refreshToken,
            expires: (0, ms_1.default)(env_1.default.ACCESS_TOKEN_TTL),
            id: user.id,
        };
    }
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        const record = await this.knex
            .select('s.expires', 's.data', 'u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.password', 'u.status', 'u.role', 'u.provider', 'u.external_identifier', 'u.auth_data')
            .from('directus_sessions as s')
            .innerJoin('directus_users as u', 's.user', 'u.id')
            .where('s.token', refreshToken)
            .first();
        if (!record || record.expires < new Date()) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        let { data: sessionData } = record;
        const user = (0, lodash_1.omit)(record, 'data');
        if (typeof sessionData === 'string') {
            try {
                sessionData = JSON.parse(sessionData);
            }
            catch {
                logger_1.default.warn(`Session data isn't valid JSON: ${sessionData}`);
            }
        }
        const provider = (0, auth_1.getAuthProvider)(user.provider);
        const newSessionData = await provider.refresh((0, lodash_1.clone)(user), sessionData);
        const accessToken = jsonwebtoken_1.default.sign({ id: user.id }, env_1.default.SECRET, {
            expiresIn: env_1.default.ACCESS_TOKEN_TTL,
            issuer: 'directus',
        });
        const newRefreshToken = (0, nanoid_1.nanoid)(64);
        const refreshTokenExpiration = new Date(Date.now() + (0, ms_1.default)(env_1.default.REFRESH_TOKEN_TTL));
        await this.knex('directus_sessions')
            .update({
            token: newRefreshToken,
            expires: refreshTokenExpiration,
            data: newSessionData && JSON.stringify(newSessionData),
        })
            .where({ token: refreshToken });
        await this.knex('directus_users').update({ last_access: new Date() }).where({ id: user.id });
        return {
            accessToken,
            refreshToken: newRefreshToken,
            expires: (0, ms_1.default)(env_1.default.ACCESS_TOKEN_TTL),
            id: user.id,
        };
    }
    async logout(refreshToken) {
        const record = await this.knex
            .select('u.id', 'u.first_name', 'u.last_name', 'u.email', 'u.password', 'u.status', 'u.role', 'u.provider', 'u.external_identifier', 'u.auth_data', 's.data')
            .from('directus_sessions as s')
            .innerJoin('directus_users as u', 's.user', 'u.id')
            .where('s.token', refreshToken)
            .first();
        if (record) {
            let { data: sessionData } = record;
            const user = (0, lodash_1.omit)(record, 'data');
            if (typeof sessionData === 'string') {
                try {
                    sessionData = JSON.parse(sessionData);
                }
                catch {
                    logger_1.default.warn(`Session data isn't valid JSON: ${sessionData}`);
                }
            }
            const provider = (0, auth_1.getAuthProvider)(user.provider);
            await provider.logout((0, lodash_1.clone)(user), sessionData);
            await this.knex.delete().from('directus_sessions').where('token', refreshToken);
        }
    }
    async verifyPassword(userID, password) {
        const user = await this.knex
            .select('id', 'first_name', 'last_name', 'email', 'password', 'status', 'role', 'provider', 'external_identifier', 'auth_data')
            .from('directus_users')
            .where('id', userID)
            .first();
        if (!user) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        const provider = (0, auth_1.getAuthProvider)(user.provider);
        await provider.verify((0, lodash_1.clone)(user), password);
    }
}
exports.AuthenticationService = AuthenticationService;
