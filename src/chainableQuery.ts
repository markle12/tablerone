import {Filter, Join, OrderBy, Table} from "./types";
import Tabler from "./tabler";

interface queryOptions {
	fields: Array<string>, 
	filters?: Array<Filter>, 
	joins?: Array<Join>, 
	orders?: Array<OrderBy>, 
	limit?: number, 
	offset?: number, 
	groupBy?: Array<string>, 
	subRows?: Array<{name: string, fields: Array<string>}>,
	includeCount?: boolean
};

const group_concat = (fields: Array<string>) => {
	return `GROUP_CONCAT(${fields.join(`||'[vs]'||`)},'[rs]')`
};

export const ChainableQuery = (existingOptions: queryOptions, runAction: (options: any) => any | void, homeTable: Tabler) => {
	return {
		filter: (filter?: Filter | Array<Filter>) => {
			if (filter) {
				if (!Array.isArray(existingOptions.filters)) {
					existingOptions.filters = [];
				}
				const filters = Array.isArray(filter) ? filter : [filter];
				filters.length && existingOptions.filters.push(...filters);
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		join: (join?: Join | Array<Join>) => {
			if (join) {
				if (!Array.isArray(existingOptions.joins)) {
					existingOptions.joins = [];
				}
				const joins = Array.isArray(join) ? join : [join];
				joins.length && existingOptions.joins.push(...joins);
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		orderBy: (order?: Array<OrderBy> | OrderBy) => {
			if (order) {
				if (!Array.isArray(existingOptions.orders)) {
					existingOptions.orders = [];
				}
				const orders = Array.isArray(order) ? order : [order];
				orders.length && existingOptions.orders.push(...orders);
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		select: (field: string | Array<string>) => {
			const fields = Array.isArray(field) ? field : [field];
			if (Array.isArray(existingOptions.fields)) {
				fields.length && existingOptions.fields.push(...fields);
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		limit: (limit?: number) => {
			if (limit) {
				if (existingOptions.limit) {
					throw 'Limit already set';
				}
				existingOptions.limit = limit;
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		offset: (offset?: number) => {
			if (offset) {
				if (existingOptions.offset) {
					throw 'Offset already set';
				}
				existingOptions.offset = offset;
			}
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		groupBy: (groupBy: string | Array<string>) => {
			if (!Array.isArray(existingOptions.groupBy)) {
				existingOptions.groupBy = [];
			}
			const groupBys = Array.isArray(groupBy) ? groupBy : [groupBy];
			groupBys.length && existingOptions.groupBy.push(...groupBys);
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		subTable: (table: Table, select: Array<string>, join: Array<Join> | Join) => {
			const fields = select.map(field => `${table.name}.${field}`);
			if (!Array.isArray(existingOptions.joins)) {
				existingOptions.joins = [];
			}
			const joins = Array.isArray(join) ? join : [join];
			existingOptions.joins.push(...joins);
			existingOptions.fields.push(`${group_concat(fields)} AS ${table.name}`);
			if (!Array.isArray(existingOptions.subRows)) {
				existingOptions.subRows = [];
			}
			existingOptions.subRows.push({name: table.name, fields: select})
			if (!Array.isArray(existingOptions.groupBy)) {
				existingOptions.groupBy = [];
			}
			const groupBy = homeTable.idField as string;
			if (!existingOptions.groupBy.includes(groupBy)) {
				existingOptions.groupBy.push(groupBy);
			}

			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		includeCount: (includeCount: boolean) => {
			existingOptions.includeCount = includeCount;
			return ChainableQuery(existingOptions, runAction, homeTable);
		},
		run: () => {
			return runAction(existingOptions);
		}
	}
}