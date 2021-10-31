"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthDriver = void 0;
class AuthDriver {
    constructor(options, _config) {
        this.knex = options.knex;
        this.schema = options.schema;
    }
    /**
     * Check with the (external) provider if the user is allowed entry to Directus
     *
     * @param _user User information
     * @param _payload Any data that the user might've provided
     * @throws InvalidCredentialsException
     * @returns Data to be stored with the session
     */
    async login(_user, _payload) {
        /* Optional, though should probably be set */
        return null;
    }
    /**
     * Handle user session refresh
     *
     * @param _user User information
     * @param _sessionData Session data
     * @throws InvalidCredentialsException
     */
    async refresh(_user, sessionData) {
        /* Optional */
        return sessionData;
    }
    /**
     * Handle user session termination
     *
     * @param _user User information
     * @param _sessionData Session data
     */
    async logout(_user, _sessionData) {
        /* Optional */
    }
}
exports.AuthDriver = AuthDriver;
