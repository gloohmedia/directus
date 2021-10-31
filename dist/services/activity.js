"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const index_1 = require("./index");
/**
 * @TODO only return activity of the collections you have access to
 */
class ActivityService extends index_1.ItemsService {
    constructor(options) {
        super('directus_activity', options);
    }
}
exports.ActivityService = ActivityService;
