"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbWrapper = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs_1 = __importDefault(require("fs"));
const tabler_1 = require("./tabler");
class dbWrapper {
    constructor(dbFile, options) {
        this.dbFile = dbFile;
        this.backupTask = null;
        this._tables = {};
        if (!dbFile) {
            throw 'No database file specified.';
        }
        this.queryLog = (options === null || options === void 0 ? void 0 : options.queryLog) || null;
        this.operationLog = (options === null || options === void 0 ? void 0 : options.operationLog) || null;
        const exists = fs_1.default.existsSync(dbFile);
        console.log(`Loading db ${dbFile} - Exists: ${exists}`);
        this.db = new better_sqlite3_1.default(dbFile, { verbose: options === null || options === void 0 ? void 0 : options.queryLog });
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
        const table = new tabler_1.Tabler(this, def.fields, def.name, def.uniques);
        this._tables[def.name] = table;
    }
    get tables() {
        return Object.assign({}, this._tables);
    }
}
exports.dbWrapper = dbWrapper;
exports.default = dbWrapper;
