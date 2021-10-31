import { Router } from 'express';
import { AppExtensionType, ExtensionType } from '@directus/shared/types';
export declare function getExtensionManager(): ExtensionManager;
declare class ExtensionManager {
    private isInitialized;
    private extensions;
    private appExtensions;
    private apiHooks;
    private apiEndpoints;
    private endpointRouter;
    private isScheduleHookEnabled;
    constructor();
    initialize({ schedule }?: {
        schedule: boolean;
    }): Promise<void>;
    reload(): Promise<void>;
    listExtensions(type?: ExtensionType): string[];
    getAppExtensions(type: AppExtensionType): string | undefined;
    getEndpointRouter(): Router;
    private getExtensions;
    private generateExtensionBundles;
    private getSharedDepsMapping;
    private registerHooks;
    private registerEndpoints;
    private registerHook;
    private registerEndpoint;
    private unregisterHooks;
    private unregisterEndpoints;
}
export {};
