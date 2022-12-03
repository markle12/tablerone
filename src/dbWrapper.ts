import Database from 'better-sqlite3';
import fs from 'fs';
import { Tabler } from "./tabler";
import { Table } from "./types";

export class dbWrapper {
	public db: Database.Database;
    private backupTask: NodeJS.Timer | null = null;
	private _tables : {[key: string]: Tabler} = {};
	readonly queryLog: ((...args: any) => void) | null;
	readonly operationLog: ((...args: any) => void) | null;

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

	public addTable(def: Table) {
		if (this._tables[def.name]) {
			throw 'Table already added';
		}
		const table = new Tabler(this, def.fields, def.name, def.uniques);
		this._tables[def.name] = table;
	}

	get tables() {
		const doLog = (...args: any) => {
			if (this.operationLog) {
				this.operationLog(...args);
			}
		}
		const proxyHandler = {
			get(target: Tabler, prop: keyof Tabler, receiver: any) {
				const targetVal = target[prop];
				if (targetVal != 'query' && targetVal instanceof Function) {
					return function(...args: Array<any>) {
						const startTime = Date.now();
						let logData : any = {table: target.def.name, operation: prop, params: args, startTime};
						console.log('proxy', target.def.name, prop);
						try {
							const results = (targetVal as any).apply(target, args);
							console.log('results!', results);
							if (results.logData) {
								logData = {...logData, ...results.logData};
							}
							if (results.out) {
								logData.success = true;
								logData.duration = Date.now() - startTime;
							}
							doLog(logData);
							return results.out;
						} catch (e) {
							logData.success = false;
							logData.error = e;
							logData.duration = Date.now() - startTime;
							doLog(logData);
							return null;
						}
					}
				}
				return targetVal;
			}
		}
		return Object.keys(this._tables).reduce((tables: {[key: string]: Tabler}, tableKey: string) => {
			tables[tableKey] = new Proxy(this._tables[tableKey], proxyHandler);
			return tables;
		}, {});
	}
}

export default dbWrapper;
