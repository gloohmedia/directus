/**
 * I know this looks a little silly, but it allows us to explicitly differentiate between when we're
 * expecting an item vs any other generic object.
 */
export declare type Item = Record<string, any>;
export declare type PrimaryKey = string | number;
export declare type Alterations = {
    create: {
        [key: string]: any;
    }[];
    update: {
        [key: string]: any;
    }[];
    delete: (number | string)[];
};
