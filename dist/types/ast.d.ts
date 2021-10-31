import { Query } from '@directus/shared/types';
import { Relation } from './relation';
export declare type M2ONode = {
    type: 'm2o';
    name: string;
    children: (NestedCollectionNode | FieldNode)[];
    query: Query;
    fieldKey: string;
    relation: Relation;
    parentKey: string;
    relatedKey: string;
};
export declare type M2ANode = {
    type: 'm2a';
    names: string[];
    children: {
        [collection: string]: (NestedCollectionNode | FieldNode)[];
    };
    query: {
        [collection: string]: Query;
    };
    relatedKey: {
        [collection: string]: string;
    };
    fieldKey: string;
    relation: Relation;
    parentKey: string;
};
export declare type O2MNode = {
    type: 'o2m';
    name: string;
    children: (NestedCollectionNode | FieldNode)[];
    query: Query;
    fieldKey: string;
    relation: Relation;
    parentKey: string;
    relatedKey: string;
};
export declare type NestedCollectionNode = M2ONode | O2MNode | M2ANode;
export declare type FieldNode = {
    type: 'field';
    name: string;
    fieldKey: string;
};
export declare type AST = {
    type: 'root';
    name: string;
    children: (NestedCollectionNode | FieldNode)[];
    query: Query;
};
