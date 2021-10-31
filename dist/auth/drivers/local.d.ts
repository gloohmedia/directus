import { Router } from 'express';
import { AuthDriver } from '../auth';
import { User, SessionData } from '../../types';
export declare class LocalAuthDriver extends AuthDriver {
    getUserID(payload: Record<string, any>): Promise<string>;
    verify(user: User, password?: string): Promise<void>;
    login(user: User, payload: Record<string, any>): Promise<SessionData>;
}
export declare function createLocalAuthRouter(provider: string): Router;
