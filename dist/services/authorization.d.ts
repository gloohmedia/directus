import { Knex } from 'knex';
import { Accountability } from '@directus/shared/types';
import { AbstractServiceOptions, AST, Item, PrimaryKey, SchemaOverview } from '../types';
import { PermissionsAction } from '@directus/shared/types';
import { PayloadService } from './payload';
export declare class AuthorizationService {
    knex: Knex;
    accountability: Accountability | null;
    payloadService: PayloadService;
    schema: SchemaOverview;
    constructor(options: AbstractServiceOptions);
    processAST(ast: AST, action?: PermissionsAction): Promise<AST>;
    /**
     * Checks if the provided payload matches the configured permissions, and adds the presets to the payload.
     */
    validatePayload(action: PermissionsAction, collection: string, data: Partial<Item>): Promise<Partial<Item>>;
    checkAccess(action: PermissionsAction, collection: string, pk: PrimaryKey | PrimaryKey[]): Promise<void>;
}
