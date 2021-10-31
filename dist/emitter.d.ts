import { EventEmitter2 } from 'eventemitter2';
declare const emitter: EventEmitter2;
/**
 * Emit async events without throwing errors. Just log them out as warnings.
 * @param name
 * @param args
 */
export declare function emitAsyncSafe(name: string, ...args: any[]): Promise<any>;
export default emitter;
