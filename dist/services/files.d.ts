/// <reference types="node" />
import { AbstractServiceOptions, File, PrimaryKey } from '../types';
import { ItemsService, MutationOptions } from './items';
export declare class FilesService extends ItemsService {
    constructor(options: AbstractServiceOptions);
    /**
     * Upload a single new file to the configured storage adapter
     */
    uploadOne(stream: NodeJS.ReadableStream, data: Partial<File> & {
        filename_download: string;
        storage: string;
    }, primaryKey?: PrimaryKey): Promise<PrimaryKey>;
    /**
     * Import a single file from an external URL
     */
    importOne(importURL: string, body: Partial<File>): Promise<PrimaryKey>;
    /**
     * Delete a file
     */
    deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>;
    /**
     * Delete multiple files
     */
    deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>;
}
