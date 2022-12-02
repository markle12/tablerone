export var fieldType;
(function (fieldType) {
    fieldType["TEXT"] = "TEXT";
    fieldType["INTEGER"] = "INTEGER";
    fieldType["REAL"] = "REAL";
    fieldType["BLOB"] = "BLOB";
})(fieldType || (fieldType = {}));
export var operator;
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
})(operator || (operator = {}));
;
