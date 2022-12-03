/// <reference types="better-sqlite3" />
import { Table, TableRowDefinition, Unique, Filter, TableRow, QueryOptions } from './types';
import { dbWrapper } from "./dbWrapper";
export declare class Tabler {
    private wrapper;
    private tableDefinition;
    private fieldKeys;
    private _idField;
    constructor(wrapper: dbWrapper, def: TableRowDefinition, name: string, uniques?: Array<Unique>);
    private operationLog;
    get def(): Table;
    get idField(): string | null;
    private tableExists;
    private schemaMatchesDefinition;
    select: (options: QueryOptions) => {
        list: any[];
        totalResults: number;
        out?: undefined;
        logData?: undefined;
    } | {
        out: {
            list: any[];
        };
        logData: {
            duration_without_postprocessing: number;
        };
        list?: undefined;
        totalResults?: undefined;
    };
    query: (fields: Array<string> | string | '*') => {
        filter: (filter?: Filter | Filter[] | undefined) => any;
        join: (join?: import("./types").Join | import("./types").Join[] | undefined) => any;
        orderBy: (order?: import("./types").OrderBy | import("./types").OrderBy[] | undefined) => any;
        select: (field: string | string[]) => any;
        limit: (limit?: number | undefined) => any;
        offset: (offset?: number | undefined) => any;
        groupBy: (groupBy: string | string[]) => any;
        subTable: (table: Table, select: string[], join: import("./types").Join | import("./types").Join[]) => any;
        includeCount: (includeCount: boolean) => any;
        run: () => any;
    };
    getById: (id: string | number) => {
        out: any;
    };
    insert: (data: Array<TableRow>) => {
        out: {
            success: boolean;
        };
    };
    delete: (id: string | number | Array<string | number>) => {
        out: {
            success: boolean;
        };
    };
    deleteBy: (filters: Array<Filter>) => {
        out: import("better-sqlite3").RunResult;
    };
    update: (id: string | number | Array<string | number>, set: Partial<TableRow>) => {
        out: {
            success: boolean;
        };
    };
    rowsExist: (ids: Array<string | number>) => {
        out: (string | number)[];
    };
}
export default Tabler;
