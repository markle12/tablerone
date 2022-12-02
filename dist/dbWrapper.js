import Database from 'better-sqlite3';
import fs from 'fs';
import { Tabler } from "./tabler";
export class dbWrapper {
    constructor(dbFile, options) {
        this.dbFile = dbFile;
        this.backupTask = null;
        this._tables = {};
        if (!dbFile) {
            throw 'No database file specified.';
        }
        this.queryLog = (options === null || options === void 0 ? void 0 : options.queryLog) || null;
        this.operationLog = (options === null || options === void 0 ? void 0 : options.operationLog) || null;
        const exists = fs.existsSync(dbFile);
        console.log(`Loading db ${dbFile} - Exists: ${exists}`);
        this.db = new Database(dbFile, { verbose: options === null || options === void 0 ? void 0 : options.queryLog });
        this.db.pragma('journal_mode = WAL');
        process.on('exit', () => this.db.close());
        process.on('SIGHUP', () => process.exit(128 + 1));
        process.on('SIGINT', () => process.exit(128 + 2));
        process.on('SIGTERM', () => process.exit(128 + 15));
        if (process.env.backupDbFile && process.env.backupIntervalMinutes) {
            const interval = parseInt(process.env.backupIntervalMinutes) * 1000 * 60;
            this.backupTask = setInterval(() => {
                if (options === null || options === void 0 ? void 0 : options.operationLog) {
                    options.operationLog(`Performing database backup to ${process.env.backupDbFile}`);
                }
                this.db.backup(process.env.backupDbFile);
            }, interval);
        }
    }
    addTable(def) {
        if (this._tables[def.name]) {
            throw 'Table already added';
        }
        const table = new Tabler(this, def.fields, def.name, def.uniques);
        this._tables[def.name] = table;
    }
    get tables() {
        return Object.assign({}, this._tables);
    }
}
export default dbWrapper;
