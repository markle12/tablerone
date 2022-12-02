"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabler = void 0;
const types_1 = require("./types");
const chainableQuery_1 = require("./chainableQuery");
class Tabler {
    constructor(wrapper, def, name, uniques) {
        var _a;
        this.wrapper = wrapper;
        this._idField = null;
        this.tableExists = () => {
            const columns = this.wrapper.db.pragma(`main.table_info(${this.tableDefinition.name})`);
            return columns.length > 0;
        };
        this.schemaMatchesDefinition = () => {
            // IOU one implementation
            return true;
        };
        this.select = (options) => {
            var _a, _b, _c, _d;
            let str = `SELECT %%FIELDS%% FROM ${this.tableDefinition.name}`;
            if ((_a = options.joins) === null || _a === void 0 ? void 0 : _a.length) {
                options.joins.forEach((join) => {
                    const localTable = join.localTable || this.tableDefinition.name;
                    str += ` LEFT JOIN ${join.foreignTable} ON ${localTable}.${join.localField}=${join.foreignTable}.${join.foreignField}`;
                });
            }
            let queryArgs = {};
            if ((_b = options.filters) === null || _b === void 0 ? void 0 : _b.length) {
                str += ' WHERE ' + options.filters.map((filter) => {
                    let argName = filter.field;
                    if (filter.value) {
                        let argNameCount = 0;
                        while (queryArgs[argName] !== undefined) {
                            argNameCount++;
                            argName = `${filter.field}_${argNameCount}`;
                        }
                        queryArgs[argName] = filter.value;
                    }
                    if (filter.operator == types_1.operator.ISNULL) {
                        return `${filter.field} IS NULL`;
                    }
                    else if (filter.operator == types_1.operator.ISNOTNULL) {
                        return `${filter.field} IS NOT NULL`;
                    }
                    else {
                        return `${filter.invert ? 'NOT ' : ''}${filter.field} ${filter.operator} @${argName}`;
                    }
                }).join(' AND ');
            }
            if ((_c = options.groupBy) === null || _c === void 0 ? void 0 : _c.length) {
                str += ` GROUP BY ${options.groupBy.join(', ')}`;
            }
            if ((_d = options.orders) === null || _d === void 0 ? void 0 : _d.length) {
                str += ' ORDER BY ' + options.orders.map((order) => { return `${order.field} ${order.direction}`; }).join(', ');
            }
            let limitOffset = '';
            if (options.limit) {
                limitOffset += ` LIMIT ${options.limit}`;
            }
            if (options.offset) {
                limitOffset += ` OFFSET ${options.offset}`;
            }
            const fullStr = str.replace('%%FIELDS%%', Array.isArray(options.fields) ? options.fields.join(', ') : options.fields) + limitOffset;
            const query = this.wrapper.db.prepare(fullStr);
            let result = query.all(queryArgs);
            result = result.map((row) => {
                var _a;
                (_a = options.subRows) === null || _a === void 0 ? void 0 : _a.forEach((subRowType) => {
                    const stringVal = row[subRowType.name];
                    if (stringVal !== null) {
                        const rows = stringVal.split('[rs]');
                        const splitVals = rows.map(row => row.split('[vs]'));
                        const outRows = splitVals.map((splitRow) => {
                            const subRow = {};
                            splitRow.forEach((val, i) => {
                                const key = subRowType.fields[i];
                                subRow[key] = val;
                            });
                            return subRow;
                        });
                        row[subRowType.name] = outRows;
                    }
                    else {
                        row[subRowType.name] = [];
                    }
                });
                options.fields.forEach((field) => {
                    var _a, _b;
                    field = field.replace(`${this.tableDefinition.name}.`, '');
                    if ((_a = this.tableDefinition.fields[field]) === null || _a === void 0 ? void 0 : _a.formatter) {
                        row[field] = (_b = this.tableDefinition.fields[field].formatter) === null || _b === void 0 ? void 0 : _b.out(row[field]);
                    }
                });
                return row;
            });
            if (options.includeCount) {
                const countStr = str.replace('%%FIELDS%%', 'COUNT(1)');
                const countQuery = this.wrapper.db.prepare(countStr);
                const count = countQuery.all(queryArgs).length;
                return { list: result, totalResults: count };
            }
            return { list: result };
        };
        this.query = (fields) => {
            if (fields == '*') {
                fields = this.fieldKeys.slice(0);
            }
            else if (!Array.isArray(fields)) {
                fields = [fields];
            }
            fields = fields.map(field => `${this.tableDefinition.name}.${field}`);
            const options = { fields };
            return (0, chainableQuery_1.ChainableQuery)(options, (options) => {
                return this.select(options);
            }, this);
        };
        this.getById = (id) => {
            const statement = this.wrapper.db.prepare(`SELECT * from ${this.tableDefinition.name} WHERE ${this.idField}=?`);
            return statement.get(id);
        };
        this.insert = (data) => {
            if (!Array.isArray(data)) {
                data = [data];
            }
            const insertRows = data.map((row) => {
                const out = this.fieldKeys.reduce((out, key) => {
                    const field = this.tableDefinition.fields[key];
                    if (row[field.name] !== undefined) {
                        if (field.formatter) {
                            out[field.name] = field.formatter.in(row[field.name]);
                        }
                        else {
                            out[field.name] = row[field.name];
                        }
                        delete row[field.name];
                    }
                    else {
                        if (field.default) {
                            if (typeof field.default == 'function') {
                                out[field.name] = field.default();
                            }
                            else {
                                out[field.name] = field.default;
                            }
                        }
                        else if (field.required) {
                            throw `Required field not present - ${field.name}`;
                        }
                        else {
                            out[field.name] = null;
                        }
                    }
                    return out;
                }, {});
                if (Object.keys(row).length) {
                    console.log(`Extra fields present - ${Object.keys(row).join(',')}`);
                }
                ;
                return out;
            });
            const insertStatement = this.wrapper.db.prepare(`INSERT INTO ${this.tableDefinition.name} VALUES (@${this.fieldKeys.join(', @')})`);
            const transaction = this.wrapper.db.transaction((insertRows) => {
                insertRows.forEach((insert) => {
                    insertStatement.run(insert);
                });
            });
            return transaction(insertRows);
        };
        this.delete = (id) => {
            const ids = Array.isArray(id) ? id : [id];
            const deleteStatement = this.wrapper.db.prepare(`DELETE FROM ${this.tableDefinition.name} WHERE ${this.idField}=@id`);
            const transaction = this.wrapper.db.transaction((ids) => {
                ids.forEach((id) => {
                    deleteStatement.run({ id });
                });
            });
            return transaction(ids);
        };
        this.deleteBy = (filters) => {
            let queryArgs = {};
            let str = `DELETE FROM ${this.tableDefinition.name} WHERE `;
            str += filters.map((filter) => {
                queryArgs[filter.field] = filter.value;
                return `${filter.invert ? 'NOT ' : ''}${filter.field}${filter.operator}@${filter.field}`;
            }).join(' AND ');
            const query = this.wrapper.db.prepare(str);
            return query.run(queryArgs);
        };
        this.update = (id, set) => {
            let ids = Array.isArray(id) ? id : [id];
            Object.keys(set).forEach((field) => {
                var _a;
                if (this.fieldKeys.includes(field)) {
                    if (this.tableDefinition.fields[field].formatter) {
                        set[field] = (_a = this.tableDefinition.fields[field].formatter) === null || _a === void 0 ? void 0 : _a.in(set[field]);
                    }
                }
                else {
                    throw 'Extra field present: ' + field;
                }
            });
            const statement = this.wrapper.db.prepare(`UPDATE ${this.tableDefinition.name} SET ${Object.keys(set).map((field) => {
                return `${field}=@${field}`;
            }).join(', ')} WHERE ${this.idField}=@id`);
            const transaction = this.wrapper.db.transaction((ids, set) => {
                ids.forEach((id) => {
                    statement.run(Object.assign({ id }, set));
                });
            });
            return transaction(ids, set);
        };
        this.rowsExist = (ids) => {
            const notPresent = [];
            const query = this.wrapper.db.prepare(`SELECT ${this.idField} FROM ${this.tableDefinition.name} WHERE ${this.idField}=?`);
            ids.forEach((id) => {
                const row = query.get(id);
                if (!row) {
                    notPresent.push(id);
                }
            });
            return notPresent;
        };
        this.tableDefinition = {
            name,
            fields: def,
            uniques
        };
        this.fieldKeys = Object.keys(def);
        if (!this.tableExists()) {
            this.operationLog(`Table ${this.tableDefinition.name} not found, creating`);
            let createStr = `CREATE TABLE ${this.tableDefinition.name} (`;
            this.fieldKeys.forEach((key, i) => {
                const field = this.tableDefinition.fields[key];
                if (i > 0) {
                    createStr += ', ';
                }
                createStr += `${field.name} ${field.type}`;
                if (field.primaryKey) {
                    this._idField = field.name;
                    createStr += ' PRIMARY KEY';
                }
                if (field.autoIncrement) {
                    createStr += ' AUTOINCREMENT';
                }
            });
            if ((_a = this.tableDefinition.uniques) === null || _a === void 0 ? void 0 : _a.length) {
                this.tableDefinition.uniques.forEach((u) => {
                    createStr += ", ";
                    createStr += `UNIQUE(${u.fields.join(',')})`;
                });
            }
            createStr += ')';
            if (!this.idField) {
                throw 'No primary key specified';
            }
            const create = wrapper.db.prepare(createStr);
            create.run();
        }
    }
    operationLog(val) {
        this.wrapper.operationLog && this.wrapper.operationLog(val);
    }
    get def() {
        return this.tableDefinition;
    }
    get idField() {
        return this._idField;
    }
}
exports.Tabler = Tabler;
exports.default = Tabler;
