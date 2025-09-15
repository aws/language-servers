/* eslint-disable no-mixed-spaces-and-tabs */
// Generated from src/antlr-grammar/PartiQLParser.g4 by ANTLR 4.13.1

import * as antlr from 'antlr4ng'
import { Token } from 'antlr4ng'

// for running tests with parameters, TODO: discuss strategy for typed parameters in CI
// eslint-disable-next-line no-unused-vars
type int = number

export class PartiQLParser extends antlr.Parser {
    public static readonly ABSOLUTE = 1
    public static readonly ACTION = 2
    public static readonly ADD = 3
    public static readonly ALL = 4
    public static readonly ALLOCATE = 5
    public static readonly ALTER = 6
    public static readonly AND = 7
    public static readonly ANY = 8
    public static readonly ARE = 9
    public static readonly AS = 10
    public static readonly ASC = 11
    public static readonly ASSERTION = 12
    public static readonly AT = 13
    public static readonly AUTHORIZATION = 14
    public static readonly AVG = 15
    public static readonly BEGIN = 16
    public static readonly BETWEEN = 17
    public static readonly BIT = 18
    public static readonly BIT_LENGTH = 19
    public static readonly BY = 20
    public static readonly CASCADE = 21
    public static readonly CASCADED = 22
    public static readonly CASE = 23
    public static readonly CAST = 24
    public static readonly CATALOG = 25
    public static readonly CHAR = 26
    public static readonly CHARACTER = 27
    public static readonly CHARACTER_LENGTH = 28
    public static readonly CHAR_LENGTH = 29
    public static readonly CHECK = 30
    public static readonly CLOSE = 31
    public static readonly COALESCE = 32
    public static readonly COLLATE = 33
    public static readonly COLLATION = 34
    public static readonly COLUMN = 35
    public static readonly COMMIT = 36
    public static readonly CONNECT = 37
    public static readonly CONNECTION = 38
    public static readonly CONSTRAINT = 39
    public static readonly CONSTRAINTS = 40
    public static readonly CONTINUE = 41
    public static readonly CONVERT = 42
    public static readonly CORRESPONDING = 43
    public static readonly COUNT = 44
    public static readonly CREATE = 45
    public static readonly CROSS = 46
    public static readonly CURRENT = 47
    public static readonly CURRENT_DATE = 48
    public static readonly CURRENT_TIME = 49
    public static readonly CURRENT_TIMESTAMP = 50
    public static readonly CURRENT_USER = 51
    public static readonly CURSOR = 52
    public static readonly DATE = 53
    public static readonly DEALLOCATE = 54
    public static readonly DEC = 55
    public static readonly DECIMAL = 56
    public static readonly DECLARE = 57
    public static readonly DEFAULT = 58
    public static readonly DEFERRABLE = 59
    public static readonly DEFERRED = 60
    public static readonly DELETE = 61
    public static readonly DESC = 62
    public static readonly DESCRIBE = 63
    public static readonly DESCRIPTOR = 64
    public static readonly DIAGNOSTICS = 65
    public static readonly DISCONNECT = 66
    public static readonly DISTINCT = 67
    public static readonly DOMAIN = 68
    public static readonly DOUBLE = 69
    public static readonly DROP = 70
    public static readonly ELSE = 71
    public static readonly END = 72
    public static readonly END_EXEC = 73
    public static readonly ESCAPE = 74
    public static readonly EVERY = 75
    public static readonly EXCEPT = 76
    public static readonly EXCEPTION = 77
    public static readonly EXCLUDE = 78
    public static readonly EXCLUDED = 79
    public static readonly EXEC = 80
    public static readonly EXECUTE = 81
    public static readonly EXISTS = 82
    public static readonly EXPLAIN = 83
    public static readonly EXTERNAL = 84
    public static readonly EXTRACT = 85
    public static readonly DATE_ADD = 86
    public static readonly DATE_DIFF = 87
    public static readonly FALSE = 88
    public static readonly FETCH = 89
    public static readonly FIRST = 90
    public static readonly FLOAT = 91
    public static readonly FOR = 92
    public static readonly FOREIGN = 93
    public static readonly FOUND = 94
    public static readonly FROM = 95
    public static readonly FULL = 96
    public static readonly GET = 97
    public static readonly GLOBAL = 98
    public static readonly GO = 99
    public static readonly GOTO = 100
    public static readonly GRANT = 101
    public static readonly GROUP = 102
    public static readonly HAVING = 103
    public static readonly IDENTITY = 104
    public static readonly IMMEDIATE = 105
    public static readonly IN = 106
    public static readonly INDICATOR = 107
    public static readonly INITIALLY = 108
    public static readonly INNER = 109
    public static readonly INPUT = 110
    public static readonly INSENSITIVE = 111
    public static readonly INSERT = 112
    public static readonly INT = 113
    public static readonly INTEGER = 114
    public static readonly INTERSECT = 115
    public static readonly INTERVAL = 116
    public static readonly INTO = 117
    public static readonly IS = 118
    public static readonly ISOLATION = 119
    public static readonly JOIN = 120
    public static readonly KEY = 121
    public static readonly LANGUAGE = 122
    public static readonly LAST = 123
    public static readonly LATERAL = 124
    public static readonly LEFT = 125
    public static readonly LEVEL = 126
    public static readonly LIKE = 127
    public static readonly LOCAL = 128
    public static readonly LOWER = 129
    public static readonly MATCH = 130
    public static readonly MAX = 131
    public static readonly MIN = 132
    public static readonly MODULE = 133
    public static readonly NAMES = 134
    public static readonly NATIONAL = 135
    public static readonly NATURAL = 136
    public static readonly NCHAR = 137
    public static readonly NEXT = 138
    public static readonly NO = 139
    public static readonly NOT = 140
    public static readonly NULL = 141
    public static readonly NULLS = 142
    public static readonly NULLIF = 143
    public static readonly NUMERIC = 144
    public static readonly OCTET_LENGTH = 145
    public static readonly OF = 146
    public static readonly ON = 147
    public static readonly ONLY = 148
    public static readonly OPEN = 149
    public static readonly OPTION = 150
    public static readonly OR = 151
    public static readonly ORDER = 152
    public static readonly OUTER = 153
    public static readonly OUTPUT = 154
    public static readonly OVERLAPS = 155
    public static readonly OVERLAY = 156
    public static readonly PAD = 157
    public static readonly PARTIAL = 158
    public static readonly PLACING = 159
    public static readonly POSITION = 160
    public static readonly PRECISION = 161
    public static readonly PREPARE = 162
    public static readonly PRESERVE = 163
    public static readonly PRIMARY = 164
    public static readonly PRIOR = 165
    public static readonly PRIVILEGES = 166
    public static readonly PROCEDURE = 167
    public static readonly PUBLIC = 168
    public static readonly READ = 169
    public static readonly REAL = 170
    public static readonly REFERENCES = 171
    public static readonly RELATIVE = 172
    public static readonly REPLACE = 173
    public static readonly RESTRICT = 174
    public static readonly REVOKE = 175
    public static readonly RIGHT = 176
    public static readonly ROLLBACK = 177
    public static readonly ROWS = 178
    public static readonly SCHEMA = 179
    public static readonly SCROLL = 180
    public static readonly SECTION = 181
    public static readonly SELECT = 182
    public static readonly SESSION = 183
    public static readonly SESSION_USER = 184
    public static readonly SET = 185
    public static readonly SHORTEST = 186
    public static readonly SIZE = 187
    public static readonly SMALLINT = 188
    public static readonly SOME = 189
    public static readonly SPACE = 190
    public static readonly SQL = 191
    public static readonly SQLCODE = 192
    public static readonly SQLERROR = 193
    public static readonly SQLSTATE = 194
    public static readonly SUBSTRING = 195
    public static readonly SUM = 196
    public static readonly SYSTEM_USER = 197
    public static readonly TABLE = 198
    public static readonly TEMPORARY = 199
    public static readonly THEN = 200
    public static readonly TIME = 201
    public static readonly TIMESTAMP = 202
    public static readonly TO = 203
    public static readonly TRANSACTION = 204
    public static readonly TRANSLATE = 205
    public static readonly TRANSLATION = 206
    public static readonly TRIM = 207
    public static readonly TRUE = 208
    public static readonly UNION = 209
    public static readonly UNIQUE = 210
    public static readonly UNKNOWN = 211
    public static readonly UPDATE = 212
    public static readonly UPPER = 213
    public static readonly UPSERT = 214
    public static readonly USAGE = 215
    public static readonly USER = 216
    public static readonly USING = 217
    public static readonly VALUE = 218
    public static readonly VALUES = 219
    public static readonly VARCHAR = 220
    public static readonly VARYING = 221
    public static readonly VIEW = 222
    public static readonly WHEN = 223
    public static readonly WHENEVER = 224
    public static readonly WHERE = 225
    public static readonly WITH = 226
    public static readonly WORK = 227
    public static readonly WRITE = 228
    public static readonly ZONE = 229
    public static readonly LAG = 230
    public static readonly LEAD = 231
    public static readonly OVER = 232
    public static readonly PARTITION = 233
    public static readonly CAN_CAST = 234
    public static readonly CAN_LOSSLESS_CAST = 235
    public static readonly MISSING = 236
    public static readonly PIVOT = 237
    public static readonly UNPIVOT = 238
    public static readonly LIMIT = 239
    public static readonly OFFSET = 240
    public static readonly REMOVE = 241
    public static readonly INDEX = 242
    public static readonly LET = 243
    public static readonly CONFLICT = 244
    public static readonly DO = 245
    public static readonly RETURNING = 246
    public static readonly MODIFIED = 247
    public static readonly NEW = 248
    public static readonly OLD = 249
    public static readonly NOTHING = 250
    public static readonly TUPLE = 251
    public static readonly INTEGER2 = 252
    public static readonly INT2 = 253
    public static readonly INTEGER4 = 254
    public static readonly INT4 = 255
    public static readonly INTEGER8 = 256
    public static readonly INT8 = 257
    public static readonly BIGINT = 258
    public static readonly BOOL = 259
    public static readonly BOOLEAN = 260
    public static readonly STRING = 261
    public static readonly SYMBOL = 262
    public static readonly CLOB = 263
    public static readonly BLOB = 264
    public static readonly STRUCT = 265
    public static readonly LIST = 266
    public static readonly SEXP = 267
    public static readonly BAG = 268
    public static readonly CARET = 269
    public static readonly COMMA = 270
    public static readonly PLUS = 271
    public static readonly MINUS = 272
    public static readonly SLASH_FORWARD = 273
    public static readonly PERCENT = 274
    public static readonly AT_SIGN = 275
    public static readonly TILDE = 276
    public static readonly ASTERISK = 277
    public static readonly VERTBAR = 278
    public static readonly AMPERSAND = 279
    public static readonly BANG = 280
    public static readonly LT_EQ = 281
    public static readonly GT_EQ = 282
    public static readonly EQ = 283
    public static readonly NEQ = 284
    public static readonly CONCAT = 285
    public static readonly ANGLE_LEFT = 286
    public static readonly ANGLE_RIGHT = 287
    public static readonly ANGLE_DOUBLE_LEFT = 288
    public static readonly ANGLE_DOUBLE_RIGHT = 289
    public static readonly BRACKET_LEFT = 290
    public static readonly BRACKET_RIGHT = 291
    public static readonly BRACE_LEFT = 292
    public static readonly BRACE_RIGHT = 293
    public static readonly PAREN_LEFT = 294
    public static readonly PAREN_RIGHT = 295
    public static readonly COLON = 296
    public static readonly COLON_SEMI = 297
    public static readonly QUESTION_MARK = 298
    public static readonly PERIOD = 299
    public static readonly LITERAL_STRING = 300
    public static readonly LITERAL_INTEGER = 301
    public static readonly LITERAL_DECIMAL = 302
    public static readonly IDENTIFIER = 303
    public static readonly IDENTIFIER_QUOTED = 304
    public static readonly WS = 305
    public static readonly COMMENT_SINGLE = 306
    public static readonly COMMENT_BLOCK = 307
    public static readonly UNRECOGNIZED = 308
    public static readonly ION_CLOSURE = 309
    public static readonly BACKTICK = 310
    public static readonly RULE_root = 0
    public static readonly RULE_statement = 1
    public static readonly RULE_query = 2
    public static readonly RULE_explainOption = 3
    public static readonly RULE_asIdent = 4
    public static readonly RULE_atIdent = 5
    public static readonly RULE_byIdent = 6
    public static readonly RULE_symbolPrimitive = 7
    public static readonly RULE_dql = 8
    public static readonly RULE_execCommand = 9
    public static readonly RULE_qualifiedName = 10
    public static readonly RULE_tableName = 11
    public static readonly RULE_tableConstraintName = 12
    public static readonly RULE_columnName = 13
    public static readonly RULE_columnConstraintName = 14
    public static readonly RULE_ddl = 15
    public static readonly RULE_createCommand = 16
    public static readonly RULE_dropCommand = 17
    public static readonly RULE_tableDef = 18
    public static readonly RULE_tableDefPart = 19
    public static readonly RULE_columnConstraint = 20
    public static readonly RULE_columnConstraintDef = 21
    public static readonly RULE_dml = 22
    public static readonly RULE_dmlBaseCommand = 23
    public static readonly RULE_pathSimple = 24
    public static readonly RULE_pathSimpleSteps = 25
    public static readonly RULE_replaceCommand = 26
    public static readonly RULE_upsertCommand = 27
    public static readonly RULE_removeCommand = 28
    public static readonly RULE_insertCommandReturning = 29
    public static readonly RULE_insertStatement = 30
    public static readonly RULE_onConflict = 31
    public static readonly RULE_insertStatementLegacy = 32
    public static readonly RULE_onConflictLegacy = 33
    public static readonly RULE_conflictTarget = 34
    public static readonly RULE_constraintName = 35
    public static readonly RULE_conflictAction = 36
    public static readonly RULE_doReplace = 37
    public static readonly RULE_doUpdate = 38
    public static readonly RULE_updateClause = 39
    public static readonly RULE_setCommand = 40
    public static readonly RULE_setAssignment = 41
    public static readonly RULE_deleteCommand = 42
    public static readonly RULE_returningClause = 43
    public static readonly RULE_returningColumn = 44
    public static readonly RULE_fromClauseSimple = 45
    public static readonly RULE_whereClause = 46
    public static readonly RULE_selectClause = 47
    public static readonly RULE_projectionItems = 48
    public static readonly RULE_projectionItem = 49
    public static readonly RULE_setQuantifierStrategy = 50
    public static readonly RULE_letClause = 51
    public static readonly RULE_letBinding = 52
    public static readonly RULE_orderByClause = 53
    public static readonly RULE_orderSortSpec = 54
    public static readonly RULE_groupClause = 55
    public static readonly RULE_groupAlias = 56
    public static readonly RULE_groupKey = 57
    public static readonly RULE_over = 58
    public static readonly RULE_windowPartitionList = 59
    public static readonly RULE_windowSortSpecList = 60
    public static readonly RULE_havingClause = 61
    public static readonly RULE_excludeClause = 62
    public static readonly RULE_excludeExpr = 63
    public static readonly RULE_excludeExprSteps = 64
    public static readonly RULE_fromClause = 65
    public static readonly RULE_whereClauseSelect = 66
    public static readonly RULE_offsetByClause = 67
    public static readonly RULE_limitClause = 68
    public static readonly RULE_gpmlPattern = 69
    public static readonly RULE_gpmlPatternList = 70
    public static readonly RULE_matchPattern = 71
    public static readonly RULE_graphPart = 72
    public static readonly RULE_matchSelector = 73
    public static readonly RULE_patternPathVariable = 74
    public static readonly RULE_patternRestrictor = 75
    public static readonly RULE_node = 76
    public static readonly RULE_edge = 77
    public static readonly RULE_pattern = 78
    public static readonly RULE_patternQuantifier = 79
    public static readonly RULE_edgeWSpec = 80
    public static readonly RULE_edgeSpec = 81
    public static readonly RULE_labelSpec = 82
    public static readonly RULE_labelTerm = 83
    public static readonly RULE_labelFactor = 84
    public static readonly RULE_labelPrimary = 85
    public static readonly RULE_edgeAbbrev = 86
    public static readonly RULE_tableReference = 87
    public static readonly RULE_tableNonJoin = 88
    public static readonly RULE_tableBaseReference = 89
    public static readonly RULE_tableUnpivot = 90
    public static readonly RULE_joinRhs = 91
    public static readonly RULE_joinSpec = 92
    public static readonly RULE_joinType = 93
    public static readonly RULE_expr = 94
    public static readonly RULE_exprBagOp = 95
    public static readonly RULE_exprSelect = 96
    public static readonly RULE_exprOr = 97
    public static readonly RULE_exprAnd = 98
    public static readonly RULE_exprNot = 99
    public static readonly RULE_exprPredicate = 100
    public static readonly RULE_mathOp00 = 101
    public static readonly RULE_mathOp01 = 102
    public static readonly RULE_mathOp02 = 103
    public static readonly RULE_valueExpr = 104
    public static readonly RULE_exprPrimary = 105
    public static readonly RULE_exprTerm = 106
    public static readonly RULE_nullIf = 107
    public static readonly RULE_coalesce = 108
    public static readonly RULE_caseExpr = 109
    public static readonly RULE_values = 110
    public static readonly RULE_valueRow = 111
    public static readonly RULE_valueList = 112
    public static readonly RULE_sequenceConstructor = 113
    public static readonly RULE_substring = 114
    public static readonly RULE_position = 115
    public static readonly RULE_overlay = 116
    public static readonly RULE_aggregate = 117
    public static readonly RULE_windowFunction = 118
    public static readonly RULE_cast = 119
    public static readonly RULE_canLosslessCast = 120
    public static readonly RULE_canCast = 121
    public static readonly RULE_extract = 122
    public static readonly RULE_trimFunction = 123
    public static readonly RULE_dateFunction = 124
    public static readonly RULE_functionCall = 125
    public static readonly RULE_functionName = 126
    public static readonly RULE_pathStep = 127
    public static readonly RULE_exprGraphMatchMany = 128
    public static readonly RULE_exprGraphMatchOne = 129
    public static readonly RULE_parameter = 130
    public static readonly RULE_varRefExpr = 131
    public static readonly RULE_nonReservedKeywords = 132
    public static readonly RULE_collection = 133
    public static readonly RULE_array = 134
    public static readonly RULE_bag = 135
    public static readonly RULE_tuple = 136
    public static readonly RULE_pair = 137
    public static readonly RULE_literal = 138
    public static readonly RULE_type = 139

    public static readonly literalNames = [
        null,
        "'ABSOLUTE'",
        "'ACTION'",
        "'ADD'",
        "'ALL'",
        "'ALLOCATE'",
        "'ALTER'",
        "'AND'",
        "'ANY'",
        "'ARE'",
        "'AS'",
        "'ASC'",
        "'ASSERTION'",
        "'AT'",
        "'AUTHORIZATION'",
        "'AVG'",
        "'BEGIN'",
        "'BETWEEN'",
        "'BIT'",
        "'BIT_LENGTH'",
        "'BY'",
        "'CASCADE'",
        "'CASCADED'",
        "'CASE'",
        "'CAST'",
        "'CATALOG'",
        "'CHAR'",
        "'CHARACTER'",
        "'CHARACTER_LENGTH'",
        "'CHAR_LENGTH'",
        "'CHECK'",
        "'CLOSE'",
        "'COALESCE'",
        "'COLLATE'",
        "'COLLATION'",
        "'COLUMN'",
        "'COMMIT'",
        "'CONNECT'",
        "'CONNECTION'",
        "'CONSTRAINT'",
        "'CONSTRAINTS'",
        "'CONTINUE'",
        "'CONVERT'",
        "'CORRESPONDING'",
        "'COUNT'",
        "'CREATE'",
        "'CROSS'",
        "'CURRENT'",
        "'CURRENT_DATE'",
        "'CURRENT_TIME'",
        "'CURRENT_TIMESTAMP'",
        "'CURRENT_USER'",
        "'CURSOR'",
        "'DATE'",
        "'DEALLOCATE'",
        "'DEC'",
        "'DECIMAL'",
        "'DECLARE'",
        "'DEFAULT'",
        "'DEFERRABLE'",
        "'DEFERRED'",
        "'DELETE'",
        "'DESC'",
        "'DESCRIBE'",
        "'DESCRIPTOR'",
        "'DIAGNOSTICS'",
        "'DISCONNECT'",
        "'DISTINCT'",
        "'DOMAIN'",
        "'DOUBLE'",
        "'DROP'",
        "'ELSE'",
        "'END'",
        "'END-EXEC'",
        "'ESCAPE'",
        "'EVERY'",
        "'EXCEPT'",
        "'EXCEPTION'",
        "'EXCLUDE'",
        "'EXCLUDED'",
        "'EXEC'",
        "'EXECUTE'",
        "'EXISTS'",
        "'EXPLAIN'",
        "'EXTERNAL'",
        "'EXTRACT'",
        "'DATE_ADD'",
        "'DATE_DIFF'",
        "'FALSE'",
        "'FETCH'",
        "'FIRST'",
        "'FLOAT'",
        "'FOR'",
        "'FOREIGN'",
        "'FOUND'",
        "'FROM'",
        "'FULL'",
        "'GET'",
        "'GLOBAL'",
        "'GO'",
        "'GOTO'",
        "'GRANT'",
        "'GROUP'",
        "'HAVING'",
        "'IDENTITY'",
        "'IMMEDIATE'",
        "'IN'",
        "'INDICATOR'",
        "'INITIALLY'",
        "'INNER'",
        "'INPUT'",
        "'INSENSITIVE'",
        "'INSERT'",
        "'INT'",
        "'INTEGER'",
        "'INTERSECT'",
        "'INTERVAL'",
        "'INTO'",
        "'IS'",
        "'ISOLATION'",
        "'JOIN'",
        "'KEY'",
        "'LANGUAGE'",
        "'LAST'",
        "'LATERAL'",
        "'LEFT'",
        "'LEVEL'",
        "'LIKE'",
        "'LOCAL'",
        "'LOWER'",
        "'MATCH'",
        "'MAX'",
        "'MIN'",
        "'MODULE'",
        "'NAMES'",
        "'NATIONAL'",
        "'NATURAL'",
        "'NCHAR'",
        "'NEXT'",
        "'NO'",
        "'NOT'",
        "'NULL'",
        "'NULLS'",
        "'NULLIF'",
        "'NUMERIC'",
        "'OCTET_LENGTH'",
        "'OF'",
        "'ON'",
        "'ONLY'",
        "'OPEN'",
        "'OPTION'",
        "'OR'",
        "'ORDER'",
        "'OUTER'",
        "'OUTPUT'",
        "'OVERLAPS'",
        "'OVERLAY'",
        "'PAD'",
        "'PARTIAL'",
        "'PLACING'",
        "'POSITION'",
        "'PRECISION'",
        "'PREPARE'",
        "'PRESERVE'",
        "'PRIMARY'",
        "'PRIOR'",
        "'PRIVILEGES'",
        "'PROCEDURE'",
        "'PUBLIC'",
        "'READ'",
        "'REAL'",
        "'REFERENCES'",
        "'RELATIVE'",
        "'REPLACE'",
        "'RESTRICT'",
        "'REVOKE'",
        "'RIGHT'",
        "'ROLLBACK'",
        "'ROWS'",
        "'SCHEMA'",
        "'SCROLL'",
        "'SECTION'",
        "'SELECT'",
        "'SESSION'",
        "'SESSION_USER'",
        "'SET'",
        "'SHORTEST'",
        "'SIZE'",
        "'SMALLINT'",
        "'SOME'",
        "'SPACE'",
        "'SQL'",
        "'SQLCODE'",
        "'SQLERROR'",
        "'SQLSTATE'",
        "'SUBSTRING'",
        "'SUM'",
        "'SYSTEM_USER'",
        "'TABLE'",
        "'TEMPORARY'",
        "'THEN'",
        "'TIME'",
        "'TIMESTAMP'",
        "'TO'",
        "'TRANSACTION'",
        "'TRANSLATE'",
        "'TRANSLATION'",
        "'TRIM'",
        "'TRUE'",
        "'UNION'",
        "'UNIQUE'",
        "'UNKNOWN'",
        "'UPDATE'",
        "'UPPER'",
        "'UPSERT'",
        "'USAGE'",
        "'USER'",
        "'USING'",
        "'VALUE'",
        "'VALUES'",
        "'VARCHAR'",
        "'VARYING'",
        "'VIEW'",
        "'WHEN'",
        "'WHENEVER'",
        "'WHERE'",
        "'WITH'",
        "'WORK'",
        "'WRITE'",
        "'ZONE'",
        "'LAG'",
        "'LEAD'",
        "'OVER'",
        "'PARTITION'",
        "'CAN_CAST'",
        "'CAN_LOSSLESS_CAST'",
        "'MISSING'",
        "'PIVOT'",
        "'UNPIVOT'",
        "'LIMIT'",
        "'OFFSET'",
        "'REMOVE'",
        "'INDEX'",
        "'LET'",
        "'CONFLICT'",
        "'DO'",
        "'RETURNING'",
        "'MODIFIED'",
        "'NEW'",
        "'OLD'",
        "'NOTHING'",
        "'TUPLE'",
        "'INTEGER2'",
        "'INT2'",
        "'INTEGER4'",
        "'INT4'",
        "'INTEGER8'",
        "'INT8'",
        "'BIGINT'",
        "'BOOL'",
        "'BOOLEAN'",
        "'STRING'",
        "'SYMBOL'",
        "'CLOB'",
        "'BLOB'",
        "'STRUCT'",
        "'LIST'",
        "'SEXP'",
        "'BAG'",
        "'^'",
        "','",
        "'+'",
        "'-'",
        "'/'",
        "'%'",
        "'@'",
        "'~'",
        "'*'",
        "'|'",
        "'&'",
        "'!'",
        "'<='",
        "'>='",
        "'='",
        null,
        "'||'",
        "'<'",
        "'>'",
        "'<<'",
        "'>>'",
        "'['",
        "']'",
        "'{'",
        "'}'",
        "'('",
        "')'",
        "':'",
        "';'",
        "'?'",
        "'.'",
    ]

    public static readonly symbolicNames = [
        null,
        'ABSOLUTE',
        'ACTION',
        'ADD',
        'ALL',
        'ALLOCATE',
        'ALTER',
        'AND',
        'ANY',
        'ARE',
        'AS',
        'ASC',
        'ASSERTION',
        'AT',
        'AUTHORIZATION',
        'AVG',
        'BEGIN',
        'BETWEEN',
        'BIT',
        'BIT_LENGTH',
        'BY',
        'CASCADE',
        'CASCADED',
        'CASE',
        'CAST',
        'CATALOG',
        'CHAR',
        'CHARACTER',
        'CHARACTER_LENGTH',
        'CHAR_LENGTH',
        'CHECK',
        'CLOSE',
        'COALESCE',
        'COLLATE',
        'COLLATION',
        'COLUMN',
        'COMMIT',
        'CONNECT',
        'CONNECTION',
        'CONSTRAINT',
        'CONSTRAINTS',
        'CONTINUE',
        'CONVERT',
        'CORRESPONDING',
        'COUNT',
        'CREATE',
        'CROSS',
        'CURRENT',
        'CURRENT_DATE',
        'CURRENT_TIME',
        'CURRENT_TIMESTAMP',
        'CURRENT_USER',
        'CURSOR',
        'DATE',
        'DEALLOCATE',
        'DEC',
        'DECIMAL',
        'DECLARE',
        'DEFAULT',
        'DEFERRABLE',
        'DEFERRED',
        'DELETE',
        'DESC',
        'DESCRIBE',
        'DESCRIPTOR',
        'DIAGNOSTICS',
        'DISCONNECT',
        'DISTINCT',
        'DOMAIN',
        'DOUBLE',
        'DROP',
        'ELSE',
        'END',
        'END_EXEC',
        'ESCAPE',
        'EVERY',
        'EXCEPT',
        'EXCEPTION',
        'EXCLUDE',
        'EXCLUDED',
        'EXEC',
        'EXECUTE',
        'EXISTS',
        'EXPLAIN',
        'EXTERNAL',
        'EXTRACT',
        'DATE_ADD',
        'DATE_DIFF',
        'FALSE',
        'FETCH',
        'FIRST',
        'FLOAT',
        'FOR',
        'FOREIGN',
        'FOUND',
        'FROM',
        'FULL',
        'GET',
        'GLOBAL',
        'GO',
        'GOTO',
        'GRANT',
        'GROUP',
        'HAVING',
        'IDENTITY',
        'IMMEDIATE',
        'IN',
        'INDICATOR',
        'INITIALLY',
        'INNER',
        'INPUT',
        'INSENSITIVE',
        'INSERT',
        'INT',
        'INTEGER',
        'INTERSECT',
        'INTERVAL',
        'INTO',
        'IS',
        'ISOLATION',
        'JOIN',
        'KEY',
        'LANGUAGE',
        'LAST',
        'LATERAL',
        'LEFT',
        'LEVEL',
        'LIKE',
        'LOCAL',
        'LOWER',
        'MATCH',
        'MAX',
        'MIN',
        'MODULE',
        'NAMES',
        'NATIONAL',
        'NATURAL',
        'NCHAR',
        'NEXT',
        'NO',
        'NOT',
        'NULL',
        'NULLS',
        'NULLIF',
        'NUMERIC',
        'OCTET_LENGTH',
        'OF',
        'ON',
        'ONLY',
        'OPEN',
        'OPTION',
        'OR',
        'ORDER',
        'OUTER',
        'OUTPUT',
        'OVERLAPS',
        'OVERLAY',
        'PAD',
        'PARTIAL',
        'PLACING',
        'POSITION',
        'PRECISION',
        'PREPARE',
        'PRESERVE',
        'PRIMARY',
        'PRIOR',
        'PRIVILEGES',
        'PROCEDURE',
        'PUBLIC',
        'READ',
        'REAL',
        'REFERENCES',
        'RELATIVE',
        'REPLACE',
        'RESTRICT',
        'REVOKE',
        'RIGHT',
        'ROLLBACK',
        'ROWS',
        'SCHEMA',
        'SCROLL',
        'SECTION',
        'SELECT',
        'SESSION',
        'SESSION_USER',
        'SET',
        'SHORTEST',
        'SIZE',
        'SMALLINT',
        'SOME',
        'SPACE',
        'SQL',
        'SQLCODE',
        'SQLERROR',
        'SQLSTATE',
        'SUBSTRING',
        'SUM',
        'SYSTEM_USER',
        'TABLE',
        'TEMPORARY',
        'THEN',
        'TIME',
        'TIMESTAMP',
        'TO',
        'TRANSACTION',
        'TRANSLATE',
        'TRANSLATION',
        'TRIM',
        'TRUE',
        'UNION',
        'UNIQUE',
        'UNKNOWN',
        'UPDATE',
        'UPPER',
        'UPSERT',
        'USAGE',
        'USER',
        'USING',
        'VALUE',
        'VALUES',
        'VARCHAR',
        'VARYING',
        'VIEW',
        'WHEN',
        'WHENEVER',
        'WHERE',
        'WITH',
        'WORK',
        'WRITE',
        'ZONE',
        'LAG',
        'LEAD',
        'OVER',
        'PARTITION',
        'CAN_CAST',
        'CAN_LOSSLESS_CAST',
        'MISSING',
        'PIVOT',
        'UNPIVOT',
        'LIMIT',
        'OFFSET',
        'REMOVE',
        'INDEX',
        'LET',
        'CONFLICT',
        'DO',
        'RETURNING',
        'MODIFIED',
        'NEW',
        'OLD',
        'NOTHING',
        'TUPLE',
        'INTEGER2',
        'INT2',
        'INTEGER4',
        'INT4',
        'INTEGER8',
        'INT8',
        'BIGINT',
        'BOOL',
        'BOOLEAN',
        'STRING',
        'SYMBOL',
        'CLOB',
        'BLOB',
        'STRUCT',
        'LIST',
        'SEXP',
        'BAG',
        'CARET',
        'COMMA',
        'PLUS',
        'MINUS',
        'SLASH_FORWARD',
        'PERCENT',
        'AT_SIGN',
        'TILDE',
        'ASTERISK',
        'VERTBAR',
        'AMPERSAND',
        'BANG',
        'LT_EQ',
        'GT_EQ',
        'EQ',
        'NEQ',
        'CONCAT',
        'ANGLE_LEFT',
        'ANGLE_RIGHT',
        'ANGLE_DOUBLE_LEFT',
        'ANGLE_DOUBLE_RIGHT',
        'BRACKET_LEFT',
        'BRACKET_RIGHT',
        'BRACE_LEFT',
        'BRACE_RIGHT',
        'PAREN_LEFT',
        'PAREN_RIGHT',
        'COLON',
        'COLON_SEMI',
        'QUESTION_MARK',
        'PERIOD',
        'LITERAL_STRING',
        'LITERAL_INTEGER',
        'LITERAL_DECIMAL',
        'IDENTIFIER',
        'IDENTIFIER_QUOTED',
        'WS',
        'COMMENT_SINGLE',
        'COMMENT_BLOCK',
        'UNRECOGNIZED',
        'ION_CLOSURE',
        'BACKTICK',
    ]
    public static readonly ruleNames = [
        'root',
        'statement',
        'query',
        'explainOption',
        'asIdent',
        'atIdent',
        'byIdent',
        'symbolPrimitive',
        'dql',
        'execCommand',
        'qualifiedName',
        'tableName',
        'tableConstraintName',
        'columnName',
        'columnConstraintName',
        'ddl',
        'createCommand',
        'dropCommand',
        'tableDef',
        'tableDefPart',
        'columnConstraint',
        'columnConstraintDef',
        'dml',
        'dmlBaseCommand',
        'pathSimple',
        'pathSimpleSteps',
        'replaceCommand',
        'upsertCommand',
        'removeCommand',
        'insertCommandReturning',
        'insertStatement',
        'onConflict',
        'insertStatementLegacy',
        'onConflictLegacy',
        'conflictTarget',
        'constraintName',
        'conflictAction',
        'doReplace',
        'doUpdate',
        'updateClause',
        'setCommand',
        'setAssignment',
        'deleteCommand',
        'returningClause',
        'returningColumn',
        'fromClauseSimple',
        'whereClause',
        'selectClause',
        'projectionItems',
        'projectionItem',
        'setQuantifierStrategy',
        'letClause',
        'letBinding',
        'orderByClause',
        'orderSortSpec',
        'groupClause',
        'groupAlias',
        'groupKey',
        'over',
        'windowPartitionList',
        'windowSortSpecList',
        'havingClause',
        'excludeClause',
        'excludeExpr',
        'excludeExprSteps',
        'fromClause',
        'whereClauseSelect',
        'offsetByClause',
        'limitClause',
        'gpmlPattern',
        'gpmlPatternList',
        'matchPattern',
        'graphPart',
        'matchSelector',
        'patternPathVariable',
        'patternRestrictor',
        'node',
        'edge',
        'pattern',
        'patternQuantifier',
        'edgeWSpec',
        'edgeSpec',
        'labelSpec',
        'labelTerm',
        'labelFactor',
        'labelPrimary',
        'edgeAbbrev',
        'tableReference',
        'tableNonJoin',
        'tableBaseReference',
        'tableUnpivot',
        'joinRhs',
        'joinSpec',
        'joinType',
        'expr',
        'exprBagOp',
        'exprSelect',
        'exprOr',
        'exprAnd',
        'exprNot',
        'exprPredicate',
        'mathOp00',
        'mathOp01',
        'mathOp02',
        'valueExpr',
        'exprPrimary',
        'exprTerm',
        'nullIf',
        'coalesce',
        'caseExpr',
        'values',
        'valueRow',
        'valueList',
        'sequenceConstructor',
        'substring',
        'position',
        'overlay',
        'aggregate',
        'windowFunction',
        'cast',
        'canLosslessCast',
        'canCast',
        'extract',
        'trimFunction',
        'dateFunction',
        'functionCall',
        'functionName',
        'pathStep',
        'exprGraphMatchMany',
        'exprGraphMatchOne',
        'parameter',
        'varRefExpr',
        'nonReservedKeywords',
        'collection',
        'array',
        'bag',
        'tuple',
        'pair',
        'literal',
        'type',
    ]

    public get grammarFileName(): string {
        return 'PartiQLParser.g4'
    }
    public get literalNames(): (string | null)[] {
        return PartiQLParser.literalNames
    }
    public get symbolicNames(): (string | null)[] {
        return PartiQLParser.symbolicNames
    }
    public get ruleNames(): string[] {
        return PartiQLParser.ruleNames
    }
    public get serializedATN(): number[] {
        return PartiQLParser._serializedATN
    }

    protected createFailedPredicateException(predicate?: string, message?: string): antlr.FailedPredicateException {
        return new antlr.FailedPredicateException(this, predicate, message)
    }

    public constructor(input: antlr.TokenStream) {
        super(input)
        this.interpreter = new antlr.ParserATNSimulator(
            this,
            PartiQLParser._ATN,
            PartiQLParser.decisionsToDFA,
            new antlr.PredictionContextCache()
        )
    }
    public root(): RootContext {
        const localContext = new RootContext(this.context, this.state)
        this.enterRule(localContext, 0, PartiQLParser.RULE_root)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 284
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 280
                            this.statement()
                            this.state = 282
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            if (_la === 297) {
                                {
                                    this.state = 281
                                    this.match(PartiQLParser.COLON_SEMI)
                                }
                            }
                        }
                    }
                    this.state = 286
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 539570177) !== 0) ||
                    (((_la - 70) & ~0x1f) === 0 && ((1 << (_la - 70)) & 34059809) !== 0) ||
                    (((_la - 112) & ~0x1f) === 0 && ((1 << (_la - 112)) & 2954493953) !== 0) ||
                    (((_la - 145) & ~0x1f) === 0 && ((1 << (_la - 145)) & 268470273) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 3323486377) !== 0) ||
                    (((_la - 214) & ~0x1f) === 0 && ((1 << (_la - 214)) & 150143009) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                )
                this.state = 288
                this.match(PartiQLParser.EOF)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public statement(): StatementContext {
        const localContext = new StatementContext(this.context, this.state)
        this.enterRule(localContext, 2, PartiQLParser.RULE_statement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 304
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 83) {
                    {
                        this.state = 290
                        this.match(PartiQLParser.EXPLAIN)
                        this.state = 302
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context)) {
                            case 1:
                                {
                                    this.state = 291
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 292
                                    this.explainOption()
                                    this.state = 297
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    while (_la === 270) {
                                        {
                                            {
                                                this.state = 293
                                                this.match(PartiQLParser.COMMA)
                                                this.state = 294
                                                this.explainOption()
                                            }
                                        }
                                        this.state = 299
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                    }
                                    this.state = 300
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                }

                this.state = 306
                this.query()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public query(): QueryContext {
        let localContext = new QueryContext(this.context, this.state)
        this.enterRule(localContext, 4, PartiQLParser.RULE_query)
        try {
            this.state = 312
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.ANY:
                case PartiQLParser.AVG:
                case PartiQLParser.BIT_LENGTH:
                case PartiQLParser.CASE:
                case PartiQLParser.CAST:
                case PartiQLParser.CHARACTER_LENGTH:
                case PartiQLParser.CHAR_LENGTH:
                case PartiQLParser.COALESCE:
                case PartiQLParser.COUNT:
                case PartiQLParser.CURRENT_DATE:
                case PartiQLParser.CURRENT_USER:
                case PartiQLParser.DATE:
                case PartiQLParser.EVERY:
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.EXISTS:
                case PartiQLParser.EXTRACT:
                case PartiQLParser.DATE_ADD:
                case PartiQLParser.DATE_DIFF:
                case PartiQLParser.FALSE:
                case PartiQLParser.LOWER:
                case PartiQLParser.MAX:
                case PartiQLParser.MIN:
                case PartiQLParser.NOT:
                case PartiQLParser.NULL:
                case PartiQLParser.NULLIF:
                case PartiQLParser.OCTET_LENGTH:
                case PartiQLParser.OVERLAY:
                case PartiQLParser.POSITION:
                case PartiQLParser.SELECT:
                case PartiQLParser.SIZE:
                case PartiQLParser.SOME:
                case PartiQLParser.SUBSTRING:
                case PartiQLParser.SUM:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRIM:
                case PartiQLParser.TRUE:
                case PartiQLParser.UPPER:
                case PartiQLParser.VALUES:
                case PartiQLParser.LAG:
                case PartiQLParser.LEAD:
                case PartiQLParser.CAN_CAST:
                case PartiQLParser.CAN_LOSSLESS_CAST:
                case PartiQLParser.MISSING:
                case PartiQLParser.PIVOT:
                case PartiQLParser.LIST:
                case PartiQLParser.SEXP:
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                case PartiQLParser.BRACE_LEFT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.QUESTION_MARK:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                case PartiQLParser.ION_CLOSURE:
                    localContext = new QueryDqlContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 308
                        this.dql()
                    }
                    break
                case PartiQLParser.DELETE:
                case PartiQLParser.FROM:
                case PartiQLParser.INSERT:
                case PartiQLParser.REPLACE:
                case PartiQLParser.SET:
                case PartiQLParser.UPDATE:
                case PartiQLParser.UPSERT:
                case PartiQLParser.REMOVE:
                    localContext = new QueryDmlContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 309
                        this.dml()
                    }
                    break
                case PartiQLParser.CREATE:
                case PartiQLParser.DROP:
                    localContext = new QueryDdlContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 310
                        this.ddl()
                    }
                    break
                case PartiQLParser.EXEC:
                    localContext = new QueryExecContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 311
                        this.execCommand()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public explainOption(): ExplainOptionContext {
        const localContext = new ExplainOptionContext(this.context, this.state)
        this.enterRule(localContext, 6, PartiQLParser.RULE_explainOption)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 314
                localContext._param = this.match(PartiQLParser.IDENTIFIER)
                this.state = 315
                localContext._value = this.match(PartiQLParser.IDENTIFIER)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public asIdent(): AsIdentContext {
        const localContext = new AsIdentContext(this.context, this.state)
        this.enterRule(localContext, 8, PartiQLParser.RULE_asIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 317
                this.match(PartiQLParser.AS)
                this.state = 318
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public atIdent(): AtIdentContext {
        const localContext = new AtIdentContext(this.context, this.state)
        this.enterRule(localContext, 10, PartiQLParser.RULE_atIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 320
                this.match(PartiQLParser.AT)
                this.state = 321
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public byIdent(): ByIdentContext {
        const localContext = new ByIdentContext(this.context, this.state)
        this.enterRule(localContext, 12, PartiQLParser.RULE_byIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 323
                this.match(PartiQLParser.BY)
                this.state = 324
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        const localContext = new SymbolPrimitiveContext(this.context, this.state)
        this.enterRule(localContext, 14, PartiQLParser.RULE_symbolPrimitive)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 326
                localContext._ident = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 303 || _la === 304)) {
                    localContext._ident = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public dql(): DqlContext {
        const localContext = new DqlContext(this.context, this.state)
        this.enterRule(localContext, 16, PartiQLParser.RULE_dql)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 328
                this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public execCommand(): ExecCommandContext {
        const localContext = new ExecCommandContext(this.context, this.state)
        this.enterRule(localContext, 18, PartiQLParser.RULE_execCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 330
                this.match(PartiQLParser.EXEC)
                this.state = 331
                localContext._name = this.expr()
                this.state = 340
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context)) {
                    case 1:
                        {
                            this.state = 332
                            localContext._expr = this.expr()
                            localContext._args.push(localContext._expr!)
                            this.state = 337
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            while (_la === 270) {
                                {
                                    {
                                        this.state = 333
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 334
                                        localContext._expr = this.expr()
                                        localContext._args.push(localContext._expr!)
                                    }
                                }
                                this.state = 339
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                            }
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public qualifiedName(): QualifiedNameContext {
        const localContext = new QualifiedNameContext(this.context, this.state)
        this.enterRule(localContext, 20, PartiQLParser.RULE_qualifiedName)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 347
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 342
                                localContext._symbolPrimitive = this.symbolPrimitive()
                                localContext._qualifier.push(localContext._symbolPrimitive!)
                                this.state = 343
                                this.match(PartiQLParser.PERIOD)
                            }
                        }
                    }
                    this.state = 349
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                }
                this.state = 350
                localContext._name = this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableName(): TableNameContext {
        const localContext = new TableNameContext(this.context, this.state)
        this.enterRule(localContext, 22, PartiQLParser.RULE_tableName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 352
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableConstraintName(): TableConstraintNameContext {
        const localContext = new TableConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 24, PartiQLParser.RULE_tableConstraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 354
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public columnName(): ColumnNameContext {
        const localContext = new ColumnNameContext(this.context, this.state)
        this.enterRule(localContext, 26, PartiQLParser.RULE_columnName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 356
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public columnConstraintName(): ColumnConstraintNameContext {
        const localContext = new ColumnConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 28, PartiQLParser.RULE_columnConstraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 358
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public ddl(): DdlContext {
        const localContext = new DdlContext(this.context, this.state)
        this.enterRule(localContext, 30, PartiQLParser.RULE_ddl)
        try {
            this.state = 362
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.CREATE:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 360
                        this.createCommand()
                    }
                    break
                case PartiQLParser.DROP:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 361
                        this.dropCommand()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public createCommand(): CreateCommandContext {
        let localContext = new CreateCommandContext(this.context, this.state)
        this.enterRule(localContext, 32, PartiQLParser.RULE_createCommand)
        let _la: number
        try {
            this.state = 388
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context)) {
                case 1:
                    localContext = new CreateTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 364
                        this.match(PartiQLParser.CREATE)
                        this.state = 365
                        this.match(PartiQLParser.TABLE)
                        this.state = 366
                        this.qualifiedName()
                        this.state = 371
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 10, this.context)) {
                            case 1:
                                {
                                    this.state = 367
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 368
                                    this.tableDef()
                                    this.state = 369
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                    break
                case 2:
                    localContext = new CreateIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 373
                        this.match(PartiQLParser.CREATE)
                        this.state = 374
                        this.match(PartiQLParser.INDEX)
                        this.state = 375
                        this.match(PartiQLParser.ON)
                        this.state = 376
                        this.symbolPrimitive()
                        this.state = 377
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 378
                        this.pathSimple()
                        this.state = 383
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 379
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 380
                                    this.pathSimple()
                                }
                            }
                            this.state = 385
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 386
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public dropCommand(): DropCommandContext {
        let localContext = new DropCommandContext(this.context, this.state)
        this.enterRule(localContext, 34, PartiQLParser.RULE_dropCommand)
        try {
            this.state = 399
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 13, this.context)) {
                case 1:
                    localContext = new DropTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 390
                        this.match(PartiQLParser.DROP)
                        this.state = 391
                        this.match(PartiQLParser.TABLE)
                        this.state = 392
                        this.qualifiedName()
                    }
                    break
                case 2:
                    localContext = new DropIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 393
                        this.match(PartiQLParser.DROP)
                        this.state = 394
                        this.match(PartiQLParser.INDEX)
                        this.state = 395
                        ;(localContext as DropIndexContext)._target = this.symbolPrimitive()
                        this.state = 396
                        this.match(PartiQLParser.ON)
                        this.state = 397
                        ;(localContext as DropIndexContext)._on = this.symbolPrimitive()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableDef(): TableDefContext {
        const localContext = new TableDefContext(this.context, this.state)
        this.enterRule(localContext, 36, PartiQLParser.RULE_tableDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 401
                this.tableDefPart()
                this.state = 406
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 402
                            this.match(PartiQLParser.COMMA)
                            this.state = 403
                            this.tableDefPart()
                        }
                    }
                    this.state = 408
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableDefPart(): TableDefPartContext {
        let localContext = new TableDefPartContext(this.context, this.state)
        this.enterRule(localContext, 38, PartiQLParser.RULE_tableDefPart)
        let _la: number
        try {
            localContext = new ColumnDeclarationContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 409
                this.columnName()
                this.state = 410
                this.type_()
                this.state = 414
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 39 || _la === 140 || _la === 141) {
                    {
                        {
                            this.state = 411
                            this.columnConstraint()
                        }
                    }
                    this.state = 416
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public columnConstraint(): ColumnConstraintContext {
        const localContext = new ColumnConstraintContext(this.context, this.state)
        this.enterRule(localContext, 40, PartiQLParser.RULE_columnConstraint)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 419
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 39) {
                    {
                        this.state = 417
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 418
                        this.columnConstraintName()
                    }
                }

                this.state = 421
                this.columnConstraintDef()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public columnConstraintDef(): ColumnConstraintDefContext {
        let localContext = new ColumnConstraintDefContext(this.context, this.state)
        this.enterRule(localContext, 42, PartiQLParser.RULE_columnConstraintDef)
        try {
            this.state = 426
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new ColConstrNotNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 423
                        this.match(PartiQLParser.NOT)
                        this.state = 424
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.NULL:
                    localContext = new ColConstrNullContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 425
                        this.match(PartiQLParser.NULL)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public dml(): DmlContext {
        let localContext = new DmlContext(this.context, this.state)
        this.enterRule(localContext, 44, PartiQLParser.RULE_dml)
        let _la: number
        try {
            let alternative: number
            this.state = 455
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 24, this.context)) {
                case 1:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 428
                        this.updateClause()
                        this.state = 430
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 429
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 432
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 18, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 435
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 434
                                this.whereClause()
                            }
                        }

                        this.state = 438
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 437
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 440
                        this.fromClause()
                        this.state = 442
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 441
                                this.whereClause()
                            }
                        }

                        this.state = 445
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 444
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 447
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 22, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 450
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 449
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 3:
                    localContext = new DmlDeleteContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 452
                        this.deleteCommand()
                    }
                    break
                case 4:
                    localContext = new DmlInsertReturningContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 453
                        this.insertCommandReturning()
                    }
                    break
                case 5:
                    localContext = new DmlBaseContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 454
                        this.dmlBaseCommand()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public dmlBaseCommand(): DmlBaseCommandContext {
        const localContext = new DmlBaseCommandContext(this.context, this.state)
        this.enterRule(localContext, 46, PartiQLParser.RULE_dmlBaseCommand)
        try {
            this.state = 463
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 25, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 457
                        this.insertStatement()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 458
                        this.insertStatementLegacy()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 459
                        this.setCommand()
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 460
                        this.replaceCommand()
                    }
                    break
                case 5:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 461
                        this.removeCommand()
                    }
                    break
                case 6:
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 462
                        this.upsertCommand()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public pathSimple(): PathSimpleContext {
        const localContext = new PathSimpleContext(this.context, this.state)
        this.enterRule(localContext, 48, PartiQLParser.RULE_pathSimple)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 465
                this.symbolPrimitive()
                this.state = 469
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 26, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 466
                                this.pathSimpleSteps()
                            }
                        }
                    }
                    this.state = 471
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 26, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public pathSimpleSteps(): PathSimpleStepsContext {
        let localContext = new PathSimpleStepsContext(this.context, this.state)
        this.enterRule(localContext, 50, PartiQLParser.RULE_pathSimpleSteps)
        try {
            this.state = 482
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context)) {
                case 1:
                    localContext = new PathSimpleLiteralContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 472
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 473
                        ;(localContext as PathSimpleLiteralContext)._key = this.literal()
                        this.state = 474
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathSimpleSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 476
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 477
                        ;(localContext as PathSimpleSymbolContext)._key = this.symbolPrimitive()
                        this.state = 478
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathSimpleDotSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 480
                        this.match(PartiQLParser.PERIOD)
                        this.state = 481
                        ;(localContext as PathSimpleDotSymbolContext)._key = this.symbolPrimitive()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public replaceCommand(): ReplaceCommandContext {
        const localContext = new ReplaceCommandContext(this.context, this.state)
        this.enterRule(localContext, 52, PartiQLParser.RULE_replaceCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 484
                this.match(PartiQLParser.REPLACE)
                this.state = 485
                this.match(PartiQLParser.INTO)
                this.state = 486
                this.symbolPrimitive()
                this.state = 488
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 487
                        this.asIdent()
                    }
                }

                this.state = 490
                localContext._value = this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public upsertCommand(): UpsertCommandContext {
        const localContext = new UpsertCommandContext(this.context, this.state)
        this.enterRule(localContext, 54, PartiQLParser.RULE_upsertCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 492
                this.match(PartiQLParser.UPSERT)
                this.state = 493
                this.match(PartiQLParser.INTO)
                this.state = 494
                this.symbolPrimitive()
                this.state = 496
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 495
                        this.asIdent()
                    }
                }

                this.state = 498
                localContext._value = this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public removeCommand(): RemoveCommandContext {
        const localContext = new RemoveCommandContext(this.context, this.state)
        this.enterRule(localContext, 56, PartiQLParser.RULE_removeCommand)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 500
                this.match(PartiQLParser.REMOVE)
                this.state = 501
                this.pathSimple()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public insertCommandReturning(): InsertCommandReturningContext {
        const localContext = new InsertCommandReturningContext(this.context, this.state)
        this.enterRule(localContext, 58, PartiQLParser.RULE_insertCommandReturning)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 503
                this.match(PartiQLParser.INSERT)
                this.state = 504
                this.match(PartiQLParser.INTO)
                this.state = 505
                this.pathSimple()
                this.state = 506
                this.match(PartiQLParser.VALUE)
                this.state = 507
                localContext._value = this.expr()
                this.state = 510
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 508
                        this.match(PartiQLParser.AT)
                        this.state = 509
                        localContext._pos = this.expr()
                    }
                }

                this.state = 513
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 512
                        this.onConflictLegacy()
                    }
                }

                this.state = 516
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 515
                        this.returningClause()
                    }
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public insertStatement(): InsertStatementContext {
        const localContext = new InsertStatementContext(this.context, this.state)
        this.enterRule(localContext, 60, PartiQLParser.RULE_insertStatement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 518
                this.match(PartiQLParser.INSERT)
                this.state = 519
                this.match(PartiQLParser.INTO)
                this.state = 520
                this.symbolPrimitive()
                this.state = 522
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 521
                        this.asIdent()
                    }
                }

                this.state = 524
                localContext._value = this.expr()
                this.state = 526
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 525
                        this.onConflict()
                    }
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public onConflict(): OnConflictContext {
        const localContext = new OnConflictContext(this.context, this.state)
        this.enterRule(localContext, 62, PartiQLParser.RULE_onConflict)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 528
                this.match(PartiQLParser.ON)
                this.state = 529
                this.match(PartiQLParser.CONFLICT)
                this.state = 531
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147 || _la === 294) {
                    {
                        this.state = 530
                        this.conflictTarget()
                    }
                }

                this.state = 533
                this.conflictAction()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public insertStatementLegacy(): InsertStatementLegacyContext {
        const localContext = new InsertStatementLegacyContext(this.context, this.state)
        this.enterRule(localContext, 64, PartiQLParser.RULE_insertStatementLegacy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 535
                this.match(PartiQLParser.INSERT)
                this.state = 536
                this.match(PartiQLParser.INTO)
                this.state = 537
                this.pathSimple()
                this.state = 538
                this.match(PartiQLParser.VALUE)
                this.state = 539
                localContext._value = this.expr()
                this.state = 542
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 540
                        this.match(PartiQLParser.AT)
                        this.state = 541
                        localContext._pos = this.expr()
                    }
                }

                this.state = 545
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 544
                        this.onConflictLegacy()
                    }
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public onConflictLegacy(): OnConflictLegacyContext {
        const localContext = new OnConflictLegacyContext(this.context, this.state)
        this.enterRule(localContext, 66, PartiQLParser.RULE_onConflictLegacy)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 547
                this.match(PartiQLParser.ON)
                this.state = 548
                this.match(PartiQLParser.CONFLICT)
                this.state = 549
                this.match(PartiQLParser.WHERE)
                this.state = 550
                this.expr()
                this.state = 551
                this.match(PartiQLParser.DO)
                this.state = 552
                this.match(PartiQLParser.NOTHING)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public conflictTarget(): ConflictTargetContext {
        const localContext = new ConflictTargetContext(this.context, this.state)
        this.enterRule(localContext, 68, PartiQLParser.RULE_conflictTarget)
        let _la: number
        try {
            this.state = 568
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 554
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 555
                        this.symbolPrimitive()
                        this.state = 560
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 556
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 557
                                    this.symbolPrimitive()
                                }
                            }
                            this.state = 562
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 563
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.ON:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 565
                        this.match(PartiQLParser.ON)
                        this.state = 566
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 567
                        this.constraintName()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public constraintName(): ConstraintNameContext {
        const localContext = new ConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 70, PartiQLParser.RULE_constraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 570
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public conflictAction(): ConflictActionContext {
        const localContext = new ConflictActionContext(this.context, this.state)
        this.enterRule(localContext, 72, PartiQLParser.RULE_conflictAction)
        try {
            this.state = 580
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 40, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 572
                        this.match(PartiQLParser.DO)
                        this.state = 573
                        this.match(PartiQLParser.NOTHING)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 574
                        this.match(PartiQLParser.DO)
                        this.state = 575
                        this.match(PartiQLParser.REPLACE)
                        this.state = 576
                        this.doReplace()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 577
                        this.match(PartiQLParser.DO)
                        this.state = 578
                        this.match(PartiQLParser.UPDATE)
                        this.state = 579
                        this.doUpdate()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public doReplace(): DoReplaceContext {
        const localContext = new DoReplaceContext(this.context, this.state)
        this.enterRule(localContext, 74, PartiQLParser.RULE_doReplace)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 582
                this.match(PartiQLParser.EXCLUDED)
                this.state = 585
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 41, this.context)) {
                    case 1:
                        {
                            this.state = 583
                            this.match(PartiQLParser.WHERE)
                            this.state = 584
                            localContext._condition = this.expr()
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public doUpdate(): DoUpdateContext {
        const localContext = new DoUpdateContext(this.context, this.state)
        this.enterRule(localContext, 76, PartiQLParser.RULE_doUpdate)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 587
                this.match(PartiQLParser.EXCLUDED)
                this.state = 590
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context)) {
                    case 1:
                        {
                            this.state = 588
                            this.match(PartiQLParser.WHERE)
                            this.state = 589
                            localContext._condition = this.expr()
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public updateClause(): UpdateClauseContext {
        const localContext = new UpdateClauseContext(this.context, this.state)
        this.enterRule(localContext, 78, PartiQLParser.RULE_updateClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 592
                this.match(PartiQLParser.UPDATE)
                this.state = 593
                this.tableBaseReference()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public setCommand(): SetCommandContext {
        const localContext = new SetCommandContext(this.context, this.state)
        this.enterRule(localContext, 80, PartiQLParser.RULE_setCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 595
                this.match(PartiQLParser.SET)
                this.state = 596
                this.setAssignment()
                this.state = 601
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 597
                            this.match(PartiQLParser.COMMA)
                            this.state = 598
                            this.setAssignment()
                        }
                    }
                    this.state = 603
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public setAssignment(): SetAssignmentContext {
        const localContext = new SetAssignmentContext(this.context, this.state)
        this.enterRule(localContext, 82, PartiQLParser.RULE_setAssignment)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 604
                this.pathSimple()
                this.state = 605
                this.match(PartiQLParser.EQ)
                this.state = 606
                this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public deleteCommand(): DeleteCommandContext {
        const localContext = new DeleteCommandContext(this.context, this.state)
        this.enterRule(localContext, 84, PartiQLParser.RULE_deleteCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 608
                this.match(PartiQLParser.DELETE)
                this.state = 609
                this.fromClauseSimple()
                this.state = 611
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 610
                        this.whereClause()
                    }
                }

                this.state = 614
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 613
                        this.returningClause()
                    }
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public returningClause(): ReturningClauseContext {
        const localContext = new ReturningClauseContext(this.context, this.state)
        this.enterRule(localContext, 86, PartiQLParser.RULE_returningClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 616
                this.match(PartiQLParser.RETURNING)
                this.state = 617
                this.returningColumn()
                this.state = 622
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 618
                            this.match(PartiQLParser.COMMA)
                            this.state = 619
                            this.returningColumn()
                        }
                    }
                    this.state = 624
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public returningColumn(): ReturningColumnContext {
        const localContext = new ReturningColumnContext(this.context, this.state)
        this.enterRule(localContext, 88, PartiQLParser.RULE_returningColumn)
        let _la: number
        try {
            this.state = 631
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 47, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 625
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 626
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 627
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 628
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 629
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 630
                        localContext._col = this.expr()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public fromClauseSimple(): FromClauseSimpleContext {
        let localContext = new FromClauseSimpleContext(this.context, this.state)
        this.enterRule(localContext, 90, PartiQLParser.RULE_fromClauseSimple)
        let _la: number
        try {
            this.state = 648
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 51, this.context)) {
                case 1:
                    localContext = new FromClauseSimpleExplicitContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 633
                        this.match(PartiQLParser.FROM)
                        this.state = 634
                        this.pathSimple()
                        this.state = 636
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 635
                                this.asIdent()
                            }
                        }

                        this.state = 639
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 13) {
                            {
                                this.state = 638
                                this.atIdent()
                            }
                        }

                        this.state = 642
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 20) {
                            {
                                this.state = 641
                                this.byIdent()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new FromClauseSimpleImplicitContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 644
                        this.match(PartiQLParser.FROM)
                        this.state = 645
                        this.pathSimple()
                        this.state = 646
                        this.symbolPrimitive()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public whereClause(): WhereClauseContext {
        const localContext = new WhereClauseContext(this.context, this.state)
        this.enterRule(localContext, 92, PartiQLParser.RULE_whereClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 650
                this.match(PartiQLParser.WHERE)
                this.state = 651
                localContext._arg = this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public selectClause(): SelectClauseContext {
        let localContext = new SelectClauseContext(this.context, this.state)
        this.enterRule(localContext, 94, PartiQLParser.RULE_selectClause)
        let _la: number
        try {
            this.state = 674
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 55, this.context)) {
                case 1:
                    localContext = new SelectAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 653
                        this.match(PartiQLParser.SELECT)
                        this.state = 655
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 654
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 657
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    localContext = new SelectItemsContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 658
                        this.match(PartiQLParser.SELECT)
                        this.state = 660
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 659
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 662
                        this.projectionItems()
                    }
                    break
                case 3:
                    localContext = new SelectValueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 663
                        this.match(PartiQLParser.SELECT)
                        this.state = 665
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 664
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 667
                        this.match(PartiQLParser.VALUE)
                        this.state = 668
                        this.expr()
                    }
                    break
                case 4:
                    localContext = new SelectPivotContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 669
                        this.match(PartiQLParser.PIVOT)
                        this.state = 670
                        ;(localContext as SelectPivotContext)._pivot = this.expr()
                        this.state = 671
                        this.match(PartiQLParser.AT)
                        this.state = 672
                        ;(localContext as SelectPivotContext)._at = this.expr()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public projectionItems(): ProjectionItemsContext {
        const localContext = new ProjectionItemsContext(this.context, this.state)
        this.enterRule(localContext, 96, PartiQLParser.RULE_projectionItems)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 676
                this.projectionItem()
                this.state = 681
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 677
                            this.match(PartiQLParser.COMMA)
                            this.state = 678
                            this.projectionItem()
                        }
                    }
                    this.state = 683
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public projectionItem(): ProjectionItemContext {
        const localContext = new ProjectionItemContext(this.context, this.state)
        this.enterRule(localContext, 98, PartiQLParser.RULE_projectionItem)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 684
                this.expr()
                this.state = 689
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10 || _la === 303 || _la === 304) {
                    {
                        this.state = 686
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 685
                                this.match(PartiQLParser.AS)
                            }
                        }

                        this.state = 688
                        this.symbolPrimitive()
                    }
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public setQuantifierStrategy(): SetQuantifierStrategyContext {
        const localContext = new SetQuantifierStrategyContext(this.context, this.state)
        this.enterRule(localContext, 100, PartiQLParser.RULE_setQuantifierStrategy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 691
                _la = this.tokenStream.LA(1)
                if (!(_la === 4 || _la === 67)) {
                    this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public letClause(): LetClauseContext {
        const localContext = new LetClauseContext(this.context, this.state)
        this.enterRule(localContext, 102, PartiQLParser.RULE_letClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 693
                this.match(PartiQLParser.LET)
                this.state = 694
                this.letBinding()
                this.state = 699
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 695
                                this.match(PartiQLParser.COMMA)
                                this.state = 696
                                this.letBinding()
                            }
                        }
                    }
                    this.state = 701
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 59, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public letBinding(): LetBindingContext {
        const localContext = new LetBindingContext(this.context, this.state)
        this.enterRule(localContext, 104, PartiQLParser.RULE_letBinding)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 702
                this.expr()
                this.state = 703
                this.match(PartiQLParser.AS)
                this.state = 704
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public orderByClause(): OrderByClauseContext {
        const localContext = new OrderByClauseContext(this.context, this.state)
        this.enterRule(localContext, 106, PartiQLParser.RULE_orderByClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 706
                this.match(PartiQLParser.ORDER)
                this.state = 707
                this.match(PartiQLParser.BY)
                this.state = 708
                this.orderSortSpec()
                this.state = 713
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 60, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 709
                                this.match(PartiQLParser.COMMA)
                                this.state = 710
                                this.orderSortSpec()
                            }
                        }
                    }
                    this.state = 715
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 60, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public orderSortSpec(): OrderSortSpecContext {
        const localContext = new OrderSortSpecContext(this.context, this.state)
        this.enterRule(localContext, 108, PartiQLParser.RULE_orderSortSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 716
                this.expr()
                this.state = 718
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 61, this.context)) {
                    case 1:
                        {
                            this.state = 717
                            localContext._dir = this.tokenStream.LT(1)
                            _la = this.tokenStream.LA(1)
                            if (!(_la === 11 || _la === 62)) {
                                localContext._dir = this.errorHandler.recoverInline(this)
                            } else {
                                this.errorHandler.reportMatch(this)
                                this.consume()
                            }
                        }
                        break
                }
                this.state = 722
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 62, this.context)) {
                    case 1:
                        {
                            this.state = 720
                            this.match(PartiQLParser.NULLS)
                            this.state = 721
                            localContext._nulls = this.tokenStream.LT(1)
                            _la = this.tokenStream.LA(1)
                            if (!(_la === 90 || _la === 123)) {
                                localContext._nulls = this.errorHandler.recoverInline(this)
                            } else {
                                this.errorHandler.reportMatch(this)
                                this.consume()
                            }
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public groupClause(): GroupClauseContext {
        const localContext = new GroupClauseContext(this.context, this.state)
        this.enterRule(localContext, 110, PartiQLParser.RULE_groupClause)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 724
                this.match(PartiQLParser.GROUP)
                this.state = 726
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 158) {
                    {
                        this.state = 725
                        this.match(PartiQLParser.PARTIAL)
                    }
                }

                this.state = 728
                this.match(PartiQLParser.BY)
                this.state = 729
                this.groupKey()
                this.state = 734
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 64, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 730
                                this.match(PartiQLParser.COMMA)
                                this.state = 731
                                this.groupKey()
                            }
                        }
                    }
                    this.state = 736
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 64, this.context)
                }
                this.state = 738
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 65, this.context)) {
                    case 1:
                        {
                            this.state = 737
                            this.groupAlias()
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public groupAlias(): GroupAliasContext {
        const localContext = new GroupAliasContext(this.context, this.state)
        this.enterRule(localContext, 112, PartiQLParser.RULE_groupAlias)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 740
                this.match(PartiQLParser.GROUP)
                this.state = 741
                this.match(PartiQLParser.AS)
                this.state = 742
                this.symbolPrimitive()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public groupKey(): GroupKeyContext {
        const localContext = new GroupKeyContext(this.context, this.state)
        this.enterRule(localContext, 114, PartiQLParser.RULE_groupKey)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 744
                localContext._key = this.exprSelect()
                this.state = 747
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 66, this.context)) {
                    case 1:
                        {
                            this.state = 745
                            this.match(PartiQLParser.AS)
                            this.state = 746
                            this.symbolPrimitive()
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public over(): OverContext {
        const localContext = new OverContext(this.context, this.state)
        this.enterRule(localContext, 116, PartiQLParser.RULE_over)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 749
                this.match(PartiQLParser.OVER)
                this.state = 750
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 752
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 233) {
                    {
                        this.state = 751
                        this.windowPartitionList()
                    }
                }

                this.state = 755
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 152) {
                    {
                        this.state = 754
                        this.windowSortSpecList()
                    }
                }

                this.state = 757
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public windowPartitionList(): WindowPartitionListContext {
        const localContext = new WindowPartitionListContext(this.context, this.state)
        this.enterRule(localContext, 118, PartiQLParser.RULE_windowPartitionList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 759
                this.match(PartiQLParser.PARTITION)
                this.state = 760
                this.match(PartiQLParser.BY)
                this.state = 761
                this.expr()
                this.state = 766
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 762
                            this.match(PartiQLParser.COMMA)
                            this.state = 763
                            this.expr()
                        }
                    }
                    this.state = 768
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public windowSortSpecList(): WindowSortSpecListContext {
        const localContext = new WindowSortSpecListContext(this.context, this.state)
        this.enterRule(localContext, 120, PartiQLParser.RULE_windowSortSpecList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 769
                this.match(PartiQLParser.ORDER)
                this.state = 770
                this.match(PartiQLParser.BY)
                this.state = 771
                this.orderSortSpec()
                this.state = 776
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 772
                            this.match(PartiQLParser.COMMA)
                            this.state = 773
                            this.orderSortSpec()
                        }
                    }
                    this.state = 778
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public havingClause(): HavingClauseContext {
        const localContext = new HavingClauseContext(this.context, this.state)
        this.enterRule(localContext, 122, PartiQLParser.RULE_havingClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 779
                this.match(PartiQLParser.HAVING)
                this.state = 780
                localContext._arg = this.exprSelect()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public excludeClause(): ExcludeClauseContext {
        const localContext = new ExcludeClauseContext(this.context, this.state)
        this.enterRule(localContext, 124, PartiQLParser.RULE_excludeClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 782
                this.match(PartiQLParser.EXCLUDE)
                this.state = 783
                this.excludeExpr()
                this.state = 788
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 784
                            this.match(PartiQLParser.COMMA)
                            this.state = 785
                            this.excludeExpr()
                        }
                    }
                    this.state = 790
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public excludeExpr(): ExcludeExprContext {
        const localContext = new ExcludeExprContext(this.context, this.state)
        this.enterRule(localContext, 126, PartiQLParser.RULE_excludeExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 791
                this.symbolPrimitive()
                this.state = 793
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 792
                            this.excludeExprSteps()
                        }
                    }
                    this.state = 795
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 290 || _la === 299)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public excludeExprSteps(): ExcludeExprStepsContext {
        let localContext = new ExcludeExprStepsContext(this.context, this.state)
        this.enterRule(localContext, 128, PartiQLParser.RULE_excludeExprSteps)
        try {
            this.state = 810
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 73, this.context)) {
                case 1:
                    localContext = new ExcludeExprTupleAttrContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 797
                        this.match(PartiQLParser.PERIOD)
                        this.state = 798
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new ExcludeExprCollectionAttrContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 799
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 800
                        ;(localContext as ExcludeExprCollectionAttrContext)._attr = this.match(
                            PartiQLParser.LITERAL_STRING
                        )
                        this.state = 801
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new ExcludeExprCollectionIndexContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 802
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 803
                        ;(localContext as ExcludeExprCollectionIndexContext)._index = this.match(
                            PartiQLParser.LITERAL_INTEGER
                        )
                        this.state = 804
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 4:
                    localContext = new ExcludeExprCollectionWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 805
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 806
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 807
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 5:
                    localContext = new ExcludeExprTupleWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 808
                        this.match(PartiQLParser.PERIOD)
                        this.state = 809
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public fromClause(): FromClauseContext {
        const localContext = new FromClauseContext(this.context, this.state)
        this.enterRule(localContext, 130, PartiQLParser.RULE_fromClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 812
                this.match(PartiQLParser.FROM)
                this.state = 813
                this.tableReference(0)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public whereClauseSelect(): WhereClauseSelectContext {
        const localContext = new WhereClauseSelectContext(this.context, this.state)
        this.enterRule(localContext, 132, PartiQLParser.RULE_whereClauseSelect)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 815
                this.match(PartiQLParser.WHERE)
                this.state = 816
                localContext._arg = this.exprSelect()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public offsetByClause(): OffsetByClauseContext {
        const localContext = new OffsetByClauseContext(this.context, this.state)
        this.enterRule(localContext, 134, PartiQLParser.RULE_offsetByClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 818
                this.match(PartiQLParser.OFFSET)
                this.state = 819
                localContext._arg = this.exprSelect()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public limitClause(): LimitClauseContext {
        const localContext = new LimitClauseContext(this.context, this.state)
        this.enterRule(localContext, 136, PartiQLParser.RULE_limitClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 821
                this.match(PartiQLParser.LIMIT)
                this.state = 822
                localContext._arg = this.exprSelect()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public gpmlPattern(): GpmlPatternContext {
        const localContext = new GpmlPatternContext(this.context, this.state)
        this.enterRule(localContext, 138, PartiQLParser.RULE_gpmlPattern)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 825
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 74, this.context)) {
                    case 1:
                        {
                            this.state = 824
                            localContext._selector = this.matchSelector()
                        }
                        break
                }
                this.state = 827
                this.matchPattern()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public gpmlPatternList(): GpmlPatternListContext {
        const localContext = new GpmlPatternListContext(this.context, this.state)
        this.enterRule(localContext, 140, PartiQLParser.RULE_gpmlPatternList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 830
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 4 || _la === 8 || _la === 186) {
                    {
                        this.state = 829
                        localContext._selector = this.matchSelector()
                    }
                }

                this.state = 832
                this.matchPattern()
                this.state = 837
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 833
                            this.match(PartiQLParser.COMMA)
                            this.state = 834
                            this.matchPattern()
                        }
                    }
                    this.state = 839
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public matchPattern(): MatchPatternContext {
        const localContext = new MatchPatternContext(this.context, this.state)
        this.enterRule(localContext, 142, PartiQLParser.RULE_matchPattern)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 841
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 77, this.context)) {
                    case 1:
                        {
                            this.state = 840
                            localContext._restrictor = this.patternRestrictor()
                        }
                        break
                }
                this.state = 844
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 78, this.context)) {
                    case 1:
                        {
                            this.state = 843
                            localContext._variable = this.patternPathVariable()
                        }
                        break
                }
                this.state = 849
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 79, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 846
                                this.graphPart()
                            }
                        }
                    }
                    this.state = 851
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 79, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public graphPart(): GraphPartContext {
        const localContext = new GraphPartContext(this.context, this.state)
        this.enterRule(localContext, 144, PartiQLParser.RULE_graphPart)
        try {
            this.state = 855
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 80, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 852
                        this.node()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 853
                        this.edge()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 854
                        this.pattern()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public matchSelector(): MatchSelectorContext {
        let localContext = new MatchSelectorContext(this.context, this.state)
        this.enterRule(localContext, 146, PartiQLParser.RULE_matchSelector)
        let _la: number
        try {
            this.state = 868
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 83, this.context)) {
                case 1:
                    localContext = new SelectorBasicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 857
                        ;(localContext as SelectorBasicContext)._mod = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 8)) {
                            ;(localContext as SelectorBasicContext)._mod = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 858
                        this.match(PartiQLParser.SHORTEST)
                    }
                    break
                case 2:
                    localContext = new SelectorAnyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 859
                        this.match(PartiQLParser.ANY)
                        this.state = 861
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 81, this.context)) {
                            case 1:
                                {
                                    this.state = 860
                                    ;(localContext as SelectorAnyContext)._k = this.match(PartiQLParser.LITERAL_INTEGER)
                                }
                                break
                        }
                    }
                    break
                case 3:
                    localContext = new SelectorShortestContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 863
                        this.match(PartiQLParser.SHORTEST)
                        this.state = 864
                        ;(localContext as SelectorShortestContext)._k = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 866
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 82, this.context)) {
                            case 1:
                                {
                                    this.state = 865
                                    this.match(PartiQLParser.GROUP)
                                }
                                break
                        }
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public patternPathVariable(): PatternPathVariableContext {
        const localContext = new PatternPathVariableContext(this.context, this.state)
        this.enterRule(localContext, 148, PartiQLParser.RULE_patternPathVariable)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 870
                this.symbolPrimitive()
                this.state = 871
                this.match(PartiQLParser.EQ)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public patternRestrictor(): PatternRestrictorContext {
        const localContext = new PatternRestrictorContext(this.context, this.state)
        this.enterRule(localContext, 150, PartiQLParser.RULE_patternRestrictor)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 873
                localContext._restrictor = this.match(PartiQLParser.IDENTIFIER)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public node(): NodeContext {
        const localContext = new NodeContext(this.context, this.state)
        this.enterRule(localContext, 152, PartiQLParser.RULE_node)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 875
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 877
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 876
                        this.symbolPrimitive()
                    }
                }

                this.state = 881
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 879
                        this.match(PartiQLParser.COLON)
                        this.state = 880
                        this.labelSpec(0)
                    }
                }

                this.state = 884
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 883
                        this.whereClause()
                    }
                }

                this.state = 886
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public edge(): EdgeContext {
        let localContext = new EdgeContext(this.context, this.state)
        this.enterRule(localContext, 154, PartiQLParser.RULE_edge)
        try {
            this.state = 896
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 89, this.context)) {
                case 1:
                    localContext = new EdgeWithSpecContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 888
                        this.edgeWSpec()
                        this.state = 890
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 87, this.context)) {
                            case 1:
                                {
                                    this.state = 889
                                    ;(localContext as EdgeWithSpecContext)._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                case 2:
                    localContext = new EdgeAbbreviatedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 892
                        this.edgeAbbrev()
                        this.state = 894
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 88, this.context)) {
                            case 1:
                                {
                                    this.state = 893
                                    ;(localContext as EdgeAbbreviatedContext)._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public pattern(): PatternContext {
        const localContext = new PatternContext(this.context, this.state)
        this.enterRule(localContext, 156, PartiQLParser.RULE_pattern)
        let _la: number
        try {
            this.state = 936
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 898
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 900
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 90, this.context)) {
                            case 1:
                                {
                                    this.state = 899
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 903
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 902
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 906
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 905
                                    this.graphPart()
                                }
                            }
                            this.state = 908
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 911
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 910
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 913
                        this.match(PartiQLParser.PAREN_RIGHT)
                        this.state = 915
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 94, this.context)) {
                            case 1:
                                {
                                    this.state = 914
                                    localContext._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 917
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 919
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 95, this.context)) {
                            case 1:
                                {
                                    this.state = 918
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 922
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 921
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 925
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 924
                                    this.graphPart()
                                }
                            }
                            this.state = 927
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 930
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 929
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 932
                        this.match(PartiQLParser.BRACKET_RIGHT)
                        this.state = 934
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 99, this.context)) {
                            case 1:
                                {
                                    this.state = 933
                                    localContext._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public patternQuantifier(): PatternQuantifierContext {
        const localContext = new PatternQuantifierContext(this.context, this.state)
        this.enterRule(localContext, 158, PartiQLParser.RULE_patternQuantifier)
        let _la: number
        try {
            this.state = 946
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.ASTERISK:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 938
                        localContext._quant = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 271 || _la === 277)) {
                            localContext._quant = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                    }
                    break
                case PartiQLParser.BRACE_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 939
                        this.match(PartiQLParser.BRACE_LEFT)
                        this.state = 940
                        localContext._lower = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 941
                        this.match(PartiQLParser.COMMA)
                        this.state = 943
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 301) {
                            {
                                this.state = 942
                                localContext._upper = this.match(PartiQLParser.LITERAL_INTEGER)
                            }
                        }

                        this.state = 945
                        this.match(PartiQLParser.BRACE_RIGHT)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public edgeWSpec(): EdgeWSpecContext {
        let localContext = new EdgeWSpecContext(this.context, this.state)
        this.enterRule(localContext, 160, PartiQLParser.RULE_edgeWSpec)
        try {
            this.state = 982
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 103, this.context)) {
                case 1:
                    localContext = new EdgeSpecRightContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 948
                        this.match(PartiQLParser.MINUS)
                        this.state = 949
                        this.edgeSpec()
                        this.state = 950
                        this.match(PartiQLParser.MINUS)
                        this.state = 951
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 2:
                    localContext = new EdgeSpecUndirectedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 953
                        this.match(PartiQLParser.TILDE)
                        this.state = 954
                        this.edgeSpec()
                        this.state = 955
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 3:
                    localContext = new EdgeSpecLeftContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 957
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 958
                        this.match(PartiQLParser.MINUS)
                        this.state = 959
                        this.edgeSpec()
                        this.state = 960
                        this.match(PartiQLParser.MINUS)
                    }
                    break
                case 4:
                    localContext = new EdgeSpecUndirectedRightContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 962
                        this.match(PartiQLParser.TILDE)
                        this.state = 963
                        this.edgeSpec()
                        this.state = 964
                        this.match(PartiQLParser.TILDE)
                        this.state = 965
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 5:
                    localContext = new EdgeSpecUndirectedLeftContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 967
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 968
                        this.match(PartiQLParser.TILDE)
                        this.state = 969
                        this.edgeSpec()
                        this.state = 970
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 6:
                    localContext = new EdgeSpecBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 972
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 973
                        this.match(PartiQLParser.MINUS)
                        this.state = 974
                        this.edgeSpec()
                        this.state = 975
                        this.match(PartiQLParser.MINUS)
                        this.state = 976
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 7:
                    localContext = new EdgeSpecUndirectedBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 978
                        this.match(PartiQLParser.MINUS)
                        this.state = 979
                        this.edgeSpec()
                        this.state = 980
                        this.match(PartiQLParser.MINUS)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public edgeSpec(): EdgeSpecContext {
        const localContext = new EdgeSpecContext(this.context, this.state)
        this.enterRule(localContext, 162, PartiQLParser.RULE_edgeSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 984
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 986
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 985
                        this.symbolPrimitive()
                    }
                }

                this.state = 990
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 988
                        this.match(PartiQLParser.COLON)
                        this.state = 989
                        this.labelSpec(0)
                    }
                }

                this.state = 993
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 992
                        this.whereClause()
                    }
                }

                this.state = 995
                this.match(PartiQLParser.BRACKET_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public labelSpec(): LabelSpecContext
    public labelSpec(_p: number): LabelSpecContext
    public labelSpec(_p?: number): LabelSpecContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new LabelSpecContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 164
        this.enterRecursionRule(localContext, 164, PartiQLParser.RULE_labelSpec, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelSpecTermContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 998
                    this.labelTerm(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1005
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 107, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new LabelSpecOrContext(new LabelSpecContext(parentContext, parentState))
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_labelSpec)
                                this.state = 1000
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1001
                                this.match(PartiQLParser.VERTBAR)
                                this.state = 1002
                                this.labelTerm(0)
                            }
                        }
                    }
                    this.state = 1007
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 107, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }

    public labelTerm(): LabelTermContext
    public labelTerm(_p: number): LabelTermContext
    public labelTerm(_p?: number): LabelTermContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new LabelTermContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 166
        this.enterRecursionRule(localContext, 166, PartiQLParser.RULE_labelTerm, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelTermFactorContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1009
                    this.labelFactor()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1016
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 108, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new LabelTermAndContext(new LabelTermContext(parentContext, parentState))
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_labelTerm)
                                this.state = 1011
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1012
                                this.match(PartiQLParser.AMPERSAND)
                                this.state = 1013
                                this.labelFactor()
                            }
                        }
                    }
                    this.state = 1018
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 108, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public labelFactor(): LabelFactorContext {
        let localContext = new LabelFactorContext(this.context, this.state)
        this.enterRule(localContext, 168, PartiQLParser.RULE_labelFactor)
        try {
            this.state = 1022
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BANG:
                    localContext = new LabelFactorNotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1019
                        this.match(PartiQLParser.BANG)
                        this.state = 1020
                        this.labelPrimary()
                    }
                    break
                case PartiQLParser.PERCENT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new LabelFactorPrimaryContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1021
                        this.labelPrimary()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public labelPrimary(): LabelPrimaryContext {
        let localContext = new LabelPrimaryContext(this.context, this.state)
        this.enterRule(localContext, 170, PartiQLParser.RULE_labelPrimary)
        try {
            this.state = 1030
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new LabelPrimaryNameContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1024
                        this.symbolPrimitive()
                    }
                    break
                case PartiQLParser.PERCENT:
                    localContext = new LabelPrimaryWildContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1025
                        this.match(PartiQLParser.PERCENT)
                    }
                    break
                case PartiQLParser.PAREN_LEFT:
                    localContext = new LabelPrimaryParenContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1026
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1027
                        this.labelSpec(0)
                        this.state = 1028
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public edgeAbbrev(): EdgeAbbrevContext {
        const localContext = new EdgeAbbrevContext(this.context, this.state)
        this.enterRule(localContext, 172, PartiQLParser.RULE_edgeAbbrev)
        let _la: number
        try {
            this.state = 1044
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 113, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1032
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1033
                        this.match(PartiQLParser.TILDE)
                        this.state = 1034
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1035
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1036
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1038
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 286) {
                            {
                                this.state = 1037
                                this.match(PartiQLParser.ANGLE_LEFT)
                            }
                        }

                        this.state = 1040
                        this.match(PartiQLParser.MINUS)
                        this.state = 1042
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 112, this.context)) {
                            case 1:
                                {
                                    this.state = 1041
                                    this.match(PartiQLParser.ANGLE_RIGHT)
                                }
                                break
                        }
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public tableReference(): TableReferenceContext
    public tableReference(_p: number): TableReferenceContext
    public tableReference(_p?: number): TableReferenceContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new TableReferenceContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 174
        this.enterRecursionRule(localContext, 174, PartiQLParser.RULE_tableReference, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1052
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 114, this.context)) {
                    case 1:
                        {
                            localContext = new TableRefBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1047
                            this.tableNonJoin()
                        }
                        break
                    case 2:
                        {
                            localContext = new TableWrappedContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1048
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 1049
                            this.tableReference(0)
                            this.state = 1050
                            this.match(PartiQLParser.PAREN_RIGHT)
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1074
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 118, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1072
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 117, this.context)) {
                                case 1:
                                    {
                                        localContext = new TableCrossJoinContext(
                                            new TableReferenceContext(parentContext, parentState)
                                        )
                                        ;(localContext as TableCrossJoinContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_tableReference
                                        )
                                        this.state = 1054
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1056
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1055
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1058
                                        this.match(PartiQLParser.CROSS)
                                        this.state = 1059
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1060
                                        ;(localContext as TableCrossJoinContext)._rhs = this.joinRhs()
                                    }
                                    break
                                case 2:
                                    {
                                        localContext = new TableCrossJoinContext(
                                            new TableReferenceContext(parentContext, parentState)
                                        )
                                        ;(localContext as TableCrossJoinContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_tableReference
                                        )
                                        this.state = 1061
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1062
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1063
                                        ;(localContext as TableCrossJoinContext)._rhs = this.joinRhs()
                                    }
                                    break
                                case 3:
                                    {
                                        localContext = new TableQualifiedJoinContext(
                                            new TableReferenceContext(parentContext, parentState)
                                        )
                                        ;(localContext as TableQualifiedJoinContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_tableReference
                                        )
                                        this.state = 1064
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1066
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1065
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1068
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1069
                                        ;(localContext as TableQualifiedJoinContext)._rhs = this.joinRhs()
                                        this.state = 1070
                                        this.joinSpec()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1076
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 118, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public tableNonJoin(): TableNonJoinContext {
        const localContext = new TableNonJoinContext(this.context, this.state)
        this.enterRule(localContext, 176, PartiQLParser.RULE_tableNonJoin)
        try {
            this.state = 1079
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.ANY:
                case PartiQLParser.AVG:
                case PartiQLParser.BIT_LENGTH:
                case PartiQLParser.CASE:
                case PartiQLParser.CAST:
                case PartiQLParser.CHARACTER_LENGTH:
                case PartiQLParser.CHAR_LENGTH:
                case PartiQLParser.COALESCE:
                case PartiQLParser.COUNT:
                case PartiQLParser.CURRENT_DATE:
                case PartiQLParser.CURRENT_USER:
                case PartiQLParser.DATE:
                case PartiQLParser.EVERY:
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.EXISTS:
                case PartiQLParser.EXTRACT:
                case PartiQLParser.DATE_ADD:
                case PartiQLParser.DATE_DIFF:
                case PartiQLParser.FALSE:
                case PartiQLParser.LOWER:
                case PartiQLParser.MAX:
                case PartiQLParser.MIN:
                case PartiQLParser.NOT:
                case PartiQLParser.NULL:
                case PartiQLParser.NULLIF:
                case PartiQLParser.OCTET_LENGTH:
                case PartiQLParser.OVERLAY:
                case PartiQLParser.POSITION:
                case PartiQLParser.SELECT:
                case PartiQLParser.SIZE:
                case PartiQLParser.SOME:
                case PartiQLParser.SUBSTRING:
                case PartiQLParser.SUM:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRIM:
                case PartiQLParser.TRUE:
                case PartiQLParser.UPPER:
                case PartiQLParser.VALUES:
                case PartiQLParser.LAG:
                case PartiQLParser.LEAD:
                case PartiQLParser.CAN_CAST:
                case PartiQLParser.CAN_LOSSLESS_CAST:
                case PartiQLParser.MISSING:
                case PartiQLParser.PIVOT:
                case PartiQLParser.LIST:
                case PartiQLParser.SEXP:
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                case PartiQLParser.BRACE_LEFT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.QUESTION_MARK:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                case PartiQLParser.ION_CLOSURE:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1077
                        this.tableBaseReference()
                    }
                    break
                case PartiQLParser.UNPIVOT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1078
                        this.tableUnpivot()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableBaseReference(): TableBaseReferenceContext {
        let localContext = new TableBaseReferenceContext(this.context, this.state)
        this.enterRule(localContext, 178, PartiQLParser.RULE_tableBaseReference)
        try {
            this.state = 1104
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 126, this.context)) {
                case 1:
                    localContext = new TableBaseRefSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1081
                        ;(localContext as TableBaseRefSymbolContext)._source = this.exprSelect()
                        this.state = 1082
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new TableBaseRefClausesContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1084
                        ;(localContext as TableBaseRefClausesContext)._source = this.exprSelect()
                        this.state = 1086
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 120, this.context)) {
                            case 1:
                                {
                                    this.state = 1085
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1089
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 121, this.context)) {
                            case 1:
                                {
                                    this.state = 1088
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1092
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 122, this.context)) {
                            case 1:
                                {
                                    this.state = 1091
                                    this.byIdent()
                                }
                                break
                        }
                    }
                    break
                case 3:
                    localContext = new TableBaseRefMatchContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1094
                        ;(localContext as TableBaseRefMatchContext)._source = this.exprGraphMatchOne()
                        this.state = 1096
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 123, this.context)) {
                            case 1:
                                {
                                    this.state = 1095
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1099
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 124, this.context)) {
                            case 1:
                                {
                                    this.state = 1098
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1102
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 125, this.context)) {
                            case 1:
                                {
                                    this.state = 1101
                                    this.byIdent()
                                }
                                break
                        }
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableUnpivot(): TableUnpivotContext {
        const localContext = new TableUnpivotContext(this.context, this.state)
        this.enterRule(localContext, 180, PartiQLParser.RULE_tableUnpivot)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1106
                this.match(PartiQLParser.UNPIVOT)
                this.state = 1107
                this.expr()
                this.state = 1109
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 127, this.context)) {
                    case 1:
                        {
                            this.state = 1108
                            this.asIdent()
                        }
                        break
                }
                this.state = 1112
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 128, this.context)) {
                    case 1:
                        {
                            this.state = 1111
                            this.atIdent()
                        }
                        break
                }
                this.state = 1115
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 129, this.context)) {
                    case 1:
                        {
                            this.state = 1114
                            this.byIdent()
                        }
                        break
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public joinRhs(): JoinRhsContext {
        let localContext = new JoinRhsContext(this.context, this.state)
        this.enterRule(localContext, 182, PartiQLParser.RULE_joinRhs)
        try {
            this.state = 1122
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 130, this.context)) {
                case 1:
                    localContext = new JoinRhsBaseContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1117
                        this.tableNonJoin()
                    }
                    break
                case 2:
                    localContext = new JoinRhsTableJoinedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1118
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1119
                        this.tableReference(0)
                        this.state = 1120
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public joinSpec(): JoinSpecContext {
        const localContext = new JoinSpecContext(this.context, this.state)
        this.enterRule(localContext, 184, PartiQLParser.RULE_joinSpec)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1124
                this.match(PartiQLParser.ON)
                this.state = 1125
                this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public joinType(): JoinTypeContext {
        const localContext = new JoinTypeContext(this.context, this.state)
        this.enterRule(localContext, 186, PartiQLParser.RULE_joinType)
        let _la: number
        try {
            this.state = 1141
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.INNER:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1127
                        localContext._mod = this.match(PartiQLParser.INNER)
                    }
                    break
                case PartiQLParser.LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1128
                        localContext._mod = this.match(PartiQLParser.LEFT)
                        this.state = 1130
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1129
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.RIGHT:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1132
                        localContext._mod = this.match(PartiQLParser.RIGHT)
                        this.state = 1134
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1133
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.FULL:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1136
                        localContext._mod = this.match(PartiQLParser.FULL)
                        this.state = 1138
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1137
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.OUTER:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1140
                        localContext._mod = this.match(PartiQLParser.OUTER)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public expr(): ExprContext {
        const localContext = new ExprContext(this.context, this.state)
        this.enterRule(localContext, 188, PartiQLParser.RULE_expr)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1143
                this.exprBagOp(0)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public exprBagOp(): ExprBagOpContext
    public exprBagOp(_p: number): ExprBagOpContext
    public exprBagOp(_p?: number): ExprBagOpContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new ExprBagOpContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 190
        this.enterRecursionRule(localContext, 190, PartiQLParser.RULE_exprBagOp, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new QueryBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1146
                    this.exprSelect()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1177
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 142, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1175
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 141, this.context)) {
                                case 1:
                                    {
                                        localContext = new ExceptContext(
                                            new ExprBagOpContext(parentContext, parentState)
                                        )
                                        ;(localContext as ExceptContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprBagOp
                                        )
                                        this.state = 1148
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1150
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1149
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1152
                                        this.match(PartiQLParser.EXCEPT)
                                        this.state = 1154
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1153
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1156
                                        ;(localContext as ExceptContext)._rhs = this.exprSelect()
                                    }
                                    break
                                case 2:
                                    {
                                        localContext = new UnionContext(
                                            new ExprBagOpContext(parentContext, parentState)
                                        )
                                        ;(localContext as UnionContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprBagOp
                                        )
                                        this.state = 1157
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1159
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1158
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1161
                                        this.match(PartiQLParser.UNION)
                                        this.state = 1163
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1162
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1165
                                        ;(localContext as UnionContext)._rhs = this.exprSelect()
                                    }
                                    break
                                case 3:
                                    {
                                        localContext = new IntersectContext(
                                            new ExprBagOpContext(parentContext, parentState)
                                        )
                                        ;(localContext as IntersectContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprBagOp
                                        )
                                        this.state = 1166
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1168
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1167
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1170
                                        this.match(PartiQLParser.INTERSECT)
                                        this.state = 1172
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1171
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1174
                                        ;(localContext as IntersectContext)._rhs = this.exprSelect()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1179
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 142, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public exprSelect(): ExprSelectContext {
        let localContext = new ExprSelectContext(this.context, this.state)
        this.enterRule(localContext, 192, PartiQLParser.RULE_exprSelect)
        let _la: number
        try {
            this.state = 1207
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.SELECT:
                case PartiQLParser.PIVOT:
                    localContext = new SfwQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1180
                        ;(localContext as SfwQueryContext)._select = this.selectClause()
                        this.state = 1182
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 78) {
                            {
                                this.state = 1181
                                ;(localContext as SfwQueryContext)._exclude = this.excludeClause()
                            }
                        }

                        this.state = 1184
                        ;(localContext as SfwQueryContext)._from_ = this.fromClause()
                        this.state = 1186
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 144, this.context)) {
                            case 1:
                                {
                                    this.state = 1185
                                    ;(localContext as SfwQueryContext)._let_ = this.letClause()
                                }
                                break
                        }
                        this.state = 1189
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 145, this.context)) {
                            case 1:
                                {
                                    this.state = 1188
                                    ;(localContext as SfwQueryContext)._where = this.whereClauseSelect()
                                }
                                break
                        }
                        this.state = 1192
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 146, this.context)) {
                            case 1:
                                {
                                    this.state = 1191
                                    ;(localContext as SfwQueryContext)._group = this.groupClause()
                                }
                                break
                        }
                        this.state = 1195
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 147, this.context)) {
                            case 1:
                                {
                                    this.state = 1194
                                    ;(localContext as SfwQueryContext)._having = this.havingClause()
                                }
                                break
                        }
                        this.state = 1198
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 148, this.context)) {
                            case 1:
                                {
                                    this.state = 1197
                                    ;(localContext as SfwQueryContext)._order = this.orderByClause()
                                }
                                break
                        }
                        this.state = 1201
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 149, this.context)) {
                            case 1:
                                {
                                    this.state = 1200
                                    ;(localContext as SfwQueryContext)._limit = this.limitClause()
                                }
                                break
                        }
                        this.state = 1204
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 150, this.context)) {
                            case 1:
                                {
                                    this.state = 1203
                                    ;(localContext as SfwQueryContext)._offset = this.offsetByClause()
                                }
                                break
                        }
                    }
                    break
                case PartiQLParser.ANY:
                case PartiQLParser.AVG:
                case PartiQLParser.BIT_LENGTH:
                case PartiQLParser.CASE:
                case PartiQLParser.CAST:
                case PartiQLParser.CHARACTER_LENGTH:
                case PartiQLParser.CHAR_LENGTH:
                case PartiQLParser.COALESCE:
                case PartiQLParser.COUNT:
                case PartiQLParser.CURRENT_DATE:
                case PartiQLParser.CURRENT_USER:
                case PartiQLParser.DATE:
                case PartiQLParser.EVERY:
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.EXISTS:
                case PartiQLParser.EXTRACT:
                case PartiQLParser.DATE_ADD:
                case PartiQLParser.DATE_DIFF:
                case PartiQLParser.FALSE:
                case PartiQLParser.LOWER:
                case PartiQLParser.MAX:
                case PartiQLParser.MIN:
                case PartiQLParser.NOT:
                case PartiQLParser.NULL:
                case PartiQLParser.NULLIF:
                case PartiQLParser.OCTET_LENGTH:
                case PartiQLParser.OVERLAY:
                case PartiQLParser.POSITION:
                case PartiQLParser.SIZE:
                case PartiQLParser.SOME:
                case PartiQLParser.SUBSTRING:
                case PartiQLParser.SUM:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRIM:
                case PartiQLParser.TRUE:
                case PartiQLParser.UPPER:
                case PartiQLParser.VALUES:
                case PartiQLParser.LAG:
                case PartiQLParser.LEAD:
                case PartiQLParser.CAN_CAST:
                case PartiQLParser.CAN_LOSSLESS_CAST:
                case PartiQLParser.MISSING:
                case PartiQLParser.LIST:
                case PartiQLParser.SEXP:
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                case PartiQLParser.BRACE_LEFT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.QUESTION_MARK:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                case PartiQLParser.ION_CLOSURE:
                    localContext = new SfwBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1206
                        this.exprOr(0)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public exprOr(): ExprOrContext
    public exprOr(_p: number): ExprOrContext
    public exprOr(_p?: number): ExprOrContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new ExprOrContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 194
        this.enterRecursionRule(localContext, 194, PartiQLParser.RULE_exprOr, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprOrBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1210
                    ;(localContext as ExprOrBaseContext)._parent = this.exprAnd(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1217
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 152, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new OrContext(new ExprOrContext(parentContext, parentState))
                                ;(localContext as OrContext)._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_exprOr)
                                this.state = 1212
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1213
                                this.match(PartiQLParser.OR)
                                this.state = 1214
                                ;(localContext as OrContext)._rhs = this.exprAnd(0)
                            }
                        }
                    }
                    this.state = 1219
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 152, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }

    public exprAnd(): ExprAndContext
    public exprAnd(_p: number): ExprAndContext
    public exprAnd(_p?: number): ExprAndContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new ExprAndContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 196
        this.enterRecursionRule(localContext, 196, PartiQLParser.RULE_exprAnd, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprAndBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1221
                    ;(localContext as ExprAndBaseContext)._parent = this.exprNot()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1228
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 153, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new AndContext(new ExprAndContext(parentContext, parentState))
                                ;(localContext as AndContext)._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_exprAnd)
                                this.state = 1223
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1224
                                ;(localContext as AndContext)._op = this.match(PartiQLParser.AND)
                                this.state = 1225
                                ;(localContext as AndContext)._rhs = this.exprNot()
                            }
                        }
                    }
                    this.state = 1230
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 153, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public exprNot(): ExprNotContext {
        let localContext = new ExprNotContext(this.context, this.state)
        this.enterRule(localContext, 198, PartiQLParser.RULE_exprNot)
        try {
            this.state = 1234
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new NotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1231
                        ;(localContext as NotContext)._op = this.match(PartiQLParser.NOT)
                        this.state = 1232
                        ;(localContext as NotContext)._rhs = this.exprNot()
                    }
                    break
                case PartiQLParser.ANY:
                case PartiQLParser.AVG:
                case PartiQLParser.BIT_LENGTH:
                case PartiQLParser.CASE:
                case PartiQLParser.CAST:
                case PartiQLParser.CHARACTER_LENGTH:
                case PartiQLParser.CHAR_LENGTH:
                case PartiQLParser.COALESCE:
                case PartiQLParser.COUNT:
                case PartiQLParser.CURRENT_DATE:
                case PartiQLParser.CURRENT_USER:
                case PartiQLParser.DATE:
                case PartiQLParser.EVERY:
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.EXISTS:
                case PartiQLParser.EXTRACT:
                case PartiQLParser.DATE_ADD:
                case PartiQLParser.DATE_DIFF:
                case PartiQLParser.FALSE:
                case PartiQLParser.LOWER:
                case PartiQLParser.MAX:
                case PartiQLParser.MIN:
                case PartiQLParser.NULL:
                case PartiQLParser.NULLIF:
                case PartiQLParser.OCTET_LENGTH:
                case PartiQLParser.OVERLAY:
                case PartiQLParser.POSITION:
                case PartiQLParser.SIZE:
                case PartiQLParser.SOME:
                case PartiQLParser.SUBSTRING:
                case PartiQLParser.SUM:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRIM:
                case PartiQLParser.TRUE:
                case PartiQLParser.UPPER:
                case PartiQLParser.VALUES:
                case PartiQLParser.LAG:
                case PartiQLParser.LEAD:
                case PartiQLParser.CAN_CAST:
                case PartiQLParser.CAN_LOSSLESS_CAST:
                case PartiQLParser.MISSING:
                case PartiQLParser.LIST:
                case PartiQLParser.SEXP:
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                case PartiQLParser.BRACE_LEFT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.QUESTION_MARK:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                case PartiQLParser.ION_CLOSURE:
                    localContext = new ExprNotBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1233
                        ;(localContext as ExprNotBaseContext)._parent = this.exprPredicate(0)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public exprPredicate(): ExprPredicateContext
    public exprPredicate(_p: number): ExprPredicateContext
    public exprPredicate(_p?: number): ExprPredicateContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new ExprPredicateContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 200
        this.enterRecursionRule(localContext, 200, PartiQLParser.RULE_exprPredicate, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new PredicateBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1237
                    ;(localContext as PredicateBaseContext)._parent = this.mathOp00(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1284
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 162, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1282
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 161, this.context)) {
                                case 1:
                                    {
                                        localContext = new PredicateComparisonContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateComparisonContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1239
                                        if (!this.precpred(this.context, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 7)')
                                        }
                                        this.state = 1240
                                        ;(localContext as PredicateComparisonContext)._op = this.tokenStream.LT(1)
                                        _la = this.tokenStream.LA(1)
                                        if (!(((_la - 281) & ~0x1f) === 0 && ((1 << (_la - 281)) & 111) !== 0)) {
                                            ;(localContext as PredicateComparisonContext)._op =
                                                this.errorHandler.recoverInline(this)
                                        } else {
                                            this.errorHandler.reportMatch(this)
                                            this.consume()
                                        }
                                        this.state = 1241
                                        ;(localContext as PredicateComparisonContext)._rhs = this.mathOp00(0)
                                    }
                                    break
                                case 2:
                                    {
                                        localContext = new PredicateIsContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateIsContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1242
                                        if (!this.precpred(this.context, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                        }
                                        this.state = 1243
                                        this.match(PartiQLParser.IS)
                                        this.state = 1245
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1244
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1247
                                        this.type_()
                                    }
                                    break
                                case 3:
                                    {
                                        localContext = new PredicateInContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateInContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1248
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1250
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1249
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1252
                                        this.match(PartiQLParser.IN)
                                        this.state = 1253
                                        this.match(PartiQLParser.PAREN_LEFT)
                                        this.state = 1254
                                        this.expr()
                                        this.state = 1255
                                        this.match(PartiQLParser.PAREN_RIGHT)
                                    }
                                    break
                                case 4:
                                    {
                                        localContext = new PredicateInContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateInContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1257
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1259
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1258
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1261
                                        this.match(PartiQLParser.IN)
                                        this.state = 1262
                                        ;(localContext as PredicateInContext)._rhs = this.mathOp00(0)
                                    }
                                    break
                                case 5:
                                    {
                                        localContext = new PredicateLikeContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateLikeContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1263
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1265
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1264
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1267
                                        this.match(PartiQLParser.LIKE)
                                        this.state = 1268
                                        ;(localContext as PredicateLikeContext)._rhs = this.mathOp00(0)
                                        this.state = 1271
                                        this.errorHandler.sync(this)
                                        switch (this.interpreter.adaptivePredict(this.tokenStream, 159, this.context)) {
                                            case 1:
                                                {
                                                    this.state = 1269
                                                    this.match(PartiQLParser.ESCAPE)
                                                    this.state = 1270
                                                    ;(localContext as PredicateLikeContext)._escape = this.expr()
                                                }
                                                break
                                        }
                                    }
                                    break
                                case 6:
                                    {
                                        localContext = new PredicateBetweenContext(
                                            new ExprPredicateContext(parentContext, parentState)
                                        )
                                        ;(localContext as PredicateBetweenContext)._lhs = previousContext
                                        this.pushNewRecursionContext(
                                            localContext,
                                            _startState,
                                            PartiQLParser.RULE_exprPredicate
                                        )
                                        this.state = 1273
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1275
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1274
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1277
                                        this.match(PartiQLParser.BETWEEN)
                                        this.state = 1278
                                        ;(localContext as PredicateBetweenContext)._lower = this.mathOp00(0)
                                        this.state = 1279
                                        this.match(PartiQLParser.AND)
                                        this.state = 1280
                                        ;(localContext as PredicateBetweenContext)._upper = this.mathOp00(0)
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1286
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 162, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }

    public mathOp00(): MathOp00Context
    public mathOp00(_p: number): MathOp00Context
    public mathOp00(_p?: number): MathOp00Context {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new MathOp00Context(this.context, parentState)
        let previousContext = localContext
        const _startState = 202
        this.enterRecursionRule(localContext, 202, PartiQLParser.RULE_mathOp00, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1288
                    localContext._parent = this.mathOp01(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1295
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 163, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new MathOp00Context(parentContext, parentState)
                                localContext._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_mathOp00)
                                this.state = 1290
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1291
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 279 || _la === 285)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1292
                                localContext._rhs = this.mathOp01(0)
                            }
                        }
                    }
                    this.state = 1297
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 163, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }

    public mathOp01(): MathOp01Context
    public mathOp01(_p: number): MathOp01Context
    public mathOp01(_p?: number): MathOp01Context {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new MathOp01Context(this.context, parentState)
        let previousContext = localContext
        const _startState = 204
        this.enterRecursionRule(localContext, 204, PartiQLParser.RULE_mathOp01, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1299
                    localContext._parent = this.mathOp02(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1306
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 164, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new MathOp01Context(parentContext, parentState)
                                localContext._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_mathOp01)
                                this.state = 1301
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1302
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 271 || _la === 272)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1303
                                localContext._rhs = this.mathOp02(0)
                            }
                        }
                    }
                    this.state = 1308
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 164, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }

    public mathOp02(): MathOp02Context
    public mathOp02(_p: number): MathOp02Context
    public mathOp02(_p?: number): MathOp02Context {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new MathOp02Context(this.context, parentState)
        let previousContext = localContext
        const _startState = 206
        this.enterRecursionRule(localContext, 206, PartiQLParser.RULE_mathOp02, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1310
                    localContext._parent = this.valueExpr()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1317
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 165, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new MathOp02Context(parentContext, parentState)
                                localContext._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_mathOp02)
                                this.state = 1312
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1313
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(((_la - 273) & ~0x1f) === 0 && ((1 << (_la - 273)) & 19) !== 0)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1314
                                localContext._rhs = this.valueExpr()
                            }
                        }
                    }
                    this.state = 1319
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 165, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public valueExpr(): ValueExprContext {
        const localContext = new ValueExprContext(this.context, this.state)
        this.enterRule(localContext, 208, PartiQLParser.RULE_valueExpr)
        let _la: number
        try {
            this.state = 1323
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1320
                        localContext._sign = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 271 || _la === 272)) {
                            localContext._sign = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1321
                        localContext._rhs = this.valueExpr()
                    }
                    break
                case PartiQLParser.ANY:
                case PartiQLParser.AVG:
                case PartiQLParser.BIT_LENGTH:
                case PartiQLParser.CASE:
                case PartiQLParser.CAST:
                case PartiQLParser.CHARACTER_LENGTH:
                case PartiQLParser.CHAR_LENGTH:
                case PartiQLParser.COALESCE:
                case PartiQLParser.COUNT:
                case PartiQLParser.CURRENT_DATE:
                case PartiQLParser.CURRENT_USER:
                case PartiQLParser.DATE:
                case PartiQLParser.EVERY:
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.EXISTS:
                case PartiQLParser.EXTRACT:
                case PartiQLParser.DATE_ADD:
                case PartiQLParser.DATE_DIFF:
                case PartiQLParser.FALSE:
                case PartiQLParser.LOWER:
                case PartiQLParser.MAX:
                case PartiQLParser.MIN:
                case PartiQLParser.NULL:
                case PartiQLParser.NULLIF:
                case PartiQLParser.OCTET_LENGTH:
                case PartiQLParser.OVERLAY:
                case PartiQLParser.POSITION:
                case PartiQLParser.SIZE:
                case PartiQLParser.SOME:
                case PartiQLParser.SUBSTRING:
                case PartiQLParser.SUM:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRIM:
                case PartiQLParser.TRUE:
                case PartiQLParser.UPPER:
                case PartiQLParser.VALUES:
                case PartiQLParser.LAG:
                case PartiQLParser.LEAD:
                case PartiQLParser.CAN_CAST:
                case PartiQLParser.CAN_LOSSLESS_CAST:
                case PartiQLParser.MISSING:
                case PartiQLParser.LIST:
                case PartiQLParser.SEXP:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                case PartiQLParser.BRACE_LEFT:
                case PartiQLParser.PAREN_LEFT:
                case PartiQLParser.QUESTION_MARK:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                case PartiQLParser.ION_CLOSURE:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1322
                        localContext._parent = this.exprPrimary(0)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public exprPrimary(): ExprPrimaryContext
    public exprPrimary(_p: number): ExprPrimaryContext
    public exprPrimary(_p?: number): ExprPrimaryContext {
        if (_p === undefined) {
            _p = 0
        }

        const parentContext = this.context
        const parentState = this.state
        let localContext = new ExprPrimaryContext(this.context, parentState)
        let previousContext = localContext
        const _startState = 210
        this.enterRecursionRule(localContext, 210, PartiQLParser.RULE_exprPrimary, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1346
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 167, this.context)) {
                    case 1:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1326
                            this.exprTerm()
                        }
                        break
                    case 2:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1327
                            this.cast()
                        }
                        break
                    case 3:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1328
                            this.sequenceConstructor()
                        }
                        break
                    case 4:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1329
                            this.substring()
                        }
                        break
                    case 5:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1330
                            this.position()
                        }
                        break
                    case 6:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1331
                            this.overlay()
                        }
                        break
                    case 7:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1332
                            this.canCast()
                        }
                        break
                    case 8:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1333
                            this.canLosslessCast()
                        }
                        break
                    case 9:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1334
                            this.extract()
                        }
                        break
                    case 10:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1335
                            this.coalesce()
                        }
                        break
                    case 11:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1336
                            this.dateFunction()
                        }
                        break
                    case 12:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1337
                            this.aggregate()
                        }
                        break
                    case 13:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1338
                            this.trimFunction()
                        }
                        break
                    case 14:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1339
                            this.functionCall()
                        }
                        break
                    case 15:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1340
                            this.nullIf()
                        }
                        break
                    case 16:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1341
                            this.exprGraphMatchMany()
                        }
                        break
                    case 17:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1342
                            this.caseExpr()
                        }
                        break
                    case 18:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1343
                            this.valueList()
                        }
                        break
                    case 19:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1344
                            this.values()
                        }
                        break
                    case 20:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1345
                            this.windowFunction()
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1356
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 169, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            {
                                localContext = new ExprPrimaryPathContext(
                                    new ExprPrimaryContext(parentContext, parentState)
                                )
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_exprPrimary)
                                this.state = 1348
                                if (!this.precpred(this.context, 6)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                }
                                this.state = 1350
                                this.errorHandler.sync(this)
                                alternative = 1
                                do {
                                    switch (alternative) {
                                        case 1:
                                            {
                                                {
                                                    this.state = 1349
                                                    this.pathStep()
                                                }
                                            }
                                            break
                                        default:
                                            throw new antlr.NoViableAltException(this)
                                    }
                                    this.state = 1352
                                    this.errorHandler.sync(this)
                                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 168, this.context)
                                } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                            }
                        }
                    }
                    this.state = 1358
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 169, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public exprTerm(): ExprTermContext {
        let localContext = new ExprTermContext(this.context, this.state)
        this.enterRule(localContext, 212, PartiQLParser.RULE_exprTerm)
        try {
            this.state = 1370
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    localContext = new ExprTermWrappedQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1359
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1360
                        this.expr()
                        this.state = 1361
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.CURRENT_USER:
                    localContext = new ExprTermCurrentUserContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1363
                        this.match(PartiQLParser.CURRENT_USER)
                    }
                    break
                case PartiQLParser.CURRENT_DATE:
                    localContext = new ExprTermCurrentDateContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1364
                        this.match(PartiQLParser.CURRENT_DATE)
                    }
                    break
                case PartiQLParser.QUESTION_MARK:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1365
                        this.parameter()
                    }
                    break
                case PartiQLParser.EXCLUDED:
                case PartiQLParser.AT_SIGN:
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1366
                        this.varRefExpr()
                    }
                    break
                case PartiQLParser.DATE:
                case PartiQLParser.FALSE:
                case PartiQLParser.NULL:
                case PartiQLParser.TIME:
                case PartiQLParser.TIMESTAMP:
                case PartiQLParser.TRUE:
                case PartiQLParser.MISSING:
                case PartiQLParser.LITERAL_STRING:
                case PartiQLParser.LITERAL_INTEGER:
                case PartiQLParser.LITERAL_DECIMAL:
                case PartiQLParser.ION_CLOSURE:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1367
                        this.literal()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1368
                        this.collection()
                    }
                    break
                case PartiQLParser.BRACE_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1369
                        this.tuple()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public nullIf(): NullIfContext {
        const localContext = new NullIfContext(this.context, this.state)
        this.enterRule(localContext, 214, PartiQLParser.RULE_nullIf)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1372
                this.match(PartiQLParser.NULLIF)
                this.state = 1373
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1374
                this.expr()
                this.state = 1375
                this.match(PartiQLParser.COMMA)
                this.state = 1376
                this.expr()
                this.state = 1377
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public coalesce(): CoalesceContext {
        const localContext = new CoalesceContext(this.context, this.state)
        this.enterRule(localContext, 216, PartiQLParser.RULE_coalesce)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1379
                this.match(PartiQLParser.COALESCE)
                this.state = 1380
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1381
                this.expr()
                this.state = 1386
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1382
                            this.match(PartiQLParser.COMMA)
                            this.state = 1383
                            this.expr()
                        }
                    }
                    this.state = 1388
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1389
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public caseExpr(): CaseExprContext {
        const localContext = new CaseExprContext(this.context, this.state)
        this.enterRule(localContext, 218, PartiQLParser.RULE_caseExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1391
                this.match(PartiQLParser.CASE)
                this.state = 1393
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1392
                        localContext._case_ = this.expr()
                    }
                }

                this.state = 1400
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1395
                            this.match(PartiQLParser.WHEN)
                            this.state = 1396
                            localContext._expr = this.expr()
                            localContext._whens.push(localContext._expr!)
                            this.state = 1397
                            this.match(PartiQLParser.THEN)
                            this.state = 1398
                            localContext._expr = this.expr()
                            localContext._thens.push(localContext._expr!)
                        }
                    }
                    this.state = 1402
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 223)
                this.state = 1406
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 71) {
                    {
                        this.state = 1404
                        this.match(PartiQLParser.ELSE)
                        this.state = 1405
                        localContext._else_ = this.expr()
                    }
                }

                this.state = 1408
                this.match(PartiQLParser.END)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public values(): ValuesContext {
        const localContext = new ValuesContext(this.context, this.state)
        this.enterRule(localContext, 220, PartiQLParser.RULE_values)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1410
                this.match(PartiQLParser.VALUES)
                this.state = 1411
                this.valueRow()
                this.state = 1416
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 175, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 1412
                                this.match(PartiQLParser.COMMA)
                                this.state = 1413
                                this.valueRow()
                            }
                        }
                    }
                    this.state = 1418
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 175, this.context)
                }
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public valueRow(): ValueRowContext {
        const localContext = new ValueRowContext(this.context, this.state)
        this.enterRule(localContext, 222, PartiQLParser.RULE_valueRow)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1419
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1420
                this.expr()
                this.state = 1425
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1421
                            this.match(PartiQLParser.COMMA)
                            this.state = 1422
                            this.expr()
                        }
                    }
                    this.state = 1427
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1428
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public valueList(): ValueListContext {
        const localContext = new ValueListContext(this.context, this.state)
        this.enterRule(localContext, 224, PartiQLParser.RULE_valueList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1430
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1431
                this.expr()
                this.state = 1434
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1432
                            this.match(PartiQLParser.COMMA)
                            this.state = 1433
                            this.expr()
                        }
                    }
                    this.state = 1436
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 270)
                this.state = 1438
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public sequenceConstructor(): SequenceConstructorContext {
        const localContext = new SequenceConstructorContext(this.context, this.state)
        this.enterRule(localContext, 226, PartiQLParser.RULE_sequenceConstructor)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1440
                localContext._datatype = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 266 || _la === 267)) {
                    localContext._datatype = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1441
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1450
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1442
                        this.expr()
                        this.state = 1447
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1443
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1444
                                    this.expr()
                                }
                            }
                            this.state = 1449
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1452
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public substring(): SubstringContext {
        const localContext = new SubstringContext(this.context, this.state)
        this.enterRule(localContext, 228, PartiQLParser.RULE_substring)
        let _la: number
        try {
            this.state = 1480
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 184, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1454
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1455
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1456
                        this.expr()
                        this.state = 1463
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1457
                                this.match(PartiQLParser.COMMA)
                                this.state = 1458
                                this.expr()
                                this.state = 1461
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 270) {
                                    {
                                        this.state = 1459
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1460
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1465
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1467
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1468
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1469
                        this.expr()
                        this.state = 1476
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 95) {
                            {
                                this.state = 1470
                                this.match(PartiQLParser.FROM)
                                this.state = 1471
                                this.expr()
                                this.state = 1474
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 92) {
                                    {
                                        this.state = 1472
                                        this.match(PartiQLParser.FOR)
                                        this.state = 1473
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1478
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public position(): PositionContext {
        const localContext = new PositionContext(this.context, this.state)
        this.enterRule(localContext, 230, PartiQLParser.RULE_position)
        try {
            this.state = 1496
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 185, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1482
                        this.match(PartiQLParser.POSITION)
                        this.state = 1483
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1484
                        this.expr()
                        this.state = 1485
                        this.match(PartiQLParser.COMMA)
                        this.state = 1486
                        this.expr()
                        this.state = 1487
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1489
                        this.match(PartiQLParser.POSITION)
                        this.state = 1490
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1491
                        this.expr()
                        this.state = 1492
                        this.match(PartiQLParser.IN)
                        this.state = 1493
                        this.expr()
                        this.state = 1494
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public overlay(): OverlayContext {
        const localContext = new OverlayContext(this.context, this.state)
        this.enterRule(localContext, 232, PartiQLParser.RULE_overlay)
        let _la: number
        try {
            this.state = 1524
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 188, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1498
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1499
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1500
                        this.expr()
                        this.state = 1501
                        this.match(PartiQLParser.COMMA)
                        this.state = 1502
                        this.expr()
                        this.state = 1503
                        this.match(PartiQLParser.COMMA)
                        this.state = 1504
                        this.expr()
                        this.state = 1507
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1505
                                this.match(PartiQLParser.COMMA)
                                this.state = 1506
                                this.expr()
                            }
                        }

                        this.state = 1509
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1511
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1512
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1513
                        this.expr()
                        this.state = 1514
                        this.match(PartiQLParser.PLACING)
                        this.state = 1515
                        this.expr()
                        this.state = 1516
                        this.match(PartiQLParser.FROM)
                        this.state = 1517
                        this.expr()
                        this.state = 1520
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 92) {
                            {
                                this.state = 1518
                                this.match(PartiQLParser.FOR)
                                this.state = 1519
                                this.expr()
                            }
                        }

                        this.state = 1522
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public aggregate(): AggregateContext {
        let localContext = new AggregateContext(this.context, this.state)
        this.enterRule(localContext, 234, PartiQLParser.RULE_aggregate)
        let _la: number
        try {
            this.state = 1538
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 190, this.context)) {
                case 1:
                    localContext = new CountAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1526
                        ;(localContext as CountAllContext)._func = this.match(PartiQLParser.COUNT)
                        this.state = 1527
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1528
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 1529
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    localContext = new AggregateBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1530
                        ;(localContext as AggregateBaseContext)._func = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (
                            !(
                                _la === 8 ||
                                _la === 15 ||
                                _la === 44 ||
                                _la === 75 ||
                                _la === 131 ||
                                _la === 132 ||
                                _la === 189 ||
                                _la === 196
                            )
                        ) {
                            ;(localContext as AggregateBaseContext)._func = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1531
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1533
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 1532
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 1535
                        this.expr()
                        this.state = 1536
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public windowFunction(): WindowFunctionContext {
        let localContext = new WindowFunctionContext(this.context, this.state)
        this.enterRule(localContext, 236, PartiQLParser.RULE_windowFunction)
        let _la: number
        try {
            localContext = new LagLeadFunctionContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1540
                ;(localContext as LagLeadFunctionContext)._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 230 || _la === 231)) {
                    ;(localContext as LagLeadFunctionContext)._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1541
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1542
                this.expr()
                this.state = 1549
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 270) {
                    {
                        this.state = 1543
                        this.match(PartiQLParser.COMMA)
                        this.state = 1544
                        this.expr()
                        this.state = 1547
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1545
                                this.match(PartiQLParser.COMMA)
                                this.state = 1546
                                this.expr()
                            }
                        }
                    }
                }

                this.state = 1551
                this.match(PartiQLParser.PAREN_RIGHT)
                this.state = 1552
                this.over()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public cast(): CastContext {
        const localContext = new CastContext(this.context, this.state)
        this.enterRule(localContext, 238, PartiQLParser.RULE_cast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1554
                this.match(PartiQLParser.CAST)
                this.state = 1555
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1556
                this.expr()
                this.state = 1557
                this.match(PartiQLParser.AS)
                this.state = 1558
                this.type_()
                this.state = 1559
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public canLosslessCast(): CanLosslessCastContext {
        const localContext = new CanLosslessCastContext(this.context, this.state)
        this.enterRule(localContext, 240, PartiQLParser.RULE_canLosslessCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1561
                this.match(PartiQLParser.CAN_LOSSLESS_CAST)
                this.state = 1562
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1563
                this.expr()
                this.state = 1564
                this.match(PartiQLParser.AS)
                this.state = 1565
                this.type_()
                this.state = 1566
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public canCast(): CanCastContext {
        const localContext = new CanCastContext(this.context, this.state)
        this.enterRule(localContext, 242, PartiQLParser.RULE_canCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1568
                this.match(PartiQLParser.CAN_CAST)
                this.state = 1569
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1570
                this.expr()
                this.state = 1571
                this.match(PartiQLParser.AS)
                this.state = 1572
                this.type_()
                this.state = 1573
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public extract(): ExtractContext {
        const localContext = new ExtractContext(this.context, this.state)
        this.enterRule(localContext, 244, PartiQLParser.RULE_extract)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1575
                this.match(PartiQLParser.EXTRACT)
                this.state = 1576
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1577
                this.match(PartiQLParser.IDENTIFIER)
                this.state = 1578
                this.match(PartiQLParser.FROM)
                this.state = 1579
                localContext._rhs = this.expr()
                this.state = 1580
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public trimFunction(): TrimFunctionContext {
        const localContext = new TrimFunctionContext(this.context, this.state)
        this.enterRule(localContext, 246, PartiQLParser.RULE_trimFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1582
                localContext._func = this.match(PartiQLParser.TRIM)
                this.state = 1583
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1591
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 195, this.context)) {
                    case 1:
                        {
                            this.state = 1585
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 193, this.context)) {
                                case 1:
                                    {
                                        this.state = 1584
                                        localContext._mod = this.match(PartiQLParser.IDENTIFIER)
                                    }
                                    break
                            }
                            this.state = 1588
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            if (
                                ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                                (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                                (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                                (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                                (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                                (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                                (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                                (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                            ) {
                                {
                                    this.state = 1587
                                    localContext._sub = this.expr()
                                }
                            }

                            this.state = 1590
                            this.match(PartiQLParser.FROM)
                        }
                        break
                }
                this.state = 1593
                localContext._target = this.expr()
                this.state = 1594
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public dateFunction(): DateFunctionContext {
        const localContext = new DateFunctionContext(this.context, this.state)
        this.enterRule(localContext, 248, PartiQLParser.RULE_dateFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1596
                localContext._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 86 || _la === 87)) {
                    localContext._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1597
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1598
                localContext._dt = this.match(PartiQLParser.IDENTIFIER)
                this.state = 1599
                this.match(PartiQLParser.COMMA)
                this.state = 1600
                this.expr()
                this.state = 1601
                this.match(PartiQLParser.COMMA)
                this.state = 1602
                this.expr()
                this.state = 1603
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public functionCall(): FunctionCallContext {
        const localContext = new FunctionCallContext(this.context, this.state)
        this.enterRule(localContext, 250, PartiQLParser.RULE_functionCall)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1605
                this.functionName()
                this.state = 1606
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1615
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1607
                        this.expr()
                        this.state = 1612
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1608
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1609
                                    this.expr()
                                }
                            }
                            this.state = 1614
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1617
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public functionName(): FunctionNameContext {
        let localContext = new FunctionNameContext(this.context, this.state)
        this.enterRule(localContext, 252, PartiQLParser.RULE_functionName)
        let _la: number
        try {
            let alternative: number
            this.state = 1637
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 200, this.context)) {
                case 1:
                    localContext = new FunctionNameReservedContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1624
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 303 || _la === 304) {
                            {
                                {
                                    this.state = 1619
                                    ;(localContext as FunctionNameReservedContext)._symbolPrimitive =
                                        this.symbolPrimitive()
                                    ;(localContext as FunctionNameReservedContext)._qualifier.push(
                                        (localContext as FunctionNameReservedContext)._symbolPrimitive!
                                    )
                                    this.state = 1620
                                    this.match(PartiQLParser.PERIOD)
                                }
                            }
                            this.state = 1626
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 1627
                        ;(localContext as FunctionNameReservedContext)._name = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (
                            !(
                                (((_la - 19) & ~0x1f) === 0 && ((1 << (_la - 19)) & 33555969) !== 0) ||
                                _la === 82 ||
                                _la === 129 ||
                                _la === 145 ||
                                _la === 187 ||
                                _la === 213
                            )
                        ) {
                            ;(localContext as FunctionNameReservedContext)._name = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                    }
                    break
                case 2:
                    localContext = new FunctionNameSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1633
                        this.errorHandler.sync(this)
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 199, this.context)
                        while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                            if (alternative === 1) {
                                {
                                    {
                                        this.state = 1628
                                        ;(localContext as FunctionNameSymbolContext)._symbolPrimitive =
                                            this.symbolPrimitive()
                                        ;(localContext as FunctionNameSymbolContext)._qualifier.push(
                                            (localContext as FunctionNameSymbolContext)._symbolPrimitive!
                                        )
                                        this.state = 1629
                                        this.match(PartiQLParser.PERIOD)
                                    }
                                }
                            }
                            this.state = 1635
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 199, this.context)
                        }
                        this.state = 1636
                        ;(localContext as FunctionNameSymbolContext)._name = this.symbolPrimitive()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public pathStep(): PathStepContext {
        let localContext = new PathStepContext(this.context, this.state)
        this.enterRule(localContext, 254, PartiQLParser.RULE_pathStep)
        try {
            this.state = 1650
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)) {
                case 1:
                    localContext = new PathStepIndexExprContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1639
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1640
                        ;(localContext as PathStepIndexExprContext)._key = this.expr()
                        this.state = 1641
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathStepIndexAllContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1643
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1644
                        ;(localContext as PathStepIndexAllContext)._all = this.match(PartiQLParser.ASTERISK)
                        this.state = 1645
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathStepDotExprContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1646
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1647
                        ;(localContext as PathStepDotExprContext)._key = this.symbolPrimitive()
                    }
                    break
                case 4:
                    localContext = new PathStepDotAllContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1648
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1649
                        ;(localContext as PathStepDotAllContext)._all = this.match(PartiQLParser.ASTERISK)
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public exprGraphMatchMany(): ExprGraphMatchManyContext {
        const localContext = new ExprGraphMatchManyContext(this.context, this.state)
        this.enterRule(localContext, 256, PartiQLParser.RULE_exprGraphMatchMany)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1652
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1653
                this.exprPrimary(0)
                this.state = 1654
                this.match(PartiQLParser.MATCH)
                this.state = 1655
                this.gpmlPatternList()
                this.state = 1656
                this.match(PartiQLParser.PAREN_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public exprGraphMatchOne(): ExprGraphMatchOneContext {
        const localContext = new ExprGraphMatchOneContext(this.context, this.state)
        this.enterRule(localContext, 258, PartiQLParser.RULE_exprGraphMatchOne)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1658
                this.exprPrimary(0)
                this.state = 1659
                this.match(PartiQLParser.MATCH)
                this.state = 1660
                this.gpmlPattern()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public parameter(): ParameterContext {
        const localContext = new ParameterContext(this.context, this.state)
        this.enterRule(localContext, 260, PartiQLParser.RULE_parameter)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1662
                this.match(PartiQLParser.QUESTION_MARK)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public varRefExpr(): VarRefExprContext {
        let localContext = new VarRefExprContext(this.context, this.state)
        this.enterRule(localContext, 262, PartiQLParser.RULE_varRefExpr)
        let _la: number
        try {
            this.state = 1672
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 204, this.context)) {
                case 1:
                    localContext = new VariableIdentifierContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1665
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1664
                                ;(localContext as VariableIdentifierContext)._qualifier = this.match(
                                    PartiQLParser.AT_SIGN
                                )
                            }
                        }

                        this.state = 1667
                        ;(localContext as VariableIdentifierContext)._ident = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 303 || _la === 304)) {
                            ;(localContext as VariableIdentifierContext)._ident = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                    }
                    break
                case 2:
                    localContext = new VariableKeywordContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1669
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1668
                                ;(localContext as VariableKeywordContext)._qualifier = this.match(PartiQLParser.AT_SIGN)
                            }
                        }

                        this.state = 1671
                        ;(localContext as VariableKeywordContext)._key = this.nonReservedKeywords()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public nonReservedKeywords(): NonReservedKeywordsContext {
        const localContext = new NonReservedKeywordsContext(this.context, this.state)
        this.enterRule(localContext, 264, PartiQLParser.RULE_nonReservedKeywords)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1674
                this.match(PartiQLParser.EXCLUDED)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public collection(): CollectionContext {
        const localContext = new CollectionContext(this.context, this.state)
        this.enterRule(localContext, 266, PartiQLParser.RULE_collection)
        try {
            this.state = 1678
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1676
                        this.array()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1677
                        this.bag()
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public array(): ArrayContext {
        const localContext = new ArrayContext(this.context, this.state)
        this.enterRule(localContext, 268, PartiQLParser.RULE_array)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1680
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1689
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1681
                        this.expr()
                        this.state = 1686
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1682
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1683
                                    this.expr()
                                }
                            }
                            this.state = 1688
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1691
                this.match(PartiQLParser.BRACKET_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public bag(): BagContext {
        const localContext = new BagContext(this.context, this.state)
        this.enterRule(localContext, 270, PartiQLParser.RULE_bag)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1693
                this.match(PartiQLParser.ANGLE_DOUBLE_LEFT)
                this.state = 1702
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1694
                        this.expr()
                        this.state = 1699
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1695
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1696
                                    this.expr()
                                }
                            }
                            this.state = 1701
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1704
                this.match(PartiQLParser.ANGLE_DOUBLE_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tuple(): TupleContext {
        const localContext = new TupleContext(this.context, this.state)
        this.enterRule(localContext, 272, PartiQLParser.RULE_tuple)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1706
                this.match(PartiQLParser.BRACE_LEFT)
                this.state = 1715
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 266) & ~0x1f) === 0 && ((1 << (_la - 266)) & 356516451) !== 0) ||
                    (((_la - 298) & ~0x1f) === 0 && ((1 << (_la - 298)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1707
                        this.pair()
                        this.state = 1712
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1708
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1709
                                    this.pair()
                                }
                            }
                            this.state = 1714
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1717
                this.match(PartiQLParser.BRACE_RIGHT)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public pair(): PairContext {
        const localContext = new PairContext(this.context, this.state)
        this.enterRule(localContext, 274, PartiQLParser.RULE_pair)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1719
                localContext._lhs = this.expr()
                this.state = 1720
                this.match(PartiQLParser.COLON)
                this.state = 1721
                localContext._rhs = this.expr()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public literal(): LiteralContext {
        let localContext = new LiteralContext(this.context, this.state)
        this.enterRule(localContext, 276, PartiQLParser.RULE_literal)
        let _la: number
        try {
            this.state = 1757
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NULL:
                    localContext = new LiteralNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1723
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.MISSING:
                    localContext = new LiteralMissingContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1724
                        this.match(PartiQLParser.MISSING)
                    }
                    break
                case PartiQLParser.TRUE:
                    localContext = new LiteralTrueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1725
                        this.match(PartiQLParser.TRUE)
                    }
                    break
                case PartiQLParser.FALSE:
                    localContext = new LiteralFalseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1726
                        this.match(PartiQLParser.FALSE)
                    }
                    break
                case PartiQLParser.LITERAL_STRING:
                    localContext = new LiteralStringContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1727
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.LITERAL_INTEGER:
                    localContext = new LiteralIntegerContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1728
                        this.match(PartiQLParser.LITERAL_INTEGER)
                    }
                    break
                case PartiQLParser.LITERAL_DECIMAL:
                    localContext = new LiteralDecimalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1729
                        this.match(PartiQLParser.LITERAL_DECIMAL)
                    }
                    break
                case PartiQLParser.ION_CLOSURE:
                    localContext = new LiteralIonContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1730
                        this.match(PartiQLParser.ION_CLOSURE)
                    }
                    break
                case PartiQLParser.DATE:
                    localContext = new LiteralDateContext(localContext)
                    this.enterOuterAlt(localContext, 9)
                    {
                        this.state = 1731
                        this.match(PartiQLParser.DATE)
                        this.state = 1732
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIME:
                    localContext = new LiteralTimeContext(localContext)
                    this.enterOuterAlt(localContext, 10)
                    {
                        this.state = 1733
                        this.match(PartiQLParser.TIME)
                        this.state = 1737
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1734
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1735
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1736
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1742
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1739
                                this.match(PartiQLParser.WITH)
                                this.state = 1740
                                this.match(PartiQLParser.TIME)
                                this.state = 1741
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1744
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIMESTAMP:
                    localContext = new LiteralTimestampContext(localContext)
                    this.enterOuterAlt(localContext, 11)
                    {
                        this.state = 1745
                        this.match(PartiQLParser.TIMESTAMP)
                        this.state = 1749
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1746
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1747
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1748
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1754
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1751
                                this.match(PartiQLParser.WITH)
                                this.state = 1752
                                this.match(PartiQLParser.TIME)
                                this.state = 1753
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1756
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                default:
                    throw new antlr.NoViableAltException(this)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public type_(): TypeContext {
        let localContext = new TypeContext(this.context, this.state)
        this.enterRule(localContext, 278, PartiQLParser.RULE_type)
        let _la: number
        try {
            this.state = 1797
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 223, this.context)) {
                case 1:
                    localContext = new TypeAtomicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1759
                        ;(localContext as TypeAtomicContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (
                            !(
                                ((_la & ~0x1f) === 0 && ((1 << _la) & 201326848) !== 0) ||
                                _la === 53 ||
                                (((_la - 113) & ~0x1f) === 0 && ((1 << (_la - 113)) & 268435459) !== 0) ||
                                _la === 170 ||
                                _la === 188 ||
                                (((_la - 236) & ~0x1f) === 0 && ((1 << (_la - 236)) & 4294934529) !== 0) ||
                                _la === 268
                            )
                        ) {
                            ;(localContext as TypeAtomicContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                    }
                    break
                case 2:
                    localContext = new TypeAtomicContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1760
                        ;(localContext as TypeAtomicContext)._datatype = this.match(PartiQLParser.DOUBLE)
                        this.state = 1761
                        this.match(PartiQLParser.PRECISION)
                    }
                    break
                case 3:
                    localContext = new TypeArgSingleContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1762
                        ;(localContext as TypeArgSingleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 26 || _la === 27 || _la === 91 || _la === 220)) {
                            ;(localContext as TypeArgSingleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1766
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 217, this.context)) {
                            case 1:
                                {
                                    this.state = 1763
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1764
                                    ;(localContext as TypeArgSingleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1765
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                    break
                case 4:
                    localContext = new TypeVarCharContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1768
                        this.match(PartiQLParser.CHARACTER)
                        this.state = 1769
                        this.match(PartiQLParser.VARYING)
                        this.state = 1773
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 218, this.context)) {
                            case 1:
                                {
                                    this.state = 1770
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1771
                                    ;(localContext as TypeVarCharContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1772
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                    break
                case 5:
                    localContext = new TypeArgDoubleContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1775
                        ;(localContext as TypeArgDoubleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 55 || _la === 56 || _la === 144)) {
                            ;(localContext as TypeArgDoubleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1783
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 220, this.context)) {
                            case 1:
                                {
                                    this.state = 1776
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1777
                                    ;(localContext as TypeArgDoubleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1780
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    if (_la === 270) {
                                        {
                                            this.state = 1778
                                            this.match(PartiQLParser.COMMA)
                                            this.state = 1779
                                            ;(localContext as TypeArgDoubleContext)._arg1 = this.match(
                                                PartiQLParser.LITERAL_INTEGER
                                            )
                                        }
                                    }

                                    this.state = 1782
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                    break
                case 6:
                    localContext = new TypeTimeZoneContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1785
                        ;(localContext as TypeTimeZoneContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 201 || _la === 202)) {
                            ;(localContext as TypeTimeZoneContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1789
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 221, this.context)) {
                            case 1:
                                {
                                    this.state = 1786
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1787
                                    ;(localContext as TypeTimeZoneContext)._precision = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1788
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                        this.state = 1794
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 222, this.context)) {
                            case 1:
                                {
                                    this.state = 1791
                                    this.match(PartiQLParser.WITH)
                                    this.state = 1792
                                    this.match(PartiQLParser.TIME)
                                    this.state = 1793
                                    this.match(PartiQLParser.ZONE)
                                }
                                break
                        }
                    }
                    break
                case 7:
                    localContext = new TypeCustomContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1796
                        this.symbolPrimitive()
                    }
                    break
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }

    public override sempred(
        localContext: antlr.ParserRuleContext | null,
        ruleIndex: number,
        predIndex: number
    ): boolean {
        switch (ruleIndex) {
            case 82:
                return this.labelSpec_sempred(localContext as LabelSpecContext, predIndex)
            case 83:
                return this.labelTerm_sempred(localContext as LabelTermContext, predIndex)
            case 87:
                return this.tableReference_sempred(localContext as TableReferenceContext, predIndex)
            case 95:
                return this.exprBagOp_sempred(localContext as ExprBagOpContext, predIndex)
            case 97:
                return this.exprOr_sempred(localContext as ExprOrContext, predIndex)
            case 98:
                return this.exprAnd_sempred(localContext as ExprAndContext, predIndex)
            case 100:
                return this.exprPredicate_sempred(localContext as ExprPredicateContext, predIndex)
            case 101:
                return this.mathOp00_sempred(localContext as MathOp00Context, predIndex)
            case 102:
                return this.mathOp01_sempred(localContext as MathOp01Context, predIndex)
            case 103:
                return this.mathOp02_sempred(localContext as MathOp02Context, predIndex)
            case 105:
                return this.exprPrimary_sempred(localContext as ExprPrimaryContext, predIndex)
        }
        return true
    }
    private labelSpec_sempred(localContext: LabelSpecContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 0:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private labelTerm_sempred(localContext: LabelTermContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 1:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private tableReference_sempred(localContext: TableReferenceContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 2:
                return this.precpred(this.context, 5)
            case 3:
                return this.precpred(this.context, 4)
            case 4:
                return this.precpred(this.context, 3)
        }
        return true
    }
    private exprBagOp_sempred(localContext: ExprBagOpContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 5:
                return this.precpred(this.context, 4)
            case 6:
                return this.precpred(this.context, 3)
            case 7:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private exprOr_sempred(localContext: ExprOrContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 8:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private exprAnd_sempred(localContext: ExprAndContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 9:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private exprPredicate_sempred(localContext: ExprPredicateContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 10:
                return this.precpred(this.context, 7)
            case 11:
                return this.precpred(this.context, 6)
            case 12:
                return this.precpred(this.context, 5)
            case 13:
                return this.precpred(this.context, 4)
            case 14:
                return this.precpred(this.context, 3)
            case 15:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private mathOp00_sempred(localContext: MathOp00Context | null, predIndex: number): boolean {
        switch (predIndex) {
            case 16:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private mathOp01_sempred(localContext: MathOp01Context | null, predIndex: number): boolean {
        switch (predIndex) {
            case 17:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private mathOp02_sempred(localContext: MathOp02Context | null, predIndex: number): boolean {
        switch (predIndex) {
            case 18:
                return this.precpred(this.context, 2)
        }
        return true
    }
    private exprPrimary_sempred(localContext: ExprPrimaryContext | null, predIndex: number): boolean {
        switch (predIndex) {
            case 19:
                return this.precpred(this.context, 6)
        }
        return true
    }

    public static readonly _serializedATN: number[] = [
        4, 1, 310, 1800, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7,
        2, 8, 7, 8, 2, 9, 7, 9, 2, 10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2, 15, 7, 15, 2,
        16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2, 20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 2,
        24, 7, 24, 2, 25, 7, 25, 2, 26, 7, 26, 2, 27, 7, 27, 2, 28, 7, 28, 2, 29, 7, 29, 2, 30, 7, 30, 2, 31, 7, 31, 2,
        32, 7, 32, 2, 33, 7, 33, 2, 34, 7, 34, 2, 35, 7, 35, 2, 36, 7, 36, 2, 37, 7, 37, 2, 38, 7, 38, 2, 39, 7, 39, 2,
        40, 7, 40, 2, 41, 7, 41, 2, 42, 7, 42, 2, 43, 7, 43, 2, 44, 7, 44, 2, 45, 7, 45, 2, 46, 7, 46, 2, 47, 7, 47, 2,
        48, 7, 48, 2, 49, 7, 49, 2, 50, 7, 50, 2, 51, 7, 51, 2, 52, 7, 52, 2, 53, 7, 53, 2, 54, 7, 54, 2, 55, 7, 55, 2,
        56, 7, 56, 2, 57, 7, 57, 2, 58, 7, 58, 2, 59, 7, 59, 2, 60, 7, 60, 2, 61, 7, 61, 2, 62, 7, 62, 2, 63, 7, 63, 2,
        64, 7, 64, 2, 65, 7, 65, 2, 66, 7, 66, 2, 67, 7, 67, 2, 68, 7, 68, 2, 69, 7, 69, 2, 70, 7, 70, 2, 71, 7, 71, 2,
        72, 7, 72, 2, 73, 7, 73, 2, 74, 7, 74, 2, 75, 7, 75, 2, 76, 7, 76, 2, 77, 7, 77, 2, 78, 7, 78, 2, 79, 7, 79, 2,
        80, 7, 80, 2, 81, 7, 81, 2, 82, 7, 82, 2, 83, 7, 83, 2, 84, 7, 84, 2, 85, 7, 85, 2, 86, 7, 86, 2, 87, 7, 87, 2,
        88, 7, 88, 2, 89, 7, 89, 2, 90, 7, 90, 2, 91, 7, 91, 2, 92, 7, 92, 2, 93, 7, 93, 2, 94, 7, 94, 2, 95, 7, 95, 2,
        96, 7, 96, 2, 97, 7, 97, 2, 98, 7, 98, 2, 99, 7, 99, 2, 100, 7, 100, 2, 101, 7, 101, 2, 102, 7, 102, 2, 103, 7,
        103, 2, 104, 7, 104, 2, 105, 7, 105, 2, 106, 7, 106, 2, 107, 7, 107, 2, 108, 7, 108, 2, 109, 7, 109, 2, 110, 7,
        110, 2, 111, 7, 111, 2, 112, 7, 112, 2, 113, 7, 113, 2, 114, 7, 114, 2, 115, 7, 115, 2, 116, 7, 116, 2, 117, 7,
        117, 2, 118, 7, 118, 2, 119, 7, 119, 2, 120, 7, 120, 2, 121, 7, 121, 2, 122, 7, 122, 2, 123, 7, 123, 2, 124, 7,
        124, 2, 125, 7, 125, 2, 126, 7, 126, 2, 127, 7, 127, 2, 128, 7, 128, 2, 129, 7, 129, 2, 130, 7, 130, 2, 131, 7,
        131, 2, 132, 7, 132, 2, 133, 7, 133, 2, 134, 7, 134, 2, 135, 7, 135, 2, 136, 7, 136, 2, 137, 7, 137, 2, 138, 7,
        138, 2, 139, 7, 139, 1, 0, 1, 0, 3, 0, 283, 8, 0, 4, 0, 285, 8, 0, 11, 0, 12, 0, 286, 1, 0, 1, 0, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 5, 1, 296, 8, 1, 10, 1, 12, 1, 299, 9, 1, 1, 1, 1, 1, 3, 1, 303, 8, 1, 3, 1, 305, 8, 1, 1, 1, 1,
        1, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 313, 8, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1,
        6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 5, 9, 336, 8, 9, 10, 9, 12, 9, 339, 9, 9, 3, 9, 341, 8,
        9, 1, 10, 1, 10, 1, 10, 5, 10, 346, 8, 10, 10, 10, 12, 10, 349, 9, 10, 1, 10, 1, 10, 1, 11, 1, 11, 1, 12, 1, 12,
        1, 13, 1, 13, 1, 14, 1, 14, 1, 15, 1, 15, 3, 15, 363, 8, 15, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3,
        16, 372, 8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 5, 16, 382, 8, 16, 10, 16, 12, 16, 385,
        9, 16, 1, 16, 1, 16, 3, 16, 389, 8, 16, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 3, 17,
        400, 8, 17, 1, 18, 1, 18, 1, 18, 5, 18, 405, 8, 18, 10, 18, 12, 18, 408, 9, 18, 1, 19, 1, 19, 1, 19, 5, 19, 413,
        8, 19, 10, 19, 12, 19, 416, 9, 19, 1, 20, 1, 20, 3, 20, 420, 8, 20, 1, 20, 1, 20, 1, 21, 1, 21, 1, 21, 3, 21,
        427, 8, 21, 1, 22, 1, 22, 4, 22, 431, 8, 22, 11, 22, 12, 22, 432, 1, 22, 3, 22, 436, 8, 22, 1, 22, 3, 22, 439,
        8, 22, 1, 22, 1, 22, 3, 22, 443, 8, 22, 1, 22, 4, 22, 446, 8, 22, 11, 22, 12, 22, 447, 1, 22, 3, 22, 451, 8, 22,
        1, 22, 1, 22, 1, 22, 3, 22, 456, 8, 22, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 1, 23, 3, 23, 464, 8, 23, 1, 24, 1,
        24, 5, 24, 468, 8, 24, 10, 24, 12, 24, 471, 9, 24, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 1, 25, 1,
        25, 1, 25, 3, 25, 483, 8, 25, 1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 489, 8, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27,
        1, 27, 3, 27, 497, 8, 27, 1, 27, 1, 27, 1, 28, 1, 28, 1, 28, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 3,
        29, 511, 8, 29, 1, 29, 3, 29, 514, 8, 29, 1, 29, 3, 29, 517, 8, 29, 1, 30, 1, 30, 1, 30, 1, 30, 3, 30, 523, 8,
        30, 1, 30, 1, 30, 3, 30, 527, 8, 30, 1, 31, 1, 31, 1, 31, 3, 31, 532, 8, 31, 1, 31, 1, 31, 1, 32, 1, 32, 1, 32,
        1, 32, 1, 32, 1, 32, 1, 32, 3, 32, 543, 8, 32, 1, 32, 3, 32, 546, 8, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1,
        33, 1, 33, 1, 34, 1, 34, 1, 34, 1, 34, 5, 34, 559, 8, 34, 10, 34, 12, 34, 562, 9, 34, 1, 34, 1, 34, 1, 34, 1,
        34, 1, 34, 3, 34, 569, 8, 34, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 1, 36, 3, 36, 581,
        8, 36, 1, 37, 1, 37, 1, 37, 3, 37, 586, 8, 37, 1, 38, 1, 38, 1, 38, 3, 38, 591, 8, 38, 1, 39, 1, 39, 1, 39, 1,
        40, 1, 40, 1, 40, 1, 40, 5, 40, 600, 8, 40, 10, 40, 12, 40, 603, 9, 40, 1, 41, 1, 41, 1, 41, 1, 41, 1, 42, 1,
        42, 1, 42, 3, 42, 612, 8, 42, 1, 42, 3, 42, 615, 8, 42, 1, 43, 1, 43, 1, 43, 1, 43, 5, 43, 621, 8, 43, 10, 43,
        12, 43, 624, 9, 43, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 3, 44, 632, 8, 44, 1, 45, 1, 45, 1, 45, 3, 45,
        637, 8, 45, 1, 45, 3, 45, 640, 8, 45, 1, 45, 3, 45, 643, 8, 45, 1, 45, 1, 45, 1, 45, 1, 45, 3, 45, 649, 8, 45,
        1, 46, 1, 46, 1, 46, 1, 47, 1, 47, 3, 47, 656, 8, 47, 1, 47, 1, 47, 1, 47, 3, 47, 661, 8, 47, 1, 47, 1, 47, 1,
        47, 3, 47, 666, 8, 47, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 1, 47, 3, 47, 675, 8, 47, 1, 48, 1, 48, 1, 48,
        5, 48, 680, 8, 48, 10, 48, 12, 48, 683, 9, 48, 1, 49, 1, 49, 3, 49, 687, 8, 49, 1, 49, 3, 49, 690, 8, 49, 1, 50,
        1, 50, 1, 51, 1, 51, 1, 51, 1, 51, 5, 51, 698, 8, 51, 10, 51, 12, 51, 701, 9, 51, 1, 52, 1, 52, 1, 52, 1, 52, 1,
        53, 1, 53, 1, 53, 1, 53, 1, 53, 5, 53, 712, 8, 53, 10, 53, 12, 53, 715, 9, 53, 1, 54, 1, 54, 3, 54, 719, 8, 54,
        1, 54, 1, 54, 3, 54, 723, 8, 54, 1, 55, 1, 55, 3, 55, 727, 8, 55, 1, 55, 1, 55, 1, 55, 1, 55, 5, 55, 733, 8, 55,
        10, 55, 12, 55, 736, 9, 55, 1, 55, 3, 55, 739, 8, 55, 1, 56, 1, 56, 1, 56, 1, 56, 1, 57, 1, 57, 1, 57, 3, 57,
        748, 8, 57, 1, 58, 1, 58, 1, 58, 3, 58, 753, 8, 58, 1, 58, 3, 58, 756, 8, 58, 1, 58, 1, 58, 1, 59, 1, 59, 1, 59,
        1, 59, 1, 59, 5, 59, 765, 8, 59, 10, 59, 12, 59, 768, 9, 59, 1, 60, 1, 60, 1, 60, 1, 60, 1, 60, 5, 60, 775, 8,
        60, 10, 60, 12, 60, 778, 9, 60, 1, 61, 1, 61, 1, 61, 1, 62, 1, 62, 1, 62, 1, 62, 5, 62, 787, 8, 62, 10, 62, 12,
        62, 790, 9, 62, 1, 63, 1, 63, 4, 63, 794, 8, 63, 11, 63, 12, 63, 795, 1, 64, 1, 64, 1, 64, 1, 64, 1, 64, 1, 64,
        1, 64, 1, 64, 1, 64, 1, 64, 1, 64, 1, 64, 1, 64, 3, 64, 811, 8, 64, 1, 65, 1, 65, 1, 65, 1, 66, 1, 66, 1, 66, 1,
        67, 1, 67, 1, 67, 1, 68, 1, 68, 1, 68, 1, 69, 3, 69, 826, 8, 69, 1, 69, 1, 69, 1, 70, 3, 70, 831, 8, 70, 1, 70,
        1, 70, 1, 70, 5, 70, 836, 8, 70, 10, 70, 12, 70, 839, 9, 70, 1, 71, 3, 71, 842, 8, 71, 1, 71, 3, 71, 845, 8, 71,
        1, 71, 5, 71, 848, 8, 71, 10, 71, 12, 71, 851, 9, 71, 1, 72, 1, 72, 1, 72, 3, 72, 856, 8, 72, 1, 73, 1, 73, 1,
        73, 1, 73, 3, 73, 862, 8, 73, 1, 73, 1, 73, 1, 73, 3, 73, 867, 8, 73, 3, 73, 869, 8, 73, 1, 74, 1, 74, 1, 74, 1,
        75, 1, 75, 1, 76, 1, 76, 3, 76, 878, 8, 76, 1, 76, 1, 76, 3, 76, 882, 8, 76, 1, 76, 3, 76, 885, 8, 76, 1, 76, 1,
        76, 1, 77, 1, 77, 3, 77, 891, 8, 77, 1, 77, 1, 77, 3, 77, 895, 8, 77, 3, 77, 897, 8, 77, 1, 78, 1, 78, 3, 78,
        901, 8, 78, 1, 78, 3, 78, 904, 8, 78, 1, 78, 4, 78, 907, 8, 78, 11, 78, 12, 78, 908, 1, 78, 3, 78, 912, 8, 78,
        1, 78, 1, 78, 3, 78, 916, 8, 78, 1, 78, 1, 78, 3, 78, 920, 8, 78, 1, 78, 3, 78, 923, 8, 78, 1, 78, 4, 78, 926,
        8, 78, 11, 78, 12, 78, 927, 1, 78, 3, 78, 931, 8, 78, 1, 78, 1, 78, 3, 78, 935, 8, 78, 3, 78, 937, 8, 78, 1, 79,
        1, 79, 1, 79, 1, 79, 1, 79, 3, 79, 944, 8, 79, 1, 79, 3, 79, 947, 8, 79, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1,
        80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1,
        80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 3, 80, 983, 8, 80, 1,
        81, 1, 81, 3, 81, 987, 8, 81, 1, 81, 1, 81, 3, 81, 991, 8, 81, 1, 81, 3, 81, 994, 8, 81, 1, 81, 1, 81, 1, 82, 1,
        82, 1, 82, 1, 82, 1, 82, 1, 82, 5, 82, 1004, 8, 82, 10, 82, 12, 82, 1007, 9, 82, 1, 83, 1, 83, 1, 83, 1, 83, 1,
        83, 1, 83, 5, 83, 1015, 8, 83, 10, 83, 12, 83, 1018, 9, 83, 1, 84, 1, 84, 1, 84, 3, 84, 1023, 8, 84, 1, 85, 1,
        85, 1, 85, 1, 85, 1, 85, 1, 85, 3, 85, 1031, 8, 85, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 3, 86, 1039, 8,
        86, 1, 86, 1, 86, 3, 86, 1043, 8, 86, 3, 86, 1045, 8, 86, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 3, 87, 1053,
        8, 87, 1, 87, 1, 87, 3, 87, 1057, 8, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 3, 87, 1067, 8,
        87, 1, 87, 1, 87, 1, 87, 1, 87, 5, 87, 1073, 8, 87, 10, 87, 12, 87, 1076, 9, 87, 1, 88, 1, 88, 3, 88, 1080, 8,
        88, 1, 89, 1, 89, 1, 89, 1, 89, 1, 89, 3, 89, 1087, 8, 89, 1, 89, 3, 89, 1090, 8, 89, 1, 89, 3, 89, 1093, 8, 89,
        1, 89, 1, 89, 3, 89, 1097, 8, 89, 1, 89, 3, 89, 1100, 8, 89, 1, 89, 3, 89, 1103, 8, 89, 3, 89, 1105, 8, 89, 1,
        90, 1, 90, 1, 90, 3, 90, 1110, 8, 90, 1, 90, 3, 90, 1113, 8, 90, 1, 90, 3, 90, 1116, 8, 90, 1, 91, 1, 91, 1, 91,
        1, 91, 1, 91, 3, 91, 1123, 8, 91, 1, 92, 1, 92, 1, 92, 1, 93, 1, 93, 1, 93, 3, 93, 1131, 8, 93, 1, 93, 1, 93, 3,
        93, 1135, 8, 93, 1, 93, 1, 93, 3, 93, 1139, 8, 93, 1, 93, 3, 93, 1142, 8, 93, 1, 94, 1, 94, 1, 95, 1, 95, 1, 95,
        1, 95, 1, 95, 3, 95, 1151, 8, 95, 1, 95, 1, 95, 3, 95, 1155, 8, 95, 1, 95, 1, 95, 1, 95, 3, 95, 1160, 8, 95, 1,
        95, 1, 95, 3, 95, 1164, 8, 95, 1, 95, 1, 95, 1, 95, 3, 95, 1169, 8, 95, 1, 95, 1, 95, 3, 95, 1173, 8, 95, 1, 95,
        5, 95, 1176, 8, 95, 10, 95, 12, 95, 1179, 9, 95, 1, 96, 1, 96, 3, 96, 1183, 8, 96, 1, 96, 1, 96, 3, 96, 1187, 8,
        96, 1, 96, 3, 96, 1190, 8, 96, 1, 96, 3, 96, 1193, 8, 96, 1, 96, 3, 96, 1196, 8, 96, 1, 96, 3, 96, 1199, 8, 96,
        1, 96, 3, 96, 1202, 8, 96, 1, 96, 3, 96, 1205, 8, 96, 1, 96, 3, 96, 1208, 8, 96, 1, 97, 1, 97, 1, 97, 1, 97, 1,
        97, 1, 97, 5, 97, 1216, 8, 97, 10, 97, 12, 97, 1219, 9, 97, 1, 98, 1, 98, 1, 98, 1, 98, 1, 98, 1, 98, 5, 98,
        1227, 8, 98, 10, 98, 12, 98, 1230, 9, 98, 1, 99, 1, 99, 1, 99, 3, 99, 1235, 8, 99, 1, 100, 1, 100, 1, 100, 1,
        100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 3, 100, 1246, 8, 100, 1, 100, 1, 100, 1, 100, 3, 100, 1251, 8, 100,
        1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 3, 100, 1260, 8, 100, 1, 100, 1, 100, 1, 100, 1, 100, 3,
        100, 1266, 8, 100, 1, 100, 1, 100, 1, 100, 1, 100, 3, 100, 1272, 8, 100, 1, 100, 1, 100, 3, 100, 1276, 8, 100,
        1, 100, 1, 100, 1, 100, 1, 100, 1, 100, 5, 100, 1283, 8, 100, 10, 100, 12, 100, 1286, 9, 100, 1, 101, 1, 101, 1,
        101, 1, 101, 1, 101, 1, 101, 5, 101, 1294, 8, 101, 10, 101, 12, 101, 1297, 9, 101, 1, 102, 1, 102, 1, 102, 1,
        102, 1, 102, 1, 102, 5, 102, 1305, 8, 102, 10, 102, 12, 102, 1308, 9, 102, 1, 103, 1, 103, 1, 103, 1, 103, 1,
        103, 1, 103, 5, 103, 1316, 8, 103, 10, 103, 12, 103, 1319, 9, 103, 1, 104, 1, 104, 1, 104, 3, 104, 1324, 8, 104,
        1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105,
        1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 3, 105, 1347, 8, 105, 1, 105, 1, 105, 4, 105, 1351, 8,
        105, 11, 105, 12, 105, 1352, 5, 105, 1355, 8, 105, 10, 105, 12, 105, 1358, 9, 105, 1, 106, 1, 106, 1, 106, 1,
        106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 3, 106, 1371, 8, 106, 1, 107, 1, 107, 1, 107, 1,
        107, 1, 107, 1, 107, 1, 107, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 5, 108, 1385, 8, 108, 10, 108, 12, 108,
        1388, 9, 108, 1, 108, 1, 108, 1, 109, 1, 109, 3, 109, 1394, 8, 109, 1, 109, 1, 109, 1, 109, 1, 109, 1, 109, 4,
        109, 1401, 8, 109, 11, 109, 12, 109, 1402, 1, 109, 1, 109, 3, 109, 1407, 8, 109, 1, 109, 1, 109, 1, 110, 1, 110,
        1, 110, 1, 110, 5, 110, 1415, 8, 110, 10, 110, 12, 110, 1418, 9, 110, 1, 111, 1, 111, 1, 111, 1, 111, 5, 111,
        1424, 8, 111, 10, 111, 12, 111, 1427, 9, 111, 1, 111, 1, 111, 1, 112, 1, 112, 1, 112, 1, 112, 4, 112, 1435, 8,
        112, 11, 112, 12, 112, 1436, 1, 112, 1, 112, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 5, 113, 1446, 8, 113, 10,
        113, 12, 113, 1449, 9, 113, 3, 113, 1451, 8, 113, 1, 113, 1, 113, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1,
        114, 1, 114, 3, 114, 1462, 8, 114, 3, 114, 1464, 8, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114,
        1, 114, 1, 114, 3, 114, 1475, 8, 114, 3, 114, 1477, 8, 114, 1, 114, 1, 114, 3, 114, 1481, 8, 114, 1, 115, 1,
        115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 3, 115,
        1497, 8, 115, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 3, 116, 1508, 8, 116, 1,
        116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 3, 116, 1521, 8, 116, 1,
        116, 1, 116, 3, 116, 1525, 8, 116, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 3, 117, 1534, 8, 117,
        1, 117, 1, 117, 1, 117, 3, 117, 1539, 8, 117, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 3, 118,
        1548, 8, 118, 3, 118, 1550, 8, 118, 1, 118, 1, 118, 1, 118, 1, 119, 1, 119, 1, 119, 1, 119, 1, 119, 1, 119, 1,
        119, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 1,
        121, 1, 122, 1, 122, 1, 122, 1, 122, 1, 122, 1, 122, 1, 122, 1, 123, 1, 123, 1, 123, 3, 123, 1586, 8, 123, 1,
        123, 3, 123, 1589, 8, 123, 1, 123, 3, 123, 1592, 8, 123, 1, 123, 1, 123, 1, 123, 1, 124, 1, 124, 1, 124, 1, 124,
        1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 5, 125, 1611, 8, 125, 10, 125,
        12, 125, 1614, 9, 125, 3, 125, 1616, 8, 125, 1, 125, 1, 125, 1, 126, 1, 126, 1, 126, 5, 126, 1623, 8, 126, 10,
        126, 12, 126, 1626, 9, 126, 1, 126, 1, 126, 1, 126, 1, 126, 5, 126, 1632, 8, 126, 10, 126, 12, 126, 1635, 9,
        126, 1, 126, 3, 126, 1638, 8, 126, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1,
        127, 1, 127, 3, 127, 1651, 8, 127, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 129, 1, 129, 1, 129, 1,
        129, 1, 130, 1, 130, 1, 131, 3, 131, 1666, 8, 131, 1, 131, 1, 131, 3, 131, 1670, 8, 131, 1, 131, 3, 131, 1673,
        8, 131, 1, 132, 1, 132, 1, 133, 1, 133, 3, 133, 1679, 8, 133, 1, 134, 1, 134, 1, 134, 1, 134, 5, 134, 1685, 8,
        134, 10, 134, 12, 134, 1688, 9, 134, 3, 134, 1690, 8, 134, 1, 134, 1, 134, 1, 135, 1, 135, 1, 135, 1, 135, 5,
        135, 1698, 8, 135, 10, 135, 12, 135, 1701, 9, 135, 3, 135, 1703, 8, 135, 1, 135, 1, 135, 1, 136, 1, 136, 1, 136,
        1, 136, 5, 136, 1711, 8, 136, 10, 136, 12, 136, 1714, 9, 136, 3, 136, 1716, 8, 136, 1, 136, 1, 136, 1, 137, 1,
        137, 1, 137, 1, 137, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1,
        138, 1, 138, 1, 138, 3, 138, 1738, 8, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1743, 8, 138, 1, 138, 1, 138, 1, 138,
        1, 138, 1, 138, 3, 138, 1750, 8, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1755, 8, 138, 1, 138, 3, 138, 1758, 8,
        138, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1767, 8, 139, 1, 139, 1, 139, 1, 139, 1,
        139, 1, 139, 3, 139, 1774, 8, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1781, 8, 139, 1, 139, 3, 139,
        1784, 8, 139, 1, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1790, 8, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1795, 8,
        139, 1, 139, 3, 139, 1798, 8, 139, 1, 139, 0, 11, 164, 166, 174, 190, 194, 196, 200, 202, 204, 206, 210, 140, 0,
        2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58,
        60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110,
        112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154,
        156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198,
        200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222, 224, 226, 228, 230, 232, 234, 236, 238, 240, 242,
        244, 246, 248, 250, 252, 254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 278, 0, 21, 1, 0, 303, 304,
        2, 0, 4, 4, 247, 247, 1, 0, 248, 249, 2, 0, 4, 4, 67, 67, 2, 0, 11, 11, 62, 62, 2, 0, 90, 90, 123, 123, 2, 0, 4,
        4, 8, 8, 2, 0, 271, 271, 277, 277, 2, 0, 281, 284, 286, 287, 2, 0, 279, 279, 285, 285, 1, 0, 271, 272, 2, 0,
        273, 274, 277, 277, 1, 0, 266, 267, 7, 0, 8, 8, 15, 15, 44, 44, 75, 75, 131, 132, 189, 189, 196, 196, 1, 0, 230,
        231, 1, 0, 86, 87, 8, 0, 19, 19, 28, 29, 44, 44, 82, 82, 129, 129, 145, 145, 187, 187, 213, 213, 9, 0, 8, 8, 26,
        27, 53, 53, 113, 114, 141, 141, 170, 170, 188, 188, 236, 236, 251, 268, 3, 0, 26, 27, 91, 91, 220, 220, 2, 0,
        55, 56, 144, 144, 1, 0, 201, 202, 1959, 0, 284, 1, 0, 0, 0, 2, 304, 1, 0, 0, 0, 4, 312, 1, 0, 0, 0, 6, 314, 1,
        0, 0, 0, 8, 317, 1, 0, 0, 0, 10, 320, 1, 0, 0, 0, 12, 323, 1, 0, 0, 0, 14, 326, 1, 0, 0, 0, 16, 328, 1, 0, 0, 0,
        18, 330, 1, 0, 0, 0, 20, 347, 1, 0, 0, 0, 22, 352, 1, 0, 0, 0, 24, 354, 1, 0, 0, 0, 26, 356, 1, 0, 0, 0, 28,
        358, 1, 0, 0, 0, 30, 362, 1, 0, 0, 0, 32, 388, 1, 0, 0, 0, 34, 399, 1, 0, 0, 0, 36, 401, 1, 0, 0, 0, 38, 409, 1,
        0, 0, 0, 40, 419, 1, 0, 0, 0, 42, 426, 1, 0, 0, 0, 44, 455, 1, 0, 0, 0, 46, 463, 1, 0, 0, 0, 48, 465, 1, 0, 0,
        0, 50, 482, 1, 0, 0, 0, 52, 484, 1, 0, 0, 0, 54, 492, 1, 0, 0, 0, 56, 500, 1, 0, 0, 0, 58, 503, 1, 0, 0, 0, 60,
        518, 1, 0, 0, 0, 62, 528, 1, 0, 0, 0, 64, 535, 1, 0, 0, 0, 66, 547, 1, 0, 0, 0, 68, 568, 1, 0, 0, 0, 70, 570, 1,
        0, 0, 0, 72, 580, 1, 0, 0, 0, 74, 582, 1, 0, 0, 0, 76, 587, 1, 0, 0, 0, 78, 592, 1, 0, 0, 0, 80, 595, 1, 0, 0,
        0, 82, 604, 1, 0, 0, 0, 84, 608, 1, 0, 0, 0, 86, 616, 1, 0, 0, 0, 88, 631, 1, 0, 0, 0, 90, 648, 1, 0, 0, 0, 92,
        650, 1, 0, 0, 0, 94, 674, 1, 0, 0, 0, 96, 676, 1, 0, 0, 0, 98, 684, 1, 0, 0, 0, 100, 691, 1, 0, 0, 0, 102, 693,
        1, 0, 0, 0, 104, 702, 1, 0, 0, 0, 106, 706, 1, 0, 0, 0, 108, 716, 1, 0, 0, 0, 110, 724, 1, 0, 0, 0, 112, 740, 1,
        0, 0, 0, 114, 744, 1, 0, 0, 0, 116, 749, 1, 0, 0, 0, 118, 759, 1, 0, 0, 0, 120, 769, 1, 0, 0, 0, 122, 779, 1, 0,
        0, 0, 124, 782, 1, 0, 0, 0, 126, 791, 1, 0, 0, 0, 128, 810, 1, 0, 0, 0, 130, 812, 1, 0, 0, 0, 132, 815, 1, 0, 0,
        0, 134, 818, 1, 0, 0, 0, 136, 821, 1, 0, 0, 0, 138, 825, 1, 0, 0, 0, 140, 830, 1, 0, 0, 0, 142, 841, 1, 0, 0, 0,
        144, 855, 1, 0, 0, 0, 146, 868, 1, 0, 0, 0, 148, 870, 1, 0, 0, 0, 150, 873, 1, 0, 0, 0, 152, 875, 1, 0, 0, 0,
        154, 896, 1, 0, 0, 0, 156, 936, 1, 0, 0, 0, 158, 946, 1, 0, 0, 0, 160, 982, 1, 0, 0, 0, 162, 984, 1, 0, 0, 0,
        164, 997, 1, 0, 0, 0, 166, 1008, 1, 0, 0, 0, 168, 1022, 1, 0, 0, 0, 170, 1030, 1, 0, 0, 0, 172, 1044, 1, 0, 0,
        0, 174, 1052, 1, 0, 0, 0, 176, 1079, 1, 0, 0, 0, 178, 1104, 1, 0, 0, 0, 180, 1106, 1, 0, 0, 0, 182, 1122, 1, 0,
        0, 0, 184, 1124, 1, 0, 0, 0, 186, 1141, 1, 0, 0, 0, 188, 1143, 1, 0, 0, 0, 190, 1145, 1, 0, 0, 0, 192, 1207, 1,
        0, 0, 0, 194, 1209, 1, 0, 0, 0, 196, 1220, 1, 0, 0, 0, 198, 1234, 1, 0, 0, 0, 200, 1236, 1, 0, 0, 0, 202, 1287,
        1, 0, 0, 0, 204, 1298, 1, 0, 0, 0, 206, 1309, 1, 0, 0, 0, 208, 1323, 1, 0, 0, 0, 210, 1346, 1, 0, 0, 0, 212,
        1370, 1, 0, 0, 0, 214, 1372, 1, 0, 0, 0, 216, 1379, 1, 0, 0, 0, 218, 1391, 1, 0, 0, 0, 220, 1410, 1, 0, 0, 0,
        222, 1419, 1, 0, 0, 0, 224, 1430, 1, 0, 0, 0, 226, 1440, 1, 0, 0, 0, 228, 1480, 1, 0, 0, 0, 230, 1496, 1, 0, 0,
        0, 232, 1524, 1, 0, 0, 0, 234, 1538, 1, 0, 0, 0, 236, 1540, 1, 0, 0, 0, 238, 1554, 1, 0, 0, 0, 240, 1561, 1, 0,
        0, 0, 242, 1568, 1, 0, 0, 0, 244, 1575, 1, 0, 0, 0, 246, 1582, 1, 0, 0, 0, 248, 1596, 1, 0, 0, 0, 250, 1605, 1,
        0, 0, 0, 252, 1637, 1, 0, 0, 0, 254, 1650, 1, 0, 0, 0, 256, 1652, 1, 0, 0, 0, 258, 1658, 1, 0, 0, 0, 260, 1662,
        1, 0, 0, 0, 262, 1672, 1, 0, 0, 0, 264, 1674, 1, 0, 0, 0, 266, 1678, 1, 0, 0, 0, 268, 1680, 1, 0, 0, 0, 270,
        1693, 1, 0, 0, 0, 272, 1706, 1, 0, 0, 0, 274, 1719, 1, 0, 0, 0, 276, 1757, 1, 0, 0, 0, 278, 1797, 1, 0, 0, 0,
        280, 282, 3, 2, 1, 0, 281, 283, 5, 297, 0, 0, 282, 281, 1, 0, 0, 0, 282, 283, 1, 0, 0, 0, 283, 285, 1, 0, 0, 0,
        284, 280, 1, 0, 0, 0, 285, 286, 1, 0, 0, 0, 286, 284, 1, 0, 0, 0, 286, 287, 1, 0, 0, 0, 287, 288, 1, 0, 0, 0,
        288, 289, 5, 0, 0, 1, 289, 1, 1, 0, 0, 0, 290, 302, 5, 83, 0, 0, 291, 292, 5, 294, 0, 0, 292, 297, 3, 6, 3, 0,
        293, 294, 5, 270, 0, 0, 294, 296, 3, 6, 3, 0, 295, 293, 1, 0, 0, 0, 296, 299, 1, 0, 0, 0, 297, 295, 1, 0, 0, 0,
        297, 298, 1, 0, 0, 0, 298, 300, 1, 0, 0, 0, 299, 297, 1, 0, 0, 0, 300, 301, 5, 295, 0, 0, 301, 303, 1, 0, 0, 0,
        302, 291, 1, 0, 0, 0, 302, 303, 1, 0, 0, 0, 303, 305, 1, 0, 0, 0, 304, 290, 1, 0, 0, 0, 304, 305, 1, 0, 0, 0,
        305, 306, 1, 0, 0, 0, 306, 307, 3, 4, 2, 0, 307, 3, 1, 0, 0, 0, 308, 313, 3, 16, 8, 0, 309, 313, 3, 44, 22, 0,
        310, 313, 3, 30, 15, 0, 311, 313, 3, 18, 9, 0, 312, 308, 1, 0, 0, 0, 312, 309, 1, 0, 0, 0, 312, 310, 1, 0, 0, 0,
        312, 311, 1, 0, 0, 0, 313, 5, 1, 0, 0, 0, 314, 315, 5, 303, 0, 0, 315, 316, 5, 303, 0, 0, 316, 7, 1, 0, 0, 0,
        317, 318, 5, 10, 0, 0, 318, 319, 3, 14, 7, 0, 319, 9, 1, 0, 0, 0, 320, 321, 5, 13, 0, 0, 321, 322, 3, 14, 7, 0,
        322, 11, 1, 0, 0, 0, 323, 324, 5, 20, 0, 0, 324, 325, 3, 14, 7, 0, 325, 13, 1, 0, 0, 0, 326, 327, 7, 0, 0, 0,
        327, 15, 1, 0, 0, 0, 328, 329, 3, 188, 94, 0, 329, 17, 1, 0, 0, 0, 330, 331, 5, 80, 0, 0, 331, 340, 3, 188, 94,
        0, 332, 337, 3, 188, 94, 0, 333, 334, 5, 270, 0, 0, 334, 336, 3, 188, 94, 0, 335, 333, 1, 0, 0, 0, 336, 339, 1,
        0, 0, 0, 337, 335, 1, 0, 0, 0, 337, 338, 1, 0, 0, 0, 338, 341, 1, 0, 0, 0, 339, 337, 1, 0, 0, 0, 340, 332, 1, 0,
        0, 0, 340, 341, 1, 0, 0, 0, 341, 19, 1, 0, 0, 0, 342, 343, 3, 14, 7, 0, 343, 344, 5, 299, 0, 0, 344, 346, 1, 0,
        0, 0, 345, 342, 1, 0, 0, 0, 346, 349, 1, 0, 0, 0, 347, 345, 1, 0, 0, 0, 347, 348, 1, 0, 0, 0, 348, 350, 1, 0, 0,
        0, 349, 347, 1, 0, 0, 0, 350, 351, 3, 14, 7, 0, 351, 21, 1, 0, 0, 0, 352, 353, 3, 14, 7, 0, 353, 23, 1, 0, 0, 0,
        354, 355, 3, 14, 7, 0, 355, 25, 1, 0, 0, 0, 356, 357, 3, 14, 7, 0, 357, 27, 1, 0, 0, 0, 358, 359, 3, 14, 7, 0,
        359, 29, 1, 0, 0, 0, 360, 363, 3, 32, 16, 0, 361, 363, 3, 34, 17, 0, 362, 360, 1, 0, 0, 0, 362, 361, 1, 0, 0, 0,
        363, 31, 1, 0, 0, 0, 364, 365, 5, 45, 0, 0, 365, 366, 5, 198, 0, 0, 366, 371, 3, 20, 10, 0, 367, 368, 5, 294, 0,
        0, 368, 369, 3, 36, 18, 0, 369, 370, 5, 295, 0, 0, 370, 372, 1, 0, 0, 0, 371, 367, 1, 0, 0, 0, 371, 372, 1, 0,
        0, 0, 372, 389, 1, 0, 0, 0, 373, 374, 5, 45, 0, 0, 374, 375, 5, 242, 0, 0, 375, 376, 5, 147, 0, 0, 376, 377, 3,
        14, 7, 0, 377, 378, 5, 294, 0, 0, 378, 383, 3, 48, 24, 0, 379, 380, 5, 270, 0, 0, 380, 382, 3, 48, 24, 0, 381,
        379, 1, 0, 0, 0, 382, 385, 1, 0, 0, 0, 383, 381, 1, 0, 0, 0, 383, 384, 1, 0, 0, 0, 384, 386, 1, 0, 0, 0, 385,
        383, 1, 0, 0, 0, 386, 387, 5, 295, 0, 0, 387, 389, 1, 0, 0, 0, 388, 364, 1, 0, 0, 0, 388, 373, 1, 0, 0, 0, 389,
        33, 1, 0, 0, 0, 390, 391, 5, 70, 0, 0, 391, 392, 5, 198, 0, 0, 392, 400, 3, 20, 10, 0, 393, 394, 5, 70, 0, 0,
        394, 395, 5, 242, 0, 0, 395, 396, 3, 14, 7, 0, 396, 397, 5, 147, 0, 0, 397, 398, 3, 14, 7, 0, 398, 400, 1, 0, 0,
        0, 399, 390, 1, 0, 0, 0, 399, 393, 1, 0, 0, 0, 400, 35, 1, 0, 0, 0, 401, 406, 3, 38, 19, 0, 402, 403, 5, 270, 0,
        0, 403, 405, 3, 38, 19, 0, 404, 402, 1, 0, 0, 0, 405, 408, 1, 0, 0, 0, 406, 404, 1, 0, 0, 0, 406, 407, 1, 0, 0,
        0, 407, 37, 1, 0, 0, 0, 408, 406, 1, 0, 0, 0, 409, 410, 3, 26, 13, 0, 410, 414, 3, 278, 139, 0, 411, 413, 3, 40,
        20, 0, 412, 411, 1, 0, 0, 0, 413, 416, 1, 0, 0, 0, 414, 412, 1, 0, 0, 0, 414, 415, 1, 0, 0, 0, 415, 39, 1, 0, 0,
        0, 416, 414, 1, 0, 0, 0, 417, 418, 5, 39, 0, 0, 418, 420, 3, 28, 14, 0, 419, 417, 1, 0, 0, 0, 419, 420, 1, 0, 0,
        0, 420, 421, 1, 0, 0, 0, 421, 422, 3, 42, 21, 0, 422, 41, 1, 0, 0, 0, 423, 424, 5, 140, 0, 0, 424, 427, 5, 141,
        0, 0, 425, 427, 5, 141, 0, 0, 426, 423, 1, 0, 0, 0, 426, 425, 1, 0, 0, 0, 427, 43, 1, 0, 0, 0, 428, 430, 3, 78,
        39, 0, 429, 431, 3, 46, 23, 0, 430, 429, 1, 0, 0, 0, 431, 432, 1, 0, 0, 0, 432, 430, 1, 0, 0, 0, 432, 433, 1, 0,
        0, 0, 433, 435, 1, 0, 0, 0, 434, 436, 3, 92, 46, 0, 435, 434, 1, 0, 0, 0, 435, 436, 1, 0, 0, 0, 436, 438, 1, 0,
        0, 0, 437, 439, 3, 86, 43, 0, 438, 437, 1, 0, 0, 0, 438, 439, 1, 0, 0, 0, 439, 456, 1, 0, 0, 0, 440, 442, 3,
        130, 65, 0, 441, 443, 3, 92, 46, 0, 442, 441, 1, 0, 0, 0, 442, 443, 1, 0, 0, 0, 443, 445, 1, 0, 0, 0, 444, 446,
        3, 46, 23, 0, 445, 444, 1, 0, 0, 0, 446, 447, 1, 0, 0, 0, 447, 445, 1, 0, 0, 0, 447, 448, 1, 0, 0, 0, 448, 450,
        1, 0, 0, 0, 449, 451, 3, 86, 43, 0, 450, 449, 1, 0, 0, 0, 450, 451, 1, 0, 0, 0, 451, 456, 1, 0, 0, 0, 452, 456,
        3, 84, 42, 0, 453, 456, 3, 58, 29, 0, 454, 456, 3, 46, 23, 0, 455, 428, 1, 0, 0, 0, 455, 440, 1, 0, 0, 0, 455,
        452, 1, 0, 0, 0, 455, 453, 1, 0, 0, 0, 455, 454, 1, 0, 0, 0, 456, 45, 1, 0, 0, 0, 457, 464, 3, 60, 30, 0, 458,
        464, 3, 64, 32, 0, 459, 464, 3, 80, 40, 0, 460, 464, 3, 52, 26, 0, 461, 464, 3, 56, 28, 0, 462, 464, 3, 54, 27,
        0, 463, 457, 1, 0, 0, 0, 463, 458, 1, 0, 0, 0, 463, 459, 1, 0, 0, 0, 463, 460, 1, 0, 0, 0, 463, 461, 1, 0, 0, 0,
        463, 462, 1, 0, 0, 0, 464, 47, 1, 0, 0, 0, 465, 469, 3, 14, 7, 0, 466, 468, 3, 50, 25, 0, 467, 466, 1, 0, 0, 0,
        468, 471, 1, 0, 0, 0, 469, 467, 1, 0, 0, 0, 469, 470, 1, 0, 0, 0, 470, 49, 1, 0, 0, 0, 471, 469, 1, 0, 0, 0,
        472, 473, 5, 290, 0, 0, 473, 474, 3, 276, 138, 0, 474, 475, 5, 291, 0, 0, 475, 483, 1, 0, 0, 0, 476, 477, 5,
        290, 0, 0, 477, 478, 3, 14, 7, 0, 478, 479, 5, 291, 0, 0, 479, 483, 1, 0, 0, 0, 480, 481, 5, 299, 0, 0, 481,
        483, 3, 14, 7, 0, 482, 472, 1, 0, 0, 0, 482, 476, 1, 0, 0, 0, 482, 480, 1, 0, 0, 0, 483, 51, 1, 0, 0, 0, 484,
        485, 5, 173, 0, 0, 485, 486, 5, 117, 0, 0, 486, 488, 3, 14, 7, 0, 487, 489, 3, 8, 4, 0, 488, 487, 1, 0, 0, 0,
        488, 489, 1, 0, 0, 0, 489, 490, 1, 0, 0, 0, 490, 491, 3, 188, 94, 0, 491, 53, 1, 0, 0, 0, 492, 493, 5, 214, 0,
        0, 493, 494, 5, 117, 0, 0, 494, 496, 3, 14, 7, 0, 495, 497, 3, 8, 4, 0, 496, 495, 1, 0, 0, 0, 496, 497, 1, 0, 0,
        0, 497, 498, 1, 0, 0, 0, 498, 499, 3, 188, 94, 0, 499, 55, 1, 0, 0, 0, 500, 501, 5, 241, 0, 0, 501, 502, 3, 48,
        24, 0, 502, 57, 1, 0, 0, 0, 503, 504, 5, 112, 0, 0, 504, 505, 5, 117, 0, 0, 505, 506, 3, 48, 24, 0, 506, 507, 5,
        218, 0, 0, 507, 510, 3, 188, 94, 0, 508, 509, 5, 13, 0, 0, 509, 511, 3, 188, 94, 0, 510, 508, 1, 0, 0, 0, 510,
        511, 1, 0, 0, 0, 511, 513, 1, 0, 0, 0, 512, 514, 3, 66, 33, 0, 513, 512, 1, 0, 0, 0, 513, 514, 1, 0, 0, 0, 514,
        516, 1, 0, 0, 0, 515, 517, 3, 86, 43, 0, 516, 515, 1, 0, 0, 0, 516, 517, 1, 0, 0, 0, 517, 59, 1, 0, 0, 0, 518,
        519, 5, 112, 0, 0, 519, 520, 5, 117, 0, 0, 520, 522, 3, 14, 7, 0, 521, 523, 3, 8, 4, 0, 522, 521, 1, 0, 0, 0,
        522, 523, 1, 0, 0, 0, 523, 524, 1, 0, 0, 0, 524, 526, 3, 188, 94, 0, 525, 527, 3, 62, 31, 0, 526, 525, 1, 0, 0,
        0, 526, 527, 1, 0, 0, 0, 527, 61, 1, 0, 0, 0, 528, 529, 5, 147, 0, 0, 529, 531, 5, 244, 0, 0, 530, 532, 3, 68,
        34, 0, 531, 530, 1, 0, 0, 0, 531, 532, 1, 0, 0, 0, 532, 533, 1, 0, 0, 0, 533, 534, 3, 72, 36, 0, 534, 63, 1, 0,
        0, 0, 535, 536, 5, 112, 0, 0, 536, 537, 5, 117, 0, 0, 537, 538, 3, 48, 24, 0, 538, 539, 5, 218, 0, 0, 539, 542,
        3, 188, 94, 0, 540, 541, 5, 13, 0, 0, 541, 543, 3, 188, 94, 0, 542, 540, 1, 0, 0, 0, 542, 543, 1, 0, 0, 0, 543,
        545, 1, 0, 0, 0, 544, 546, 3, 66, 33, 0, 545, 544, 1, 0, 0, 0, 545, 546, 1, 0, 0, 0, 546, 65, 1, 0, 0, 0, 547,
        548, 5, 147, 0, 0, 548, 549, 5, 244, 0, 0, 549, 550, 5, 225, 0, 0, 550, 551, 3, 188, 94, 0, 551, 552, 5, 245, 0,
        0, 552, 553, 5, 250, 0, 0, 553, 67, 1, 0, 0, 0, 554, 555, 5, 294, 0, 0, 555, 560, 3, 14, 7, 0, 556, 557, 5, 270,
        0, 0, 557, 559, 3, 14, 7, 0, 558, 556, 1, 0, 0, 0, 559, 562, 1, 0, 0, 0, 560, 558, 1, 0, 0, 0, 560, 561, 1, 0,
        0, 0, 561, 563, 1, 0, 0, 0, 562, 560, 1, 0, 0, 0, 563, 564, 5, 295, 0, 0, 564, 569, 1, 0, 0, 0, 565, 566, 5,
        147, 0, 0, 566, 567, 5, 39, 0, 0, 567, 569, 3, 70, 35, 0, 568, 554, 1, 0, 0, 0, 568, 565, 1, 0, 0, 0, 569, 69,
        1, 0, 0, 0, 570, 571, 3, 14, 7, 0, 571, 71, 1, 0, 0, 0, 572, 573, 5, 245, 0, 0, 573, 581, 5, 250, 0, 0, 574,
        575, 5, 245, 0, 0, 575, 576, 5, 173, 0, 0, 576, 581, 3, 74, 37, 0, 577, 578, 5, 245, 0, 0, 578, 579, 5, 212, 0,
        0, 579, 581, 3, 76, 38, 0, 580, 572, 1, 0, 0, 0, 580, 574, 1, 0, 0, 0, 580, 577, 1, 0, 0, 0, 581, 73, 1, 0, 0,
        0, 582, 585, 5, 79, 0, 0, 583, 584, 5, 225, 0, 0, 584, 586, 3, 188, 94, 0, 585, 583, 1, 0, 0, 0, 585, 586, 1, 0,
        0, 0, 586, 75, 1, 0, 0, 0, 587, 590, 5, 79, 0, 0, 588, 589, 5, 225, 0, 0, 589, 591, 3, 188, 94, 0, 590, 588, 1,
        0, 0, 0, 590, 591, 1, 0, 0, 0, 591, 77, 1, 0, 0, 0, 592, 593, 5, 212, 0, 0, 593, 594, 3, 178, 89, 0, 594, 79, 1,
        0, 0, 0, 595, 596, 5, 185, 0, 0, 596, 601, 3, 82, 41, 0, 597, 598, 5, 270, 0, 0, 598, 600, 3, 82, 41, 0, 599,
        597, 1, 0, 0, 0, 600, 603, 1, 0, 0, 0, 601, 599, 1, 0, 0, 0, 601, 602, 1, 0, 0, 0, 602, 81, 1, 0, 0, 0, 603,
        601, 1, 0, 0, 0, 604, 605, 3, 48, 24, 0, 605, 606, 5, 283, 0, 0, 606, 607, 3, 188, 94, 0, 607, 83, 1, 0, 0, 0,
        608, 609, 5, 61, 0, 0, 609, 611, 3, 90, 45, 0, 610, 612, 3, 92, 46, 0, 611, 610, 1, 0, 0, 0, 611, 612, 1, 0, 0,
        0, 612, 614, 1, 0, 0, 0, 613, 615, 3, 86, 43, 0, 614, 613, 1, 0, 0, 0, 614, 615, 1, 0, 0, 0, 615, 85, 1, 0, 0,
        0, 616, 617, 5, 246, 0, 0, 617, 622, 3, 88, 44, 0, 618, 619, 5, 270, 0, 0, 619, 621, 3, 88, 44, 0, 620, 618, 1,
        0, 0, 0, 621, 624, 1, 0, 0, 0, 622, 620, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 87, 1, 0, 0, 0, 624, 622, 1, 0,
        0, 0, 625, 626, 7, 1, 0, 0, 626, 627, 7, 2, 0, 0, 627, 632, 5, 277, 0, 0, 628, 629, 7, 1, 0, 0, 629, 630, 7, 2,
        0, 0, 630, 632, 3, 188, 94, 0, 631, 625, 1, 0, 0, 0, 631, 628, 1, 0, 0, 0, 632, 89, 1, 0, 0, 0, 633, 634, 5, 95,
        0, 0, 634, 636, 3, 48, 24, 0, 635, 637, 3, 8, 4, 0, 636, 635, 1, 0, 0, 0, 636, 637, 1, 0, 0, 0, 637, 639, 1, 0,
        0, 0, 638, 640, 3, 10, 5, 0, 639, 638, 1, 0, 0, 0, 639, 640, 1, 0, 0, 0, 640, 642, 1, 0, 0, 0, 641, 643, 3, 12,
        6, 0, 642, 641, 1, 0, 0, 0, 642, 643, 1, 0, 0, 0, 643, 649, 1, 0, 0, 0, 644, 645, 5, 95, 0, 0, 645, 646, 3, 48,
        24, 0, 646, 647, 3, 14, 7, 0, 647, 649, 1, 0, 0, 0, 648, 633, 1, 0, 0, 0, 648, 644, 1, 0, 0, 0, 649, 91, 1, 0,
        0, 0, 650, 651, 5, 225, 0, 0, 651, 652, 3, 188, 94, 0, 652, 93, 1, 0, 0, 0, 653, 655, 5, 182, 0, 0, 654, 656, 3,
        100, 50, 0, 655, 654, 1, 0, 0, 0, 655, 656, 1, 0, 0, 0, 656, 657, 1, 0, 0, 0, 657, 675, 5, 277, 0, 0, 658, 660,
        5, 182, 0, 0, 659, 661, 3, 100, 50, 0, 660, 659, 1, 0, 0, 0, 660, 661, 1, 0, 0, 0, 661, 662, 1, 0, 0, 0, 662,
        675, 3, 96, 48, 0, 663, 665, 5, 182, 0, 0, 664, 666, 3, 100, 50, 0, 665, 664, 1, 0, 0, 0, 665, 666, 1, 0, 0, 0,
        666, 667, 1, 0, 0, 0, 667, 668, 5, 218, 0, 0, 668, 675, 3, 188, 94, 0, 669, 670, 5, 237, 0, 0, 670, 671, 3, 188,
        94, 0, 671, 672, 5, 13, 0, 0, 672, 673, 3, 188, 94, 0, 673, 675, 1, 0, 0, 0, 674, 653, 1, 0, 0, 0, 674, 658, 1,
        0, 0, 0, 674, 663, 1, 0, 0, 0, 674, 669, 1, 0, 0, 0, 675, 95, 1, 0, 0, 0, 676, 681, 3, 98, 49, 0, 677, 678, 5,
        270, 0, 0, 678, 680, 3, 98, 49, 0, 679, 677, 1, 0, 0, 0, 680, 683, 1, 0, 0, 0, 681, 679, 1, 0, 0, 0, 681, 682,
        1, 0, 0, 0, 682, 97, 1, 0, 0, 0, 683, 681, 1, 0, 0, 0, 684, 689, 3, 188, 94, 0, 685, 687, 5, 10, 0, 0, 686, 685,
        1, 0, 0, 0, 686, 687, 1, 0, 0, 0, 687, 688, 1, 0, 0, 0, 688, 690, 3, 14, 7, 0, 689, 686, 1, 0, 0, 0, 689, 690,
        1, 0, 0, 0, 690, 99, 1, 0, 0, 0, 691, 692, 7, 3, 0, 0, 692, 101, 1, 0, 0, 0, 693, 694, 5, 243, 0, 0, 694, 699,
        3, 104, 52, 0, 695, 696, 5, 270, 0, 0, 696, 698, 3, 104, 52, 0, 697, 695, 1, 0, 0, 0, 698, 701, 1, 0, 0, 0, 699,
        697, 1, 0, 0, 0, 699, 700, 1, 0, 0, 0, 700, 103, 1, 0, 0, 0, 701, 699, 1, 0, 0, 0, 702, 703, 3, 188, 94, 0, 703,
        704, 5, 10, 0, 0, 704, 705, 3, 14, 7, 0, 705, 105, 1, 0, 0, 0, 706, 707, 5, 152, 0, 0, 707, 708, 5, 20, 0, 0,
        708, 713, 3, 108, 54, 0, 709, 710, 5, 270, 0, 0, 710, 712, 3, 108, 54, 0, 711, 709, 1, 0, 0, 0, 712, 715, 1, 0,
        0, 0, 713, 711, 1, 0, 0, 0, 713, 714, 1, 0, 0, 0, 714, 107, 1, 0, 0, 0, 715, 713, 1, 0, 0, 0, 716, 718, 3, 188,
        94, 0, 717, 719, 7, 4, 0, 0, 718, 717, 1, 0, 0, 0, 718, 719, 1, 0, 0, 0, 719, 722, 1, 0, 0, 0, 720, 721, 5, 142,
        0, 0, 721, 723, 7, 5, 0, 0, 722, 720, 1, 0, 0, 0, 722, 723, 1, 0, 0, 0, 723, 109, 1, 0, 0, 0, 724, 726, 5, 102,
        0, 0, 725, 727, 5, 158, 0, 0, 726, 725, 1, 0, 0, 0, 726, 727, 1, 0, 0, 0, 727, 728, 1, 0, 0, 0, 728, 729, 5, 20,
        0, 0, 729, 734, 3, 114, 57, 0, 730, 731, 5, 270, 0, 0, 731, 733, 3, 114, 57, 0, 732, 730, 1, 0, 0, 0, 733, 736,
        1, 0, 0, 0, 734, 732, 1, 0, 0, 0, 734, 735, 1, 0, 0, 0, 735, 738, 1, 0, 0, 0, 736, 734, 1, 0, 0, 0, 737, 739, 3,
        112, 56, 0, 738, 737, 1, 0, 0, 0, 738, 739, 1, 0, 0, 0, 739, 111, 1, 0, 0, 0, 740, 741, 5, 102, 0, 0, 741, 742,
        5, 10, 0, 0, 742, 743, 3, 14, 7, 0, 743, 113, 1, 0, 0, 0, 744, 747, 3, 192, 96, 0, 745, 746, 5, 10, 0, 0, 746,
        748, 3, 14, 7, 0, 747, 745, 1, 0, 0, 0, 747, 748, 1, 0, 0, 0, 748, 115, 1, 0, 0, 0, 749, 750, 5, 232, 0, 0, 750,
        752, 5, 294, 0, 0, 751, 753, 3, 118, 59, 0, 752, 751, 1, 0, 0, 0, 752, 753, 1, 0, 0, 0, 753, 755, 1, 0, 0, 0,
        754, 756, 3, 120, 60, 0, 755, 754, 1, 0, 0, 0, 755, 756, 1, 0, 0, 0, 756, 757, 1, 0, 0, 0, 757, 758, 5, 295, 0,
        0, 758, 117, 1, 0, 0, 0, 759, 760, 5, 233, 0, 0, 760, 761, 5, 20, 0, 0, 761, 766, 3, 188, 94, 0, 762, 763, 5,
        270, 0, 0, 763, 765, 3, 188, 94, 0, 764, 762, 1, 0, 0, 0, 765, 768, 1, 0, 0, 0, 766, 764, 1, 0, 0, 0, 766, 767,
        1, 0, 0, 0, 767, 119, 1, 0, 0, 0, 768, 766, 1, 0, 0, 0, 769, 770, 5, 152, 0, 0, 770, 771, 5, 20, 0, 0, 771, 776,
        3, 108, 54, 0, 772, 773, 5, 270, 0, 0, 773, 775, 3, 108, 54, 0, 774, 772, 1, 0, 0, 0, 775, 778, 1, 0, 0, 0, 776,
        774, 1, 0, 0, 0, 776, 777, 1, 0, 0, 0, 777, 121, 1, 0, 0, 0, 778, 776, 1, 0, 0, 0, 779, 780, 5, 103, 0, 0, 780,
        781, 3, 192, 96, 0, 781, 123, 1, 0, 0, 0, 782, 783, 5, 78, 0, 0, 783, 788, 3, 126, 63, 0, 784, 785, 5, 270, 0,
        0, 785, 787, 3, 126, 63, 0, 786, 784, 1, 0, 0, 0, 787, 790, 1, 0, 0, 0, 788, 786, 1, 0, 0, 0, 788, 789, 1, 0, 0,
        0, 789, 125, 1, 0, 0, 0, 790, 788, 1, 0, 0, 0, 791, 793, 3, 14, 7, 0, 792, 794, 3, 128, 64, 0, 793, 792, 1, 0,
        0, 0, 794, 795, 1, 0, 0, 0, 795, 793, 1, 0, 0, 0, 795, 796, 1, 0, 0, 0, 796, 127, 1, 0, 0, 0, 797, 798, 5, 299,
        0, 0, 798, 811, 3, 14, 7, 0, 799, 800, 5, 290, 0, 0, 800, 801, 5, 300, 0, 0, 801, 811, 5, 291, 0, 0, 802, 803,
        5, 290, 0, 0, 803, 804, 5, 301, 0, 0, 804, 811, 5, 291, 0, 0, 805, 806, 5, 290, 0, 0, 806, 807, 5, 277, 0, 0,
        807, 811, 5, 291, 0, 0, 808, 809, 5, 299, 0, 0, 809, 811, 5, 277, 0, 0, 810, 797, 1, 0, 0, 0, 810, 799, 1, 0, 0,
        0, 810, 802, 1, 0, 0, 0, 810, 805, 1, 0, 0, 0, 810, 808, 1, 0, 0, 0, 811, 129, 1, 0, 0, 0, 812, 813, 5, 95, 0,
        0, 813, 814, 3, 174, 87, 0, 814, 131, 1, 0, 0, 0, 815, 816, 5, 225, 0, 0, 816, 817, 3, 192, 96, 0, 817, 133, 1,
        0, 0, 0, 818, 819, 5, 240, 0, 0, 819, 820, 3, 192, 96, 0, 820, 135, 1, 0, 0, 0, 821, 822, 5, 239, 0, 0, 822,
        823, 3, 192, 96, 0, 823, 137, 1, 0, 0, 0, 824, 826, 3, 146, 73, 0, 825, 824, 1, 0, 0, 0, 825, 826, 1, 0, 0, 0,
        826, 827, 1, 0, 0, 0, 827, 828, 3, 142, 71, 0, 828, 139, 1, 0, 0, 0, 829, 831, 3, 146, 73, 0, 830, 829, 1, 0, 0,
        0, 830, 831, 1, 0, 0, 0, 831, 832, 1, 0, 0, 0, 832, 837, 3, 142, 71, 0, 833, 834, 5, 270, 0, 0, 834, 836, 3,
        142, 71, 0, 835, 833, 1, 0, 0, 0, 836, 839, 1, 0, 0, 0, 837, 835, 1, 0, 0, 0, 837, 838, 1, 0, 0, 0, 838, 141, 1,
        0, 0, 0, 839, 837, 1, 0, 0, 0, 840, 842, 3, 150, 75, 0, 841, 840, 1, 0, 0, 0, 841, 842, 1, 0, 0, 0, 842, 844, 1,
        0, 0, 0, 843, 845, 3, 148, 74, 0, 844, 843, 1, 0, 0, 0, 844, 845, 1, 0, 0, 0, 845, 849, 1, 0, 0, 0, 846, 848, 3,
        144, 72, 0, 847, 846, 1, 0, 0, 0, 848, 851, 1, 0, 0, 0, 849, 847, 1, 0, 0, 0, 849, 850, 1, 0, 0, 0, 850, 143, 1,
        0, 0, 0, 851, 849, 1, 0, 0, 0, 852, 856, 3, 152, 76, 0, 853, 856, 3, 154, 77, 0, 854, 856, 3, 156, 78, 0, 855,
        852, 1, 0, 0, 0, 855, 853, 1, 0, 0, 0, 855, 854, 1, 0, 0, 0, 856, 145, 1, 0, 0, 0, 857, 858, 7, 6, 0, 0, 858,
        869, 5, 186, 0, 0, 859, 861, 5, 8, 0, 0, 860, 862, 5, 301, 0, 0, 861, 860, 1, 0, 0, 0, 861, 862, 1, 0, 0, 0,
        862, 869, 1, 0, 0, 0, 863, 864, 5, 186, 0, 0, 864, 866, 5, 301, 0, 0, 865, 867, 5, 102, 0, 0, 866, 865, 1, 0, 0,
        0, 866, 867, 1, 0, 0, 0, 867, 869, 1, 0, 0, 0, 868, 857, 1, 0, 0, 0, 868, 859, 1, 0, 0, 0, 868, 863, 1, 0, 0, 0,
        869, 147, 1, 0, 0, 0, 870, 871, 3, 14, 7, 0, 871, 872, 5, 283, 0, 0, 872, 149, 1, 0, 0, 0, 873, 874, 5, 303, 0,
        0, 874, 151, 1, 0, 0, 0, 875, 877, 5, 294, 0, 0, 876, 878, 3, 14, 7, 0, 877, 876, 1, 0, 0, 0, 877, 878, 1, 0, 0,
        0, 878, 881, 1, 0, 0, 0, 879, 880, 5, 296, 0, 0, 880, 882, 3, 164, 82, 0, 881, 879, 1, 0, 0, 0, 881, 882, 1, 0,
        0, 0, 882, 884, 1, 0, 0, 0, 883, 885, 3, 92, 46, 0, 884, 883, 1, 0, 0, 0, 884, 885, 1, 0, 0, 0, 885, 886, 1, 0,
        0, 0, 886, 887, 5, 295, 0, 0, 887, 153, 1, 0, 0, 0, 888, 890, 3, 160, 80, 0, 889, 891, 3, 158, 79, 0, 890, 889,
        1, 0, 0, 0, 890, 891, 1, 0, 0, 0, 891, 897, 1, 0, 0, 0, 892, 894, 3, 172, 86, 0, 893, 895, 3, 158, 79, 0, 894,
        893, 1, 0, 0, 0, 894, 895, 1, 0, 0, 0, 895, 897, 1, 0, 0, 0, 896, 888, 1, 0, 0, 0, 896, 892, 1, 0, 0, 0, 897,
        155, 1, 0, 0, 0, 898, 900, 5, 294, 0, 0, 899, 901, 3, 150, 75, 0, 900, 899, 1, 0, 0, 0, 900, 901, 1, 0, 0, 0,
        901, 903, 1, 0, 0, 0, 902, 904, 3, 148, 74, 0, 903, 902, 1, 0, 0, 0, 903, 904, 1, 0, 0, 0, 904, 906, 1, 0, 0, 0,
        905, 907, 3, 144, 72, 0, 906, 905, 1, 0, 0, 0, 907, 908, 1, 0, 0, 0, 908, 906, 1, 0, 0, 0, 908, 909, 1, 0, 0, 0,
        909, 911, 1, 0, 0, 0, 910, 912, 3, 92, 46, 0, 911, 910, 1, 0, 0, 0, 911, 912, 1, 0, 0, 0, 912, 913, 1, 0, 0, 0,
        913, 915, 5, 295, 0, 0, 914, 916, 3, 158, 79, 0, 915, 914, 1, 0, 0, 0, 915, 916, 1, 0, 0, 0, 916, 937, 1, 0, 0,
        0, 917, 919, 5, 290, 0, 0, 918, 920, 3, 150, 75, 0, 919, 918, 1, 0, 0, 0, 919, 920, 1, 0, 0, 0, 920, 922, 1, 0,
        0, 0, 921, 923, 3, 148, 74, 0, 922, 921, 1, 0, 0, 0, 922, 923, 1, 0, 0, 0, 923, 925, 1, 0, 0, 0, 924, 926, 3,
        144, 72, 0, 925, 924, 1, 0, 0, 0, 926, 927, 1, 0, 0, 0, 927, 925, 1, 0, 0, 0, 927, 928, 1, 0, 0, 0, 928, 930, 1,
        0, 0, 0, 929, 931, 3, 92, 46, 0, 930, 929, 1, 0, 0, 0, 930, 931, 1, 0, 0, 0, 931, 932, 1, 0, 0, 0, 932, 934, 5,
        291, 0, 0, 933, 935, 3, 158, 79, 0, 934, 933, 1, 0, 0, 0, 934, 935, 1, 0, 0, 0, 935, 937, 1, 0, 0, 0, 936, 898,
        1, 0, 0, 0, 936, 917, 1, 0, 0, 0, 937, 157, 1, 0, 0, 0, 938, 947, 7, 7, 0, 0, 939, 940, 5, 292, 0, 0, 940, 941,
        5, 301, 0, 0, 941, 943, 5, 270, 0, 0, 942, 944, 5, 301, 0, 0, 943, 942, 1, 0, 0, 0, 943, 944, 1, 0, 0, 0, 944,
        945, 1, 0, 0, 0, 945, 947, 5, 293, 0, 0, 946, 938, 1, 0, 0, 0, 946, 939, 1, 0, 0, 0, 947, 159, 1, 0, 0, 0, 948,
        949, 5, 272, 0, 0, 949, 950, 3, 162, 81, 0, 950, 951, 5, 272, 0, 0, 951, 952, 5, 287, 0, 0, 952, 983, 1, 0, 0,
        0, 953, 954, 5, 276, 0, 0, 954, 955, 3, 162, 81, 0, 955, 956, 5, 276, 0, 0, 956, 983, 1, 0, 0, 0, 957, 958, 5,
        286, 0, 0, 958, 959, 5, 272, 0, 0, 959, 960, 3, 162, 81, 0, 960, 961, 5, 272, 0, 0, 961, 983, 1, 0, 0, 0, 962,
        963, 5, 276, 0, 0, 963, 964, 3, 162, 81, 0, 964, 965, 5, 276, 0, 0, 965, 966, 5, 287, 0, 0, 966, 983, 1, 0, 0,
        0, 967, 968, 5, 286, 0, 0, 968, 969, 5, 276, 0, 0, 969, 970, 3, 162, 81, 0, 970, 971, 5, 276, 0, 0, 971, 983, 1,
        0, 0, 0, 972, 973, 5, 286, 0, 0, 973, 974, 5, 272, 0, 0, 974, 975, 3, 162, 81, 0, 975, 976, 5, 272, 0, 0, 976,
        977, 5, 287, 0, 0, 977, 983, 1, 0, 0, 0, 978, 979, 5, 272, 0, 0, 979, 980, 3, 162, 81, 0, 980, 981, 5, 272, 0,
        0, 981, 983, 1, 0, 0, 0, 982, 948, 1, 0, 0, 0, 982, 953, 1, 0, 0, 0, 982, 957, 1, 0, 0, 0, 982, 962, 1, 0, 0, 0,
        982, 967, 1, 0, 0, 0, 982, 972, 1, 0, 0, 0, 982, 978, 1, 0, 0, 0, 983, 161, 1, 0, 0, 0, 984, 986, 5, 290, 0, 0,
        985, 987, 3, 14, 7, 0, 986, 985, 1, 0, 0, 0, 986, 987, 1, 0, 0, 0, 987, 990, 1, 0, 0, 0, 988, 989, 5, 296, 0, 0,
        989, 991, 3, 164, 82, 0, 990, 988, 1, 0, 0, 0, 990, 991, 1, 0, 0, 0, 991, 993, 1, 0, 0, 0, 992, 994, 3, 92, 46,
        0, 993, 992, 1, 0, 0, 0, 993, 994, 1, 0, 0, 0, 994, 995, 1, 0, 0, 0, 995, 996, 5, 291, 0, 0, 996, 163, 1, 0, 0,
        0, 997, 998, 6, 82, -1, 0, 998, 999, 3, 166, 83, 0, 999, 1005, 1, 0, 0, 0, 1000, 1001, 10, 2, 0, 0, 1001, 1002,
        5, 278, 0, 0, 1002, 1004, 3, 166, 83, 0, 1003, 1000, 1, 0, 0, 0, 1004, 1007, 1, 0, 0, 0, 1005, 1003, 1, 0, 0, 0,
        1005, 1006, 1, 0, 0, 0, 1006, 165, 1, 0, 0, 0, 1007, 1005, 1, 0, 0, 0, 1008, 1009, 6, 83, -1, 0, 1009, 1010, 3,
        168, 84, 0, 1010, 1016, 1, 0, 0, 0, 1011, 1012, 10, 2, 0, 0, 1012, 1013, 5, 279, 0, 0, 1013, 1015, 3, 168, 84,
        0, 1014, 1011, 1, 0, 0, 0, 1015, 1018, 1, 0, 0, 0, 1016, 1014, 1, 0, 0, 0, 1016, 1017, 1, 0, 0, 0, 1017, 167, 1,
        0, 0, 0, 1018, 1016, 1, 0, 0, 0, 1019, 1020, 5, 280, 0, 0, 1020, 1023, 3, 170, 85, 0, 1021, 1023, 3, 170, 85, 0,
        1022, 1019, 1, 0, 0, 0, 1022, 1021, 1, 0, 0, 0, 1023, 169, 1, 0, 0, 0, 1024, 1031, 3, 14, 7, 0, 1025, 1031, 5,
        274, 0, 0, 1026, 1027, 5, 294, 0, 0, 1027, 1028, 3, 164, 82, 0, 1028, 1029, 5, 295, 0, 0, 1029, 1031, 1, 0, 0,
        0, 1030, 1024, 1, 0, 0, 0, 1030, 1025, 1, 0, 0, 0, 1030, 1026, 1, 0, 0, 0, 1031, 171, 1, 0, 0, 0, 1032, 1045, 5,
        276, 0, 0, 1033, 1034, 5, 276, 0, 0, 1034, 1045, 5, 287, 0, 0, 1035, 1036, 5, 286, 0, 0, 1036, 1045, 5, 276, 0,
        0, 1037, 1039, 5, 286, 0, 0, 1038, 1037, 1, 0, 0, 0, 1038, 1039, 1, 0, 0, 0, 1039, 1040, 1, 0, 0, 0, 1040, 1042,
        5, 272, 0, 0, 1041, 1043, 5, 287, 0, 0, 1042, 1041, 1, 0, 0, 0, 1042, 1043, 1, 0, 0, 0, 1043, 1045, 1, 0, 0, 0,
        1044, 1032, 1, 0, 0, 0, 1044, 1033, 1, 0, 0, 0, 1044, 1035, 1, 0, 0, 0, 1044, 1038, 1, 0, 0, 0, 1045, 173, 1, 0,
        0, 0, 1046, 1047, 6, 87, -1, 0, 1047, 1053, 3, 176, 88, 0, 1048, 1049, 5, 294, 0, 0, 1049, 1050, 3, 174, 87, 0,
        1050, 1051, 5, 295, 0, 0, 1051, 1053, 1, 0, 0, 0, 1052, 1046, 1, 0, 0, 0, 1052, 1048, 1, 0, 0, 0, 1053, 1074, 1,
        0, 0, 0, 1054, 1056, 10, 5, 0, 0, 1055, 1057, 3, 186, 93, 0, 1056, 1055, 1, 0, 0, 0, 1056, 1057, 1, 0, 0, 0,
        1057, 1058, 1, 0, 0, 0, 1058, 1059, 5, 46, 0, 0, 1059, 1060, 5, 120, 0, 0, 1060, 1073, 3, 182, 91, 0, 1061,
        1062, 10, 4, 0, 0, 1062, 1063, 5, 270, 0, 0, 1063, 1073, 3, 182, 91, 0, 1064, 1066, 10, 3, 0, 0, 1065, 1067, 3,
        186, 93, 0, 1066, 1065, 1, 0, 0, 0, 1066, 1067, 1, 0, 0, 0, 1067, 1068, 1, 0, 0, 0, 1068, 1069, 5, 120, 0, 0,
        1069, 1070, 3, 182, 91, 0, 1070, 1071, 3, 184, 92, 0, 1071, 1073, 1, 0, 0, 0, 1072, 1054, 1, 0, 0, 0, 1072,
        1061, 1, 0, 0, 0, 1072, 1064, 1, 0, 0, 0, 1073, 1076, 1, 0, 0, 0, 1074, 1072, 1, 0, 0, 0, 1074, 1075, 1, 0, 0,
        0, 1075, 175, 1, 0, 0, 0, 1076, 1074, 1, 0, 0, 0, 1077, 1080, 3, 178, 89, 0, 1078, 1080, 3, 180, 90, 0, 1079,
        1077, 1, 0, 0, 0, 1079, 1078, 1, 0, 0, 0, 1080, 177, 1, 0, 0, 0, 1081, 1082, 3, 192, 96, 0, 1082, 1083, 3, 14,
        7, 0, 1083, 1105, 1, 0, 0, 0, 1084, 1086, 3, 192, 96, 0, 1085, 1087, 3, 8, 4, 0, 1086, 1085, 1, 0, 0, 0, 1086,
        1087, 1, 0, 0, 0, 1087, 1089, 1, 0, 0, 0, 1088, 1090, 3, 10, 5, 0, 1089, 1088, 1, 0, 0, 0, 1089, 1090, 1, 0, 0,
        0, 1090, 1092, 1, 0, 0, 0, 1091, 1093, 3, 12, 6, 0, 1092, 1091, 1, 0, 0, 0, 1092, 1093, 1, 0, 0, 0, 1093, 1105,
        1, 0, 0, 0, 1094, 1096, 3, 258, 129, 0, 1095, 1097, 3, 8, 4, 0, 1096, 1095, 1, 0, 0, 0, 1096, 1097, 1, 0, 0, 0,
        1097, 1099, 1, 0, 0, 0, 1098, 1100, 3, 10, 5, 0, 1099, 1098, 1, 0, 0, 0, 1099, 1100, 1, 0, 0, 0, 1100, 1102, 1,
        0, 0, 0, 1101, 1103, 3, 12, 6, 0, 1102, 1101, 1, 0, 0, 0, 1102, 1103, 1, 0, 0, 0, 1103, 1105, 1, 0, 0, 0, 1104,
        1081, 1, 0, 0, 0, 1104, 1084, 1, 0, 0, 0, 1104, 1094, 1, 0, 0, 0, 1105, 179, 1, 0, 0, 0, 1106, 1107, 5, 238, 0,
        0, 1107, 1109, 3, 188, 94, 0, 1108, 1110, 3, 8, 4, 0, 1109, 1108, 1, 0, 0, 0, 1109, 1110, 1, 0, 0, 0, 1110,
        1112, 1, 0, 0, 0, 1111, 1113, 3, 10, 5, 0, 1112, 1111, 1, 0, 0, 0, 1112, 1113, 1, 0, 0, 0, 1113, 1115, 1, 0, 0,
        0, 1114, 1116, 3, 12, 6, 0, 1115, 1114, 1, 0, 0, 0, 1115, 1116, 1, 0, 0, 0, 1116, 181, 1, 0, 0, 0, 1117, 1123,
        3, 176, 88, 0, 1118, 1119, 5, 294, 0, 0, 1119, 1120, 3, 174, 87, 0, 1120, 1121, 5, 295, 0, 0, 1121, 1123, 1, 0,
        0, 0, 1122, 1117, 1, 0, 0, 0, 1122, 1118, 1, 0, 0, 0, 1123, 183, 1, 0, 0, 0, 1124, 1125, 5, 147, 0, 0, 1125,
        1126, 3, 188, 94, 0, 1126, 185, 1, 0, 0, 0, 1127, 1142, 5, 109, 0, 0, 1128, 1130, 5, 125, 0, 0, 1129, 1131, 5,
        153, 0, 0, 1130, 1129, 1, 0, 0, 0, 1130, 1131, 1, 0, 0, 0, 1131, 1142, 1, 0, 0, 0, 1132, 1134, 5, 176, 0, 0,
        1133, 1135, 5, 153, 0, 0, 1134, 1133, 1, 0, 0, 0, 1134, 1135, 1, 0, 0, 0, 1135, 1142, 1, 0, 0, 0, 1136, 1138, 5,
        96, 0, 0, 1137, 1139, 5, 153, 0, 0, 1138, 1137, 1, 0, 0, 0, 1138, 1139, 1, 0, 0, 0, 1139, 1142, 1, 0, 0, 0,
        1140, 1142, 5, 153, 0, 0, 1141, 1127, 1, 0, 0, 0, 1141, 1128, 1, 0, 0, 0, 1141, 1132, 1, 0, 0, 0, 1141, 1136, 1,
        0, 0, 0, 1141, 1140, 1, 0, 0, 0, 1142, 187, 1, 0, 0, 0, 1143, 1144, 3, 190, 95, 0, 1144, 189, 1, 0, 0, 0, 1145,
        1146, 6, 95, -1, 0, 1146, 1147, 3, 192, 96, 0, 1147, 1177, 1, 0, 0, 0, 1148, 1150, 10, 4, 0, 0, 1149, 1151, 5,
        153, 0, 0, 1150, 1149, 1, 0, 0, 0, 1150, 1151, 1, 0, 0, 0, 1151, 1152, 1, 0, 0, 0, 1152, 1154, 5, 76, 0, 0,
        1153, 1155, 7, 3, 0, 0, 1154, 1153, 1, 0, 0, 0, 1154, 1155, 1, 0, 0, 0, 1155, 1156, 1, 0, 0, 0, 1156, 1176, 3,
        192, 96, 0, 1157, 1159, 10, 3, 0, 0, 1158, 1160, 5, 153, 0, 0, 1159, 1158, 1, 0, 0, 0, 1159, 1160, 1, 0, 0, 0,
        1160, 1161, 1, 0, 0, 0, 1161, 1163, 5, 209, 0, 0, 1162, 1164, 7, 3, 0, 0, 1163, 1162, 1, 0, 0, 0, 1163, 1164, 1,
        0, 0, 0, 1164, 1165, 1, 0, 0, 0, 1165, 1176, 3, 192, 96, 0, 1166, 1168, 10, 2, 0, 0, 1167, 1169, 5, 153, 0, 0,
        1168, 1167, 1, 0, 0, 0, 1168, 1169, 1, 0, 0, 0, 1169, 1170, 1, 0, 0, 0, 1170, 1172, 5, 115, 0, 0, 1171, 1173, 7,
        3, 0, 0, 1172, 1171, 1, 0, 0, 0, 1172, 1173, 1, 0, 0, 0, 1173, 1174, 1, 0, 0, 0, 1174, 1176, 3, 192, 96, 0,
        1175, 1148, 1, 0, 0, 0, 1175, 1157, 1, 0, 0, 0, 1175, 1166, 1, 0, 0, 0, 1176, 1179, 1, 0, 0, 0, 1177, 1175, 1,
        0, 0, 0, 1177, 1178, 1, 0, 0, 0, 1178, 191, 1, 0, 0, 0, 1179, 1177, 1, 0, 0, 0, 1180, 1182, 3, 94, 47, 0, 1181,
        1183, 3, 124, 62, 0, 1182, 1181, 1, 0, 0, 0, 1182, 1183, 1, 0, 0, 0, 1183, 1184, 1, 0, 0, 0, 1184, 1186, 3, 130,
        65, 0, 1185, 1187, 3, 102, 51, 0, 1186, 1185, 1, 0, 0, 0, 1186, 1187, 1, 0, 0, 0, 1187, 1189, 1, 0, 0, 0, 1188,
        1190, 3, 132, 66, 0, 1189, 1188, 1, 0, 0, 0, 1189, 1190, 1, 0, 0, 0, 1190, 1192, 1, 0, 0, 0, 1191, 1193, 3, 110,
        55, 0, 1192, 1191, 1, 0, 0, 0, 1192, 1193, 1, 0, 0, 0, 1193, 1195, 1, 0, 0, 0, 1194, 1196, 3, 122, 61, 0, 1195,
        1194, 1, 0, 0, 0, 1195, 1196, 1, 0, 0, 0, 1196, 1198, 1, 0, 0, 0, 1197, 1199, 3, 106, 53, 0, 1198, 1197, 1, 0,
        0, 0, 1198, 1199, 1, 0, 0, 0, 1199, 1201, 1, 0, 0, 0, 1200, 1202, 3, 136, 68, 0, 1201, 1200, 1, 0, 0, 0, 1201,
        1202, 1, 0, 0, 0, 1202, 1204, 1, 0, 0, 0, 1203, 1205, 3, 134, 67, 0, 1204, 1203, 1, 0, 0, 0, 1204, 1205, 1, 0,
        0, 0, 1205, 1208, 1, 0, 0, 0, 1206, 1208, 3, 194, 97, 0, 1207, 1180, 1, 0, 0, 0, 1207, 1206, 1, 0, 0, 0, 1208,
        193, 1, 0, 0, 0, 1209, 1210, 6, 97, -1, 0, 1210, 1211, 3, 196, 98, 0, 1211, 1217, 1, 0, 0, 0, 1212, 1213, 10, 2,
        0, 0, 1213, 1214, 5, 151, 0, 0, 1214, 1216, 3, 196, 98, 0, 1215, 1212, 1, 0, 0, 0, 1216, 1219, 1, 0, 0, 0, 1217,
        1215, 1, 0, 0, 0, 1217, 1218, 1, 0, 0, 0, 1218, 195, 1, 0, 0, 0, 1219, 1217, 1, 0, 0, 0, 1220, 1221, 6, 98, -1,
        0, 1221, 1222, 3, 198, 99, 0, 1222, 1228, 1, 0, 0, 0, 1223, 1224, 10, 2, 0, 0, 1224, 1225, 5, 7, 0, 0, 1225,
        1227, 3, 198, 99, 0, 1226, 1223, 1, 0, 0, 0, 1227, 1230, 1, 0, 0, 0, 1228, 1226, 1, 0, 0, 0, 1228, 1229, 1, 0,
        0, 0, 1229, 197, 1, 0, 0, 0, 1230, 1228, 1, 0, 0, 0, 1231, 1232, 5, 140, 0, 0, 1232, 1235, 3, 198, 99, 0, 1233,
        1235, 3, 200, 100, 0, 1234, 1231, 1, 0, 0, 0, 1234, 1233, 1, 0, 0, 0, 1235, 199, 1, 0, 0, 0, 1236, 1237, 6, 100,
        -1, 0, 1237, 1238, 3, 202, 101, 0, 1238, 1284, 1, 0, 0, 0, 1239, 1240, 10, 7, 0, 0, 1240, 1241, 7, 8, 0, 0,
        1241, 1283, 3, 202, 101, 0, 1242, 1243, 10, 6, 0, 0, 1243, 1245, 5, 118, 0, 0, 1244, 1246, 5, 140, 0, 0, 1245,
        1244, 1, 0, 0, 0, 1245, 1246, 1, 0, 0, 0, 1246, 1247, 1, 0, 0, 0, 1247, 1283, 3, 278, 139, 0, 1248, 1250, 10, 5,
        0, 0, 1249, 1251, 5, 140, 0, 0, 1250, 1249, 1, 0, 0, 0, 1250, 1251, 1, 0, 0, 0, 1251, 1252, 1, 0, 0, 0, 1252,
        1253, 5, 106, 0, 0, 1253, 1254, 5, 294, 0, 0, 1254, 1255, 3, 188, 94, 0, 1255, 1256, 5, 295, 0, 0, 1256, 1283,
        1, 0, 0, 0, 1257, 1259, 10, 4, 0, 0, 1258, 1260, 5, 140, 0, 0, 1259, 1258, 1, 0, 0, 0, 1259, 1260, 1, 0, 0, 0,
        1260, 1261, 1, 0, 0, 0, 1261, 1262, 5, 106, 0, 0, 1262, 1283, 3, 202, 101, 0, 1263, 1265, 10, 3, 0, 0, 1264,
        1266, 5, 140, 0, 0, 1265, 1264, 1, 0, 0, 0, 1265, 1266, 1, 0, 0, 0, 1266, 1267, 1, 0, 0, 0, 1267, 1268, 5, 127,
        0, 0, 1268, 1271, 3, 202, 101, 0, 1269, 1270, 5, 74, 0, 0, 1270, 1272, 3, 188, 94, 0, 1271, 1269, 1, 0, 0, 0,
        1271, 1272, 1, 0, 0, 0, 1272, 1283, 1, 0, 0, 0, 1273, 1275, 10, 2, 0, 0, 1274, 1276, 5, 140, 0, 0, 1275, 1274,
        1, 0, 0, 0, 1275, 1276, 1, 0, 0, 0, 1276, 1277, 1, 0, 0, 0, 1277, 1278, 5, 17, 0, 0, 1278, 1279, 3, 202, 101, 0,
        1279, 1280, 5, 7, 0, 0, 1280, 1281, 3, 202, 101, 0, 1281, 1283, 1, 0, 0, 0, 1282, 1239, 1, 0, 0, 0, 1282, 1242,
        1, 0, 0, 0, 1282, 1248, 1, 0, 0, 0, 1282, 1257, 1, 0, 0, 0, 1282, 1263, 1, 0, 0, 0, 1282, 1273, 1, 0, 0, 0,
        1283, 1286, 1, 0, 0, 0, 1284, 1282, 1, 0, 0, 0, 1284, 1285, 1, 0, 0, 0, 1285, 201, 1, 0, 0, 0, 1286, 1284, 1, 0,
        0, 0, 1287, 1288, 6, 101, -1, 0, 1288, 1289, 3, 204, 102, 0, 1289, 1295, 1, 0, 0, 0, 1290, 1291, 10, 2, 0, 0,
        1291, 1292, 7, 9, 0, 0, 1292, 1294, 3, 204, 102, 0, 1293, 1290, 1, 0, 0, 0, 1294, 1297, 1, 0, 0, 0, 1295, 1293,
        1, 0, 0, 0, 1295, 1296, 1, 0, 0, 0, 1296, 203, 1, 0, 0, 0, 1297, 1295, 1, 0, 0, 0, 1298, 1299, 6, 102, -1, 0,
        1299, 1300, 3, 206, 103, 0, 1300, 1306, 1, 0, 0, 0, 1301, 1302, 10, 2, 0, 0, 1302, 1303, 7, 10, 0, 0, 1303,
        1305, 3, 206, 103, 0, 1304, 1301, 1, 0, 0, 0, 1305, 1308, 1, 0, 0, 0, 1306, 1304, 1, 0, 0, 0, 1306, 1307, 1, 0,
        0, 0, 1307, 205, 1, 0, 0, 0, 1308, 1306, 1, 0, 0, 0, 1309, 1310, 6, 103, -1, 0, 1310, 1311, 3, 208, 104, 0,
        1311, 1317, 1, 0, 0, 0, 1312, 1313, 10, 2, 0, 0, 1313, 1314, 7, 11, 0, 0, 1314, 1316, 3, 208, 104, 0, 1315,
        1312, 1, 0, 0, 0, 1316, 1319, 1, 0, 0, 0, 1317, 1315, 1, 0, 0, 0, 1317, 1318, 1, 0, 0, 0, 1318, 207, 1, 0, 0, 0,
        1319, 1317, 1, 0, 0, 0, 1320, 1321, 7, 10, 0, 0, 1321, 1324, 3, 208, 104, 0, 1322, 1324, 3, 210, 105, 0, 1323,
        1320, 1, 0, 0, 0, 1323, 1322, 1, 0, 0, 0, 1324, 209, 1, 0, 0, 0, 1325, 1326, 6, 105, -1, 0, 1326, 1347, 3, 212,
        106, 0, 1327, 1347, 3, 238, 119, 0, 1328, 1347, 3, 226, 113, 0, 1329, 1347, 3, 228, 114, 0, 1330, 1347, 3, 230,
        115, 0, 1331, 1347, 3, 232, 116, 0, 1332, 1347, 3, 242, 121, 0, 1333, 1347, 3, 240, 120, 0, 1334, 1347, 3, 244,
        122, 0, 1335, 1347, 3, 216, 108, 0, 1336, 1347, 3, 248, 124, 0, 1337, 1347, 3, 234, 117, 0, 1338, 1347, 3, 246,
        123, 0, 1339, 1347, 3, 250, 125, 0, 1340, 1347, 3, 214, 107, 0, 1341, 1347, 3, 256, 128, 0, 1342, 1347, 3, 218,
        109, 0, 1343, 1347, 3, 224, 112, 0, 1344, 1347, 3, 220, 110, 0, 1345, 1347, 3, 236, 118, 0, 1346, 1325, 1, 0, 0,
        0, 1346, 1327, 1, 0, 0, 0, 1346, 1328, 1, 0, 0, 0, 1346, 1329, 1, 0, 0, 0, 1346, 1330, 1, 0, 0, 0, 1346, 1331,
        1, 0, 0, 0, 1346, 1332, 1, 0, 0, 0, 1346, 1333, 1, 0, 0, 0, 1346, 1334, 1, 0, 0, 0, 1346, 1335, 1, 0, 0, 0,
        1346, 1336, 1, 0, 0, 0, 1346, 1337, 1, 0, 0, 0, 1346, 1338, 1, 0, 0, 0, 1346, 1339, 1, 0, 0, 0, 1346, 1340, 1,
        0, 0, 0, 1346, 1341, 1, 0, 0, 0, 1346, 1342, 1, 0, 0, 0, 1346, 1343, 1, 0, 0, 0, 1346, 1344, 1, 0, 0, 0, 1346,
        1345, 1, 0, 0, 0, 1347, 1356, 1, 0, 0, 0, 1348, 1350, 10, 6, 0, 0, 1349, 1351, 3, 254, 127, 0, 1350, 1349, 1, 0,
        0, 0, 1351, 1352, 1, 0, 0, 0, 1352, 1350, 1, 0, 0, 0, 1352, 1353, 1, 0, 0, 0, 1353, 1355, 1, 0, 0, 0, 1354,
        1348, 1, 0, 0, 0, 1355, 1358, 1, 0, 0, 0, 1356, 1354, 1, 0, 0, 0, 1356, 1357, 1, 0, 0, 0, 1357, 211, 1, 0, 0, 0,
        1358, 1356, 1, 0, 0, 0, 1359, 1360, 5, 294, 0, 0, 1360, 1361, 3, 188, 94, 0, 1361, 1362, 5, 295, 0, 0, 1362,
        1371, 1, 0, 0, 0, 1363, 1371, 5, 51, 0, 0, 1364, 1371, 5, 48, 0, 0, 1365, 1371, 3, 260, 130, 0, 1366, 1371, 3,
        262, 131, 0, 1367, 1371, 3, 276, 138, 0, 1368, 1371, 3, 266, 133, 0, 1369, 1371, 3, 272, 136, 0, 1370, 1359, 1,
        0, 0, 0, 1370, 1363, 1, 0, 0, 0, 1370, 1364, 1, 0, 0, 0, 1370, 1365, 1, 0, 0, 0, 1370, 1366, 1, 0, 0, 0, 1370,
        1367, 1, 0, 0, 0, 1370, 1368, 1, 0, 0, 0, 1370, 1369, 1, 0, 0, 0, 1371, 213, 1, 0, 0, 0, 1372, 1373, 5, 143, 0,
        0, 1373, 1374, 5, 294, 0, 0, 1374, 1375, 3, 188, 94, 0, 1375, 1376, 5, 270, 0, 0, 1376, 1377, 3, 188, 94, 0,
        1377, 1378, 5, 295, 0, 0, 1378, 215, 1, 0, 0, 0, 1379, 1380, 5, 32, 0, 0, 1380, 1381, 5, 294, 0, 0, 1381, 1386,
        3, 188, 94, 0, 1382, 1383, 5, 270, 0, 0, 1383, 1385, 3, 188, 94, 0, 1384, 1382, 1, 0, 0, 0, 1385, 1388, 1, 0, 0,
        0, 1386, 1384, 1, 0, 0, 0, 1386, 1387, 1, 0, 0, 0, 1387, 1389, 1, 0, 0, 0, 1388, 1386, 1, 0, 0, 0, 1389, 1390,
        5, 295, 0, 0, 1390, 217, 1, 0, 0, 0, 1391, 1393, 5, 23, 0, 0, 1392, 1394, 3, 188, 94, 0, 1393, 1392, 1, 0, 0, 0,
        1393, 1394, 1, 0, 0, 0, 1394, 1400, 1, 0, 0, 0, 1395, 1396, 5, 223, 0, 0, 1396, 1397, 3, 188, 94, 0, 1397, 1398,
        5, 200, 0, 0, 1398, 1399, 3, 188, 94, 0, 1399, 1401, 1, 0, 0, 0, 1400, 1395, 1, 0, 0, 0, 1401, 1402, 1, 0, 0, 0,
        1402, 1400, 1, 0, 0, 0, 1402, 1403, 1, 0, 0, 0, 1403, 1406, 1, 0, 0, 0, 1404, 1405, 5, 71, 0, 0, 1405, 1407, 3,
        188, 94, 0, 1406, 1404, 1, 0, 0, 0, 1406, 1407, 1, 0, 0, 0, 1407, 1408, 1, 0, 0, 0, 1408, 1409, 5, 72, 0, 0,
        1409, 219, 1, 0, 0, 0, 1410, 1411, 5, 219, 0, 0, 1411, 1416, 3, 222, 111, 0, 1412, 1413, 5, 270, 0, 0, 1413,
        1415, 3, 222, 111, 0, 1414, 1412, 1, 0, 0, 0, 1415, 1418, 1, 0, 0, 0, 1416, 1414, 1, 0, 0, 0, 1416, 1417, 1, 0,
        0, 0, 1417, 221, 1, 0, 0, 0, 1418, 1416, 1, 0, 0, 0, 1419, 1420, 5, 294, 0, 0, 1420, 1425, 3, 188, 94, 0, 1421,
        1422, 5, 270, 0, 0, 1422, 1424, 3, 188, 94, 0, 1423, 1421, 1, 0, 0, 0, 1424, 1427, 1, 0, 0, 0, 1425, 1423, 1, 0,
        0, 0, 1425, 1426, 1, 0, 0, 0, 1426, 1428, 1, 0, 0, 0, 1427, 1425, 1, 0, 0, 0, 1428, 1429, 5, 295, 0, 0, 1429,
        223, 1, 0, 0, 0, 1430, 1431, 5, 294, 0, 0, 1431, 1434, 3, 188, 94, 0, 1432, 1433, 5, 270, 0, 0, 1433, 1435, 3,
        188, 94, 0, 1434, 1432, 1, 0, 0, 0, 1435, 1436, 1, 0, 0, 0, 1436, 1434, 1, 0, 0, 0, 1436, 1437, 1, 0, 0, 0,
        1437, 1438, 1, 0, 0, 0, 1438, 1439, 5, 295, 0, 0, 1439, 225, 1, 0, 0, 0, 1440, 1441, 7, 12, 0, 0, 1441, 1450, 5,
        294, 0, 0, 1442, 1447, 3, 188, 94, 0, 1443, 1444, 5, 270, 0, 0, 1444, 1446, 3, 188, 94, 0, 1445, 1443, 1, 0, 0,
        0, 1446, 1449, 1, 0, 0, 0, 1447, 1445, 1, 0, 0, 0, 1447, 1448, 1, 0, 0, 0, 1448, 1451, 1, 0, 0, 0, 1449, 1447,
        1, 0, 0, 0, 1450, 1442, 1, 0, 0, 0, 1450, 1451, 1, 0, 0, 0, 1451, 1452, 1, 0, 0, 0, 1452, 1453, 5, 295, 0, 0,
        1453, 227, 1, 0, 0, 0, 1454, 1455, 5, 195, 0, 0, 1455, 1456, 5, 294, 0, 0, 1456, 1463, 3, 188, 94, 0, 1457,
        1458, 5, 270, 0, 0, 1458, 1461, 3, 188, 94, 0, 1459, 1460, 5, 270, 0, 0, 1460, 1462, 3, 188, 94, 0, 1461, 1459,
        1, 0, 0, 0, 1461, 1462, 1, 0, 0, 0, 1462, 1464, 1, 0, 0, 0, 1463, 1457, 1, 0, 0, 0, 1463, 1464, 1, 0, 0, 0,
        1464, 1465, 1, 0, 0, 0, 1465, 1466, 5, 295, 0, 0, 1466, 1481, 1, 0, 0, 0, 1467, 1468, 5, 195, 0, 0, 1468, 1469,
        5, 294, 0, 0, 1469, 1476, 3, 188, 94, 0, 1470, 1471, 5, 95, 0, 0, 1471, 1474, 3, 188, 94, 0, 1472, 1473, 5, 92,
        0, 0, 1473, 1475, 3, 188, 94, 0, 1474, 1472, 1, 0, 0, 0, 1474, 1475, 1, 0, 0, 0, 1475, 1477, 1, 0, 0, 0, 1476,
        1470, 1, 0, 0, 0, 1476, 1477, 1, 0, 0, 0, 1477, 1478, 1, 0, 0, 0, 1478, 1479, 5, 295, 0, 0, 1479, 1481, 1, 0, 0,
        0, 1480, 1454, 1, 0, 0, 0, 1480, 1467, 1, 0, 0, 0, 1481, 229, 1, 0, 0, 0, 1482, 1483, 5, 160, 0, 0, 1483, 1484,
        5, 294, 0, 0, 1484, 1485, 3, 188, 94, 0, 1485, 1486, 5, 270, 0, 0, 1486, 1487, 3, 188, 94, 0, 1487, 1488, 5,
        295, 0, 0, 1488, 1497, 1, 0, 0, 0, 1489, 1490, 5, 160, 0, 0, 1490, 1491, 5, 294, 0, 0, 1491, 1492, 3, 188, 94,
        0, 1492, 1493, 5, 106, 0, 0, 1493, 1494, 3, 188, 94, 0, 1494, 1495, 5, 295, 0, 0, 1495, 1497, 1, 0, 0, 0, 1496,
        1482, 1, 0, 0, 0, 1496, 1489, 1, 0, 0, 0, 1497, 231, 1, 0, 0, 0, 1498, 1499, 5, 156, 0, 0, 1499, 1500, 5, 294,
        0, 0, 1500, 1501, 3, 188, 94, 0, 1501, 1502, 5, 270, 0, 0, 1502, 1503, 3, 188, 94, 0, 1503, 1504, 5, 270, 0, 0,
        1504, 1507, 3, 188, 94, 0, 1505, 1506, 5, 270, 0, 0, 1506, 1508, 3, 188, 94, 0, 1507, 1505, 1, 0, 0, 0, 1507,
        1508, 1, 0, 0, 0, 1508, 1509, 1, 0, 0, 0, 1509, 1510, 5, 295, 0, 0, 1510, 1525, 1, 0, 0, 0, 1511, 1512, 5, 156,
        0, 0, 1512, 1513, 5, 294, 0, 0, 1513, 1514, 3, 188, 94, 0, 1514, 1515, 5, 159, 0, 0, 1515, 1516, 3, 188, 94, 0,
        1516, 1517, 5, 95, 0, 0, 1517, 1520, 3, 188, 94, 0, 1518, 1519, 5, 92, 0, 0, 1519, 1521, 3, 188, 94, 0, 1520,
        1518, 1, 0, 0, 0, 1520, 1521, 1, 0, 0, 0, 1521, 1522, 1, 0, 0, 0, 1522, 1523, 5, 295, 0, 0, 1523, 1525, 1, 0, 0,
        0, 1524, 1498, 1, 0, 0, 0, 1524, 1511, 1, 0, 0, 0, 1525, 233, 1, 0, 0, 0, 1526, 1527, 5, 44, 0, 0, 1527, 1528,
        5, 294, 0, 0, 1528, 1529, 5, 277, 0, 0, 1529, 1539, 5, 295, 0, 0, 1530, 1531, 7, 13, 0, 0, 1531, 1533, 5, 294,
        0, 0, 1532, 1534, 3, 100, 50, 0, 1533, 1532, 1, 0, 0, 0, 1533, 1534, 1, 0, 0, 0, 1534, 1535, 1, 0, 0, 0, 1535,
        1536, 3, 188, 94, 0, 1536, 1537, 5, 295, 0, 0, 1537, 1539, 1, 0, 0, 0, 1538, 1526, 1, 0, 0, 0, 1538, 1530, 1, 0,
        0, 0, 1539, 235, 1, 0, 0, 0, 1540, 1541, 7, 14, 0, 0, 1541, 1542, 5, 294, 0, 0, 1542, 1549, 3, 188, 94, 0, 1543,
        1544, 5, 270, 0, 0, 1544, 1547, 3, 188, 94, 0, 1545, 1546, 5, 270, 0, 0, 1546, 1548, 3, 188, 94, 0, 1547, 1545,
        1, 0, 0, 0, 1547, 1548, 1, 0, 0, 0, 1548, 1550, 1, 0, 0, 0, 1549, 1543, 1, 0, 0, 0, 1549, 1550, 1, 0, 0, 0,
        1550, 1551, 1, 0, 0, 0, 1551, 1552, 5, 295, 0, 0, 1552, 1553, 3, 116, 58, 0, 1553, 237, 1, 0, 0, 0, 1554, 1555,
        5, 24, 0, 0, 1555, 1556, 5, 294, 0, 0, 1556, 1557, 3, 188, 94, 0, 1557, 1558, 5, 10, 0, 0, 1558, 1559, 3, 278,
        139, 0, 1559, 1560, 5, 295, 0, 0, 1560, 239, 1, 0, 0, 0, 1561, 1562, 5, 235, 0, 0, 1562, 1563, 5, 294, 0, 0,
        1563, 1564, 3, 188, 94, 0, 1564, 1565, 5, 10, 0, 0, 1565, 1566, 3, 278, 139, 0, 1566, 1567, 5, 295, 0, 0, 1567,
        241, 1, 0, 0, 0, 1568, 1569, 5, 234, 0, 0, 1569, 1570, 5, 294, 0, 0, 1570, 1571, 3, 188, 94, 0, 1571, 1572, 5,
        10, 0, 0, 1572, 1573, 3, 278, 139, 0, 1573, 1574, 5, 295, 0, 0, 1574, 243, 1, 0, 0, 0, 1575, 1576, 5, 85, 0, 0,
        1576, 1577, 5, 294, 0, 0, 1577, 1578, 5, 303, 0, 0, 1578, 1579, 5, 95, 0, 0, 1579, 1580, 3, 188, 94, 0, 1580,
        1581, 5, 295, 0, 0, 1581, 245, 1, 0, 0, 0, 1582, 1583, 5, 207, 0, 0, 1583, 1591, 5, 294, 0, 0, 1584, 1586, 5,
        303, 0, 0, 1585, 1584, 1, 0, 0, 0, 1585, 1586, 1, 0, 0, 0, 1586, 1588, 1, 0, 0, 0, 1587, 1589, 3, 188, 94, 0,
        1588, 1587, 1, 0, 0, 0, 1588, 1589, 1, 0, 0, 0, 1589, 1590, 1, 0, 0, 0, 1590, 1592, 5, 95, 0, 0, 1591, 1585, 1,
        0, 0, 0, 1591, 1592, 1, 0, 0, 0, 1592, 1593, 1, 0, 0, 0, 1593, 1594, 3, 188, 94, 0, 1594, 1595, 5, 295, 0, 0,
        1595, 247, 1, 0, 0, 0, 1596, 1597, 7, 15, 0, 0, 1597, 1598, 5, 294, 0, 0, 1598, 1599, 5, 303, 0, 0, 1599, 1600,
        5, 270, 0, 0, 1600, 1601, 3, 188, 94, 0, 1601, 1602, 5, 270, 0, 0, 1602, 1603, 3, 188, 94, 0, 1603, 1604, 5,
        295, 0, 0, 1604, 249, 1, 0, 0, 0, 1605, 1606, 3, 252, 126, 0, 1606, 1615, 5, 294, 0, 0, 1607, 1612, 3, 188, 94,
        0, 1608, 1609, 5, 270, 0, 0, 1609, 1611, 3, 188, 94, 0, 1610, 1608, 1, 0, 0, 0, 1611, 1614, 1, 0, 0, 0, 1612,
        1610, 1, 0, 0, 0, 1612, 1613, 1, 0, 0, 0, 1613, 1616, 1, 0, 0, 0, 1614, 1612, 1, 0, 0, 0, 1615, 1607, 1, 0, 0,
        0, 1615, 1616, 1, 0, 0, 0, 1616, 1617, 1, 0, 0, 0, 1617, 1618, 5, 295, 0, 0, 1618, 251, 1, 0, 0, 0, 1619, 1620,
        3, 14, 7, 0, 1620, 1621, 5, 299, 0, 0, 1621, 1623, 1, 0, 0, 0, 1622, 1619, 1, 0, 0, 0, 1623, 1626, 1, 0, 0, 0,
        1624, 1622, 1, 0, 0, 0, 1624, 1625, 1, 0, 0, 0, 1625, 1627, 1, 0, 0, 0, 1626, 1624, 1, 0, 0, 0, 1627, 1638, 7,
        16, 0, 0, 1628, 1629, 3, 14, 7, 0, 1629, 1630, 5, 299, 0, 0, 1630, 1632, 1, 0, 0, 0, 1631, 1628, 1, 0, 0, 0,
        1632, 1635, 1, 0, 0, 0, 1633, 1631, 1, 0, 0, 0, 1633, 1634, 1, 0, 0, 0, 1634, 1636, 1, 0, 0, 0, 1635, 1633, 1,
        0, 0, 0, 1636, 1638, 3, 14, 7, 0, 1637, 1624, 1, 0, 0, 0, 1637, 1633, 1, 0, 0, 0, 1638, 253, 1, 0, 0, 0, 1639,
        1640, 5, 290, 0, 0, 1640, 1641, 3, 188, 94, 0, 1641, 1642, 5, 291, 0, 0, 1642, 1651, 1, 0, 0, 0, 1643, 1644, 5,
        290, 0, 0, 1644, 1645, 5, 277, 0, 0, 1645, 1651, 5, 291, 0, 0, 1646, 1647, 5, 299, 0, 0, 1647, 1651, 3, 14, 7,
        0, 1648, 1649, 5, 299, 0, 0, 1649, 1651, 5, 277, 0, 0, 1650, 1639, 1, 0, 0, 0, 1650, 1643, 1, 0, 0, 0, 1650,
        1646, 1, 0, 0, 0, 1650, 1648, 1, 0, 0, 0, 1651, 255, 1, 0, 0, 0, 1652, 1653, 5, 294, 0, 0, 1653, 1654, 3, 210,
        105, 0, 1654, 1655, 5, 130, 0, 0, 1655, 1656, 3, 140, 70, 0, 1656, 1657, 5, 295, 0, 0, 1657, 257, 1, 0, 0, 0,
        1658, 1659, 3, 210, 105, 0, 1659, 1660, 5, 130, 0, 0, 1660, 1661, 3, 138, 69, 0, 1661, 259, 1, 0, 0, 0, 1662,
        1663, 5, 298, 0, 0, 1663, 261, 1, 0, 0, 0, 1664, 1666, 5, 275, 0, 0, 1665, 1664, 1, 0, 0, 0, 1665, 1666, 1, 0,
        0, 0, 1666, 1667, 1, 0, 0, 0, 1667, 1673, 7, 0, 0, 0, 1668, 1670, 5, 275, 0, 0, 1669, 1668, 1, 0, 0, 0, 1669,
        1670, 1, 0, 0, 0, 1670, 1671, 1, 0, 0, 0, 1671, 1673, 3, 264, 132, 0, 1672, 1665, 1, 0, 0, 0, 1672, 1669, 1, 0,
        0, 0, 1673, 263, 1, 0, 0, 0, 1674, 1675, 5, 79, 0, 0, 1675, 265, 1, 0, 0, 0, 1676, 1679, 3, 268, 134, 0, 1677,
        1679, 3, 270, 135, 0, 1678, 1676, 1, 0, 0, 0, 1678, 1677, 1, 0, 0, 0, 1679, 267, 1, 0, 0, 0, 1680, 1689, 5, 290,
        0, 0, 1681, 1686, 3, 188, 94, 0, 1682, 1683, 5, 270, 0, 0, 1683, 1685, 3, 188, 94, 0, 1684, 1682, 1, 0, 0, 0,
        1685, 1688, 1, 0, 0, 0, 1686, 1684, 1, 0, 0, 0, 1686, 1687, 1, 0, 0, 0, 1687, 1690, 1, 0, 0, 0, 1688, 1686, 1,
        0, 0, 0, 1689, 1681, 1, 0, 0, 0, 1689, 1690, 1, 0, 0, 0, 1690, 1691, 1, 0, 0, 0, 1691, 1692, 5, 291, 0, 0, 1692,
        269, 1, 0, 0, 0, 1693, 1702, 5, 288, 0, 0, 1694, 1699, 3, 188, 94, 0, 1695, 1696, 5, 270, 0, 0, 1696, 1698, 3,
        188, 94, 0, 1697, 1695, 1, 0, 0, 0, 1698, 1701, 1, 0, 0, 0, 1699, 1697, 1, 0, 0, 0, 1699, 1700, 1, 0, 0, 0,
        1700, 1703, 1, 0, 0, 0, 1701, 1699, 1, 0, 0, 0, 1702, 1694, 1, 0, 0, 0, 1702, 1703, 1, 0, 0, 0, 1703, 1704, 1,
        0, 0, 0, 1704, 1705, 5, 289, 0, 0, 1705, 271, 1, 0, 0, 0, 1706, 1715, 5, 292, 0, 0, 1707, 1712, 3, 274, 137, 0,
        1708, 1709, 5, 270, 0, 0, 1709, 1711, 3, 274, 137, 0, 1710, 1708, 1, 0, 0, 0, 1711, 1714, 1, 0, 0, 0, 1712,
        1710, 1, 0, 0, 0, 1712, 1713, 1, 0, 0, 0, 1713, 1716, 1, 0, 0, 0, 1714, 1712, 1, 0, 0, 0, 1715, 1707, 1, 0, 0,
        0, 1715, 1716, 1, 0, 0, 0, 1716, 1717, 1, 0, 0, 0, 1717, 1718, 5, 293, 0, 0, 1718, 273, 1, 0, 0, 0, 1719, 1720,
        3, 188, 94, 0, 1720, 1721, 5, 296, 0, 0, 1721, 1722, 3, 188, 94, 0, 1722, 275, 1, 0, 0, 0, 1723, 1758, 5, 141,
        0, 0, 1724, 1758, 5, 236, 0, 0, 1725, 1758, 5, 208, 0, 0, 1726, 1758, 5, 88, 0, 0, 1727, 1758, 5, 300, 0, 0,
        1728, 1758, 5, 301, 0, 0, 1729, 1758, 5, 302, 0, 0, 1730, 1758, 5, 309, 0, 0, 1731, 1732, 5, 53, 0, 0, 1732,
        1758, 5, 300, 0, 0, 1733, 1737, 5, 201, 0, 0, 1734, 1735, 5, 294, 0, 0, 1735, 1736, 5, 301, 0, 0, 1736, 1738, 5,
        295, 0, 0, 1737, 1734, 1, 0, 0, 0, 1737, 1738, 1, 0, 0, 0, 1738, 1742, 1, 0, 0, 0, 1739, 1740, 5, 226, 0, 0,
        1740, 1741, 5, 201, 0, 0, 1741, 1743, 5, 229, 0, 0, 1742, 1739, 1, 0, 0, 0, 1742, 1743, 1, 0, 0, 0, 1743, 1744,
        1, 0, 0, 0, 1744, 1758, 5, 300, 0, 0, 1745, 1749, 5, 202, 0, 0, 1746, 1747, 5, 294, 0, 0, 1747, 1748, 5, 301, 0,
        0, 1748, 1750, 5, 295, 0, 0, 1749, 1746, 1, 0, 0, 0, 1749, 1750, 1, 0, 0, 0, 1750, 1754, 1, 0, 0, 0, 1751, 1752,
        5, 226, 0, 0, 1752, 1753, 5, 201, 0, 0, 1753, 1755, 5, 229, 0, 0, 1754, 1751, 1, 0, 0, 0, 1754, 1755, 1, 0, 0,
        0, 1755, 1756, 1, 0, 0, 0, 1756, 1758, 5, 300, 0, 0, 1757, 1723, 1, 0, 0, 0, 1757, 1724, 1, 0, 0, 0, 1757, 1725,
        1, 0, 0, 0, 1757, 1726, 1, 0, 0, 0, 1757, 1727, 1, 0, 0, 0, 1757, 1728, 1, 0, 0, 0, 1757, 1729, 1, 0, 0, 0,
        1757, 1730, 1, 0, 0, 0, 1757, 1731, 1, 0, 0, 0, 1757, 1733, 1, 0, 0, 0, 1757, 1745, 1, 0, 0, 0, 1758, 277, 1, 0,
        0, 0, 1759, 1798, 7, 17, 0, 0, 1760, 1761, 5, 69, 0, 0, 1761, 1798, 5, 161, 0, 0, 1762, 1766, 7, 18, 0, 0, 1763,
        1764, 5, 294, 0, 0, 1764, 1765, 5, 301, 0, 0, 1765, 1767, 5, 295, 0, 0, 1766, 1763, 1, 0, 0, 0, 1766, 1767, 1,
        0, 0, 0, 1767, 1798, 1, 0, 0, 0, 1768, 1769, 5, 27, 0, 0, 1769, 1773, 5, 221, 0, 0, 1770, 1771, 5, 294, 0, 0,
        1771, 1772, 5, 301, 0, 0, 1772, 1774, 5, 295, 0, 0, 1773, 1770, 1, 0, 0, 0, 1773, 1774, 1, 0, 0, 0, 1774, 1798,
        1, 0, 0, 0, 1775, 1783, 7, 19, 0, 0, 1776, 1777, 5, 294, 0, 0, 1777, 1780, 5, 301, 0, 0, 1778, 1779, 5, 270, 0,
        0, 1779, 1781, 5, 301, 0, 0, 1780, 1778, 1, 0, 0, 0, 1780, 1781, 1, 0, 0, 0, 1781, 1782, 1, 0, 0, 0, 1782, 1784,
        5, 295, 0, 0, 1783, 1776, 1, 0, 0, 0, 1783, 1784, 1, 0, 0, 0, 1784, 1798, 1, 0, 0, 0, 1785, 1789, 7, 20, 0, 0,
        1786, 1787, 5, 294, 0, 0, 1787, 1788, 5, 301, 0, 0, 1788, 1790, 5, 295, 0, 0, 1789, 1786, 1, 0, 0, 0, 1789,
        1790, 1, 0, 0, 0, 1790, 1794, 1, 0, 0, 0, 1791, 1792, 5, 226, 0, 0, 1792, 1793, 5, 201, 0, 0, 1793, 1795, 5,
        229, 0, 0, 1794, 1791, 1, 0, 0, 0, 1794, 1795, 1, 0, 0, 0, 1795, 1798, 1, 0, 0, 0, 1796, 1798, 3, 14, 7, 0,
        1797, 1759, 1, 0, 0, 0, 1797, 1760, 1, 0, 0, 0, 1797, 1762, 1, 0, 0, 0, 1797, 1768, 1, 0, 0, 0, 1797, 1775, 1,
        0, 0, 0, 1797, 1785, 1, 0, 0, 0, 1797, 1796, 1, 0, 0, 0, 1798, 279, 1, 0, 0, 0, 224, 282, 286, 297, 302, 304,
        312, 337, 340, 347, 362, 371, 383, 388, 399, 406, 414, 419, 426, 432, 435, 438, 442, 447, 450, 455, 463, 469,
        482, 488, 496, 510, 513, 516, 522, 526, 531, 542, 545, 560, 568, 580, 585, 590, 601, 611, 614, 622, 631, 636,
        639, 642, 648, 655, 660, 665, 674, 681, 686, 689, 699, 713, 718, 722, 726, 734, 738, 747, 752, 755, 766, 776,
        788, 795, 810, 825, 830, 837, 841, 844, 849, 855, 861, 866, 868, 877, 881, 884, 890, 894, 896, 900, 903, 908,
        911, 915, 919, 922, 927, 930, 934, 936, 943, 946, 982, 986, 990, 993, 1005, 1016, 1022, 1030, 1038, 1042, 1044,
        1052, 1056, 1066, 1072, 1074, 1079, 1086, 1089, 1092, 1096, 1099, 1102, 1104, 1109, 1112, 1115, 1122, 1130,
        1134, 1138, 1141, 1150, 1154, 1159, 1163, 1168, 1172, 1175, 1177, 1182, 1186, 1189, 1192, 1195, 1198, 1201,
        1204, 1207, 1217, 1228, 1234, 1245, 1250, 1259, 1265, 1271, 1275, 1282, 1284, 1295, 1306, 1317, 1323, 1346,
        1352, 1356, 1370, 1386, 1393, 1402, 1406, 1416, 1425, 1436, 1447, 1450, 1461, 1463, 1474, 1476, 1480, 1496,
        1507, 1520, 1524, 1533, 1538, 1547, 1549, 1585, 1588, 1591, 1612, 1615, 1624, 1633, 1637, 1650, 1665, 1669,
        1672, 1678, 1686, 1689, 1699, 1702, 1712, 1715, 1737, 1742, 1749, 1754, 1757, 1766, 1773, 1780, 1783, 1789,
        1794, 1797,
    ]

    private static __ATN: antlr.ATN
    public static get _ATN(): antlr.ATN {
        if (!PartiQLParser.__ATN) {
            PartiQLParser.__ATN = new antlr.ATNDeserializer().deserialize(PartiQLParser._serializedATN)
        }

        return PartiQLParser.__ATN
    }

    private static readonly vocabulary = new antlr.Vocabulary(
        PartiQLParser.literalNames,
        PartiQLParser.symbolicNames,
        []
    )

    public override get vocabulary(): antlr.Vocabulary {
        return PartiQLParser.vocabulary
    }

    private static readonly decisionsToDFA = PartiQLParser._ATN.decisionToState.map(
        (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index)
    )
}

export class RootContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EOF, 0)!
    }
    public statement(): StatementContext[]
    public statement(i: number): StatementContext | null
    public statement(i?: number): StatementContext[] | StatementContext | null {
        if (i === undefined) {
            return this.getRuleContexts(StatementContext)
        }

        return this.getRuleContext(i, StatementContext)
    }
    public COLON_SEMI(): antlr.TerminalNode[]
    public COLON_SEMI(i: number): antlr.TerminalNode | null
    public COLON_SEMI(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COLON_SEMI)
        } else {
            return this.getToken(PartiQLParser.COLON_SEMI, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_root
    }
}

export class StatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public query(): QueryContext {
        return this.getRuleContext(0, QueryContext)!
    }
    public EXPLAIN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.EXPLAIN, 0)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public explainOption(): ExplainOptionContext[]
    public explainOption(i: number): ExplainOptionContext | null
    public explainOption(i?: number): ExplainOptionContext[] | ExplainOptionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExplainOptionContext)
        }

        return this.getRuleContext(i, ExplainOptionContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_statement
    }
}

export class QueryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_query
    }
    public override copyFrom(ctx: QueryContext): void {
        super.copyFrom(ctx)
    }
}
export class QueryExecContext extends QueryContext {
    public constructor(ctx: QueryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public execCommand(): ExecCommandContext {
        return this.getRuleContext(0, ExecCommandContext)!
    }
}
export class QueryDdlContext extends QueryContext {
    public constructor(ctx: QueryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ddl(): DdlContext {
        return this.getRuleContext(0, DdlContext)!
    }
}
export class QueryDqlContext extends QueryContext {
    public constructor(ctx: QueryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public dql(): DqlContext {
        return this.getRuleContext(0, DqlContext)!
    }
}
export class QueryDmlContext extends QueryContext {
    public constructor(ctx: QueryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public dml(): DmlContext {
        return this.getRuleContext(0, DmlContext)!
    }
}

export class ExplainOptionContext extends antlr.ParserRuleContext {
    public _param?: Token | null
    public _value?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public IDENTIFIER(): antlr.TerminalNode[]
    public IDENTIFIER(i: number): antlr.TerminalNode | null
    public IDENTIFIER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.IDENTIFIER)
        } else {
            return this.getToken(PartiQLParser.IDENTIFIER, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_explainOption
    }
}

export class AsIdentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_asIdent
    }
}

export class AtIdentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public AT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AT, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_atIdent
    }
}

export class ByIdentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BY, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_byIdent
    }
}

export class SymbolPrimitiveContext extends antlr.ParserRuleContext {
    public _ident?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public IDENTIFIER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)
    }
    public IDENTIFIER_QUOTED(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IDENTIFIER_QUOTED, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_symbolPrimitive
    }
}

export class DqlContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_dql
    }
}

export class ExecCommandContext extends antlr.ParserRuleContext {
    public _name?: ExprContext
    public _expr?: ExprContext
    public _args: ExprContext[] = []
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXEC(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXEC, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_execCommand
    }
}

export class QualifiedNameContext extends antlr.ParserRuleContext {
    public _symbolPrimitive?: SymbolPrimitiveContext
    public _qualifier: SymbolPrimitiveContext[] = []
    public _name?: SymbolPrimitiveContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext[]
    public symbolPrimitive(i: number): SymbolPrimitiveContext | null
    public symbolPrimitive(i?: number): SymbolPrimitiveContext[] | SymbolPrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SymbolPrimitiveContext)
        }

        return this.getRuleContext(i, SymbolPrimitiveContext)
    }
    public PERIOD(): antlr.TerminalNode[]
    public PERIOD(i: number): antlr.TerminalNode | null
    public PERIOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.PERIOD)
        } else {
            return this.getToken(PartiQLParser.PERIOD, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_qualifiedName
    }
}

export class TableNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableName
    }
}

export class TableConstraintNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableConstraintName
    }
}

export class ColumnNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_columnName
    }
}

export class ColumnConstraintNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_columnConstraintName
    }
}

export class DdlContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public createCommand(): CreateCommandContext | null {
        return this.getRuleContext(0, CreateCommandContext)
    }
    public dropCommand(): DropCommandContext | null {
        return this.getRuleContext(0, DropCommandContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_ddl
    }
}

export class CreateCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_createCommand
    }
    public override copyFrom(ctx: CreateCommandContext): void {
        super.copyFrom(ctx)
    }
}
export class CreateIndexContext extends CreateCommandContext {
    public constructor(ctx: CreateCommandContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CREATE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CREATE, 0)!
    }
    public INDEX(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INDEX, 0)!
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ON, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public pathSimple(): PathSimpleContext[]
    public pathSimple(i: number): PathSimpleContext | null
    public pathSimple(i?: number): PathSimpleContext[] | PathSimpleContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PathSimpleContext)
        }

        return this.getRuleContext(i, PathSimpleContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
}
export class CreateTableContext extends CreateCommandContext {
    public constructor(ctx: CreateCommandContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CREATE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CREATE, 0)!
    }
    public TABLE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.TABLE, 0)!
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public tableDef(): TableDefContext | null {
        return this.getRuleContext(0, TableDefContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
}

export class DropCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_dropCommand
    }
    public override copyFrom(ctx: DropCommandContext): void {
        super.copyFrom(ctx)
    }
}
export class DropTableContext extends DropCommandContext {
    public constructor(ctx: DropCommandContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public DROP(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DROP, 0)!
    }
    public TABLE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.TABLE, 0)!
    }
    public qualifiedName(): QualifiedNameContext {
        return this.getRuleContext(0, QualifiedNameContext)!
    }
}
export class DropIndexContext extends DropCommandContext {
    public _target?: SymbolPrimitiveContext
    public _on?: SymbolPrimitiveContext
    public constructor(ctx: DropCommandContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public DROP(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DROP, 0)!
    }
    public INDEX(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INDEX, 0)!
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ON, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext[]
    public symbolPrimitive(i: number): SymbolPrimitiveContext | null
    public symbolPrimitive(i?: number): SymbolPrimitiveContext[] | SymbolPrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SymbolPrimitiveContext)
        }

        return this.getRuleContext(i, SymbolPrimitiveContext)
    }
}

export class TableDefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public tableDefPart(): TableDefPartContext[]
    public tableDefPart(i: number): TableDefPartContext | null
    public tableDefPart(i?: number): TableDefPartContext[] | TableDefPartContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TableDefPartContext)
        }

        return this.getRuleContext(i, TableDefPartContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableDef
    }
}

export class TableDefPartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableDefPart
    }
    public override copyFrom(ctx: TableDefPartContext): void {
        super.copyFrom(ctx)
    }
}
export class ColumnDeclarationContext extends TableDefPartContext {
    public constructor(ctx: TableDefPartContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public columnName(): ColumnNameContext {
        return this.getRuleContext(0, ColumnNameContext)!
    }
    public type(): TypeContext {
        return this.getRuleContext(0, TypeContext)!
    }
    public columnConstraint(): ColumnConstraintContext[]
    public columnConstraint(i: number): ColumnConstraintContext | null
    public columnConstraint(i?: number): ColumnConstraintContext[] | ColumnConstraintContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ColumnConstraintContext)
        }

        return this.getRuleContext(i, ColumnConstraintContext)
    }
}

export class ColumnConstraintContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public columnConstraintDef(): ColumnConstraintDefContext {
        return this.getRuleContext(0, ColumnConstraintDefContext)!
    }
    public CONSTRAINT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CONSTRAINT, 0)
    }
    public columnConstraintName(): ColumnConstraintNameContext | null {
        return this.getRuleContext(0, ColumnConstraintNameContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_columnConstraint
    }
}

export class ColumnConstraintDefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_columnConstraintDef
    }
    public override copyFrom(ctx: ColumnConstraintDefContext): void {
        super.copyFrom(ctx)
    }
}
export class ColConstrNullContext extends ColumnConstraintDefContext {
    public constructor(ctx: ColumnConstraintDefContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public NULL(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NULL, 0)!
    }
}
export class ColConstrNotNullContext extends ColumnConstraintDefContext {
    public constructor(ctx: ColumnConstraintDefContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public NOT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NOT, 0)!
    }
    public NULL(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NULL, 0)!
    }
}

export class DmlContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_dml
    }
    public override copyFrom(ctx: DmlContext): void {
        super.copyFrom(ctx)
    }
}
export class DmlDeleteContext extends DmlContext {
    public constructor(ctx: DmlContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public deleteCommand(): DeleteCommandContext {
        return this.getRuleContext(0, DeleteCommandContext)!
    }
}
export class DmlInsertReturningContext extends DmlContext {
    public constructor(ctx: DmlContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public insertCommandReturning(): InsertCommandReturningContext {
        return this.getRuleContext(0, InsertCommandReturningContext)!
    }
}
export class DmlBaseWrapperContext extends DmlContext {
    public constructor(ctx: DmlContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public updateClause(): UpdateClauseContext | null {
        return this.getRuleContext(0, UpdateClauseContext)
    }
    public dmlBaseCommand(): DmlBaseCommandContext[]
    public dmlBaseCommand(i: number): DmlBaseCommandContext | null
    public dmlBaseCommand(i?: number): DmlBaseCommandContext[] | DmlBaseCommandContext | null {
        if (i === undefined) {
            return this.getRuleContexts(DmlBaseCommandContext)
        }

        return this.getRuleContext(i, DmlBaseCommandContext)
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext)
    }
    public returningClause(): ReturningClauseContext | null {
        return this.getRuleContext(0, ReturningClauseContext)
    }
    public fromClause(): FromClauseContext | null {
        return this.getRuleContext(0, FromClauseContext)
    }
}
export class DmlBaseContext extends DmlContext {
    public constructor(ctx: DmlContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public dmlBaseCommand(): DmlBaseCommandContext {
        return this.getRuleContext(0, DmlBaseCommandContext)!
    }
}

export class DmlBaseCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public insertStatement(): InsertStatementContext | null {
        return this.getRuleContext(0, InsertStatementContext)
    }
    public insertStatementLegacy(): InsertStatementLegacyContext | null {
        return this.getRuleContext(0, InsertStatementLegacyContext)
    }
    public setCommand(): SetCommandContext | null {
        return this.getRuleContext(0, SetCommandContext)
    }
    public replaceCommand(): ReplaceCommandContext | null {
        return this.getRuleContext(0, ReplaceCommandContext)
    }
    public removeCommand(): RemoveCommandContext | null {
        return this.getRuleContext(0, RemoveCommandContext)
    }
    public upsertCommand(): UpsertCommandContext | null {
        return this.getRuleContext(0, UpsertCommandContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_dmlBaseCommand
    }
}

export class PathSimpleContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public pathSimpleSteps(): PathSimpleStepsContext[]
    public pathSimpleSteps(i: number): PathSimpleStepsContext | null
    public pathSimpleSteps(i?: number): PathSimpleStepsContext[] | PathSimpleStepsContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PathSimpleStepsContext)
        }

        return this.getRuleContext(i, PathSimpleStepsContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_pathSimple
    }
}

export class PathSimpleStepsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_pathSimpleSteps
    }
    public override copyFrom(ctx: PathSimpleStepsContext): void {
        super.copyFrom(ctx)
    }
}
export class PathSimpleLiteralContext extends PathSimpleStepsContext {
    public _key?: LiteralContext
    public constructor(ctx: PathSimpleStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public literal(): LiteralContext {
        return this.getRuleContext(0, LiteralContext)!
    }
}
export class PathSimpleDotSymbolContext extends PathSimpleStepsContext {
    public _key?: SymbolPrimitiveContext
    public constructor(ctx: PathSimpleStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERIOD(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERIOD, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}
export class PathSimpleSymbolContext extends PathSimpleStepsContext {
    public _key?: SymbolPrimitiveContext
    public constructor(ctx: PathSimpleStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}

export class ReplaceCommandContext extends antlr.ParserRuleContext {
    public _value?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public REPLACE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.REPLACE, 0)!
    }
    public INTO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTO, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_replaceCommand
    }
}

export class UpsertCommandContext extends antlr.ParserRuleContext {
    public _value?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public UPSERT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.UPSERT, 0)!
    }
    public INTO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTO, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_upsertCommand
    }
}

export class RemoveCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public REMOVE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.REMOVE, 0)!
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_removeCommand
    }
}

export class InsertCommandReturningContext extends antlr.ParserRuleContext {
    public _value?: ExprContext
    public _pos?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public INSERT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INSERT, 0)!
    }
    public INTO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTO, 0)!
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public VALUE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VALUE, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public AT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AT, 0)
    }
    public onConflictLegacy(): OnConflictLegacyContext | null {
        return this.getRuleContext(0, OnConflictLegacyContext)
    }
    public returningClause(): ReturningClauseContext | null {
        return this.getRuleContext(0, ReturningClauseContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_insertCommandReturning
    }
}

export class InsertStatementContext extends antlr.ParserRuleContext {
    public _value?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public INSERT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INSERT, 0)!
    }
    public INTO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTO, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public onConflict(): OnConflictContext | null {
        return this.getRuleContext(0, OnConflictContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_insertStatement
    }
}

export class OnConflictContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ON, 0)!
    }
    public CONFLICT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CONFLICT, 0)!
    }
    public conflictAction(): ConflictActionContext {
        return this.getRuleContext(0, ConflictActionContext)!
    }
    public conflictTarget(): ConflictTargetContext | null {
        return this.getRuleContext(0, ConflictTargetContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_onConflict
    }
}

export class InsertStatementLegacyContext extends antlr.ParserRuleContext {
    public _value?: ExprContext
    public _pos?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public INSERT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INSERT, 0)!
    }
    public INTO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTO, 0)!
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public VALUE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VALUE, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public AT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AT, 0)
    }
    public onConflictLegacy(): OnConflictLegacyContext | null {
        return this.getRuleContext(0, OnConflictLegacyContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_insertStatementLegacy
    }
}

export class OnConflictLegacyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ON, 0)!
    }
    public CONFLICT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CONFLICT, 0)!
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.WHERE, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public DO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DO, 0)!
    }
    public NOTHING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NOTHING, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_onConflictLegacy
    }
}

export class ConflictTargetContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public symbolPrimitive(): SymbolPrimitiveContext[]
    public symbolPrimitive(i: number): SymbolPrimitiveContext | null
    public symbolPrimitive(i?: number): SymbolPrimitiveContext[] | SymbolPrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SymbolPrimitiveContext)
        }

        return this.getRuleContext(i, SymbolPrimitiveContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public ON(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ON, 0)
    }
    public CONSTRAINT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CONSTRAINT, 0)
    }
    public constraintName(): ConstraintNameContext | null {
        return this.getRuleContext(0, ConstraintNameContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_conflictTarget
    }
}

export class ConstraintNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_constraintName
    }
}

export class ConflictActionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public DO(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DO, 0)!
    }
    public NOTHING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NOTHING, 0)
    }
    public REPLACE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.REPLACE, 0)
    }
    public doReplace(): DoReplaceContext | null {
        return this.getRuleContext(0, DoReplaceContext)
    }
    public UPDATE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.UPDATE, 0)
    }
    public doUpdate(): DoUpdateContext | null {
        return this.getRuleContext(0, DoUpdateContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_conflictAction
    }
}

export class DoReplaceContext extends antlr.ParserRuleContext {
    public _condition?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXCLUDED(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXCLUDED, 0)!
    }
    public WHERE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.WHERE, 0)
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_doReplace
    }
}

export class DoUpdateContext extends antlr.ParserRuleContext {
    public _condition?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXCLUDED(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXCLUDED, 0)!
    }
    public WHERE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.WHERE, 0)
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_doUpdate
    }
}

export class UpdateClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public UPDATE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.UPDATE, 0)!
    }
    public tableBaseReference(): TableBaseReferenceContext {
        return this.getRuleContext(0, TableBaseReferenceContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_updateClause
    }
}

export class SetCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public SET(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SET, 0)!
    }
    public setAssignment(): SetAssignmentContext[]
    public setAssignment(i: number): SetAssignmentContext | null
    public setAssignment(i?: number): SetAssignmentContext[] | SetAssignmentContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SetAssignmentContext)
        }

        return this.getRuleContext(i, SetAssignmentContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_setCommand
    }
}

export class SetAssignmentContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public EQ(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EQ, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_setAssignment
    }
}

export class DeleteCommandContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public DELETE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DELETE, 0)!
    }
    public fromClauseSimple(): FromClauseSimpleContext {
        return this.getRuleContext(0, FromClauseSimpleContext)!
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext)
    }
    public returningClause(): ReturningClauseContext | null {
        return this.getRuleContext(0, ReturningClauseContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_deleteCommand
    }
}

export class ReturningClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public RETURNING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.RETURNING, 0)!
    }
    public returningColumn(): ReturningColumnContext[]
    public returningColumn(i: number): ReturningColumnContext | null
    public returningColumn(i?: number): ReturningColumnContext[] | ReturningColumnContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ReturningColumnContext)
        }

        return this.getRuleContext(i, ReturningColumnContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_returningClause
    }
}

export class ReturningColumnContext extends antlr.ParserRuleContext {
    public _status?: Token | null
    public _age?: Token | null
    public _col?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ASTERISK(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ASTERISK, 0)
    }
    public MODIFIED(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MODIFIED, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
    public OLD(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OLD, 0)
    }
    public NEW(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NEW, 0)
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_returningColumn
    }
}

export class FromClauseSimpleContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_fromClauseSimple
    }
    public override copyFrom(ctx: FromClauseSimpleContext): void {
        super.copyFrom(ctx)
    }
}
export class FromClauseSimpleExplicitContext extends FromClauseSimpleContext {
    public constructor(ctx: FromClauseSimpleContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.FROM, 0)!
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public atIdent(): AtIdentContext | null {
        return this.getRuleContext(0, AtIdentContext)
    }
    public byIdent(): ByIdentContext | null {
        return this.getRuleContext(0, ByIdentContext)
    }
}
export class FromClauseSimpleImplicitContext extends FromClauseSimpleContext {
    public constructor(ctx: FromClauseSimpleContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.FROM, 0)!
    }
    public pathSimple(): PathSimpleContext {
        return this.getRuleContext(0, PathSimpleContext)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}

export class WhereClauseContext extends antlr.ParserRuleContext {
    public _arg?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.WHERE, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_whereClause
    }
}

export class SelectClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_selectClause
    }
    public override copyFrom(ctx: SelectClauseContext): void {
        super.copyFrom(ctx)
    }
}
export class SelectAllContext extends SelectClauseContext {
    public constructor(ctx: SelectClauseContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public SELECT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SELECT, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
    public setQuantifierStrategy(): SetQuantifierStrategyContext | null {
        return this.getRuleContext(0, SetQuantifierStrategyContext)
    }
}
export class SelectValueContext extends SelectClauseContext {
    public constructor(ctx: SelectClauseContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public SELECT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SELECT, 0)!
    }
    public VALUE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VALUE, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public setQuantifierStrategy(): SetQuantifierStrategyContext | null {
        return this.getRuleContext(0, SetQuantifierStrategyContext)
    }
}
export class SelectItemsContext extends SelectClauseContext {
    public constructor(ctx: SelectClauseContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public SELECT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SELECT, 0)!
    }
    public projectionItems(): ProjectionItemsContext {
        return this.getRuleContext(0, ProjectionItemsContext)!
    }
    public setQuantifierStrategy(): SetQuantifierStrategyContext | null {
        return this.getRuleContext(0, SetQuantifierStrategyContext)
    }
}
export class SelectPivotContext extends SelectClauseContext {
    public _pivot?: ExprContext
    public _at?: ExprContext
    public constructor(ctx: SelectClauseContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PIVOT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PIVOT, 0)!
    }
    public AT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
}

export class ProjectionItemsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public projectionItem(): ProjectionItemContext[]
    public projectionItem(i: number): ProjectionItemContext | null
    public projectionItem(i?: number): ProjectionItemContext[] | ProjectionItemContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ProjectionItemContext)
        }

        return this.getRuleContext(i, ProjectionItemContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_projectionItems
    }
}

export class ProjectionItemContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext | null {
        return this.getRuleContext(0, SymbolPrimitiveContext)
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AS, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_projectionItem
    }
}

export class SetQuantifierStrategyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public DISTINCT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DISTINCT, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_setQuantifierStrategy
    }
}

export class LetClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public LET(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LET, 0)!
    }
    public letBinding(): LetBindingContext[]
    public letBinding(i: number): LetBindingContext | null
    public letBinding(i?: number): LetBindingContext[] | LetBindingContext | null {
        if (i === undefined) {
            return this.getRuleContexts(LetBindingContext)
        }

        return this.getRuleContext(i, LetBindingContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_letClause
    }
}

export class LetBindingContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_letBinding
    }
}

export class OrderByClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ORDER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ORDER, 0)!
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BY, 0)!
    }
    public orderSortSpec(): OrderSortSpecContext[]
    public orderSortSpec(i: number): OrderSortSpecContext | null
    public orderSortSpec(i?: number): OrderSortSpecContext[] | OrderSortSpecContext | null {
        if (i === undefined) {
            return this.getRuleContexts(OrderSortSpecContext)
        }

        return this.getRuleContext(i, OrderSortSpecContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_orderByClause
    }
}

export class OrderSortSpecContext extends antlr.ParserRuleContext {
    public _dir?: Token | null
    public _nulls?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public NULLS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NULLS, 0)
    }
    public ASC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ASC, 0)
    }
    public DESC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DESC, 0)
    }
    public FIRST(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FIRST, 0)
    }
    public LAST(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LAST, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_orderSortSpec
    }
}

export class GroupClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public GROUP(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.GROUP, 0)!
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BY, 0)!
    }
    public groupKey(): GroupKeyContext[]
    public groupKey(i: number): GroupKeyContext | null
    public groupKey(i?: number): GroupKeyContext[] | GroupKeyContext | null {
        if (i === undefined) {
            return this.getRuleContexts(GroupKeyContext)
        }

        return this.getRuleContext(i, GroupKeyContext)
    }
    public PARTIAL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PARTIAL, 0)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public groupAlias(): GroupAliasContext | null {
        return this.getRuleContext(0, GroupAliasContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_groupClause
    }
}

export class GroupAliasContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public GROUP(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.GROUP, 0)!
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_groupAlias
    }
}

export class GroupKeyContext extends antlr.ParserRuleContext {
    public _key?: ExprSelectContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public AS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AS, 0)
    }
    public symbolPrimitive(): SymbolPrimitiveContext | null {
        return this.getRuleContext(0, SymbolPrimitiveContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_groupKey
    }
}

export class OverContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public OVER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.OVER, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public windowPartitionList(): WindowPartitionListContext | null {
        return this.getRuleContext(0, WindowPartitionListContext)
    }
    public windowSortSpecList(): WindowSortSpecListContext | null {
        return this.getRuleContext(0, WindowSortSpecListContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_over
    }
}

export class WindowPartitionListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PARTITION(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PARTITION, 0)!
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BY, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_windowPartitionList
    }
}

export class WindowSortSpecListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ORDER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ORDER, 0)!
    }
    public BY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BY, 0)!
    }
    public orderSortSpec(): OrderSortSpecContext[]
    public orderSortSpec(i: number): OrderSortSpecContext | null
    public orderSortSpec(i?: number): OrderSortSpecContext[] | OrderSortSpecContext | null {
        if (i === undefined) {
            return this.getRuleContexts(OrderSortSpecContext)
        }

        return this.getRuleContext(i, OrderSortSpecContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_windowSortSpecList
    }
}

export class HavingClauseContext extends antlr.ParserRuleContext {
    public _arg?: ExprSelectContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public HAVING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.HAVING, 0)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_havingClause
    }
}

export class ExcludeClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXCLUDE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXCLUDE, 0)!
    }
    public excludeExpr(): ExcludeExprContext[]
    public excludeExpr(i: number): ExcludeExprContext | null
    public excludeExpr(i?: number): ExcludeExprContext[] | ExcludeExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExcludeExprContext)
        }

        return this.getRuleContext(i, ExcludeExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_excludeClause
    }
}

export class ExcludeExprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public excludeExprSteps(): ExcludeExprStepsContext[]
    public excludeExprSteps(i: number): ExcludeExprStepsContext | null
    public excludeExprSteps(i?: number): ExcludeExprStepsContext[] | ExcludeExprStepsContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExcludeExprStepsContext)
        }

        return this.getRuleContext(i, ExcludeExprStepsContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_excludeExpr
    }
}

export class ExcludeExprStepsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_excludeExprSteps
    }
    public override copyFrom(ctx: ExcludeExprStepsContext): void {
        super.copyFrom(ctx)
    }
}
export class ExcludeExprTupleAttrContext extends ExcludeExprStepsContext {
    public constructor(ctx: ExcludeExprStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERIOD(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERIOD, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}
export class ExcludeExprTupleWildcardContext extends ExcludeExprStepsContext {
    public constructor(ctx: ExcludeExprStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERIOD(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERIOD, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
}
export class ExcludeExprCollectionWildcardContext extends ExcludeExprStepsContext {
    public constructor(ctx: ExcludeExprStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
}
export class ExcludeExprCollectionAttrContext extends ExcludeExprStepsContext {
    public _attr?: Token | null
    public constructor(ctx: ExcludeExprStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public LITERAL_STRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)!
    }
}
export class ExcludeExprCollectionIndexContext extends ExcludeExprStepsContext {
    public _index?: Token | null
    public constructor(ctx: ExcludeExprStepsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public LITERAL_INTEGER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)!
    }
}

export class FromClauseContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.FROM, 0)!
    }
    public tableReference(): TableReferenceContext {
        return this.getRuleContext(0, TableReferenceContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_fromClause
    }
}

export class WhereClauseSelectContext extends antlr.ParserRuleContext {
    public _arg?: ExprSelectContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public WHERE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.WHERE, 0)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_whereClauseSelect
    }
}

export class OffsetByClauseContext extends antlr.ParserRuleContext {
    public _arg?: ExprSelectContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public OFFSET(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.OFFSET, 0)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_offsetByClause
    }
}

export class LimitClauseContext extends antlr.ParserRuleContext {
    public _arg?: ExprSelectContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public LIMIT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LIMIT, 0)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_limitClause
    }
}

export class GpmlPatternContext extends antlr.ParserRuleContext {
    public _selector?: MatchSelectorContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public matchPattern(): MatchPatternContext {
        return this.getRuleContext(0, MatchPatternContext)!
    }
    public matchSelector(): MatchSelectorContext | null {
        return this.getRuleContext(0, MatchSelectorContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_gpmlPattern
    }
}

export class GpmlPatternListContext extends antlr.ParserRuleContext {
    public _selector?: MatchSelectorContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public matchPattern(): MatchPatternContext[]
    public matchPattern(i: number): MatchPatternContext | null
    public matchPattern(i?: number): MatchPatternContext[] | MatchPatternContext | null {
        if (i === undefined) {
            return this.getRuleContexts(MatchPatternContext)
        }

        return this.getRuleContext(i, MatchPatternContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public matchSelector(): MatchSelectorContext | null {
        return this.getRuleContext(0, MatchSelectorContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_gpmlPatternList
    }
}

export class MatchPatternContext extends antlr.ParserRuleContext {
    public _restrictor?: PatternRestrictorContext
    public _variable?: PatternPathVariableContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public graphPart(): GraphPartContext[]
    public graphPart(i: number): GraphPartContext | null
    public graphPart(i?: number): GraphPartContext[] | GraphPartContext | null {
        if (i === undefined) {
            return this.getRuleContexts(GraphPartContext)
        }

        return this.getRuleContext(i, GraphPartContext)
    }
    public patternRestrictor(): PatternRestrictorContext | null {
        return this.getRuleContext(0, PatternRestrictorContext)
    }
    public patternPathVariable(): PatternPathVariableContext | null {
        return this.getRuleContext(0, PatternPathVariableContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_matchPattern
    }
}

export class GraphPartContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public node(): NodeContext | null {
        return this.getRuleContext(0, NodeContext)
    }
    public edge(): EdgeContext | null {
        return this.getRuleContext(0, EdgeContext)
    }
    public pattern(): PatternContext | null {
        return this.getRuleContext(0, PatternContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_graphPart
    }
}

export class MatchSelectorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_matchSelector
    }
    public override copyFrom(ctx: MatchSelectorContext): void {
        super.copyFrom(ctx)
    }
}
export class SelectorAnyContext extends MatchSelectorContext {
    public _k?: Token | null
    public constructor(ctx: MatchSelectorContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ANY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANY, 0)!
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
}
export class SelectorShortestContext extends MatchSelectorContext {
    public _k?: Token | null
    public constructor(ctx: MatchSelectorContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public SHORTEST(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SHORTEST, 0)!
    }
    public LITERAL_INTEGER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)!
    }
    public GROUP(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.GROUP, 0)
    }
}
export class SelectorBasicContext extends MatchSelectorContext {
    public _mod?: Token | null
    public constructor(ctx: MatchSelectorContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public SHORTEST(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SHORTEST, 0)!
    }
    public ANY(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANY, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
}

export class PatternPathVariableContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public EQ(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EQ, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_patternPathVariable
    }
}

export class PatternRestrictorContext extends antlr.ParserRuleContext {
    public _restrictor?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_patternRestrictor
    }
}

export class NodeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext | null {
        return this.getRuleContext(0, SymbolPrimitiveContext)
    }
    public COLON(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON, 0)
    }
    public labelSpec(): LabelSpecContext | null {
        return this.getRuleContext(0, LabelSpecContext)
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_node
    }
}

export class EdgeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_edge
    }
    public override copyFrom(ctx: EdgeContext): void {
        super.copyFrom(ctx)
    }
}
export class EdgeWithSpecContext extends EdgeContext {
    public _quantifier?: PatternQuantifierContext
    public constructor(ctx: EdgeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public edgeWSpec(): EdgeWSpecContext {
        return this.getRuleContext(0, EdgeWSpecContext)!
    }
    public patternQuantifier(): PatternQuantifierContext | null {
        return this.getRuleContext(0, PatternQuantifierContext)
    }
}
export class EdgeAbbreviatedContext extends EdgeContext {
    public _quantifier?: PatternQuantifierContext
    public constructor(ctx: EdgeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public edgeAbbrev(): EdgeAbbrevContext {
        return this.getRuleContext(0, EdgeAbbrevContext)!
    }
    public patternQuantifier(): PatternQuantifierContext | null {
        return this.getRuleContext(0, PatternQuantifierContext)
    }
}

export class PatternContext extends antlr.ParserRuleContext {
    public _restrictor?: PatternRestrictorContext
    public _variable?: PatternPathVariableContext
    public _where?: WhereClauseContext
    public _quantifier?: PatternQuantifierContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public graphPart(): GraphPartContext[]
    public graphPart(i: number): GraphPartContext | null
    public graphPart(i?: number): GraphPartContext[] | GraphPartContext | null {
        if (i === undefined) {
            return this.getRuleContexts(GraphPartContext)
        }

        return this.getRuleContext(i, GraphPartContext)
    }
    public patternRestrictor(): PatternRestrictorContext | null {
        return this.getRuleContext(0, PatternRestrictorContext)
    }
    public patternPathVariable(): PatternPathVariableContext | null {
        return this.getRuleContext(0, PatternPathVariableContext)
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext)
    }
    public patternQuantifier(): PatternQuantifierContext | null {
        return this.getRuleContext(0, PatternQuantifierContext)
    }
    public BRACKET_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)
    }
    public BRACKET_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_pattern
    }
}

export class PatternQuantifierContext extends antlr.ParserRuleContext {
    public _quant?: Token | null
    public _lower?: Token | null
    public _upper?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PLUS, 0)
    }
    public ASTERISK(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ASTERISK, 0)
    }
    public BRACE_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACE_LEFT, 0)
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COMMA, 0)
    }
    public BRACE_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACE_RIGHT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode[]
    public LITERAL_INTEGER(i: number): antlr.TerminalNode | null
    public LITERAL_INTEGER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.LITERAL_INTEGER)
        } else {
            return this.getToken(PartiQLParser.LITERAL_INTEGER, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_patternQuantifier
    }
}

export class EdgeWSpecContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_edgeWSpec
    }
    public override copyFrom(ctx: EdgeWSpecContext): void {
        super.copyFrom(ctx)
    }
}
export class EdgeSpecLeftContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ANGLE_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_LEFT, 0)!
    }
    public MINUS(): antlr.TerminalNode[]
    public MINUS(i: number): antlr.TerminalNode | null
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.MINUS)
        } else {
            return this.getToken(PartiQLParser.MINUS, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
}
export class EdgeSpecUndirectedLeftContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ANGLE_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_LEFT, 0)!
    }
    public TILDE(): antlr.TerminalNode[]
    public TILDE(i: number): antlr.TerminalNode | null
    public TILDE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.TILDE)
        } else {
            return this.getToken(PartiQLParser.TILDE, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
}
export class EdgeSpecBidirectionalContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ANGLE_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_LEFT, 0)!
    }
    public MINUS(): antlr.TerminalNode[]
    public MINUS(i: number): antlr.TerminalNode | null
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.MINUS)
        } else {
            return this.getToken(PartiQLParser.MINUS, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
    public ANGLE_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_RIGHT, 0)!
    }
}
export class EdgeSpecRightContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public MINUS(): antlr.TerminalNode[]
    public MINUS(i: number): antlr.TerminalNode | null
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.MINUS)
        } else {
            return this.getToken(PartiQLParser.MINUS, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
    public ANGLE_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_RIGHT, 0)!
    }
}
export class EdgeSpecUndirectedBidirectionalContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public MINUS(): antlr.TerminalNode[]
    public MINUS(i: number): antlr.TerminalNode | null
    public MINUS(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.MINUS)
        } else {
            return this.getToken(PartiQLParser.MINUS, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
}
export class EdgeSpecUndirectedContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TILDE(): antlr.TerminalNode[]
    public TILDE(i: number): antlr.TerminalNode | null
    public TILDE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.TILDE)
        } else {
            return this.getToken(PartiQLParser.TILDE, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
}
export class EdgeSpecUndirectedRightContext extends EdgeWSpecContext {
    public constructor(ctx: EdgeWSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TILDE(): antlr.TerminalNode[]
    public TILDE(i: number): antlr.TerminalNode | null
    public TILDE(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.TILDE)
        } else {
            return this.getToken(PartiQLParser.TILDE, i)
        }
    }
    public edgeSpec(): EdgeSpecContext {
        return this.getRuleContext(0, EdgeSpecContext)!
    }
    public ANGLE_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_RIGHT, 0)!
    }
}

export class EdgeSpecContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext | null {
        return this.getRuleContext(0, SymbolPrimitiveContext)
    }
    public COLON(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON, 0)
    }
    public labelSpec(): LabelSpecContext | null {
        return this.getRuleContext(0, LabelSpecContext)
    }
    public whereClause(): WhereClauseContext | null {
        return this.getRuleContext(0, WhereClauseContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_edgeSpec
    }
}

export class LabelSpecContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_labelSpec
    }
    public override copyFrom(ctx: LabelSpecContext): void {
        super.copyFrom(ctx)
    }
}
export class LabelSpecTermContext extends LabelSpecContext {
    public constructor(ctx: LabelSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public labelTerm(): LabelTermContext {
        return this.getRuleContext(0, LabelTermContext)!
    }
}
export class LabelSpecOrContext extends LabelSpecContext {
    public constructor(ctx: LabelSpecContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public labelSpec(): LabelSpecContext {
        return this.getRuleContext(0, LabelSpecContext)!
    }
    public VERTBAR(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VERTBAR, 0)!
    }
    public labelTerm(): LabelTermContext {
        return this.getRuleContext(0, LabelTermContext)!
    }
}

export class LabelTermContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_labelTerm
    }
    public override copyFrom(ctx: LabelTermContext): void {
        super.copyFrom(ctx)
    }
}
export class LabelTermFactorContext extends LabelTermContext {
    public constructor(ctx: LabelTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public labelFactor(): LabelFactorContext {
        return this.getRuleContext(0, LabelFactorContext)!
    }
}
export class LabelTermAndContext extends LabelTermContext {
    public constructor(ctx: LabelTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public labelTerm(): LabelTermContext {
        return this.getRuleContext(0, LabelTermContext)!
    }
    public AMPERSAND(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AMPERSAND, 0)!
    }
    public labelFactor(): LabelFactorContext {
        return this.getRuleContext(0, LabelFactorContext)!
    }
}

export class LabelFactorContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_labelFactor
    }
    public override copyFrom(ctx: LabelFactorContext): void {
        super.copyFrom(ctx)
    }
}
export class LabelFactorPrimaryContext extends LabelFactorContext {
    public constructor(ctx: LabelFactorContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public labelPrimary(): LabelPrimaryContext {
        return this.getRuleContext(0, LabelPrimaryContext)!
    }
}
export class LabelFactorNotContext extends LabelFactorContext {
    public constructor(ctx: LabelFactorContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BANG(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BANG, 0)!
    }
    public labelPrimary(): LabelPrimaryContext {
        return this.getRuleContext(0, LabelPrimaryContext)!
    }
}

export class LabelPrimaryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_labelPrimary
    }
    public override copyFrom(ctx: LabelPrimaryContext): void {
        super.copyFrom(ctx)
    }
}
export class LabelPrimaryParenContext extends LabelPrimaryContext {
    public constructor(ctx: LabelPrimaryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public labelSpec(): LabelSpecContext {
        return this.getRuleContext(0, LabelSpecContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
}
export class LabelPrimaryNameContext extends LabelPrimaryContext {
    public constructor(ctx: LabelPrimaryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}
export class LabelPrimaryWildContext extends LabelPrimaryContext {
    public constructor(ctx: LabelPrimaryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERCENT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERCENT, 0)!
    }
}

export class EdgeAbbrevContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public TILDE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.TILDE, 0)
    }
    public ANGLE_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANGLE_RIGHT, 0)
    }
    public ANGLE_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANGLE_LEFT, 0)
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MINUS, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_edgeAbbrev
    }
}

export class TableReferenceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableReference
    }
    public override copyFrom(ctx: TableReferenceContext): void {
        super.copyFrom(ctx)
    }
}
export class TableWrappedContext extends TableReferenceContext {
    public constructor(ctx: TableReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public tableReference(): TableReferenceContext {
        return this.getRuleContext(0, TableReferenceContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
}
export class TableCrossJoinContext extends TableReferenceContext {
    public _lhs?: TableReferenceContext
    public _rhs?: JoinRhsContext
    public constructor(ctx: TableReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CROSS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CROSS, 0)
    }
    public JOIN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.JOIN, 0)
    }
    public tableReference(): TableReferenceContext {
        return this.getRuleContext(0, TableReferenceContext)!
    }
    public joinRhs(): JoinRhsContext {
        return this.getRuleContext(0, JoinRhsContext)!
    }
    public joinType(): JoinTypeContext | null {
        return this.getRuleContext(0, JoinTypeContext)
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COMMA, 0)
    }
}
export class TableQualifiedJoinContext extends TableReferenceContext {
    public _lhs?: TableReferenceContext
    public _rhs?: JoinRhsContext
    public constructor(ctx: TableReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public JOIN(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.JOIN, 0)!
    }
    public joinSpec(): JoinSpecContext {
        return this.getRuleContext(0, JoinSpecContext)!
    }
    public tableReference(): TableReferenceContext {
        return this.getRuleContext(0, TableReferenceContext)!
    }
    public joinRhs(): JoinRhsContext {
        return this.getRuleContext(0, JoinRhsContext)!
    }
    public joinType(): JoinTypeContext | null {
        return this.getRuleContext(0, JoinTypeContext)
    }
}
export class TableRefBaseContext extends TableReferenceContext {
    public constructor(ctx: TableReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public tableNonJoin(): TableNonJoinContext {
        return this.getRuleContext(0, TableNonJoinContext)!
    }
}

export class TableNonJoinContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public tableBaseReference(): TableBaseReferenceContext | null {
        return this.getRuleContext(0, TableBaseReferenceContext)
    }
    public tableUnpivot(): TableUnpivotContext | null {
        return this.getRuleContext(0, TableUnpivotContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableNonJoin
    }
}

export class TableBaseReferenceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableBaseReference
    }
    public override copyFrom(ctx: TableBaseReferenceContext): void {
        super.copyFrom(ctx)
    }
}
export class TableBaseRefSymbolContext extends TableBaseReferenceContext {
    public _source?: ExprSelectContext
    public constructor(ctx: TableBaseReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
}
export class TableBaseRefClausesContext extends TableBaseReferenceContext {
    public _source?: ExprSelectContext
    public constructor(ctx: TableBaseReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public atIdent(): AtIdentContext | null {
        return this.getRuleContext(0, AtIdentContext)
    }
    public byIdent(): ByIdentContext | null {
        return this.getRuleContext(0, ByIdentContext)
    }
}
export class TableBaseRefMatchContext extends TableBaseReferenceContext {
    public _source?: ExprGraphMatchOneContext
    public constructor(ctx: TableBaseReferenceContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprGraphMatchOne(): ExprGraphMatchOneContext {
        return this.getRuleContext(0, ExprGraphMatchOneContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public atIdent(): AtIdentContext | null {
        return this.getRuleContext(0, AtIdentContext)
    }
    public byIdent(): ByIdentContext | null {
        return this.getRuleContext(0, ByIdentContext)
    }
}

export class TableUnpivotContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public UNPIVOT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.UNPIVOT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public asIdent(): AsIdentContext | null {
        return this.getRuleContext(0, AsIdentContext)
    }
    public atIdent(): AtIdentContext | null {
        return this.getRuleContext(0, AtIdentContext)
    }
    public byIdent(): ByIdentContext | null {
        return this.getRuleContext(0, ByIdentContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableUnpivot
    }
}

export class JoinRhsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_joinRhs
    }
    public override copyFrom(ctx: JoinRhsContext): void {
        super.copyFrom(ctx)
    }
}
export class JoinRhsBaseContext extends JoinRhsContext {
    public constructor(ctx: JoinRhsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public tableNonJoin(): TableNonJoinContext {
        return this.getRuleContext(0, TableNonJoinContext)!
    }
}
export class JoinRhsTableJoinedContext extends JoinRhsContext {
    public constructor(ctx: JoinRhsContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public tableReference(): TableReferenceContext {
        return this.getRuleContext(0, TableReferenceContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
}

export class JoinSpecContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ON, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_joinSpec
    }
}

export class JoinTypeContext extends antlr.ParserRuleContext {
    public _mod?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public INNER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INNER, 0)
    }
    public LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LEFT, 0)
    }
    public OUTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OUTER, 0)
    }
    public RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.RIGHT, 0)
    }
    public FULL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FULL, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_joinType
    }
}

export class ExprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public exprBagOp(): ExprBagOpContext {
        return this.getRuleContext(0, ExprBagOpContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_expr
    }
}

export class ExprBagOpContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprBagOp
    }
    public override copyFrom(ctx: ExprBagOpContext): void {
        super.copyFrom(ctx)
    }
}
export class IntersectContext extends ExprBagOpContext {
    public _lhs?: ExprBagOpContext
    public _rhs?: ExprSelectContext
    public constructor(ctx: ExprBagOpContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public INTERSECT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.INTERSECT, 0)!
    }
    public exprBagOp(): ExprBagOpContext {
        return this.getRuleContext(0, ExprBagOpContext)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public OUTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OUTER, 0)
    }
    public DISTINCT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DISTINCT, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
}
export class QueryBaseContext extends ExprBagOpContext {
    public constructor(ctx: ExprBagOpContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
}
export class ExceptContext extends ExprBagOpContext {
    public _lhs?: ExprBagOpContext
    public _rhs?: ExprSelectContext
    public constructor(ctx: ExprBagOpContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public EXCEPT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXCEPT, 0)!
    }
    public exprBagOp(): ExprBagOpContext {
        return this.getRuleContext(0, ExprBagOpContext)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public OUTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OUTER, 0)
    }
    public DISTINCT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DISTINCT, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
}
export class UnionContext extends ExprBagOpContext {
    public _lhs?: ExprBagOpContext
    public _rhs?: ExprSelectContext
    public constructor(ctx: ExprBagOpContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public UNION(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.UNION, 0)!
    }
    public exprBagOp(): ExprBagOpContext {
        return this.getRuleContext(0, ExprBagOpContext)!
    }
    public exprSelect(): ExprSelectContext {
        return this.getRuleContext(0, ExprSelectContext)!
    }
    public OUTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OUTER, 0)
    }
    public DISTINCT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DISTINCT, 0)
    }
    public ALL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ALL, 0)
    }
}

export class ExprSelectContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprSelect
    }
    public override copyFrom(ctx: ExprSelectContext): void {
        super.copyFrom(ctx)
    }
}
export class SfwBaseContext extends ExprSelectContext {
    public constructor(ctx: ExprSelectContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprOr(): ExprOrContext {
        return this.getRuleContext(0, ExprOrContext)!
    }
}
export class SfwQueryContext extends ExprSelectContext {
    public _select?: SelectClauseContext
    public _exclude?: ExcludeClauseContext
    public _from_?: FromClauseContext
    public _let_?: LetClauseContext
    public _where?: WhereClauseSelectContext
    public _group?: GroupClauseContext
    public _having?: HavingClauseContext
    public _order?: OrderByClauseContext
    public _limit?: LimitClauseContext
    public _offset?: OffsetByClauseContext
    public constructor(ctx: ExprSelectContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public selectClause(): SelectClauseContext {
        return this.getRuleContext(0, SelectClauseContext)!
    }
    public fromClause(): FromClauseContext {
        return this.getRuleContext(0, FromClauseContext)!
    }
    public excludeClause(): ExcludeClauseContext | null {
        return this.getRuleContext(0, ExcludeClauseContext)
    }
    public letClause(): LetClauseContext | null {
        return this.getRuleContext(0, LetClauseContext)
    }
    public whereClauseSelect(): WhereClauseSelectContext | null {
        return this.getRuleContext(0, WhereClauseSelectContext)
    }
    public groupClause(): GroupClauseContext | null {
        return this.getRuleContext(0, GroupClauseContext)
    }
    public havingClause(): HavingClauseContext | null {
        return this.getRuleContext(0, HavingClauseContext)
    }
    public orderByClause(): OrderByClauseContext | null {
        return this.getRuleContext(0, OrderByClauseContext)
    }
    public limitClause(): LimitClauseContext | null {
        return this.getRuleContext(0, LimitClauseContext)
    }
    public offsetByClause(): OffsetByClauseContext | null {
        return this.getRuleContext(0, OffsetByClauseContext)
    }
}

export class ExprOrContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprOr
    }
    public override copyFrom(ctx: ExprOrContext): void {
        super.copyFrom(ctx)
    }
}
export class OrContext extends ExprOrContext {
    public _lhs?: ExprOrContext
    public _rhs?: ExprAndContext
    public constructor(ctx: ExprOrContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public OR(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.OR, 0)!
    }
    public exprOr(): ExprOrContext {
        return this.getRuleContext(0, ExprOrContext)!
    }
    public exprAnd(): ExprAndContext {
        return this.getRuleContext(0, ExprAndContext)!
    }
}
export class ExprOrBaseContext extends ExprOrContext {
    public _parent?: ExprAndContext
    public constructor(ctx: ExprOrContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprAnd(): ExprAndContext {
        return this.getRuleContext(0, ExprAndContext)!
    }
}

export class ExprAndContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprAnd
    }
    public override copyFrom(ctx: ExprAndContext): void {
        super.copyFrom(ctx)
    }
}
export class ExprAndBaseContext extends ExprAndContext {
    public _parent?: ExprNotContext
    public constructor(ctx: ExprAndContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprNot(): ExprNotContext {
        return this.getRuleContext(0, ExprNotContext)!
    }
}
export class AndContext extends ExprAndContext {
    public _lhs?: ExprAndContext
    public _op?: Token | null
    public _rhs?: ExprNotContext
    public constructor(ctx: ExprAndContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprAnd(): ExprAndContext {
        return this.getRuleContext(0, ExprAndContext)!
    }
    public AND(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AND, 0)!
    }
    public exprNot(): ExprNotContext {
        return this.getRuleContext(0, ExprNotContext)!
    }
}

export class ExprNotContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprNot
    }
    public override copyFrom(ctx: ExprNotContext): void {
        super.copyFrom(ctx)
    }
}
export class NotContext extends ExprNotContext {
    public _op?: Token | null
    public _rhs?: ExprNotContext
    public constructor(ctx: ExprNotContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public NOT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NOT, 0)!
    }
    public exprNot(): ExprNotContext {
        return this.getRuleContext(0, ExprNotContext)!
    }
}
export class ExprNotBaseContext extends ExprNotContext {
    public _parent?: ExprPredicateContext
    public constructor(ctx: ExprNotContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
}

export class ExprPredicateContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprPredicate
    }
    public override copyFrom(ctx: ExprPredicateContext): void {
        super.copyFrom(ctx)
    }
}
export class PredicateInContext extends ExprPredicateContext {
    public _lhs?: ExprPredicateContext
    public _rhs?: MathOp00Context
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public IN(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IN, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NOT, 0)
    }
    public mathOp00(): MathOp00Context | null {
        return this.getRuleContext(0, MathOp00Context)
    }
}
export class PredicateBetweenContext extends ExprPredicateContext {
    public _lhs?: ExprPredicateContext
    public _lower?: MathOp00Context
    public _upper?: MathOp00Context
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BETWEEN(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BETWEEN, 0)!
    }
    public AND(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AND, 0)!
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
    public mathOp00(): MathOp00Context[]
    public mathOp00(i: number): MathOp00Context | null
    public mathOp00(i?: number): MathOp00Context[] | MathOp00Context | null {
        if (i === undefined) {
            return this.getRuleContexts(MathOp00Context)
        }

        return this.getRuleContext(i, MathOp00Context)
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NOT, 0)
    }
}
export class PredicateBaseContext extends ExprPredicateContext {
    public _parent?: MathOp00Context
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public mathOp00(): MathOp00Context {
        return this.getRuleContext(0, MathOp00Context)!
    }
}
export class PredicateComparisonContext extends ExprPredicateContext {
    public _lhs?: ExprPredicateContext
    public _op?: Token | null
    public _rhs?: MathOp00Context
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
    public mathOp00(): MathOp00Context {
        return this.getRuleContext(0, MathOp00Context)!
    }
    public LT_EQ(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LT_EQ, 0)
    }
    public GT_EQ(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.GT_EQ, 0)
    }
    public ANGLE_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANGLE_LEFT, 0)
    }
    public ANGLE_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANGLE_RIGHT, 0)
    }
    public NEQ(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NEQ, 0)
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.EQ, 0)
    }
}
export class PredicateIsContext extends ExprPredicateContext {
    public _lhs?: ExprPredicateContext
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public IS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IS, 0)!
    }
    public type(): TypeContext {
        return this.getRuleContext(0, TypeContext)!
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NOT, 0)
    }
}
export class PredicateLikeContext extends ExprPredicateContext {
    public _lhs?: ExprPredicateContext
    public _rhs?: MathOp00Context
    public _escape?: ExprContext
    public constructor(ctx: ExprPredicateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public LIKE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LIKE, 0)!
    }
    public exprPredicate(): ExprPredicateContext {
        return this.getRuleContext(0, ExprPredicateContext)!
    }
    public mathOp00(): MathOp00Context {
        return this.getRuleContext(0, MathOp00Context)!
    }
    public NOT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NOT, 0)
    }
    public ESCAPE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ESCAPE, 0)
    }
    public expr(): ExprContext | null {
        return this.getRuleContext(0, ExprContext)
    }
}

export class MathOp00Context extends antlr.ParserRuleContext {
    public _lhs?: MathOp00Context
    public _parent?: MathOp01Context
    public _op?: Token | null
    public _rhs?: MathOp01Context
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public mathOp01(): MathOp01Context {
        return this.getRuleContext(0, MathOp01Context)!
    }
    public mathOp00(): MathOp00Context | null {
        return this.getRuleContext(0, MathOp00Context)
    }
    public AMPERSAND(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AMPERSAND, 0)
    }
    public CONCAT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CONCAT, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_mathOp00
    }
}

export class MathOp01Context extends antlr.ParserRuleContext {
    public _lhs?: MathOp01Context
    public _parent?: MathOp02Context
    public _op?: Token | null
    public _rhs?: MathOp02Context
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public mathOp02(): MathOp02Context {
        return this.getRuleContext(0, MathOp02Context)!
    }
    public mathOp01(): MathOp01Context | null {
        return this.getRuleContext(0, MathOp01Context)
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PLUS, 0)
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MINUS, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_mathOp01
    }
}

export class MathOp02Context extends antlr.ParserRuleContext {
    public _lhs?: MathOp02Context
    public _parent?: ValueExprContext
    public _op?: Token | null
    public _rhs?: ValueExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public valueExpr(): ValueExprContext {
        return this.getRuleContext(0, ValueExprContext)!
    }
    public mathOp02(): MathOp02Context | null {
        return this.getRuleContext(0, MathOp02Context)
    }
    public PERCENT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PERCENT, 0)
    }
    public ASTERISK(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ASTERISK, 0)
    }
    public SLASH_FORWARD(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SLASH_FORWARD, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_mathOp02
    }
}

export class ValueExprContext extends antlr.ParserRuleContext {
    public _sign?: Token | null
    public _rhs?: ValueExprContext
    public _parent?: ExprPrimaryContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public valueExpr(): ValueExprContext | null {
        return this.getRuleContext(0, ValueExprContext)
    }
    public PLUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PLUS, 0)
    }
    public MINUS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MINUS, 0)
    }
    public exprPrimary(): ExprPrimaryContext | null {
        return this.getRuleContext(0, ExprPrimaryContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_valueExpr
    }
}

export class ExprPrimaryContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprPrimary
    }
    public override copyFrom(ctx: ExprPrimaryContext): void {
        super.copyFrom(ctx)
    }
}
export class ExprPrimaryPathContext extends ExprPrimaryContext {
    public constructor(ctx: ExprPrimaryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprPrimary(): ExprPrimaryContext {
        return this.getRuleContext(0, ExprPrimaryContext)!
    }
    public pathStep(): PathStepContext[]
    public pathStep(i: number): PathStepContext | null
    public pathStep(i?: number): PathStepContext[] | PathStepContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PathStepContext)
        }

        return this.getRuleContext(i, PathStepContext)
    }
}
export class ExprPrimaryBaseContext extends ExprPrimaryContext {
    public constructor(ctx: ExprPrimaryContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public exprTerm(): ExprTermContext | null {
        return this.getRuleContext(0, ExprTermContext)
    }
    public cast(): CastContext | null {
        return this.getRuleContext(0, CastContext)
    }
    public sequenceConstructor(): SequenceConstructorContext | null {
        return this.getRuleContext(0, SequenceConstructorContext)
    }
    public substring(): SubstringContext | null {
        return this.getRuleContext(0, SubstringContext)
    }
    public position(): PositionContext | null {
        return this.getRuleContext(0, PositionContext)
    }
    public overlay(): OverlayContext | null {
        return this.getRuleContext(0, OverlayContext)
    }
    public canCast(): CanCastContext | null {
        return this.getRuleContext(0, CanCastContext)
    }
    public canLosslessCast(): CanLosslessCastContext | null {
        return this.getRuleContext(0, CanLosslessCastContext)
    }
    public extract(): ExtractContext | null {
        return this.getRuleContext(0, ExtractContext)
    }
    public coalesce(): CoalesceContext | null {
        return this.getRuleContext(0, CoalesceContext)
    }
    public dateFunction(): DateFunctionContext | null {
        return this.getRuleContext(0, DateFunctionContext)
    }
    public aggregate(): AggregateContext | null {
        return this.getRuleContext(0, AggregateContext)
    }
    public trimFunction(): TrimFunctionContext | null {
        return this.getRuleContext(0, TrimFunctionContext)
    }
    public functionCall(): FunctionCallContext | null {
        return this.getRuleContext(0, FunctionCallContext)
    }
    public nullIf(): NullIfContext | null {
        return this.getRuleContext(0, NullIfContext)
    }
    public exprGraphMatchMany(): ExprGraphMatchManyContext | null {
        return this.getRuleContext(0, ExprGraphMatchManyContext)
    }
    public caseExpr(): CaseExprContext | null {
        return this.getRuleContext(0, CaseExprContext)
    }
    public valueList(): ValueListContext | null {
        return this.getRuleContext(0, ValueListContext)
    }
    public values(): ValuesContext | null {
        return this.getRuleContext(0, ValuesContext)
    }
    public windowFunction(): WindowFunctionContext | null {
        return this.getRuleContext(0, WindowFunctionContext)
    }
}

export class ExprTermContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprTerm
    }
    public override copyFrom(ctx: ExprTermContext): void {
        super.copyFrom(ctx)
    }
}
export class ExprTermWrappedQueryContext extends ExprTermContext {
    public constructor(ctx: ExprTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
}
export class ExprTermBaseContext extends ExprTermContext {
    public constructor(ctx: ExprTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public parameter(): ParameterContext | null {
        return this.getRuleContext(0, ParameterContext)
    }
    public varRefExpr(): VarRefExprContext | null {
        return this.getRuleContext(0, VarRefExprContext)
    }
    public literal(): LiteralContext | null {
        return this.getRuleContext(0, LiteralContext)
    }
    public collection(): CollectionContext | null {
        return this.getRuleContext(0, CollectionContext)
    }
    public tuple(): TupleContext | null {
        return this.getRuleContext(0, TupleContext)
    }
}
export class ExprTermCurrentUserContext extends ExprTermContext {
    public constructor(ctx: ExprTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CURRENT_USER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CURRENT_USER, 0)!
    }
}
export class ExprTermCurrentDateContext extends ExprTermContext {
    public constructor(ctx: ExprTermContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CURRENT_DATE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CURRENT_DATE, 0)!
    }
}

export class NullIfContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public NULLIF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NULLIF, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.COMMA, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_nullIf
    }
}

export class CoalesceContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public COALESCE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.COALESCE, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_coalesce
    }
}

export class CaseExprContext extends antlr.ParserRuleContext {
    public _case_?: ExprContext
    public _expr?: ExprContext
    public _whens: ExprContext[] = []
    public _thens: ExprContext[] = []
    public _else_?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public CASE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CASE, 0)!
    }
    public END(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.END, 0)!
    }
    public WHEN(): antlr.TerminalNode[]
    public WHEN(i: number): antlr.TerminalNode | null
    public WHEN(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.WHEN)
        } else {
            return this.getToken(PartiQLParser.WHEN, i)
        }
    }
    public THEN(): antlr.TerminalNode[]
    public THEN(i: number): antlr.TerminalNode | null
    public THEN(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.THEN)
        } else {
            return this.getToken(PartiQLParser.THEN, i)
        }
    }
    public ELSE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ELSE, 0)
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_caseExpr
    }
}

export class ValuesContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public VALUES(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VALUES, 0)!
    }
    public valueRow(): ValueRowContext[]
    public valueRow(i: number): ValueRowContext | null
    public valueRow(i?: number): ValueRowContext[] | ValueRowContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ValueRowContext)
        }

        return this.getRuleContext(i, ValueRowContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_values
    }
}

export class ValueRowContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_valueRow
    }
}

export class ValueListContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_valueList
    }
}

export class SequenceConstructorContext extends antlr.ParserRuleContext {
    public _datatype?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public LIST(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LIST, 0)
    }
    public SEXP(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SEXP, 0)
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_sequenceConstructor
    }
}

export class SubstringContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public SUBSTRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.SUBSTRING, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public FROM(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FROM, 0)
    }
    public FOR(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FOR, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_substring
    }
}

export class PositionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public POSITION(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.POSITION, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COMMA, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public IN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IN, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_position
    }
}

export class OverlayContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public OVERLAY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.OVERLAY, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public PLACING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PLACING, 0)
    }
    public FROM(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FROM, 0)
    }
    public FOR(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FOR, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_overlay
    }
}

export class AggregateContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_aggregate
    }
    public override copyFrom(ctx: AggregateContext): void {
        super.copyFrom(ctx)
    }
}
export class AggregateBaseContext extends AggregateContext {
    public _func?: Token | null
    public constructor(ctx: AggregateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COUNT, 0)
    }
    public MAX(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MAX, 0)
    }
    public MIN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MIN, 0)
    }
    public SUM(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SUM, 0)
    }
    public AVG(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AVG, 0)
    }
    public EVERY(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.EVERY, 0)
    }
    public ANY(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANY, 0)
    }
    public SOME(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SOME, 0)
    }
    public setQuantifierStrategy(): SetQuantifierStrategyContext | null {
        return this.getRuleContext(0, SetQuantifierStrategyContext)
    }
}
export class CountAllContext extends AggregateContext {
    public _func?: Token | null
    public constructor(ctx: AggregateContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public COUNT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.COUNT, 0)!
    }
}

export class WindowFunctionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_windowFunction
    }
    public override copyFrom(ctx: WindowFunctionContext): void {
        super.copyFrom(ctx)
    }
}
export class LagLeadFunctionContext extends WindowFunctionContext {
    public _func?: Token | null
    public constructor(ctx: WindowFunctionContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public over(): OverContext {
        return this.getRuleContext(0, OverContext)!
    }
    public LAG(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LAG, 0)
    }
    public LEAD(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LEAD, 0)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
}

export class CastContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public CAST(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CAST, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public type(): TypeContext {
        return this.getRuleContext(0, TypeContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_cast
    }
}

export class CanLosslessCastContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public CAN_LOSSLESS_CAST(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CAN_LOSSLESS_CAST, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public type(): TypeContext {
        return this.getRuleContext(0, TypeContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_canLosslessCast
    }
}

export class CanCastContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public CAN_CAST(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CAN_CAST, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public AS(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.AS, 0)!
    }
    public type(): TypeContext {
        return this.getRuleContext(0, TypeContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_canCast
    }
}

export class ExtractContext extends antlr.ParserRuleContext {
    public _rhs?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXTRACT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXTRACT, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)!
    }
    public FROM(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.FROM, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_extract
    }
}

export class TrimFunctionContext extends antlr.ParserRuleContext {
    public _func?: Token | null
    public _mod?: Token | null
    public _sub?: ExprContext
    public _target?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public TRIM(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.TRIM, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public FROM(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FROM, 0)
    }
    public IDENTIFIER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_trimFunction
    }
}

export class DateFunctionContext extends antlr.ParserRuleContext {
    public _func?: Token | null
    public _dt?: Token | null
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)!
    }
    public DATE_ADD(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DATE_ADD, 0)
    }
    public DATE_DIFF(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DATE_DIFF, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_dateFunction
    }
}

export class FunctionCallContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public functionName(): FunctionNameContext {
        return this.getRuleContext(0, FunctionNameContext)!
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_functionCall
    }
}

export class FunctionNameContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_functionName
    }
    public override copyFrom(ctx: FunctionNameContext): void {
        super.copyFrom(ctx)
    }
}
export class FunctionNameSymbolContext extends FunctionNameContext {
    public _symbolPrimitive?: SymbolPrimitiveContext
    public _qualifier: SymbolPrimitiveContext[] = []
    public _name?: SymbolPrimitiveContext
    public constructor(ctx: FunctionNameContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public symbolPrimitive(): SymbolPrimitiveContext[]
    public symbolPrimitive(i: number): SymbolPrimitiveContext | null
    public symbolPrimitive(i?: number): SymbolPrimitiveContext[] | SymbolPrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SymbolPrimitiveContext)
        }

        return this.getRuleContext(i, SymbolPrimitiveContext)
    }
    public PERIOD(): antlr.TerminalNode[]
    public PERIOD(i: number): antlr.TerminalNode | null
    public PERIOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.PERIOD)
        } else {
            return this.getToken(PartiQLParser.PERIOD, i)
        }
    }
}
export class FunctionNameReservedContext extends FunctionNameContext {
    public _symbolPrimitive?: SymbolPrimitiveContext
    public _qualifier: SymbolPrimitiveContext[] = []
    public _name?: Token | null
    public constructor(ctx: FunctionNameContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CHAR_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHAR_LENGTH, 0)
    }
    public CHARACTER_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHARACTER_LENGTH, 0)
    }
    public OCTET_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.OCTET_LENGTH, 0)
    }
    public BIT_LENGTH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BIT_LENGTH, 0)
    }
    public UPPER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.UPPER, 0)
    }
    public LOWER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LOWER, 0)
    }
    public SIZE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SIZE, 0)
    }
    public EXISTS(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.EXISTS, 0)
    }
    public COUNT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COUNT, 0)
    }
    public PERIOD(): antlr.TerminalNode[]
    public PERIOD(i: number): antlr.TerminalNode | null
    public PERIOD(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.PERIOD)
        } else {
            return this.getToken(PartiQLParser.PERIOD, i)
        }
    }
    public symbolPrimitive(): SymbolPrimitiveContext[]
    public symbolPrimitive(i: number): SymbolPrimitiveContext | null
    public symbolPrimitive(i?: number): SymbolPrimitiveContext[] | SymbolPrimitiveContext | null {
        if (i === undefined) {
            return this.getRuleContexts(SymbolPrimitiveContext)
        }

        return this.getRuleContext(i, SymbolPrimitiveContext)
    }
}

export class PathStepContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_pathStep
    }
    public override copyFrom(ctx: PathStepContext): void {
        super.copyFrom(ctx)
    }
}
export class PathStepDotAllContext extends PathStepContext {
    public _all?: Token | null
    public constructor(ctx: PathStepContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERIOD(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERIOD, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
}
export class PathStepIndexAllContext extends PathStepContext {
    public _all?: Token | null
    public constructor(ctx: PathStepContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public ASTERISK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ASTERISK, 0)!
    }
}
export class PathStepIndexExprContext extends PathStepContext {
    public _key?: ExprContext
    public constructor(ctx: PathStepContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public expr(): ExprContext {
        return this.getRuleContext(0, ExprContext)!
    }
}
export class PathStepDotExprContext extends PathStepContext {
    public _key?: SymbolPrimitiveContext
    public constructor(ctx: PathStepContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PERIOD(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PERIOD, 0)!
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}

export class ExprGraphMatchManyContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public PAREN_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)!
    }
    public exprPrimary(): ExprPrimaryContext {
        return this.getRuleContext(0, ExprPrimaryContext)!
    }
    public MATCH(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.MATCH, 0)!
    }
    public gpmlPatternList(): GpmlPatternListContext {
        return this.getRuleContext(0, GpmlPatternListContext)!
    }
    public PAREN_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprGraphMatchMany
    }
}

export class ExprGraphMatchOneContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public exprPrimary(): ExprPrimaryContext {
        return this.getRuleContext(0, ExprPrimaryContext)!
    }
    public MATCH(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.MATCH, 0)!
    }
    public gpmlPattern(): GpmlPatternContext {
        return this.getRuleContext(0, GpmlPatternContext)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_exprGraphMatchOne
    }
}

export class ParameterContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public QUESTION_MARK(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.QUESTION_MARK, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_parameter
    }
}

export class VarRefExprContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_varRefExpr
    }
    public override copyFrom(ctx: VarRefExprContext): void {
        super.copyFrom(ctx)
    }
}
export class VariableKeywordContext extends VarRefExprContext {
    public _qualifier?: Token | null
    public _key?: NonReservedKeywordsContext
    public constructor(ctx: VarRefExprContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public nonReservedKeywords(): NonReservedKeywordsContext {
        return this.getRuleContext(0, NonReservedKeywordsContext)!
    }
    public AT_SIGN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AT_SIGN, 0)
    }
}
export class VariableIdentifierContext extends VarRefExprContext {
    public _qualifier?: Token | null
    public _ident?: Token | null
    public constructor(ctx: VarRefExprContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public IDENTIFIER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)
    }
    public IDENTIFIER_QUOTED(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.IDENTIFIER_QUOTED, 0)
    }
    public AT_SIGN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.AT_SIGN, 0)
    }
}

export class NonReservedKeywordsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public EXCLUDED(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EXCLUDED, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_nonReservedKeywords
    }
}

export class CollectionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public array(): ArrayContext | null {
        return this.getRuleContext(0, ArrayContext)
    }
    public bag(): BagContext | null {
        return this.getRuleContext(0, BagContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_collection
    }
}

export class ArrayContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public BRACKET_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_LEFT, 0)!
    }
    public BRACKET_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACKET_RIGHT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_array
    }
}

export class BagContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ANGLE_DOUBLE_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_DOUBLE_LEFT, 0)!
    }
    public ANGLE_DOUBLE_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ANGLE_DOUBLE_RIGHT, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_bag
    }
}

export class TupleContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public BRACE_LEFT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACE_LEFT, 0)!
    }
    public BRACE_RIGHT(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.BRACE_RIGHT, 0)!
    }
    public pair(): PairContext[]
    public pair(i: number): PairContext | null
    public pair(i?: number): PairContext[] | PairContext | null {
        if (i === undefined) {
            return this.getRuleContexts(PairContext)
        }

        return this.getRuleContext(i, PairContext)
    }
    public COMMA(): antlr.TerminalNode[]
    public COMMA(i: number): antlr.TerminalNode | null
    public COMMA(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.COMMA)
        } else {
            return this.getToken(PartiQLParser.COMMA, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tuple
    }
}

export class PairContext extends antlr.ParserRuleContext {
    public _lhs?: ExprContext
    public _rhs?: ExprContext
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public COLON(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.COLON, 0)!
    }
    public expr(): ExprContext[]
    public expr(i: number): ExprContext | null
    public expr(i?: number): ExprContext[] | ExprContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ExprContext)
        }

        return this.getRuleContext(i, ExprContext)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_pair
    }
}

export class LiteralContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_literal
    }
    public override copyFrom(ctx: LiteralContext): void {
        super.copyFrom(ctx)
    }
}
export class LiteralMissingContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public MISSING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.MISSING, 0)!
    }
}
export class LiteralTimestampContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TIMESTAMP(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.TIMESTAMP, 0)!
    }
    public LITERAL_STRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public WITH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.WITH, 0)
    }
    public TIME(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.TIME, 0)
    }
    public ZONE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ZONE, 0)
    }
}
export class LiteralIntegerContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)!
    }
}
export class LiteralDateContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public DATE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.DATE, 0)!
    }
    public LITERAL_STRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)!
    }
}
export class LiteralFalseContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public FALSE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.FALSE, 0)!
    }
}
export class LiteralStringContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public LITERAL_STRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)!
    }
}
export class LiteralDecimalContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public LITERAL_DECIMAL(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_DECIMAL, 0)!
    }
}
export class LiteralNullContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public NULL(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.NULL, 0)!
    }
}
export class LiteralIonContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ION_CLOSURE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.ION_CLOSURE, 0)!
    }
}
export class LiteralTrueContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TRUE(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.TRUE, 0)!
    }
}
export class LiteralTimeContext extends LiteralContext {
    public constructor(ctx: LiteralContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TIME(): antlr.TerminalNode[]
    public TIME(i: number): antlr.TerminalNode | null
    public TIME(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.TIME)
        } else {
            return this.getToken(PartiQLParser.TIME, i)
        }
    }
    public LITERAL_STRING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public WITH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.WITH, 0)
    }
    public ZONE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ZONE, 0)
    }
}

export class TypeContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_type
    }
    public override copyFrom(ctx: TypeContext): void {
        super.copyFrom(ctx)
    }
}
export class TypeArgSingleContext extends TypeContext {
    public _datatype?: Token | null
    public _arg0?: Token | null
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CHARACTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHARACTER, 0)
    }
    public CHAR(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHAR, 0)
    }
    public FLOAT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.FLOAT, 0)
    }
    public VARCHAR(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.VARCHAR, 0)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
}
export class TypeAtomicContext extends TypeContext {
    public _datatype?: Token | null
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public NULL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NULL, 0)
    }
    public BOOL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BOOL, 0)
    }
    public BOOLEAN(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BOOLEAN, 0)
    }
    public SMALLINT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SMALLINT, 0)
    }
    public INTEGER2(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INTEGER2, 0)
    }
    public INT2(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INT2, 0)
    }
    public INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INTEGER, 0)
    }
    public INT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INT, 0)
    }
    public INTEGER4(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INTEGER4, 0)
    }
    public INT4(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INT4, 0)
    }
    public INTEGER8(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INTEGER8, 0)
    }
    public INT8(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.INT8, 0)
    }
    public BIGINT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BIGINT, 0)
    }
    public REAL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.REAL, 0)
    }
    public CHAR(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHAR, 0)
    }
    public CHARACTER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CHARACTER, 0)
    }
    public MISSING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.MISSING, 0)
    }
    public STRING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.STRING, 0)
    }
    public SYMBOL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SYMBOL, 0)
    }
    public BLOB(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BLOB, 0)
    }
    public CLOB(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CLOB, 0)
    }
    public DATE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DATE, 0)
    }
    public STRUCT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.STRUCT, 0)
    }
    public TUPLE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.TUPLE, 0)
    }
    public LIST(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LIST, 0)
    }
    public SEXP(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.SEXP, 0)
    }
    public BAG(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BAG, 0)
    }
    public ANY(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ANY, 0)
    }
    public PRECISION(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PRECISION, 0)
    }
    public DOUBLE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DOUBLE, 0)
    }
}
export class TypeArgDoubleContext extends TypeContext {
    public _datatype?: Token | null
    public _arg0?: Token | null
    public _arg1?: Token | null
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public DECIMAL(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DECIMAL, 0)
    }
    public DEC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DEC, 0)
    }
    public NUMERIC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.NUMERIC, 0)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode[]
    public LITERAL_INTEGER(i: number): antlr.TerminalNode | null
    public LITERAL_INTEGER(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.LITERAL_INTEGER)
        } else {
            return this.getToken(PartiQLParser.LITERAL_INTEGER, i)
        }
    }
    public COMMA(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COMMA, 0)
    }
}
export class TypeTimeZoneContext extends TypeContext {
    public _datatype?: Token | null
    public _precision?: Token | null
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public TIME(): antlr.TerminalNode[]
    public TIME(i: number): antlr.TerminalNode | null
    public TIME(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.TIME)
        } else {
            return this.getToken(PartiQLParser.TIME, i)
        }
    }
    public TIMESTAMP(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.TIMESTAMP, 0)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public WITH(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.WITH, 0)
    }
    public ZONE(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ZONE, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
}
export class TypeCustomContext extends TypeContext {
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public symbolPrimitive(): SymbolPrimitiveContext {
        return this.getRuleContext(0, SymbolPrimitiveContext)!
    }
}
export class TypeVarCharContext extends TypeContext {
    public _arg0?: Token | null
    public constructor(ctx: TypeContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public CHARACTER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.CHARACTER, 0)!
    }
    public VARYING(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.VARYING, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
}
