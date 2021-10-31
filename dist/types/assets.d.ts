import { ResizeOptions, Sharp } from 'sharp';
export declare const TransformationMethods: readonly ["toFormat", "jpeg", "png", "tiff", "webp", "resize", "extend", "extract", "trim", "rotate", "flip", "flop", "sharpen", "median", "blur", "flatten", "gamma", "negate", "normalise", "normalize", "clahe", "convolve", "threshold", "linear", "recomb", "modulate", "tint", "greyscale", "grayscale", "toColorspace", "toColourspace", "removeAlpha", "ensureAlpha", "extractChannel", "bandbool"];
declare type AllowedSharpMethods = Pick<Sharp, typeof TransformationMethods[number]>;
export declare type TransformationMap = {
    [M in keyof AllowedSharpMethods]: readonly [M, ...Parameters<AllowedSharpMethods[M]>];
};
export declare type Transformation = TransformationMap[keyof TransformationMap];
export declare type TransformationParams = {
    key?: string;
    transforms?: Transformation[];
};
export declare type TransformationPreset = TransformationPresetFormat & TransformationPresetResize & TransformationParams & {
    key: string;
};
export declare type TransformationPresetFormat = {
    format?: 'jpg' | 'jpeg' | 'png' | 'webp' | 'tiff';
    quality?: number;
};
export declare type TransformationPresetResize = Pick<ResizeOptions, 'width' | 'height' | 'fit' | 'withoutEnlargement'>;
export {};
