import { Router } from 'express';
import { Client } from 'openid-client';
import { LocalAuthDriver } from './local';
import { UsersService } from '../../services';
import { AuthDriverOptions, User, SessionData } from '../../types';
export declare class OAuth2AuthDriver extends LocalAuthDriver {
    client: Client;
    redirectUrl: string;
    usersService: UsersService;
    config: Record<string, any>;
    constructor(options: AuthDriverOptions, config: Record<string, any>);
    generateCodeVerifier(): string;
    generateAuthUrl(codeVerifier: string): string;
    private fetchUserId;
    getUserID(payload: Record<string, any>): Promise<string>;
    login(user: User, sessionData: SessionData): Promise<SessionData>;
    refresh(user: User, sessionData: SessionData): Promise<SessionData>;
}
export declare function createOAuth2AuthRouter(providerName: string): Router;
