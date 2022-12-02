import Database from 'better-sqlite3';
import fs from 'fs';
import { Tabler } from "./tabler";
import { TableRowDefinition, Unique } from "./types";

export class dbWrapper {
	public db: Database.Database;
    private backupTask: NodeJS.Timer | null = null;
	private _tables : {[key: string]: Tabler} = {};
	readonly queryLog: ((val: string) => void) | null;
	readonly operationLog: ((val: string) => void) | null;

	constructor(private dbFile: string, options?: {queryLog?: (val: string) => void, operationLog?: (val: string) => void}) {
        if (!dbFile) {
            throw 'No database file specified.';
        }
		this.queryLog = options?.queryLog || null;
		this.operationLog = options?.operationLog || null;

		const exists = fs.existsSync(dbFile);
		console.log(`Loading db ${dbFile} - Exists: ${exists}`);
		this.db = new Database(dbFile, {verbose: options?.queryLog});
		this.db.pragma('journal_mode = WAL');
		process.on('exit', () => this.db.close());
		process.on('SIGHUP', () => process.exit(128 + 1));
		process.on('SIGINT', () => process.exit(128 + 2));
		process.on('SIGTERM', () => process.exit(128 + 15));
        if (process.env.backupDbFile && process.env.backupIntervalMinutes) {
			const interval = parseInt(process.env.backupIntervalMinutes) * 1000 * 60;
			this.backupTask = setInterval(() => {
				if (options?.operationLog) {
					options.operationLog(`Performing database backup to ${process.env.backupDbFile}`);
				}
				
				this.db.backup(process.env.backupDbFile as string);
			}, interval);
		}
    }

	public addTable(name: string, def: TableRowDefinition, uniques?: Array<Unique>) {
		if (this._tables[name]) {
			throw 'Table already added';
		}
		const table = new Tabler(this, def, name, uniques);
		this._tables[name] = table;
	}

	get tables() {
		return {...this._tables};
	} 
}

export default dbWrapper;
