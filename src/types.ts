import Tabler from "./tabler";
export type Validator<T> = (value: T) => T;

export enum fieldType {
	TEXT = "TEXT",
	INTEGER = "INTEGER",
	REAL = "REAL",
	BLOB = "BLOB"
}

export interface Formatter<T> {
	in: (val: any) => T,
	out: (val: T) => any
}

export interface ForeignKey {
	foreignTable: string,
	foreignField: string
}

export interface Field<T> {
	name: string,
	type: fieldType,
	required?: boolean,
	formatter?: Formatter<T>,
	validator?: Validator<T>,
	primaryKey?: boolean,
	autoIncrement?: boolean,
	foreignKey?: ForeignKey,
	default?: T | (() => T)
}

export interface TableRowDefinition {
	[key: string]: Field<any>
}

export type TableRow = {
	[key: keyof TableRowDefinition]: any
}

export interface Table {
	name: string,
	fields: TableRowDefinition,
	uniques?: Array<Unique>,
	onCreate?: (table: Tabler) => void
}

export enum operator {
	EQUALS = '=',
	ISNULL = 'ISNULL',
	ISNOTNULL = 'ISNOTNULL',
	LT = '<',
	GT = '>',
	LTE = '<=',
	GTE = '>=',
	LIKE = 'LIKE',
	IN = 'IN'
}

export interface Filter {
	field: string,
	operator: operator,
	value: any,
	invert?: boolean
}

export interface Join {
	localField: string,
	localTable?: string,
	foreignTable: string,
	foreignField: string,
}

export interface OrderBy {
	field: string,
	direction: 'ASC' | 'DESC'
}

export interface Unique {
	fields: Array<string>
}

export interface QueryOptions {
	fields: Array<string>,
	filters?: Array<Filter>,
	joins?: Array<Join>,
	orders?: Array<OrderBy>,
	limit?: number,
	offset?: number,
	groupBy?: Array<string>,
	subRows?: Array<{ name: string, fields: Array<string> }>,
	includeCount?: boolean
};