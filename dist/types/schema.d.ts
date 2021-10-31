import { Type, Permission } from '@directus/shared/types';
import { Relation } from './relation';
export declare type FieldOverview = {
    field: string;
    defaultValue: any;
    nullable: boolean;
    generated: boolean;
    type: Type | 'unknown' | 'alias';
    dbType: string | null;
    precision: number | null;
    scale: number | null;
    special: string[];
    note: string | null;
    alias: boolean;
};
export declare type CollectionsOverview = {
    [name: string]: {
        collection: string;
        primary: string;
        singleton: boolean;
        sortField: string | null;
        note: string | null;
        accountability: 'all' | 'activity' | null;
        fields: {
            [name: string]: FieldOverview;
        };
    };
};
export declare type SchemaOverview = {
    collections: CollectionsOverview;
    relations: Relation[];
    permissions: Permission[];
};
