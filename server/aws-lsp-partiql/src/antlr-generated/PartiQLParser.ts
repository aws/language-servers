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
    public static readonly RULE_explainOption = 2
    public static readonly RULE_asIdent = 3
    public static readonly RULE_atIdent = 4
    public static readonly RULE_byIdent = 5
    public static readonly RULE_symbolPrimitive = 6
    public static readonly RULE_dql = 7
    public static readonly RULE_execCommand = 8
    public static readonly RULE_qualifiedName = 9
    public static readonly RULE_tableName = 10
    public static readonly RULE_tableConstraintName = 11
    public static readonly RULE_columnName = 12
    public static readonly RULE_columnConstraintName = 13
    public static readonly RULE_ddl = 14
    public static readonly RULE_createCommand = 15
    public static readonly RULE_dropCommand = 16
    public static readonly RULE_tableDef = 17
    public static readonly RULE_tableDefPart = 18
    public static readonly RULE_columnConstraint = 19
    public static readonly RULE_columnConstraintDef = 20
    public static readonly RULE_dml = 21
    public static readonly RULE_dmlBaseCommand = 22
    public static readonly RULE_pathSimple = 23
    public static readonly RULE_pathSimpleSteps = 24
    public static readonly RULE_replaceCommand = 25
    public static readonly RULE_upsertCommand = 26
    public static readonly RULE_removeCommand = 27
    public static readonly RULE_insertCommandReturning = 28
    public static readonly RULE_insertStatement = 29
    public static readonly RULE_onConflict = 30
    public static readonly RULE_insertStatementLegacy = 31
    public static readonly RULE_onConflictLegacy = 32
    public static readonly RULE_conflictTarget = 33
    public static readonly RULE_constraintName = 34
    public static readonly RULE_conflictAction = 35
    public static readonly RULE_doReplace = 36
    public static readonly RULE_doUpdate = 37
    public static readonly RULE_updateClause = 38
    public static readonly RULE_setCommand = 39
    public static readonly RULE_setAssignment = 40
    public static readonly RULE_deleteCommand = 41
    public static readonly RULE_returningClause = 42
    public static readonly RULE_returningColumn = 43
    public static readonly RULE_fromClauseSimple = 44
    public static readonly RULE_whereClause = 45
    public static readonly RULE_selectClause = 46
    public static readonly RULE_projectionItems = 47
    public static readonly RULE_projectionItem = 48
    public static readonly RULE_setQuantifierStrategy = 49
    public static readonly RULE_letClause = 50
    public static readonly RULE_letBinding = 51
    public static readonly RULE_orderByClause = 52
    public static readonly RULE_orderSortSpec = 53
    public static readonly RULE_groupClause = 54
    public static readonly RULE_groupAlias = 55
    public static readonly RULE_groupKey = 56
    public static readonly RULE_over = 57
    public static readonly RULE_windowPartitionList = 58
    public static readonly RULE_windowSortSpecList = 59
    public static readonly RULE_havingClause = 60
    public static readonly RULE_excludeClause = 61
    public static readonly RULE_excludeExpr = 62
    public static readonly RULE_excludeExprSteps = 63
    public static readonly RULE_fromClause = 64
    public static readonly RULE_whereClauseSelect = 65
    public static readonly RULE_offsetByClause = 66
    public static readonly RULE_limitClause = 67
    public static readonly RULE_gpmlPattern = 68
    public static readonly RULE_gpmlPatternList = 69
    public static readonly RULE_matchPattern = 70
    public static readonly RULE_graphPart = 71
    public static readonly RULE_matchSelector = 72
    public static readonly RULE_patternPathVariable = 73
    public static readonly RULE_patternRestrictor = 74
    public static readonly RULE_node = 75
    public static readonly RULE_edge = 76
    public static readonly RULE_pattern = 77
    public static readonly RULE_patternQuantifier = 78
    public static readonly RULE_edgeWSpec = 79
    public static readonly RULE_edgeSpec = 80
    public static readonly RULE_labelSpec = 81
    public static readonly RULE_labelTerm = 82
    public static readonly RULE_labelFactor = 83
    public static readonly RULE_labelPrimary = 84
    public static readonly RULE_edgeAbbrev = 85
    public static readonly RULE_tableReference = 86
    public static readonly RULE_tableNonJoin = 87
    public static readonly RULE_tableBaseReference = 88
    public static readonly RULE_tableUnpivot = 89
    public static readonly RULE_joinRhs = 90
    public static readonly RULE_joinSpec = 91
    public static readonly RULE_joinType = 92
    public static readonly RULE_expr = 93
    public static readonly RULE_exprBagOp = 94
    public static readonly RULE_exprSelect = 95
    public static readonly RULE_exprOr = 96
    public static readonly RULE_exprAnd = 97
    public static readonly RULE_exprNot = 98
    public static readonly RULE_exprPredicate = 99
    public static readonly RULE_mathOp00 = 100
    public static readonly RULE_mathOp01 = 101
    public static readonly RULE_mathOp02 = 102
    public static readonly RULE_valueExpr = 103
    public static readonly RULE_exprPrimary = 104
    public static readonly RULE_exprTerm = 105
    public static readonly RULE_nullIf = 106
    public static readonly RULE_coalesce = 107
    public static readonly RULE_caseExpr = 108
    public static readonly RULE_values = 109
    public static readonly RULE_valueRow = 110
    public static readonly RULE_valueList = 111
    public static readonly RULE_sequenceConstructor = 112
    public static readonly RULE_substring = 113
    public static readonly RULE_position = 114
    public static readonly RULE_overlay = 115
    public static readonly RULE_aggregate = 116
    public static readonly RULE_windowFunction = 117
    public static readonly RULE_cast = 118
    public static readonly RULE_canLosslessCast = 119
    public static readonly RULE_canCast = 120
    public static readonly RULE_extract = 121
    public static readonly RULE_trimFunction = 122
    public static readonly RULE_dateFunction = 123
    public static readonly RULE_functionCall = 124
    public static readonly RULE_functionName = 125
    public static readonly RULE_pathStep = 126
    public static readonly RULE_exprGraphMatchMany = 127
    public static readonly RULE_exprGraphMatchOne = 128
    public static readonly RULE_parameter = 129
    public static readonly RULE_varRefExpr = 130
    public static readonly RULE_nonReservedKeywords = 131
    public static readonly RULE_collection = 132
    public static readonly RULE_array = 133
    public static readonly RULE_bag = 134
    public static readonly RULE_tuple = 135
    public static readonly RULE_pair = 136
    public static readonly RULE_literal = 137
    public static readonly RULE_type = 138

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
        let localContext = new RootContext(this.context, this.state)
        this.enterRule(localContext, 0, PartiQLParser.RULE_root)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 292
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 83) {
                    {
                        this.state = 278
                        this.match(PartiQLParser.EXPLAIN)
                        this.state = 290
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 1, this.context)) {
                            case 1:
                                {
                                    this.state = 279
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 280
                                    this.explainOption()
                                    this.state = 285
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    while (_la === 270) {
                                        {
                                            {
                                                this.state = 281
                                                this.match(PartiQLParser.COMMA)
                                                this.state = 282
                                                this.explainOption()
                                            }
                                        }
                                        this.state = 287
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                    }
                                    this.state = 288
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                }

                this.state = 294
                this.statement()
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
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
            this.state = 320
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
                        this.state = 296
                        this.dql()
                        this.state = 298
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 297) {
                            {
                                this.state = 297
                                this.match(PartiQLParser.COLON_SEMI)
                            }
                        }

                        this.state = 300
                        this.match(PartiQLParser.EOF)
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
                        this.state = 302
                        this.dml()
                        this.state = 304
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 297) {
                            {
                                this.state = 303
                                this.match(PartiQLParser.COLON_SEMI)
                            }
                        }

                        this.state = 306
                        this.match(PartiQLParser.EOF)
                    }
                    break
                case PartiQLParser.CREATE:
                case PartiQLParser.DROP:
                    localContext = new QueryDdlContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 308
                        this.ddl()
                        this.state = 310
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 297) {
                            {
                                this.state = 309
                                this.match(PartiQLParser.COLON_SEMI)
                            }
                        }

                        this.state = 312
                        this.match(PartiQLParser.EOF)
                    }
                    break
                case PartiQLParser.EXEC:
                    localContext = new QueryExecContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 314
                        this.execCommand()
                        this.state = 316
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 297) {
                            {
                                this.state = 315
                                this.match(PartiQLParser.COLON_SEMI)
                            }
                        }

                        this.state = 318
                        this.match(PartiQLParser.EOF)
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
        this.enterRule(localContext, 4, PartiQLParser.RULE_explainOption)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 322
                localContext._param = this.match(PartiQLParser.IDENTIFIER)
                this.state = 323
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
        this.enterRule(localContext, 6, PartiQLParser.RULE_asIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 325
                this.match(PartiQLParser.AS)
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
    public atIdent(): AtIdentContext {
        let localContext = new AtIdentContext(this.context, this.state)
        this.enterRule(localContext, 8, PartiQLParser.RULE_atIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 328
                this.match(PartiQLParser.AT)
                this.state = 329
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
        this.enterRule(localContext, 10, PartiQLParser.RULE_byIdent)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 331
                this.match(PartiQLParser.BY)
                this.state = 332
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
        this.enterRule(localContext, 12, PartiQLParser.RULE_symbolPrimitive)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 334
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
        this.enterRule(localContext, 14, PartiQLParser.RULE_dql)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 336
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
        this.enterRule(localContext, 16, PartiQLParser.RULE_execCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 338
                this.match(PartiQLParser.EXEC)
                this.state = 339
                localContext._name = this.expr()
                this.state = 348
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
                        this.state = 340
                        localContext._expr = this.expr()
                        localContext._args.push(localContext._expr!)
                        this.state = 345
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 341
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 342
                                    localContext._expr = this.expr()
                                    localContext._args.push(localContext._expr!)
                                }
                            }
                            this.state = 347
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
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
    public qualifiedName(): QualifiedNameContext {
        let localContext = new QualifiedNameContext(this.context, this.state)
        this.enterRule(localContext, 18, PartiQLParser.RULE_qualifiedName)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 355
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 10, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 350
                                localContext._symbolPrimitive = this.symbolPrimitive()
                                localContext._qualifier.push(localContext._symbolPrimitive!)
                                this.state = 351
                                this.match(PartiQLParser.PERIOD)
                            }
                        }
                    }
                    this.state = 357
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 10, this.context)
                }
                this.state = 358
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
        this.enterRule(localContext, 20, PartiQLParser.RULE_tableName)
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
    public tableConstraintName(): TableConstraintNameContext {
        let localContext = new TableConstraintNameContext(this.context, this.state)
        this.enterRule(localContext, 22, PartiQLParser.RULE_tableConstraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 362
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
        this.enterRule(localContext, 24, PartiQLParser.RULE_columnName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 364
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
        this.enterRule(localContext, 26, PartiQLParser.RULE_columnConstraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 366
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
        this.enterRule(localContext, 28, PartiQLParser.RULE_ddl)
        try {
            this.state = 370
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.CREATE:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 368
                        this.createCommand()
                    }
                    break
                case PartiQLParser.DROP:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 369
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
        this.enterRule(localContext, 30, PartiQLParser.RULE_createCommand)
        let _la: number
        try {
            this.state = 396
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context)) {
                case 1:
                    localContext = new CreateTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 372
                        this.match(PartiQLParser.CREATE)
                        this.state = 373
                        this.match(PartiQLParser.TABLE)
                        this.state = 374
                        this.qualifiedName()
                        this.state = 379
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 375
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 376
                                this.tableDef()
                                this.state = 377
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new CreateIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 381
                        this.match(PartiQLParser.CREATE)
                        this.state = 382
                        this.match(PartiQLParser.INDEX)
                        this.state = 383
                        this.match(PartiQLParser.ON)
                        this.state = 384
                        this.symbolPrimitive()
                        this.state = 385
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 386
                        this.pathSimple()
                        this.state = 391
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 387
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 388
                                    this.pathSimple()
                                }
                            }
                            this.state = 393
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 394
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
        this.enterRule(localContext, 32, PartiQLParser.RULE_dropCommand)
        try {
            this.state = 407
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 15, this.context)) {
                case 1:
                    localContext = new DropTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 398
                        this.match(PartiQLParser.DROP)
                        this.state = 399
                        this.match(PartiQLParser.TABLE)
                        this.state = 400
                        this.qualifiedName()
                    }
                    break
                case 2:
                    localContext = new DropIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 401
                        this.match(PartiQLParser.DROP)
                        this.state = 402
                        this.match(PartiQLParser.INDEX)
                        this.state = 403
                        ;(localContext as DropIndexContext)._target = this.symbolPrimitive()
                        this.state = 404
                        this.match(PartiQLParser.ON)
                        this.state = 405
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
        this.enterRule(localContext, 34, PartiQLParser.RULE_tableDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 409
                this.tableDefPart()
                this.state = 414
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 410
                            this.match(PartiQLParser.COMMA)
                            this.state = 411
                            this.tableDefPart()
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
    public tableDefPart(): TableDefPartContext {
        let localContext = new TableDefPartContext(this.context, this.state)
        this.enterRule(localContext, 36, PartiQLParser.RULE_tableDefPart)
        let _la: number
        try {
            localContext = new ColumnDeclarationContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 417
                this.columnName()
                this.state = 418
                this.type_()
                this.state = 422
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 39 || _la === 140 || _la === 141) {
                    {
                        {
                            this.state = 419
                            this.columnConstraint()
                        }
                    }
                    this.state = 424
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
        this.enterRule(localContext, 38, PartiQLParser.RULE_columnConstraint)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 427
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 39) {
                    {
                        this.state = 425
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 426
                        this.columnConstraintName()
                    }
                }

                this.state = 429
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
        this.enterRule(localContext, 40, PartiQLParser.RULE_columnConstraintDef)
        try {
            this.state = 434
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new ColConstrNotNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 431
                        this.match(PartiQLParser.NOT)
                        this.state = 432
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.NULL:
                    localContext = new ColConstrNullContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 433
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
        this.enterRule(localContext, 42, PartiQLParser.RULE_dml)
        let _la: number
        try {
            this.state = 463
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 26, this.context)) {
                case 1:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 436
                        this.updateClause()
                        this.state = 438
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 437
                                    this.dmlBaseCommand()
                                }
                            }
                            this.state = 440
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (_la === 112 || _la === 173 || _la === 185 || _la === 214 || _la === 241)
                        this.state = 443
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 442
                                this.whereClause()
                            }
                        }

                        this.state = 446
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 445
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 448
                        this.fromClause()
                        this.state = 450
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 449
                                this.whereClause()
                            }
                        }

                        this.state = 453
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 452
                                    this.dmlBaseCommand()
                                }
                            }
                            this.state = 455
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (_la === 112 || _la === 173 || _la === 185 || _la === 214 || _la === 241)
                        this.state = 458
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 457
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 3:
                    localContext = new DmlDeleteContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 460
                        this.deleteCommand()
                    }
                    break
                case 4:
                    localContext = new DmlInsertReturningContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 461
                        this.insertCommandReturning()
                    }
                    break
                case 5:
                    localContext = new DmlBaseContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 462
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
        this.enterRule(localContext, 44, PartiQLParser.RULE_dmlBaseCommand)
        try {
            this.state = 471
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 27, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 465
                        this.insertStatement()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 466
                        this.insertStatementLegacy()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 467
                        this.setCommand()
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 468
                        this.replaceCommand()
                    }
                    break
                case 5:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 469
                        this.removeCommand()
                    }
                    break
                case 6:
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 470
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
        this.enterRule(localContext, 46, PartiQLParser.RULE_pathSimple)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 473
                this.symbolPrimitive()
                this.state = 477
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 290 || _la === 299) {
                    {
                        {
                            this.state = 474
                            this.pathSimpleSteps()
                        }
                    }
                    this.state = 479
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
    public pathSimpleSteps(): PathSimpleStepsContext {
        let localContext = new PathSimpleStepsContext(this.context, this.state)
        this.enterRule(localContext, 48, PartiQLParser.RULE_pathSimpleSteps)
        try {
            this.state = 490
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 29, this.context)) {
                case 1:
                    localContext = new PathSimpleLiteralContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 480
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 481
                        ;(localContext as PathSimpleLiteralContext)._key = this.literal()
                        this.state = 482
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathSimpleSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 484
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 485
                        ;(localContext as PathSimpleSymbolContext)._key = this.symbolPrimitive()
                        this.state = 486
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathSimpleDotSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 488
                        this.match(PartiQLParser.PERIOD)
                        this.state = 489
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
        this.enterRule(localContext, 50, PartiQLParser.RULE_replaceCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 492
                this.match(PartiQLParser.REPLACE)
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
    public upsertCommand(): UpsertCommandContext {
        let localContext = new UpsertCommandContext(this.context, this.state)
        this.enterRule(localContext, 52, PartiQLParser.RULE_upsertCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 500
                this.match(PartiQLParser.UPSERT)
                this.state = 501
                this.match(PartiQLParser.INTO)
                this.state = 502
                this.symbolPrimitive()
                this.state = 504
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 503
                        this.asIdent()
                    }
                }

                this.state = 506
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
        this.enterRule(localContext, 54, PartiQLParser.RULE_removeCommand)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 508
                this.match(PartiQLParser.REMOVE)
                this.state = 509
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
        this.enterRule(localContext, 56, PartiQLParser.RULE_insertCommandReturning)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 511
                this.match(PartiQLParser.INSERT)
                this.state = 512
                this.match(PartiQLParser.INTO)
                this.state = 513
                this.pathSimple()
                this.state = 514
                this.match(PartiQLParser.VALUE)
                this.state = 515
                localContext._value = this.expr()
                this.state = 518
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 516
                        this.match(PartiQLParser.AT)
                        this.state = 517
                        localContext._pos = this.expr()
                    }
                }

                this.state = 521
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 520
                        this.onConflictLegacy()
                    }
                }

                this.state = 524
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 523
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
        this.enterRule(localContext, 58, PartiQLParser.RULE_insertStatement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 526
                this.match(PartiQLParser.INSERT)
                this.state = 527
                this.match(PartiQLParser.INTO)
                this.state = 528
                this.symbolPrimitive()
                this.state = 530
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 529
                        this.asIdent()
                    }
                }

                this.state = 532
                localContext._value = this.expr()
                this.state = 534
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 533
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
        this.enterRule(localContext, 60, PartiQLParser.RULE_onConflict)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 536
                this.match(PartiQLParser.ON)
                this.state = 537
                this.match(PartiQLParser.CONFLICT)
                this.state = 539
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147 || _la === 294) {
                    {
                        this.state = 538
                        this.conflictTarget()
                    }
                }

                this.state = 541
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
        this.enterRule(localContext, 62, PartiQLParser.RULE_insertStatementLegacy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 543
                this.match(PartiQLParser.INSERT)
                this.state = 544
                this.match(PartiQLParser.INTO)
                this.state = 545
                this.pathSimple()
                this.state = 546
                this.match(PartiQLParser.VALUE)
                this.state = 547
                localContext._value = this.expr()
                this.state = 550
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 548
                        this.match(PartiQLParser.AT)
                        this.state = 549
                        localContext._pos = this.expr()
                    }
                }

                this.state = 553
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 552
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
        this.enterRule(localContext, 64, PartiQLParser.RULE_onConflictLegacy)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 555
                this.match(PartiQLParser.ON)
                this.state = 556
                this.match(PartiQLParser.CONFLICT)
                this.state = 557
                this.match(PartiQLParser.WHERE)
                this.state = 558
                this.expr()
                this.state = 559
                this.match(PartiQLParser.DO)
                this.state = 560
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
        this.enterRule(localContext, 66, PartiQLParser.RULE_conflictTarget)
        let _la: number
        try {
            this.state = 576
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 562
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 563
                        this.symbolPrimitive()
                        this.state = 568
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 564
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 565
                                    this.symbolPrimitive()
                                }
                            }
                            this.state = 570
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 571
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.ON:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 573
                        this.match(PartiQLParser.ON)
                        this.state = 574
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 575
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
        this.enterRule(localContext, 68, PartiQLParser.RULE_constraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 578
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
        this.enterRule(localContext, 70, PartiQLParser.RULE_conflictAction)
        try {
            this.state = 588
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 42, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 580
                        this.match(PartiQLParser.DO)
                        this.state = 581
                        this.match(PartiQLParser.NOTHING)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 582
                        this.match(PartiQLParser.DO)
                        this.state = 583
                        this.match(PartiQLParser.REPLACE)
                        this.state = 584
                        this.doReplace()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 585
                        this.match(PartiQLParser.DO)
                        this.state = 586
                        this.match(PartiQLParser.UPDATE)
                        this.state = 587
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
        this.enterRule(localContext, 72, PartiQLParser.RULE_doReplace)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 590
                this.match(PartiQLParser.EXCLUDED)
                this.state = 593
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 43, this.context)) {
                    case 1:
                        {
                            this.state = 591
                            this.match(PartiQLParser.WHERE)
                            this.state = 592
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
        this.enterRule(localContext, 74, PartiQLParser.RULE_doUpdate)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 595
                this.match(PartiQLParser.EXCLUDED)
                this.state = 598
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 44, this.context)) {
                    case 1:
                        {
                            this.state = 596
                            this.match(PartiQLParser.WHERE)
                            this.state = 597
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
        this.enterRule(localContext, 76, PartiQLParser.RULE_updateClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 600
                this.match(PartiQLParser.UPDATE)
                this.state = 601
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
        this.enterRule(localContext, 78, PartiQLParser.RULE_setCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 603
                this.match(PartiQLParser.SET)
                this.state = 604
                this.setAssignment()
                this.state = 609
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 605
                            this.match(PartiQLParser.COMMA)
                            this.state = 606
                            this.setAssignment()
                        }
                    }
                    this.state = 611
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
        this.enterRule(localContext, 80, PartiQLParser.RULE_setAssignment)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 612
                this.pathSimple()
                this.state = 613
                this.match(PartiQLParser.EQ)
                this.state = 614
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
        this.enterRule(localContext, 82, PartiQLParser.RULE_deleteCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 616
                this.match(PartiQLParser.DELETE)
                this.state = 617
                this.fromClauseSimple()
                this.state = 619
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 618
                        this.whereClause()
                    }
                }

                this.state = 622
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 621
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
        this.enterRule(localContext, 84, PartiQLParser.RULE_returningClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 624
                this.match(PartiQLParser.RETURNING)
                this.state = 625
                this.returningColumn()
                this.state = 630
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 626
                            this.match(PartiQLParser.COMMA)
                            this.state = 627
                            this.returningColumn()
                        }
                    }
                    this.state = 632
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
        this.enterRule(localContext, 86, PartiQLParser.RULE_returningColumn)
        let _la: number
        try {
            this.state = 639
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 49, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 633
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 634
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 635
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 636
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 637
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 638
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
        this.enterRule(localContext, 88, PartiQLParser.RULE_fromClauseSimple)
        let _la: number
        try {
            this.state = 656
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 53, this.context)) {
                case 1:
                    localContext = new FromClauseSimpleExplicitContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 641
                        this.match(PartiQLParser.FROM)
                        this.state = 642
                        this.pathSimple()
                        this.state = 644
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 643
                                this.asIdent()
                            }
                        }

                        this.state = 647
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 13) {
                            {
                                this.state = 646
                                this.atIdent()
                            }
                        }

                        this.state = 650
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 20) {
                            {
                                this.state = 649
                                this.byIdent()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new FromClauseSimpleImplicitContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 652
                        this.match(PartiQLParser.FROM)
                        this.state = 653
                        this.pathSimple()
                        this.state = 654
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
        this.enterRule(localContext, 90, PartiQLParser.RULE_whereClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 658
                this.match(PartiQLParser.WHERE)
                this.state = 659
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
        this.enterRule(localContext, 92, PartiQLParser.RULE_selectClause)
        let _la: number
        try {
            this.state = 682
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 57, this.context)) {
                case 1:
                    localContext = new SelectAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 661
                        this.match(PartiQLParser.SELECT)
                        this.state = 663
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 662
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 665
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    localContext = new SelectItemsContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 666
                        this.match(PartiQLParser.SELECT)
                        this.state = 668
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 667
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 670
                        this.projectionItems()
                    }
                    break
                case 3:
                    localContext = new SelectValueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
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
                        this.match(PartiQLParser.VALUE)
                        this.state = 676
                        this.expr()
                    }
                    break
                case 4:
                    localContext = new SelectPivotContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 677
                        this.match(PartiQLParser.PIVOT)
                        this.state = 678
                        ;(localContext as SelectPivotContext)._pivot = this.expr()
                        this.state = 679
                        this.match(PartiQLParser.AT)
                        this.state = 680
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
        this.enterRule(localContext, 94, PartiQLParser.RULE_projectionItems)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 684
                this.projectionItem()
                this.state = 689
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 685
                            this.match(PartiQLParser.COMMA)
                            this.state = 686
                            this.projectionItem()
                        }
                    }
                    this.state = 691
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
        this.enterRule(localContext, 96, PartiQLParser.RULE_projectionItem)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 692
                this.expr()
                this.state = 697
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10 || _la === 303 || _la === 304) {
                    {
                        this.state = 694
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 693
                                this.match(PartiQLParser.AS)
                            }
                        }

                        this.state = 696
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
        this.enterRule(localContext, 98, PartiQLParser.RULE_setQuantifierStrategy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 699
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
        this.enterRule(localContext, 100, PartiQLParser.RULE_letClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 701
                this.match(PartiQLParser.LET)
                this.state = 702
                this.letBinding()
                this.state = 707
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 61, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 703
                                this.match(PartiQLParser.COMMA)
                                this.state = 704
                                this.letBinding()
                            }
                        }
                    }
                    this.state = 709
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
        this.enterRule(localContext, 102, PartiQLParser.RULE_letBinding)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 710
                this.expr()
                this.state = 711
                this.match(PartiQLParser.AS)
                this.state = 712
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
        this.enterRule(localContext, 104, PartiQLParser.RULE_orderByClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 714
                this.match(PartiQLParser.ORDER)
                this.state = 715
                this.match(PartiQLParser.BY)
                this.state = 716
                this.orderSortSpec()
                this.state = 721
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 62, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 717
                                this.match(PartiQLParser.COMMA)
                                this.state = 718
                                this.orderSortSpec()
                            }
                        }
                    }
                    this.state = 723
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
        this.enterRule(localContext, 106, PartiQLParser.RULE_orderSortSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 724
                this.expr()
                this.state = 726
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 63, this.context)) {
                    case 1:
                        {
                            this.state = 725
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
                this.state = 730
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 64, this.context)) {
                    case 1:
                        {
                            this.state = 728
                            this.match(PartiQLParser.NULLS)
                            this.state = 729
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
        this.enterRule(localContext, 108, PartiQLParser.RULE_groupClause)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 732
                this.match(PartiQLParser.GROUP)
                this.state = 734
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 158) {
                    {
                        this.state = 733
                        this.match(PartiQLParser.PARTIAL)
                    }
                }

                this.state = 736
                this.match(PartiQLParser.BY)
                this.state = 737
                this.groupKey()
                this.state = 742
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 738
                                this.match(PartiQLParser.COMMA)
                                this.state = 739
                                this.groupKey()
                            }
                        }
                    }
                    this.state = 744
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 66, this.context)
                }
                this.state = 746
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 67, this.context)) {
                    case 1:
                        {
                            this.state = 745
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
        this.enterRule(localContext, 110, PartiQLParser.RULE_groupAlias)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 748
                this.match(PartiQLParser.GROUP)
                this.state = 749
                this.match(PartiQLParser.AS)
                this.state = 750
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
        this.enterRule(localContext, 112, PartiQLParser.RULE_groupKey)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 752
                localContext._key = this.exprSelect()
                this.state = 755
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 68, this.context)) {
                    case 1:
                        {
                            this.state = 753
                            this.match(PartiQLParser.AS)
                            this.state = 754
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
        this.enterRule(localContext, 114, PartiQLParser.RULE_over)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 757
                this.match(PartiQLParser.OVER)
                this.state = 758
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 760
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 233) {
                    {
                        this.state = 759
                        this.windowPartitionList()
                    }
                }

                this.state = 763
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 152) {
                    {
                        this.state = 762
                        this.windowSortSpecList()
                    }
                }

                this.state = 765
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
        this.enterRule(localContext, 116, PartiQLParser.RULE_windowPartitionList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 767
                this.match(PartiQLParser.PARTITION)
                this.state = 768
                this.match(PartiQLParser.BY)
                this.state = 769
                this.expr()
                this.state = 774
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 770
                            this.match(PartiQLParser.COMMA)
                            this.state = 771
                            this.expr()
                        }
                    }
                    this.state = 776
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
        this.enterRule(localContext, 118, PartiQLParser.RULE_windowSortSpecList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 777
                this.match(PartiQLParser.ORDER)
                this.state = 778
                this.match(PartiQLParser.BY)
                this.state = 779
                this.orderSortSpec()
                this.state = 784
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 780
                            this.match(PartiQLParser.COMMA)
                            this.state = 781
                            this.orderSortSpec()
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
    public havingClause(): HavingClauseContext {
        let localContext = new HavingClauseContext(this.context, this.state)
        this.enterRule(localContext, 120, PartiQLParser.RULE_havingClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 787
                this.match(PartiQLParser.HAVING)
                this.state = 788
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
        this.enterRule(localContext, 122, PartiQLParser.RULE_excludeClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 790
                this.match(PartiQLParser.EXCLUDE)
                this.state = 791
                this.excludeExpr()
                this.state = 796
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 792
                            this.match(PartiQLParser.COMMA)
                            this.state = 793
                            this.excludeExpr()
                        }
                    }
                    this.state = 798
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
        this.enterRule(localContext, 124, PartiQLParser.RULE_excludeExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 799
                this.symbolPrimitive()
                this.state = 801
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 800
                            this.excludeExprSteps()
                        }
                    }
                    this.state = 803
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
        this.enterRule(localContext, 126, PartiQLParser.RULE_excludeExprSteps)
        try {
            this.state = 818
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 75, this.context)) {
                case 1:
                    localContext = new ExcludeExprTupleAttrContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 805
                        this.match(PartiQLParser.PERIOD)
                        this.state = 806
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new ExcludeExprCollectionAttrContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 807
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 808
                        ;(localContext as ExcludeExprCollectionAttrContext)._attr = this.match(
                            PartiQLParser.LITERAL_STRING
                        )
                        this.state = 809
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new ExcludeExprCollectionIndexContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 810
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 811
                        ;(localContext as ExcludeExprCollectionIndexContext)._index = this.match(
                            PartiQLParser.LITERAL_INTEGER
                        )
                        this.state = 812
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 4:
                    localContext = new ExcludeExprCollectionWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 813
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 814
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 815
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 5:
                    localContext = new ExcludeExprTupleWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 816
                        this.match(PartiQLParser.PERIOD)
                        this.state = 817
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
        this.enterRule(localContext, 128, PartiQLParser.RULE_fromClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 820
                this.match(PartiQLParser.FROM)
                this.state = 821
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
        this.enterRule(localContext, 130, PartiQLParser.RULE_whereClauseSelect)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 823
                this.match(PartiQLParser.WHERE)
                this.state = 824
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
        this.enterRule(localContext, 132, PartiQLParser.RULE_offsetByClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 826
                this.match(PartiQLParser.OFFSET)
                this.state = 827
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
        this.enterRule(localContext, 134, PartiQLParser.RULE_limitClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 829
                this.match(PartiQLParser.LIMIT)
                this.state = 830
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
        this.enterRule(localContext, 136, PartiQLParser.RULE_gpmlPattern)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 833
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 76, this.context)) {
                    case 1:
                        {
                            this.state = 832
                            localContext._selector = this.matchSelector()
                        }
                        break
                }
                this.state = 835
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
        this.enterRule(localContext, 138, PartiQLParser.RULE_gpmlPatternList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 838
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 4 || _la === 8 || _la === 186) {
                    {
                        this.state = 837
                        localContext._selector = this.matchSelector()
                    }
                }

                this.state = 840
                this.matchPattern()
                this.state = 845
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 841
                            this.match(PartiQLParser.COMMA)
                            this.state = 842
                            this.matchPattern()
                        }
                    }
                    this.state = 847
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
        this.enterRule(localContext, 140, PartiQLParser.RULE_matchPattern)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 849
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 79, this.context)) {
                    case 1:
                        {
                            this.state = 848
                            localContext._restrictor = this.patternRestrictor()
                        }
                        break
                }
                this.state = 852
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 80, this.context)) {
                    case 1:
                        {
                            this.state = 851
                            localContext._variable = this.patternPathVariable()
                        }
                        break
                }
                this.state = 857
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 81, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 854
                                this.graphPart()
                            }
                        }
                    }
                    this.state = 859
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
        this.enterRule(localContext, 142, PartiQLParser.RULE_graphPart)
        try {
            this.state = 863
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 82, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 860
                        this.node()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 861
                        this.edge()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 862
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
        this.enterRule(localContext, 144, PartiQLParser.RULE_matchSelector)
        let _la: number
        try {
            this.state = 876
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 85, this.context)) {
                case 1:
                    localContext = new SelectorBasicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 865
                        ;(localContext as SelectorBasicContext)._mod = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 8)) {
                            ;(localContext as SelectorBasicContext)._mod = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 866
                        this.match(PartiQLParser.SHORTEST)
                    }
                    break
                case 2:
                    localContext = new SelectorAnyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 867
                        this.match(PartiQLParser.ANY)
                        this.state = 869
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 83, this.context)) {
                            case 1:
                                {
                                    this.state = 868
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
                        this.state = 871
                        this.match(PartiQLParser.SHORTEST)
                        this.state = 872
                        ;(localContext as SelectorShortestContext)._k = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 874
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 84, this.context)) {
                            case 1:
                                {
                                    this.state = 873
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
        this.enterRule(localContext, 146, PartiQLParser.RULE_patternPathVariable)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 878
                this.symbolPrimitive()
                this.state = 879
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
        this.enterRule(localContext, 148, PartiQLParser.RULE_patternRestrictor)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 881
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
        this.enterRule(localContext, 150, PartiQLParser.RULE_node)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 883
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 885
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 884
                        this.symbolPrimitive()
                    }
                }

                this.state = 889
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 887
                        this.match(PartiQLParser.COLON)
                        this.state = 888
                        this.labelSpec(0)
                    }
                }

                this.state = 892
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 891
                        this.whereClause()
                    }
                }

                this.state = 894
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
        this.enterRule(localContext, 152, PartiQLParser.RULE_edge)
        try {
            this.state = 904
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 91, this.context)) {
                case 1:
                    localContext = new EdgeWithSpecContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 896
                        this.edgeWSpec()
                        this.state = 898
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 89, this.context)) {
                            case 1:
                                {
                                    this.state = 897
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
                        this.state = 900
                        this.edgeAbbrev()
                        this.state = 902
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 90, this.context)) {
                            case 1:
                                {
                                    this.state = 901
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
        this.enterRule(localContext, 154, PartiQLParser.RULE_pattern)
        let _la: number
        try {
            this.state = 944
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 906
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 908
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 92, this.context)) {
                            case 1:
                                {
                                    this.state = 907
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 911
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 910
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 914
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 913
                                    this.graphPart()
                                }
                            }
                            this.state = 916
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 919
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 918
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 921
                        this.match(PartiQLParser.PAREN_RIGHT)
                        this.state = 923
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 96, this.context)) {
                            case 1:
                                {
                                    this.state = 922
                                    localContext._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 925
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 927
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 97, this.context)) {
                            case 1:
                                {
                                    this.state = 926
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 930
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 303 || _la === 304) {
                            {
                                this.state = 929
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 933
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 932
                                    this.graphPart()
                                }
                            }
                            this.state = 935
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 272) & ~0x1f) === 0 && ((1 << (_la - 272)) & 4472849) !== 0)
                        this.state = 938
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 937
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 940
                        this.match(PartiQLParser.BRACKET_RIGHT)
                        this.state = 942
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 101, this.context)) {
                            case 1:
                                {
                                    this.state = 941
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
        this.enterRule(localContext, 156, PartiQLParser.RULE_patternQuantifier)
        let _la: number
        try {
            this.state = 954
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.ASTERISK:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 946
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
                        this.state = 947
                        this.match(PartiQLParser.BRACE_LEFT)
                        this.state = 948
                        localContext._lower = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 949
                        this.match(PartiQLParser.COMMA)
                        this.state = 951
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 301) {
                            {
                                this.state = 950
                                localContext._upper = this.match(PartiQLParser.LITERAL_INTEGER)
                            }
                        }

                        this.state = 953
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
        this.enterRule(localContext, 158, PartiQLParser.RULE_edgeWSpec)
        try {
            this.state = 990
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 105, this.context)) {
                case 1:
                    localContext = new EdgeSpecRightContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 956
                        this.match(PartiQLParser.MINUS)
                        this.state = 957
                        this.edgeSpec()
                        this.state = 958
                        this.match(PartiQLParser.MINUS)
                        this.state = 959
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 2:
                    localContext = new EdgeSpecUndirectedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 961
                        this.match(PartiQLParser.TILDE)
                        this.state = 962
                        this.edgeSpec()
                        this.state = 963
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 3:
                    localContext = new EdgeSpecLeftContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 965
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 966
                        this.match(PartiQLParser.MINUS)
                        this.state = 967
                        this.edgeSpec()
                        this.state = 968
                        this.match(PartiQLParser.MINUS)
                    }
                    break
                case 4:
                    localContext = new EdgeSpecUndirectedRightContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 970
                        this.match(PartiQLParser.TILDE)
                        this.state = 971
                        this.edgeSpec()
                        this.state = 972
                        this.match(PartiQLParser.TILDE)
                        this.state = 973
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 5:
                    localContext = new EdgeSpecUndirectedLeftContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 975
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 976
                        this.match(PartiQLParser.TILDE)
                        this.state = 977
                        this.edgeSpec()
                        this.state = 978
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 6:
                    localContext = new EdgeSpecBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 980
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 981
                        this.match(PartiQLParser.MINUS)
                        this.state = 982
                        this.edgeSpec()
                        this.state = 983
                        this.match(PartiQLParser.MINUS)
                        this.state = 984
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 7:
                    localContext = new EdgeSpecUndirectedBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 986
                        this.match(PartiQLParser.MINUS)
                        this.state = 987
                        this.edgeSpec()
                        this.state = 988
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
        this.enterRule(localContext, 160, PartiQLParser.RULE_edgeSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 992
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 994
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 303 || _la === 304) {
                    {
                        this.state = 993
                        this.symbolPrimitive()
                    }
                }

                this.state = 998
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 296) {
                    {
                        this.state = 996
                        this.match(PartiQLParser.COLON)
                        this.state = 997
                        this.labelSpec(0)
                    }
                }

                this.state = 1001
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 1000
                        this.whereClause()
                    }
                }

                this.state = 1003
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
        let _startState = 162
        this.enterRecursionRule(localContext, 162, PartiQLParser.RULE_labelSpec, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelSpecTermContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1006
                    this.labelTerm(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1013
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
                                this.state = 1008
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1009
                                this.match(PartiQLParser.VERTBAR)
                                this.state = 1010
                                this.labelTerm(0)
                            }
                        }
                    }
                    this.state = 1015
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
        let _startState = 164
        this.enterRecursionRule(localContext, 164, PartiQLParser.RULE_labelTerm, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelTermFactorContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1017
                    this.labelFactor()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1024
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
                                this.state = 1019
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1020
                                this.match(PartiQLParser.AMPERSAND)
                                this.state = 1021
                                this.labelFactor()
                            }
                        }
                    }
                    this.state = 1026
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
        this.enterRule(localContext, 166, PartiQLParser.RULE_labelFactor)
        try {
            this.state = 1030
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BANG:
                    localContext = new LabelFactorNotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1027
                        this.match(PartiQLParser.BANG)
                        this.state = 1028
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
                        this.state = 1029
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
        this.enterRule(localContext, 168, PartiQLParser.RULE_labelPrimary)
        try {
            this.state = 1038
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new LabelPrimaryNameContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1032
                        this.symbolPrimitive()
                    }
                    break
                case PartiQLParser.PERCENT:
                    localContext = new LabelPrimaryWildContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1033
                        this.match(PartiQLParser.PERCENT)
                    }
                    break
                case PartiQLParser.PAREN_LEFT:
                    localContext = new LabelPrimaryParenContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1034
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1035
                        this.labelSpec(0)
                        this.state = 1036
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
        this.enterRule(localContext, 170, PartiQLParser.RULE_edgeAbbrev)
        let _la: number
        try {
            this.state = 1052
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 115, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1040
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1041
                        this.match(PartiQLParser.TILDE)
                        this.state = 1042
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1043
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1044
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1046
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 286) {
                            {
                                this.state = 1045
                                this.match(PartiQLParser.ANGLE_LEFT)
                            }
                        }

                        this.state = 1048
                        this.match(PartiQLParser.MINUS)
                        this.state = 1050
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 114, this.context)) {
                            case 1:
                                {
                                    this.state = 1049
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
        let _startState = 172
        this.enterRecursionRule(localContext, 172, PartiQLParser.RULE_tableReference, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1060
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 116, this.context)) {
                    case 1:
                        {
                            localContext = new TableRefBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1055
                            this.tableNonJoin()
                        }
                        break
                    case 2:
                        {
                            localContext = new TableWrappedContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1056
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 1057
                            this.tableReference(0)
                            this.state = 1058
                            this.match(PartiQLParser.PAREN_RIGHT)
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1082
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 120, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1080
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
                                        this.state = 1062
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1064
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1063
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1066
                                        this.match(PartiQLParser.CROSS)
                                        this.state = 1067
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1068
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
                                        this.state = 1069
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1070
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1071
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
                                        this.state = 1072
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
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
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1077
                                        ;(localContext as TableQualifiedJoinContext)._rhs = this.joinRhs()
                                        this.state = 1078
                                        this.joinSpec()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1084
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
        this.enterRule(localContext, 174, PartiQLParser.RULE_tableNonJoin)
        try {
            this.state = 1087
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
                        this.state = 1085
                        this.tableBaseReference()
                    }
                    break
                case PartiQLParser.UNPIVOT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1086
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
        this.enterRule(localContext, 176, PartiQLParser.RULE_tableBaseReference)
        try {
            this.state = 1112
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 128, this.context)) {
                case 1:
                    localContext = new TableBaseRefSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1089
                        ;(localContext as TableBaseRefSymbolContext)._source = this.exprSelect()
                        this.state = 1090
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new TableBaseRefClausesContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1092
                        ;(localContext as TableBaseRefClausesContext)._source = this.exprSelect()
                        this.state = 1094
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 122, this.context)) {
                            case 1:
                                {
                                    this.state = 1093
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1097
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 123, this.context)) {
                            case 1:
                                {
                                    this.state = 1096
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1100
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 124, this.context)) {
                            case 1:
                                {
                                    this.state = 1099
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
                        this.state = 1102
                        ;(localContext as TableBaseRefMatchContext)._source = this.exprGraphMatchOne()
                        this.state = 1104
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 125, this.context)) {
                            case 1:
                                {
                                    this.state = 1103
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1107
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 126, this.context)) {
                            case 1:
                                {
                                    this.state = 1106
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1110
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 127, this.context)) {
                            case 1:
                                {
                                    this.state = 1109
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
        this.enterRule(localContext, 178, PartiQLParser.RULE_tableUnpivot)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1114
                this.match(PartiQLParser.UNPIVOT)
                this.state = 1115
                this.expr()
                this.state = 1117
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 129, this.context)) {
                    case 1:
                        {
                            this.state = 1116
                            this.asIdent()
                        }
                        break
                }
                this.state = 1120
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 130, this.context)) {
                    case 1:
                        {
                            this.state = 1119
                            this.atIdent()
                        }
                        break
                }
                this.state = 1123
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 131, this.context)) {
                    case 1:
                        {
                            this.state = 1122
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
        this.enterRule(localContext, 180, PartiQLParser.RULE_joinRhs)
        try {
            this.state = 1130
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 132, this.context)) {
                case 1:
                    localContext = new JoinRhsBaseContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1125
                        this.tableNonJoin()
                    }
                    break
                case 2:
                    localContext = new JoinRhsTableJoinedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1126
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1127
                        this.tableReference(0)
                        this.state = 1128
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
        this.enterRule(localContext, 182, PartiQLParser.RULE_joinSpec)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1132
                this.match(PartiQLParser.ON)
                this.state = 1133
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
        this.enterRule(localContext, 184, PartiQLParser.RULE_joinType)
        let _la: number
        try {
            this.state = 1149
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.INNER:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1135
                        localContext._mod = this.match(PartiQLParser.INNER)
                    }
                    break
                case PartiQLParser.LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1136
                        localContext._mod = this.match(PartiQLParser.LEFT)
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
                case PartiQLParser.RIGHT:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1140
                        localContext._mod = this.match(PartiQLParser.RIGHT)
                        this.state = 1142
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1141
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.FULL:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1144
                        localContext._mod = this.match(PartiQLParser.FULL)
                        this.state = 1146
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1145
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.OUTER:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1148
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
        this.enterRule(localContext, 186, PartiQLParser.RULE_expr)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1151
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
        let _startState = 188
        this.enterRecursionRule(localContext, 188, PartiQLParser.RULE_exprBagOp, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new QueryBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1154
                    this.exprSelect()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1185
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 144, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1183
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
                                        this.state = 1156
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1158
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1157
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1160
                                        this.match(PartiQLParser.EXCEPT)
                                        this.state = 1162
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1161
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1164
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
                                        this.state = 1165
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1167
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1166
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1169
                                        this.match(PartiQLParser.UNION)
                                        this.state = 1171
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1170
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1173
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
                                        this.state = 1174
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1176
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1175
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1178
                                        this.match(PartiQLParser.INTERSECT)
                                        this.state = 1180
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1179
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1182
                                        ;(localContext as IntersectContext)._rhs = this.exprSelect()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1187
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
        this.enterRule(localContext, 190, PartiQLParser.RULE_exprSelect)
        let _la: number
        try {
            this.state = 1215
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.SELECT:
                case PartiQLParser.PIVOT:
                    localContext = new SfwQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1188
                        ;(localContext as SfwQueryContext)._select = this.selectClause()
                        this.state = 1190
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 78) {
                            {
                                this.state = 1189
                                ;(localContext as SfwQueryContext)._exclude = this.excludeClause()
                            }
                        }

                        this.state = 1192
                        ;(localContext as SfwQueryContext)._from_ = this.fromClause()
                        this.state = 1194
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 146, this.context)) {
                            case 1:
                                {
                                    this.state = 1193
                                    ;(localContext as SfwQueryContext)._let_ = this.letClause()
                                }
                                break
                        }
                        this.state = 1197
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 147, this.context)) {
                            case 1:
                                {
                                    this.state = 1196
                                    ;(localContext as SfwQueryContext)._where = this.whereClauseSelect()
                                }
                                break
                        }
                        this.state = 1200
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 148, this.context)) {
                            case 1:
                                {
                                    this.state = 1199
                                    ;(localContext as SfwQueryContext)._group = this.groupClause()
                                }
                                break
                        }
                        this.state = 1203
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 149, this.context)) {
                            case 1:
                                {
                                    this.state = 1202
                                    ;(localContext as SfwQueryContext)._having = this.havingClause()
                                }
                                break
                        }
                        this.state = 1206
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 150, this.context)) {
                            case 1:
                                {
                                    this.state = 1205
                                    ;(localContext as SfwQueryContext)._order = this.orderByClause()
                                }
                                break
                        }
                        this.state = 1209
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 151, this.context)) {
                            case 1:
                                {
                                    this.state = 1208
                                    ;(localContext as SfwQueryContext)._limit = this.limitClause()
                                }
                                break
                        }
                        this.state = 1212
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 152, this.context)) {
                            case 1:
                                {
                                    this.state = 1211
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
                        this.state = 1214
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
        let _startState = 192
        this.enterRecursionRule(localContext, 192, PartiQLParser.RULE_exprOr, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprOrBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1218
                    ;(localContext as ExprOrBaseContext)._parent = this.exprAnd(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1225
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
                                this.state = 1220
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1221
                                this.match(PartiQLParser.OR)
                                this.state = 1222
                                ;(localContext as OrContext)._rhs = this.exprAnd(0)
                            }
                        }
                    }
                    this.state = 1227
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
        let _startState = 194
        this.enterRecursionRule(localContext, 194, PartiQLParser.RULE_exprAnd, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprAndBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1229
                    ;(localContext as ExprAndBaseContext)._parent = this.exprNot()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1236
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
                                this.state = 1231
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1232
                                ;(localContext as AndContext)._op = this.match(PartiQLParser.AND)
                                this.state = 1233
                                ;(localContext as AndContext)._rhs = this.exprNot()
                            }
                        }
                    }
                    this.state = 1238
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
        this.enterRule(localContext, 196, PartiQLParser.RULE_exprNot)
        try {
            this.state = 1242
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new NotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1239
                        ;(localContext as NotContext)._op = this.match(PartiQLParser.NOT)
                        this.state = 1240
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
                        this.state = 1241
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
        let _startState = 198
        this.enterRecursionRule(localContext, 198, PartiQLParser.RULE_exprPredicate, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new PredicateBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1245
                    ;(localContext as PredicateBaseContext)._parent = this.mathOp00(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1292
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 164, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1290
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
                                        this.state = 1247
                                        if (!this.precpred(this.context, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 7)')
                                        }
                                        this.state = 1248
                                        ;(localContext as PredicateComparisonContext)._op = this.tokenStream.LT(1)
                                        _la = this.tokenStream.LA(1)
                                        if (!(((_la - 281) & ~0x1f) === 0 && ((1 << (_la - 281)) & 111) !== 0)) {
                                            ;(localContext as PredicateComparisonContext)._op =
                                                this.errorHandler.recoverInline(this)
                                        } else {
                                            this.errorHandler.reportMatch(this)
                                            this.consume()
                                        }
                                        this.state = 1249
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
                                        this.state = 1250
                                        if (!this.precpred(this.context, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                        }
                                        this.state = 1251
                                        this.match(PartiQLParser.IS)
                                        this.state = 1253
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1252
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1255
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
                                        this.state = 1256
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1258
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1257
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1260
                                        this.match(PartiQLParser.IN)
                                        this.state = 1261
                                        this.match(PartiQLParser.PAREN_LEFT)
                                        this.state = 1262
                                        this.expr()
                                        this.state = 1263
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
                                        this.state = 1265
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1267
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1266
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1269
                                        this.match(PartiQLParser.IN)
                                        this.state = 1270
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
                                        this.state = 1271
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1273
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1272
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1275
                                        this.match(PartiQLParser.LIKE)
                                        this.state = 1276
                                        ;(localContext as PredicateLikeContext)._rhs = this.mathOp00(0)
                                        this.state = 1279
                                        this.errorHandler.sync(this)
                                        switch (this.interpreter.adaptivePredict(this.tokenStream, 161, this.context)) {
                                            case 1:
                                                {
                                                    this.state = 1277
                                                    this.match(PartiQLParser.ESCAPE)
                                                    this.state = 1278
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
                                        this.state = 1281
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
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
                                        this.match(PartiQLParser.BETWEEN)
                                        this.state = 1286
                                        ;(localContext as PredicateBetweenContext)._lower = this.mathOp00(0)
                                        this.state = 1287
                                        this.match(PartiQLParser.AND)
                                        this.state = 1288
                                        ;(localContext as PredicateBetweenContext)._upper = this.mathOp00(0)
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1294
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
        let _startState = 200
        this.enterRecursionRule(localContext, 200, PartiQLParser.RULE_mathOp00, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1296
                    localContext._parent = this.mathOp01(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1303
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
                                this.state = 1298
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1299
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 279 || _la === 285)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1300
                                localContext._rhs = this.mathOp01(0)
                            }
                        }
                    }
                    this.state = 1305
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
        let _startState = 202
        this.enterRecursionRule(localContext, 202, PartiQLParser.RULE_mathOp01, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1307
                    localContext._parent = this.mathOp02(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1314
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
                                this.state = 1309
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1310
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 271 || _la === 272)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1311
                                localContext._rhs = this.mathOp02(0)
                            }
                        }
                    }
                    this.state = 1316
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
        let _startState = 204
        this.enterRecursionRule(localContext, 204, PartiQLParser.RULE_mathOp02, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1318
                    localContext._parent = this.valueExpr()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1325
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
                                this.state = 1320
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1321
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(((_la - 273) & ~0x1f) === 0 && ((1 << (_la - 273)) & 19) !== 0)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1322
                                localContext._rhs = this.valueExpr()
                            }
                        }
                    }
                    this.state = 1327
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
        this.enterRule(localContext, 206, PartiQLParser.RULE_valueExpr)
        let _la: number
        try {
            this.state = 1331
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1328
                        localContext._sign = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 271 || _la === 272)) {
                            localContext._sign = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1329
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
                        this.state = 1330
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
        let _startState = 208
        this.enterRecursionRule(localContext, 208, PartiQLParser.RULE_exprPrimary, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1354
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 169, this.context)) {
                    case 1:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1334
                            this.exprTerm()
                        }
                        break
                    case 2:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1335
                            this.cast()
                        }
                        break
                    case 3:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1336
                            this.sequenceConstructor()
                        }
                        break
                    case 4:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1337
                            this.substring()
                        }
                        break
                    case 5:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1338
                            this.position()
                        }
                        break
                    case 6:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1339
                            this.overlay()
                        }
                        break
                    case 7:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1340
                            this.canCast()
                        }
                        break
                    case 8:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1341
                            this.canLosslessCast()
                        }
                        break
                    case 9:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1342
                            this.extract()
                        }
                        break
                    case 10:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1343
                            this.coalesce()
                        }
                        break
                    case 11:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1344
                            this.dateFunction()
                        }
                        break
                    case 12:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1345
                            this.aggregate()
                        }
                        break
                    case 13:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1346
                            this.trimFunction()
                        }
                        break
                    case 14:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1347
                            this.functionCall()
                        }
                        break
                    case 15:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1348
                            this.nullIf()
                        }
                        break
                    case 16:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1349
                            this.exprGraphMatchMany()
                        }
                        break
                    case 17:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1350
                            this.caseExpr()
                        }
                        break
                    case 18:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1351
                            this.valueList()
                        }
                        break
                    case 19:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1352
                            this.values()
                        }
                        break
                    case 20:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1353
                            this.windowFunction()
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1364
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
                                this.state = 1356
                                if (!this.precpred(this.context, 6)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                }
                                this.state = 1358
                                this.errorHandler.sync(this)
                                alternative = 1
                                do {
                                    switch (alternative) {
                                        case 1:
                                            {
                                                {
                                                    this.state = 1357
                                                    this.pathStep()
                                                }
                                            }
                                            break
                                        default:
                                            throw new antlr.NoViableAltException(this)
                                    }
                                    this.state = 1360
                                    this.errorHandler.sync(this)
                                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 170, this.context)
                                } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                            }
                        }
                    }
                    this.state = 1366
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
        this.enterRule(localContext, 210, PartiQLParser.RULE_exprTerm)
        try {
            this.state = 1378
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    localContext = new ExprTermWrappedQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1367
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1368
                        this.expr()
                        this.state = 1369
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.CURRENT_USER:
                    localContext = new ExprTermCurrentUserContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1371
                        this.match(PartiQLParser.CURRENT_USER)
                    }
                    break
                case PartiQLParser.CURRENT_DATE:
                    localContext = new ExprTermCurrentDateContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1372
                        this.match(PartiQLParser.CURRENT_DATE)
                    }
                    break
                case PartiQLParser.QUESTION_MARK:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1373
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
                        this.state = 1374
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
                        this.state = 1375
                        this.literal()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1376
                        this.collection()
                    }
                    break
                case PartiQLParser.BRACE_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1377
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
        this.enterRule(localContext, 212, PartiQLParser.RULE_nullIf)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1380
                this.match(PartiQLParser.NULLIF)
                this.state = 1381
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1382
                this.expr()
                this.state = 1383
                this.match(PartiQLParser.COMMA)
                this.state = 1384
                this.expr()
                this.state = 1385
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
        this.enterRule(localContext, 214, PartiQLParser.RULE_coalesce)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1387
                this.match(PartiQLParser.COALESCE)
                this.state = 1388
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1389
                this.expr()
                this.state = 1394
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1390
                            this.match(PartiQLParser.COMMA)
                            this.state = 1391
                            this.expr()
                        }
                    }
                    this.state = 1396
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1397
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
        this.enterRule(localContext, 216, PartiQLParser.RULE_caseExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1399
                this.match(PartiQLParser.CASE)
                this.state = 1401
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
                        this.state = 1400
                        localContext._case_ = this.expr()
                    }
                }

                this.state = 1408
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1403
                            this.match(PartiQLParser.WHEN)
                            this.state = 1404
                            localContext._expr = this.expr()
                            localContext._whens.push(localContext._expr!)
                            this.state = 1405
                            this.match(PartiQLParser.THEN)
                            this.state = 1406
                            localContext._expr = this.expr()
                            localContext._thens.push(localContext._expr!)
                        }
                    }
                    this.state = 1410
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 223)
                this.state = 1414
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 71) {
                    {
                        this.state = 1412
                        this.match(PartiQLParser.ELSE)
                        this.state = 1413
                        localContext._else_ = this.expr()
                    }
                }

                this.state = 1416
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
        this.enterRule(localContext, 218, PartiQLParser.RULE_values)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1418
                this.match(PartiQLParser.VALUES)
                this.state = 1419
                this.valueRow()
                this.state = 1424
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 177, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 1420
                                this.match(PartiQLParser.COMMA)
                                this.state = 1421
                                this.valueRow()
                            }
                        }
                    }
                    this.state = 1426
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
        this.enterRule(localContext, 220, PartiQLParser.RULE_valueRow)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1427
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1428
                this.expr()
                this.state = 1433
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 270) {
                    {
                        {
                            this.state = 1429
                            this.match(PartiQLParser.COMMA)
                            this.state = 1430
                            this.expr()
                        }
                    }
                    this.state = 1435
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1436
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
        this.enterRule(localContext, 222, PartiQLParser.RULE_valueList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1438
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1439
                this.expr()
                this.state = 1442
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1440
                            this.match(PartiQLParser.COMMA)
                            this.state = 1441
                            this.expr()
                        }
                    }
                    this.state = 1444
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 270)
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
    public sequenceConstructor(): SequenceConstructorContext {
        let localContext = new SequenceConstructorContext(this.context, this.state)
        this.enterRule(localContext, 224, PartiQLParser.RULE_sequenceConstructor)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1448
                localContext._datatype = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 266 || _la === 267)) {
                    localContext._datatype = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1449
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1458
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
                        this.state = 1450
                        this.expr()
                        this.state = 1455
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1451
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1452
                                    this.expr()
                                }
                            }
                            this.state = 1457
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1460
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
        this.enterRule(localContext, 226, PartiQLParser.RULE_substring)
        let _la: number
        try {
            this.state = 1488
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 186, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1462
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1463
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1464
                        this.expr()
                        this.state = 1471
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1465
                                this.match(PartiQLParser.COMMA)
                                this.state = 1466
                                this.expr()
                                this.state = 1469
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 270) {
                                    {
                                        this.state = 1467
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1468
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1473
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1475
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1476
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1477
                        this.expr()
                        this.state = 1484
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 95) {
                            {
                                this.state = 1478
                                this.match(PartiQLParser.FROM)
                                this.state = 1479
                                this.expr()
                                this.state = 1482
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 92) {
                                    {
                                        this.state = 1480
                                        this.match(PartiQLParser.FOR)
                                        this.state = 1481
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1486
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
        this.enterRule(localContext, 228, PartiQLParser.RULE_position)
        try {
            this.state = 1504
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 187, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1490
                        this.match(PartiQLParser.POSITION)
                        this.state = 1491
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1492
                        this.expr()
                        this.state = 1493
                        this.match(PartiQLParser.COMMA)
                        this.state = 1494
                        this.expr()
                        this.state = 1495
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1497
                        this.match(PartiQLParser.POSITION)
                        this.state = 1498
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1499
                        this.expr()
                        this.state = 1500
                        this.match(PartiQLParser.IN)
                        this.state = 1501
                        this.expr()
                        this.state = 1502
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
        this.enterRule(localContext, 230, PartiQLParser.RULE_overlay)
        let _la: number
        try {
            this.state = 1532
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 190, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1506
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1507
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1508
                        this.expr()
                        this.state = 1509
                        this.match(PartiQLParser.COMMA)
                        this.state = 1510
                        this.expr()
                        this.state = 1511
                        this.match(PartiQLParser.COMMA)
                        this.state = 1512
                        this.expr()
                        this.state = 1515
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1513
                                this.match(PartiQLParser.COMMA)
                                this.state = 1514
                                this.expr()
                            }
                        }

                        this.state = 1517
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1519
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1520
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1521
                        this.expr()
                        this.state = 1522
                        this.match(PartiQLParser.PLACING)
                        this.state = 1523
                        this.expr()
                        this.state = 1524
                        this.match(PartiQLParser.FROM)
                        this.state = 1525
                        this.expr()
                        this.state = 1528
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 92) {
                            {
                                this.state = 1526
                                this.match(PartiQLParser.FOR)
                                this.state = 1527
                                this.expr()
                            }
                        }

                        this.state = 1530
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
        this.enterRule(localContext, 232, PartiQLParser.RULE_aggregate)
        let _la: number
        try {
            this.state = 1546
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 192, this.context)) {
                case 1:
                    localContext = new CountAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1534
                        ;(localContext as CountAllContext)._func = this.match(PartiQLParser.COUNT)
                        this.state = 1535
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1536
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 1537
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    localContext = new AggregateBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1538
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
                        this.state = 1539
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1541
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 1540
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 1543
                        this.expr()
                        this.state = 1544
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
        this.enterRule(localContext, 234, PartiQLParser.RULE_windowFunction)
        let _la: number
        try {
            localContext = new LagLeadFunctionContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1548
                ;(localContext as LagLeadFunctionContext)._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 230 || _la === 231)) {
                    ;(localContext as LagLeadFunctionContext)._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1549
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1550
                this.expr()
                this.state = 1557
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 270) {
                    {
                        this.state = 1551
                        this.match(PartiQLParser.COMMA)
                        this.state = 1552
                        this.expr()
                        this.state = 1555
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 270) {
                            {
                                this.state = 1553
                                this.match(PartiQLParser.COMMA)
                                this.state = 1554
                                this.expr()
                            }
                        }
                    }
                }

                this.state = 1559
                this.match(PartiQLParser.PAREN_RIGHT)
                this.state = 1560
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
        this.enterRule(localContext, 236, PartiQLParser.RULE_cast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1562
                this.match(PartiQLParser.CAST)
                this.state = 1563
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1564
                this.expr()
                this.state = 1565
                this.match(PartiQLParser.AS)
                this.state = 1566
                this.type_()
                this.state = 1567
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
        this.enterRule(localContext, 238, PartiQLParser.RULE_canLosslessCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1569
                this.match(PartiQLParser.CAN_LOSSLESS_CAST)
                this.state = 1570
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1571
                this.expr()
                this.state = 1572
                this.match(PartiQLParser.AS)
                this.state = 1573
                this.type_()
                this.state = 1574
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
        this.enterRule(localContext, 240, PartiQLParser.RULE_canCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1576
                this.match(PartiQLParser.CAN_CAST)
                this.state = 1577
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1578
                this.expr()
                this.state = 1579
                this.match(PartiQLParser.AS)
                this.state = 1580
                this.type_()
                this.state = 1581
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
        this.enterRule(localContext, 242, PartiQLParser.RULE_extract)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1583
                this.match(PartiQLParser.EXTRACT)
                this.state = 1584
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1585
                this.match(PartiQLParser.IDENTIFIER)
                this.state = 1586
                this.match(PartiQLParser.FROM)
                this.state = 1587
                localContext._rhs = this.expr()
                this.state = 1588
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
        this.enterRule(localContext, 244, PartiQLParser.RULE_trimFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1590
                localContext._func = this.match(PartiQLParser.TRIM)
                this.state = 1591
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1599
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 197, this.context)) {
                    case 1:
                        {
                            this.state = 1593
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 195, this.context)) {
                                case 1:
                                    {
                                        this.state = 1592
                                        localContext._mod = this.match(PartiQLParser.IDENTIFIER)
                                    }
                                    break
                            }
                            this.state = 1596
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
                                    this.state = 1595
                                    localContext._sub = this.expr()
                                }
                            }

                            this.state = 1598
                            this.match(PartiQLParser.FROM)
                        }
                        break
                }
                this.state = 1601
                localContext._target = this.expr()
                this.state = 1602
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
        this.enterRule(localContext, 246, PartiQLParser.RULE_dateFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1604
                localContext._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 86 || _la === 87)) {
                    localContext._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1605
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1606
                localContext._dt = this.match(PartiQLParser.IDENTIFIER)
                this.state = 1607
                this.match(PartiQLParser.COMMA)
                this.state = 1608
                this.expr()
                this.state = 1609
                this.match(PartiQLParser.COMMA)
                this.state = 1610
                this.expr()
                this.state = 1611
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
        this.enterRule(localContext, 248, PartiQLParser.RULE_functionCall)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1613
                this.functionName()
                this.state = 1614
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1623
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
                        this.state = 1615
                        this.expr()
                        this.state = 1620
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1616
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1617
                                    this.expr()
                                }
                            }
                            this.state = 1622
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1625
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
        this.enterRule(localContext, 250, PartiQLParser.RULE_functionName)
        let _la: number
        try {
            let alternative: number
            this.state = 1645
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 202, this.context)) {
                case 1:
                    localContext = new FunctionNameReservedContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1632
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 303 || _la === 304) {
                            {
                                {
                                    this.state = 1627
                                    ;(localContext as FunctionNameReservedContext)._symbolPrimitive =
                                        this.symbolPrimitive()
                                    ;(localContext as FunctionNameReservedContext)._qualifier.push(
                                        (localContext as FunctionNameReservedContext)._symbolPrimitive!
                                    )
                                    this.state = 1628
                                    this.match(PartiQLParser.PERIOD)
                                }
                            }
                            this.state = 1634
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 1635
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
                        this.state = 1641
                        this.errorHandler.sync(this)
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)
                        while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                            if (alternative === 1) {
                                {
                                    {
                                        this.state = 1636
                                        ;(localContext as FunctionNameSymbolContext)._symbolPrimitive =
                                            this.symbolPrimitive()
                                        ;(localContext as FunctionNameSymbolContext)._qualifier.push(
                                            (localContext as FunctionNameSymbolContext)._symbolPrimitive!
                                        )
                                        this.state = 1637
                                        this.match(PartiQLParser.PERIOD)
                                    }
                                }
                            }
                            this.state = 1643
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)
                        }
                        this.state = 1644
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
        this.enterRule(localContext, 252, PartiQLParser.RULE_pathStep)
        try {
            this.state = 1658
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 203, this.context)) {
                case 1:
                    localContext = new PathStepIndexExprContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1647
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1648
                        ;(localContext as PathStepIndexExprContext)._key = this.expr()
                        this.state = 1649
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathStepIndexAllContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1651
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1652
                        ;(localContext as PathStepIndexAllContext)._all = this.match(PartiQLParser.ASTERISK)
                        this.state = 1653
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathStepDotExprContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1654
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1655
                        ;(localContext as PathStepDotExprContext)._key = this.symbolPrimitive()
                    }
                    break
                case 4:
                    localContext = new PathStepDotAllContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1656
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1657
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
        this.enterRule(localContext, 254, PartiQLParser.RULE_exprGraphMatchMany)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1660
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1661
                this.exprPrimary(0)
                this.state = 1662
                this.match(PartiQLParser.MATCH)
                this.state = 1663
                this.gpmlPatternList()
                this.state = 1664
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
        this.enterRule(localContext, 256, PartiQLParser.RULE_exprGraphMatchOne)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1666
                this.exprPrimary(0)
                this.state = 1667
                this.match(PartiQLParser.MATCH)
                this.state = 1668
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
        this.enterRule(localContext, 258, PartiQLParser.RULE_parameter)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1670
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
        this.enterRule(localContext, 260, PartiQLParser.RULE_varRefExpr)
        let _la: number
        try {
            this.state = 1680
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 206, this.context)) {
                case 1:
                    localContext = new VariableIdentifierContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1673
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1672
                                ;(localContext as VariableIdentifierContext)._qualifier = this.match(
                                    PartiQLParser.AT_SIGN
                                )
                            }
                        }

                        this.state = 1675
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
                        this.state = 1677
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 275) {
                            {
                                this.state = 1676
                                ;(localContext as VariableKeywordContext)._qualifier = this.match(PartiQLParser.AT_SIGN)
                            }
                        }

                        this.state = 1679
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
        this.enterRule(localContext, 262, PartiQLParser.RULE_nonReservedKeywords)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1682
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
        this.enterRule(localContext, 264, PartiQLParser.RULE_collection)
        try {
            this.state = 1686
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1684
                        this.array()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1685
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
        this.enterRule(localContext, 266, PartiQLParser.RULE_array)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1688
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1697
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
                        this.state = 1689
                        this.expr()
                        this.state = 1694
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1690
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1691
                                    this.expr()
                                }
                            }
                            this.state = 1696
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1699
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
        this.enterRule(localContext, 268, PartiQLParser.RULE_bag)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1701
                this.match(PartiQLParser.ANGLE_DOUBLE_LEFT)
                this.state = 1710
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
                        this.state = 1702
                        this.expr()
                        this.state = 1707
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1703
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1704
                                    this.expr()
                                }
                            }
                            this.state = 1709
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1712
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
        this.enterRule(localContext, 270, PartiQLParser.RULE_tuple)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1714
                this.match(PartiQLParser.BRACE_LEFT)
                this.state = 1723
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
                        this.state = 1715
                        this.pair()
                        this.state = 1720
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 270) {
                            {
                                {
                                    this.state = 1716
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1717
                                    this.pair()
                                }
                            }
                            this.state = 1722
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1725
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
        this.enterRule(localContext, 272, PartiQLParser.RULE_pair)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1727
                localContext._lhs = this.expr()
                this.state = 1728
                this.match(PartiQLParser.COLON)
                this.state = 1729
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
        this.enterRule(localContext, 274, PartiQLParser.RULE_literal)
        let _la: number
        try {
            this.state = 1765
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NULL:
                    localContext = new LiteralNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1731
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.MISSING:
                    localContext = new LiteralMissingContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1732
                        this.match(PartiQLParser.MISSING)
                    }
                    break
                case PartiQLParser.TRUE:
                    localContext = new LiteralTrueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1733
                        this.match(PartiQLParser.TRUE)
                    }
                    break
                case PartiQLParser.FALSE:
                    localContext = new LiteralFalseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1734
                        this.match(PartiQLParser.FALSE)
                    }
                    break
                case PartiQLParser.LITERAL_STRING:
                    localContext = new LiteralStringContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1735
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.LITERAL_INTEGER:
                    localContext = new LiteralIntegerContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1736
                        this.match(PartiQLParser.LITERAL_INTEGER)
                    }
                    break
                case PartiQLParser.LITERAL_DECIMAL:
                    localContext = new LiteralDecimalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1737
                        this.match(PartiQLParser.LITERAL_DECIMAL)
                    }
                    break
                case PartiQLParser.ION_CLOSURE:
                    localContext = new LiteralIonContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1738
                        this.match(PartiQLParser.ION_CLOSURE)
                    }
                    break
                case PartiQLParser.DATE:
                    localContext = new LiteralDateContext(localContext)
                    this.enterOuterAlt(localContext, 9)
                    {
                        this.state = 1739
                        this.match(PartiQLParser.DATE)
                        this.state = 1740
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIME:
                    localContext = new LiteralTimeContext(localContext)
                    this.enterOuterAlt(localContext, 10)
                    {
                        this.state = 1741
                        this.match(PartiQLParser.TIME)
                        this.state = 1745
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1742
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1743
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1744
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1750
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1747
                                this.match(PartiQLParser.WITH)
                                this.state = 1748
                                this.match(PartiQLParser.TIME)
                                this.state = 1749
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1752
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIMESTAMP:
                    localContext = new LiteralTimestampContext(localContext)
                    this.enterOuterAlt(localContext, 11)
                    {
                        this.state = 1753
                        this.match(PartiQLParser.TIMESTAMP)
                        this.state = 1757
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 294) {
                            {
                                this.state = 1754
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1755
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1756
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1762
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1759
                                this.match(PartiQLParser.WITH)
                                this.state = 1760
                                this.match(PartiQLParser.TIME)
                                this.state = 1761
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1764
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
        this.enterRule(localContext, 276, PartiQLParser.RULE_type)
        let _la: number
        try {
            this.state = 1805
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 225, this.context)) {
                case 1:
                    localContext = new TypeAtomicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1767
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
                        this.state = 1768
                        ;(localContext as TypeAtomicContext)._datatype = this.match(PartiQLParser.DOUBLE)
                        this.state = 1769
                        this.match(PartiQLParser.PRECISION)
                    }
                    break
                case 3:
                    localContext = new TypeArgSingleContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1770
                        ;(localContext as TypeArgSingleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 26 || _la === 27 || _la === 91 || _la === 220)) {
                            ;(localContext as TypeArgSingleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1774
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 219, this.context)) {
                            case 1:
                                {
                                    this.state = 1771
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1772
                                    ;(localContext as TypeArgSingleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1773
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
                        this.state = 1776
                        this.match(PartiQLParser.CHARACTER)
                        this.state = 1777
                        this.match(PartiQLParser.VARYING)
                        this.state = 1781
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 220, this.context)) {
                            case 1:
                                {
                                    this.state = 1778
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1779
                                    ;(localContext as TypeVarCharContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1780
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
                        this.state = 1783
                        ;(localContext as TypeArgDoubleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 55 || _la === 56 || _la === 144)) {
                            ;(localContext as TypeArgDoubleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1791
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 222, this.context)) {
                            case 1:
                                {
                                    this.state = 1784
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1785
                                    ;(localContext as TypeArgDoubleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1788
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    if (_la === 270) {
                                        {
                                            this.state = 1786
                                            this.match(PartiQLParser.COMMA)
                                            this.state = 1787
                                            ;(localContext as TypeArgDoubleContext)._arg1 = this.match(
                                                PartiQLParser.LITERAL_INTEGER
                                            )
                                        }
                                    }

                                    this.state = 1790
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
                        this.state = 1793
                        ;(localContext as TypeTimeZoneContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 201 || _la === 202)) {
                            ;(localContext as TypeTimeZoneContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1797
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 223, this.context)) {
                            case 1:
                                {
                                    this.state = 1794
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1795
                                    ;(localContext as TypeTimeZoneContext)._precision = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1796
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                        this.state = 1802
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 224, this.context)) {
                            case 1:
                                {
                                    this.state = 1799
                                    this.match(PartiQLParser.WITH)
                                    this.state = 1800
                                    this.match(PartiQLParser.TIME)
                                    this.state = 1801
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
                        this.state = 1804
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
            case 81:
                return this.labelSpec_sempred(localContext as LabelSpecContext, predIndex)
            case 82:
                return this.labelTerm_sempred(localContext as LabelTermContext, predIndex)
            case 86:
                return this.tableReference_sempred(localContext as TableReferenceContext, predIndex)
            case 94:
                return this.exprBagOp_sempred(localContext as ExprBagOpContext, predIndex)
            case 96:
                return this.exprOr_sempred(localContext as ExprOrContext, predIndex)
            case 97:
                return this.exprAnd_sempred(localContext as ExprAndContext, predIndex)
            case 99:
                return this.exprPredicate_sempred(localContext as ExprPredicateContext, predIndex)
            case 100:
                return this.mathOp00_sempred(localContext as MathOp00Context, predIndex)
            case 101:
                return this.mathOp01_sempred(localContext as MathOp01Context, predIndex)
            case 102:
                return this.mathOp02_sempred(localContext as MathOp02Context, predIndex)
            case 104:
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
        4, 1, 310, 1808, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7,
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
        138, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 5, 0, 284, 8, 0, 10, 0, 12, 0, 287, 9, 0, 1, 0, 1, 0, 3, 0, 291, 8, 0, 3, 0,
        293, 8, 0, 1, 0, 1, 0, 1, 1, 1, 1, 3, 1, 299, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 305, 8, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 3, 1, 311, 8, 1, 1, 1, 1, 1, 1, 1, 1, 1, 3, 1, 317, 8, 1, 1, 1, 1, 1, 3, 1, 321, 8, 1, 1, 2, 1, 2, 1, 2,
        1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5, 1, 5, 1, 6, 1, 6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 8, 1, 8, 1, 8, 5,
        8, 344, 8, 8, 10, 8, 12, 8, 347, 9, 8, 3, 8, 349, 8, 8, 1, 9, 1, 9, 1, 9, 5, 9, 354, 8, 9, 10, 9, 12, 9, 357, 9,
        9, 1, 9, 1, 9, 1, 10, 1, 10, 1, 11, 1, 11, 1, 12, 1, 12, 1, 13, 1, 13, 1, 14, 1, 14, 3, 14, 371, 8, 14, 1, 15,
        1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 3, 15, 380, 8, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1, 15, 1,
        15, 5, 15, 390, 8, 15, 10, 15, 12, 15, 393, 9, 15, 1, 15, 1, 15, 3, 15, 397, 8, 15, 1, 16, 1, 16, 1, 16, 1, 16,
        1, 16, 1, 16, 1, 16, 1, 16, 1, 16, 3, 16, 408, 8, 16, 1, 17, 1, 17, 1, 17, 5, 17, 413, 8, 17, 10, 17, 12, 17,
        416, 9, 17, 1, 18, 1, 18, 1, 18, 5, 18, 421, 8, 18, 10, 18, 12, 18, 424, 9, 18, 1, 19, 1, 19, 3, 19, 428, 8, 19,
        1, 19, 1, 19, 1, 20, 1, 20, 1, 20, 3, 20, 435, 8, 20, 1, 21, 1, 21, 4, 21, 439, 8, 21, 11, 21, 12, 21, 440, 1,
        21, 3, 21, 444, 8, 21, 1, 21, 3, 21, 447, 8, 21, 1, 21, 1, 21, 3, 21, 451, 8, 21, 1, 21, 4, 21, 454, 8, 21, 11,
        21, 12, 21, 455, 1, 21, 3, 21, 459, 8, 21, 1, 21, 1, 21, 1, 21, 3, 21, 464, 8, 21, 1, 22, 1, 22, 1, 22, 1, 22,
        1, 22, 1, 22, 3, 22, 472, 8, 22, 1, 23, 1, 23, 5, 23, 476, 8, 23, 10, 23, 12, 23, 479, 9, 23, 1, 24, 1, 24, 1,
        24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 1, 24, 3, 24, 491, 8, 24, 1, 25, 1, 25, 1, 25, 1, 25, 3, 25, 497,
        8, 25, 1, 25, 1, 25, 1, 26, 1, 26, 1, 26, 1, 26, 3, 26, 505, 8, 26, 1, 26, 1, 26, 1, 27, 1, 27, 1, 27, 1, 28, 1,
        28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 3, 28, 519, 8, 28, 1, 28, 3, 28, 522, 8, 28, 1, 28, 3, 28, 525, 8, 28, 1,
        29, 1, 29, 1, 29, 1, 29, 3, 29, 531, 8, 29, 1, 29, 1, 29, 3, 29, 535, 8, 29, 1, 30, 1, 30, 1, 30, 3, 30, 540, 8,
        30, 1, 30, 1, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 3, 31, 551, 8, 31, 1, 31, 3, 31, 554, 8, 31,
        1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 32, 1, 33, 1, 33, 1, 33, 1, 33, 5, 33, 567, 8, 33, 10, 33, 12, 33,
        570, 9, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 3, 33, 577, 8, 33, 1, 34, 1, 34, 1, 35, 1, 35, 1, 35, 1, 35, 1,
        35, 1, 35, 1, 35, 1, 35, 3, 35, 589, 8, 35, 1, 36, 1, 36, 1, 36, 3, 36, 594, 8, 36, 1, 37, 1, 37, 1, 37, 3, 37,
        599, 8, 37, 1, 38, 1, 38, 1, 38, 1, 39, 1, 39, 1, 39, 1, 39, 5, 39, 608, 8, 39, 10, 39, 12, 39, 611, 9, 39, 1,
        40, 1, 40, 1, 40, 1, 40, 1, 41, 1, 41, 1, 41, 3, 41, 620, 8, 41, 1, 41, 3, 41, 623, 8, 41, 1, 42, 1, 42, 1, 42,
        1, 42, 5, 42, 629, 8, 42, 10, 42, 12, 42, 632, 9, 42, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 1, 43, 3, 43, 640, 8,
        43, 1, 44, 1, 44, 1, 44, 3, 44, 645, 8, 44, 1, 44, 3, 44, 648, 8, 44, 1, 44, 3, 44, 651, 8, 44, 1, 44, 1, 44, 1,
        44, 1, 44, 3, 44, 657, 8, 44, 1, 45, 1, 45, 1, 45, 1, 46, 1, 46, 3, 46, 664, 8, 46, 1, 46, 1, 46, 1, 46, 3, 46,
        669, 8, 46, 1, 46, 1, 46, 1, 46, 3, 46, 674, 8, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 1, 46, 3, 46, 683,
        8, 46, 1, 47, 1, 47, 1, 47, 5, 47, 688, 8, 47, 10, 47, 12, 47, 691, 9, 47, 1, 48, 1, 48, 3, 48, 695, 8, 48, 1,
        48, 3, 48, 698, 8, 48, 1, 49, 1, 49, 1, 50, 1, 50, 1, 50, 1, 50, 5, 50, 706, 8, 50, 10, 50, 12, 50, 709, 9, 50,
        1, 51, 1, 51, 1, 51, 1, 51, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 5, 52, 720, 8, 52, 10, 52, 12, 52, 723, 9, 52, 1,
        53, 1, 53, 3, 53, 727, 8, 53, 1, 53, 1, 53, 3, 53, 731, 8, 53, 1, 54, 1, 54, 3, 54, 735, 8, 54, 1, 54, 1, 54, 1,
        54, 1, 54, 5, 54, 741, 8, 54, 10, 54, 12, 54, 744, 9, 54, 1, 54, 3, 54, 747, 8, 54, 1, 55, 1, 55, 1, 55, 1, 55,
        1, 56, 1, 56, 1, 56, 3, 56, 756, 8, 56, 1, 57, 1, 57, 1, 57, 3, 57, 761, 8, 57, 1, 57, 3, 57, 764, 8, 57, 1, 57,
        1, 57, 1, 58, 1, 58, 1, 58, 1, 58, 1, 58, 5, 58, 773, 8, 58, 10, 58, 12, 58, 776, 9, 58, 1, 59, 1, 59, 1, 59, 1,
        59, 1, 59, 5, 59, 783, 8, 59, 10, 59, 12, 59, 786, 9, 59, 1, 60, 1, 60, 1, 60, 1, 61, 1, 61, 1, 61, 1, 61, 5,
        61, 795, 8, 61, 10, 61, 12, 61, 798, 9, 61, 1, 62, 1, 62, 4, 62, 802, 8, 62, 11, 62, 12, 62, 803, 1, 63, 1, 63,
        1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 1, 63, 3, 63, 819, 8, 63, 1, 64, 1, 64, 1,
        64, 1, 65, 1, 65, 1, 65, 1, 66, 1, 66, 1, 66, 1, 67, 1, 67, 1, 67, 1, 68, 3, 68, 834, 8, 68, 1, 68, 1, 68, 1,
        69, 3, 69, 839, 8, 69, 1, 69, 1, 69, 1, 69, 5, 69, 844, 8, 69, 10, 69, 12, 69, 847, 9, 69, 1, 70, 3, 70, 850, 8,
        70, 1, 70, 3, 70, 853, 8, 70, 1, 70, 5, 70, 856, 8, 70, 10, 70, 12, 70, 859, 9, 70, 1, 71, 1, 71, 1, 71, 3, 71,
        864, 8, 71, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 870, 8, 72, 1, 72, 1, 72, 1, 72, 3, 72, 875, 8, 72, 3, 72, 877,
        8, 72, 1, 73, 1, 73, 1, 73, 1, 74, 1, 74, 1, 75, 1, 75, 3, 75, 886, 8, 75, 1, 75, 1, 75, 3, 75, 890, 8, 75, 1,
        75, 3, 75, 893, 8, 75, 1, 75, 1, 75, 1, 76, 1, 76, 3, 76, 899, 8, 76, 1, 76, 1, 76, 3, 76, 903, 8, 76, 3, 76,
        905, 8, 76, 1, 77, 1, 77, 3, 77, 909, 8, 77, 1, 77, 3, 77, 912, 8, 77, 1, 77, 4, 77, 915, 8, 77, 11, 77, 12, 77,
        916, 1, 77, 3, 77, 920, 8, 77, 1, 77, 1, 77, 3, 77, 924, 8, 77, 1, 77, 1, 77, 3, 77, 928, 8, 77, 1, 77, 3, 77,
        931, 8, 77, 1, 77, 4, 77, 934, 8, 77, 11, 77, 12, 77, 935, 1, 77, 3, 77, 939, 8, 77, 1, 77, 1, 77, 3, 77, 943,
        8, 77, 3, 77, 945, 8, 77, 1, 78, 1, 78, 1, 78, 1, 78, 1, 78, 3, 78, 952, 8, 78, 1, 78, 3, 78, 955, 8, 78, 1, 79,
        1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79,
        1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79, 1, 79,
        1, 79, 3, 79, 991, 8, 79, 1, 80, 1, 80, 3, 80, 995, 8, 80, 1, 80, 1, 80, 3, 80, 999, 8, 80, 1, 80, 3, 80, 1002,
        8, 80, 1, 80, 1, 80, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 1, 81, 5, 81, 1012, 8, 81, 10, 81, 12, 81, 1015, 9, 81,
        1, 82, 1, 82, 1, 82, 1, 82, 1, 82, 1, 82, 5, 82, 1023, 8, 82, 10, 82, 12, 82, 1026, 9, 82, 1, 83, 1, 83, 1, 83,
        3, 83, 1031, 8, 83, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 1, 84, 3, 84, 1039, 8, 84, 1, 85, 1, 85, 1, 85, 1, 85, 1,
        85, 1, 85, 3, 85, 1047, 8, 85, 1, 85, 1, 85, 3, 85, 1051, 8, 85, 3, 85, 1053, 8, 85, 1, 86, 1, 86, 1, 86, 1, 86,
        1, 86, 1, 86, 3, 86, 1061, 8, 86, 1, 86, 1, 86, 3, 86, 1065, 8, 86, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 1, 86, 1,
        86, 1, 86, 3, 86, 1075, 8, 86, 1, 86, 1, 86, 1, 86, 1, 86, 5, 86, 1081, 8, 86, 10, 86, 12, 86, 1084, 9, 86, 1,
        87, 1, 87, 3, 87, 1088, 8, 87, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 3, 88, 1095, 8, 88, 1, 88, 3, 88, 1098, 8, 88,
        1, 88, 3, 88, 1101, 8, 88, 1, 88, 1, 88, 3, 88, 1105, 8, 88, 1, 88, 3, 88, 1108, 8, 88, 1, 88, 3, 88, 1111, 8,
        88, 3, 88, 1113, 8, 88, 1, 89, 1, 89, 1, 89, 3, 89, 1118, 8, 89, 1, 89, 3, 89, 1121, 8, 89, 1, 89, 3, 89, 1124,
        8, 89, 1, 90, 1, 90, 1, 90, 1, 90, 1, 90, 3, 90, 1131, 8, 90, 1, 91, 1, 91, 1, 91, 1, 92, 1, 92, 1, 92, 3, 92,
        1139, 8, 92, 1, 92, 1, 92, 3, 92, 1143, 8, 92, 1, 92, 1, 92, 3, 92, 1147, 8, 92, 1, 92, 3, 92, 1150, 8, 92, 1,
        93, 1, 93, 1, 94, 1, 94, 1, 94, 1, 94, 1, 94, 3, 94, 1159, 8, 94, 1, 94, 1, 94, 3, 94, 1163, 8, 94, 1, 94, 1,
        94, 1, 94, 3, 94, 1168, 8, 94, 1, 94, 1, 94, 3, 94, 1172, 8, 94, 1, 94, 1, 94, 1, 94, 3, 94, 1177, 8, 94, 1, 94,
        1, 94, 3, 94, 1181, 8, 94, 1, 94, 5, 94, 1184, 8, 94, 10, 94, 12, 94, 1187, 9, 94, 1, 95, 1, 95, 3, 95, 1191, 8,
        95, 1, 95, 1, 95, 3, 95, 1195, 8, 95, 1, 95, 3, 95, 1198, 8, 95, 1, 95, 3, 95, 1201, 8, 95, 1, 95, 3, 95, 1204,
        8, 95, 1, 95, 3, 95, 1207, 8, 95, 1, 95, 3, 95, 1210, 8, 95, 1, 95, 3, 95, 1213, 8, 95, 1, 95, 3, 95, 1216, 8,
        95, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 1, 96, 5, 96, 1224, 8, 96, 10, 96, 12, 96, 1227, 9, 96, 1, 97, 1, 97, 1,
        97, 1, 97, 1, 97, 1, 97, 5, 97, 1235, 8, 97, 10, 97, 12, 97, 1238, 9, 97, 1, 98, 1, 98, 1, 98, 3, 98, 1243, 8,
        98, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 1254, 8, 99, 1, 99, 1, 99, 1, 99, 3,
        99, 1259, 8, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 1268, 8, 99, 1, 99, 1, 99, 1, 99, 1,
        99, 3, 99, 1274, 8, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 1280, 8, 99, 1, 99, 1, 99, 3, 99, 1284, 8, 99, 1, 99,
        1, 99, 1, 99, 1, 99, 1, 99, 5, 99, 1291, 8, 99, 10, 99, 12, 99, 1294, 9, 99, 1, 100, 1, 100, 1, 100, 1, 100, 1,
        100, 1, 100, 5, 100, 1302, 8, 100, 10, 100, 12, 100, 1305, 9, 100, 1, 101, 1, 101, 1, 101, 1, 101, 1, 101, 1,
        101, 5, 101, 1313, 8, 101, 10, 101, 12, 101, 1316, 9, 101, 1, 102, 1, 102, 1, 102, 1, 102, 1, 102, 1, 102, 5,
        102, 1324, 8, 102, 10, 102, 12, 102, 1327, 9, 102, 1, 103, 1, 103, 1, 103, 3, 103, 1332, 8, 103, 1, 104, 1, 104,
        1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 1, 104,
        1, 104, 1, 104, 1, 104, 1, 104, 1, 104, 3, 104, 1355, 8, 104, 1, 104, 1, 104, 4, 104, 1359, 8, 104, 11, 104, 12,
        104, 1360, 5, 104, 1363, 8, 104, 10, 104, 12, 104, 1366, 9, 104, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 1, 105,
        1, 105, 1, 105, 1, 105, 1, 105, 1, 105, 3, 105, 1379, 8, 105, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1, 106, 1,
        106, 1, 107, 1, 107, 1, 107, 1, 107, 1, 107, 5, 107, 1393, 8, 107, 10, 107, 12, 107, 1396, 9, 107, 1, 107, 1,
        107, 1, 108, 1, 108, 3, 108, 1402, 8, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 4, 108, 1409, 8, 108, 11,
        108, 12, 108, 1410, 1, 108, 1, 108, 3, 108, 1415, 8, 108, 1, 108, 1, 108, 1, 109, 1, 109, 1, 109, 1, 109, 5,
        109, 1423, 8, 109, 10, 109, 12, 109, 1426, 9, 109, 1, 110, 1, 110, 1, 110, 1, 110, 5, 110, 1432, 8, 110, 10,
        110, 12, 110, 1435, 9, 110, 1, 110, 1, 110, 1, 111, 1, 111, 1, 111, 1, 111, 4, 111, 1443, 8, 111, 11, 111, 12,
        111, 1444, 1, 111, 1, 111, 1, 112, 1, 112, 1, 112, 1, 112, 1, 112, 5, 112, 1454, 8, 112, 10, 112, 12, 112, 1457,
        9, 112, 3, 112, 1459, 8, 112, 1, 112, 1, 112, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 3, 113,
        1470, 8, 113, 3, 113, 1472, 8, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 3,
        113, 1483, 8, 113, 3, 113, 1485, 8, 113, 1, 113, 1, 113, 3, 113, 1489, 8, 113, 1, 114, 1, 114, 1, 114, 1, 114,
        1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 3, 114, 1505, 8, 114, 1, 115, 1,
        115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 3, 115, 1516, 8, 115, 1, 115, 1, 115, 1, 115, 1,
        115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 3, 115, 1529, 8, 115, 1, 115, 1, 115, 3, 115, 1533,
        8, 115, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 3, 116, 1542, 8, 116, 1, 116, 1, 116, 1, 116, 3,
        116, 1547, 8, 116, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 1, 117, 3, 117, 1556, 8, 117, 3, 117, 1558,
        8, 117, 1, 117, 1, 117, 1, 117, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 1, 118, 1, 119, 1, 119, 1, 119,
        1, 119, 1, 119, 1, 119, 1, 119, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 120, 1, 121, 1, 121, 1, 121,
        1, 121, 1, 121, 1, 121, 1, 121, 1, 122, 1, 122, 1, 122, 3, 122, 1594, 8, 122, 1, 122, 3, 122, 1597, 8, 122, 1,
        122, 3, 122, 1600, 8, 122, 1, 122, 1, 122, 1, 122, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1,
        123, 1, 123, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 5, 124, 1619, 8, 124, 10, 124, 12, 124, 1622, 9, 124, 3,
        124, 1624, 8, 124, 1, 124, 1, 124, 1, 125, 1, 125, 1, 125, 5, 125, 1631, 8, 125, 10, 125, 12, 125, 1634, 9, 125,
        1, 125, 1, 125, 1, 125, 1, 125, 5, 125, 1640, 8, 125, 10, 125, 12, 125, 1643, 9, 125, 1, 125, 3, 125, 1646, 8,
        125, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 3, 126, 1659, 8,
        126, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 127, 1, 128, 1, 128, 1, 128, 1, 128, 1, 129, 1, 129, 1, 130, 3,
        130, 1674, 8, 130, 1, 130, 1, 130, 3, 130, 1678, 8, 130, 1, 130, 3, 130, 1681, 8, 130, 1, 131, 1, 131, 1, 132,
        1, 132, 3, 132, 1687, 8, 132, 1, 133, 1, 133, 1, 133, 1, 133, 5, 133, 1693, 8, 133, 10, 133, 12, 133, 1696, 9,
        133, 3, 133, 1698, 8, 133, 1, 133, 1, 133, 1, 134, 1, 134, 1, 134, 1, 134, 5, 134, 1706, 8, 134, 10, 134, 12,
        134, 1709, 9, 134, 3, 134, 1711, 8, 134, 1, 134, 1, 134, 1, 135, 1, 135, 1, 135, 1, 135, 5, 135, 1719, 8, 135,
        10, 135, 12, 135, 1722, 9, 135, 3, 135, 1724, 8, 135, 1, 135, 1, 135, 1, 136, 1, 136, 1, 136, 1, 136, 1, 137, 1,
        137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 3, 137,
        1746, 8, 137, 1, 137, 1, 137, 1, 137, 3, 137, 1751, 8, 137, 1, 137, 1, 137, 1, 137, 1, 137, 1, 137, 3, 137,
        1758, 8, 137, 1, 137, 1, 137, 1, 137, 3, 137, 1763, 8, 137, 1, 137, 3, 137, 1766, 8, 137, 1, 138, 1, 138, 1,
        138, 1, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1775, 8, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1782,
        8, 138, 1, 138, 1, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1789, 8, 138, 1, 138, 3, 138, 1792, 8, 138, 1, 138, 1,
        138, 1, 138, 1, 138, 3, 138, 1798, 8, 138, 1, 138, 1, 138, 1, 138, 3, 138, 1803, 8, 138, 1, 138, 3, 138, 1806,
        8, 138, 1, 138, 0, 11, 162, 164, 172, 188, 192, 194, 198, 200, 202, 204, 208, 139, 0, 2, 4, 6, 8, 10, 12, 14,
        16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70,
        72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102, 104, 106, 108, 110, 112, 114, 116, 118, 120,
        122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164,
        166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190, 192, 194, 196, 198, 200, 202, 204, 206, 208,
        210, 212, 214, 216, 218, 220, 222, 224, 226, 228, 230, 232, 234, 236, 238, 240, 242, 244, 246, 248, 250, 252,
        254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 0, 21, 1, 0, 303, 304, 2, 0, 4, 4, 247, 247, 1, 0,
        248, 249, 2, 0, 4, 4, 67, 67, 2, 0, 11, 11, 62, 62, 2, 0, 90, 90, 123, 123, 2, 0, 4, 4, 8, 8, 2, 0, 271, 271,
        277, 277, 2, 0, 281, 284, 286, 287, 2, 0, 279, 279, 285, 285, 1, 0, 271, 272, 2, 0, 273, 274, 277, 277, 1, 0,
        266, 267, 7, 0, 8, 8, 15, 15, 44, 44, 75, 75, 131, 132, 189, 189, 196, 196, 1, 0, 230, 231, 1, 0, 86, 87, 8, 0,
        19, 19, 28, 29, 44, 44, 82, 82, 129, 129, 145, 145, 187, 187, 213, 213, 9, 0, 8, 8, 26, 27, 53, 53, 113, 114,
        141, 141, 170, 170, 188, 188, 236, 236, 251, 268, 3, 0, 26, 27, 91, 91, 220, 220, 2, 0, 55, 56, 144, 144, 1, 0,
        201, 202, 1970, 0, 292, 1, 0, 0, 0, 2, 320, 1, 0, 0, 0, 4, 322, 1, 0, 0, 0, 6, 325, 1, 0, 0, 0, 8, 328, 1, 0, 0,
        0, 10, 331, 1, 0, 0, 0, 12, 334, 1, 0, 0, 0, 14, 336, 1, 0, 0, 0, 16, 338, 1, 0, 0, 0, 18, 355, 1, 0, 0, 0, 20,
        360, 1, 0, 0, 0, 22, 362, 1, 0, 0, 0, 24, 364, 1, 0, 0, 0, 26, 366, 1, 0, 0, 0, 28, 370, 1, 0, 0, 0, 30, 396, 1,
        0, 0, 0, 32, 407, 1, 0, 0, 0, 34, 409, 1, 0, 0, 0, 36, 417, 1, 0, 0, 0, 38, 427, 1, 0, 0, 0, 40, 434, 1, 0, 0,
        0, 42, 463, 1, 0, 0, 0, 44, 471, 1, 0, 0, 0, 46, 473, 1, 0, 0, 0, 48, 490, 1, 0, 0, 0, 50, 492, 1, 0, 0, 0, 52,
        500, 1, 0, 0, 0, 54, 508, 1, 0, 0, 0, 56, 511, 1, 0, 0, 0, 58, 526, 1, 0, 0, 0, 60, 536, 1, 0, 0, 0, 62, 543, 1,
        0, 0, 0, 64, 555, 1, 0, 0, 0, 66, 576, 1, 0, 0, 0, 68, 578, 1, 0, 0, 0, 70, 588, 1, 0, 0, 0, 72, 590, 1, 0, 0,
        0, 74, 595, 1, 0, 0, 0, 76, 600, 1, 0, 0, 0, 78, 603, 1, 0, 0, 0, 80, 612, 1, 0, 0, 0, 82, 616, 1, 0, 0, 0, 84,
        624, 1, 0, 0, 0, 86, 639, 1, 0, 0, 0, 88, 656, 1, 0, 0, 0, 90, 658, 1, 0, 0, 0, 92, 682, 1, 0, 0, 0, 94, 684, 1,
        0, 0, 0, 96, 692, 1, 0, 0, 0, 98, 699, 1, 0, 0, 0, 100, 701, 1, 0, 0, 0, 102, 710, 1, 0, 0, 0, 104, 714, 1, 0,
        0, 0, 106, 724, 1, 0, 0, 0, 108, 732, 1, 0, 0, 0, 110, 748, 1, 0, 0, 0, 112, 752, 1, 0, 0, 0, 114, 757, 1, 0, 0,
        0, 116, 767, 1, 0, 0, 0, 118, 777, 1, 0, 0, 0, 120, 787, 1, 0, 0, 0, 122, 790, 1, 0, 0, 0, 124, 799, 1, 0, 0, 0,
        126, 818, 1, 0, 0, 0, 128, 820, 1, 0, 0, 0, 130, 823, 1, 0, 0, 0, 132, 826, 1, 0, 0, 0, 134, 829, 1, 0, 0, 0,
        136, 833, 1, 0, 0, 0, 138, 838, 1, 0, 0, 0, 140, 849, 1, 0, 0, 0, 142, 863, 1, 0, 0, 0, 144, 876, 1, 0, 0, 0,
        146, 878, 1, 0, 0, 0, 148, 881, 1, 0, 0, 0, 150, 883, 1, 0, 0, 0, 152, 904, 1, 0, 0, 0, 154, 944, 1, 0, 0, 0,
        156, 954, 1, 0, 0, 0, 158, 990, 1, 0, 0, 0, 160, 992, 1, 0, 0, 0, 162, 1005, 1, 0, 0, 0, 164, 1016, 1, 0, 0, 0,
        166, 1030, 1, 0, 0, 0, 168, 1038, 1, 0, 0, 0, 170, 1052, 1, 0, 0, 0, 172, 1060, 1, 0, 0, 0, 174, 1087, 1, 0, 0,
        0, 176, 1112, 1, 0, 0, 0, 178, 1114, 1, 0, 0, 0, 180, 1130, 1, 0, 0, 0, 182, 1132, 1, 0, 0, 0, 184, 1149, 1, 0,
        0, 0, 186, 1151, 1, 0, 0, 0, 188, 1153, 1, 0, 0, 0, 190, 1215, 1, 0, 0, 0, 192, 1217, 1, 0, 0, 0, 194, 1228, 1,
        0, 0, 0, 196, 1242, 1, 0, 0, 0, 198, 1244, 1, 0, 0, 0, 200, 1295, 1, 0, 0, 0, 202, 1306, 1, 0, 0, 0, 204, 1317,
        1, 0, 0, 0, 206, 1331, 1, 0, 0, 0, 208, 1354, 1, 0, 0, 0, 210, 1378, 1, 0, 0, 0, 212, 1380, 1, 0, 0, 0, 214,
        1387, 1, 0, 0, 0, 216, 1399, 1, 0, 0, 0, 218, 1418, 1, 0, 0, 0, 220, 1427, 1, 0, 0, 0, 222, 1438, 1, 0, 0, 0,
        224, 1448, 1, 0, 0, 0, 226, 1488, 1, 0, 0, 0, 228, 1504, 1, 0, 0, 0, 230, 1532, 1, 0, 0, 0, 232, 1546, 1, 0, 0,
        0, 234, 1548, 1, 0, 0, 0, 236, 1562, 1, 0, 0, 0, 238, 1569, 1, 0, 0, 0, 240, 1576, 1, 0, 0, 0, 242, 1583, 1, 0,
        0, 0, 244, 1590, 1, 0, 0, 0, 246, 1604, 1, 0, 0, 0, 248, 1613, 1, 0, 0, 0, 250, 1645, 1, 0, 0, 0, 252, 1658, 1,
        0, 0, 0, 254, 1660, 1, 0, 0, 0, 256, 1666, 1, 0, 0, 0, 258, 1670, 1, 0, 0, 0, 260, 1680, 1, 0, 0, 0, 262, 1682,
        1, 0, 0, 0, 264, 1686, 1, 0, 0, 0, 266, 1688, 1, 0, 0, 0, 268, 1701, 1, 0, 0, 0, 270, 1714, 1, 0, 0, 0, 272,
        1727, 1, 0, 0, 0, 274, 1765, 1, 0, 0, 0, 276, 1805, 1, 0, 0, 0, 278, 290, 5, 83, 0, 0, 279, 280, 5, 294, 0, 0,
        280, 285, 3, 4, 2, 0, 281, 282, 5, 270, 0, 0, 282, 284, 3, 4, 2, 0, 283, 281, 1, 0, 0, 0, 284, 287, 1, 0, 0, 0,
        285, 283, 1, 0, 0, 0, 285, 286, 1, 0, 0, 0, 286, 288, 1, 0, 0, 0, 287, 285, 1, 0, 0, 0, 288, 289, 5, 295, 0, 0,
        289, 291, 1, 0, 0, 0, 290, 279, 1, 0, 0, 0, 290, 291, 1, 0, 0, 0, 291, 293, 1, 0, 0, 0, 292, 278, 1, 0, 0, 0,
        292, 293, 1, 0, 0, 0, 293, 294, 1, 0, 0, 0, 294, 295, 3, 2, 1, 0, 295, 1, 1, 0, 0, 0, 296, 298, 3, 14, 7, 0,
        297, 299, 5, 297, 0, 0, 298, 297, 1, 0, 0, 0, 298, 299, 1, 0, 0, 0, 299, 300, 1, 0, 0, 0, 300, 301, 5, 0, 0, 1,
        301, 321, 1, 0, 0, 0, 302, 304, 3, 42, 21, 0, 303, 305, 5, 297, 0, 0, 304, 303, 1, 0, 0, 0, 304, 305, 1, 0, 0,
        0, 305, 306, 1, 0, 0, 0, 306, 307, 5, 0, 0, 1, 307, 321, 1, 0, 0, 0, 308, 310, 3, 28, 14, 0, 309, 311, 5, 297,
        0, 0, 310, 309, 1, 0, 0, 0, 310, 311, 1, 0, 0, 0, 311, 312, 1, 0, 0, 0, 312, 313, 5, 0, 0, 1, 313, 321, 1, 0, 0,
        0, 314, 316, 3, 16, 8, 0, 315, 317, 5, 297, 0, 0, 316, 315, 1, 0, 0, 0, 316, 317, 1, 0, 0, 0, 317, 318, 1, 0, 0,
        0, 318, 319, 5, 0, 0, 1, 319, 321, 1, 0, 0, 0, 320, 296, 1, 0, 0, 0, 320, 302, 1, 0, 0, 0, 320, 308, 1, 0, 0, 0,
        320, 314, 1, 0, 0, 0, 321, 3, 1, 0, 0, 0, 322, 323, 5, 303, 0, 0, 323, 324, 5, 303, 0, 0, 324, 5, 1, 0, 0, 0,
        325, 326, 5, 10, 0, 0, 326, 327, 3, 12, 6, 0, 327, 7, 1, 0, 0, 0, 328, 329, 5, 13, 0, 0, 329, 330, 3, 12, 6, 0,
        330, 9, 1, 0, 0, 0, 331, 332, 5, 20, 0, 0, 332, 333, 3, 12, 6, 0, 333, 11, 1, 0, 0, 0, 334, 335, 7, 0, 0, 0,
        335, 13, 1, 0, 0, 0, 336, 337, 3, 186, 93, 0, 337, 15, 1, 0, 0, 0, 338, 339, 5, 80, 0, 0, 339, 348, 3, 186, 93,
        0, 340, 345, 3, 186, 93, 0, 341, 342, 5, 270, 0, 0, 342, 344, 3, 186, 93, 0, 343, 341, 1, 0, 0, 0, 344, 347, 1,
        0, 0, 0, 345, 343, 1, 0, 0, 0, 345, 346, 1, 0, 0, 0, 346, 349, 1, 0, 0, 0, 347, 345, 1, 0, 0, 0, 348, 340, 1, 0,
        0, 0, 348, 349, 1, 0, 0, 0, 349, 17, 1, 0, 0, 0, 350, 351, 3, 12, 6, 0, 351, 352, 5, 299, 0, 0, 352, 354, 1, 0,
        0, 0, 353, 350, 1, 0, 0, 0, 354, 357, 1, 0, 0, 0, 355, 353, 1, 0, 0, 0, 355, 356, 1, 0, 0, 0, 356, 358, 1, 0, 0,
        0, 357, 355, 1, 0, 0, 0, 358, 359, 3, 12, 6, 0, 359, 19, 1, 0, 0, 0, 360, 361, 3, 12, 6, 0, 361, 21, 1, 0, 0, 0,
        362, 363, 3, 12, 6, 0, 363, 23, 1, 0, 0, 0, 364, 365, 3, 12, 6, 0, 365, 25, 1, 0, 0, 0, 366, 367, 3, 12, 6, 0,
        367, 27, 1, 0, 0, 0, 368, 371, 3, 30, 15, 0, 369, 371, 3, 32, 16, 0, 370, 368, 1, 0, 0, 0, 370, 369, 1, 0, 0, 0,
        371, 29, 1, 0, 0, 0, 372, 373, 5, 45, 0, 0, 373, 374, 5, 198, 0, 0, 374, 379, 3, 18, 9, 0, 375, 376, 5, 294, 0,
        0, 376, 377, 3, 34, 17, 0, 377, 378, 5, 295, 0, 0, 378, 380, 1, 0, 0, 0, 379, 375, 1, 0, 0, 0, 379, 380, 1, 0,
        0, 0, 380, 397, 1, 0, 0, 0, 381, 382, 5, 45, 0, 0, 382, 383, 5, 242, 0, 0, 383, 384, 5, 147, 0, 0, 384, 385, 3,
        12, 6, 0, 385, 386, 5, 294, 0, 0, 386, 391, 3, 46, 23, 0, 387, 388, 5, 270, 0, 0, 388, 390, 3, 46, 23, 0, 389,
        387, 1, 0, 0, 0, 390, 393, 1, 0, 0, 0, 391, 389, 1, 0, 0, 0, 391, 392, 1, 0, 0, 0, 392, 394, 1, 0, 0, 0, 393,
        391, 1, 0, 0, 0, 394, 395, 5, 295, 0, 0, 395, 397, 1, 0, 0, 0, 396, 372, 1, 0, 0, 0, 396, 381, 1, 0, 0, 0, 397,
        31, 1, 0, 0, 0, 398, 399, 5, 70, 0, 0, 399, 400, 5, 198, 0, 0, 400, 408, 3, 18, 9, 0, 401, 402, 5, 70, 0, 0,
        402, 403, 5, 242, 0, 0, 403, 404, 3, 12, 6, 0, 404, 405, 5, 147, 0, 0, 405, 406, 3, 12, 6, 0, 406, 408, 1, 0, 0,
        0, 407, 398, 1, 0, 0, 0, 407, 401, 1, 0, 0, 0, 408, 33, 1, 0, 0, 0, 409, 414, 3, 36, 18, 0, 410, 411, 5, 270, 0,
        0, 411, 413, 3, 36, 18, 0, 412, 410, 1, 0, 0, 0, 413, 416, 1, 0, 0, 0, 414, 412, 1, 0, 0, 0, 414, 415, 1, 0, 0,
        0, 415, 35, 1, 0, 0, 0, 416, 414, 1, 0, 0, 0, 417, 418, 3, 24, 12, 0, 418, 422, 3, 276, 138, 0, 419, 421, 3, 38,
        19, 0, 420, 419, 1, 0, 0, 0, 421, 424, 1, 0, 0, 0, 422, 420, 1, 0, 0, 0, 422, 423, 1, 0, 0, 0, 423, 37, 1, 0, 0,
        0, 424, 422, 1, 0, 0, 0, 425, 426, 5, 39, 0, 0, 426, 428, 3, 26, 13, 0, 427, 425, 1, 0, 0, 0, 427, 428, 1, 0, 0,
        0, 428, 429, 1, 0, 0, 0, 429, 430, 3, 40, 20, 0, 430, 39, 1, 0, 0, 0, 431, 432, 5, 140, 0, 0, 432, 435, 5, 141,
        0, 0, 433, 435, 5, 141, 0, 0, 434, 431, 1, 0, 0, 0, 434, 433, 1, 0, 0, 0, 435, 41, 1, 0, 0, 0, 436, 438, 3, 76,
        38, 0, 437, 439, 3, 44, 22, 0, 438, 437, 1, 0, 0, 0, 439, 440, 1, 0, 0, 0, 440, 438, 1, 0, 0, 0, 440, 441, 1, 0,
        0, 0, 441, 443, 1, 0, 0, 0, 442, 444, 3, 90, 45, 0, 443, 442, 1, 0, 0, 0, 443, 444, 1, 0, 0, 0, 444, 446, 1, 0,
        0, 0, 445, 447, 3, 84, 42, 0, 446, 445, 1, 0, 0, 0, 446, 447, 1, 0, 0, 0, 447, 464, 1, 0, 0, 0, 448, 450, 3,
        128, 64, 0, 449, 451, 3, 90, 45, 0, 450, 449, 1, 0, 0, 0, 450, 451, 1, 0, 0, 0, 451, 453, 1, 0, 0, 0, 452, 454,
        3, 44, 22, 0, 453, 452, 1, 0, 0, 0, 454, 455, 1, 0, 0, 0, 455, 453, 1, 0, 0, 0, 455, 456, 1, 0, 0, 0, 456, 458,
        1, 0, 0, 0, 457, 459, 3, 84, 42, 0, 458, 457, 1, 0, 0, 0, 458, 459, 1, 0, 0, 0, 459, 464, 1, 0, 0, 0, 460, 464,
        3, 82, 41, 0, 461, 464, 3, 56, 28, 0, 462, 464, 3, 44, 22, 0, 463, 436, 1, 0, 0, 0, 463, 448, 1, 0, 0, 0, 463,
        460, 1, 0, 0, 0, 463, 461, 1, 0, 0, 0, 463, 462, 1, 0, 0, 0, 464, 43, 1, 0, 0, 0, 465, 472, 3, 58, 29, 0, 466,
        472, 3, 62, 31, 0, 467, 472, 3, 78, 39, 0, 468, 472, 3, 50, 25, 0, 469, 472, 3, 54, 27, 0, 470, 472, 3, 52, 26,
        0, 471, 465, 1, 0, 0, 0, 471, 466, 1, 0, 0, 0, 471, 467, 1, 0, 0, 0, 471, 468, 1, 0, 0, 0, 471, 469, 1, 0, 0, 0,
        471, 470, 1, 0, 0, 0, 472, 45, 1, 0, 0, 0, 473, 477, 3, 12, 6, 0, 474, 476, 3, 48, 24, 0, 475, 474, 1, 0, 0, 0,
        476, 479, 1, 0, 0, 0, 477, 475, 1, 0, 0, 0, 477, 478, 1, 0, 0, 0, 478, 47, 1, 0, 0, 0, 479, 477, 1, 0, 0, 0,
        480, 481, 5, 290, 0, 0, 481, 482, 3, 274, 137, 0, 482, 483, 5, 291, 0, 0, 483, 491, 1, 0, 0, 0, 484, 485, 5,
        290, 0, 0, 485, 486, 3, 12, 6, 0, 486, 487, 5, 291, 0, 0, 487, 491, 1, 0, 0, 0, 488, 489, 5, 299, 0, 0, 489,
        491, 3, 12, 6, 0, 490, 480, 1, 0, 0, 0, 490, 484, 1, 0, 0, 0, 490, 488, 1, 0, 0, 0, 491, 49, 1, 0, 0, 0, 492,
        493, 5, 173, 0, 0, 493, 494, 5, 117, 0, 0, 494, 496, 3, 12, 6, 0, 495, 497, 3, 6, 3, 0, 496, 495, 1, 0, 0, 0,
        496, 497, 1, 0, 0, 0, 497, 498, 1, 0, 0, 0, 498, 499, 3, 186, 93, 0, 499, 51, 1, 0, 0, 0, 500, 501, 5, 214, 0,
        0, 501, 502, 5, 117, 0, 0, 502, 504, 3, 12, 6, 0, 503, 505, 3, 6, 3, 0, 504, 503, 1, 0, 0, 0, 504, 505, 1, 0, 0,
        0, 505, 506, 1, 0, 0, 0, 506, 507, 3, 186, 93, 0, 507, 53, 1, 0, 0, 0, 508, 509, 5, 241, 0, 0, 509, 510, 3, 46,
        23, 0, 510, 55, 1, 0, 0, 0, 511, 512, 5, 112, 0, 0, 512, 513, 5, 117, 0, 0, 513, 514, 3, 46, 23, 0, 514, 515, 5,
        218, 0, 0, 515, 518, 3, 186, 93, 0, 516, 517, 5, 13, 0, 0, 517, 519, 3, 186, 93, 0, 518, 516, 1, 0, 0, 0, 518,
        519, 1, 0, 0, 0, 519, 521, 1, 0, 0, 0, 520, 522, 3, 64, 32, 0, 521, 520, 1, 0, 0, 0, 521, 522, 1, 0, 0, 0, 522,
        524, 1, 0, 0, 0, 523, 525, 3, 84, 42, 0, 524, 523, 1, 0, 0, 0, 524, 525, 1, 0, 0, 0, 525, 57, 1, 0, 0, 0, 526,
        527, 5, 112, 0, 0, 527, 528, 5, 117, 0, 0, 528, 530, 3, 12, 6, 0, 529, 531, 3, 6, 3, 0, 530, 529, 1, 0, 0, 0,
        530, 531, 1, 0, 0, 0, 531, 532, 1, 0, 0, 0, 532, 534, 3, 186, 93, 0, 533, 535, 3, 60, 30, 0, 534, 533, 1, 0, 0,
        0, 534, 535, 1, 0, 0, 0, 535, 59, 1, 0, 0, 0, 536, 537, 5, 147, 0, 0, 537, 539, 5, 244, 0, 0, 538, 540, 3, 66,
        33, 0, 539, 538, 1, 0, 0, 0, 539, 540, 1, 0, 0, 0, 540, 541, 1, 0, 0, 0, 541, 542, 3, 70, 35, 0, 542, 61, 1, 0,
        0, 0, 543, 544, 5, 112, 0, 0, 544, 545, 5, 117, 0, 0, 545, 546, 3, 46, 23, 0, 546, 547, 5, 218, 0, 0, 547, 550,
        3, 186, 93, 0, 548, 549, 5, 13, 0, 0, 549, 551, 3, 186, 93, 0, 550, 548, 1, 0, 0, 0, 550, 551, 1, 0, 0, 0, 551,
        553, 1, 0, 0, 0, 552, 554, 3, 64, 32, 0, 553, 552, 1, 0, 0, 0, 553, 554, 1, 0, 0, 0, 554, 63, 1, 0, 0, 0, 555,
        556, 5, 147, 0, 0, 556, 557, 5, 244, 0, 0, 557, 558, 5, 225, 0, 0, 558, 559, 3, 186, 93, 0, 559, 560, 5, 245, 0,
        0, 560, 561, 5, 250, 0, 0, 561, 65, 1, 0, 0, 0, 562, 563, 5, 294, 0, 0, 563, 568, 3, 12, 6, 0, 564, 565, 5, 270,
        0, 0, 565, 567, 3, 12, 6, 0, 566, 564, 1, 0, 0, 0, 567, 570, 1, 0, 0, 0, 568, 566, 1, 0, 0, 0, 568, 569, 1, 0,
        0, 0, 569, 571, 1, 0, 0, 0, 570, 568, 1, 0, 0, 0, 571, 572, 5, 295, 0, 0, 572, 577, 1, 0, 0, 0, 573, 574, 5,
        147, 0, 0, 574, 575, 5, 39, 0, 0, 575, 577, 3, 68, 34, 0, 576, 562, 1, 0, 0, 0, 576, 573, 1, 0, 0, 0, 577, 67,
        1, 0, 0, 0, 578, 579, 3, 12, 6, 0, 579, 69, 1, 0, 0, 0, 580, 581, 5, 245, 0, 0, 581, 589, 5, 250, 0, 0, 582,
        583, 5, 245, 0, 0, 583, 584, 5, 173, 0, 0, 584, 589, 3, 72, 36, 0, 585, 586, 5, 245, 0, 0, 586, 587, 5, 212, 0,
        0, 587, 589, 3, 74, 37, 0, 588, 580, 1, 0, 0, 0, 588, 582, 1, 0, 0, 0, 588, 585, 1, 0, 0, 0, 589, 71, 1, 0, 0,
        0, 590, 593, 5, 79, 0, 0, 591, 592, 5, 225, 0, 0, 592, 594, 3, 186, 93, 0, 593, 591, 1, 0, 0, 0, 593, 594, 1, 0,
        0, 0, 594, 73, 1, 0, 0, 0, 595, 598, 5, 79, 0, 0, 596, 597, 5, 225, 0, 0, 597, 599, 3, 186, 93, 0, 598, 596, 1,
        0, 0, 0, 598, 599, 1, 0, 0, 0, 599, 75, 1, 0, 0, 0, 600, 601, 5, 212, 0, 0, 601, 602, 3, 176, 88, 0, 602, 77, 1,
        0, 0, 0, 603, 604, 5, 185, 0, 0, 604, 609, 3, 80, 40, 0, 605, 606, 5, 270, 0, 0, 606, 608, 3, 80, 40, 0, 607,
        605, 1, 0, 0, 0, 608, 611, 1, 0, 0, 0, 609, 607, 1, 0, 0, 0, 609, 610, 1, 0, 0, 0, 610, 79, 1, 0, 0, 0, 611,
        609, 1, 0, 0, 0, 612, 613, 3, 46, 23, 0, 613, 614, 5, 283, 0, 0, 614, 615, 3, 186, 93, 0, 615, 81, 1, 0, 0, 0,
        616, 617, 5, 61, 0, 0, 617, 619, 3, 88, 44, 0, 618, 620, 3, 90, 45, 0, 619, 618, 1, 0, 0, 0, 619, 620, 1, 0, 0,
        0, 620, 622, 1, 0, 0, 0, 621, 623, 3, 84, 42, 0, 622, 621, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 83, 1, 0, 0,
        0, 624, 625, 5, 246, 0, 0, 625, 630, 3, 86, 43, 0, 626, 627, 5, 270, 0, 0, 627, 629, 3, 86, 43, 0, 628, 626, 1,
        0, 0, 0, 629, 632, 1, 0, 0, 0, 630, 628, 1, 0, 0, 0, 630, 631, 1, 0, 0, 0, 631, 85, 1, 0, 0, 0, 632, 630, 1, 0,
        0, 0, 633, 634, 7, 1, 0, 0, 634, 635, 7, 2, 0, 0, 635, 640, 5, 277, 0, 0, 636, 637, 7, 1, 0, 0, 637, 638, 7, 2,
        0, 0, 638, 640, 3, 186, 93, 0, 639, 633, 1, 0, 0, 0, 639, 636, 1, 0, 0, 0, 640, 87, 1, 0, 0, 0, 641, 642, 5, 95,
        0, 0, 642, 644, 3, 46, 23, 0, 643, 645, 3, 6, 3, 0, 644, 643, 1, 0, 0, 0, 644, 645, 1, 0, 0, 0, 645, 647, 1, 0,
        0, 0, 646, 648, 3, 8, 4, 0, 647, 646, 1, 0, 0, 0, 647, 648, 1, 0, 0, 0, 648, 650, 1, 0, 0, 0, 649, 651, 3, 10,
        5, 0, 650, 649, 1, 0, 0, 0, 650, 651, 1, 0, 0, 0, 651, 657, 1, 0, 0, 0, 652, 653, 5, 95, 0, 0, 653, 654, 3, 46,
        23, 0, 654, 655, 3, 12, 6, 0, 655, 657, 1, 0, 0, 0, 656, 641, 1, 0, 0, 0, 656, 652, 1, 0, 0, 0, 657, 89, 1, 0,
        0, 0, 658, 659, 5, 225, 0, 0, 659, 660, 3, 186, 93, 0, 660, 91, 1, 0, 0, 0, 661, 663, 5, 182, 0, 0, 662, 664, 3,
        98, 49, 0, 663, 662, 1, 0, 0, 0, 663, 664, 1, 0, 0, 0, 664, 665, 1, 0, 0, 0, 665, 683, 5, 277, 0, 0, 666, 668,
        5, 182, 0, 0, 667, 669, 3, 98, 49, 0, 668, 667, 1, 0, 0, 0, 668, 669, 1, 0, 0, 0, 669, 670, 1, 0, 0, 0, 670,
        683, 3, 94, 47, 0, 671, 673, 5, 182, 0, 0, 672, 674, 3, 98, 49, 0, 673, 672, 1, 0, 0, 0, 673, 674, 1, 0, 0, 0,
        674, 675, 1, 0, 0, 0, 675, 676, 5, 218, 0, 0, 676, 683, 3, 186, 93, 0, 677, 678, 5, 237, 0, 0, 678, 679, 3, 186,
        93, 0, 679, 680, 5, 13, 0, 0, 680, 681, 3, 186, 93, 0, 681, 683, 1, 0, 0, 0, 682, 661, 1, 0, 0, 0, 682, 666, 1,
        0, 0, 0, 682, 671, 1, 0, 0, 0, 682, 677, 1, 0, 0, 0, 683, 93, 1, 0, 0, 0, 684, 689, 3, 96, 48, 0, 685, 686, 5,
        270, 0, 0, 686, 688, 3, 96, 48, 0, 687, 685, 1, 0, 0, 0, 688, 691, 1, 0, 0, 0, 689, 687, 1, 0, 0, 0, 689, 690,
        1, 0, 0, 0, 690, 95, 1, 0, 0, 0, 691, 689, 1, 0, 0, 0, 692, 697, 3, 186, 93, 0, 693, 695, 5, 10, 0, 0, 694, 693,
        1, 0, 0, 0, 694, 695, 1, 0, 0, 0, 695, 696, 1, 0, 0, 0, 696, 698, 3, 12, 6, 0, 697, 694, 1, 0, 0, 0, 697, 698,
        1, 0, 0, 0, 698, 97, 1, 0, 0, 0, 699, 700, 7, 3, 0, 0, 700, 99, 1, 0, 0, 0, 701, 702, 5, 243, 0, 0, 702, 707, 3,
        102, 51, 0, 703, 704, 5, 270, 0, 0, 704, 706, 3, 102, 51, 0, 705, 703, 1, 0, 0, 0, 706, 709, 1, 0, 0, 0, 707,
        705, 1, 0, 0, 0, 707, 708, 1, 0, 0, 0, 708, 101, 1, 0, 0, 0, 709, 707, 1, 0, 0, 0, 710, 711, 3, 186, 93, 0, 711,
        712, 5, 10, 0, 0, 712, 713, 3, 12, 6, 0, 713, 103, 1, 0, 0, 0, 714, 715, 5, 152, 0, 0, 715, 716, 5, 20, 0, 0,
        716, 721, 3, 106, 53, 0, 717, 718, 5, 270, 0, 0, 718, 720, 3, 106, 53, 0, 719, 717, 1, 0, 0, 0, 720, 723, 1, 0,
        0, 0, 721, 719, 1, 0, 0, 0, 721, 722, 1, 0, 0, 0, 722, 105, 1, 0, 0, 0, 723, 721, 1, 0, 0, 0, 724, 726, 3, 186,
        93, 0, 725, 727, 7, 4, 0, 0, 726, 725, 1, 0, 0, 0, 726, 727, 1, 0, 0, 0, 727, 730, 1, 0, 0, 0, 728, 729, 5, 142,
        0, 0, 729, 731, 7, 5, 0, 0, 730, 728, 1, 0, 0, 0, 730, 731, 1, 0, 0, 0, 731, 107, 1, 0, 0, 0, 732, 734, 5, 102,
        0, 0, 733, 735, 5, 158, 0, 0, 734, 733, 1, 0, 0, 0, 734, 735, 1, 0, 0, 0, 735, 736, 1, 0, 0, 0, 736, 737, 5, 20,
        0, 0, 737, 742, 3, 112, 56, 0, 738, 739, 5, 270, 0, 0, 739, 741, 3, 112, 56, 0, 740, 738, 1, 0, 0, 0, 741, 744,
        1, 0, 0, 0, 742, 740, 1, 0, 0, 0, 742, 743, 1, 0, 0, 0, 743, 746, 1, 0, 0, 0, 744, 742, 1, 0, 0, 0, 745, 747, 3,
        110, 55, 0, 746, 745, 1, 0, 0, 0, 746, 747, 1, 0, 0, 0, 747, 109, 1, 0, 0, 0, 748, 749, 5, 102, 0, 0, 749, 750,
        5, 10, 0, 0, 750, 751, 3, 12, 6, 0, 751, 111, 1, 0, 0, 0, 752, 755, 3, 190, 95, 0, 753, 754, 5, 10, 0, 0, 754,
        756, 3, 12, 6, 0, 755, 753, 1, 0, 0, 0, 755, 756, 1, 0, 0, 0, 756, 113, 1, 0, 0, 0, 757, 758, 5, 232, 0, 0, 758,
        760, 5, 294, 0, 0, 759, 761, 3, 116, 58, 0, 760, 759, 1, 0, 0, 0, 760, 761, 1, 0, 0, 0, 761, 763, 1, 0, 0, 0,
        762, 764, 3, 118, 59, 0, 763, 762, 1, 0, 0, 0, 763, 764, 1, 0, 0, 0, 764, 765, 1, 0, 0, 0, 765, 766, 5, 295, 0,
        0, 766, 115, 1, 0, 0, 0, 767, 768, 5, 233, 0, 0, 768, 769, 5, 20, 0, 0, 769, 774, 3, 186, 93, 0, 770, 771, 5,
        270, 0, 0, 771, 773, 3, 186, 93, 0, 772, 770, 1, 0, 0, 0, 773, 776, 1, 0, 0, 0, 774, 772, 1, 0, 0, 0, 774, 775,
        1, 0, 0, 0, 775, 117, 1, 0, 0, 0, 776, 774, 1, 0, 0, 0, 777, 778, 5, 152, 0, 0, 778, 779, 5, 20, 0, 0, 779, 784,
        3, 106, 53, 0, 780, 781, 5, 270, 0, 0, 781, 783, 3, 106, 53, 0, 782, 780, 1, 0, 0, 0, 783, 786, 1, 0, 0, 0, 784,
        782, 1, 0, 0, 0, 784, 785, 1, 0, 0, 0, 785, 119, 1, 0, 0, 0, 786, 784, 1, 0, 0, 0, 787, 788, 5, 103, 0, 0, 788,
        789, 3, 190, 95, 0, 789, 121, 1, 0, 0, 0, 790, 791, 5, 78, 0, 0, 791, 796, 3, 124, 62, 0, 792, 793, 5, 270, 0,
        0, 793, 795, 3, 124, 62, 0, 794, 792, 1, 0, 0, 0, 795, 798, 1, 0, 0, 0, 796, 794, 1, 0, 0, 0, 796, 797, 1, 0, 0,
        0, 797, 123, 1, 0, 0, 0, 798, 796, 1, 0, 0, 0, 799, 801, 3, 12, 6, 0, 800, 802, 3, 126, 63, 0, 801, 800, 1, 0,
        0, 0, 802, 803, 1, 0, 0, 0, 803, 801, 1, 0, 0, 0, 803, 804, 1, 0, 0, 0, 804, 125, 1, 0, 0, 0, 805, 806, 5, 299,
        0, 0, 806, 819, 3, 12, 6, 0, 807, 808, 5, 290, 0, 0, 808, 809, 5, 300, 0, 0, 809, 819, 5, 291, 0, 0, 810, 811,
        5, 290, 0, 0, 811, 812, 5, 301, 0, 0, 812, 819, 5, 291, 0, 0, 813, 814, 5, 290, 0, 0, 814, 815, 5, 277, 0, 0,
        815, 819, 5, 291, 0, 0, 816, 817, 5, 299, 0, 0, 817, 819, 5, 277, 0, 0, 818, 805, 1, 0, 0, 0, 818, 807, 1, 0, 0,
        0, 818, 810, 1, 0, 0, 0, 818, 813, 1, 0, 0, 0, 818, 816, 1, 0, 0, 0, 819, 127, 1, 0, 0, 0, 820, 821, 5, 95, 0,
        0, 821, 822, 3, 172, 86, 0, 822, 129, 1, 0, 0, 0, 823, 824, 5, 225, 0, 0, 824, 825, 3, 190, 95, 0, 825, 131, 1,
        0, 0, 0, 826, 827, 5, 240, 0, 0, 827, 828, 3, 190, 95, 0, 828, 133, 1, 0, 0, 0, 829, 830, 5, 239, 0, 0, 830,
        831, 3, 190, 95, 0, 831, 135, 1, 0, 0, 0, 832, 834, 3, 144, 72, 0, 833, 832, 1, 0, 0, 0, 833, 834, 1, 0, 0, 0,
        834, 835, 1, 0, 0, 0, 835, 836, 3, 140, 70, 0, 836, 137, 1, 0, 0, 0, 837, 839, 3, 144, 72, 0, 838, 837, 1, 0, 0,
        0, 838, 839, 1, 0, 0, 0, 839, 840, 1, 0, 0, 0, 840, 845, 3, 140, 70, 0, 841, 842, 5, 270, 0, 0, 842, 844, 3,
        140, 70, 0, 843, 841, 1, 0, 0, 0, 844, 847, 1, 0, 0, 0, 845, 843, 1, 0, 0, 0, 845, 846, 1, 0, 0, 0, 846, 139, 1,
        0, 0, 0, 847, 845, 1, 0, 0, 0, 848, 850, 3, 148, 74, 0, 849, 848, 1, 0, 0, 0, 849, 850, 1, 0, 0, 0, 850, 852, 1,
        0, 0, 0, 851, 853, 3, 146, 73, 0, 852, 851, 1, 0, 0, 0, 852, 853, 1, 0, 0, 0, 853, 857, 1, 0, 0, 0, 854, 856, 3,
        142, 71, 0, 855, 854, 1, 0, 0, 0, 856, 859, 1, 0, 0, 0, 857, 855, 1, 0, 0, 0, 857, 858, 1, 0, 0, 0, 858, 141, 1,
        0, 0, 0, 859, 857, 1, 0, 0, 0, 860, 864, 3, 150, 75, 0, 861, 864, 3, 152, 76, 0, 862, 864, 3, 154, 77, 0, 863,
        860, 1, 0, 0, 0, 863, 861, 1, 0, 0, 0, 863, 862, 1, 0, 0, 0, 864, 143, 1, 0, 0, 0, 865, 866, 7, 6, 0, 0, 866,
        877, 5, 186, 0, 0, 867, 869, 5, 8, 0, 0, 868, 870, 5, 301, 0, 0, 869, 868, 1, 0, 0, 0, 869, 870, 1, 0, 0, 0,
        870, 877, 1, 0, 0, 0, 871, 872, 5, 186, 0, 0, 872, 874, 5, 301, 0, 0, 873, 875, 5, 102, 0, 0, 874, 873, 1, 0, 0,
        0, 874, 875, 1, 0, 0, 0, 875, 877, 1, 0, 0, 0, 876, 865, 1, 0, 0, 0, 876, 867, 1, 0, 0, 0, 876, 871, 1, 0, 0, 0,
        877, 145, 1, 0, 0, 0, 878, 879, 3, 12, 6, 0, 879, 880, 5, 283, 0, 0, 880, 147, 1, 0, 0, 0, 881, 882, 5, 303, 0,
        0, 882, 149, 1, 0, 0, 0, 883, 885, 5, 294, 0, 0, 884, 886, 3, 12, 6, 0, 885, 884, 1, 0, 0, 0, 885, 886, 1, 0, 0,
        0, 886, 889, 1, 0, 0, 0, 887, 888, 5, 296, 0, 0, 888, 890, 3, 162, 81, 0, 889, 887, 1, 0, 0, 0, 889, 890, 1, 0,
        0, 0, 890, 892, 1, 0, 0, 0, 891, 893, 3, 90, 45, 0, 892, 891, 1, 0, 0, 0, 892, 893, 1, 0, 0, 0, 893, 894, 1, 0,
        0, 0, 894, 895, 5, 295, 0, 0, 895, 151, 1, 0, 0, 0, 896, 898, 3, 158, 79, 0, 897, 899, 3, 156, 78, 0, 898, 897,
        1, 0, 0, 0, 898, 899, 1, 0, 0, 0, 899, 905, 1, 0, 0, 0, 900, 902, 3, 170, 85, 0, 901, 903, 3, 156, 78, 0, 902,
        901, 1, 0, 0, 0, 902, 903, 1, 0, 0, 0, 903, 905, 1, 0, 0, 0, 904, 896, 1, 0, 0, 0, 904, 900, 1, 0, 0, 0, 905,
        153, 1, 0, 0, 0, 906, 908, 5, 294, 0, 0, 907, 909, 3, 148, 74, 0, 908, 907, 1, 0, 0, 0, 908, 909, 1, 0, 0, 0,
        909, 911, 1, 0, 0, 0, 910, 912, 3, 146, 73, 0, 911, 910, 1, 0, 0, 0, 911, 912, 1, 0, 0, 0, 912, 914, 1, 0, 0, 0,
        913, 915, 3, 142, 71, 0, 914, 913, 1, 0, 0, 0, 915, 916, 1, 0, 0, 0, 916, 914, 1, 0, 0, 0, 916, 917, 1, 0, 0, 0,
        917, 919, 1, 0, 0, 0, 918, 920, 3, 90, 45, 0, 919, 918, 1, 0, 0, 0, 919, 920, 1, 0, 0, 0, 920, 921, 1, 0, 0, 0,
        921, 923, 5, 295, 0, 0, 922, 924, 3, 156, 78, 0, 923, 922, 1, 0, 0, 0, 923, 924, 1, 0, 0, 0, 924, 945, 1, 0, 0,
        0, 925, 927, 5, 290, 0, 0, 926, 928, 3, 148, 74, 0, 927, 926, 1, 0, 0, 0, 927, 928, 1, 0, 0, 0, 928, 930, 1, 0,
        0, 0, 929, 931, 3, 146, 73, 0, 930, 929, 1, 0, 0, 0, 930, 931, 1, 0, 0, 0, 931, 933, 1, 0, 0, 0, 932, 934, 3,
        142, 71, 0, 933, 932, 1, 0, 0, 0, 934, 935, 1, 0, 0, 0, 935, 933, 1, 0, 0, 0, 935, 936, 1, 0, 0, 0, 936, 938, 1,
        0, 0, 0, 937, 939, 3, 90, 45, 0, 938, 937, 1, 0, 0, 0, 938, 939, 1, 0, 0, 0, 939, 940, 1, 0, 0, 0, 940, 942, 5,
        291, 0, 0, 941, 943, 3, 156, 78, 0, 942, 941, 1, 0, 0, 0, 942, 943, 1, 0, 0, 0, 943, 945, 1, 0, 0, 0, 944, 906,
        1, 0, 0, 0, 944, 925, 1, 0, 0, 0, 945, 155, 1, 0, 0, 0, 946, 955, 7, 7, 0, 0, 947, 948, 5, 292, 0, 0, 948, 949,
        5, 301, 0, 0, 949, 951, 5, 270, 0, 0, 950, 952, 5, 301, 0, 0, 951, 950, 1, 0, 0, 0, 951, 952, 1, 0, 0, 0, 952,
        953, 1, 0, 0, 0, 953, 955, 5, 293, 0, 0, 954, 946, 1, 0, 0, 0, 954, 947, 1, 0, 0, 0, 955, 157, 1, 0, 0, 0, 956,
        957, 5, 272, 0, 0, 957, 958, 3, 160, 80, 0, 958, 959, 5, 272, 0, 0, 959, 960, 5, 287, 0, 0, 960, 991, 1, 0, 0,
        0, 961, 962, 5, 276, 0, 0, 962, 963, 3, 160, 80, 0, 963, 964, 5, 276, 0, 0, 964, 991, 1, 0, 0, 0, 965, 966, 5,
        286, 0, 0, 966, 967, 5, 272, 0, 0, 967, 968, 3, 160, 80, 0, 968, 969, 5, 272, 0, 0, 969, 991, 1, 0, 0, 0, 970,
        971, 5, 276, 0, 0, 971, 972, 3, 160, 80, 0, 972, 973, 5, 276, 0, 0, 973, 974, 5, 287, 0, 0, 974, 991, 1, 0, 0,
        0, 975, 976, 5, 286, 0, 0, 976, 977, 5, 276, 0, 0, 977, 978, 3, 160, 80, 0, 978, 979, 5, 276, 0, 0, 979, 991, 1,
        0, 0, 0, 980, 981, 5, 286, 0, 0, 981, 982, 5, 272, 0, 0, 982, 983, 3, 160, 80, 0, 983, 984, 5, 272, 0, 0, 984,
        985, 5, 287, 0, 0, 985, 991, 1, 0, 0, 0, 986, 987, 5, 272, 0, 0, 987, 988, 3, 160, 80, 0, 988, 989, 5, 272, 0,
        0, 989, 991, 1, 0, 0, 0, 990, 956, 1, 0, 0, 0, 990, 961, 1, 0, 0, 0, 990, 965, 1, 0, 0, 0, 990, 970, 1, 0, 0, 0,
        990, 975, 1, 0, 0, 0, 990, 980, 1, 0, 0, 0, 990, 986, 1, 0, 0, 0, 991, 159, 1, 0, 0, 0, 992, 994, 5, 290, 0, 0,
        993, 995, 3, 12, 6, 0, 994, 993, 1, 0, 0, 0, 994, 995, 1, 0, 0, 0, 995, 998, 1, 0, 0, 0, 996, 997, 5, 296, 0, 0,
        997, 999, 3, 162, 81, 0, 998, 996, 1, 0, 0, 0, 998, 999, 1, 0, 0, 0, 999, 1001, 1, 0, 0, 0, 1000, 1002, 3, 90,
        45, 0, 1001, 1000, 1, 0, 0, 0, 1001, 1002, 1, 0, 0, 0, 1002, 1003, 1, 0, 0, 0, 1003, 1004, 5, 291, 0, 0, 1004,
        161, 1, 0, 0, 0, 1005, 1006, 6, 81, -1, 0, 1006, 1007, 3, 164, 82, 0, 1007, 1013, 1, 0, 0, 0, 1008, 1009, 10, 2,
        0, 0, 1009, 1010, 5, 278, 0, 0, 1010, 1012, 3, 164, 82, 0, 1011, 1008, 1, 0, 0, 0, 1012, 1015, 1, 0, 0, 0, 1013,
        1011, 1, 0, 0, 0, 1013, 1014, 1, 0, 0, 0, 1014, 163, 1, 0, 0, 0, 1015, 1013, 1, 0, 0, 0, 1016, 1017, 6, 82, -1,
        0, 1017, 1018, 3, 166, 83, 0, 1018, 1024, 1, 0, 0, 0, 1019, 1020, 10, 2, 0, 0, 1020, 1021, 5, 279, 0, 0, 1021,
        1023, 3, 166, 83, 0, 1022, 1019, 1, 0, 0, 0, 1023, 1026, 1, 0, 0, 0, 1024, 1022, 1, 0, 0, 0, 1024, 1025, 1, 0,
        0, 0, 1025, 165, 1, 0, 0, 0, 1026, 1024, 1, 0, 0, 0, 1027, 1028, 5, 280, 0, 0, 1028, 1031, 3, 168, 84, 0, 1029,
        1031, 3, 168, 84, 0, 1030, 1027, 1, 0, 0, 0, 1030, 1029, 1, 0, 0, 0, 1031, 167, 1, 0, 0, 0, 1032, 1039, 3, 12,
        6, 0, 1033, 1039, 5, 274, 0, 0, 1034, 1035, 5, 294, 0, 0, 1035, 1036, 3, 162, 81, 0, 1036, 1037, 5, 295, 0, 0,
        1037, 1039, 1, 0, 0, 0, 1038, 1032, 1, 0, 0, 0, 1038, 1033, 1, 0, 0, 0, 1038, 1034, 1, 0, 0, 0, 1039, 169, 1, 0,
        0, 0, 1040, 1053, 5, 276, 0, 0, 1041, 1042, 5, 276, 0, 0, 1042, 1053, 5, 287, 0, 0, 1043, 1044, 5, 286, 0, 0,
        1044, 1053, 5, 276, 0, 0, 1045, 1047, 5, 286, 0, 0, 1046, 1045, 1, 0, 0, 0, 1046, 1047, 1, 0, 0, 0, 1047, 1048,
        1, 0, 0, 0, 1048, 1050, 5, 272, 0, 0, 1049, 1051, 5, 287, 0, 0, 1050, 1049, 1, 0, 0, 0, 1050, 1051, 1, 0, 0, 0,
        1051, 1053, 1, 0, 0, 0, 1052, 1040, 1, 0, 0, 0, 1052, 1041, 1, 0, 0, 0, 1052, 1043, 1, 0, 0, 0, 1052, 1046, 1,
        0, 0, 0, 1053, 171, 1, 0, 0, 0, 1054, 1055, 6, 86, -1, 0, 1055, 1061, 3, 174, 87, 0, 1056, 1057, 5, 294, 0, 0,
        1057, 1058, 3, 172, 86, 0, 1058, 1059, 5, 295, 0, 0, 1059, 1061, 1, 0, 0, 0, 1060, 1054, 1, 0, 0, 0, 1060, 1056,
        1, 0, 0, 0, 1061, 1082, 1, 0, 0, 0, 1062, 1064, 10, 5, 0, 0, 1063, 1065, 3, 184, 92, 0, 1064, 1063, 1, 0, 0, 0,
        1064, 1065, 1, 0, 0, 0, 1065, 1066, 1, 0, 0, 0, 1066, 1067, 5, 46, 0, 0, 1067, 1068, 5, 120, 0, 0, 1068, 1081,
        3, 180, 90, 0, 1069, 1070, 10, 4, 0, 0, 1070, 1071, 5, 270, 0, 0, 1071, 1081, 3, 180, 90, 0, 1072, 1074, 10, 3,
        0, 0, 1073, 1075, 3, 184, 92, 0, 1074, 1073, 1, 0, 0, 0, 1074, 1075, 1, 0, 0, 0, 1075, 1076, 1, 0, 0, 0, 1076,
        1077, 5, 120, 0, 0, 1077, 1078, 3, 180, 90, 0, 1078, 1079, 3, 182, 91, 0, 1079, 1081, 1, 0, 0, 0, 1080, 1062, 1,
        0, 0, 0, 1080, 1069, 1, 0, 0, 0, 1080, 1072, 1, 0, 0, 0, 1081, 1084, 1, 0, 0, 0, 1082, 1080, 1, 0, 0, 0, 1082,
        1083, 1, 0, 0, 0, 1083, 173, 1, 0, 0, 0, 1084, 1082, 1, 0, 0, 0, 1085, 1088, 3, 176, 88, 0, 1086, 1088, 3, 178,
        89, 0, 1087, 1085, 1, 0, 0, 0, 1087, 1086, 1, 0, 0, 0, 1088, 175, 1, 0, 0, 0, 1089, 1090, 3, 190, 95, 0, 1090,
        1091, 3, 12, 6, 0, 1091, 1113, 1, 0, 0, 0, 1092, 1094, 3, 190, 95, 0, 1093, 1095, 3, 6, 3, 0, 1094, 1093, 1, 0,
        0, 0, 1094, 1095, 1, 0, 0, 0, 1095, 1097, 1, 0, 0, 0, 1096, 1098, 3, 8, 4, 0, 1097, 1096, 1, 0, 0, 0, 1097,
        1098, 1, 0, 0, 0, 1098, 1100, 1, 0, 0, 0, 1099, 1101, 3, 10, 5, 0, 1100, 1099, 1, 0, 0, 0, 1100, 1101, 1, 0, 0,
        0, 1101, 1113, 1, 0, 0, 0, 1102, 1104, 3, 256, 128, 0, 1103, 1105, 3, 6, 3, 0, 1104, 1103, 1, 0, 0, 0, 1104,
        1105, 1, 0, 0, 0, 1105, 1107, 1, 0, 0, 0, 1106, 1108, 3, 8, 4, 0, 1107, 1106, 1, 0, 0, 0, 1107, 1108, 1, 0, 0,
        0, 1108, 1110, 1, 0, 0, 0, 1109, 1111, 3, 10, 5, 0, 1110, 1109, 1, 0, 0, 0, 1110, 1111, 1, 0, 0, 0, 1111, 1113,
        1, 0, 0, 0, 1112, 1089, 1, 0, 0, 0, 1112, 1092, 1, 0, 0, 0, 1112, 1102, 1, 0, 0, 0, 1113, 177, 1, 0, 0, 0, 1114,
        1115, 5, 238, 0, 0, 1115, 1117, 3, 186, 93, 0, 1116, 1118, 3, 6, 3, 0, 1117, 1116, 1, 0, 0, 0, 1117, 1118, 1, 0,
        0, 0, 1118, 1120, 1, 0, 0, 0, 1119, 1121, 3, 8, 4, 0, 1120, 1119, 1, 0, 0, 0, 1120, 1121, 1, 0, 0, 0, 1121,
        1123, 1, 0, 0, 0, 1122, 1124, 3, 10, 5, 0, 1123, 1122, 1, 0, 0, 0, 1123, 1124, 1, 0, 0, 0, 1124, 179, 1, 0, 0,
        0, 1125, 1131, 3, 174, 87, 0, 1126, 1127, 5, 294, 0, 0, 1127, 1128, 3, 172, 86, 0, 1128, 1129, 5, 295, 0, 0,
        1129, 1131, 1, 0, 0, 0, 1130, 1125, 1, 0, 0, 0, 1130, 1126, 1, 0, 0, 0, 1131, 181, 1, 0, 0, 0, 1132, 1133, 5,
        147, 0, 0, 1133, 1134, 3, 186, 93, 0, 1134, 183, 1, 0, 0, 0, 1135, 1150, 5, 109, 0, 0, 1136, 1138, 5, 125, 0, 0,
        1137, 1139, 5, 153, 0, 0, 1138, 1137, 1, 0, 0, 0, 1138, 1139, 1, 0, 0, 0, 1139, 1150, 1, 0, 0, 0, 1140, 1142, 5,
        176, 0, 0, 1141, 1143, 5, 153, 0, 0, 1142, 1141, 1, 0, 0, 0, 1142, 1143, 1, 0, 0, 0, 1143, 1150, 1, 0, 0, 0,
        1144, 1146, 5, 96, 0, 0, 1145, 1147, 5, 153, 0, 0, 1146, 1145, 1, 0, 0, 0, 1146, 1147, 1, 0, 0, 0, 1147, 1150,
        1, 0, 0, 0, 1148, 1150, 5, 153, 0, 0, 1149, 1135, 1, 0, 0, 0, 1149, 1136, 1, 0, 0, 0, 1149, 1140, 1, 0, 0, 0,
        1149, 1144, 1, 0, 0, 0, 1149, 1148, 1, 0, 0, 0, 1150, 185, 1, 0, 0, 0, 1151, 1152, 3, 188, 94, 0, 1152, 187, 1,
        0, 0, 0, 1153, 1154, 6, 94, -1, 0, 1154, 1155, 3, 190, 95, 0, 1155, 1185, 1, 0, 0, 0, 1156, 1158, 10, 4, 0, 0,
        1157, 1159, 5, 153, 0, 0, 1158, 1157, 1, 0, 0, 0, 1158, 1159, 1, 0, 0, 0, 1159, 1160, 1, 0, 0, 0, 1160, 1162, 5,
        76, 0, 0, 1161, 1163, 7, 3, 0, 0, 1162, 1161, 1, 0, 0, 0, 1162, 1163, 1, 0, 0, 0, 1163, 1164, 1, 0, 0, 0, 1164,
        1184, 3, 190, 95, 0, 1165, 1167, 10, 3, 0, 0, 1166, 1168, 5, 153, 0, 0, 1167, 1166, 1, 0, 0, 0, 1167, 1168, 1,
        0, 0, 0, 1168, 1169, 1, 0, 0, 0, 1169, 1171, 5, 209, 0, 0, 1170, 1172, 7, 3, 0, 0, 1171, 1170, 1, 0, 0, 0, 1171,
        1172, 1, 0, 0, 0, 1172, 1173, 1, 0, 0, 0, 1173, 1184, 3, 190, 95, 0, 1174, 1176, 10, 2, 0, 0, 1175, 1177, 5,
        153, 0, 0, 1176, 1175, 1, 0, 0, 0, 1176, 1177, 1, 0, 0, 0, 1177, 1178, 1, 0, 0, 0, 1178, 1180, 5, 115, 0, 0,
        1179, 1181, 7, 3, 0, 0, 1180, 1179, 1, 0, 0, 0, 1180, 1181, 1, 0, 0, 0, 1181, 1182, 1, 0, 0, 0, 1182, 1184, 3,
        190, 95, 0, 1183, 1156, 1, 0, 0, 0, 1183, 1165, 1, 0, 0, 0, 1183, 1174, 1, 0, 0, 0, 1184, 1187, 1, 0, 0, 0,
        1185, 1183, 1, 0, 0, 0, 1185, 1186, 1, 0, 0, 0, 1186, 189, 1, 0, 0, 0, 1187, 1185, 1, 0, 0, 0, 1188, 1190, 3,
        92, 46, 0, 1189, 1191, 3, 122, 61, 0, 1190, 1189, 1, 0, 0, 0, 1190, 1191, 1, 0, 0, 0, 1191, 1192, 1, 0, 0, 0,
        1192, 1194, 3, 128, 64, 0, 1193, 1195, 3, 100, 50, 0, 1194, 1193, 1, 0, 0, 0, 1194, 1195, 1, 0, 0, 0, 1195,
        1197, 1, 0, 0, 0, 1196, 1198, 3, 130, 65, 0, 1197, 1196, 1, 0, 0, 0, 1197, 1198, 1, 0, 0, 0, 1198, 1200, 1, 0,
        0, 0, 1199, 1201, 3, 108, 54, 0, 1200, 1199, 1, 0, 0, 0, 1200, 1201, 1, 0, 0, 0, 1201, 1203, 1, 0, 0, 0, 1202,
        1204, 3, 120, 60, 0, 1203, 1202, 1, 0, 0, 0, 1203, 1204, 1, 0, 0, 0, 1204, 1206, 1, 0, 0, 0, 1205, 1207, 3, 104,
        52, 0, 1206, 1205, 1, 0, 0, 0, 1206, 1207, 1, 0, 0, 0, 1207, 1209, 1, 0, 0, 0, 1208, 1210, 3, 134, 67, 0, 1209,
        1208, 1, 0, 0, 0, 1209, 1210, 1, 0, 0, 0, 1210, 1212, 1, 0, 0, 0, 1211, 1213, 3, 132, 66, 0, 1212, 1211, 1, 0,
        0, 0, 1212, 1213, 1, 0, 0, 0, 1213, 1216, 1, 0, 0, 0, 1214, 1216, 3, 192, 96, 0, 1215, 1188, 1, 0, 0, 0, 1215,
        1214, 1, 0, 0, 0, 1216, 191, 1, 0, 0, 0, 1217, 1218, 6, 96, -1, 0, 1218, 1219, 3, 194, 97, 0, 1219, 1225, 1, 0,
        0, 0, 1220, 1221, 10, 2, 0, 0, 1221, 1222, 5, 151, 0, 0, 1222, 1224, 3, 194, 97, 0, 1223, 1220, 1, 0, 0, 0,
        1224, 1227, 1, 0, 0, 0, 1225, 1223, 1, 0, 0, 0, 1225, 1226, 1, 0, 0, 0, 1226, 193, 1, 0, 0, 0, 1227, 1225, 1, 0,
        0, 0, 1228, 1229, 6, 97, -1, 0, 1229, 1230, 3, 196, 98, 0, 1230, 1236, 1, 0, 0, 0, 1231, 1232, 10, 2, 0, 0,
        1232, 1233, 5, 7, 0, 0, 1233, 1235, 3, 196, 98, 0, 1234, 1231, 1, 0, 0, 0, 1235, 1238, 1, 0, 0, 0, 1236, 1234,
        1, 0, 0, 0, 1236, 1237, 1, 0, 0, 0, 1237, 195, 1, 0, 0, 0, 1238, 1236, 1, 0, 0, 0, 1239, 1240, 5, 140, 0, 0,
        1240, 1243, 3, 196, 98, 0, 1241, 1243, 3, 198, 99, 0, 1242, 1239, 1, 0, 0, 0, 1242, 1241, 1, 0, 0, 0, 1243, 197,
        1, 0, 0, 0, 1244, 1245, 6, 99, -1, 0, 1245, 1246, 3, 200, 100, 0, 1246, 1292, 1, 0, 0, 0, 1247, 1248, 10, 7, 0,
        0, 1248, 1249, 7, 8, 0, 0, 1249, 1291, 3, 200, 100, 0, 1250, 1251, 10, 6, 0, 0, 1251, 1253, 5, 118, 0, 0, 1252,
        1254, 5, 140, 0, 0, 1253, 1252, 1, 0, 0, 0, 1253, 1254, 1, 0, 0, 0, 1254, 1255, 1, 0, 0, 0, 1255, 1291, 3, 276,
        138, 0, 1256, 1258, 10, 5, 0, 0, 1257, 1259, 5, 140, 0, 0, 1258, 1257, 1, 0, 0, 0, 1258, 1259, 1, 0, 0, 0, 1259,
        1260, 1, 0, 0, 0, 1260, 1261, 5, 106, 0, 0, 1261, 1262, 5, 294, 0, 0, 1262, 1263, 3, 186, 93, 0, 1263, 1264, 5,
        295, 0, 0, 1264, 1291, 1, 0, 0, 0, 1265, 1267, 10, 4, 0, 0, 1266, 1268, 5, 140, 0, 0, 1267, 1266, 1, 0, 0, 0,
        1267, 1268, 1, 0, 0, 0, 1268, 1269, 1, 0, 0, 0, 1269, 1270, 5, 106, 0, 0, 1270, 1291, 3, 200, 100, 0, 1271,
        1273, 10, 3, 0, 0, 1272, 1274, 5, 140, 0, 0, 1273, 1272, 1, 0, 0, 0, 1273, 1274, 1, 0, 0, 0, 1274, 1275, 1, 0,
        0, 0, 1275, 1276, 5, 127, 0, 0, 1276, 1279, 3, 200, 100, 0, 1277, 1278, 5, 74, 0, 0, 1278, 1280, 3, 186, 93, 0,
        1279, 1277, 1, 0, 0, 0, 1279, 1280, 1, 0, 0, 0, 1280, 1291, 1, 0, 0, 0, 1281, 1283, 10, 2, 0, 0, 1282, 1284, 5,
        140, 0, 0, 1283, 1282, 1, 0, 0, 0, 1283, 1284, 1, 0, 0, 0, 1284, 1285, 1, 0, 0, 0, 1285, 1286, 5, 17, 0, 0,
        1286, 1287, 3, 200, 100, 0, 1287, 1288, 5, 7, 0, 0, 1288, 1289, 3, 200, 100, 0, 1289, 1291, 1, 0, 0, 0, 1290,
        1247, 1, 0, 0, 0, 1290, 1250, 1, 0, 0, 0, 1290, 1256, 1, 0, 0, 0, 1290, 1265, 1, 0, 0, 0, 1290, 1271, 1, 0, 0,
        0, 1290, 1281, 1, 0, 0, 0, 1291, 1294, 1, 0, 0, 0, 1292, 1290, 1, 0, 0, 0, 1292, 1293, 1, 0, 0, 0, 1293, 199, 1,
        0, 0, 0, 1294, 1292, 1, 0, 0, 0, 1295, 1296, 6, 100, -1, 0, 1296, 1297, 3, 202, 101, 0, 1297, 1303, 1, 0, 0, 0,
        1298, 1299, 10, 2, 0, 0, 1299, 1300, 7, 9, 0, 0, 1300, 1302, 3, 202, 101, 0, 1301, 1298, 1, 0, 0, 0, 1302, 1305,
        1, 0, 0, 0, 1303, 1301, 1, 0, 0, 0, 1303, 1304, 1, 0, 0, 0, 1304, 201, 1, 0, 0, 0, 1305, 1303, 1, 0, 0, 0, 1306,
        1307, 6, 101, -1, 0, 1307, 1308, 3, 204, 102, 0, 1308, 1314, 1, 0, 0, 0, 1309, 1310, 10, 2, 0, 0, 1310, 1311, 7,
        10, 0, 0, 1311, 1313, 3, 204, 102, 0, 1312, 1309, 1, 0, 0, 0, 1313, 1316, 1, 0, 0, 0, 1314, 1312, 1, 0, 0, 0,
        1314, 1315, 1, 0, 0, 0, 1315, 203, 1, 0, 0, 0, 1316, 1314, 1, 0, 0, 0, 1317, 1318, 6, 102, -1, 0, 1318, 1319, 3,
        206, 103, 0, 1319, 1325, 1, 0, 0, 0, 1320, 1321, 10, 2, 0, 0, 1321, 1322, 7, 11, 0, 0, 1322, 1324, 3, 206, 103,
        0, 1323, 1320, 1, 0, 0, 0, 1324, 1327, 1, 0, 0, 0, 1325, 1323, 1, 0, 0, 0, 1325, 1326, 1, 0, 0, 0, 1326, 205, 1,
        0, 0, 0, 1327, 1325, 1, 0, 0, 0, 1328, 1329, 7, 10, 0, 0, 1329, 1332, 3, 206, 103, 0, 1330, 1332, 3, 208, 104,
        0, 1331, 1328, 1, 0, 0, 0, 1331, 1330, 1, 0, 0, 0, 1332, 207, 1, 0, 0, 0, 1333, 1334, 6, 104, -1, 0, 1334, 1355,
        3, 210, 105, 0, 1335, 1355, 3, 236, 118, 0, 1336, 1355, 3, 224, 112, 0, 1337, 1355, 3, 226, 113, 0, 1338, 1355,
        3, 228, 114, 0, 1339, 1355, 3, 230, 115, 0, 1340, 1355, 3, 240, 120, 0, 1341, 1355, 3, 238, 119, 0, 1342, 1355,
        3, 242, 121, 0, 1343, 1355, 3, 214, 107, 0, 1344, 1355, 3, 246, 123, 0, 1345, 1355, 3, 232, 116, 0, 1346, 1355,
        3, 244, 122, 0, 1347, 1355, 3, 248, 124, 0, 1348, 1355, 3, 212, 106, 0, 1349, 1355, 3, 254, 127, 0, 1350, 1355,
        3, 216, 108, 0, 1351, 1355, 3, 222, 111, 0, 1352, 1355, 3, 218, 109, 0, 1353, 1355, 3, 234, 117, 0, 1354, 1333,
        1, 0, 0, 0, 1354, 1335, 1, 0, 0, 0, 1354, 1336, 1, 0, 0, 0, 1354, 1337, 1, 0, 0, 0, 1354, 1338, 1, 0, 0, 0,
        1354, 1339, 1, 0, 0, 0, 1354, 1340, 1, 0, 0, 0, 1354, 1341, 1, 0, 0, 0, 1354, 1342, 1, 0, 0, 0, 1354, 1343, 1,
        0, 0, 0, 1354, 1344, 1, 0, 0, 0, 1354, 1345, 1, 0, 0, 0, 1354, 1346, 1, 0, 0, 0, 1354, 1347, 1, 0, 0, 0, 1354,
        1348, 1, 0, 0, 0, 1354, 1349, 1, 0, 0, 0, 1354, 1350, 1, 0, 0, 0, 1354, 1351, 1, 0, 0, 0, 1354, 1352, 1, 0, 0,
        0, 1354, 1353, 1, 0, 0, 0, 1355, 1364, 1, 0, 0, 0, 1356, 1358, 10, 6, 0, 0, 1357, 1359, 3, 252, 126, 0, 1358,
        1357, 1, 0, 0, 0, 1359, 1360, 1, 0, 0, 0, 1360, 1358, 1, 0, 0, 0, 1360, 1361, 1, 0, 0, 0, 1361, 1363, 1, 0, 0,
        0, 1362, 1356, 1, 0, 0, 0, 1363, 1366, 1, 0, 0, 0, 1364, 1362, 1, 0, 0, 0, 1364, 1365, 1, 0, 0, 0, 1365, 209, 1,
        0, 0, 0, 1366, 1364, 1, 0, 0, 0, 1367, 1368, 5, 294, 0, 0, 1368, 1369, 3, 186, 93, 0, 1369, 1370, 5, 295, 0, 0,
        1370, 1379, 1, 0, 0, 0, 1371, 1379, 5, 51, 0, 0, 1372, 1379, 5, 48, 0, 0, 1373, 1379, 3, 258, 129, 0, 1374,
        1379, 3, 260, 130, 0, 1375, 1379, 3, 274, 137, 0, 1376, 1379, 3, 264, 132, 0, 1377, 1379, 3, 270, 135, 0, 1378,
        1367, 1, 0, 0, 0, 1378, 1371, 1, 0, 0, 0, 1378, 1372, 1, 0, 0, 0, 1378, 1373, 1, 0, 0, 0, 1378, 1374, 1, 0, 0,
        0, 1378, 1375, 1, 0, 0, 0, 1378, 1376, 1, 0, 0, 0, 1378, 1377, 1, 0, 0, 0, 1379, 211, 1, 0, 0, 0, 1380, 1381, 5,
        143, 0, 0, 1381, 1382, 5, 294, 0, 0, 1382, 1383, 3, 186, 93, 0, 1383, 1384, 5, 270, 0, 0, 1384, 1385, 3, 186,
        93, 0, 1385, 1386, 5, 295, 0, 0, 1386, 213, 1, 0, 0, 0, 1387, 1388, 5, 32, 0, 0, 1388, 1389, 5, 294, 0, 0, 1389,
        1394, 3, 186, 93, 0, 1390, 1391, 5, 270, 0, 0, 1391, 1393, 3, 186, 93, 0, 1392, 1390, 1, 0, 0, 0, 1393, 1396, 1,
        0, 0, 0, 1394, 1392, 1, 0, 0, 0, 1394, 1395, 1, 0, 0, 0, 1395, 1397, 1, 0, 0, 0, 1396, 1394, 1, 0, 0, 0, 1397,
        1398, 5, 295, 0, 0, 1398, 215, 1, 0, 0, 0, 1399, 1401, 5, 23, 0, 0, 1400, 1402, 3, 186, 93, 0, 1401, 1400, 1, 0,
        0, 0, 1401, 1402, 1, 0, 0, 0, 1402, 1408, 1, 0, 0, 0, 1403, 1404, 5, 223, 0, 0, 1404, 1405, 3, 186, 93, 0, 1405,
        1406, 5, 200, 0, 0, 1406, 1407, 3, 186, 93, 0, 1407, 1409, 1, 0, 0, 0, 1408, 1403, 1, 0, 0, 0, 1409, 1410, 1, 0,
        0, 0, 1410, 1408, 1, 0, 0, 0, 1410, 1411, 1, 0, 0, 0, 1411, 1414, 1, 0, 0, 0, 1412, 1413, 5, 71, 0, 0, 1413,
        1415, 3, 186, 93, 0, 1414, 1412, 1, 0, 0, 0, 1414, 1415, 1, 0, 0, 0, 1415, 1416, 1, 0, 0, 0, 1416, 1417, 5, 72,
        0, 0, 1417, 217, 1, 0, 0, 0, 1418, 1419, 5, 219, 0, 0, 1419, 1424, 3, 220, 110, 0, 1420, 1421, 5, 270, 0, 0,
        1421, 1423, 3, 220, 110, 0, 1422, 1420, 1, 0, 0, 0, 1423, 1426, 1, 0, 0, 0, 1424, 1422, 1, 0, 0, 0, 1424, 1425,
        1, 0, 0, 0, 1425, 219, 1, 0, 0, 0, 1426, 1424, 1, 0, 0, 0, 1427, 1428, 5, 294, 0, 0, 1428, 1433, 3, 186, 93, 0,
        1429, 1430, 5, 270, 0, 0, 1430, 1432, 3, 186, 93, 0, 1431, 1429, 1, 0, 0, 0, 1432, 1435, 1, 0, 0, 0, 1433, 1431,
        1, 0, 0, 0, 1433, 1434, 1, 0, 0, 0, 1434, 1436, 1, 0, 0, 0, 1435, 1433, 1, 0, 0, 0, 1436, 1437, 5, 295, 0, 0,
        1437, 221, 1, 0, 0, 0, 1438, 1439, 5, 294, 0, 0, 1439, 1442, 3, 186, 93, 0, 1440, 1441, 5, 270, 0, 0, 1441,
        1443, 3, 186, 93, 0, 1442, 1440, 1, 0, 0, 0, 1443, 1444, 1, 0, 0, 0, 1444, 1442, 1, 0, 0, 0, 1444, 1445, 1, 0,
        0, 0, 1445, 1446, 1, 0, 0, 0, 1446, 1447, 5, 295, 0, 0, 1447, 223, 1, 0, 0, 0, 1448, 1449, 7, 12, 0, 0, 1449,
        1458, 5, 294, 0, 0, 1450, 1455, 3, 186, 93, 0, 1451, 1452, 5, 270, 0, 0, 1452, 1454, 3, 186, 93, 0, 1453, 1451,
        1, 0, 0, 0, 1454, 1457, 1, 0, 0, 0, 1455, 1453, 1, 0, 0, 0, 1455, 1456, 1, 0, 0, 0, 1456, 1459, 1, 0, 0, 0,
        1457, 1455, 1, 0, 0, 0, 1458, 1450, 1, 0, 0, 0, 1458, 1459, 1, 0, 0, 0, 1459, 1460, 1, 0, 0, 0, 1460, 1461, 5,
        295, 0, 0, 1461, 225, 1, 0, 0, 0, 1462, 1463, 5, 195, 0, 0, 1463, 1464, 5, 294, 0, 0, 1464, 1471, 3, 186, 93, 0,
        1465, 1466, 5, 270, 0, 0, 1466, 1469, 3, 186, 93, 0, 1467, 1468, 5, 270, 0, 0, 1468, 1470, 3, 186, 93, 0, 1469,
        1467, 1, 0, 0, 0, 1469, 1470, 1, 0, 0, 0, 1470, 1472, 1, 0, 0, 0, 1471, 1465, 1, 0, 0, 0, 1471, 1472, 1, 0, 0,
        0, 1472, 1473, 1, 0, 0, 0, 1473, 1474, 5, 295, 0, 0, 1474, 1489, 1, 0, 0, 0, 1475, 1476, 5, 195, 0, 0, 1476,
        1477, 5, 294, 0, 0, 1477, 1484, 3, 186, 93, 0, 1478, 1479, 5, 95, 0, 0, 1479, 1482, 3, 186, 93, 0, 1480, 1481,
        5, 92, 0, 0, 1481, 1483, 3, 186, 93, 0, 1482, 1480, 1, 0, 0, 0, 1482, 1483, 1, 0, 0, 0, 1483, 1485, 1, 0, 0, 0,
        1484, 1478, 1, 0, 0, 0, 1484, 1485, 1, 0, 0, 0, 1485, 1486, 1, 0, 0, 0, 1486, 1487, 5, 295, 0, 0, 1487, 1489, 1,
        0, 0, 0, 1488, 1462, 1, 0, 0, 0, 1488, 1475, 1, 0, 0, 0, 1489, 227, 1, 0, 0, 0, 1490, 1491, 5, 160, 0, 0, 1491,
        1492, 5, 294, 0, 0, 1492, 1493, 3, 186, 93, 0, 1493, 1494, 5, 270, 0, 0, 1494, 1495, 3, 186, 93, 0, 1495, 1496,
        5, 295, 0, 0, 1496, 1505, 1, 0, 0, 0, 1497, 1498, 5, 160, 0, 0, 1498, 1499, 5, 294, 0, 0, 1499, 1500, 3, 186,
        93, 0, 1500, 1501, 5, 106, 0, 0, 1501, 1502, 3, 186, 93, 0, 1502, 1503, 5, 295, 0, 0, 1503, 1505, 1, 0, 0, 0,
        1504, 1490, 1, 0, 0, 0, 1504, 1497, 1, 0, 0, 0, 1505, 229, 1, 0, 0, 0, 1506, 1507, 5, 156, 0, 0, 1507, 1508, 5,
        294, 0, 0, 1508, 1509, 3, 186, 93, 0, 1509, 1510, 5, 270, 0, 0, 1510, 1511, 3, 186, 93, 0, 1511, 1512, 5, 270,
        0, 0, 1512, 1515, 3, 186, 93, 0, 1513, 1514, 5, 270, 0, 0, 1514, 1516, 3, 186, 93, 0, 1515, 1513, 1, 0, 0, 0,
        1515, 1516, 1, 0, 0, 0, 1516, 1517, 1, 0, 0, 0, 1517, 1518, 5, 295, 0, 0, 1518, 1533, 1, 0, 0, 0, 1519, 1520, 5,
        156, 0, 0, 1520, 1521, 5, 294, 0, 0, 1521, 1522, 3, 186, 93, 0, 1522, 1523, 5, 159, 0, 0, 1523, 1524, 3, 186,
        93, 0, 1524, 1525, 5, 95, 0, 0, 1525, 1528, 3, 186, 93, 0, 1526, 1527, 5, 92, 0, 0, 1527, 1529, 3, 186, 93, 0,
        1528, 1526, 1, 0, 0, 0, 1528, 1529, 1, 0, 0, 0, 1529, 1530, 1, 0, 0, 0, 1530, 1531, 5, 295, 0, 0, 1531, 1533, 1,
        0, 0, 0, 1532, 1506, 1, 0, 0, 0, 1532, 1519, 1, 0, 0, 0, 1533, 231, 1, 0, 0, 0, 1534, 1535, 5, 44, 0, 0, 1535,
        1536, 5, 294, 0, 0, 1536, 1537, 5, 277, 0, 0, 1537, 1547, 5, 295, 0, 0, 1538, 1539, 7, 13, 0, 0, 1539, 1541, 5,
        294, 0, 0, 1540, 1542, 3, 98, 49, 0, 1541, 1540, 1, 0, 0, 0, 1541, 1542, 1, 0, 0, 0, 1542, 1543, 1, 0, 0, 0,
        1543, 1544, 3, 186, 93, 0, 1544, 1545, 5, 295, 0, 0, 1545, 1547, 1, 0, 0, 0, 1546, 1534, 1, 0, 0, 0, 1546, 1538,
        1, 0, 0, 0, 1547, 233, 1, 0, 0, 0, 1548, 1549, 7, 14, 0, 0, 1549, 1550, 5, 294, 0, 0, 1550, 1557, 3, 186, 93, 0,
        1551, 1552, 5, 270, 0, 0, 1552, 1555, 3, 186, 93, 0, 1553, 1554, 5, 270, 0, 0, 1554, 1556, 3, 186, 93, 0, 1555,
        1553, 1, 0, 0, 0, 1555, 1556, 1, 0, 0, 0, 1556, 1558, 1, 0, 0, 0, 1557, 1551, 1, 0, 0, 0, 1557, 1558, 1, 0, 0,
        0, 1558, 1559, 1, 0, 0, 0, 1559, 1560, 5, 295, 0, 0, 1560, 1561, 3, 114, 57, 0, 1561, 235, 1, 0, 0, 0, 1562,
        1563, 5, 24, 0, 0, 1563, 1564, 5, 294, 0, 0, 1564, 1565, 3, 186, 93, 0, 1565, 1566, 5, 10, 0, 0, 1566, 1567, 3,
        276, 138, 0, 1567, 1568, 5, 295, 0, 0, 1568, 237, 1, 0, 0, 0, 1569, 1570, 5, 235, 0, 0, 1570, 1571, 5, 294, 0,
        0, 1571, 1572, 3, 186, 93, 0, 1572, 1573, 5, 10, 0, 0, 1573, 1574, 3, 276, 138, 0, 1574, 1575, 5, 295, 0, 0,
        1575, 239, 1, 0, 0, 0, 1576, 1577, 5, 234, 0, 0, 1577, 1578, 5, 294, 0, 0, 1578, 1579, 3, 186, 93, 0, 1579,
        1580, 5, 10, 0, 0, 1580, 1581, 3, 276, 138, 0, 1581, 1582, 5, 295, 0, 0, 1582, 241, 1, 0, 0, 0, 1583, 1584, 5,
        85, 0, 0, 1584, 1585, 5, 294, 0, 0, 1585, 1586, 5, 303, 0, 0, 1586, 1587, 5, 95, 0, 0, 1587, 1588, 3, 186, 93,
        0, 1588, 1589, 5, 295, 0, 0, 1589, 243, 1, 0, 0, 0, 1590, 1591, 5, 207, 0, 0, 1591, 1599, 5, 294, 0, 0, 1592,
        1594, 5, 303, 0, 0, 1593, 1592, 1, 0, 0, 0, 1593, 1594, 1, 0, 0, 0, 1594, 1596, 1, 0, 0, 0, 1595, 1597, 3, 186,
        93, 0, 1596, 1595, 1, 0, 0, 0, 1596, 1597, 1, 0, 0, 0, 1597, 1598, 1, 0, 0, 0, 1598, 1600, 5, 95, 0, 0, 1599,
        1593, 1, 0, 0, 0, 1599, 1600, 1, 0, 0, 0, 1600, 1601, 1, 0, 0, 0, 1601, 1602, 3, 186, 93, 0, 1602, 1603, 5, 295,
        0, 0, 1603, 245, 1, 0, 0, 0, 1604, 1605, 7, 15, 0, 0, 1605, 1606, 5, 294, 0, 0, 1606, 1607, 5, 303, 0, 0, 1607,
        1608, 5, 270, 0, 0, 1608, 1609, 3, 186, 93, 0, 1609, 1610, 5, 270, 0, 0, 1610, 1611, 3, 186, 93, 0, 1611, 1612,
        5, 295, 0, 0, 1612, 247, 1, 0, 0, 0, 1613, 1614, 3, 250, 125, 0, 1614, 1623, 5, 294, 0, 0, 1615, 1620, 3, 186,
        93, 0, 1616, 1617, 5, 270, 0, 0, 1617, 1619, 3, 186, 93, 0, 1618, 1616, 1, 0, 0, 0, 1619, 1622, 1, 0, 0, 0,
        1620, 1618, 1, 0, 0, 0, 1620, 1621, 1, 0, 0, 0, 1621, 1624, 1, 0, 0, 0, 1622, 1620, 1, 0, 0, 0, 1623, 1615, 1,
        0, 0, 0, 1623, 1624, 1, 0, 0, 0, 1624, 1625, 1, 0, 0, 0, 1625, 1626, 5, 295, 0, 0, 1626, 249, 1, 0, 0, 0, 1627,
        1628, 3, 12, 6, 0, 1628, 1629, 5, 299, 0, 0, 1629, 1631, 1, 0, 0, 0, 1630, 1627, 1, 0, 0, 0, 1631, 1634, 1, 0,
        0, 0, 1632, 1630, 1, 0, 0, 0, 1632, 1633, 1, 0, 0, 0, 1633, 1635, 1, 0, 0, 0, 1634, 1632, 1, 0, 0, 0, 1635,
        1646, 7, 16, 0, 0, 1636, 1637, 3, 12, 6, 0, 1637, 1638, 5, 299, 0, 0, 1638, 1640, 1, 0, 0, 0, 1639, 1636, 1, 0,
        0, 0, 1640, 1643, 1, 0, 0, 0, 1641, 1639, 1, 0, 0, 0, 1641, 1642, 1, 0, 0, 0, 1642, 1644, 1, 0, 0, 0, 1643,
        1641, 1, 0, 0, 0, 1644, 1646, 3, 12, 6, 0, 1645, 1632, 1, 0, 0, 0, 1645, 1641, 1, 0, 0, 0, 1646, 251, 1, 0, 0,
        0, 1647, 1648, 5, 290, 0, 0, 1648, 1649, 3, 186, 93, 0, 1649, 1650, 5, 291, 0, 0, 1650, 1659, 1, 0, 0, 0, 1651,
        1652, 5, 290, 0, 0, 1652, 1653, 5, 277, 0, 0, 1653, 1659, 5, 291, 0, 0, 1654, 1655, 5, 299, 0, 0, 1655, 1659, 3,
        12, 6, 0, 1656, 1657, 5, 299, 0, 0, 1657, 1659, 5, 277, 0, 0, 1658, 1647, 1, 0, 0, 0, 1658, 1651, 1, 0, 0, 0,
        1658, 1654, 1, 0, 0, 0, 1658, 1656, 1, 0, 0, 0, 1659, 253, 1, 0, 0, 0, 1660, 1661, 5, 294, 0, 0, 1661, 1662, 3,
        208, 104, 0, 1662, 1663, 5, 130, 0, 0, 1663, 1664, 3, 138, 69, 0, 1664, 1665, 5, 295, 0, 0, 1665, 255, 1, 0, 0,
        0, 1666, 1667, 3, 208, 104, 0, 1667, 1668, 5, 130, 0, 0, 1668, 1669, 3, 136, 68, 0, 1669, 257, 1, 0, 0, 0, 1670,
        1671, 5, 298, 0, 0, 1671, 259, 1, 0, 0, 0, 1672, 1674, 5, 275, 0, 0, 1673, 1672, 1, 0, 0, 0, 1673, 1674, 1, 0,
        0, 0, 1674, 1675, 1, 0, 0, 0, 1675, 1681, 7, 0, 0, 0, 1676, 1678, 5, 275, 0, 0, 1677, 1676, 1, 0, 0, 0, 1677,
        1678, 1, 0, 0, 0, 1678, 1679, 1, 0, 0, 0, 1679, 1681, 3, 262, 131, 0, 1680, 1673, 1, 0, 0, 0, 1680, 1677, 1, 0,
        0, 0, 1681, 261, 1, 0, 0, 0, 1682, 1683, 5, 79, 0, 0, 1683, 263, 1, 0, 0, 0, 1684, 1687, 3, 266, 133, 0, 1685,
        1687, 3, 268, 134, 0, 1686, 1684, 1, 0, 0, 0, 1686, 1685, 1, 0, 0, 0, 1687, 265, 1, 0, 0, 0, 1688, 1697, 5, 290,
        0, 0, 1689, 1694, 3, 186, 93, 0, 1690, 1691, 5, 270, 0, 0, 1691, 1693, 3, 186, 93, 0, 1692, 1690, 1, 0, 0, 0,
        1693, 1696, 1, 0, 0, 0, 1694, 1692, 1, 0, 0, 0, 1694, 1695, 1, 0, 0, 0, 1695, 1698, 1, 0, 0, 0, 1696, 1694, 1,
        0, 0, 0, 1697, 1689, 1, 0, 0, 0, 1697, 1698, 1, 0, 0, 0, 1698, 1699, 1, 0, 0, 0, 1699, 1700, 5, 291, 0, 0, 1700,
        267, 1, 0, 0, 0, 1701, 1710, 5, 288, 0, 0, 1702, 1707, 3, 186, 93, 0, 1703, 1704, 5, 270, 0, 0, 1704, 1706, 3,
        186, 93, 0, 1705, 1703, 1, 0, 0, 0, 1706, 1709, 1, 0, 0, 0, 1707, 1705, 1, 0, 0, 0, 1707, 1708, 1, 0, 0, 0,
        1708, 1711, 1, 0, 0, 0, 1709, 1707, 1, 0, 0, 0, 1710, 1702, 1, 0, 0, 0, 1710, 1711, 1, 0, 0, 0, 1711, 1712, 1,
        0, 0, 0, 1712, 1713, 5, 289, 0, 0, 1713, 269, 1, 0, 0, 0, 1714, 1723, 5, 292, 0, 0, 1715, 1720, 3, 272, 136, 0,
        1716, 1717, 5, 270, 0, 0, 1717, 1719, 3, 272, 136, 0, 1718, 1716, 1, 0, 0, 0, 1719, 1722, 1, 0, 0, 0, 1720,
        1718, 1, 0, 0, 0, 1720, 1721, 1, 0, 0, 0, 1721, 1724, 1, 0, 0, 0, 1722, 1720, 1, 0, 0, 0, 1723, 1715, 1, 0, 0,
        0, 1723, 1724, 1, 0, 0, 0, 1724, 1725, 1, 0, 0, 0, 1725, 1726, 5, 293, 0, 0, 1726, 271, 1, 0, 0, 0, 1727, 1728,
        3, 186, 93, 0, 1728, 1729, 5, 296, 0, 0, 1729, 1730, 3, 186, 93, 0, 1730, 273, 1, 0, 0, 0, 1731, 1766, 5, 141,
        0, 0, 1732, 1766, 5, 236, 0, 0, 1733, 1766, 5, 208, 0, 0, 1734, 1766, 5, 88, 0, 0, 1735, 1766, 5, 300, 0, 0,
        1736, 1766, 5, 301, 0, 0, 1737, 1766, 5, 302, 0, 0, 1738, 1766, 5, 309, 0, 0, 1739, 1740, 5, 53, 0, 0, 1740,
        1766, 5, 300, 0, 0, 1741, 1745, 5, 201, 0, 0, 1742, 1743, 5, 294, 0, 0, 1743, 1744, 5, 301, 0, 0, 1744, 1746, 5,
        295, 0, 0, 1745, 1742, 1, 0, 0, 0, 1745, 1746, 1, 0, 0, 0, 1746, 1750, 1, 0, 0, 0, 1747, 1748, 5, 226, 0, 0,
        1748, 1749, 5, 201, 0, 0, 1749, 1751, 5, 229, 0, 0, 1750, 1747, 1, 0, 0, 0, 1750, 1751, 1, 0, 0, 0, 1751, 1752,
        1, 0, 0, 0, 1752, 1766, 5, 300, 0, 0, 1753, 1757, 5, 202, 0, 0, 1754, 1755, 5, 294, 0, 0, 1755, 1756, 5, 301, 0,
        0, 1756, 1758, 5, 295, 0, 0, 1757, 1754, 1, 0, 0, 0, 1757, 1758, 1, 0, 0, 0, 1758, 1762, 1, 0, 0, 0, 1759, 1760,
        5, 226, 0, 0, 1760, 1761, 5, 201, 0, 0, 1761, 1763, 5, 229, 0, 0, 1762, 1759, 1, 0, 0, 0, 1762, 1763, 1, 0, 0,
        0, 1763, 1764, 1, 0, 0, 0, 1764, 1766, 5, 300, 0, 0, 1765, 1731, 1, 0, 0, 0, 1765, 1732, 1, 0, 0, 0, 1765, 1733,
        1, 0, 0, 0, 1765, 1734, 1, 0, 0, 0, 1765, 1735, 1, 0, 0, 0, 1765, 1736, 1, 0, 0, 0, 1765, 1737, 1, 0, 0, 0,
        1765, 1738, 1, 0, 0, 0, 1765, 1739, 1, 0, 0, 0, 1765, 1741, 1, 0, 0, 0, 1765, 1753, 1, 0, 0, 0, 1766, 275, 1, 0,
        0, 0, 1767, 1806, 7, 17, 0, 0, 1768, 1769, 5, 69, 0, 0, 1769, 1806, 5, 161, 0, 0, 1770, 1774, 7, 18, 0, 0, 1771,
        1772, 5, 294, 0, 0, 1772, 1773, 5, 301, 0, 0, 1773, 1775, 5, 295, 0, 0, 1774, 1771, 1, 0, 0, 0, 1774, 1775, 1,
        0, 0, 0, 1775, 1806, 1, 0, 0, 0, 1776, 1777, 5, 27, 0, 0, 1777, 1781, 5, 221, 0, 0, 1778, 1779, 5, 294, 0, 0,
        1779, 1780, 5, 301, 0, 0, 1780, 1782, 5, 295, 0, 0, 1781, 1778, 1, 0, 0, 0, 1781, 1782, 1, 0, 0, 0, 1782, 1806,
        1, 0, 0, 0, 1783, 1791, 7, 19, 0, 0, 1784, 1785, 5, 294, 0, 0, 1785, 1788, 5, 301, 0, 0, 1786, 1787, 5, 270, 0,
        0, 1787, 1789, 5, 301, 0, 0, 1788, 1786, 1, 0, 0, 0, 1788, 1789, 1, 0, 0, 0, 1789, 1790, 1, 0, 0, 0, 1790, 1792,
        5, 295, 0, 0, 1791, 1784, 1, 0, 0, 0, 1791, 1792, 1, 0, 0, 0, 1792, 1806, 1, 0, 0, 0, 1793, 1797, 7, 20, 0, 0,
        1794, 1795, 5, 294, 0, 0, 1795, 1796, 5, 301, 0, 0, 1796, 1798, 5, 295, 0, 0, 1797, 1794, 1, 0, 0, 0, 1797,
        1798, 1, 0, 0, 0, 1798, 1802, 1, 0, 0, 0, 1799, 1800, 5, 226, 0, 0, 1800, 1801, 5, 201, 0, 0, 1801, 1803, 5,
        229, 0, 0, 1802, 1799, 1, 0, 0, 0, 1802, 1803, 1, 0, 0, 0, 1803, 1806, 1, 0, 0, 0, 1804, 1806, 3, 12, 6, 0,
        1805, 1767, 1, 0, 0, 0, 1805, 1768, 1, 0, 0, 0, 1805, 1770, 1, 0, 0, 0, 1805, 1776, 1, 0, 0, 0, 1805, 1783, 1,
        0, 0, 0, 1805, 1793, 1, 0, 0, 0, 1805, 1804, 1, 0, 0, 0, 1806, 277, 1, 0, 0, 0, 226, 285, 290, 292, 298, 304,
        310, 316, 320, 345, 348, 355, 370, 379, 391, 396, 407, 414, 422, 427, 434, 440, 443, 446, 450, 455, 458, 463,
        471, 477, 490, 496, 504, 518, 521, 524, 530, 534, 539, 550, 553, 568, 576, 588, 593, 598, 609, 619, 622, 630,
        639, 644, 647, 650, 656, 663, 668, 673, 682, 689, 694, 697, 707, 721, 726, 730, 734, 742, 746, 755, 760, 763,
        774, 784, 796, 803, 818, 833, 838, 845, 849, 852, 857, 863, 869, 874, 876, 885, 889, 892, 898, 902, 904, 908,
        911, 916, 919, 923, 927, 930, 935, 938, 942, 944, 951, 954, 990, 994, 998, 1001, 1013, 1024, 1030, 1038, 1046,
        1050, 1052, 1060, 1064, 1074, 1080, 1082, 1087, 1094, 1097, 1100, 1104, 1107, 1110, 1112, 1117, 1120, 1123,
        1130, 1138, 1142, 1146, 1149, 1158, 1162, 1167, 1171, 1176, 1180, 1183, 1185, 1190, 1194, 1197, 1200, 1203,
        1206, 1209, 1212, 1215, 1225, 1236, 1242, 1253, 1258, 1267, 1273, 1279, 1283, 1290, 1292, 1303, 1314, 1325,
        1331, 1354, 1360, 1364, 1378, 1394, 1401, 1410, 1414, 1424, 1433, 1444, 1455, 1458, 1469, 1471, 1482, 1484,
        1488, 1504, 1515, 1528, 1532, 1541, 1546, 1555, 1557, 1593, 1596, 1599, 1620, 1623, 1632, 1641, 1645, 1658,
        1673, 1677, 1680, 1686, 1694, 1697, 1707, 1710, 1720, 1723, 1745, 1750, 1757, 1762, 1765, 1774, 1781, 1788,
        1791, 1797, 1802, 1805,
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
    public statement(): StatementContext {
        return this.getRuleContext(0, StatementContext)!
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
        return PartiQLParser.RULE_root
    }
}

export class StatementContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_statement
    }
    public override copyFrom(ctx: StatementContext): void {
        super.copyFrom(ctx)
    }
}
export class QueryExecContext extends StatementContext {
    public constructor(ctx: StatementContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public execCommand(): ExecCommandContext {
        return this.getRuleContext(0, ExecCommandContext)!
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EOF, 0)!
    }
    public COLON_SEMI(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON_SEMI, 0)
    }
}
export class QueryDdlContext extends StatementContext {
    public constructor(ctx: StatementContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public ddl(): DdlContext {
        return this.getRuleContext(0, DdlContext)!
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EOF, 0)!
    }
    public COLON_SEMI(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON_SEMI, 0)
    }
}
export class QueryDqlContext extends StatementContext {
    public constructor(ctx: StatementContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public dql(): DqlContext {
        return this.getRuleContext(0, DqlContext)!
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EOF, 0)!
    }
    public COLON_SEMI(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON_SEMI, 0)
    }
}
export class QueryDmlContext extends StatementContext {
    public constructor(ctx: StatementContext) {
        super(ctx.parent, ctx.invokingState)
        super.copyFrom(ctx)
    }
    public dml(): DmlContext {
        return this.getRuleContext(0, DmlContext)!
    }
    public EOF(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.EOF, 0)!
    }
    public COLON_SEMI(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON_SEMI, 0)
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
