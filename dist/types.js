"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.operator = exports.fieldType = void 0;
var fieldType;
(function (fieldType) {
    fieldType["TEXT"] = "TEXT";
    fieldType["INTEGER"] = "INTEGER";
    fieldType["REAL"] = "REAL";
    fieldType["BLOB"] = "BLOB";
})(fieldType = exports.fieldType || (exports.fieldType = {}));
var operator;
(function (operator) {
    operator["EQUALS"] = "=";
    operator["ISNULL"] = "ISNULL";
    operator["ISNOTNULL"] = "ISNOTNULL";
    operator["LT"] = "<";
    operator["GT"] = ">";
    operator["LTE"] = "<=";
    operator["GTE"] = ">=";
    operator["LIKE"] = "LIKE";
    operator["IN"] = "IN";
})(operator = exports.operator || (exports.operator = {}));
;
