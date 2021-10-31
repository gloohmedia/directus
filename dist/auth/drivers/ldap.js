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
exports.createLDAPAuthRouter = exports.LDAPAuthDriver = void 0;
const express_1 = require("express");
const ldapjs_1 = __importStar(require("ldapjs"));
const ms_1 = __importDefault(require("ms"));
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../auth");
const exceptions_1 = require("../../exceptions");
const services_1 = require("../../services");
const async_handler_1 = __importDefault(require("../../utils/async-handler"));
const env_1 = __importDefault(require("../../env"));
const respond_1 = require("../../middleware/respond");
const logger_1 = __importDefault(require("../../logger"));
// 0x2: ACCOUNTDISABLE
// 0x10: LOCKOUT
// 0x800000: PASSWORD_EXPIRED
const INVALID_ACCOUNT_FLAGS = 0x800012;
class LDAPAuthDriver extends auth_1.AuthDriver {
    constructor(options, config) {
        var _a;
        super(options, config);
        const { bindDn, bindPassword, ...additionalConfig } = config;
        if (!bindDn ||
            !bindPassword ||
            !additionalConfig.userDn ||
            !additionalConfig.provider ||
            (!additionalConfig.clientUrl && !((_a = additionalConfig.client) === null || _a === void 0 ? void 0 : _a.socketPath))) {
            throw new exceptions_1.InvalidConfigException('Invalid provider config', { provider: additionalConfig.provider });
        }
        this.bindClient = new Promise((resolve, reject) => {
            const clientConfig = typeof additionalConfig.client === 'object' ? additionalConfig.client : {};
            const client = ldapjs_1.default.createClient({ url: additionalConfig.clientUrl, reconnect: true, ...clientConfig });
            client.on('error', (err) => {
                logger_1.default.error(err);
            });
            client.bind(bindDn, bindPassword, (err) => {
                if (err) {
                    const error = handleError(err);
                    if (error instanceof exceptions_1.InvalidCredentialsException) {
                        reject(new exceptions_1.InvalidConfigException('Invalid bind user', { provider: additionalConfig.provider }));
                    }
                    else {
                        reject(error);
                    }
                    return;
                }
                resolve(client);
            });
        });
        this.usersService = new services_1.UsersService({ knex: this.knex, schema: this.schema });
        this.config = additionalConfig;
    }
    async fetchUserDn(identifier) {
        const { userDn, userAttribute } = this.config;
        const client = await this.bindClient;
        return new Promise((resolve, reject) => {
            // Search for the user in LDAP by attribute
            client.search(userDn, {
                attributes: ['cn'],
                filter: `(${userAttribute !== null && userAttribute !== void 0 ? userAttribute : 'cn'}=${identifier})`,
                scope: 'one',
            }, (err, res) => {
                if (err) {
                    reject(handleError(err));
                    return;
                }
                res.on('searchEntry', ({ object }) => {
                    const userCn = typeof object.cn === 'object' ? object.cn[0] : object.cn;
                    resolve(`cn=${userCn},${userDn}`.toLowerCase());
                });
                res.on('error', (err) => {
                    reject(handleError(err));
                });
                res.on('end', () => {
                    resolve(undefined);
                });
            });
        });
    }
    async fetchUserInfo(userDn) {
        const client = await this.bindClient;
        return new Promise((resolve, reject) => {
            // Fetch user info in LDAP by domain component
            client.search(userDn, { attributes: ['givenName', 'sn', 'mail', 'userAccountControl'] }, (err, res) => {
                if (err) {
                    reject(handleError(err));
                    return;
                }
                res.on('searchEntry', ({ object }) => {
                    const user = {
                        firstName: typeof object.givenName === 'object' ? object.givenName[0] : object.givenName,
                        lastName: typeof object.sn === 'object' ? object.sn[0] : object.sn,
                        email: typeof object.mail === 'object' ? object.mail[0] : object.mail,
                        userAccountControl: typeof object.userAccountControl === 'object'
                            ? Number(object.userAccountControl[0])
                            : Number(object.userAccountControl),
                    };
                    resolve(user);
                });
                res.on('error', (err) => {
                    reject(handleError(err));
                });
                res.on('end', () => {
                    resolve(undefined);
                });
            });
        });
    }
    async fetchUserGroups(userDn) {
        const { groupDn, groupAttribute } = this.config;
        if (!groupDn) {
            return Promise.resolve([]);
        }
        const client = await this.bindClient;
        return new Promise((resolve, reject) => {
            let userGroups = [];
            // Search for the user info in LDAP by group attribute
            client.search(groupDn, {
                attributes: ['cn'],
                filter: `(${groupAttribute !== null && groupAttribute !== void 0 ? groupAttribute : 'member'}=${userDn})`,
                scope: 'one',
            }, (err, res) => {
                if (err) {
                    reject(handleError(err));
                    return;
                }
                res.on('searchEntry', ({ object }) => {
                    if (typeof object.cn === 'object') {
                        userGroups = [...userGroups, ...object.cn];
                    }
                    else if (object.cn) {
                        userGroups.push(object.cn);
                    }
                });
                res.on('error', (err) => {
                    reject(handleError(err));
                });
                res.on('end', () => {
                    resolve(userGroups);
                });
            });
        });
    }
    async fetchUserId(userDn) {
        const user = await this.knex
            .select('id')
            .from('directus_users')
            .orWhereRaw('LOWER(??) = ?', ['external_identifier', userDn.toLowerCase()])
            .first();
        return user === null || user === void 0 ? void 0 : user.id;
    }
    async getUserID(payload) {
        var _a;
        if (!payload.identifier) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        const userDn = await this.fetchUserDn(payload.identifier);
        if (!userDn) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        const userId = await this.fetchUserId(userDn);
        const userGroups = await this.fetchUserGroups(userDn);
        let userRole;
        if (userGroups.length) {
            userRole = await this.knex
                .select('id')
                .from('directus_roles')
                .whereRaw(`LOWER(??) IN (${userGroups.map(() => '?')})`, [
                'name',
                ...userGroups.map((group) => group.toLowerCase()),
            ])
                .first();
        }
        if (userId) {
            await this.usersService.updateOne(userId, { role: (_a = userRole === null || userRole === void 0 ? void 0 : userRole.id) !== null && _a !== void 0 ? _a : null });
            return userId;
        }
        const userInfo = await this.fetchUserInfo(userDn);
        if (!userInfo) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        await this.usersService.createOne({
            provider: this.config.provider,
            first_name: userInfo.firstName,
            last_name: userInfo.lastName,
            email: userInfo.email,
            external_identifier: userDn,
            role: userRole === null || userRole === void 0 ? void 0 : userRole.id,
        });
        return (await this.fetchUserId(userDn));
    }
    async verify(user, password) {
        if (!user.external_identifier || !password) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        return new Promise((resolve, reject) => {
            const clientConfig = typeof this.config.client === 'object' ? this.config.client : {};
            const client = ldapjs_1.default.createClient({
                url: this.config.clientUrl,
                ...clientConfig,
                reconnect: false,
            });
            client.on('error', (err) => {
                reject(handleError(err));
            });
            client.bind(user.external_identifier, password, (err) => {
                client.destroy();
                if (err) {
                    reject(handleError(err));
                    return;
                }
                resolve();
            });
        });
    }
    async login(user, payload) {
        await this.verify(user, payload.password);
        return null;
    }
    async refresh(user) {
        const userInfo = await this.fetchUserInfo(user.external_identifier);
        if ((userInfo === null || userInfo === void 0 ? void 0 : userInfo.userAccountControl) && userInfo.userAccountControl & INVALID_ACCOUNT_FLAGS) {
            throw new exceptions_1.InvalidCredentialsException();
        }
        return null;
    }
}
exports.LDAPAuthDriver = LDAPAuthDriver;
const handleError = (e) => {
    if (e instanceof ldapjs_1.InappropriateAuthenticationError ||
        e instanceof ldapjs_1.InvalidCredentialsError ||
        e instanceof ldapjs_1.InsufficientAccessRightsError) {
        return new exceptions_1.InvalidCredentialsException();
    }
    return new exceptions_1.ServiceUnavailableException('Service returned unexpected error', {
        service: 'ldap',
        message: e.message,
    });
};
function createLDAPAuthRouter(provider) {
    const router = (0, express_1.Router)();
    const loginSchema = joi_1.default.object({
        identifier: joi_1.default.string().required(),
        password: joi_1.default.string().required(),
        mode: joi_1.default.string().valid('cookie', 'json'),
        otp: joi_1.default.string(),
    }).unknown();
    router.post('/', (0, async_handler_1.default)(async (req, res, next) => {
        var _a, _b;
        const accountability = {
            ip: req.ip,
            userAgent: req.get('user-agent'),
            role: null,
        };
        const authenticationService = new services_1.AuthenticationService({
            accountability: accountability,
            schema: req.schema,
        });
        const { error } = loginSchema.validate(req.body);
        if (error) {
            throw new exceptions_1.InvalidPayloadException(error.message);
        }
        const mode = req.body.mode || 'json';
        const { accessToken, refreshToken, expires } = await authenticationService.login(provider, req.body, (_a = req.body) === null || _a === void 0 ? void 0 : _a.otp);
        const payload = {
            data: { access_token: accessToken, expires },
        };
        if (mode === 'json') {
            payload.data.refresh_token = refreshToken;
        }
        if (mode === 'cookie') {
            res.cookie(env_1.default.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                httpOnly: true,
                domain: env_1.default.REFRESH_TOKEN_COOKIE_DOMAIN,
                maxAge: (0, ms_1.default)(env_1.default.REFRESH_TOKEN_TTL),
                secure: (_b = env_1.default.REFRESH_TOKEN_COOKIE_SECURE) !== null && _b !== void 0 ? _b : false,
                sameSite: env_1.default.REFRESH_TOKEN_COOKIE_SAME_SITE || 'strict',
            });
        }
        res.locals.payload = payload;
        return next();
    }), respond_1.respond);
    return router;
}
exports.createLDAPAuthRouter = createLDAPAuthRouter;
