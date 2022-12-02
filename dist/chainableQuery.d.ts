import { Filter, Join, OrderBy, Table } from "./types";
import Tabler from "./tabler";
interface queryOptions {
    fields: Array<string>;
    filters?: Array<Filter>;
    joins?: Array<Join>;
    orders?: Array<OrderBy>;
    limit?: number;
    offset?: number;
    groupBy?: Array<string>;
    subRows?: Array<{
        name: string;
        fields: Array<string>;
    }>;
    includeCount?: boolean;
}
export declare const ChainableQuery: (existingOptions: queryOptions, runAction: (options: any) => any | void, homeTable: Tabler) => {
    filter: (filter?: Filter | Array<Filter>) => any;
    join: (join?: Join | Array<Join>) => any;
    orderBy: (order?: Array<OrderBy> | OrderBy) => any;
    select: (field: string | Array<string>) => any;
    limit: (limit?: number) => any;
    offset: (offset?: number) => any;
    groupBy: (groupBy: string | Array<string>) => any;
    subTable: (table: Table, select: Array<string>, join: Array<Join> | Join) => any;
    includeCount: (includeCount: boolean) => any;
    run: () => any;
};
export {};
