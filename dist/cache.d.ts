import Keyv from 'keyv';
export declare function getCache(): {
    cache: Keyv | null;
    schemaCache: Keyv | null;
};
export declare function flushCaches(): Promise<void>;
