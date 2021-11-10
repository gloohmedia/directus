import { EventEmitter2 } from 'eventemitter2';
import logger from './logger';
import { ActionHandler, FilterHandler, HookContext, InitHandler } from './types';

class Emitter {
	private filterEmitter;
	private actionEmitter;
	private initEmitter;

	constructor() {
		const emitterOptions = {
			wildcard: true,
			verboseMemoryLeak: true,
			delimiter: '.',

			// This will ignore the "unspecified event" error
			ignoreErrors: true,
		};

		this.filterEmitter = new EventEmitter2(emitterOptions);
		this.actionEmitter = new EventEmitter2(emitterOptions);
		this.initEmitter = new EventEmitter2(emitterOptions);
	}

	public eventsToEmit(event: string, meta: Record<string, any>) {
		if (event.startsWith('items')) {
			return [event, `${meta.collection}.${event}`];
		}
		return [event];
	}

	public async emitFilter<T>(event: string, payload: T, meta: Record<string, any>, context: HookContext): Promise<T> {
		const events = this.eventsToEmit(event, meta);
		const listeners = events.flatMap((event) => this.filterEmitter.listeners(event)) as FilterHandler[];

		let updatedPayload = payload;
		for (const listener of listeners) {
			const result = await listener(updatedPayload, meta, context);

			if (result !== undefined) {
				updatedPayload = result;
			}
		}

		return updatedPayload;
	}

	public emitAction(event: string, meta: Record<string, any>, context: HookContext): void {
		const events = this.eventsToEmit(event, meta);
		for (const event of events) {
			this.actionEmitter.emitAsync(event, meta, context).catch((err) => {
				logger.warn(`An error was thrown while executing action "${event}"`);
				logger.warn(err);
			});
		}
	}

	public async emitInit(event: string, meta: Record<string, any>): Promise<void> {
		try {
			await this.initEmitter.emitAsync(event, meta);
		} catch (err: any) {
			logger.warn(`An error was thrown while executing init "${event}"`);
			logger.warn(err);
		}
	}

	public onFilter(event: string, handler: FilterHandler): void {
		this.filterEmitter.on(event, handler);
	}

	public onAction(event: string, handler: ActionHandler): void {
		this.actionEmitter.on(event, handler);
	}

	public onInit(event: string, handler: InitHandler): void {
		this.initEmitter.on(event, handler);
	}

	public offFilter(event: string, handler: FilterHandler): void {
		this.filterEmitter.off(event, handler);
	}

	public offAction(event: string, handler: ActionHandler): void {
		this.actionEmitter.off(event, handler);
	}

	public offInit(event: string, handler: InitHandler): void {
		this.initEmitter.off(event, handler);
	}
}

const emitter = new Emitter();

export default emitter;
