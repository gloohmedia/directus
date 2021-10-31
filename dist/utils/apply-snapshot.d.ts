import { Snapshot, SnapshotDiff, SchemaOverview } from '../types';
import { Knex } from 'knex';
export declare function applySnapshot(snapshot: Snapshot, options?: {
    database?: Knex;
    schema?: SchemaOverview;
    current?: Snapshot;
    diff?: SnapshotDiff;
}): Promise<void>;
