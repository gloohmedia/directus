"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.unregister = exports.register = void 0;
const axios_1 = __importDefault(require("axios"));
const database_1 = __importDefault(require("./database"));
const emitter_1 = __importDefault(require("./emitter"));
const logger_1 = __importDefault(require("./logger"));
const lodash_1 = require("lodash");
const services_1 = require("./services");
const get_schema_1 = require("./utils/get-schema");
let registered = [];
async function register() {
    unregister();
    const webhookService = new services_1.WebhooksService({ knex: (0, database_1.default)(), schema: await (0, get_schema_1.getSchema)() });
    const webhooks = await webhookService.readByQuery({ filter: { status: { _eq: 'active' } } });
    for (const webhook of webhooks) {
        if (webhook.actions.includes('*')) {
            const event = 'items.*';
            const handler = createHandler(webhook);
            emitter_1.default.on(event, handler);
            registered.push({ event, handler });
        }
        else {
            for (const action of webhook.actions) {
                const event = `items.${action}`;
                const handler = createHandler(webhook);
                emitter_1.default.on(event, handler);
                registered.push({ event, handler });
            }
        }
    }
}
exports.register = register;
function unregister() {
    for (const { event, handler } of registered) {
        emitter_1.default.off(event, handler);
    }
    registered = [];
}
exports.unregister = unregister;
function createHandler(webhook) {
    return async (data) => {
        if (webhook.collections.includes('*') === false && webhook.collections.includes(data.collection) === false)
            return;
        const webhookPayload = (0, lodash_1.pick)(data, [
            'event',
            'accountability.user',
            'accountability.role',
            'collection',
            'item',
            'action',
            'payload',
        ]);
        try {
            await (0, axios_1.default)({
                url: webhook.url,
                method: webhook.method,
                data: webhook.data ? webhookPayload : null,
                headers: mergeHeaders(webhook.headers),
            });
        }
        catch (error) {
            logger_1.default.warn(`Webhook "${webhook.name}" (id: ${webhook.id}) failed`);
            logger_1.default.warn(error);
        }
    };
}
function mergeHeaders(headerArray) {
    const headers = {};
    for (const { header, value } of headerArray !== null && headerArray !== void 0 ? headerArray : []) {
        headers[header] = value;
    }
    return headers;
}
