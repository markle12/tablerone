"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChainableQuery = void 0;
;
const group_concat = (fields) => {
    return `GROUP_CONCAT(${fields.join(`||'[vs]'||`)},'[rs]')`;
};
const ChainableQuery = (existingOptions, runAction, homeTable) => {
    return {
        filter: (filter) => {
            if (filter) {
                if (!Array.isArray(existingOptions.filters)) {
                    existingOptions.filters = [];
                }
                const filters = Array.isArray(filter) ? filter : [filter];
                filters.length && existingOptions.filters.push(...filters);
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        join: (join) => {
            if (join) {
                if (!Array.isArray(existingOptions.joins)) {
                    existingOptions.joins = [];
                }
                const joins = Array.isArray(join) ? join : [join];
                joins.length && existingOptions.joins.push(...joins);
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        orderBy: (order) => {
            if (order) {
                if (!Array.isArray(existingOptions.orders)) {
                    existingOptions.orders = [];
                }
                const orders = Array.isArray(order) ? order : [order];
                orders.length && existingOptions.orders.push(...orders);
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        select: (field) => {
            const fields = Array.isArray(field) ? field : [field];
            if (Array.isArray(existingOptions.fields)) {
                fields.length && existingOptions.fields.push(...fields);
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        limit: (limit) => {
            if (limit) {
                if (existingOptions.limit) {
                    throw 'Limit already set';
                }
                existingOptions.limit = limit;
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        offset: (offset) => {
            if (offset) {
                if (existingOptions.offset) {
                    throw 'Offset already set';
                }
                existingOptions.offset = offset;
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        groupBy: (groupBy) => {
            if (!Array.isArray(existingOptions.groupBy)) {
                existingOptions.groupBy = [];
            }
            const groupBys = Array.isArray(groupBy) ? groupBy : [groupBy];
            groupBys.length && existingOptions.groupBy.push(...groupBys);
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        subTable: (table, select, join) => {
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
            existingOptions.subRows.push({ name: table.name, fields: select });
            if (!Array.isArray(existingOptions.groupBy)) {
                existingOptions.groupBy = [];
            }
            const groupBy = homeTable.idField;
            if (!existingOptions.groupBy.includes(groupBy)) {
                existingOptions.groupBy.push(groupBy);
            }
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        includeCount: (includeCount) => {
            existingOptions.includeCount = includeCount;
            return (0, exports.ChainableQuery)(existingOptions, runAction, homeTable);
        },
        run: () => {
            return runAction(existingOptions);
        }
    };
};
exports.ChainableQuery = ChainableQuery;
