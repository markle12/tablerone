import Database from 'better-sqlite3';
import { Tabler } from "./tabler";
import { Table } from "./types";
export declare class dbWrapper {
    private dbFile;
    db: Database.Database;
    private backupTask;
    private _tables;
    readonly queryLog: ((...args: any) => void) | null;
    readonly operationLog: ((...args: any) => void) | null;
    constructor(dbFile: string, options?: {
        queryLog?: (val: string) => void;
        operationLog?: (val: string) => void;
    });
    addTable(def: Table): void;
    get tables(): {
        [key: string]: Tabler;
    };
}
export default dbWrapper;
