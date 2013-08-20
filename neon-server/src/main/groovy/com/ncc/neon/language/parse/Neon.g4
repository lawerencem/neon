grammar Neon;

@header
{
package com.ncc.neon.language.parse;
}

options {
    language = Java;
}

// parser rules
statement : ((query|database) (';'?))+;
database : USE STRING;
query: select FROM STRING (where)? (sort)? (group)? (limit)?;

select: SELECT selectFields;

selectFields
    : ALL_FIELDS
    | fieldList;

ALL_FIELDS : '*';

fieldList : STRING (',' STRING)*;

where: WHERE whereClause;

whereClause
     : '(' whereClause ')'
     | whereClause AND whereClause
     | whereClause OR whereClause
     | simpleWhereClause;

simpleWhereClause : STRING operator STRING;

operator  : GT
          | GTE
          | LT
          | LTE
          | EQ
          | NE;

AND : 'AND' | 'and';
OR : 'OR' | 'or';

sort: SORT sortClause (',' sortClause)*;

sortClause: STRING (SORT_DIRECTION)?;

group: GROUP groupClause (',' groupClause)*;

groupClause: STRING | function;

function: functionName '(' STRING ')';

functionName: 'first'
            | 'last'
            | 'max'
            | 'count'
            | 'min'
            | 'avg'
            | 'sum';

limit: LIMIT STRING;

// lexer rules
GT: '>';
GTE: '>=';
LT: '<';
LTE: '<=';
EQ: '=';
NE: '!=';

USE: 'USE' | 'use';
SELECT: 'SELECT' | 'select';
FROM: 'FROM' | 'from';
WHERE: 'WHERE' | 'where';
GROUP: 'GROUP' | 'group';
LIMIT: 'LIMIT' | 'limit';
SORT: 'SORT' | 'sort';
SORT_DIRECTION : 'ASC'
               | 'asc'
               | 'DESC'
               | 'desc';

STRING: CHAR+;

fragment CHAR : 'a'..'z'
              | 'A'..'Z'
              | '0'..'9'
              | '_' | '-' | '.' | '"';

WHITESPACE : [ \t\r\n]+ -> skip;
