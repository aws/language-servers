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
    public static readonly RULE_columnDef = 20
    public static readonly RULE_columnConstraint = 21
    public static readonly RULE_columnConstraintDef = 22
    public static readonly RULE_dml = 23
    public static readonly RULE_dmlBaseCommand = 24
    public static readonly RULE_pathSimple = 25
    public static readonly RULE_pathSimpleSteps = 26
    public static readonly RULE_replaceCommand = 27
    public static readonly RULE_upsertCommand = 28
    public static readonly RULE_removeCommand = 29
    public static readonly RULE_insertCommandReturning = 30
    public static readonly RULE_insertStatement = 31
    public static readonly RULE_onConflict = 32
    public static readonly RULE_insertStatementLegacy = 33
    public static readonly RULE_onConflictLegacy = 34
    public static readonly RULE_conflictTarget = 35
    public static readonly RULE_constraintName = 36
    public static readonly RULE_conflictAction = 37
    public static readonly RULE_doReplace = 38
    public static readonly RULE_doUpdate = 39
    public static readonly RULE_updateClause = 40
    public static readonly RULE_setCommand = 41
    public static readonly RULE_setAssignment = 42
    public static readonly RULE_deleteCommand = 43
    public static readonly RULE_returningClause = 44
    public static readonly RULE_returningColumn = 45
    public static readonly RULE_fromClauseSimple = 46
    public static readonly RULE_whereClause = 47
    public static readonly RULE_selectClause = 48
    public static readonly RULE_projectionItems = 49
    public static readonly RULE_projectionItem = 50
    public static readonly RULE_setQuantifierStrategy = 51
    public static readonly RULE_letClause = 52
    public static readonly RULE_letBinding = 53
    public static readonly RULE_orderByClause = 54
    public static readonly RULE_orderSortSpec = 55
    public static readonly RULE_groupClause = 56
    public static readonly RULE_groupAlias = 57
    public static readonly RULE_groupKey = 58
    public static readonly RULE_over = 59
    public static readonly RULE_windowPartitionList = 60
    public static readonly RULE_windowSortSpecList = 61
    public static readonly RULE_havingClause = 62
    public static readonly RULE_excludeClause = 63
    public static readonly RULE_excludeExpr = 64
    public static readonly RULE_excludeExprSteps = 65
    public static readonly RULE_fromClause = 66
    public static readonly RULE_whereClauseSelect = 67
    public static readonly RULE_offsetByClause = 68
    public static readonly RULE_limitClause = 69
    public static readonly RULE_gpmlPattern = 70
    public static readonly RULE_gpmlPatternList = 71
    public static readonly RULE_matchPattern = 72
    public static readonly RULE_graphPart = 73
    public static readonly RULE_matchSelector = 74
    public static readonly RULE_patternPathVariable = 75
    public static readonly RULE_patternRestrictor = 76
    public static readonly RULE_node = 77
    public static readonly RULE_edge = 78
    public static readonly RULE_pattern = 79
    public static readonly RULE_patternQuantifier = 80
    public static readonly RULE_edgeWSpec = 81
    public static readonly RULE_edgeSpec = 82
    public static readonly RULE_labelSpec = 83
    public static readonly RULE_labelTerm = 84
    public static readonly RULE_labelFactor = 85
    public static readonly RULE_labelPrimary = 86
    public static readonly RULE_edgeAbbrev = 87
    public static readonly RULE_tableReference = 88
    public static readonly RULE_tableNonJoin = 89
    public static readonly RULE_tableBaseReference = 90
    public static readonly RULE_tableUnpivot = 91
    public static readonly RULE_joinRhs = 92
    public static readonly RULE_joinSpec = 93
    public static readonly RULE_joinType = 94
    public static readonly RULE_expr = 95
    public static readonly RULE_exprBagOp = 96
    public static readonly RULE_exprSelect = 97
    public static readonly RULE_exprOr = 98
    public static readonly RULE_exprAnd = 99
    public static readonly RULE_exprNot = 100
    public static readonly RULE_exprPredicate = 101
    public static readonly RULE_mathOp00 = 102
    public static readonly RULE_mathOp01 = 103
    public static readonly RULE_mathOp02 = 104
    public static readonly RULE_valueExpr = 105
    public static readonly RULE_exprPrimary = 106
    public static readonly RULE_exprTerm = 107
    public static readonly RULE_nullIf = 108
    public static readonly RULE_coalesce = 109
    public static readonly RULE_caseExpr = 110
    public static readonly RULE_values = 111
    public static readonly RULE_valueRow = 112
    public static readonly RULE_valueList = 113
    public static readonly RULE_sequenceConstructor = 114
    public static readonly RULE_substring = 115
    public static readonly RULE_position = 116
    public static readonly RULE_overlay = 117
    public static readonly RULE_aggregate = 118
    public static readonly RULE_windowFunction = 119
    public static readonly RULE_cast = 120
    public static readonly RULE_canLosslessCast = 121
    public static readonly RULE_canCast = 122
    public static readonly RULE_extract = 123
    public static readonly RULE_trimFunction = 124
    public static readonly RULE_dateFunction = 125
    public static readonly RULE_functionCall = 126
    public static readonly RULE_functionName = 127
    public static readonly RULE_pathStep = 128
    public static readonly RULE_exprGraphMatchMany = 129
    public static readonly RULE_exprGraphMatchOne = 130
    public static readonly RULE_parameter = 131
    public static readonly RULE_varRefExpr = 132
    public static readonly RULE_nonReservedKeywords = 133
    public static readonly RULE_collection = 134
    public static readonly RULE_array = 135
    public static readonly RULE_bag = 136
    public static readonly RULE_tuple = 137
    public static readonly RULE_pair = 138
    public static readonly RULE_literal = 139
    public static readonly RULE_type = 140

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
        'columnDef',
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
        let localContext = new RootContext(this.context, this.state)
        this.enterRule(localContext, 0, PartiQLParser.RULE_root)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 286
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 282
                            this.statement()
                            this.state = 284
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            if (_la === 297) {
                                {
                                    this.state = 283
                                    this.match(PartiQLParser.COLON_SEMI)
                                }
                            }
                        }
                    }
                    this.state = 288
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
                this.state = 290
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
        let localContext = new StatementContext(this.context, this.state)
        this.enterRule(localContext, 2, PartiQLParser.RULE_statement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 306
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 83) {
                    {
                        this.state = 292
                        this.match(PartiQLParser.EXPLAIN)
                        this.state = 304
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context)) {
                            case 1:
                                {
                                    this.state = 293
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 294
                                    this.explainOption()
                                    this.state = 299
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    while (_la === 270) {
                                        {
                                            {
                                                this.state = 295
                                                this.match(PartiQLParser.COMMA)
                                                this.state = 296
                                                this.explainOption()
                                            }
                                        }
                                        this.state = 301
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                    }
                                    this.state = 302
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                }

                this.state = 308
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
            this.state = 314
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
                        this.state = 310
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
                        this.state = 311
                        this.dml()
                    }
                    break
                case PartiQLParser.CREATE:
                case PartiQLParser.DROP:
                    localContext = new QueryDdlContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 312
                        this.ddl()
                    }
                    break
                case PartiQLParser.EXEC:
                    localContext = new QueryExecContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 313
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
        let localContext = new ExplainOptionContext(this.context, this.state)
        this.enterRule(localContext, 6, PartiQLParser.RULE_explainOption)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 316
                localContext._param = this.match(PartiQLParser.IDENTIFIER)
                this.state = 317
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
        let localContext = new AsIdentContext(this.context, this.state)
        this.enterRule(localContext, 8, PartiQLParser.RULE_asIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 319
                this.match(PartiQLParser.AS)
                this.state = 320
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
        let localContext = new AtIdentContext(this.context, this.state)
        this.enterRule(localContext, 10, PartiQLParser.RULE_atIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 322
                this.match(PartiQLParser.AT)
                this.state = 323
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
        let localContext = new ByIdentContext(this.context, this.state)
        this.enterRule(localContext, 12, PartiQLParser.RULE_byIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 325
                this.match(PartiQLParser.BY)
                this.state = 326
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
        let localContext = new SymbolPrimitiveContext(this.context, this.state)
        this.enterRule(localContext, 14, PartiQLParser.RULE_symbolPrimitive)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 328
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
        let localContext = new DqlContext(this.context, this.state)
        this.enterRule(localContext, 16, PartiQLParser.RULE_dql)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 330
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
        let localContext = new ExecCommandContext(this.context, this.state)
        this.enterRule(localContext, 18, PartiQLParser.RULE_execCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 332
                this.match(PartiQLParser.EXEC)
                this.state = 333
                localContext._name = this.expr()
                this.state = 342
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context)) {
                    case 1:
                        {
                            this.state = 334
                            localContext._expr = this.expr()
                            localContext._args.push(localContext._expr!)
                            this.state = 339
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            while (_la === 270) {
                                {
                                    {
                                        this.state = 335
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 336
                                        localContext._expr = this.expr()
                                        localContext._args.push(localContext._expr!)
                                    }
                                }
                                this.state = 341
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
        let localContext = new QualifiedNameContext(this.context, this.state)
        this.enterRule(localContext, 20, PartiQLParser.RULE_qualifiedName)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 349
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 344
                                localContext._symbolPrimitive = this.symbolPrimitive()
                                localContext._qualifier.push(localContext._symbolPrimitive!)
                                this.state = 345
                                this.match(PartiQLParser.PERIOD)
                            }
                        }
                    }
                    this.state = 351
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                }
                this.state = 352
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
        let localContext = new TableNameContext(this.context, this.state)
        this.enterRule(localContext, 22, PartiQLParser.RULE_tableName)
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
    public tableConstraintName(): TableConstraintNameContext {
        let localContext = new TableConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 24, PartiQLParser.RULE_tableConstraintName)
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
    public columnName(): ColumnNameContext {
        let localContext = new ColumnNameContext(this.context, this.state)
        this.enterRule(localContext, 26, PartiQLParser.RULE_columnName)
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
    public columnConstraintName(): ColumnConstraintNameContext {
        let localContext = new ColumnConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 28, PartiQLParser.RULE_columnConstraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 360
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
        let localContext = new DdlContext(this.context, this.state)
        this.enterRule(localContext, 30, PartiQLParser.RULE_ddl)
        try {
            this.state = 364
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.CREATE:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 362
                        this.createCommand()
                    }
                    break
                case PartiQLParser.DROP:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 363
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
            this.state = 390
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 12, this.context)) {
                case 1:
                    localContext = new CreateTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 366
                        this.match(PartiQLParser.CREATE)
                        this.state = 367
                        this.match(PartiQLParser.TABLE)
                        this.state = 368
                        this.qualifiedName()
                        this.state = 373
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 10, this.context)) {
                            case 1:
                                {
                                    this.state = 369
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 370
                                    this.tableDef()
                                    this.state = 371
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
                        this.state = 375
                        this.match(PartiQLParser.CREATE)
                        this.state = 376
                        this.match(PartiQLParser.INDEX)
                        this.state = 377
                        this.match(PartiQLParser.ON)
                        this.state = 378
                        this.symbolPrimitive()
                        this.state = 379
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 380
                        this.pathSimple()
                        this.state = 385
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 381
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 382
                                    this.pathSimple()
                                }
                            }
                            this.state = 387
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 388
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
            this.state = 401
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 13, this.context)) {
                case 1:
                    localContext = new DropTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 392
                        this.match(PartiQLParser.DROP)
                        this.state = 393
                        this.match(PartiQLParser.TABLE)
                        this.state = 394
                        this.qualifiedName()
                    }
                    break
                case 2:
                    localContext = new DropIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 395
                        this.match(PartiQLParser.DROP)
                        this.state = 396
                        this.match(PartiQLParser.INDEX)
                        this.state = 397
                        ;(localContext as DropIndexContext)._target = this.symbolPrimitive()
                        this.state = 398
                        this.match(PartiQLParser.ON)
                        this.state = 399
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
        let localContext = new TableDefContext(this.context, this.state)
        this.enterRule(localContext, 36, PartiQLParser.RULE_tableDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 403
                this.tableDefPart()
                this.state = 408
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 404
                            this.match(PartiQLParser.COMMA)
                            this.state = 405
                            this.tableDefPart()
                        }
                    }
                    this.state = 410
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
            this.state = 425
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new ColumnDeclarationContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 411
                        this.columnName()
                        this.state = 412
                        this.type_()
                        this.state = 416
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 39 || _la === 140 || _la === 141) {
                            {
                                {
                                    this.state = 413
                                    this.columnConstraint()
                                }
                            }
                            this.state = 418
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                    break
                case PartiQLParser.PRIMARY:
                    localContext = new PrimaryKeyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 419
                        this.match(PartiQLParser.PRIMARY)
                        this.state = 420
                        this.match(PartiQLParser.KEY)
                        {
                            this.state = 421
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 422
                            this.columnDef()
                            this.state = 423
                            this.match(PartiQLParser.PAREN_RIGHT)
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
    public columnDef(): ColumnDefContext {
        let localContext = new ColumnDefContext(this.context, this.state)
        this.enterRule(localContext, 40, PartiQLParser.RULE_columnDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 427
                this.columnName()
                this.state = 432
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 428
                            this.match(PartiQLParser.COMMA)
                            this.state = 429
                            this.columnName()
                        }
                    }
                    this.state = 434
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
        let localContext = new ColumnConstraintContext(this.context, this.state)
        this.enterRule(localContext, 42, PartiQLParser.RULE_columnConstraint)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 437
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 39) {
                    {
                        this.state = 435
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 436
                        this.columnConstraintName()
                    }
                }

                this.state = 439
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
        this.enterRule(localContext, 44, PartiQLParser.RULE_columnConstraintDef)
        try {
            this.state = 444
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new ColConstrNotNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 441
                        this.match(PartiQLParser.NOT)
                        this.state = 442
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.NULL:
                    localContext = new ColConstrNullContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 443
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
        this.enterRule(localContext, 46, PartiQLParser.RULE_dml)
        let _la: number
        try {
            let alternative: number
            this.state = 473
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context)) {
                case 1:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 446
                        this.updateClause()
                        this.state = 448
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 447
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 450
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 20, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 453
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 452
                                this.whereClause()
                            }
                        }

                        this.state = 456
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 455
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 458
                        this.fromClause()
                        this.state = 460
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 459
                                this.whereClause()
                            }
                        }

                        this.state = 463
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 462
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 465
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 24, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 468
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 467
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 3:
                    localContext = new DmlDeleteContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 470
                        this.deleteCommand()
                    }
                    break
                case 4:
                    localContext = new DmlInsertReturningContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 471
                        this.insertCommandReturning()
                    }
                    break
                case 5:
                    localContext = new DmlBaseContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 472
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
        let localContext = new DmlBaseCommandContext(this.context, this.state)
        this.enterRule(localContext, 48, PartiQLParser.RULE_dmlBaseCommand)
        try {
            this.state = 481
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 475
                        this.insertStatement()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 476
                        this.insertStatementLegacy()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 477
                        this.setCommand()
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 478
                        this.replaceCommand()
                    }
                    break
                case 5:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 479
                        this.removeCommand()
                    }
                    break
                case 6:
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 480
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
        let localContext = new PathSimpleContext(this.context, this.state)
        this.enterRule(localContext, 50, PartiQLParser.RULE_pathSimple)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 483
                this.symbolPrimitive()
                this.state = 487
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 484
                                this.pathSimpleSteps()
                            }
                        }
                    }
                    this.state = 489
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 28, this.context)
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
        this.enterRule(localContext, 52, PartiQLParser.RULE_pathSimpleSteps)
        try {
            this.state = 500
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context)) {
                case 1:
                    localContext = new PathSimpleLiteralContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 490
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 491
                        ;(localContext as PathSimpleLiteralContext)._key = this.literal()
                        this.state = 492
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathSimpleSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 494
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 495
                        ;(localContext as PathSimpleSymbolContext)._key = this.symbolPrimitive()
                        this.state = 496
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathSimpleDotSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 498
                        this.match(PartiQLParser.PERIOD)
                        this.state = 499
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
        let localContext = new ReplaceCommandContext(this.context, this.state)
        this.enterRule(localContext, 54, PartiQLParser.RULE_replaceCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 502
                this.match(PartiQLParser.REPLACE)
                this.state = 503
                this.match(PartiQLParser.INTO)
                this.state = 504
                this.symbolPrimitive()
                this.state = 506
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 505
                        this.asIdent()
                    }
                }

                this.state = 508
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
        let localContext = new UpsertCommandContext(this.context, this.state)
        this.enterRule(localContext, 56, PartiQLParser.RULE_upsertCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 510
                this.match(PartiQLParser.UPSERT)
                this.state = 511
                this.match(PartiQLParser.INTO)
                this.state = 512
                this.symbolPrimitive()
                this.state = 514
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 513
                        this.asIdent()
                    }
                }

                this.state = 516
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
        let localContext = new RemoveCommandContext(this.context, this.state)
        this.enterRule(localContext, 58, PartiQLParser.RULE_removeCommand)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 518
                this.match(PartiQLParser.REMOVE)
                this.state = 519
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
        let localContext = new InsertCommandReturningContext(this.context, this.state)
        this.enterRule(localContext, 60, PartiQLParser.RULE_insertCommandReturning)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 521
                this.match(PartiQLParser.INSERT)
                this.state = 522
                this.match(PartiQLParser.INTO)
                this.state = 523
                this.pathSimple()
                this.state = 524
                this.match(PartiQLParser.VALUE)
                this.state = 525
                localContext._value = this.expr()
                this.state = 528
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 526
                        this.match(PartiQLParser.AT)
                        this.state = 527
                        localContext._pos = this.expr()
                    }
                }

                this.state = 531
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 530
                        this.onConflictLegacy()
                    }
                }

                this.state = 534
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 533
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
        let localContext = new InsertStatementContext(this.context, this.state)
        this.enterRule(localContext, 62, PartiQLParser.RULE_insertStatement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 536
                this.match(PartiQLParser.INSERT)
                this.state = 537
                this.match(PartiQLParser.INTO)
                this.state = 538
                this.symbolPrimitive()
                this.state = 540
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 539
                        this.asIdent()
                    }
                }

                this.state = 542
                localContext._value = this.expr()
                this.state = 544
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 543
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
        let localContext = new OnConflictContext(this.context, this.state)
        this.enterRule(localContext, 64, PartiQLParser.RULE_onConflict)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 546
                this.match(PartiQLParser.ON)
                this.state = 547
                this.match(PartiQLParser.CONFLICT)
                this.state = 549
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147 || _la === 294) {
                    {
                        this.state = 548
                        this.conflictTarget()
                    }
                }

                this.state = 551
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
        let localContext = new InsertStatementLegacyContext(this.context, this.state)
        this.enterRule(localContext, 66, PartiQLParser.RULE_insertStatementLegacy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 553
                this.match(PartiQLParser.INSERT)
                this.state = 554
                this.match(PartiQLParser.INTO)
                this.state = 555
                this.pathSimple()
                this.state = 556
                this.match(PartiQLParser.VALUE)
                this.state = 557
                localContext._value = this.expr()
                this.state = 560
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 558
                        this.match(PartiQLParser.AT)
                        this.state = 559
                        localContext._pos = this.expr()
                    }
                }

                this.state = 563
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 562
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
        let localContext = new OnConflictLegacyContext(this.context, this.state)
        this.enterRule(localContext, 68, PartiQLParser.RULE_onConflictLegacy)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 565
                this.match(PartiQLParser.ON)
                this.state = 566
                this.match(PartiQLParser.CONFLICT)
                this.state = 567
                this.match(PartiQLParser.WHERE)
                this.state = 568
                this.expr()
                this.state = 569
                this.match(PartiQLParser.DO)
                this.state = 570
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
        let localContext = new ConflictTargetContext(this.context, this.state)
        this.enterRule(localContext, 70, PartiQLParser.RULE_conflictTarget)
        let _la: number
        try {
            this.state = 586
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 572
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 573
                        this.symbolPrimitive()
                        this.state = 578
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 574
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 575
                                    this.symbolPrimitive()
                                }
                            }
                            this.state = 580
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 581
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.ON:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 583
                        this.match(PartiQLParser.ON)
                        this.state = 584
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 585
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
        let localContext = new ConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 72, PartiQLParser.RULE_constraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 588
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
        let localContext = new ConflictActionContext(this.context, this.state)
        this.enterRule(localContext, 74, PartiQLParser.RULE_conflictAction)
        try {
            this.state = 598
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 590
                        this.match(PartiQLParser.DO)
                        this.state = 591
                        this.match(PartiQLParser.NOTHING)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 592
                        this.match(PartiQLParser.DO)
                        this.state = 593
                        this.match(PartiQLParser.REPLACE)
                        this.state = 594
                        this.doReplace()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 595
                        this.match(PartiQLParser.DO)
                        this.state = 596
                        this.match(PartiQLParser.UPDATE)
                        this.state = 597
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
        let localContext = new DoReplaceContext(this.context, this.state)
        this.enterRule(localContext, 76, PartiQLParser.RULE_doReplace)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 600
                this.match(PartiQLParser.EXCLUDED)
                this.state = 603
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context)) {
                    case 1:
                        {
                            this.state = 601
                            this.match(PartiQLParser.WHERE)
                            this.state = 602
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
        let localContext = new DoUpdateContext(this.context, this.state)
        this.enterRule(localContext, 78, PartiQLParser.RULE_doUpdate)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 605
                this.match(PartiQLParser.EXCLUDED)
                this.state = 608
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 44, this.context)) {
                    case 1:
                        {
                            this.state = 606
                            this.match(PartiQLParser.WHERE)
                            this.state = 607
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
        let localContext = new UpdateClauseContext(this.context, this.state)
        this.enterRule(localContext, 80, PartiQLParser.RULE_updateClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 610
                this.match(PartiQLParser.UPDATE)
                this.state = 611
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
        let localContext = new SetCommandContext(this.context, this.state)
        this.enterRule(localContext, 82, PartiQLParser.RULE_setCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 613
                this.match(PartiQLParser.SET)
                this.state = 614
                this.setAssignment()
                this.state = 619
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 615
                            this.match(PartiQLParser.COMMA)
                            this.state = 616
                            this.setAssignment()
                        }
                    }
                    this.state = 621
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
        let localContext = new SetAssignmentContext(this.context, this.state)
        this.enterRule(localContext, 84, PartiQLParser.RULE_setAssignment)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 622
                this.pathSimple()
                this.state = 623
                this.match(PartiQLParser.EQ)
                this.state = 624
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
        let localContext = new DeleteCommandContext(this.context, this.state)
        this.enterRule(localContext, 86, PartiQLParser.RULE_deleteCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 626
                this.match(PartiQLParser.DELETE)
                this.state = 627
                this.fromClauseSimple()
                this.state = 629
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 628
                        this.whereClause()
                    }
                }

                this.state = 632
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 631
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
        let localContext = new ReturningClauseContext(this.context, this.state)
        this.enterRule(localContext, 88, PartiQLParser.RULE_returningClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 634
                this.match(PartiQLParser.RETURNING)
                this.state = 635
                this.returningColumn()
                this.state = 640
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 636
                            this.match(PartiQLParser.COMMA)
                            this.state = 637
                            this.returningColumn()
                        }
                    }
                    this.state = 642
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
        let localContext = new ReturningColumnContext(this.context, this.state)
        this.enterRule(localContext, 90, PartiQLParser.RULE_returningColumn)
        let _la: number
        try {
            this.state = 649
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 49, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 643
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 644
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 645
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 646
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 647
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 648
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
        this.enterRule(localContext, 92, PartiQLParser.RULE_fromClauseSimple)
        let _la: number
        try {
            this.state = 666
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context)) {
                case 1:
                    localContext = new FromClauseSimpleExplicitContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 651
                        this.match(PartiQLParser.FROM)
                        this.state = 652
                        this.pathSimple()
                        this.state = 654
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 653
                                this.asIdent()
                            }
                        }

                        this.state = 657
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 13) {
                            {
                                this.state = 656
                                this.atIdent()
                            }
                        }

                        this.state = 660
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 20) {
                            {
                                this.state = 659
                                this.byIdent()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new FromClauseSimpleImplicitContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 662
                        this.match(PartiQLParser.FROM)
                        this.state = 663
                        this.pathSimple()
                        this.state = 664
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
        let localContext = new WhereClauseContext(this.context, this.state)
        this.enterRule(localContext, 94, PartiQLParser.RULE_whereClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 668
                this.match(PartiQLParser.WHERE)
                this.state = 669
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
        this.enterRule(localContext, 96, PartiQLParser.RULE_selectClause)
        let _la: number
        try {
            this.state = 692
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context)) {
                case 1:
                    localContext = new SelectAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 671
                        this.match(PartiQLParser.SELECT)
                        this.state = 673
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 672
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 675
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    localContext = new SelectItemsContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 676
                        this.match(PartiQLParser.SELECT)
                        this.state = 678
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 677
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 680
                        this.projectionItems()
                    }
                    break
                case 3:
                    localContext = new SelectValueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 681
                        this.match(PartiQLParser.SELECT)
                        this.state = 683
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 682
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 685
                        this.match(PartiQLParser.VALUE)
                        this.state = 686
                        this.expr()
                    }
                    break
                case 4:
                    localContext = new SelectPivotContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 687
                        this.match(PartiQLParser.PIVOT)
                        this.state = 688
                        ;(localContext as SelectPivotContext)._pivot = this.expr()
                        this.state = 689
                        this.match(PartiQLParser.AT)
                        this.state = 690
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
        let localContext = new ProjectionItemsContext(this.context, this.state)
        this.enterRule(localContext, 98, PartiQLParser.RULE_projectionItems)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 694
                this.projectionItem()
                this.state = 699
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 695
                            this.match(PartiQLParser.COMMA)
                            this.state = 696
                            this.projectionItem()
                        }
                    }
                    this.state = 701
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
        let localContext = new ProjectionItemContext(this.context, this.state)
        this.enterRule(localContext, 100, PartiQLParser.RULE_projectionItem)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 702
                this.expr()
                this.state = 707
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10 || _la === 303 || _la === 304) {
                    {
                        this.state = 704
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 703
                                this.match(PartiQLParser.AS)
                            }
                        }

                        this.state = 706
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
        let localContext = new SetQuantifierStrategyContext(this.context, this.state)
        this.enterRule(localContext, 102, PartiQLParser.RULE_setQuantifierStrategy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 709
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
        let localContext = new LetClauseContext(this.context, this.state)
        this.enterRule(localContext, 104, PartiQLParser.RULE_letClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 711
                this.match(PartiQLParser.LET)
                this.state = 712
                this.letBinding()
                this.state = 717
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 61, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 713
                                this.match(PartiQLParser.COMMA)
                                this.state = 714
                                this.letBinding()
                            }
                        }
                    }
                    this.state = 719
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 61, this.context)
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
        let localContext = new LetBindingContext(this.context, this.state)
        this.enterRule(localContext, 106, PartiQLParser.RULE_letBinding)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 720
                this.expr()
                this.state = 721
                this.match(PartiQLParser.AS)
                this.state = 722
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
        let localContext = new OrderByClauseContext(this.context, this.state)
        this.enterRule(localContext, 108, PartiQLParser.RULE_orderByClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 724
                this.match(PartiQLParser.ORDER)
                this.state = 725
                this.match(PartiQLParser.BY)
                this.state = 726
                this.orderSortSpec()
                this.state = 731
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 62, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 727
                                this.match(PartiQLParser.COMMA)
                                this.state = 728
                                this.orderSortSpec()
                            }
                        }
                    }
                    this.state = 733
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 62, this.context)
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
        let localContext = new OrderSortSpecContext(this.context, this.state)
        this.enterRule(localContext, 110, PartiQLParser.RULE_orderSortSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 734
                this.expr()
                this.state = 736
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 63, this.context)) {
                    case 1:
                        {
                            this.state = 735
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
                this.state = 740
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 64, this.context)) {
                    case 1:
                        {
                            this.state = 738
                            this.match(PartiQLParser.NULLS)
                            this.state = 739
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
        let localContext = new GroupClauseContext(this.context, this.state)
        this.enterRule(localContext, 112, PartiQLParser.RULE_groupClause)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 742
                this.match(PartiQLParser.GROUP)
                this.state = 744
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 158) {
                    {
                        this.state = 743
                        this.match(PartiQLParser.PARTIAL)
                    }
                }

                this.state = 746
                this.match(PartiQLParser.BY)
                this.state = 747
                this.groupKey()
                this.state = 752
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 748
                                this.match(PartiQLParser.COMMA)
                                this.state = 749
                                this.groupKey()
                            }
                        }
                    }
                    this.state = 754
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context)
                }
                this.state = 756
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 67, this.context)) {
                    case 1:
                        {
                            this.state = 755
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
        let localContext = new GroupAliasContext(this.context, this.state)
        this.enterRule(localContext, 114, PartiQLParser.RULE_groupAlias)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 758
                this.match(PartiQLParser.GROUP)
                this.state = 759
                this.match(PartiQLParser.AS)
                this.state = 760
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
        let localContext = new GroupKeyContext(this.context, this.state)
        this.enterRule(localContext, 116, PartiQLParser.RULE_groupKey)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 762
                localContext._key = this.exprSelect()
                this.state = 765
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 68, this.context)) {
                    case 1:
                        {
                            this.state = 763
                            this.match(PartiQLParser.AS)
                            this.state = 764
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
        let localContext = new OverContext(this.context, this.state)
        this.enterRule(localContext, 118, PartiQLParser.RULE_over)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 767
                this.match(PartiQLParser.OVER)
                this.state = 768
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 770
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 233) {
                    {
                        this.state = 769
                        this.windowPartitionList()
                    }
                }

                this.state = 773
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 152) {
                    {
                        this.state = 772
                        this.windowSortSpecList()
                    }
                }

                this.state = 775
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
        let localContext = new WindowPartitionListContext(this.context, this.state)
        this.enterRule(localContext, 120, PartiQLParser.RULE_windowPartitionList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 777
                this.match(PartiQLParser.PARTITION)
                this.state = 778
                this.match(PartiQLParser.BY)
                this.state = 779
                this.expr()
                this.state = 784
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 780
                            this.match(PartiQLParser.COMMA)
                            this.state = 781
                            this.expr()
                        }
                    }
                    this.state = 786
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
        let localContext = new WindowSortSpecListContext(this.context, this.state)
        this.enterRule(localContext, 122, PartiQLParser.RULE_windowSortSpecList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 787
                this.match(PartiQLParser.ORDER)
                this.state = 788
                this.match(PartiQLParser.BY)
                this.state = 789
                this.orderSortSpec()
                this.state = 794
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 790
                            this.match(PartiQLParser.COMMA)
                            this.state = 791
                            this.orderSortSpec()
                        }
                    }
                    this.state = 796
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
        let localContext = new HavingClauseContext(this.context, this.state)
        this.enterRule(localContext, 124, PartiQLParser.RULE_havingClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 797
                this.match(PartiQLParser.HAVING)
                this.state = 798
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
        let localContext = new ExcludeClauseContext(this.context, this.state)
        this.enterRule(localContext, 126, PartiQLParser.RULE_excludeClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 800
                this.match(PartiQLParser.EXCLUDE)
                this.state = 801
                this.excludeExpr()
                this.state = 806
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 802
                            this.match(PartiQLParser.COMMA)
                            this.state = 803
                            this.excludeExpr()
                        }
                    }
                    this.state = 808
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
        let localContext = new ExcludeExprContext(this.context, this.state)
        this.enterRule(localContext, 128, PartiQLParser.RULE_excludeExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 809
                this.symbolPrimitive()
                this.state = 811
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 810
                            this.excludeExprSteps()
                        }
                    }
                    this.state = 813
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
        this.enterRule(localContext, 130, PartiQLParser.RULE_excludeExprSteps)
        try {
            this.state = 828
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 75, this.context)) {
                case 1:
                    localContext = new ExcludeExprTupleAttrContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 815
                        this.match(PartiQLParser.PERIOD)
                        this.state = 816
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new ExcludeExprCollectionAttrContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 817
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 818
                        ;(localContext as ExcludeExprCollectionAttrContext)._attr = this.match(
                            PartiQLParser.LITERAL_STRING
                        )
                        this.state = 819
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new ExcludeExprCollectionIndexContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 820
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 821
                        ;(localContext as ExcludeExprCollectionIndexContext)._index = this.match(
                            PartiQLParser.LITERAL_INTEGER
                        )
                        this.state = 822
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 4:
                    localContext = new ExcludeExprCollectionWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 823
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 824
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 825
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 5:
                    localContext = new ExcludeExprTupleWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 826
                        this.match(PartiQLParser.PERIOD)
                        this.state = 827
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
        let localContext = new FromClauseContext(this.context, this.state)
        this.enterRule(localContext, 132, PartiQLParser.RULE_fromClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 830
                this.match(PartiQLParser.FROM)
                this.state = 831
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
        let localContext = new WhereClauseSelectContext(this.context, this.state)
        this.enterRule(localContext, 134, PartiQLParser.RULE_whereClauseSelect)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 833
                this.match(PartiQLParser.WHERE)
                this.state = 834
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
        let localContext = new OffsetByClauseContext(this.context, this.state)
        this.enterRule(localContext, 136, PartiQLParser.RULE_offsetByClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 836
                this.match(PartiQLParser.OFFSET)
                this.state = 837
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
        let localContext = new LimitClauseContext(this.context, this.state)
        this.enterRule(localContext, 138, PartiQLParser.RULE_limitClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 839
                this.match(PartiQLParser.LIMIT)
                this.state = 840
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
        let localContext = new GpmlPatternContext(this.context, this.state)
        this.enterRule(localContext, 140, PartiQLParser.RULE_gpmlPattern)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 843
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 76, this.context)) {
                    case 1:
                        {
                            this.state = 842
                            localContext._selector = this.matchSelector()
                        }
                        break
                }
                this.state = 845
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
        let localContext = new GpmlPatternListContext(this.context, this.state)
        this.enterRule(localContext, 142, PartiQLParser.RULE_gpmlPatternList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 848
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 4 || _la === 8 || _la === 186) {
                    {
                        this.state = 847
                        localContext._selector = this.matchSelector()
                    }
                }

                this.state = 850
                this.matchPattern()
                this.state = 855
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 851
                            this.match(PartiQLParser.COMMA)
                            this.state = 852
                            this.matchPattern()
                        }
                    }
                    this.state = 857
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
        let localContext = new MatchPatternContext(this.context, this.state)
        this.enterRule(localContext, 144, PartiQLParser.RULE_matchPattern)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 859
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 79, this.context)) {
                    case 1:
                        {
                            this.state = 858
                            localContext._restrictor = this.patternRestrictor()
                        }
                        break
                }
                this.state = 862
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 80, this.context)) {
                    case 1:
                        {
                            this.state = 861
                            localContext._variable = this.patternPathVariable()
                        }
                        break
                }
                this.state = 867
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 81, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 864
                                this.graphPart()
                            }
                        }
                    }
                    this.state = 869
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 81, this.context)
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
        let localContext = new GraphPartContext(this.context, this.state)
        this.enterRule(localContext, 146, PartiQLParser.RULE_graphPart)
        try {
            this.state = 873
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 82, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 870
                        this.node()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 871
                        this.edge()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 872
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
        this.enterRule(localContext, 148, PartiQLParser.RULE_matchSelector)
        let _la: number
        try {
            this.state = 886
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 85, this.context)) {
                case 1:
                    localContext = new SelectorBasicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 875
                        ;(localContext as SelectorBasicContext)._mod = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 8)) {
                            ;(localContext as SelectorBasicContext)._mod = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 876
                        this.match(PartiQLParser.SHORTEST)
                    }
                    break
                case 2:
                    localContext = new SelectorAnyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 877
                        this.match(PartiQLParser.ANY)
                        this.state = 879
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 83, this.context)) {
                            case 1:
                                {
                                    this.state = 878
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
                        this.state = 881
                        this.match(PartiQLParser.SHORTEST)
                        this.state = 882
                        ;(localContext as SelectorShortestContext)._k = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 884
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 84, this.context)) {
                            case 1:
                                {
                                    this.state = 883
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
        let localContext = new PatternPathVariableContext(this.context, this.state)
        this.enterRule(localContext, 150, PartiQLParser.RULE_patternPathVariable)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 888
                this.symbolPrimitive()
                this.state = 889
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
        let localContext = new PatternRestrictorContext(this.context, this.state)
        this.enterRule(localContext, 152, PartiQLParser.RULE_patternRestrictor)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 891
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
        let localContext = new NodeContext(this.context, this.state)
        this.enterRule(localContext, 154, PartiQLParser.RULE_node)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 893
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 895
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 894
                        this.symbolPrimitive()
                    }
                }

                this.state = 899
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 897
                        this.match(PartiQLParser.COLON)
                        this.state = 898
                        this.labelSpec(0)
                    }
                }

                this.state = 902
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 901
                        this.whereClause()
                    }
                }

                this.state = 904
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
        this.enterRule(localContext, 156, PartiQLParser.RULE_edge)
        try {
            this.state = 914
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 91, this.context)) {
                case 1:
                    localContext = new EdgeWithSpecContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 906
                        this.edgeWSpec()
                        this.state = 908
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 89, this.context)) {
                            case 1:
                                {
                                    this.state = 907
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
                        this.state = 910
                        this.edgeAbbrev()
                        this.state = 912
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 90, this.context)) {
                            case 1:
                                {
                                    this.state = 911
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
        let localContext = new PatternContext(this.context, this.state)
        this.enterRule(localContext, 158, PartiQLParser.RULE_pattern)
        let _la: number
        try {
            this.state = 954
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 916
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 918
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 92, this.context)) {
                            case 1:
                                {
                                    this.state = 917
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 921
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 920
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 924
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 923
                                    this.graphPart()
                                }
                            }
                            this.state = 926
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 929
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 928
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 931
                        this.match(PartiQLParser.PAREN_RIGHT)
                        this.state = 933
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 96, this.context)) {
                            case 1:
                                {
                                    this.state = 932
                                    localContext._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 935
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 937
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 97, this.context)) {
                            case 1:
                                {
                                    this.state = 936
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 940
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 939
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 943
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 942
                                    this.graphPart()
                                }
                            }
                            this.state = 945
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 948
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 947
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 950
                        this.match(PartiQLParser.BRACKET_RIGHT)
                        this.state = 952
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 101, this.context)) {
                            case 1:
                                {
                                    this.state = 951
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
        let localContext = new PatternQuantifierContext(this.context, this.state)
        this.enterRule(localContext, 160, PartiQLParser.RULE_patternQuantifier)
        let _la: number
        try {
            this.state = 964
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.ASTERISK:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 956
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
                        this.state = 957
                        this.match(PartiQLParser.BRACE_LEFT)
                        this.state = 958
                        localContext._lower = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 959
                        this.match(PartiQLParser.COMMA)
                        this.state = 961
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 301) {
                            {
                                this.state = 960
                                localContext._upper = this.match(PartiQLParser.LITERAL_INTEGER)
                            }
                        }

                        this.state = 963
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
        this.enterRule(localContext, 162, PartiQLParser.RULE_edgeWSpec)
        try {
            this.state = 1000
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 105, this.context)) {
                case 1:
                    localContext = new EdgeSpecRightContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 966
                        this.match(PartiQLParser.MINUS)
                        this.state = 967
                        this.edgeSpec()
                        this.state = 968
                        this.match(PartiQLParser.MINUS)
                        this.state = 969
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 2:
                    localContext = new EdgeSpecUndirectedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 971
                        this.match(PartiQLParser.TILDE)
                        this.state = 972
                        this.edgeSpec()
                        this.state = 973
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 3:
                    localContext = new EdgeSpecLeftContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 975
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 976
                        this.match(PartiQLParser.MINUS)
                        this.state = 977
                        this.edgeSpec()
                        this.state = 978
                        this.match(PartiQLParser.MINUS)
                    }
                    break
                case 4:
                    localContext = new EdgeSpecUndirectedRightContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 980
                        this.match(PartiQLParser.TILDE)
                        this.state = 981
                        this.edgeSpec()
                        this.state = 982
                        this.match(PartiQLParser.TILDE)
                        this.state = 983
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 5:
                    localContext = new EdgeSpecUndirectedLeftContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 985
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 986
                        this.match(PartiQLParser.TILDE)
                        this.state = 987
                        this.edgeSpec()
                        this.state = 988
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 6:
                    localContext = new EdgeSpecBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 990
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 991
                        this.match(PartiQLParser.MINUS)
                        this.state = 992
                        this.edgeSpec()
                        this.state = 993
                        this.match(PartiQLParser.MINUS)
                        this.state = 994
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 7:
                    localContext = new EdgeSpecUndirectedBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 996
                        this.match(PartiQLParser.MINUS)
                        this.state = 997
                        this.edgeSpec()
                        this.state = 998
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
        let localContext = new EdgeSpecContext(this.context, this.state)
        this.enterRule(localContext, 164, PartiQLParser.RULE_edgeSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1002
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1004
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 1003
                        this.symbolPrimitive()
                    }
                }

                this.state = 1008
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 1006
                        this.match(PartiQLParser.COLON)
                        this.state = 1007
                        this.labelSpec(0)
                    }
                }

                this.state = 1011
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 1010
                        this.whereClause()
                    }
                }

                this.state = 1013
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new LabelSpecContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 166
        this.enterRecursionRule(localContext, 166, PartiQLParser.RULE_labelSpec, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelSpecTermContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1016
                    this.labelTerm(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1023
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 109, this.context)
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
                                this.state = 1018
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1019
                                this.match(PartiQLParser.VERTBAR)
                                this.state = 1020
                                this.labelTerm(0)
                            }
                        }
                    }
                    this.state = 1025
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 109, this.context)
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new LabelTermContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 168
        this.enterRecursionRule(localContext, 168, PartiQLParser.RULE_labelTerm, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelTermFactorContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1027
                    this.labelFactor()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1034
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 110, this.context)
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
                                this.state = 1029
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1030
                                this.match(PartiQLParser.AMPERSAND)
                                this.state = 1031
                                this.labelFactor()
                            }
                        }
                    }
                    this.state = 1036
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 110, this.context)
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
        this.enterRule(localContext, 170, PartiQLParser.RULE_labelFactor)
        try {
            this.state = 1040
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BANG:
                    localContext = new LabelFactorNotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1037
                        this.match(PartiQLParser.BANG)
                        this.state = 1038
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
                        this.state = 1039
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
        this.enterRule(localContext, 172, PartiQLParser.RULE_labelPrimary)
        try {
            this.state = 1048
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new LabelPrimaryNameContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1042
                        this.symbolPrimitive()
                    }
                    break
                case PartiQLParser.PERCENT:
                    localContext = new LabelPrimaryWildContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1043
                        this.match(PartiQLParser.PERCENT)
                    }
                    break
                case PartiQLParser.PAREN_LEFT:
                    localContext = new LabelPrimaryParenContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1044
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1045
                        this.labelSpec(0)
                        this.state = 1046
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
        let localContext = new EdgeAbbrevContext(this.context, this.state)
        this.enterRule(localContext, 174, PartiQLParser.RULE_edgeAbbrev)
        let _la: number
        try {
            this.state = 1062
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 115, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1050
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1051
                        this.match(PartiQLParser.TILDE)
                        this.state = 1052
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1053
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1054
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1056
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 286) {
                            {
                                this.state = 1055
                                this.match(PartiQLParser.ANGLE_LEFT)
                            }
                        }

                        this.state = 1058
                        this.match(PartiQLParser.MINUS)
                        this.state = 1060
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 114, this.context)) {
                            case 1:
                                {
                                    this.state = 1059
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new TableReferenceContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 176
        this.enterRecursionRule(localContext, 176, PartiQLParser.RULE_tableReference, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1070
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 116, this.context)) {
                    case 1:
                        {
                            localContext = new TableRefBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1065
                            this.tableNonJoin()
                        }
                        break
                    case 2:
                        {
                            localContext = new TableWrappedContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1066
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 1067
                            this.tableReference(0)
                            this.state = 1068
                            this.match(PartiQLParser.PAREN_RIGHT)
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1092
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 120, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1090
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 119, this.context)) {
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
                                        this.state = 1072
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1074
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1073
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1076
                                        this.match(PartiQLParser.CROSS)
                                        this.state = 1077
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1078
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
                                        this.state = 1079
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1080
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1081
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
                                        this.state = 1082
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1084
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1083
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1086
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1087
                                        ;(localContext as TableQualifiedJoinContext)._rhs = this.joinRhs()
                                        this.state = 1088
                                        this.joinSpec()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1094
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 120, this.context)
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
        let localContext = new TableNonJoinContext(this.context, this.state)
        this.enterRule(localContext, 178, PartiQLParser.RULE_tableNonJoin)
        try {
            this.state = 1097
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
                        this.state = 1095
                        this.tableBaseReference()
                    }
                    break
                case PartiQLParser.UNPIVOT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1096
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
        this.enterRule(localContext, 180, PartiQLParser.RULE_tableBaseReference)
        try {
            this.state = 1122
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 128, this.context)) {
                case 1:
                    localContext = new TableBaseRefSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1099
                        ;(localContext as TableBaseRefSymbolContext)._source = this.exprSelect()
                        this.state = 1100
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new TableBaseRefClausesContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1102
                        ;(localContext as TableBaseRefClausesContext)._source = this.exprSelect()
                        this.state = 1104
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 122, this.context)) {
                            case 1:
                                {
                                    this.state = 1103
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1107
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 123, this.context)) {
                            case 1:
                                {
                                    this.state = 1106
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1110
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 124, this.context)) {
                            case 1:
                                {
                                    this.state = 1109
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
                        this.state = 1112
                        ;(localContext as TableBaseRefMatchContext)._source = this.exprGraphMatchOne()
                        this.state = 1114
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 125, this.context)) {
                            case 1:
                                {
                                    this.state = 1113
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1117
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 126, this.context)) {
                            case 1:
                                {
                                    this.state = 1116
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1120
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 127, this.context)) {
                            case 1:
                                {
                                    this.state = 1119
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
        let localContext = new TableUnpivotContext(this.context, this.state)
        this.enterRule(localContext, 182, PartiQLParser.RULE_tableUnpivot)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1124
                this.match(PartiQLParser.UNPIVOT)
                this.state = 1125
                this.expr()
                this.state = 1127
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 129, this.context)) {
                    case 1:
                        {
                            this.state = 1126
                            this.asIdent()
                        }
                        break
                }
                this.state = 1130
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 130, this.context)) {
                    case 1:
                        {
                            this.state = 1129
                            this.atIdent()
                        }
                        break
                }
                this.state = 1133
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 131, this.context)) {
                    case 1:
                        {
                            this.state = 1132
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
        this.enterRule(localContext, 184, PartiQLParser.RULE_joinRhs)
        try {
            this.state = 1140
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 132, this.context)) {
                case 1:
                    localContext = new JoinRhsBaseContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1135
                        this.tableNonJoin()
                    }
                    break
                case 2:
                    localContext = new JoinRhsTableJoinedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1136
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1137
                        this.tableReference(0)
                        this.state = 1138
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
        let localContext = new JoinSpecContext(this.context, this.state)
        this.enterRule(localContext, 186, PartiQLParser.RULE_joinSpec)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1142
                this.match(PartiQLParser.ON)
                this.state = 1143
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
        let localContext = new JoinTypeContext(this.context, this.state)
        this.enterRule(localContext, 188, PartiQLParser.RULE_joinType)
        let _la: number
        try {
            this.state = 1159
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.INNER:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1145
                        localContext._mod = this.match(PartiQLParser.INNER)
                    }
                    break
                case PartiQLParser.LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1146
                        localContext._mod = this.match(PartiQLParser.LEFT)
                        this.state = 1148
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1147
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.RIGHT:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1150
                        localContext._mod = this.match(PartiQLParser.RIGHT)
                        this.state = 1152
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1151
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.FULL:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1154
                        localContext._mod = this.match(PartiQLParser.FULL)
                        this.state = 1156
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1155
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.OUTER:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1158
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
        let localContext = new ExprContext(this.context, this.state)
        this.enterRule(localContext, 190, PartiQLParser.RULE_expr)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1161
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new ExprBagOpContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 192
        this.enterRecursionRule(localContext, 192, PartiQLParser.RULE_exprBagOp, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new QueryBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1164
                    this.exprSelect()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1195
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 144, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1193
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 143, this.context)) {
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
                                        this.state = 1166
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
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
                                        this.match(PartiQLParser.EXCEPT)
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
                                        this.state = 1175
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1177
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1176
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1179
                                        this.match(PartiQLParser.UNION)
                                        this.state = 1181
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1180
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1183
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
                                        this.state = 1184
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1186
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1185
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1188
                                        this.match(PartiQLParser.INTERSECT)
                                        this.state = 1190
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1189
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1192
                                        ;(localContext as IntersectContext)._rhs = this.exprSelect()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1197
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 144, this.context)
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
        this.enterRule(localContext, 194, PartiQLParser.RULE_exprSelect)
        let _la: number
        try {
            this.state = 1225
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.SELECT:
                case PartiQLParser.PIVOT:
                    localContext = new SfwQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1198
                        ;(localContext as SfwQueryContext)._select = this.selectClause()
                        this.state = 1200
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 78) {
                            {
                                this.state = 1199
                                ;(localContext as SfwQueryContext)._exclude = this.excludeClause()
                            }
                        }

                        this.state = 1202
                        ;(localContext as SfwQueryContext)._from_ = this.fromClause()
                        this.state = 1204
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 146, this.context)) {
                            case 1:
                                {
                                    this.state = 1203
                                    ;(localContext as SfwQueryContext)._let_ = this.letClause()
                                }
                                break
                        }
                        this.state = 1207
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 147, this.context)) {
                            case 1:
                                {
                                    this.state = 1206
                                    ;(localContext as SfwQueryContext)._where = this.whereClauseSelect()
                                }
                                break
                        }
                        this.state = 1210
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 148, this.context)) {
                            case 1:
                                {
                                    this.state = 1209
                                    ;(localContext as SfwQueryContext)._group = this.groupClause()
                                }
                                break
                        }
                        this.state = 1213
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 149, this.context)) {
                            case 1:
                                {
                                    this.state = 1212
                                    ;(localContext as SfwQueryContext)._having = this.havingClause()
                                }
                                break
                        }
                        this.state = 1216
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 150, this.context)) {
                            case 1:
                                {
                                    this.state = 1215
                                    ;(localContext as SfwQueryContext)._order = this.orderByClause()
                                }
                                break
                        }
                        this.state = 1219
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 151, this.context)) {
                            case 1:
                                {
                                    this.state = 1218
                                    ;(localContext as SfwQueryContext)._limit = this.limitClause()
                                }
                                break
                        }
                        this.state = 1222
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 152, this.context)) {
                            case 1:
                                {
                                    this.state = 1221
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
                        this.state = 1224
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new ExprOrContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 196
        this.enterRecursionRule(localContext, 196, PartiQLParser.RULE_exprOr, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprOrBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1228
                    ;(localContext as ExprOrBaseContext)._parent = this.exprAnd(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1235
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 154, this.context)
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
                                this.state = 1230
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1231
                                this.match(PartiQLParser.OR)
                                this.state = 1232
                                ;(localContext as OrContext)._rhs = this.exprAnd(0)
                            }
                        }
                    }
                    this.state = 1237
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 154, this.context)
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new ExprAndContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 198
        this.enterRecursionRule(localContext, 198, PartiQLParser.RULE_exprAnd, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprAndBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1239
                    ;(localContext as ExprAndBaseContext)._parent = this.exprNot()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1246
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 155, this.context)
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
                                this.state = 1241
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1242
                                ;(localContext as AndContext)._op = this.match(PartiQLParser.AND)
                                this.state = 1243
                                ;(localContext as AndContext)._rhs = this.exprNot()
                            }
                        }
                    }
                    this.state = 1248
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 155, this.context)
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
        this.enterRule(localContext, 200, PartiQLParser.RULE_exprNot)
        try {
            this.state = 1252
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new NotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1249
                        ;(localContext as NotContext)._op = this.match(PartiQLParser.NOT)
                        this.state = 1250
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
                        this.state = 1251
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new ExprPredicateContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 202
        this.enterRecursionRule(localContext, 202, PartiQLParser.RULE_exprPredicate, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new PredicateBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1255
                    ;(localContext as PredicateBaseContext)._parent = this.mathOp00(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1302
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 164, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1300
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 163, this.context)) {
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
                                        this.state = 1257
                                        if (!this.precpred(this.context, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 7)')
                                        }
                                        this.state = 1258
                                        ;(localContext as PredicateComparisonContext)._op = this.tokenStream.LT(1)
                                        _la = this.tokenStream.LA(1)
                                        if (!(((_la - 281) & ~0x1f) === 0 && ((1 << (_la - 281)) & 111) !== 0)) {
                                            ;(localContext as PredicateComparisonContext)._op =
                                                this.errorHandler.recoverInline(this)
                                        } else {
                                            this.errorHandler.reportMatch(this)
                                            this.consume()
                                        }
                                        this.state = 1259
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
                                        this.state = 1260
                                        if (!this.precpred(this.context, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                        }
                                        this.state = 1261
                                        this.match(PartiQLParser.IS)
                                        this.state = 1263
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1262
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1265
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
                                        this.state = 1266
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1268
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1267
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1270
                                        this.match(PartiQLParser.IN)
                                        this.state = 1271
                                        this.match(PartiQLParser.PAREN_LEFT)
                                        this.state = 1272
                                        this.expr()
                                        this.state = 1273
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
                                        this.state = 1275
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1277
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1276
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1279
                                        this.match(PartiQLParser.IN)
                                        this.state = 1280
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
                                        this.state = 1281
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1283
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1282
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1285
                                        this.match(PartiQLParser.LIKE)
                                        this.state = 1286
                                        ;(localContext as PredicateLikeContext)._rhs = this.mathOp00(0)
                                        this.state = 1289
                                        this.errorHandler.sync(this)
                                        switch (this.interpreter.adaptivePredict(this.tokenStream, 161, this.context)) {
                                            case 1:
                                                {
                                                    this.state = 1287
                                                    this.match(PartiQLParser.ESCAPE)
                                                    this.state = 1288
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
                                        this.state = 1291
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1293
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1292
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1295
                                        this.match(PartiQLParser.BETWEEN)
                                        this.state = 1296
                                        ;(localContext as PredicateBetweenContext)._lower = this.mathOp00(0)
                                        this.state = 1297
                                        this.match(PartiQLParser.AND)
                                        this.state = 1298
                                        ;(localContext as PredicateBetweenContext)._upper = this.mathOp00(0)
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1304
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

    public mathOp00(): MathOp00Context
    public mathOp00(_p: number): MathOp00Context
    public mathOp00(_p?: number): MathOp00Context {
        if (_p === undefined) {
            _p = 0
        }

        let parentContext = this.context
        let parentState = this.state
        let localContext = new MathOp00Context(this.context, parentState)
        let previousContext = localContext
        let _startState = 204
        this.enterRecursionRule(localContext, 204, PartiQLParser.RULE_mathOp00, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1306
                    localContext._parent = this.mathOp01(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1313
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
                                localContext = new MathOp00Context(parentContext, parentState)
                                localContext._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_mathOp00)
                                this.state = 1308
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1309
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 279 || _la === 285)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1310
                                localContext._rhs = this.mathOp01(0)
                            }
                        }
                    }
                    this.state = 1315
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

    public mathOp01(): MathOp01Context
    public mathOp01(_p: number): MathOp01Context
    public mathOp01(_p?: number): MathOp01Context {
        if (_p === undefined) {
            _p = 0
        }

        let parentContext = this.context
        let parentState = this.state
        let localContext = new MathOp01Context(this.context, parentState)
        let previousContext = localContext
        let _startState = 206
        this.enterRecursionRule(localContext, 206, PartiQLParser.RULE_mathOp01, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1317
                    localContext._parent = this.mathOp02(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1324
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 166, this.context)
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
                                this.state = 1319
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1320
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 271 || _la === 272)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1321
                                localContext._rhs = this.mathOp02(0)
                            }
                        }
                    }
                    this.state = 1326
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 166, this.context)
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new MathOp02Context(this.context, parentState)
        let previousContext = localContext
        let _startState = 208
        this.enterRecursionRule(localContext, 208, PartiQLParser.RULE_mathOp02, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1328
                    localContext._parent = this.valueExpr()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1335
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 167, this.context)
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
                                this.state = 1330
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1331
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(((_la - 273) & ~0x1f) === 0 && ((1 << (_la - 273)) & 19) !== 0)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1332
                                localContext._rhs = this.valueExpr()
                            }
                        }
                    }
                    this.state = 1337
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 167, this.context)
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
        let localContext = new ValueExprContext(this.context, this.state)
        this.enterRule(localContext, 210, PartiQLParser.RULE_valueExpr)
        let _la: number
        try {
            this.state = 1341
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1338
                        localContext._sign = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 271 || _la === 272)) {
                            localContext._sign = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1339
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
                        this.state = 1340
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

        let parentContext = this.context
        let parentState = this.state
        let localContext = new ExprPrimaryContext(this.context, parentState)
        let previousContext = localContext
        let _startState = 212
        this.enterRecursionRule(localContext, 212, PartiQLParser.RULE_exprPrimary, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1364
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 169, this.context)) {
                    case 1:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1344
                            this.exprTerm()
                        }
                        break
                    case 2:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1345
                            this.cast()
                        }
                        break
                    case 3:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1346
                            this.sequenceConstructor()
                        }
                        break
                    case 4:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1347
                            this.substring()
                        }
                        break
                    case 5:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1348
                            this.position()
                        }
                        break
                    case 6:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1349
                            this.overlay()
                        }
                        break
                    case 7:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1350
                            this.canCast()
                        }
                        break
                    case 8:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1351
                            this.canLosslessCast()
                        }
                        break
                    case 9:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1352
                            this.extract()
                        }
                        break
                    case 10:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1353
                            this.coalesce()
                        }
                        break
                    case 11:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1354
                            this.dateFunction()
                        }
                        break
                    case 12:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1355
                            this.aggregate()
                        }
                        break
                    case 13:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1356
                            this.trimFunction()
                        }
                        break
                    case 14:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1357
                            this.functionCall()
                        }
                        break
                    case 15:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1358
                            this.nullIf()
                        }
                        break
                    case 16:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1359
                            this.exprGraphMatchMany()
                        }
                        break
                    case 17:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1360
                            this.caseExpr()
                        }
                        break
                    case 18:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1361
                            this.valueList()
                        }
                        break
                    case 19:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1362
                            this.values()
                        }
                        break
                    case 20:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1363
                            this.windowFunction()
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1374
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 171, this.context)
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
                                this.state = 1366
                                if (!this.precpred(this.context, 6)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                }
                                this.state = 1368
                                this.errorHandler.sync(this)
                                alternative = 1
                                do {
                                    switch (alternative) {
                                        case 1:
                                            {
                                                {
                                                    this.state = 1367
                                                    this.pathStep()
                                                }
                                            }
                                            break
                                        default:
                                            throw new antlr.NoViableAltException(this)
                                    }
                                    this.state = 1370
                                    this.errorHandler.sync(this)
                                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 170, this.context)
                                } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                            }
                        }
                    }
                    this.state = 1376
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 171, this.context)
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
        this.enterRule(localContext, 214, PartiQLParser.RULE_exprTerm)
        try {
            this.state = 1388
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    localContext = new ExprTermWrappedQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1377
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1378
                        this.expr()
                        this.state = 1379
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.CURRENT_USER:
                    localContext = new ExprTermCurrentUserContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1381
                        this.match(PartiQLParser.CURRENT_USER)
                    }
                    break
                case PartiQLParser.CURRENT_DATE:
                    localContext = new ExprTermCurrentDateContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1382
                        this.match(PartiQLParser.CURRENT_DATE)
                    }
                    break
                case PartiQLParser.QUESTION_MARK:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1383
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
                        this.state = 1384
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
                        this.state = 1385
                        this.literal()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1386
                        this.collection()
                    }
                    break
                case PartiQLParser.BRACE_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1387
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
        let localContext = new NullIfContext(this.context, this.state)
        this.enterRule(localContext, 216, PartiQLParser.RULE_nullIf)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1390
                this.match(PartiQLParser.NULLIF)
                this.state = 1391
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1392
                this.expr()
                this.state = 1393
                this.match(PartiQLParser.COMMA)
                this.state = 1394
                this.expr()
                this.state = 1395
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
        let localContext = new CoalesceContext(this.context, this.state)
        this.enterRule(localContext, 218, PartiQLParser.RULE_coalesce)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1397
                this.match(PartiQLParser.COALESCE)
                this.state = 1398
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1399
                this.expr()
                this.state = 1404
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1400
                            this.match(PartiQLParser.COMMA)
                            this.state = 1401
                            this.expr()
                        }
                    }
                    this.state = 1406
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1407
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
        let localContext = new CaseExprContext(this.context, this.state)
        this.enterRule(localContext, 220, PartiQLParser.RULE_caseExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1409
                this.match(PartiQLParser.CASE)
                this.state = 1411
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
                        this.state = 1410
                        localContext._case_ = this.expr()
                    }
                }

                this.state = 1418
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1413
                            this.match(PartiQLParser.WHEN)
                            this.state = 1414
                            localContext._expr = this.expr()
                            localContext._whens.push(localContext._expr!)
                            this.state = 1415
                            this.match(PartiQLParser.THEN)
                            this.state = 1416
                            localContext._expr = this.expr()
                            localContext._thens.push(localContext._expr!)
                        }
                    }
                    this.state = 1420
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 223)
                this.state = 1424
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 71) {
                    {
                        this.state = 1422
                        this.match(PartiQLParser.ELSE)
                        this.state = 1423
                        localContext._else_ = this.expr()
                    }
                }

                this.state = 1426
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
        let localContext = new ValuesContext(this.context, this.state)
        this.enterRule(localContext, 222, PartiQLParser.RULE_values)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1428
                this.match(PartiQLParser.VALUES)
                this.state = 1429
                this.valueRow()
                this.state = 1434
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 177, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 1430
                                this.match(PartiQLParser.COMMA)
                                this.state = 1431
                                this.valueRow()
                            }
                        }
                    }
                    this.state = 1436
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 177, this.context)
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
        let localContext = new ValueRowContext(this.context, this.state)
        this.enterRule(localContext, 224, PartiQLParser.RULE_valueRow)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1437
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1438
                this.expr()
                this.state = 1443
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1439
                            this.match(PartiQLParser.COMMA)
                            this.state = 1440
                            this.expr()
                        }
                    }
                    this.state = 1445
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1446
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
        let localContext = new ValueListContext(this.context, this.state)
        this.enterRule(localContext, 226, PartiQLParser.RULE_valueList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1448
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1449
                this.expr()
                this.state = 1452
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1450
                            this.match(PartiQLParser.COMMA)
                            this.state = 1451
                            this.expr()
                        }
                    }
                    this.state = 1454
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 270)
                this.state = 1456
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
        let localContext = new SequenceConstructorContext(this.context, this.state)
        this.enterRule(localContext, 228, PartiQLParser.RULE_sequenceConstructor)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1458
                localContext._datatype = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 266 || _la === 267)) {
                    localContext._datatype = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1459
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1468
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
                        this.state = 1460
                        this.expr()
                        this.state = 1465
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1461
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1462
                                    this.expr()
                                }
                            }
                            this.state = 1467
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1470
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
        let localContext = new SubstringContext(this.context, this.state)
        this.enterRule(localContext, 230, PartiQLParser.RULE_substring)
        let _la: number
        try {
            this.state = 1498
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 186, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1472
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1473
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1474
                        this.expr()
                        this.state = 1481
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1475
                                this.match(PartiQLParser.COMMA)
                                this.state = 1476
                                this.expr()
                                this.state = 1479
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 270) {
                                    {
                                        this.state = 1477
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1478
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1483
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1485
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1486
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1487
                        this.expr()
                        this.state = 1494
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 95) {
                            {
                                this.state = 1488
                                this.match(PartiQLParser.FROM)
                                this.state = 1489
                                this.expr()
                                this.state = 1492
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 92) {
                                    {
                                        this.state = 1490
                                        this.match(PartiQLParser.FOR)
                                        this.state = 1491
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1496
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
        let localContext = new PositionContext(this.context, this.state)
        this.enterRule(localContext, 232, PartiQLParser.RULE_position)
        try {
            this.state = 1514
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 187, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1500
                        this.match(PartiQLParser.POSITION)
                        this.state = 1501
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1502
                        this.expr()
                        this.state = 1503
                        this.match(PartiQLParser.COMMA)
                        this.state = 1504
                        this.expr()
                        this.state = 1505
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1507
                        this.match(PartiQLParser.POSITION)
                        this.state = 1508
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1509
                        this.expr()
                        this.state = 1510
                        this.match(PartiQLParser.IN)
                        this.state = 1511
                        this.expr()
                        this.state = 1512
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
        let localContext = new OverlayContext(this.context, this.state)
        this.enterRule(localContext, 234, PartiQLParser.RULE_overlay)
        let _la: number
        try {
            this.state = 1542
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 190, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1516
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1517
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1518
                        this.expr()
                        this.state = 1519
                        this.match(PartiQLParser.COMMA)
                        this.state = 1520
                        this.expr()
                        this.state = 1521
                        this.match(PartiQLParser.COMMA)
                        this.state = 1522
                        this.expr()
                        this.state = 1525
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1523
                                this.match(PartiQLParser.COMMA)
                                this.state = 1524
                                this.expr()
                            }
                        }

                        this.state = 1527
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1529
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1530
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1531
                        this.expr()
                        this.state = 1532
                        this.match(PartiQLParser.PLACING)
                        this.state = 1533
                        this.expr()
                        this.state = 1534
                        this.match(PartiQLParser.FROM)
                        this.state = 1535
                        this.expr()
                        this.state = 1538
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 92) {
                            {
                                this.state = 1536
                                this.match(PartiQLParser.FOR)
                                this.state = 1537
                                this.expr()
                            }
                        }

                        this.state = 1540
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
        this.enterRule(localContext, 236, PartiQLParser.RULE_aggregate)
        let _la: number
        try {
            this.state = 1556
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 192, this.context)) {
                case 1:
                    localContext = new CountAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1544
                        ;(localContext as CountAllContext)._func = this.match(PartiQLParser.COUNT)
                        this.state = 1545
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1546
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 1547
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    localContext = new AggregateBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1548
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
                        this.state = 1549
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1551
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 1550
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 1553
                        this.expr()
                        this.state = 1554
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
        this.enterRule(localContext, 238, PartiQLParser.RULE_windowFunction)
        let _la: number
        try {
            localContext = new LagLeadFunctionContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1558
                ;(localContext as LagLeadFunctionContext)._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 230 || _la === 231)) {
                    ;(localContext as LagLeadFunctionContext)._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1559
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1560
                this.expr()
                this.state = 1567
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 270) {
                    {
                        this.state = 1561
                        this.match(PartiQLParser.COMMA)
                        this.state = 1562
                        this.expr()
                        this.state = 1565
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1563
                                this.match(PartiQLParser.COMMA)
                                this.state = 1564
                                this.expr()
                            }
                        }
                    }
                }

                this.state = 1569
                this.match(PartiQLParser.PAREN_RIGHT)
                this.state = 1570
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
        let localContext = new CastContext(this.context, this.state)
        this.enterRule(localContext, 240, PartiQLParser.RULE_cast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1572
                this.match(PartiQLParser.CAST)
                this.state = 1573
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1574
                this.expr()
                this.state = 1575
                this.match(PartiQLParser.AS)
                this.state = 1576
                this.type_()
                this.state = 1577
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
        let localContext = new CanLosslessCastContext(this.context, this.state)
        this.enterRule(localContext, 242, PartiQLParser.RULE_canLosslessCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1579
                this.match(PartiQLParser.CAN_LOSSLESS_CAST)
                this.state = 1580
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1581
                this.expr()
                this.state = 1582
                this.match(PartiQLParser.AS)
                this.state = 1583
                this.type_()
                this.state = 1584
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
        let localContext = new CanCastContext(this.context, this.state)
        this.enterRule(localContext, 244, PartiQLParser.RULE_canCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1586
                this.match(PartiQLParser.CAN_CAST)
                this.state = 1587
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1588
                this.expr()
                this.state = 1589
                this.match(PartiQLParser.AS)
                this.state = 1590
                this.type_()
                this.state = 1591
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
        let localContext = new ExtractContext(this.context, this.state)
        this.enterRule(localContext, 246, PartiQLParser.RULE_extract)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1593
                this.match(PartiQLParser.EXTRACT)
                this.state = 1594
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1595
                this.match(PartiQLParser.IDENTIFIER)
                this.state = 1596
                this.match(PartiQLParser.FROM)
                this.state = 1597
                localContext._rhs = this.expr()
                this.state = 1598
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
        let localContext = new TrimFunctionContext(this.context, this.state)
        this.enterRule(localContext, 248, PartiQLParser.RULE_trimFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1600
                localContext._func = this.match(PartiQLParser.TRIM)
                this.state = 1601
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1609
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 197, this.context)) {
                    case 1:
                        {
                            this.state = 1603
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 195, this.context)) {
                                case 1:
                                    {
                                        this.state = 1602
                                        localContext._mod = this.match(PartiQLParser.IDENTIFIER)
                                    }
                                    break
                            }
                            this.state = 1606
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
                                    this.state = 1605
                                    localContext._sub = this.expr()
                                }
                            }

                            this.state = 1608
                            this.match(PartiQLParser.FROM)
                        }
                        break
                }
                this.state = 1611
                localContext._target = this.expr()
                this.state = 1612
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
        let localContext = new DateFunctionContext(this.context, this.state)
        this.enterRule(localContext, 250, PartiQLParser.RULE_dateFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1614
                localContext._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 86 || _la === 87)) {
                    localContext._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1615
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1616
                localContext._dt = this.match(PartiQLParser.IDENTIFIER)
                this.state = 1617
                this.match(PartiQLParser.COMMA)
                this.state = 1618
                this.expr()
                this.state = 1619
                this.match(PartiQLParser.COMMA)
                this.state = 1620
                this.expr()
                this.state = 1621
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
        let localContext = new FunctionCallContext(this.context, this.state)
        this.enterRule(localContext, 252, PartiQLParser.RULE_functionCall)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1623
                this.functionName()
                this.state = 1624
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1633
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
                        this.state = 1625
                        this.expr()
                        this.state = 1630
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1626
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1627
                                    this.expr()
                                }
                            }
                            this.state = 1632
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1635
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
        this.enterRule(localContext, 254, PartiQLParser.RULE_functionName)
        let _la: number
        try {
            let alternative: number
            this.state = 1655
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 202, this.context)) {
                case 1:
                    localContext = new FunctionNameReservedContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1642
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 303 || _la === 304) {
                            {
                                {
                                    this.state = 1637
                                    ;(localContext as FunctionNameReservedContext)._symbolPrimitive =
                                        this.symbolPrimitive()
                                    ;(localContext as FunctionNameReservedContext)._qualifier.push(
                                        (localContext as FunctionNameReservedContext)._symbolPrimitive!
                                    )
                                    this.state = 1638
                                    this.match(PartiQLParser.PERIOD)
                                }
                            }
                            this.state = 1644
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 1645
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
                        this.state = 1651
                        this.errorHandler.sync(this)
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)
                        while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                            if (alternative === 1) {
                                {
                                    {
                                        this.state = 1646
                                        ;(localContext as FunctionNameSymbolContext)._symbolPrimitive =
                                            this.symbolPrimitive()
                                        ;(localContext as FunctionNameSymbolContext)._qualifier.push(
                                            (localContext as FunctionNameSymbolContext)._symbolPrimitive!
                                        )
                                        this.state = 1647
                                        this.match(PartiQLParser.PERIOD)
                                    }
                                }
                            }
                            this.state = 1653
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)
                        }
                        this.state = 1654
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
        this.enterRule(localContext, 256, PartiQLParser.RULE_pathStep)
        try {
            this.state = 1668
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 203, this.context)) {
                case 1:
                    localContext = new PathStepIndexExprContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1657
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1658
                        ;(localContext as PathStepIndexExprContext)._key = this.expr()
                        this.state = 1659
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathStepIndexAllContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1661
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1662
                        ;(localContext as PathStepIndexAllContext)._all = this.match(PartiQLParser.ASTERISK)
                        this.state = 1663
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathStepDotExprContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1664
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1665
                        ;(localContext as PathStepDotExprContext)._key = this.symbolPrimitive()
                    }
                    break
                case 4:
                    localContext = new PathStepDotAllContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1666
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1667
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
        let localContext = new ExprGraphMatchManyContext(this.context, this.state)
        this.enterRule(localContext, 258, PartiQLParser.RULE_exprGraphMatchMany)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1670
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1671
                this.exprPrimary(0)
                this.state = 1672
                this.match(PartiQLParser.MATCH)
                this.state = 1673
                this.gpmlPatternList()
                this.state = 1674
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
        let localContext = new ExprGraphMatchOneContext(this.context, this.state)
        this.enterRule(localContext, 260, PartiQLParser.RULE_exprGraphMatchOne)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1676
                this.exprPrimary(0)
                this.state = 1677
                this.match(PartiQLParser.MATCH)
                this.state = 1678
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
        let localContext = new ParameterContext(this.context, this.state)
        this.enterRule(localContext, 262, PartiQLParser.RULE_parameter)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1680
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
        this.enterRule(localContext, 264, PartiQLParser.RULE_varRefExpr)
        let _la: number
        try {
            this.state = 1690
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 206, this.context)) {
                case 1:
                    localContext = new VariableIdentifierContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1683
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1682
                                ;(localContext as VariableIdentifierContext)._qualifier = this.match(
                                    PartiQLParser.AT_SIGN
                                )
                            }
                        }

                        this.state = 1685
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
                        this.state = 1687
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1686
                                ;(localContext as VariableKeywordContext)._qualifier = this.match(PartiQLParser.AT_SIGN)
                            }
                        }

                        this.state = 1689
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
        let localContext = new NonReservedKeywordsContext(this.context, this.state)
        this.enterRule(localContext, 266, PartiQLParser.RULE_nonReservedKeywords)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1692
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
        let localContext = new CollectionContext(this.context, this.state)
        this.enterRule(localContext, 268, PartiQLParser.RULE_collection)
        try {
            this.state = 1696
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1694
                        this.array()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1695
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
        let localContext = new ArrayContext(this.context, this.state)
        this.enterRule(localContext, 270, PartiQLParser.RULE_array)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1698
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1707
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
                        this.state = 1699
                        this.expr()
                        this.state = 1704
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1700
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1701
                                    this.expr()
                                }
                            }
                            this.state = 1706
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1709
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
        let localContext = new BagContext(this.context, this.state)
        this.enterRule(localContext, 272, PartiQLParser.RULE_bag)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1711
                this.match(PartiQLParser.ANGLE_DOUBLE_LEFT)
                this.state = 1720
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
                        this.state = 1712
                        this.expr()
                        this.state = 1717
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1713
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1714
                                    this.expr()
                                }
                            }
                            this.state = 1719
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1722
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
        let localContext = new TupleContext(this.context, this.state)
        this.enterRule(localContext, 274, PartiQLParser.RULE_tuple)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1724
                this.match(PartiQLParser.BRACE_LEFT)
                this.state = 1733
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
                        this.state = 1725
                        this.pair()
                        this.state = 1730
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1726
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1727
                                    this.pair()
                                }
                            }
                            this.state = 1732
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1735
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
        let localContext = new PairContext(this.context, this.state)
        this.enterRule(localContext, 276, PartiQLParser.RULE_pair)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1737
                localContext._lhs = this.expr()
                this.state = 1738
                this.match(PartiQLParser.COLON)
                this.state = 1739
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
        this.enterRule(localContext, 278, PartiQLParser.RULE_literal)
        let _la: number
        try {
            this.state = 1775
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NULL:
                    localContext = new LiteralNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1741
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.MISSING:
                    localContext = new LiteralMissingContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1742
                        this.match(PartiQLParser.MISSING)
                    }
                    break
                case PartiQLParser.TRUE:
                    localContext = new LiteralTrueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1743
                        this.match(PartiQLParser.TRUE)
                    }
                    break
                case PartiQLParser.FALSE:
                    localContext = new LiteralFalseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1744
                        this.match(PartiQLParser.FALSE)
                    }
                    break
                case PartiQLParser.LITERAL_STRING:
                    localContext = new LiteralStringContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1745
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.LITERAL_INTEGER:
                    localContext = new LiteralIntegerContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1746
                        this.match(PartiQLParser.LITERAL_INTEGER)
                    }
                    break
                case PartiQLParser.LITERAL_DECIMAL:
                    localContext = new LiteralDecimalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1747
                        this.match(PartiQLParser.LITERAL_DECIMAL)
                    }
                    break
                case PartiQLParser.ION_CLOSURE:
                    localContext = new LiteralIonContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1748
                        this.match(PartiQLParser.ION_CLOSURE)
                    }
                    break
                case PartiQLParser.DATE:
                    localContext = new LiteralDateContext(localContext)
                    this.enterOuterAlt(localContext, 9)
                    {
                        this.state = 1749
                        this.match(PartiQLParser.DATE)
                        this.state = 1750
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIME:
                    localContext = new LiteralTimeContext(localContext)
                    this.enterOuterAlt(localContext, 10)
                    {
                        this.state = 1751
                        this.match(PartiQLParser.TIME)
                        this.state = 1755
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1752
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1753
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1754
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1760
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1757
                                this.match(PartiQLParser.WITH)
                                this.state = 1758
                                this.match(PartiQLParser.TIME)
                                this.state = 1759
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1762
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIMESTAMP:
                    localContext = new LiteralTimestampContext(localContext)
                    this.enterOuterAlt(localContext, 11)
                    {
                        this.state = 1763
                        this.match(PartiQLParser.TIMESTAMP)
                        this.state = 1767
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1764
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1765
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1766
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1772
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1769
                                this.match(PartiQLParser.WITH)
                                this.state = 1770
                                this.match(PartiQLParser.TIME)
                                this.state = 1771
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1774
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
        this.enterRule(localContext, 280, PartiQLParser.RULE_type)
        let _la: number
        try {
            this.state = 1815
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 225, this.context)) {
                case 1:
                    localContext = new TypeAtomicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1777
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
                        this.state = 1778
                        ;(localContext as TypeAtomicContext)._datatype = this.match(PartiQLParser.DOUBLE)
                        this.state = 1779
                        this.match(PartiQLParser.PRECISION)
                    }
                    break
                case 3:
                    localContext = new TypeArgSingleContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1780
                        ;(localContext as TypeArgSingleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 26 || _la === 27 || _la === 91 || _la === 220)) {
                            ;(localContext as TypeArgSingleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1784
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 219, this.context)) {
                            case 1:
                                {
                                    this.state = 1781
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1782
                                    ;(localContext as TypeArgSingleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1783
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
                        this.state = 1786
                        this.match(PartiQLParser.CHARACTER)
                        this.state = 1787
                        this.match(PartiQLParser.VARYING)
                        this.state = 1791
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 220, this.context)) {
                            case 1:
                                {
                                    this.state = 1788
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1789
                                    ;(localContext as TypeVarCharContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1790
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
                        this.state = 1793
                        ;(localContext as TypeArgDoubleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 55 || _la === 56 || _la === 144)) {
                            ;(localContext as TypeArgDoubleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1801
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 222, this.context)) {
                            case 1:
                                {
                                    this.state = 1794
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1795
                                    ;(localContext as TypeArgDoubleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1798
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    if (_la === 270) {
                                        {
                                            this.state = 1796
                                            this.match(PartiQLParser.COMMA)
                                            this.state = 1797
                                            ;(localContext as TypeArgDoubleContext)._arg1 = this.match(
                                                PartiQLParser.LITERAL_INTEGER
                                            )
                                        }
                                    }

                                    this.state = 1800
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
                        this.state = 1803
                        ;(localContext as TypeTimeZoneContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 201 || _la === 202)) {
                            ;(localContext as TypeTimeZoneContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1807
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 223, this.context)) {
                            case 1:
                                {
                                    this.state = 1804
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1805
                                    ;(localContext as TypeTimeZoneContext)._precision = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1806
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                        this.state = 1812
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 224, this.context)) {
                            case 1:
                                {
                                    this.state = 1809
                                    this.match(PartiQLParser.WITH)
                                    this.state = 1810
                                    this.match(PartiQLParser.TIME)
                                    this.state = 1811
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
                        this.state = 1814
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
            case 83:
                return this.labelSpec_sempred(localContext as LabelSpecContext, predIndex)
            case 84:
                return this.labelTerm_sempred(localContext as LabelTermContext, predIndex)
            case 88:
                return this.tableReference_sempred(localContext as TableReferenceContext, predIndex)
            case 96:
                return this.exprBagOp_sempred(localContext as ExprBagOpContext, predIndex)
            case 98:
                return this.exprOr_sempred(localContext as ExprOrContext, predIndex)
            case 99:
                return this.exprAnd_sempred(localContext as ExprAndContext, predIndex)
            case 101:
                return this.exprPredicate_sempred(localContext as ExprPredicateContext, predIndex)
            case 102:
                return this.mathOp00_sempred(localContext as MathOp00Context, predIndex)
            case 103:
                return this.mathOp01_sempred(localContext as MathOp01Context, predIndex)
            case 104:
                return this.mathOp02_sempred(localContext as MathOp02Context, predIndex)
            case 106:
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
        4, 1, 310, 1818, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7,
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
        138, 2, 139, 7, 139, 2, 140, 7, 140, 1, 0, 1, 0, 3, 0, 285, 8, 0, 4, 0, 287, 8, 0, 11, 0, 12, 0, 288, 1, 0, 1,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 298, 8, 1, 10, 1, 12, 1, 301, 9, 1, 1, 1, 1, 1, 3, 1, 305, 8, 1, 3, 1,
        307, 8, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 315, 8, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5,
        1, 5, 1, 6, 1, 6, 1, 6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 5, 9, 338, 8, 9, 10, 9, 12, 9,
        341, 9, 9, 3, 9, 343, 8, 9, 1, 10, 1, 10, 1, 10, 5, 10, 348, 8, 10, 10, 10, 12, 10, 351, 9, 10, 1, 10, 1, 10, 1,
        11, 1, 11, 1, 12, 1, 12, 1, 13, 1, 13, 1, 14, 1, 14, 1, 15, 1, 15, 3, 15, 365, 8, 15, 1, 16, 1, 16, 1, 16, 1,
        16, 1, 16, 1, 16, 1, 16, 3, 16, 374, 8, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 5, 16, 384,
        8, 16, 10, 16, 12, 16, 387, 9, 16, 1, 16, 1, 16, 3, 16, 391, 8, 16, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1, 17, 1,
        17, 1, 17, 1, 17, 3, 17, 402, 8, 17, 1, 18, 1, 18, 1, 18, 5, 18, 407, 8, 18, 10, 18, 12, 18, 410, 9, 18, 1, 19,
        1, 19, 1, 19, 5, 19, 415, 8, 19, 10, 19, 12, 19, 418, 9, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19,
        426, 8, 19, 1, 20, 1, 20, 1, 20, 5, 20, 431, 8, 20, 10, 20, 12, 20, 434, 9, 20, 1, 21, 1, 21, 3, 21, 438, 8, 21,
        1, 21, 1, 21, 1, 22, 1, 22, 1, 22, 3, 22, 445, 8, 22, 1, 23, 1, 23, 4, 23, 449, 8, 23, 11, 23, 12, 23, 450, 1,
        23, 3, 23, 454, 8, 23, 1, 23, 3, 23, 457, 8, 23, 1, 23, 1, 23, 3, 23, 461, 8, 23, 1, 23, 4, 23, 464, 8, 23, 11,
        23, 12, 23, 465, 1, 23, 3, 23, 469, 8, 23, 1, 23, 1, 23, 1, 23, 3, 23, 474, 8, 23, 1, 24, 1, 24, 1, 24, 1, 24,
        1, 24, 1, 24, 3, 24, 482, 8, 24, 1, 25, 1, 25, 5, 25, 486, 8, 25, 10, 25, 12, 25, 489, 9, 25, 1, 26, 1, 26, 1,
        26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 501, 8, 26, 1, 27, 1, 27, 1, 27, 1, 27, 3, 27, 507,
        8, 27, 1, 27, 1, 27, 1, 28, 1, 28, 1, 28, 1, 28, 3, 28, 515, 8, 28, 1, 28, 1, 28, 1, 29, 1, 29, 1, 29, 1, 30, 1,
        30, 1, 30, 1, 30, 1, 30, 1, 30, 1, 30, 3, 30, 529, 8, 30, 1, 30, 3, 30, 532, 8, 30, 1, 30, 3, 30, 535, 8, 30, 1,
        31, 1, 31, 1, 31, 1, 31, 3, 31, 541, 8, 31, 1, 31, 1, 31, 3, 31, 545, 8, 31, 1, 32, 1, 32, 1, 32, 3, 32, 550, 8,
        32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 3, 33, 561, 8, 33, 1, 33, 3, 33, 564, 8, 33,
        1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 1, 35, 5, 35, 577, 8, 35, 10, 35, 12, 35,
        580, 9, 35, 1, 35, 1, 35, 1, 35, 1, 35, 1, 35, 3, 35, 587, 8, 35, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1,
        37, 1, 37, 1, 37, 1, 37, 3, 37, 599, 8, 37, 1, 38, 1, 38, 1, 38, 3, 38, 604, 8, 38, 1, 39, 1, 39, 1, 39, 3, 39,
        609, 8, 39, 1, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 1, 41, 5, 41, 618, 8, 41, 10, 41, 12, 41, 621, 9, 41, 1,
        42, 1, 42, 1, 42, 1, 42, 1, 43, 1, 43, 1, 43, 3, 43, 630, 8, 43, 1, 43, 3, 43, 633, 8, 43, 1, 44, 1, 44, 1, 44,
        1, 44, 5, 44, 639, 8, 44, 10, 44, 12, 44, 642, 9, 44, 1, 45, 1, 45, 1, 45, 1, 45, 1, 45, 1, 45, 3, 45, 650, 8,
        45, 1, 46, 1, 46, 1, 46, 3, 46, 655, 8, 46, 1, 46, 3, 46, 658, 8, 46, 1, 46, 3, 46, 661, 8, 46, 1, 46, 1, 46, 1,
        46, 1, 46, 3, 46, 667, 8, 46, 1, 47, 1, 47, 1, 47, 1, 48, 1, 48, 3, 48, 674, 8, 48, 1, 48, 1, 48, 1, 48, 3, 48,
        679, 8, 48, 1, 48, 1, 48, 1, 48, 3, 48, 684, 8, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 1, 48, 3, 48, 693,
        8, 48, 1, 49, 1, 49, 1, 49, 5, 49, 698, 8, 49, 10, 49, 12, 49, 701, 9, 49, 1, 50, 1, 50, 3, 50, 705, 8, 50, 1,
        50, 3, 50, 708, 8, 50, 1, 51, 1, 51, 1, 52, 1, 52, 1, 52, 1, 52, 5, 52, 716, 8, 52, 10, 52, 12, 52, 719, 9, 52,
        1, 53, 1, 53, 1, 53, 1, 53, 1, 54, 1, 54, 1, 54, 1, 54, 1, 54, 5, 54, 730, 8, 54, 10, 54, 12, 54, 733, 9, 54, 1,
        55, 1, 55, 3, 55, 737, 8, 55, 1, 55, 1, 55, 3, 55, 741, 8, 55, 1, 56, 1, 56, 3, 56, 745, 8, 56, 1, 56, 1, 56, 1,
        56, 1, 56, 5, 56, 751, 8, 56, 10, 56, 12, 56, 754, 9, 56, 1, 56, 3, 56, 757, 8, 56, 1, 57, 1, 57, 1, 57, 1, 57,
        1, 58, 1, 58, 1, 58, 3, 58, 766, 8, 58, 1, 59, 1, 59, 1, 59, 3, 59, 771, 8, 59, 1, 59, 3, 59, 774, 8, 59, 1, 59,
        1, 59, 1, 60, 1, 60, 1, 60, 1, 60, 1, 60, 5, 60, 783, 8, 60, 10, 60, 12, 60, 786, 9, 60, 1, 61, 1, 61, 1, 61, 1,
        61, 1, 61, 5, 61, 793, 8, 61, 10, 61, 12, 61, 796, 9, 61, 1, 62, 1, 62, 1, 62, 1, 63, 1, 63, 1, 63, 1, 63, 5,
        63, 805, 8, 63, 10, 63, 12, 63, 808, 9, 63, 1, 64, 1, 64, 4, 64, 812, 8, 64, 11, 64, 12, 64, 813, 1, 65, 1, 65,
        1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 1, 65, 3, 65, 829, 8, 65, 1, 66, 1, 66, 1,
        66, 1, 67, 1, 67, 1, 67, 1, 68, 1, 68, 1, 68, 1, 69, 1, 69, 1, 69, 1, 70, 3, 70, 844, 8, 70, 1, 70, 1, 70, 1,
        71, 3, 71, 849, 8, 71, 1, 71, 1, 71, 1, 71, 5, 71, 854, 8, 71, 10, 71, 12, 71, 857, 9, 71, 1, 72, 3, 72, 860, 8,
        72, 1, 72, 3, 72, 863, 8, 72, 1, 72, 5, 72, 866, 8, 72, 10, 72, 12, 72, 869, 9, 72, 1, 73, 1, 73, 1, 73, 3, 73,
        874, 8, 73, 1, 74, 1, 74, 1, 74, 1, 74, 3, 74, 880, 8, 74, 1, 74, 1, 74, 1, 74, 3, 74, 885, 8, 74, 3, 74, 887,
        8, 74, 1, 75, 1, 75, 1, 75, 1, 76, 1, 76, 1, 77, 1, 77, 3, 77, 896, 8, 77, 1, 77, 1, 77, 3, 77, 900, 8, 77, 1,
        77, 3, 77, 903, 8, 77, 1, 77, 1, 77, 1, 78, 1, 78, 3, 78, 909, 8, 78, 1, 78, 1, 78, 3, 78, 913, 8, 78, 3, 78,
        915, 8, 78, 1, 79, 1, 79, 3, 79, 919, 8, 79, 1, 79, 3, 79, 922, 8, 79, 1, 79, 4, 79, 925, 8, 79, 11, 79, 12, 79,
        926, 1, 79, 3, 79, 930, 8, 79, 1, 79, 1, 79, 3, 79, 934, 8, 79, 1, 79, 1, 79, 3, 79, 938, 8, 79, 1, 79, 3, 79,
        941, 8, 79, 1, 79, 4, 79, 944, 8, 79, 11, 79, 12, 79, 945, 1, 79, 3, 79, 949, 8, 79, 1, 79, 1, 79, 3, 79, 953,
        8, 79, 3, 79, 955, 8, 79, 1, 80, 1, 80, 1, 80, 1, 80, 1, 80, 3, 80, 962, 8, 80, 1, 80, 3, 80, 965, 8, 80, 1, 81,
        1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81,
        1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81,
        1, 81, 3, 81, 1001, 8, 81, 1, 82, 1, 82, 3, 82, 1005, 8, 82, 1, 82, 1, 82, 3, 82, 1009, 8, 82, 1, 82, 3, 82,
        1012, 8, 82, 1, 82, 1, 82, 1, 83, 1, 83, 1, 83, 1, 83, 1, 83, 1, 83, 5, 83, 1022, 8, 83, 10, 83, 12, 83, 1025,
        9, 83, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 5, 84, 1033, 8, 84, 10, 84, 12, 84, 1036, 9, 84, 1, 85, 1, 85,
        1, 85, 3, 85, 1041, 8, 85, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 3, 86, 1049, 8, 86, 1, 87, 1, 87, 1, 87, 1,
        87, 1, 87, 1, 87, 3, 87, 1057, 8, 87, 1, 87, 1, 87, 3, 87, 1061, 8, 87, 3, 87, 1063, 8, 87, 1, 88, 1, 88, 1, 88,
        1, 88, 1, 88, 1, 88, 3, 88, 1071, 8, 88, 1, 88, 1, 88, 3, 88, 1075, 8, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1,
        88, 1, 88, 1, 88, 3, 88, 1085, 8, 88, 1, 88, 1, 88, 1, 88, 1, 88, 5, 88, 1091, 8, 88, 10, 88, 12, 88, 1094, 9,
        88, 1, 89, 1, 89, 3, 89, 1098, 8, 89, 1, 90, 1, 90, 1, 90, 1, 90, 1, 90, 3, 90, 1105, 8, 90, 1, 90, 3, 90, 1108,
        8, 90, 1, 90, 3, 90, 1111, 8, 90, 1, 90, 1, 90, 3, 90, 1115, 8, 90, 1, 90, 3, 90, 1118, 8, 90, 1, 90, 3, 90,
        1121, 8, 90, 3, 90, 1123, 8, 90, 1, 91, 1, 91, 1, 91, 3, 91, 1128, 8, 91, 1, 91, 3, 91, 1131, 8, 91, 1, 91, 3,
        91, 1134, 8, 91, 1, 92, 1, 92, 1, 92, 1, 92, 1, 92, 3, 92, 1141, 8, 92, 1, 93, 1, 93, 1, 93, 1, 94, 1, 94, 1,
        94, 3, 94, 1149, 8, 94, 1, 94, 1, 94, 3, 94, 1153, 8, 94, 1, 94, 1, 94, 3, 94, 1157, 8, 94, 1, 94, 3, 94, 1160,
        8, 94, 1, 95, 1, 95, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 3, 96, 1169, 8, 96, 1, 96, 1, 96, 3, 96, 1173, 8, 96, 1,
        96, 1, 96, 1, 96, 3, 96, 1178, 8, 96, 1, 96, 1, 96, 3, 96, 1182, 8, 96, 1, 96, 1, 96, 1, 96, 3, 96, 1187, 8, 96,
        1, 96, 1, 96, 3, 96, 1191, 8, 96, 1, 96, 5, 96, 1194, 8, 96, 10, 96, 12, 96, 1197, 9, 96, 1, 97, 1, 97, 3, 97,
        1201, 8, 97, 1, 97, 1, 97, 3, 97, 1205, 8, 97, 1, 97, 3, 97, 1208, 8, 97, 1, 97, 3, 97, 1211, 8, 97, 1, 97, 3,
        97, 1214, 8, 97, 1, 97, 3, 97, 1217, 8, 97, 1, 97, 3, 97, 1220, 8, 97, 1, 97, 3, 97, 1223, 8, 97, 1, 97, 3, 97,
        1226, 8, 97, 1, 98, 1, 98, 1, 98, 1, 98, 1, 98, 1, 98, 5, 98, 1234, 8, 98, 10, 98, 12, 98, 1237, 9, 98, 1, 99,
        1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 5, 99, 1245, 8, 99, 10, 99, 12, 99, 1248, 9, 99, 1, 100, 1, 100, 1, 100, 3,
        100, 1253, 8, 100, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 3, 101, 1264, 8, 101,
        1, 101, 1, 101, 1, 101, 3, 101, 1269, 8, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 3, 101,
        1278, 8, 101, 1, 101, 1, 101, 1, 101, 1, 101, 3, 101, 1284, 8, 101, 1, 101, 1, 101, 1, 101, 1, 101, 3, 101,
        1290, 8, 101, 1, 101, 1, 101, 3, 101, 1294, 8, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 5, 101, 1301, 8,
        101, 10, 101, 12, 101, 1304, 9, 101, 1, 102, 1, 102, 1, 102, 1, 102, 1, 102, 1, 102, 5, 102, 1312, 8, 102, 10,
        102, 12, 102, 1315, 9, 102, 1, 103, 1, 103, 1, 103, 1, 103, 1, 103, 1, 103, 5, 103, 1323, 8, 103, 10, 103, 12,
        103, 1326, 9, 103, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 5, 104, 1334, 8, 104, 10, 104, 12, 104, 1337,
        9, 104, 1, 105, 1, 105, 1, 105, 3, 105, 1342, 8, 105, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1,
        106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 3,
        106, 1365, 8, 106, 1, 106, 1, 106, 4, 106, 1369, 8, 106, 11, 106, 12, 106, 1370, 5, 106, 1373, 8, 106, 10, 106,
        12, 106, 1376, 9, 106, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107,
        3, 107, 1389, 8, 107, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 109, 1, 109, 1, 109, 1, 109, 1,
        109, 5, 109, 1403, 8, 109, 10, 109, 12, 109, 1406, 9, 109, 1, 109, 1, 109, 1, 110, 1, 110, 3, 110, 1412, 8, 110,
        1, 110, 1, 110, 1, 110, 1, 110, 1, 110, 4, 110, 1419, 8, 110, 11, 110, 12, 110, 1420, 1, 110, 1, 110, 3, 110,
        1425, 8, 110, 1, 110, 1, 110, 1, 111, 1, 111, 1, 111, 1, 111, 5, 111, 1433, 8, 111, 10, 111, 12, 111, 1436, 9,
        111, 1, 112, 1, 112, 1, 112, 1, 112, 5, 112, 1442, 8, 112, 10, 112, 12, 112, 1445, 9, 112, 1, 112, 1, 112, 1,
        113, 1, 113, 1, 113, 1, 113, 4, 113, 1453, 8, 113, 11, 113, 12, 113, 1454, 1, 113, 1, 113, 1, 114, 1, 114, 1,
        114, 1, 114, 1, 114, 5, 114, 1464, 8, 114, 10, 114, 12, 114, 1467, 9, 114, 3, 114, 1469, 8, 114, 1, 114, 1, 114,
        1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 3, 115, 1480, 8, 115, 3, 115, 1482, 8, 115, 1, 115, 1,
        115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 3, 115, 1493, 8, 115, 3, 115, 1495, 8, 115, 1, 115,
        1, 115, 3, 115, 1499, 8, 115, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1,
        116, 1, 116, 1, 116, 1, 116, 3, 116, 1515, 8, 116, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1,
        117, 1, 117, 3, 117, 1526, 8, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1,
        117, 1, 117, 3, 117, 1539, 8, 117, 1, 117, 1, 117, 3, 117, 1543, 8, 117, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118,
        1, 118, 1, 118, 3, 118, 1552, 8, 118, 1, 118, 1, 118, 1, 118, 3, 118, 1557, 8, 118, 1, 119, 1, 119, 1, 119, 1,
        119, 1, 119, 1, 119, 1, 119, 3, 119, 1566, 8, 119, 3, 119, 1568, 8, 119, 1, 119, 1, 119, 1, 119, 1, 120, 1, 120,
        1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 1, 122, 1, 122,
        1, 122, 1, 122, 1, 122, 1, 122, 1, 122, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 124, 1, 124,
        1, 124, 3, 124, 1604, 8, 124, 1, 124, 3, 124, 1607, 8, 124, 1, 124, 3, 124, 1610, 8, 124, 1, 124, 1, 124, 1,
        124, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 126, 1, 126, 1, 126, 1, 126, 1,
        126, 5, 126, 1629, 8, 126, 10, 126, 12, 126, 1632, 9, 126, 3, 126, 1634, 8, 126, 1, 126, 1, 126, 1, 127, 1, 127,
        1, 127, 5, 127, 1641, 8, 127, 10, 127, 12, 127, 1644, 9, 127, 1, 127, 1, 127, 1, 127, 1, 127, 5, 127, 1650, 8,
        127, 10, 127, 12, 127, 1653, 9, 127, 1, 127, 3, 127, 1656, 8, 127, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1,
        128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 3, 128, 1669, 8, 128, 1, 129, 1, 129, 1, 129, 1, 129, 1, 129, 1,
        129, 1, 130, 1, 130, 1, 130, 1, 130, 1, 131, 1, 131, 1, 132, 3, 132, 1684, 8, 132, 1, 132, 1, 132, 3, 132, 1688,
        8, 132, 1, 132, 3, 132, 1691, 8, 132, 1, 133, 1, 133, 1, 134, 1, 134, 3, 134, 1697, 8, 134, 1, 135, 1, 135, 1,
        135, 1, 135, 5, 135, 1703, 8, 135, 10, 135, 12, 135, 1706, 9, 135, 3, 135, 1708, 8, 135, 1, 135, 1, 135, 1, 136,
        1, 136, 1, 136, 1, 136, 5, 136, 1716, 8, 136, 10, 136, 12, 136, 1719, 9, 136, 3, 136, 1721, 8, 136, 1, 136, 1,
        136, 1, 137, 1, 137, 1, 137, 1, 137, 5, 137, 1729, 8, 137, 10, 137, 12, 137, 1732, 9, 137, 3, 137, 1734, 8, 137,
        1, 137, 1, 137, 1, 138, 1, 138, 1, 138, 1, 138, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139,
        1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1756, 8, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1761, 8,
        139, 1, 139, 1, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1768, 8, 139, 1, 139, 1, 139, 1, 139, 3, 139, 1773, 8, 139,
        1, 139, 3, 139, 1776, 8, 139, 1, 140, 1, 140, 1, 140, 1, 140, 1, 140, 1, 140, 1, 140, 3, 140, 1785, 8, 140, 1,
        140, 1, 140, 1, 140, 1, 140, 1, 140, 3, 140, 1792, 8, 140, 1, 140, 1, 140, 1, 140, 1, 140, 1, 140, 3, 140, 1799,
        8, 140, 1, 140, 3, 140, 1802, 8, 140, 1, 140, 1, 140, 1, 140, 1, 140, 3, 140, 1808, 8, 140, 1, 140, 1, 140, 1,
        140, 3, 140, 1813, 8, 140, 1, 140, 3, 140, 1816, 8, 140, 1, 140, 0, 11, 166, 168, 176, 192, 196, 198, 202, 204,
        206, 208, 212, 141, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46,
        48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100,
        102, 104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144,
        146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188,
        190, 192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222, 224, 226, 228, 230, 232,
        234, 236, 238, 240, 242, 244, 246, 248, 250, 252, 254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276,
        278, 280, 0, 21, 1, 0, 303, 304, 2, 0, 4, 4, 247, 247, 1, 0, 248, 249, 2, 0, 4, 4, 67, 67, 2, 0, 11, 11, 62, 62,
        2, 0, 90, 90, 123, 123, 2, 0, 4, 4, 8, 8, 2, 0, 271, 271, 277, 277, 2, 0, 281, 284, 286, 287, 2, 0, 279, 279,
        285, 285, 1, 0, 271, 272, 2, 0, 273, 274, 277, 277, 1, 0, 266, 267, 7, 0, 8, 8, 15, 15, 44, 44, 75, 75, 131,
        132, 189, 189, 196, 196, 1, 0, 230, 231, 1, 0, 86, 87, 8, 0, 19, 19, 28, 29, 44, 44, 82, 82, 129, 129, 145, 145,
        187, 187, 213, 213, 9, 0, 8, 8, 26, 27, 53, 53, 113, 114, 141, 141, 170, 170, 188, 188, 236, 236, 251, 268, 3,
        0, 26, 27, 91, 91, 220, 220, 2, 0, 55, 56, 144, 144, 1, 0, 201, 202, 1978, 0, 286, 1, 0, 0, 0, 2, 306, 1, 0, 0,
        0, 4, 314, 1, 0, 0, 0, 6, 316, 1, 0, 0, 0, 8, 319, 1, 0, 0, 0, 10, 322, 1, 0, 0, 0, 12, 325, 1, 0, 0, 0, 14,
        328, 1, 0, 0, 0, 16, 330, 1, 0, 0, 0, 18, 332, 1, 0, 0, 0, 20, 349, 1, 0, 0, 0, 22, 354, 1, 0, 0, 0, 24, 356, 1,
        0, 0, 0, 26, 358, 1, 0, 0, 0, 28, 360, 1, 0, 0, 0, 30, 364, 1, 0, 0, 0, 32, 390, 1, 0, 0, 0, 34, 401, 1, 0, 0,
        0, 36, 403, 1, 0, 0, 0, 38, 425, 1, 0, 0, 0, 40, 427, 1, 0, 0, 0, 42, 437, 1, 0, 0, 0, 44, 444, 1, 0, 0, 0, 46,
        473, 1, 0, 0, 0, 48, 481, 1, 0, 0, 0, 50, 483, 1, 0, 0, 0, 52, 500, 1, 0, 0, 0, 54, 502, 1, 0, 0, 0, 56, 510, 1,
        0, 0, 0, 58, 518, 1, 0, 0, 0, 60, 521, 1, 0, 0, 0, 62, 536, 1, 0, 0, 0, 64, 546, 1, 0, 0, 0, 66, 553, 1, 0, 0,
        0, 68, 565, 1, 0, 0, 0, 70, 586, 1, 0, 0, 0, 72, 588, 1, 0, 0, 0, 74, 598, 1, 0, 0, 0, 76, 600, 1, 0, 0, 0, 78,
        605, 1, 0, 0, 0, 80, 610, 1, 0, 0, 0, 82, 613, 1, 0, 0, 0, 84, 622, 1, 0, 0, 0, 86, 626, 1, 0, 0, 0, 88, 634, 1,
        0, 0, 0, 90, 649, 1, 0, 0, 0, 92, 666, 1, 0, 0, 0, 94, 668, 1, 0, 0, 0, 96, 692, 1, 0, 0, 0, 98, 694, 1, 0, 0,
        0, 100, 702, 1, 0, 0, 0, 102, 709, 1, 0, 0, 0, 104, 711, 1, 0, 0, 0, 106, 720, 1, 0, 0, 0, 108, 724, 1, 0, 0, 0,
        110, 734, 1, 0, 0, 0, 112, 742, 1, 0, 0, 0, 114, 758, 1, 0, 0, 0, 116, 762, 1, 0, 0, 0, 118, 767, 1, 0, 0, 0,
        120, 777, 1, 0, 0, 0, 122, 787, 1, 0, 0, 0, 124, 797, 1, 0, 0, 0, 126, 800, 1, 0, 0, 0, 128, 809, 1, 0, 0, 0,
        130, 828, 1, 0, 0, 0, 132, 830, 1, 0, 0, 0, 134, 833, 1, 0, 0, 0, 136, 836, 1, 0, 0, 0, 138, 839, 1, 0, 0, 0,
        140, 843, 1, 0, 0, 0, 142, 848, 1, 0, 0, 0, 144, 859, 1, 0, 0, 0, 146, 873, 1, 0, 0, 0, 148, 886, 1, 0, 0, 0,
        150, 888, 1, 0, 0, 0, 152, 891, 1, 0, 0, 0, 154, 893, 1, 0, 0, 0, 156, 914, 1, 0, 0, 0, 158, 954, 1, 0, 0, 0,
        160, 964, 1, 0, 0, 0, 162, 1000, 1, 0, 0, 0, 164, 1002, 1, 0, 0, 0, 166, 1015, 1, 0, 0, 0, 168, 1026, 1, 0, 0,
        0, 170, 1040, 1, 0, 0, 0, 172, 1048, 1, 0, 0, 0, 174, 1062, 1, 0, 0, 0, 176, 1070, 1, 0, 0, 0, 178, 1097, 1, 0,
        0, 0, 180, 1122, 1, 0, 0, 0, 182, 1124, 1, 0, 0, 0, 184, 1140, 1, 0, 0, 0, 186, 1142, 1, 0, 0, 0, 188, 1159, 1,
        0, 0, 0, 190, 1161, 1, 0, 0, 0, 192, 1163, 1, 0, 0, 0, 194, 1225, 1, 0, 0, 0, 196, 1227, 1, 0, 0, 0, 198, 1238,
        1, 0, 0, 0, 200, 1252, 1, 0, 0, 0, 202, 1254, 1, 0, 0, 0, 204, 1305, 1, 0, 0, 0, 206, 1316, 1, 0, 0, 0, 208,
        1327, 1, 0, 0, 0, 210, 1341, 1, 0, 0, 0, 212, 1364, 1, 0, 0, 0, 214, 1388, 1, 0, 0, 0, 216, 1390, 1, 0, 0, 0,
        218, 1397, 1, 0, 0, 0, 220, 1409, 1, 0, 0, 0, 222, 1428, 1, 0, 0, 0, 224, 1437, 1, 0, 0, 0, 226, 1448, 1, 0, 0,
        0, 228, 1458, 1, 0, 0, 0, 230, 1498, 1, 0, 0, 0, 232, 1514, 1, 0, 0, 0, 234, 1542, 1, 0, 0, 0, 236, 1556, 1, 0,
        0, 0, 238, 1558, 1, 0, 0, 0, 240, 1572, 1, 0, 0, 0, 242, 1579, 1, 0, 0, 0, 244, 1586, 1, 0, 0, 0, 246, 1593, 1,
        0, 0, 0, 248, 1600, 1, 0, 0, 0, 250, 1614, 1, 0, 0, 0, 252, 1623, 1, 0, 0, 0, 254, 1655, 1, 0, 0, 0, 256, 1668,
        1, 0, 0, 0, 258, 1670, 1, 0, 0, 0, 260, 1676, 1, 0, 0, 0, 262, 1680, 1, 0, 0, 0, 264, 1690, 1, 0, 0, 0, 266,
        1692, 1, 0, 0, 0, 268, 1696, 1, 0, 0, 0, 270, 1698, 1, 0, 0, 0, 272, 1711, 1, 0, 0, 0, 274, 1724, 1, 0, 0, 0,
        276, 1737, 1, 0, 0, 0, 278, 1775, 1, 0, 0, 0, 280, 1815, 1, 0, 0, 0, 282, 284, 3, 2, 1, 0, 283, 285, 5, 297, 0,
        0, 284, 283, 1, 0, 0, 0, 284, 285, 1, 0, 0, 0, 285, 287, 1, 0, 0, 0, 286, 282, 1, 0, 0, 0, 287, 288, 1, 0, 0, 0,
        288, 286, 1, 0, 0, 0, 288, 289, 1, 0, 0, 0, 289, 290, 1, 0, 0, 0, 290, 291, 5, 0, 0, 1, 291, 1, 1, 0, 0, 0, 292,
        304, 5, 83, 0, 0, 293, 294, 5, 294, 0, 0, 294, 299, 3, 6, 3, 0, 295, 296, 5, 270, 0, 0, 296, 298, 3, 6, 3, 0,
        297, 295, 1, 0, 0, 0, 298, 301, 1, 0, 0, 0, 299, 297, 1, 0, 0, 0, 299, 300, 1, 0, 0, 0, 300, 302, 1, 0, 0, 0,
        301, 299, 1, 0, 0, 0, 302, 303, 5, 295, 0, 0, 303, 305, 1, 0, 0, 0, 304, 293, 1, 0, 0, 0, 304, 305, 1, 0, 0, 0,
        305, 307, 1, 0, 0, 0, 306, 292, 1, 0, 0, 0, 306, 307, 1, 0, 0, 0, 307, 308, 1, 0, 0, 0, 308, 309, 3, 4, 2, 0,
        309, 3, 1, 0, 0, 0, 310, 315, 3, 16, 8, 0, 311, 315, 3, 46, 23, 0, 312, 315, 3, 30, 15, 0, 313, 315, 3, 18, 9,
        0, 314, 310, 1, 0, 0, 0, 314, 311, 1, 0, 0, 0, 314, 312, 1, 0, 0, 0, 314, 313, 1, 0, 0, 0, 315, 5, 1, 0, 0, 0,
        316, 317, 5, 303, 0, 0, 317, 318, 5, 303, 0, 0, 318, 7, 1, 0, 0, 0, 319, 320, 5, 10, 0, 0, 320, 321, 3, 14, 7,
        0, 321, 9, 1, 0, 0, 0, 322, 323, 5, 13, 0, 0, 323, 324, 3, 14, 7, 0, 324, 11, 1, 0, 0, 0, 325, 326, 5, 20, 0, 0,
        326, 327, 3, 14, 7, 0, 327, 13, 1, 0, 0, 0, 328, 329, 7, 0, 0, 0, 329, 15, 1, 0, 0, 0, 330, 331, 3, 190, 95, 0,
        331, 17, 1, 0, 0, 0, 332, 333, 5, 80, 0, 0, 333, 342, 3, 190, 95, 0, 334, 339, 3, 190, 95, 0, 335, 336, 5, 270,
        0, 0, 336, 338, 3, 190, 95, 0, 337, 335, 1, 0, 0, 0, 338, 341, 1, 0, 0, 0, 339, 337, 1, 0, 0, 0, 339, 340, 1, 0,
        0, 0, 340, 343, 1, 0, 0, 0, 341, 339, 1, 0, 0, 0, 342, 334, 1, 0, 0, 0, 342, 343, 1, 0, 0, 0, 343, 19, 1, 0, 0,
        0, 344, 345, 3, 14, 7, 0, 345, 346, 5, 299, 0, 0, 346, 348, 1, 0, 0, 0, 347, 344, 1, 0, 0, 0, 348, 351, 1, 0, 0,
        0, 349, 347, 1, 0, 0, 0, 349, 350, 1, 0, 0, 0, 350, 352, 1, 0, 0, 0, 351, 349, 1, 0, 0, 0, 352, 353, 3, 14, 7,
        0, 353, 21, 1, 0, 0, 0, 354, 355, 3, 14, 7, 0, 355, 23, 1, 0, 0, 0, 356, 357, 3, 14, 7, 0, 357, 25, 1, 0, 0, 0,
        358, 359, 3, 14, 7, 0, 359, 27, 1, 0, 0, 0, 360, 361, 3, 14, 7, 0, 361, 29, 1, 0, 0, 0, 362, 365, 3, 32, 16, 0,
        363, 365, 3, 34, 17, 0, 364, 362, 1, 0, 0, 0, 364, 363, 1, 0, 0, 0, 365, 31, 1, 0, 0, 0, 366, 367, 5, 45, 0, 0,
        367, 368, 5, 198, 0, 0, 368, 373, 3, 20, 10, 0, 369, 370, 5, 294, 0, 0, 370, 371, 3, 36, 18, 0, 371, 372, 5,
        295, 0, 0, 372, 374, 1, 0, 0, 0, 373, 369, 1, 0, 0, 0, 373, 374, 1, 0, 0, 0, 374, 391, 1, 0, 0, 0, 375, 376, 5,
        45, 0, 0, 376, 377, 5, 242, 0, 0, 377, 378, 5, 147, 0, 0, 378, 379, 3, 14, 7, 0, 379, 380, 5, 294, 0, 0, 380,
        385, 3, 50, 25, 0, 381, 382, 5, 270, 0, 0, 382, 384, 3, 50, 25, 0, 383, 381, 1, 0, 0, 0, 384, 387, 1, 0, 0, 0,
        385, 383, 1, 0, 0, 0, 385, 386, 1, 0, 0, 0, 386, 388, 1, 0, 0, 0, 387, 385, 1, 0, 0, 0, 388, 389, 5, 295, 0, 0,
        389, 391, 1, 0, 0, 0, 390, 366, 1, 0, 0, 0, 390, 375, 1, 0, 0, 0, 391, 33, 1, 0, 0, 0, 392, 393, 5, 70, 0, 0,
        393, 394, 5, 198, 0, 0, 394, 402, 3, 20, 10, 0, 395, 396, 5, 70, 0, 0, 396, 397, 5, 242, 0, 0, 397, 398, 3, 14,
        7, 0, 398, 399, 5, 147, 0, 0, 399, 400, 3, 14, 7, 0, 400, 402, 1, 0, 0, 0, 401, 392, 1, 0, 0, 0, 401, 395, 1, 0,
        0, 0, 402, 35, 1, 0, 0, 0, 403, 408, 3, 38, 19, 0, 404, 405, 5, 270, 0, 0, 405, 407, 3, 38, 19, 0, 406, 404, 1,
        0, 0, 0, 407, 410, 1, 0, 0, 0, 408, 406, 1, 0, 0, 0, 408, 409, 1, 0, 0, 0, 409, 37, 1, 0, 0, 0, 410, 408, 1, 0,
        0, 0, 411, 412, 3, 26, 13, 0, 412, 416, 3, 280, 140, 0, 413, 415, 3, 42, 21, 0, 414, 413, 1, 0, 0, 0, 415, 418,
        1, 0, 0, 0, 416, 414, 1, 0, 0, 0, 416, 417, 1, 0, 0, 0, 417, 426, 1, 0, 0, 0, 418, 416, 1, 0, 0, 0, 419, 420, 5,
        164, 0, 0, 420, 421, 5, 121, 0, 0, 421, 422, 5, 294, 0, 0, 422, 423, 3, 40, 20, 0, 423, 424, 5, 295, 0, 0, 424,
        426, 1, 0, 0, 0, 425, 411, 1, 0, 0, 0, 425, 419, 1, 0, 0, 0, 426, 39, 1, 0, 0, 0, 427, 432, 3, 26, 13, 0, 428,
        429, 5, 270, 0, 0, 429, 431, 3, 26, 13, 0, 430, 428, 1, 0, 0, 0, 431, 434, 1, 0, 0, 0, 432, 430, 1, 0, 0, 0,
        432, 433, 1, 0, 0, 0, 433, 41, 1, 0, 0, 0, 434, 432, 1, 0, 0, 0, 435, 436, 5, 39, 0, 0, 436, 438, 3, 28, 14, 0,
        437, 435, 1, 0, 0, 0, 437, 438, 1, 0, 0, 0, 438, 439, 1, 0, 0, 0, 439, 440, 3, 44, 22, 0, 440, 43, 1, 0, 0, 0,
        441, 442, 5, 140, 0, 0, 442, 445, 5, 141, 0, 0, 443, 445, 5, 141, 0, 0, 444, 441, 1, 0, 0, 0, 444, 443, 1, 0, 0,
        0, 445, 45, 1, 0, 0, 0, 446, 448, 3, 80, 40, 0, 447, 449, 3, 48, 24, 0, 448, 447, 1, 0, 0, 0, 449, 450, 1, 0, 0,
        0, 450, 448, 1, 0, 0, 0, 450, 451, 1, 0, 0, 0, 451, 453, 1, 0, 0, 0, 452, 454, 3, 94, 47, 0, 453, 452, 1, 0, 0,
        0, 453, 454, 1, 0, 0, 0, 454, 456, 1, 0, 0, 0, 455, 457, 3, 88, 44, 0, 456, 455, 1, 0, 0, 0, 456, 457, 1, 0, 0,
        0, 457, 474, 1, 0, 0, 0, 458, 460, 3, 132, 66, 0, 459, 461, 3, 94, 47, 0, 460, 459, 1, 0, 0, 0, 460, 461, 1, 0,
        0, 0, 461, 463, 1, 0, 0, 0, 462, 464, 3, 48, 24, 0, 463, 462, 1, 0, 0, 0, 464, 465, 1, 0, 0, 0, 465, 463, 1, 0,
        0, 0, 465, 466, 1, 0, 0, 0, 466, 468, 1, 0, 0, 0, 467, 469, 3, 88, 44, 0, 468, 467, 1, 0, 0, 0, 468, 469, 1, 0,
        0, 0, 469, 474, 1, 0, 0, 0, 470, 474, 3, 86, 43, 0, 471, 474, 3, 60, 30, 0, 472, 474, 3, 48, 24, 0, 473, 446, 1,
        0, 0, 0, 473, 458, 1, 0, 0, 0, 473, 470, 1, 0, 0, 0, 473, 471, 1, 0, 0, 0, 473, 472, 1, 0, 0, 0, 474, 47, 1, 0,
        0, 0, 475, 482, 3, 62, 31, 0, 476, 482, 3, 66, 33, 0, 477, 482, 3, 82, 41, 0, 478, 482, 3, 54, 27, 0, 479, 482,
        3, 58, 29, 0, 480, 482, 3, 56, 28, 0, 481, 475, 1, 0, 0, 0, 481, 476, 1, 0, 0, 0, 481, 477, 1, 0, 0, 0, 481,
        478, 1, 0, 0, 0, 481, 479, 1, 0, 0, 0, 481, 480, 1, 0, 0, 0, 482, 49, 1, 0, 0, 0, 483, 487, 3, 14, 7, 0, 484,
        486, 3, 52, 26, 0, 485, 484, 1, 0, 0, 0, 486, 489, 1, 0, 0, 0, 487, 485, 1, 0, 0, 0, 487, 488, 1, 0, 0, 0, 488,
        51, 1, 0, 0, 0, 489, 487, 1, 0, 0, 0, 490, 491, 5, 290, 0, 0, 491, 492, 3, 278, 139, 0, 492, 493, 5, 291, 0, 0,
        493, 501, 1, 0, 0, 0, 494, 495, 5, 290, 0, 0, 495, 496, 3, 14, 7, 0, 496, 497, 5, 291, 0, 0, 497, 501, 1, 0, 0,
        0, 498, 499, 5, 299, 0, 0, 499, 501, 3, 14, 7, 0, 500, 490, 1, 0, 0, 0, 500, 494, 1, 0, 0, 0, 500, 498, 1, 0, 0,
        0, 501, 53, 1, 0, 0, 0, 502, 503, 5, 173, 0, 0, 503, 504, 5, 117, 0, 0, 504, 506, 3, 14, 7, 0, 505, 507, 3, 8,
        4, 0, 506, 505, 1, 0, 0, 0, 506, 507, 1, 0, 0, 0, 507, 508, 1, 0, 0, 0, 508, 509, 3, 190, 95, 0, 509, 55, 1, 0,
        0, 0, 510, 511, 5, 214, 0, 0, 511, 512, 5, 117, 0, 0, 512, 514, 3, 14, 7, 0, 513, 515, 3, 8, 4, 0, 514, 513, 1,
        0, 0, 0, 514, 515, 1, 0, 0, 0, 515, 516, 1, 0, 0, 0, 516, 517, 3, 190, 95, 0, 517, 57, 1, 0, 0, 0, 518, 519, 5,
        241, 0, 0, 519, 520, 3, 50, 25, 0, 520, 59, 1, 0, 0, 0, 521, 522, 5, 112, 0, 0, 522, 523, 5, 117, 0, 0, 523,
        524, 3, 50, 25, 0, 524, 525, 5, 218, 0, 0, 525, 528, 3, 190, 95, 0, 526, 527, 5, 13, 0, 0, 527, 529, 3, 190, 95,
        0, 528, 526, 1, 0, 0, 0, 528, 529, 1, 0, 0, 0, 529, 531, 1, 0, 0, 0, 530, 532, 3, 68, 34, 0, 531, 530, 1, 0, 0,
        0, 531, 532, 1, 0, 0, 0, 532, 534, 1, 0, 0, 0, 533, 535, 3, 88, 44, 0, 534, 533, 1, 0, 0, 0, 534, 535, 1, 0, 0,
        0, 535, 61, 1, 0, 0, 0, 536, 537, 5, 112, 0, 0, 537, 538, 5, 117, 0, 0, 538, 540, 3, 14, 7, 0, 539, 541, 3, 8,
        4, 0, 540, 539, 1, 0, 0, 0, 540, 541, 1, 0, 0, 0, 541, 542, 1, 0, 0, 0, 542, 544, 3, 190, 95, 0, 543, 545, 3,
        64, 32, 0, 544, 543, 1, 0, 0, 0, 544, 545, 1, 0, 0, 0, 545, 63, 1, 0, 0, 0, 546, 547, 5, 147, 0, 0, 547, 549, 5,
        244, 0, 0, 548, 550, 3, 70, 35, 0, 549, 548, 1, 0, 0, 0, 549, 550, 1, 0, 0, 0, 550, 551, 1, 0, 0, 0, 551, 552,
        3, 74, 37, 0, 552, 65, 1, 0, 0, 0, 553, 554, 5, 112, 0, 0, 554, 555, 5, 117, 0, 0, 555, 556, 3, 50, 25, 0, 556,
        557, 5, 218, 0, 0, 557, 560, 3, 190, 95, 0, 558, 559, 5, 13, 0, 0, 559, 561, 3, 190, 95, 0, 560, 558, 1, 0, 0,
        0, 560, 561, 1, 0, 0, 0, 561, 563, 1, 0, 0, 0, 562, 564, 3, 68, 34, 0, 563, 562, 1, 0, 0, 0, 563, 564, 1, 0, 0,
        0, 564, 67, 1, 0, 0, 0, 565, 566, 5, 147, 0, 0, 566, 567, 5, 244, 0, 0, 567, 568, 5, 225, 0, 0, 568, 569, 3,
        190, 95, 0, 569, 570, 5, 245, 0, 0, 570, 571, 5, 250, 0, 0, 571, 69, 1, 0, 0, 0, 572, 573, 5, 294, 0, 0, 573,
        578, 3, 14, 7, 0, 574, 575, 5, 270, 0, 0, 575, 577, 3, 14, 7, 0, 576, 574, 1, 0, 0, 0, 577, 580, 1, 0, 0, 0,
        578, 576, 1, 0, 0, 0, 578, 579, 1, 0, 0, 0, 579, 581, 1, 0, 0, 0, 580, 578, 1, 0, 0, 0, 581, 582, 5, 295, 0, 0,
        582, 587, 1, 0, 0, 0, 583, 584, 5, 147, 0, 0, 584, 585, 5, 39, 0, 0, 585, 587, 3, 72, 36, 0, 586, 572, 1, 0, 0,
        0, 586, 583, 1, 0, 0, 0, 587, 71, 1, 0, 0, 0, 588, 589, 3, 14, 7, 0, 589, 73, 1, 0, 0, 0, 590, 591, 5, 245, 0,
        0, 591, 599, 5, 250, 0, 0, 592, 593, 5, 245, 0, 0, 593, 594, 5, 173, 0, 0, 594, 599, 3, 76, 38, 0, 595, 596, 5,
        245, 0, 0, 596, 597, 5, 212, 0, 0, 597, 599, 3, 78, 39, 0, 598, 590, 1, 0, 0, 0, 598, 592, 1, 0, 0, 0, 598, 595,
        1, 0, 0, 0, 599, 75, 1, 0, 0, 0, 600, 603, 5, 79, 0, 0, 601, 602, 5, 225, 0, 0, 602, 604, 3, 190, 95, 0, 603,
        601, 1, 0, 0, 0, 603, 604, 1, 0, 0, 0, 604, 77, 1, 0, 0, 0, 605, 608, 5, 79, 0, 0, 606, 607, 5, 225, 0, 0, 607,
        609, 3, 190, 95, 0, 608, 606, 1, 0, 0, 0, 608, 609, 1, 0, 0, 0, 609, 79, 1, 0, 0, 0, 610, 611, 5, 212, 0, 0,
        611, 612, 3, 180, 90, 0, 612, 81, 1, 0, 0, 0, 613, 614, 5, 185, 0, 0, 614, 619, 3, 84, 42, 0, 615, 616, 5, 270,
        0, 0, 616, 618, 3, 84, 42, 0, 617, 615, 1, 0, 0, 0, 618, 621, 1, 0, 0, 0, 619, 617, 1, 0, 0, 0, 619, 620, 1, 0,
        0, 0, 620, 83, 1, 0, 0, 0, 621, 619, 1, 0, 0, 0, 622, 623, 3, 50, 25, 0, 623, 624, 5, 283, 0, 0, 624, 625, 3,
        190, 95, 0, 625, 85, 1, 0, 0, 0, 626, 627, 5, 61, 0, 0, 627, 629, 3, 92, 46, 0, 628, 630, 3, 94, 47, 0, 629,
        628, 1, 0, 0, 0, 629, 630, 1, 0, 0, 0, 630, 632, 1, 0, 0, 0, 631, 633, 3, 88, 44, 0, 632, 631, 1, 0, 0, 0, 632,
        633, 1, 0, 0, 0, 633, 87, 1, 0, 0, 0, 634, 635, 5, 246, 0, 0, 635, 640, 3, 90, 45, 0, 636, 637, 5, 270, 0, 0,
        637, 639, 3, 90, 45, 0, 638, 636, 1, 0, 0, 0, 639, 642, 1, 0, 0, 0, 640, 638, 1, 0, 0, 0, 640, 641, 1, 0, 0, 0,
        641, 89, 1, 0, 0, 0, 642, 640, 1, 0, 0, 0, 643, 644, 7, 1, 0, 0, 644, 645, 7, 2, 0, 0, 645, 650, 5, 277, 0, 0,
        646, 647, 7, 1, 0, 0, 647, 648, 7, 2, 0, 0, 648, 650, 3, 190, 95, 0, 649, 643, 1, 0, 0, 0, 649, 646, 1, 0, 0, 0,
        650, 91, 1, 0, 0, 0, 651, 652, 5, 95, 0, 0, 652, 654, 3, 50, 25, 0, 653, 655, 3, 8, 4, 0, 654, 653, 1, 0, 0, 0,
        654, 655, 1, 0, 0, 0, 655, 657, 1, 0, 0, 0, 656, 658, 3, 10, 5, 0, 657, 656, 1, 0, 0, 0, 657, 658, 1, 0, 0, 0,
        658, 660, 1, 0, 0, 0, 659, 661, 3, 12, 6, 0, 660, 659, 1, 0, 0, 0, 660, 661, 1, 0, 0, 0, 661, 667, 1, 0, 0, 0,
        662, 663, 5, 95, 0, 0, 663, 664, 3, 50, 25, 0, 664, 665, 3, 14, 7, 0, 665, 667, 1, 0, 0, 0, 666, 651, 1, 0, 0,
        0, 666, 662, 1, 0, 0, 0, 667, 93, 1, 0, 0, 0, 668, 669, 5, 225, 0, 0, 669, 670, 3, 190, 95, 0, 670, 95, 1, 0, 0,
        0, 671, 673, 5, 182, 0, 0, 672, 674, 3, 102, 51, 0, 673, 672, 1, 0, 0, 0, 673, 674, 1, 0, 0, 0, 674, 675, 1, 0,
        0, 0, 675, 693, 5, 277, 0, 0, 676, 678, 5, 182, 0, 0, 677, 679, 3, 102, 51, 0, 678, 677, 1, 0, 0, 0, 678, 679,
        1, 0, 0, 0, 679, 680, 1, 0, 0, 0, 680, 693, 3, 98, 49, 0, 681, 683, 5, 182, 0, 0, 682, 684, 3, 102, 51, 0, 683,
        682, 1, 0, 0, 0, 683, 684, 1, 0, 0, 0, 684, 685, 1, 0, 0, 0, 685, 686, 5, 218, 0, 0, 686, 693, 3, 190, 95, 0,
        687, 688, 5, 237, 0, 0, 688, 689, 3, 190, 95, 0, 689, 690, 5, 13, 0, 0, 690, 691, 3, 190, 95, 0, 691, 693, 1, 0,
        0, 0, 692, 671, 1, 0, 0, 0, 692, 676, 1, 0, 0, 0, 692, 681, 1, 0, 0, 0, 692, 687, 1, 0, 0, 0, 693, 97, 1, 0, 0,
        0, 694, 699, 3, 100, 50, 0, 695, 696, 5, 270, 0, 0, 696, 698, 3, 100, 50, 0, 697, 695, 1, 0, 0, 0, 698, 701, 1,
        0, 0, 0, 699, 697, 1, 0, 0, 0, 699, 700, 1, 0, 0, 0, 700, 99, 1, 0, 0, 0, 701, 699, 1, 0, 0, 0, 702, 707, 3,
        190, 95, 0, 703, 705, 5, 10, 0, 0, 704, 703, 1, 0, 0, 0, 704, 705, 1, 0, 0, 0, 705, 706, 1, 0, 0, 0, 706, 708,
        3, 14, 7, 0, 707, 704, 1, 0, 0, 0, 707, 708, 1, 0, 0, 0, 708, 101, 1, 0, 0, 0, 709, 710, 7, 3, 0, 0, 710, 103,
        1, 0, 0, 0, 711, 712, 5, 243, 0, 0, 712, 717, 3, 106, 53, 0, 713, 714, 5, 270, 0, 0, 714, 716, 3, 106, 53, 0,
        715, 713, 1, 0, 0, 0, 716, 719, 1, 0, 0, 0, 717, 715, 1, 0, 0, 0, 717, 718, 1, 0, 0, 0, 718, 105, 1, 0, 0, 0,
        719, 717, 1, 0, 0, 0, 720, 721, 3, 190, 95, 0, 721, 722, 5, 10, 0, 0, 722, 723, 3, 14, 7, 0, 723, 107, 1, 0, 0,
        0, 724, 725, 5, 152, 0, 0, 725, 726, 5, 20, 0, 0, 726, 731, 3, 110, 55, 0, 727, 728, 5, 270, 0, 0, 728, 730, 3,
        110, 55, 0, 729, 727, 1, 0, 0, 0, 730, 733, 1, 0, 0, 0, 731, 729, 1, 0, 0, 0, 731, 732, 1, 0, 0, 0, 732, 109, 1,
        0, 0, 0, 733, 731, 1, 0, 0, 0, 734, 736, 3, 190, 95, 0, 735, 737, 7, 4, 0, 0, 736, 735, 1, 0, 0, 0, 736, 737, 1,
        0, 0, 0, 737, 740, 1, 0, 0, 0, 738, 739, 5, 142, 0, 0, 739, 741, 7, 5, 0, 0, 740, 738, 1, 0, 0, 0, 740, 741, 1,
        0, 0, 0, 741, 111, 1, 0, 0, 0, 742, 744, 5, 102, 0, 0, 743, 745, 5, 158, 0, 0, 744, 743, 1, 0, 0, 0, 744, 745,
        1, 0, 0, 0, 745, 746, 1, 0, 0, 0, 746, 747, 5, 20, 0, 0, 747, 752, 3, 116, 58, 0, 748, 749, 5, 270, 0, 0, 749,
        751, 3, 116, 58, 0, 750, 748, 1, 0, 0, 0, 751, 754, 1, 0, 0, 0, 752, 750, 1, 0, 0, 0, 752, 753, 1, 0, 0, 0, 753,
        756, 1, 0, 0, 0, 754, 752, 1, 0, 0, 0, 755, 757, 3, 114, 57, 0, 756, 755, 1, 0, 0, 0, 756, 757, 1, 0, 0, 0, 757,
        113, 1, 0, 0, 0, 758, 759, 5, 102, 0, 0, 759, 760, 5, 10, 0, 0, 760, 761, 3, 14, 7, 0, 761, 115, 1, 0, 0, 0,
        762, 765, 3, 194, 97, 0, 763, 764, 5, 10, 0, 0, 764, 766, 3, 14, 7, 0, 765, 763, 1, 0, 0, 0, 765, 766, 1, 0, 0,
        0, 766, 117, 1, 0, 0, 0, 767, 768, 5, 232, 0, 0, 768, 770, 5, 294, 0, 0, 769, 771, 3, 120, 60, 0, 770, 769, 1,
        0, 0, 0, 770, 771, 1, 0, 0, 0, 771, 773, 1, 0, 0, 0, 772, 774, 3, 122, 61, 0, 773, 772, 1, 0, 0, 0, 773, 774, 1,
        0, 0, 0, 774, 775, 1, 0, 0, 0, 775, 776, 5, 295, 0, 0, 776, 119, 1, 0, 0, 0, 777, 778, 5, 233, 0, 0, 778, 779,
        5, 20, 0, 0, 779, 784, 3, 190, 95, 0, 780, 781, 5, 270, 0, 0, 781, 783, 3, 190, 95, 0, 782, 780, 1, 0, 0, 0,
        783, 786, 1, 0, 0, 0, 784, 782, 1, 0, 0, 0, 784, 785, 1, 0, 0, 0, 785, 121, 1, 0, 0, 0, 786, 784, 1, 0, 0, 0,
        787, 788, 5, 152, 0, 0, 788, 789, 5, 20, 0, 0, 789, 794, 3, 110, 55, 0, 790, 791, 5, 270, 0, 0, 791, 793, 3,
        110, 55, 0, 792, 790, 1, 0, 0, 0, 793, 796, 1, 0, 0, 0, 794, 792, 1, 0, 0, 0, 794, 795, 1, 0, 0, 0, 795, 123, 1,
        0, 0, 0, 796, 794, 1, 0, 0, 0, 797, 798, 5, 103, 0, 0, 798, 799, 3, 194, 97, 0, 799, 125, 1, 0, 0, 0, 800, 801,
        5, 78, 0, 0, 801, 806, 3, 128, 64, 0, 802, 803, 5, 270, 0, 0, 803, 805, 3, 128, 64, 0, 804, 802, 1, 0, 0, 0,
        805, 808, 1, 0, 0, 0, 806, 804, 1, 0, 0, 0, 806, 807, 1, 0, 0, 0, 807, 127, 1, 0, 0, 0, 808, 806, 1, 0, 0, 0,
        809, 811, 3, 14, 7, 0, 810, 812, 3, 130, 65, 0, 811, 810, 1, 0, 0, 0, 812, 813, 1, 0, 0, 0, 813, 811, 1, 0, 0,
        0, 813, 814, 1, 0, 0, 0, 814, 129, 1, 0, 0, 0, 815, 816, 5, 299, 0, 0, 816, 829, 3, 14, 7, 0, 817, 818, 5, 290,
        0, 0, 818, 819, 5, 300, 0, 0, 819, 829, 5, 291, 0, 0, 820, 821, 5, 290, 0, 0, 821, 822, 5, 301, 0, 0, 822, 829,
        5, 291, 0, 0, 823, 824, 5, 290, 0, 0, 824, 825, 5, 277, 0, 0, 825, 829, 5, 291, 0, 0, 826, 827, 5, 299, 0, 0,
        827, 829, 5, 277, 0, 0, 828, 815, 1, 0, 0, 0, 828, 817, 1, 0, 0, 0, 828, 820, 1, 0, 0, 0, 828, 823, 1, 0, 0, 0,
        828, 826, 1, 0, 0, 0, 829, 131, 1, 0, 0, 0, 830, 831, 5, 95, 0, 0, 831, 832, 3, 176, 88, 0, 832, 133, 1, 0, 0,
        0, 833, 834, 5, 225, 0, 0, 834, 835, 3, 194, 97, 0, 835, 135, 1, 0, 0, 0, 836, 837, 5, 240, 0, 0, 837, 838, 3,
        194, 97, 0, 838, 137, 1, 0, 0, 0, 839, 840, 5, 239, 0, 0, 840, 841, 3, 194, 97, 0, 841, 139, 1, 0, 0, 0, 842,
        844, 3, 148, 74, 0, 843, 842, 1, 0, 0, 0, 843, 844, 1, 0, 0, 0, 844, 845, 1, 0, 0, 0, 845, 846, 3, 144, 72, 0,
        846, 141, 1, 0, 0, 0, 847, 849, 3, 148, 74, 0, 848, 847, 1, 0, 0, 0, 848, 849, 1, 0, 0, 0, 849, 850, 1, 0, 0, 0,
        850, 855, 3, 144, 72, 0, 851, 852, 5, 270, 0, 0, 852, 854, 3, 144, 72, 0, 853, 851, 1, 0, 0, 0, 854, 857, 1, 0,
        0, 0, 855, 853, 1, 0, 0, 0, 855, 856, 1, 0, 0, 0, 856, 143, 1, 0, 0, 0, 857, 855, 1, 0, 0, 0, 858, 860, 3, 152,
        76, 0, 859, 858, 1, 0, 0, 0, 859, 860, 1, 0, 0, 0, 860, 862, 1, 0, 0, 0, 861, 863, 3, 150, 75, 0, 862, 861, 1,
        0, 0, 0, 862, 863, 1, 0, 0, 0, 863, 867, 1, 0, 0, 0, 864, 866, 3, 146, 73, 0, 865, 864, 1, 0, 0, 0, 866, 869, 1,
        0, 0, 0, 867, 865, 1, 0, 0, 0, 867, 868, 1, 0, 0, 0, 868, 145, 1, 0, 0, 0, 869, 867, 1, 0, 0, 0, 870, 874, 3,
        154, 77, 0, 871, 874, 3, 156, 78, 0, 872, 874, 3, 158, 79, 0, 873, 870, 1, 0, 0, 0, 873, 871, 1, 0, 0, 0, 873,
        872, 1, 0, 0, 0, 874, 147, 1, 0, 0, 0, 875, 876, 7, 6, 0, 0, 876, 887, 5, 186, 0, 0, 877, 879, 5, 8, 0, 0, 878,
        880, 5, 301, 0, 0, 879, 878, 1, 0, 0, 0, 879, 880, 1, 0, 0, 0, 880, 887, 1, 0, 0, 0, 881, 882, 5, 186, 0, 0,
        882, 884, 5, 301, 0, 0, 883, 885, 5, 102, 0, 0, 884, 883, 1, 0, 0, 0, 884, 885, 1, 0, 0, 0, 885, 887, 1, 0, 0,
        0, 886, 875, 1, 0, 0, 0, 886, 877, 1, 0, 0, 0, 886, 881, 1, 0, 0, 0, 887, 149, 1, 0, 0, 0, 888, 889, 3, 14, 7,
        0, 889, 890, 5, 283, 0, 0, 890, 151, 1, 0, 0, 0, 891, 892, 5, 303, 0, 0, 892, 153, 1, 0, 0, 0, 893, 895, 5, 294,
        0, 0, 894, 896, 3, 14, 7, 0, 895, 894, 1, 0, 0, 0, 895, 896, 1, 0, 0, 0, 896, 899, 1, 0, 0, 0, 897, 898, 5, 296,
        0, 0, 898, 900, 3, 166, 83, 0, 899, 897, 1, 0, 0, 0, 899, 900, 1, 0, 0, 0, 900, 902, 1, 0, 0, 0, 901, 903, 3,
        94, 47, 0, 902, 901, 1, 0, 0, 0, 902, 903, 1, 0, 0, 0, 903, 904, 1, 0, 0, 0, 904, 905, 5, 295, 0, 0, 905, 155,
        1, 0, 0, 0, 906, 908, 3, 162, 81, 0, 907, 909, 3, 160, 80, 0, 908, 907, 1, 0, 0, 0, 908, 909, 1, 0, 0, 0, 909,
        915, 1, 0, 0, 0, 910, 912, 3, 174, 87, 0, 911, 913, 3, 160, 80, 0, 912, 911, 1, 0, 0, 0, 912, 913, 1, 0, 0, 0,
        913, 915, 1, 0, 0, 0, 914, 906, 1, 0, 0, 0, 914, 910, 1, 0, 0, 0, 915, 157, 1, 0, 0, 0, 916, 918, 5, 294, 0, 0,
        917, 919, 3, 152, 76, 0, 918, 917, 1, 0, 0, 0, 918, 919, 1, 0, 0, 0, 919, 921, 1, 0, 0, 0, 920, 922, 3, 150, 75,
        0, 921, 920, 1, 0, 0, 0, 921, 922, 1, 0, 0, 0, 922, 924, 1, 0, 0, 0, 923, 925, 3, 146, 73, 0, 924, 923, 1, 0, 0,
        0, 925, 926, 1, 0, 0, 0, 926, 924, 1, 0, 0, 0, 926, 927, 1, 0, 0, 0, 927, 929, 1, 0, 0, 0, 928, 930, 3, 94, 47,
        0, 929, 928, 1, 0, 0, 0, 929, 930, 1, 0, 0, 0, 930, 931, 1, 0, 0, 0, 931, 933, 5, 295, 0, 0, 932, 934, 3, 160,
        80, 0, 933, 932, 1, 0, 0, 0, 933, 934, 1, 0, 0, 0, 934, 955, 1, 0, 0, 0, 935, 937, 5, 290, 0, 0, 936, 938, 3,
        152, 76, 0, 937, 936, 1, 0, 0, 0, 937, 938, 1, 0, 0, 0, 938, 940, 1, 0, 0, 0, 939, 941, 3, 150, 75, 0, 940, 939,
        1, 0, 0, 0, 940, 941, 1, 0, 0, 0, 941, 943, 1, 0, 0, 0, 942, 944, 3, 146, 73, 0, 943, 942, 1, 0, 0, 0, 944, 945,
        1, 0, 0, 0, 945, 943, 1, 0, 0, 0, 945, 946, 1, 0, 0, 0, 946, 948, 1, 0, 0, 0, 947, 949, 3, 94, 47, 0, 948, 947,
        1, 0, 0, 0, 948, 949, 1, 0, 0, 0, 949, 950, 1, 0, 0, 0, 950, 952, 5, 291, 0, 0, 951, 953, 3, 160, 80, 0, 952,
        951, 1, 0, 0, 0, 952, 953, 1, 0, 0, 0, 953, 955, 1, 0, 0, 0, 954, 916, 1, 0, 0, 0, 954, 935, 1, 0, 0, 0, 955,
        159, 1, 0, 0, 0, 956, 965, 7, 7, 0, 0, 957, 958, 5, 292, 0, 0, 958, 959, 5, 301, 0, 0, 959, 961, 5, 270, 0, 0,
        960, 962, 5, 301, 0, 0, 961, 960, 1, 0, 0, 0, 961, 962, 1, 0, 0, 0, 962, 963, 1, 0, 0, 0, 963, 965, 5, 293, 0,
        0, 964, 956, 1, 0, 0, 0, 964, 957, 1, 0, 0, 0, 965, 161, 1, 0, 0, 0, 966, 967, 5, 272, 0, 0, 967, 968, 3, 164,
        82, 0, 968, 969, 5, 272, 0, 0, 969, 970, 5, 287, 0, 0, 970, 1001, 1, 0, 0, 0, 971, 972, 5, 276, 0, 0, 972, 973,
        3, 164, 82, 0, 973, 974, 5, 276, 0, 0, 974, 1001, 1, 0, 0, 0, 975, 976, 5, 286, 0, 0, 976, 977, 5, 272, 0, 0,
        977, 978, 3, 164, 82, 0, 978, 979, 5, 272, 0, 0, 979, 1001, 1, 0, 0, 0, 980, 981, 5, 276, 0, 0, 981, 982, 3,
        164, 82, 0, 982, 983, 5, 276, 0, 0, 983, 984, 5, 287, 0, 0, 984, 1001, 1, 0, 0, 0, 985, 986, 5, 286, 0, 0, 986,
        987, 5, 276, 0, 0, 987, 988, 3, 164, 82, 0, 988, 989, 5, 276, 0, 0, 989, 1001, 1, 0, 0, 0, 990, 991, 5, 286, 0,
        0, 991, 992, 5, 272, 0, 0, 992, 993, 3, 164, 82, 0, 993, 994, 5, 272, 0, 0, 994, 995, 5, 287, 0, 0, 995, 1001,
        1, 0, 0, 0, 996, 997, 5, 272, 0, 0, 997, 998, 3, 164, 82, 0, 998, 999, 5, 272, 0, 0, 999, 1001, 1, 0, 0, 0,
        1000, 966, 1, 0, 0, 0, 1000, 971, 1, 0, 0, 0, 1000, 975, 1, 0, 0, 0, 1000, 980, 1, 0, 0, 0, 1000, 985, 1, 0, 0,
        0, 1000, 990, 1, 0, 0, 0, 1000, 996, 1, 0, 0, 0, 1001, 163, 1, 0, 0, 0, 1002, 1004, 5, 290, 0, 0, 1003, 1005, 3,
        14, 7, 0, 1004, 1003, 1, 0, 0, 0, 1004, 1005, 1, 0, 0, 0, 1005, 1008, 1, 0, 0, 0, 1006, 1007, 5, 296, 0, 0,
        1007, 1009, 3, 166, 83, 0, 1008, 1006, 1, 0, 0, 0, 1008, 1009, 1, 0, 0, 0, 1009, 1011, 1, 0, 0, 0, 1010, 1012,
        3, 94, 47, 0, 1011, 1010, 1, 0, 0, 0, 1011, 1012, 1, 0, 0, 0, 1012, 1013, 1, 0, 0, 0, 1013, 1014, 5, 291, 0, 0,
        1014, 165, 1, 0, 0, 0, 1015, 1016, 6, 83, -1, 0, 1016, 1017, 3, 168, 84, 0, 1017, 1023, 1, 0, 0, 0, 1018, 1019,
        10, 2, 0, 0, 1019, 1020, 5, 278, 0, 0, 1020, 1022, 3, 168, 84, 0, 1021, 1018, 1, 0, 0, 0, 1022, 1025, 1, 0, 0,
        0, 1023, 1021, 1, 0, 0, 0, 1023, 1024, 1, 0, 0, 0, 1024, 167, 1, 0, 0, 0, 1025, 1023, 1, 0, 0, 0, 1026, 1027, 6,
        84, -1, 0, 1027, 1028, 3, 170, 85, 0, 1028, 1034, 1, 0, 0, 0, 1029, 1030, 10, 2, 0, 0, 1030, 1031, 5, 279, 0, 0,
        1031, 1033, 3, 170, 85, 0, 1032, 1029, 1, 0, 0, 0, 1033, 1036, 1, 0, 0, 0, 1034, 1032, 1, 0, 0, 0, 1034, 1035,
        1, 0, 0, 0, 1035, 169, 1, 0, 0, 0, 1036, 1034, 1, 0, 0, 0, 1037, 1038, 5, 280, 0, 0, 1038, 1041, 3, 172, 86, 0,
        1039, 1041, 3, 172, 86, 0, 1040, 1037, 1, 0, 0, 0, 1040, 1039, 1, 0, 0, 0, 1041, 171, 1, 0, 0, 0, 1042, 1049, 3,
        14, 7, 0, 1043, 1049, 5, 274, 0, 0, 1044, 1045, 5, 294, 0, 0, 1045, 1046, 3, 166, 83, 0, 1046, 1047, 5, 295, 0,
        0, 1047, 1049, 1, 0, 0, 0, 1048, 1042, 1, 0, 0, 0, 1048, 1043, 1, 0, 0, 0, 1048, 1044, 1, 0, 0, 0, 1049, 173, 1,
        0, 0, 0, 1050, 1063, 5, 276, 0, 0, 1051, 1052, 5, 276, 0, 0, 1052, 1063, 5, 287, 0, 0, 1053, 1054, 5, 286, 0, 0,
        1054, 1063, 5, 276, 0, 0, 1055, 1057, 5, 286, 0, 0, 1056, 1055, 1, 0, 0, 0, 1056, 1057, 1, 0, 0, 0, 1057, 1058,
        1, 0, 0, 0, 1058, 1060, 5, 272, 0, 0, 1059, 1061, 5, 287, 0, 0, 1060, 1059, 1, 0, 0, 0, 1060, 1061, 1, 0, 0, 0,
        1061, 1063, 1, 0, 0, 0, 1062, 1050, 1, 0, 0, 0, 1062, 1051, 1, 0, 0, 0, 1062, 1053, 1, 0, 0, 0, 1062, 1056, 1,
        0, 0, 0, 1063, 175, 1, 0, 0, 0, 1064, 1065, 6, 88, -1, 0, 1065, 1071, 3, 178, 89, 0, 1066, 1067, 5, 294, 0, 0,
        1067, 1068, 3, 176, 88, 0, 1068, 1069, 5, 295, 0, 0, 1069, 1071, 1, 0, 0, 0, 1070, 1064, 1, 0, 0, 0, 1070, 1066,
        1, 0, 0, 0, 1071, 1092, 1, 0, 0, 0, 1072, 1074, 10, 5, 0, 0, 1073, 1075, 3, 188, 94, 0, 1074, 1073, 1, 0, 0, 0,
        1074, 1075, 1, 0, 0, 0, 1075, 1076, 1, 0, 0, 0, 1076, 1077, 5, 46, 0, 0, 1077, 1078, 5, 120, 0, 0, 1078, 1091,
        3, 184, 92, 0, 1079, 1080, 10, 4, 0, 0, 1080, 1081, 5, 270, 0, 0, 1081, 1091, 3, 184, 92, 0, 1082, 1084, 10, 3,
        0, 0, 1083, 1085, 3, 188, 94, 0, 1084, 1083, 1, 0, 0, 0, 1084, 1085, 1, 0, 0, 0, 1085, 1086, 1, 0, 0, 0, 1086,
        1087, 5, 120, 0, 0, 1087, 1088, 3, 184, 92, 0, 1088, 1089, 3, 186, 93, 0, 1089, 1091, 1, 0, 0, 0, 1090, 1072, 1,
        0, 0, 0, 1090, 1079, 1, 0, 0, 0, 1090, 1082, 1, 0, 0, 0, 1091, 1094, 1, 0, 0, 0, 1092, 1090, 1, 0, 0, 0, 1092,
        1093, 1, 0, 0, 0, 1093, 177, 1, 0, 0, 0, 1094, 1092, 1, 0, 0, 0, 1095, 1098, 3, 180, 90, 0, 1096, 1098, 3, 182,
        91, 0, 1097, 1095, 1, 0, 0, 0, 1097, 1096, 1, 0, 0, 0, 1098, 179, 1, 0, 0, 0, 1099, 1100, 3, 194, 97, 0, 1100,
        1101, 3, 14, 7, 0, 1101, 1123, 1, 0, 0, 0, 1102, 1104, 3, 194, 97, 0, 1103, 1105, 3, 8, 4, 0, 1104, 1103, 1, 0,
        0, 0, 1104, 1105, 1, 0, 0, 0, 1105, 1107, 1, 0, 0, 0, 1106, 1108, 3, 10, 5, 0, 1107, 1106, 1, 0, 0, 0, 1107,
        1108, 1, 0, 0, 0, 1108, 1110, 1, 0, 0, 0, 1109, 1111, 3, 12, 6, 0, 1110, 1109, 1, 0, 0, 0, 1110, 1111, 1, 0, 0,
        0, 1111, 1123, 1, 0, 0, 0, 1112, 1114, 3, 260, 130, 0, 1113, 1115, 3, 8, 4, 0, 1114, 1113, 1, 0, 0, 0, 1114,
        1115, 1, 0, 0, 0, 1115, 1117, 1, 0, 0, 0, 1116, 1118, 3, 10, 5, 0, 1117, 1116, 1, 0, 0, 0, 1117, 1118, 1, 0, 0,
        0, 1118, 1120, 1, 0, 0, 0, 1119, 1121, 3, 12, 6, 0, 1120, 1119, 1, 0, 0, 0, 1120, 1121, 1, 0, 0, 0, 1121, 1123,
        1, 0, 0, 0, 1122, 1099, 1, 0, 0, 0, 1122, 1102, 1, 0, 0, 0, 1122, 1112, 1, 0, 0, 0, 1123, 181, 1, 0, 0, 0, 1124,
        1125, 5, 238, 0, 0, 1125, 1127, 3, 190, 95, 0, 1126, 1128, 3, 8, 4, 0, 1127, 1126, 1, 0, 0, 0, 1127, 1128, 1, 0,
        0, 0, 1128, 1130, 1, 0, 0, 0, 1129, 1131, 3, 10, 5, 0, 1130, 1129, 1, 0, 0, 0, 1130, 1131, 1, 0, 0, 0, 1131,
        1133, 1, 0, 0, 0, 1132, 1134, 3, 12, 6, 0, 1133, 1132, 1, 0, 0, 0, 1133, 1134, 1, 0, 0, 0, 1134, 183, 1, 0, 0,
        0, 1135, 1141, 3, 178, 89, 0, 1136, 1137, 5, 294, 0, 0, 1137, 1138, 3, 176, 88, 0, 1138, 1139, 5, 295, 0, 0,
        1139, 1141, 1, 0, 0, 0, 1140, 1135, 1, 0, 0, 0, 1140, 1136, 1, 0, 0, 0, 1141, 185, 1, 0, 0, 0, 1142, 1143, 5,
        147, 0, 0, 1143, 1144, 3, 190, 95, 0, 1144, 187, 1, 0, 0, 0, 1145, 1160, 5, 109, 0, 0, 1146, 1148, 5, 125, 0, 0,
        1147, 1149, 5, 153, 0, 0, 1148, 1147, 1, 0, 0, 0, 1148, 1149, 1, 0, 0, 0, 1149, 1160, 1, 0, 0, 0, 1150, 1152, 5,
        176, 0, 0, 1151, 1153, 5, 153, 0, 0, 1152, 1151, 1, 0, 0, 0, 1152, 1153, 1, 0, 0, 0, 1153, 1160, 1, 0, 0, 0,
        1154, 1156, 5, 96, 0, 0, 1155, 1157, 5, 153, 0, 0, 1156, 1155, 1, 0, 0, 0, 1156, 1157, 1, 0, 0, 0, 1157, 1160,
        1, 0, 0, 0, 1158, 1160, 5, 153, 0, 0, 1159, 1145, 1, 0, 0, 0, 1159, 1146, 1, 0, 0, 0, 1159, 1150, 1, 0, 0, 0,
        1159, 1154, 1, 0, 0, 0, 1159, 1158, 1, 0, 0, 0, 1160, 189, 1, 0, 0, 0, 1161, 1162, 3, 192, 96, 0, 1162, 191, 1,
        0, 0, 0, 1163, 1164, 6, 96, -1, 0, 1164, 1165, 3, 194, 97, 0, 1165, 1195, 1, 0, 0, 0, 1166, 1168, 10, 4, 0, 0,
        1167, 1169, 5, 153, 0, 0, 1168, 1167, 1, 0, 0, 0, 1168, 1169, 1, 0, 0, 0, 1169, 1170, 1, 0, 0, 0, 1170, 1172, 5,
        76, 0, 0, 1171, 1173, 7, 3, 0, 0, 1172, 1171, 1, 0, 0, 0, 1172, 1173, 1, 0, 0, 0, 1173, 1174, 1, 0, 0, 0, 1174,
        1194, 3, 194, 97, 0, 1175, 1177, 10, 3, 0, 0, 1176, 1178, 5, 153, 0, 0, 1177, 1176, 1, 0, 0, 0, 1177, 1178, 1,
        0, 0, 0, 1178, 1179, 1, 0, 0, 0, 1179, 1181, 5, 209, 0, 0, 1180, 1182, 7, 3, 0, 0, 1181, 1180, 1, 0, 0, 0, 1181,
        1182, 1, 0, 0, 0, 1182, 1183, 1, 0, 0, 0, 1183, 1194, 3, 194, 97, 0, 1184, 1186, 10, 2, 0, 0, 1185, 1187, 5,
        153, 0, 0, 1186, 1185, 1, 0, 0, 0, 1186, 1187, 1, 0, 0, 0, 1187, 1188, 1, 0, 0, 0, 1188, 1190, 5, 115, 0, 0,
        1189, 1191, 7, 3, 0, 0, 1190, 1189, 1, 0, 0, 0, 1190, 1191, 1, 0, 0, 0, 1191, 1192, 1, 0, 0, 0, 1192, 1194, 3,
        194, 97, 0, 1193, 1166, 1, 0, 0, 0, 1193, 1175, 1, 0, 0, 0, 1193, 1184, 1, 0, 0, 0, 1194, 1197, 1, 0, 0, 0,
        1195, 1193, 1, 0, 0, 0, 1195, 1196, 1, 0, 0, 0, 1196, 193, 1, 0, 0, 0, 1197, 1195, 1, 0, 0, 0, 1198, 1200, 3,
        96, 48, 0, 1199, 1201, 3, 126, 63, 0, 1200, 1199, 1, 0, 0, 0, 1200, 1201, 1, 0, 0, 0, 1201, 1202, 1, 0, 0, 0,
        1202, 1204, 3, 132, 66, 0, 1203, 1205, 3, 104, 52, 0, 1204, 1203, 1, 0, 0, 0, 1204, 1205, 1, 0, 0, 0, 1205,
        1207, 1, 0, 0, 0, 1206, 1208, 3, 134, 67, 0, 1207, 1206, 1, 0, 0, 0, 1207, 1208, 1, 0, 0, 0, 1208, 1210, 1, 0,
        0, 0, 1209, 1211, 3, 112, 56, 0, 1210, 1209, 1, 0, 0, 0, 1210, 1211, 1, 0, 0, 0, 1211, 1213, 1, 0, 0, 0, 1212,
        1214, 3, 124, 62, 0, 1213, 1212, 1, 0, 0, 0, 1213, 1214, 1, 0, 0, 0, 1214, 1216, 1, 0, 0, 0, 1215, 1217, 3, 108,
        54, 0, 1216, 1215, 1, 0, 0, 0, 1216, 1217, 1, 0, 0, 0, 1217, 1219, 1, 0, 0, 0, 1218, 1220, 3, 138, 69, 0, 1219,
        1218, 1, 0, 0, 0, 1219, 1220, 1, 0, 0, 0, 1220, 1222, 1, 0, 0, 0, 1221, 1223, 3, 136, 68, 0, 1222, 1221, 1, 0,
        0, 0, 1222, 1223, 1, 0, 0, 0, 1223, 1226, 1, 0, 0, 0, 1224, 1226, 3, 196, 98, 0, 1225, 1198, 1, 0, 0, 0, 1225,
        1224, 1, 0, 0, 0, 1226, 195, 1, 0, 0, 0, 1227, 1228, 6, 98, -1, 0, 1228, 1229, 3, 198, 99, 0, 1229, 1235, 1, 0,
        0, 0, 1230, 1231, 10, 2, 0, 0, 1231, 1232, 5, 151, 0, 0, 1232, 1234, 3, 198, 99, 0, 1233, 1230, 1, 0, 0, 0,
        1234, 1237, 1, 0, 0, 0, 1235, 1233, 1, 0, 0, 0, 1235, 1236, 1, 0, 0, 0, 1236, 197, 1, 0, 0, 0, 1237, 1235, 1, 0,
        0, 0, 1238, 1239, 6, 99, -1, 0, 1239, 1240, 3, 200, 100, 0, 1240, 1246, 1, 0, 0, 0, 1241, 1242, 10, 2, 0, 0,
        1242, 1243, 5, 7, 0, 0, 1243, 1245, 3, 200, 100, 0, 1244, 1241, 1, 0, 0, 0, 1245, 1248, 1, 0, 0, 0, 1246, 1244,
        1, 0, 0, 0, 1246, 1247, 1, 0, 0, 0, 1247, 199, 1, 0, 0, 0, 1248, 1246, 1, 0, 0, 0, 1249, 1250, 5, 140, 0, 0,
        1250, 1253, 3, 200, 100, 0, 1251, 1253, 3, 202, 101, 0, 1252, 1249, 1, 0, 0, 0, 1252, 1251, 1, 0, 0, 0, 1253,
        201, 1, 0, 0, 0, 1254, 1255, 6, 101, -1, 0, 1255, 1256, 3, 204, 102, 0, 1256, 1302, 1, 0, 0, 0, 1257, 1258, 10,
        7, 0, 0, 1258, 1259, 7, 8, 0, 0, 1259, 1301, 3, 204, 102, 0, 1260, 1261, 10, 6, 0, 0, 1261, 1263, 5, 118, 0, 0,
        1262, 1264, 5, 140, 0, 0, 1263, 1262, 1, 0, 0, 0, 1263, 1264, 1, 0, 0, 0, 1264, 1265, 1, 0, 0, 0, 1265, 1301, 3,
        280, 140, 0, 1266, 1268, 10, 5, 0, 0, 1267, 1269, 5, 140, 0, 0, 1268, 1267, 1, 0, 0, 0, 1268, 1269, 1, 0, 0, 0,
        1269, 1270, 1, 0, 0, 0, 1270, 1271, 5, 106, 0, 0, 1271, 1272, 5, 294, 0, 0, 1272, 1273, 3, 190, 95, 0, 1273,
        1274, 5, 295, 0, 0, 1274, 1301, 1, 0, 0, 0, 1275, 1277, 10, 4, 0, 0, 1276, 1278, 5, 140, 0, 0, 1277, 1276, 1, 0,
        0, 0, 1277, 1278, 1, 0, 0, 0, 1278, 1279, 1, 0, 0, 0, 1279, 1280, 5, 106, 0, 0, 1280, 1301, 3, 204, 102, 0,
        1281, 1283, 10, 3, 0, 0, 1282, 1284, 5, 140, 0, 0, 1283, 1282, 1, 0, 0, 0, 1283, 1284, 1, 0, 0, 0, 1284, 1285,
        1, 0, 0, 0, 1285, 1286, 5, 127, 0, 0, 1286, 1289, 3, 204, 102, 0, 1287, 1288, 5, 74, 0, 0, 1288, 1290, 3, 190,
        95, 0, 1289, 1287, 1, 0, 0, 0, 1289, 1290, 1, 0, 0, 0, 1290, 1301, 1, 0, 0, 0, 1291, 1293, 10, 2, 0, 0, 1292,
        1294, 5, 140, 0, 0, 1293, 1292, 1, 0, 0, 0, 1293, 1294, 1, 0, 0, 0, 1294, 1295, 1, 0, 0, 0, 1295, 1296, 5, 17,
        0, 0, 1296, 1297, 3, 204, 102, 0, 1297, 1298, 5, 7, 0, 0, 1298, 1299, 3, 204, 102, 0, 1299, 1301, 1, 0, 0, 0,
        1300, 1257, 1, 0, 0, 0, 1300, 1260, 1, 0, 0, 0, 1300, 1266, 1, 0, 0, 0, 1300, 1275, 1, 0, 0, 0, 1300, 1281, 1,
        0, 0, 0, 1300, 1291, 1, 0, 0, 0, 1301, 1304, 1, 0, 0, 0, 1302, 1300, 1, 0, 0, 0, 1302, 1303, 1, 0, 0, 0, 1303,
        203, 1, 0, 0, 0, 1304, 1302, 1, 0, 0, 0, 1305, 1306, 6, 102, -1, 0, 1306, 1307, 3, 206, 103, 0, 1307, 1313, 1,
        0, 0, 0, 1308, 1309, 10, 2, 0, 0, 1309, 1310, 7, 9, 0, 0, 1310, 1312, 3, 206, 103, 0, 1311, 1308, 1, 0, 0, 0,
        1312, 1315, 1, 0, 0, 0, 1313, 1311, 1, 0, 0, 0, 1313, 1314, 1, 0, 0, 0, 1314, 205, 1, 0, 0, 0, 1315, 1313, 1, 0,
        0, 0, 1316, 1317, 6, 103, -1, 0, 1317, 1318, 3, 208, 104, 0, 1318, 1324, 1, 0, 0, 0, 1319, 1320, 10, 2, 0, 0,
        1320, 1321, 7, 10, 0, 0, 1321, 1323, 3, 208, 104, 0, 1322, 1319, 1, 0, 0, 0, 1323, 1326, 1, 0, 0, 0, 1324, 1322,
        1, 0, 0, 0, 1324, 1325, 1, 0, 0, 0, 1325, 207, 1, 0, 0, 0, 1326, 1324, 1, 0, 0, 0, 1327, 1328, 6, 104, -1, 0,
        1328, 1329, 3, 210, 105, 0, 1329, 1335, 1, 0, 0, 0, 1330, 1331, 10, 2, 0, 0, 1331, 1332, 7, 11, 0, 0, 1332,
        1334, 3, 210, 105, 0, 1333, 1330, 1, 0, 0, 0, 1334, 1337, 1, 0, 0, 0, 1335, 1333, 1, 0, 0, 0, 1335, 1336, 1, 0,
        0, 0, 1336, 209, 1, 0, 0, 0, 1337, 1335, 1, 0, 0, 0, 1338, 1339, 7, 10, 0, 0, 1339, 1342, 3, 210, 105, 0, 1340,
        1342, 3, 212, 106, 0, 1341, 1338, 1, 0, 0, 0, 1341, 1340, 1, 0, 0, 0, 1342, 211, 1, 0, 0, 0, 1343, 1344, 6, 106,
        -1, 0, 1344, 1365, 3, 214, 107, 0, 1345, 1365, 3, 240, 120, 0, 1346, 1365, 3, 228, 114, 0, 1347, 1365, 3, 230,
        115, 0, 1348, 1365, 3, 232, 116, 0, 1349, 1365, 3, 234, 117, 0, 1350, 1365, 3, 244, 122, 0, 1351, 1365, 3, 242,
        121, 0, 1352, 1365, 3, 246, 123, 0, 1353, 1365, 3, 218, 109, 0, 1354, 1365, 3, 250, 125, 0, 1355, 1365, 3, 236,
        118, 0, 1356, 1365, 3, 248, 124, 0, 1357, 1365, 3, 252, 126, 0, 1358, 1365, 3, 216, 108, 0, 1359, 1365, 3, 258,
        129, 0, 1360, 1365, 3, 220, 110, 0, 1361, 1365, 3, 226, 113, 0, 1362, 1365, 3, 222, 111, 0, 1363, 1365, 3, 238,
        119, 0, 1364, 1343, 1, 0, 0, 0, 1364, 1345, 1, 0, 0, 0, 1364, 1346, 1, 0, 0, 0, 1364, 1347, 1, 0, 0, 0, 1364,
        1348, 1, 0, 0, 0, 1364, 1349, 1, 0, 0, 0, 1364, 1350, 1, 0, 0, 0, 1364, 1351, 1, 0, 0, 0, 1364, 1352, 1, 0, 0,
        0, 1364, 1353, 1, 0, 0, 0, 1364, 1354, 1, 0, 0, 0, 1364, 1355, 1, 0, 0, 0, 1364, 1356, 1, 0, 0, 0, 1364, 1357,
        1, 0, 0, 0, 1364, 1358, 1, 0, 0, 0, 1364, 1359, 1, 0, 0, 0, 1364, 1360, 1, 0, 0, 0, 1364, 1361, 1, 0, 0, 0,
        1364, 1362, 1, 0, 0, 0, 1364, 1363, 1, 0, 0, 0, 1365, 1374, 1, 0, 0, 0, 1366, 1368, 10, 6, 0, 0, 1367, 1369, 3,
        256, 128, 0, 1368, 1367, 1, 0, 0, 0, 1369, 1370, 1, 0, 0, 0, 1370, 1368, 1, 0, 0, 0, 1370, 1371, 1, 0, 0, 0,
        1371, 1373, 1, 0, 0, 0, 1372, 1366, 1, 0, 0, 0, 1373, 1376, 1, 0, 0, 0, 1374, 1372, 1, 0, 0, 0, 1374, 1375, 1,
        0, 0, 0, 1375, 213, 1, 0, 0, 0, 1376, 1374, 1, 0, 0, 0, 1377, 1378, 5, 294, 0, 0, 1378, 1379, 3, 190, 95, 0,
        1379, 1380, 5, 295, 0, 0, 1380, 1389, 1, 0, 0, 0, 1381, 1389, 5, 51, 0, 0, 1382, 1389, 5, 48, 0, 0, 1383, 1389,
        3, 262, 131, 0, 1384, 1389, 3, 264, 132, 0, 1385, 1389, 3, 278, 139, 0, 1386, 1389, 3, 268, 134, 0, 1387, 1389,
        3, 274, 137, 0, 1388, 1377, 1, 0, 0, 0, 1388, 1381, 1, 0, 0, 0, 1388, 1382, 1, 0, 0, 0, 1388, 1383, 1, 0, 0, 0,
        1388, 1384, 1, 0, 0, 0, 1388, 1385, 1, 0, 0, 0, 1388, 1386, 1, 0, 0, 0, 1388, 1387, 1, 0, 0, 0, 1389, 215, 1, 0,
        0, 0, 1390, 1391, 5, 143, 0, 0, 1391, 1392, 5, 294, 0, 0, 1392, 1393, 3, 190, 95, 0, 1393, 1394, 5, 270, 0, 0,
        1394, 1395, 3, 190, 95, 0, 1395, 1396, 5, 295, 0, 0, 1396, 217, 1, 0, 0, 0, 1397, 1398, 5, 32, 0, 0, 1398, 1399,
        5, 294, 0, 0, 1399, 1404, 3, 190, 95, 0, 1400, 1401, 5, 270, 0, 0, 1401, 1403, 3, 190, 95, 0, 1402, 1400, 1, 0,
        0, 0, 1403, 1406, 1, 0, 0, 0, 1404, 1402, 1, 0, 0, 0, 1404, 1405, 1, 0, 0, 0, 1405, 1407, 1, 0, 0, 0, 1406,
        1404, 1, 0, 0, 0, 1407, 1408, 5, 295, 0, 0, 1408, 219, 1, 0, 0, 0, 1409, 1411, 5, 23, 0, 0, 1410, 1412, 3, 190,
        95, 0, 1411, 1410, 1, 0, 0, 0, 1411, 1412, 1, 0, 0, 0, 1412, 1418, 1, 0, 0, 0, 1413, 1414, 5, 223, 0, 0, 1414,
        1415, 3, 190, 95, 0, 1415, 1416, 5, 200, 0, 0, 1416, 1417, 3, 190, 95, 0, 1417, 1419, 1, 0, 0, 0, 1418, 1413, 1,
        0, 0, 0, 1419, 1420, 1, 0, 0, 0, 1420, 1418, 1, 0, 0, 0, 1420, 1421, 1, 0, 0, 0, 1421, 1424, 1, 0, 0, 0, 1422,
        1423, 5, 71, 0, 0, 1423, 1425, 3, 190, 95, 0, 1424, 1422, 1, 0, 0, 0, 1424, 1425, 1, 0, 0, 0, 1425, 1426, 1, 0,
        0, 0, 1426, 1427, 5, 72, 0, 0, 1427, 221, 1, 0, 0, 0, 1428, 1429, 5, 219, 0, 0, 1429, 1434, 3, 224, 112, 0,
        1430, 1431, 5, 270, 0, 0, 1431, 1433, 3, 224, 112, 0, 1432, 1430, 1, 0, 0, 0, 1433, 1436, 1, 0, 0, 0, 1434,
        1432, 1, 0, 0, 0, 1434, 1435, 1, 0, 0, 0, 1435, 223, 1, 0, 0, 0, 1436, 1434, 1, 0, 0, 0, 1437, 1438, 5, 294, 0,
        0, 1438, 1443, 3, 190, 95, 0, 1439, 1440, 5, 270, 0, 0, 1440, 1442, 3, 190, 95, 0, 1441, 1439, 1, 0, 0, 0, 1442,
        1445, 1, 0, 0, 0, 1443, 1441, 1, 0, 0, 0, 1443, 1444, 1, 0, 0, 0, 1444, 1446, 1, 0, 0, 0, 1445, 1443, 1, 0, 0,
        0, 1446, 1447, 5, 295, 0, 0, 1447, 225, 1, 0, 0, 0, 1448, 1449, 5, 294, 0, 0, 1449, 1452, 3, 190, 95, 0, 1450,
        1451, 5, 270, 0, 0, 1451, 1453, 3, 190, 95, 0, 1452, 1450, 1, 0, 0, 0, 1453, 1454, 1, 0, 0, 0, 1454, 1452, 1, 0,
        0, 0, 1454, 1455, 1, 0, 0, 0, 1455, 1456, 1, 0, 0, 0, 1456, 1457, 5, 295, 0, 0, 1457, 227, 1, 0, 0, 0, 1458,
        1459, 7, 12, 0, 0, 1459, 1468, 5, 294, 0, 0, 1460, 1465, 3, 190, 95, 0, 1461, 1462, 5, 270, 0, 0, 1462, 1464, 3,
        190, 95, 0, 1463, 1461, 1, 0, 0, 0, 1464, 1467, 1, 0, 0, 0, 1465, 1463, 1, 0, 0, 0, 1465, 1466, 1, 0, 0, 0,
        1466, 1469, 1, 0, 0, 0, 1467, 1465, 1, 0, 0, 0, 1468, 1460, 1, 0, 0, 0, 1468, 1469, 1, 0, 0, 0, 1469, 1470, 1,
        0, 0, 0, 1470, 1471, 5, 295, 0, 0, 1471, 229, 1, 0, 0, 0, 1472, 1473, 5, 195, 0, 0, 1473, 1474, 5, 294, 0, 0,
        1474, 1481, 3, 190, 95, 0, 1475, 1476, 5, 270, 0, 0, 1476, 1479, 3, 190, 95, 0, 1477, 1478, 5, 270, 0, 0, 1478,
        1480, 3, 190, 95, 0, 1479, 1477, 1, 0, 0, 0, 1479, 1480, 1, 0, 0, 0, 1480, 1482, 1, 0, 0, 0, 1481, 1475, 1, 0,
        0, 0, 1481, 1482, 1, 0, 0, 0, 1482, 1483, 1, 0, 0, 0, 1483, 1484, 5, 295, 0, 0, 1484, 1499, 1, 0, 0, 0, 1485,
        1486, 5, 195, 0, 0, 1486, 1487, 5, 294, 0, 0, 1487, 1494, 3, 190, 95, 0, 1488, 1489, 5, 95, 0, 0, 1489, 1492, 3,
        190, 95, 0, 1490, 1491, 5, 92, 0, 0, 1491, 1493, 3, 190, 95, 0, 1492, 1490, 1, 0, 0, 0, 1492, 1493, 1, 0, 0, 0,
        1493, 1495, 1, 0, 0, 0, 1494, 1488, 1, 0, 0, 0, 1494, 1495, 1, 0, 0, 0, 1495, 1496, 1, 0, 0, 0, 1496, 1497, 5,
        295, 0, 0, 1497, 1499, 1, 0, 0, 0, 1498, 1472, 1, 0, 0, 0, 1498, 1485, 1, 0, 0, 0, 1499, 231, 1, 0, 0, 0, 1500,
        1501, 5, 160, 0, 0, 1501, 1502, 5, 294, 0, 0, 1502, 1503, 3, 190, 95, 0, 1503, 1504, 5, 270, 0, 0, 1504, 1505,
        3, 190, 95, 0, 1505, 1506, 5, 295, 0, 0, 1506, 1515, 1, 0, 0, 0, 1507, 1508, 5, 160, 0, 0, 1508, 1509, 5, 294,
        0, 0, 1509, 1510, 3, 190, 95, 0, 1510, 1511, 5, 106, 0, 0, 1511, 1512, 3, 190, 95, 0, 1512, 1513, 5, 295, 0, 0,
        1513, 1515, 1, 0, 0, 0, 1514, 1500, 1, 0, 0, 0, 1514, 1507, 1, 0, 0, 0, 1515, 233, 1, 0, 0, 0, 1516, 1517, 5,
        156, 0, 0, 1517, 1518, 5, 294, 0, 0, 1518, 1519, 3, 190, 95, 0, 1519, 1520, 5, 270, 0, 0, 1520, 1521, 3, 190,
        95, 0, 1521, 1522, 5, 270, 0, 0, 1522, 1525, 3, 190, 95, 0, 1523, 1524, 5, 270, 0, 0, 1524, 1526, 3, 190, 95, 0,
        1525, 1523, 1, 0, 0, 0, 1525, 1526, 1, 0, 0, 0, 1526, 1527, 1, 0, 0, 0, 1527, 1528, 5, 295, 0, 0, 1528, 1543, 1,
        0, 0, 0, 1529, 1530, 5, 156, 0, 0, 1530, 1531, 5, 294, 0, 0, 1531, 1532, 3, 190, 95, 0, 1532, 1533, 5, 159, 0,
        0, 1533, 1534, 3, 190, 95, 0, 1534, 1535, 5, 95, 0, 0, 1535, 1538, 3, 190, 95, 0, 1536, 1537, 5, 92, 0, 0, 1537,
        1539, 3, 190, 95, 0, 1538, 1536, 1, 0, 0, 0, 1538, 1539, 1, 0, 0, 0, 1539, 1540, 1, 0, 0, 0, 1540, 1541, 5, 295,
        0, 0, 1541, 1543, 1, 0, 0, 0, 1542, 1516, 1, 0, 0, 0, 1542, 1529, 1, 0, 0, 0, 1543, 235, 1, 0, 0, 0, 1544, 1545,
        5, 44, 0, 0, 1545, 1546, 5, 294, 0, 0, 1546, 1547, 5, 277, 0, 0, 1547, 1557, 5, 295, 0, 0, 1548, 1549, 7, 13, 0,
        0, 1549, 1551, 5, 294, 0, 0, 1550, 1552, 3, 102, 51, 0, 1551, 1550, 1, 0, 0, 0, 1551, 1552, 1, 0, 0, 0, 1552,
        1553, 1, 0, 0, 0, 1553, 1554, 3, 190, 95, 0, 1554, 1555, 5, 295, 0, 0, 1555, 1557, 1, 0, 0, 0, 1556, 1544, 1, 0,
        0, 0, 1556, 1548, 1, 0, 0, 0, 1557, 237, 1, 0, 0, 0, 1558, 1559, 7, 14, 0, 0, 1559, 1560, 5, 294, 0, 0, 1560,
        1567, 3, 190, 95, 0, 1561, 1562, 5, 270, 0, 0, 1562, 1565, 3, 190, 95, 0, 1563, 1564, 5, 270, 0, 0, 1564, 1566,
        3, 190, 95, 0, 1565, 1563, 1, 0, 0, 0, 1565, 1566, 1, 0, 0, 0, 1566, 1568, 1, 0, 0, 0, 1567, 1561, 1, 0, 0, 0,
        1567, 1568, 1, 0, 0, 0, 1568, 1569, 1, 0, 0, 0, 1569, 1570, 5, 295, 0, 0, 1570, 1571, 3, 118, 59, 0, 1571, 239,
        1, 0, 0, 0, 1572, 1573, 5, 24, 0, 0, 1573, 1574, 5, 294, 0, 0, 1574, 1575, 3, 190, 95, 0, 1575, 1576, 5, 10, 0,
        0, 1576, 1577, 3, 280, 140, 0, 1577, 1578, 5, 295, 0, 0, 1578, 241, 1, 0, 0, 0, 1579, 1580, 5, 235, 0, 0, 1580,
        1581, 5, 294, 0, 0, 1581, 1582, 3, 190, 95, 0, 1582, 1583, 5, 10, 0, 0, 1583, 1584, 3, 280, 140, 0, 1584, 1585,
        5, 295, 0, 0, 1585, 243, 1, 0, 0, 0, 1586, 1587, 5, 234, 0, 0, 1587, 1588, 5, 294, 0, 0, 1588, 1589, 3, 190, 95,
        0, 1589, 1590, 5, 10, 0, 0, 1590, 1591, 3, 280, 140, 0, 1591, 1592, 5, 295, 0, 0, 1592, 245, 1, 0, 0, 0, 1593,
        1594, 5, 85, 0, 0, 1594, 1595, 5, 294, 0, 0, 1595, 1596, 5, 303, 0, 0, 1596, 1597, 5, 95, 0, 0, 1597, 1598, 3,
        190, 95, 0, 1598, 1599, 5, 295, 0, 0, 1599, 247, 1, 0, 0, 0, 1600, 1601, 5, 207, 0, 0, 1601, 1609, 5, 294, 0, 0,
        1602, 1604, 5, 303, 0, 0, 1603, 1602, 1, 0, 0, 0, 1603, 1604, 1, 0, 0, 0, 1604, 1606, 1, 0, 0, 0, 1605, 1607, 3,
        190, 95, 0, 1606, 1605, 1, 0, 0, 0, 1606, 1607, 1, 0, 0, 0, 1607, 1608, 1, 0, 0, 0, 1608, 1610, 5, 95, 0, 0,
        1609, 1603, 1, 0, 0, 0, 1609, 1610, 1, 0, 0, 0, 1610, 1611, 1, 0, 0, 0, 1611, 1612, 3, 190, 95, 0, 1612, 1613,
        5, 295, 0, 0, 1613, 249, 1, 0, 0, 0, 1614, 1615, 7, 15, 0, 0, 1615, 1616, 5, 294, 0, 0, 1616, 1617, 5, 303, 0,
        0, 1617, 1618, 5, 270, 0, 0, 1618, 1619, 3, 190, 95, 0, 1619, 1620, 5, 270, 0, 0, 1620, 1621, 3, 190, 95, 0,
        1621, 1622, 5, 295, 0, 0, 1622, 251, 1, 0, 0, 0, 1623, 1624, 3, 254, 127, 0, 1624, 1633, 5, 294, 0, 0, 1625,
        1630, 3, 190, 95, 0, 1626, 1627, 5, 270, 0, 0, 1627, 1629, 3, 190, 95, 0, 1628, 1626, 1, 0, 0, 0, 1629, 1632, 1,
        0, 0, 0, 1630, 1628, 1, 0, 0, 0, 1630, 1631, 1, 0, 0, 0, 1631, 1634, 1, 0, 0, 0, 1632, 1630, 1, 0, 0, 0, 1633,
        1625, 1, 0, 0, 0, 1633, 1634, 1, 0, 0, 0, 1634, 1635, 1, 0, 0, 0, 1635, 1636, 5, 295, 0, 0, 1636, 253, 1, 0, 0,
        0, 1637, 1638, 3, 14, 7, 0, 1638, 1639, 5, 299, 0, 0, 1639, 1641, 1, 0, 0, 0, 1640, 1637, 1, 0, 0, 0, 1641,
        1644, 1, 0, 0, 0, 1642, 1640, 1, 0, 0, 0, 1642, 1643, 1, 0, 0, 0, 1643, 1645, 1, 0, 0, 0, 1644, 1642, 1, 0, 0,
        0, 1645, 1656, 7, 16, 0, 0, 1646, 1647, 3, 14, 7, 0, 1647, 1648, 5, 299, 0, 0, 1648, 1650, 1, 0, 0, 0, 1649,
        1646, 1, 0, 0, 0, 1650, 1653, 1, 0, 0, 0, 1651, 1649, 1, 0, 0, 0, 1651, 1652, 1, 0, 0, 0, 1652, 1654, 1, 0, 0,
        0, 1653, 1651, 1, 0, 0, 0, 1654, 1656, 3, 14, 7, 0, 1655, 1642, 1, 0, 0, 0, 1655, 1651, 1, 0, 0, 0, 1656, 255,
        1, 0, 0, 0, 1657, 1658, 5, 290, 0, 0, 1658, 1659, 3, 190, 95, 0, 1659, 1660, 5, 291, 0, 0, 1660, 1669, 1, 0, 0,
        0, 1661, 1662, 5, 290, 0, 0, 1662, 1663, 5, 277, 0, 0, 1663, 1669, 5, 291, 0, 0, 1664, 1665, 5, 299, 0, 0, 1665,
        1669, 3, 14, 7, 0, 1666, 1667, 5, 299, 0, 0, 1667, 1669, 5, 277, 0, 0, 1668, 1657, 1, 0, 0, 0, 1668, 1661, 1, 0,
        0, 0, 1668, 1664, 1, 0, 0, 0, 1668, 1666, 1, 0, 0, 0, 1669, 257, 1, 0, 0, 0, 1670, 1671, 5, 294, 0, 0, 1671,
        1672, 3, 212, 106, 0, 1672, 1673, 5, 130, 0, 0, 1673, 1674, 3, 142, 71, 0, 1674, 1675, 5, 295, 0, 0, 1675, 259,
        1, 0, 0, 0, 1676, 1677, 3, 212, 106, 0, 1677, 1678, 5, 130, 0, 0, 1678, 1679, 3, 140, 70, 0, 1679, 261, 1, 0, 0,
        0, 1680, 1681, 5, 298, 0, 0, 1681, 263, 1, 0, 0, 0, 1682, 1684, 5, 275, 0, 0, 1683, 1682, 1, 0, 0, 0, 1683,
        1684, 1, 0, 0, 0, 1684, 1685, 1, 0, 0, 0, 1685, 1691, 7, 0, 0, 0, 1686, 1688, 5, 275, 0, 0, 1687, 1686, 1, 0, 0,
        0, 1687, 1688, 1, 0, 0, 0, 1688, 1689, 1, 0, 0, 0, 1689, 1691, 3, 266, 133, 0, 1690, 1683, 1, 0, 0, 0, 1690,
        1687, 1, 0, 0, 0, 1691, 265, 1, 0, 0, 0, 1692, 1693, 5, 79, 0, 0, 1693, 267, 1, 0, 0, 0, 1694, 1697, 3, 270,
        135, 0, 1695, 1697, 3, 272, 136, 0, 1696, 1694, 1, 0, 0, 0, 1696, 1695, 1, 0, 0, 0, 1697, 269, 1, 0, 0, 0, 1698,
        1707, 5, 290, 0, 0, 1699, 1704, 3, 190, 95, 0, 1700, 1701, 5, 270, 0, 0, 1701, 1703, 3, 190, 95, 0, 1702, 1700,
        1, 0, 0, 0, 1703, 1706, 1, 0, 0, 0, 1704, 1702, 1, 0, 0, 0, 1704, 1705, 1, 0, 0, 0, 1705, 1708, 1, 0, 0, 0,
        1706, 1704, 1, 0, 0, 0, 1707, 1699, 1, 0, 0, 0, 1707, 1708, 1, 0, 0, 0, 1708, 1709, 1, 0, 0, 0, 1709, 1710, 5,
        291, 0, 0, 1710, 271, 1, 0, 0, 0, 1711, 1720, 5, 288, 0, 0, 1712, 1717, 3, 190, 95, 0, 1713, 1714, 5, 270, 0, 0,
        1714, 1716, 3, 190, 95, 0, 1715, 1713, 1, 0, 0, 0, 1716, 1719, 1, 0, 0, 0, 1717, 1715, 1, 0, 0, 0, 1717, 1718,
        1, 0, 0, 0, 1718, 1721, 1, 0, 0, 0, 1719, 1717, 1, 0, 0, 0, 1720, 1712, 1, 0, 0, 0, 1720, 1721, 1, 0, 0, 0,
        1721, 1722, 1, 0, 0, 0, 1722, 1723, 5, 289, 0, 0, 1723, 273, 1, 0, 0, 0, 1724, 1733, 5, 292, 0, 0, 1725, 1730,
        3, 276, 138, 0, 1726, 1727, 5, 270, 0, 0, 1727, 1729, 3, 276, 138, 0, 1728, 1726, 1, 0, 0, 0, 1729, 1732, 1, 0,
        0, 0, 1730, 1728, 1, 0, 0, 0, 1730, 1731, 1, 0, 0, 0, 1731, 1734, 1, 0, 0, 0, 1732, 1730, 1, 0, 0, 0, 1733,
        1725, 1, 0, 0, 0, 1733, 1734, 1, 0, 0, 0, 1734, 1735, 1, 0, 0, 0, 1735, 1736, 5, 293, 0, 0, 1736, 275, 1, 0, 0,
        0, 1737, 1738, 3, 190, 95, 0, 1738, 1739, 5, 296, 0, 0, 1739, 1740, 3, 190, 95, 0, 1740, 277, 1, 0, 0, 0, 1741,
        1776, 5, 141, 0, 0, 1742, 1776, 5, 236, 0, 0, 1743, 1776, 5, 208, 0, 0, 1744, 1776, 5, 88, 0, 0, 1745, 1776, 5,
        300, 0, 0, 1746, 1776, 5, 301, 0, 0, 1747, 1776, 5, 302, 0, 0, 1748, 1776, 5, 309, 0, 0, 1749, 1750, 5, 53, 0,
        0, 1750, 1776, 5, 300, 0, 0, 1751, 1755, 5, 201, 0, 0, 1752, 1753, 5, 294, 0, 0, 1753, 1754, 5, 301, 0, 0, 1754,
        1756, 5, 295, 0, 0, 1755, 1752, 1, 0, 0, 0, 1755, 1756, 1, 0, 0, 0, 1756, 1760, 1, 0, 0, 0, 1757, 1758, 5, 226,
        0, 0, 1758, 1759, 5, 201, 0, 0, 1759, 1761, 5, 229, 0, 0, 1760, 1757, 1, 0, 0, 0, 1760, 1761, 1, 0, 0, 0, 1761,
        1762, 1, 0, 0, 0, 1762, 1776, 5, 300, 0, 0, 1763, 1767, 5, 202, 0, 0, 1764, 1765, 5, 294, 0, 0, 1765, 1766, 5,
        301, 0, 0, 1766, 1768, 5, 295, 0, 0, 1767, 1764, 1, 0, 0, 0, 1767, 1768, 1, 0, 0, 0, 1768, 1772, 1, 0, 0, 0,
        1769, 1770, 5, 226, 0, 0, 1770, 1771, 5, 201, 0, 0, 1771, 1773, 5, 229, 0, 0, 1772, 1769, 1, 0, 0, 0, 1772,
        1773, 1, 0, 0, 0, 1773, 1774, 1, 0, 0, 0, 1774, 1776, 5, 300, 0, 0, 1775, 1741, 1, 0, 0, 0, 1775, 1742, 1, 0, 0,
        0, 1775, 1743, 1, 0, 0, 0, 1775, 1744, 1, 0, 0, 0, 1775, 1745, 1, 0, 0, 0, 1775, 1746, 1, 0, 0, 0, 1775, 1747,
        1, 0, 0, 0, 1775, 1748, 1, 0, 0, 0, 1775, 1749, 1, 0, 0, 0, 1775, 1751, 1, 0, 0, 0, 1775, 1763, 1, 0, 0, 0,
        1776, 279, 1, 0, 0, 0, 1777, 1816, 7, 17, 0, 0, 1778, 1779, 5, 69, 0, 0, 1779, 1816, 5, 161, 0, 0, 1780, 1784,
        7, 18, 0, 0, 1781, 1782, 5, 294, 0, 0, 1782, 1783, 5, 301, 0, 0, 1783, 1785, 5, 295, 0, 0, 1784, 1781, 1, 0, 0,
        0, 1784, 1785, 1, 0, 0, 0, 1785, 1816, 1, 0, 0, 0, 1786, 1787, 5, 27, 0, 0, 1787, 1791, 5, 221, 0, 0, 1788,
        1789, 5, 294, 0, 0, 1789, 1790, 5, 301, 0, 0, 1790, 1792, 5, 295, 0, 0, 1791, 1788, 1, 0, 0, 0, 1791, 1792, 1,
        0, 0, 0, 1792, 1816, 1, 0, 0, 0, 1793, 1801, 7, 19, 0, 0, 1794, 1795, 5, 294, 0, 0, 1795, 1798, 5, 301, 0, 0,
        1796, 1797, 5, 270, 0, 0, 1797, 1799, 5, 301, 0, 0, 1798, 1796, 1, 0, 0, 0, 1798, 1799, 1, 0, 0, 0, 1799, 1800,
        1, 0, 0, 0, 1800, 1802, 5, 295, 0, 0, 1801, 1794, 1, 0, 0, 0, 1801, 1802, 1, 0, 0, 0, 1802, 1816, 1, 0, 0, 0,
        1803, 1807, 7, 20, 0, 0, 1804, 1805, 5, 294, 0, 0, 1805, 1806, 5, 301, 0, 0, 1806, 1808, 5, 295, 0, 0, 1807,
        1804, 1, 0, 0, 0, 1807, 1808, 1, 0, 0, 0, 1808, 1812, 1, 0, 0, 0, 1809, 1810, 5, 226, 0, 0, 1810, 1811, 5, 201,
        0, 0, 1811, 1813, 5, 229, 0, 0, 1812, 1809, 1, 0, 0, 0, 1812, 1813, 1, 0, 0, 0, 1813, 1816, 1, 0, 0, 0, 1814,
        1816, 3, 14, 7, 0, 1815, 1777, 1, 0, 0, 0, 1815, 1778, 1, 0, 0, 0, 1815, 1780, 1, 0, 0, 0, 1815, 1786, 1, 0, 0,
        0, 1815, 1793, 1, 0, 0, 0, 1815, 1803, 1, 0, 0, 0, 1815, 1814, 1, 0, 0, 0, 1816, 281, 1, 0, 0, 0, 226, 284, 288,
        299, 304, 306, 314, 339, 342, 349, 364, 373, 385, 390, 401, 408, 416, 425, 432, 437, 444, 450, 453, 456, 460,
        465, 468, 473, 481, 487, 500, 506, 514, 528, 531, 534, 540, 544, 549, 560, 563, 578, 586, 598, 603, 608, 619,
        629, 632, 640, 649, 654, 657, 660, 666, 673, 678, 683, 692, 699, 704, 707, 717, 731, 736, 740, 744, 752, 756,
        765, 770, 773, 784, 794, 806, 813, 828, 843, 848, 855, 859, 862, 867, 873, 879, 884, 886, 895, 899, 902, 908,
        912, 914, 918, 921, 926, 929, 933, 937, 940, 945, 948, 952, 954, 961, 964, 1000, 1004, 1008, 1011, 1023, 1034,
        1040, 1048, 1056, 1060, 1062, 1070, 1074, 1084, 1090, 1092, 1097, 1104, 1107, 1110, 1114, 1117, 1120, 1122,
        1127, 1130, 1133, 1140, 1148, 1152, 1156, 1159, 1168, 1172, 1177, 1181, 1186, 1190, 1193, 1195, 1200, 1204,
        1207, 1210, 1213, 1216, 1219, 1222, 1225, 1235, 1246, 1252, 1263, 1268, 1277, 1283, 1289, 1293, 1300, 1302,
        1313, 1324, 1335, 1341, 1364, 1370, 1374, 1388, 1404, 1411, 1420, 1424, 1434, 1443, 1454, 1465, 1468, 1479,
        1481, 1492, 1494, 1498, 1514, 1525, 1538, 1542, 1551, 1556, 1565, 1567, 1603, 1606, 1609, 1630, 1633, 1642,
        1651, 1655, 1668, 1683, 1687, 1690, 1696, 1704, 1707, 1717, 1720, 1730, 1733, 1755, 1760, 1767, 1772, 1775,
        1784, 1791, 1798, 1801, 1807, 1812, 1815,
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
export class PrimaryKeyContext extends TableDefPartContext {
    public constructor(ctx: TableDefPartContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public PRIMARY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.PRIMARY, 0)!
    }
    public KEY(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.KEY, 0)!
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public columnDef(): ColumnDefContext | null {
        return this.getRuleContext(0, ColumnDefContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
}

export class ColumnDefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public columnName(): ColumnNameContext[]
    public columnName(i: number): ColumnNameContext | null
    public columnName(i?: number): ColumnNameContext[] | ColumnNameContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ColumnNameContext)
        }

        return this.getRuleContext(i, ColumnNameContext)
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
        return PartiQLParser.RULE_columnDef
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
