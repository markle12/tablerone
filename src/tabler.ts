import { Table, TableRowDefinition, Unique, Filter, TableRow, QueryOptions, operator } from './types';
import { dbWrapper } from "./dbWrapper";
import { ChainableQuery } from "./chainableQuery";

export class Tabler {
	private tableDefinition : Table;
	private fieldKeys : Array<string>;
	private _idField : string | null = null;
	
	constructor(private wrapper: dbWrapper, def: TableRowDefinition, name: string, uniques?: Array<Unique>) {
		this.tableDefinition = {
			name,
			fields: def,
			uniques
		};
		

		this.fieldKeys = Object.keys(def);
		if (!this.tableExists) {
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
			if (this.tableDefinition.uniques?.length) {
				this.tableDefinition.uniques.forEach((u) => {
					createStr += ", ";
					createStr += `UNIQUE(${u.fields.join(',')})`;
				})
			}
			createStr += ')';
			if (!this.idField) {
				throw 'No primary key specified';
			}
			
			const create = wrapper.db.prepare(createStr);
			create.run();
		}
	}

	private operationLog(val: string) {
		this.wrapper.operationLog && this.wrapper.operationLog(val);
	}

	get def() {
		return this.tableDefinition;
	}
	get idField() {
		return this._idField;
	}
	private tableExists = () => {
		const columns = this.wrapper.db.pragma(`main.table_info(${this.tableDefinition.name})`)
		return columns.length > 0;
	}

	private schemaMatchesDefinition = () => {
		// IOU one implementation
		return true;
	}

	public select = (options: QueryOptions) => {
		
		let str = `SELECT %%FIELDS%% FROM ${this.tableDefinition.name}`;
		if (options.joins?.length) {
			options.joins.forEach((join) => {
				const localTable = join.localTable || this.tableDefinition.name;
				str += ` LEFT JOIN ${join.foreignTable} ON ${localTable}.${join.localField}=${join.foreignTable}.${join.foreignField}`;
			});
		}
		let queryArgs : any = {};
		if (options.filters?.length) {
			str += ' WHERE '+options.filters.map((filter) => {
				let argName = filter.field;
				if (filter.value) {
					let argNameCount = 0;
					while (queryArgs[argName] !== undefined) {
						argNameCount++;
						argName = `${filter.field}_${argNameCount}`
					}
					queryArgs[argName] = filter.value;
				}
				
				if (filter.operator == operator.ISNULL) {
					return `${filter.field} IS NULL`;
				} else if (filter.operator == operator.ISNOTNULL) {
					return `${filter.field} IS NOT NULL`;
				} else {
					return `${filter.invert ? 'NOT ' : ''}${filter.field} ${filter.operator} @${argName}`
				}
				
			}).join(' AND ');
		}

		if (options.groupBy?.length) {
			str += ` GROUP BY ${options.groupBy.join(', ')}`;
		}
	
		if (options.orders?.length) {
			str += ' ORDER BY '+options.orders.map((order) => { return `${order.field} ${order.direction}`}).join(', ');
		}
		
		let limitOffset = '';
		if (options.limit) {
			limitOffset += ` LIMIT ${options.limit}`
		}
		if (options.offset) {
			limitOffset += ` OFFSET ${options.offset}`;
		}
		
		const fullStr = str.replace('%%FIELDS%%', Array.isArray(options.fields) ? options.fields.join(', ') : options.fields) + limitOffset;
		const query =this.wrapper.db.prepare(fullStr);
		let result = query.all(queryArgs);
		
		result = result.map((row) => {
			options.subRows?.forEach((subRowType) => {
				const stringVal : string = row[subRowType.name];
				if (stringVal !== null) {
					const rows = stringVal.split('[rs]');
					const splitVals = rows.map(row => row.split('[vs]'));
					const outRows = splitVals.map((splitRow) => {
						const subRow : any = {};
						splitRow.forEach((val, i) => {
							const key = subRowType.fields[i];
							subRow[key] = val;
						});
						return subRow;
					})
					row[subRowType.name] = outRows;
				} else {
					row[subRowType.name] = [];
				}
			})
			options.fields.forEach((field) => {
				field = field.replace(`${this.tableDefinition.name}.`, '');
				
				if (this.tableDefinition.fields[field]?.formatter) {
					row[field] = this.tableDefinition.fields[field].formatter?.out(row[field]);
				}
			})
			return row;
		})
		if (options.includeCount) {
			const countStr = str.replace('%%FIELDS%%', 'COUNT(1)');
			const countQuery = this.wrapper.db.prepare(countStr);
			
			const count = countQuery.all(queryArgs).length;
			return {list: result, totalResults: count};
		}
		return {list: result};
	}

	public query = (fields: Array<string> | string | '*') => {
		if (fields == '*') {
			fields = this.fieldKeys.slice(0);
		} else if (!Array.isArray(fields)) {
			fields = [fields];
		}
		fields = fields.map(field => `${this.tableDefinition.name}.${field}`);
		const options : QueryOptions = {fields};
		return ChainableQuery(options, (options) => {
			return this.select(options);
		}, this);
	}

	public getById = (id: string | number) => {
		const statement = this.wrapper.db.prepare(`SELECT * from ${this.tableDefinition.name} WHERE ${this.idField}=?`);
		return statement.get(id);
	}

	public insert = (data: Array<TableRow>) => {
		if (!Array.isArray(data)) {
			data = [data];
		}
		const insertRows = data.map((row) => {
			const out = this.fieldKeys.reduce((out: Partial<TableRow>, key) => {
				const field = this.tableDefinition.fields[key];
				if (row[field.name] !== undefined) {
					if (field.formatter) {
						out[field.name] = field.formatter.in(row[field.name]);
					} else {
						out[field.name] = row[field.name];
					}
					delete row[field.name];
				} else {
					if (field.default) {
						if (typeof field.default == 'function') {
							out[field.name] = field.default();
						} else {
							out[field.name] = field.default;
						}
					} else if (field.required) {
						throw `Required field not present - ${field.name}`
					} else {
						out[field.name] = null;
					}
				}
				return out;
			}, {});
			if (Object.keys(row).length) {
				console.log(`Extra fields present - ${Object.keys(row).join(',')}`);
			};
			return out;
		})
		
		const insertStatement = this.wrapper.db.prepare(`INSERT INTO ${this.tableDefinition.name} VALUES (@${this.fieldKeys.join(', @')})`);
		const transaction = this.wrapper.db.transaction((insertRows) => {
			insertRows.forEach((insert: TableRow) => {
				insertStatement.run(insert);
			});
		});
		return transaction(insertRows);
	}

	public delete = (id: string | number | Array<string | number>) => {
		const ids = Array.isArray(id) ? id : [id];
		const deleteStatement = this.wrapper.db.prepare(`DELETE FROM ${this.tableDefinition.name} WHERE ${this.idField}=@id`);
		const transaction = this.wrapper.db.transaction((ids) => {
			ids.forEach((id: string | number) => {
				deleteStatement.run({id});
			});
		});
		return transaction(ids);
	}

	public deleteBy = (filters: Array<Filter>) => {
		let queryArgs : any = {};
		let str = `DELETE FROM ${this.tableDefinition.name} WHERE `
		str += filters.map((filter) => {
			queryArgs[filter.field] = filter.value;
			return `${filter.invert ? 'NOT ' : ''}${filter.field}${filter.operator}@${filter.field}`
		}).join(' AND ');
		const query = this.wrapper.db.prepare(str);
		return query.run(queryArgs);
	}

	public update = (id: string | number | Array<string | number>, set: Partial<TableRow>) => {
		let ids = Array.isArray(id) ? id : [id];

		Object.keys(set).forEach((field) => {
			if (this.fieldKeys.includes(field)) {
				if (this.tableDefinition.fields[field].formatter) {
					set[field] = this.tableDefinition.fields[field].formatter?.in(set[field]);
				}
			} else {
				throw 'Extra field present: '+field
			}
		});
		
		const statement = this.wrapper.db.prepare(`UPDATE ${this.tableDefinition.name} SET ${Object.keys(set).map((field) => {
			return `${field}=@${field}`;
		}).join(', ')} WHERE ${this.idField}=@id`);
		const transaction = this.wrapper.db.transaction((ids: Array<string | number>, set: Partial<TableRow>) => {
			ids.forEach((id) => {
				statement.run({id, ...set});
			});
		});
		return transaction(ids, set);
	}

	public rowsExist = (ids: Array<string | number>) => {
		const notPresent : Array<string | number> = [];
		const query = this.wrapper.db.prepare(`SELECT ${this.idField} FROM ${this.tableDefinition.name} WHERE ${this.idField}=?`);
		ids.forEach((id) => {
			const row = query.get(id);
			if (!row) {
				notPresent.push(id);
			}
		});
		return notPresent;		
	}
}

export default Tabler;
