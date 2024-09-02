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
    public static readonly CLUSTERING = 251
    public static readonly TUPLE = 252
    public static readonly INTEGER2 = 253
    public static readonly INT2 = 254
    public static readonly INTEGER4 = 255
    public static readonly INT4 = 256
    public static readonly INTEGER8 = 257
    public static readonly INT8 = 258
    public static readonly BIGINT = 259
    public static readonly BOOL = 260
    public static readonly BOOLEAN = 261
    public static readonly STRING = 262
    public static readonly SYMBOL = 263
    public static readonly CLOB = 264
    public static readonly BLOB = 265
    public static readonly STRUCT = 266
    public static readonly LIST = 267
    public static readonly SEXP = 268
    public static readonly BAG = 269
    public static readonly CARET = 270
    public static readonly COMMA = 271
    public static readonly PLUS = 272
    public static readonly MINUS = 273
    public static readonly SLASH_FORWARD = 274
    public static readonly PERCENT = 275
    public static readonly AT_SIGN = 276
    public static readonly TILDE = 277
    public static readonly ASTERISK = 278
    public static readonly VERTBAR = 279
    public static readonly AMPERSAND = 280
    public static readonly BANG = 281
    public static readonly LT_EQ = 282
    public static readonly GT_EQ = 283
    public static readonly EQ = 284
    public static readonly NEQ = 285
    public static readonly CONCAT = 286
    public static readonly ANGLE_LEFT = 287
    public static readonly ANGLE_RIGHT = 288
    public static readonly ANGLE_DOUBLE_LEFT = 289
    public static readonly ANGLE_DOUBLE_RIGHT = 290
    public static readonly BRACKET_LEFT = 291
    public static readonly BRACKET_RIGHT = 292
    public static readonly BRACE_LEFT = 293
    public static readonly BRACE_RIGHT = 294
    public static readonly PAREN_LEFT = 295
    public static readonly PAREN_RIGHT = 296
    public static readonly COLON = 297
    public static readonly COLON_SEMI = 298
    public static readonly QUESTION_MARK = 299
    public static readonly PERIOD = 300
    public static readonly LITERAL_STRING = 301
    public static readonly LITERAL_INTEGER = 302
    public static readonly LITERAL_DECIMAL = 303
    public static readonly IDENTIFIER = 304
    public static readonly IDENTIFIER_QUOTED = 305
    public static readonly WS = 306
    public static readonly COMMENT_SINGLE = 307
    public static readonly COMMENT_BLOCK = 308
    public static readonly UNRECOGNIZED = 309
    public static readonly ION_CLOSURE = 310
    public static readonly BACKTICK = 311
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
    public static readonly RULE_tableOption = 15
    public static readonly RULE_tableOptionValue = 16
    public static readonly RULE_clusteringDirection = 17
    public static readonly RULE_ddl = 18
    public static readonly RULE_createCommand = 19
    public static readonly RULE_dropCommand = 20
    public static readonly RULE_tableDef = 21
    public static readonly RULE_tableDefPart = 22
    public static readonly RULE_columnDef = 23
    public static readonly RULE_columnConstraint = 24
    public static readonly RULE_columnConstraintDef = 25
    public static readonly RULE_withDef = 26
    public static readonly RULE_tableOptions = 27
    public static readonly RULE_tableOptionMap = 28
    public static readonly RULE_clusteringOrder = 29
    public static readonly RULE_dml = 30
    public static readonly RULE_dmlBaseCommand = 31
    public static readonly RULE_pathSimple = 32
    public static readonly RULE_pathSimpleSteps = 33
    public static readonly RULE_replaceCommand = 34
    public static readonly RULE_upsertCommand = 35
    public static readonly RULE_removeCommand = 36
    public static readonly RULE_insertCommandReturning = 37
    public static readonly RULE_insertStatement = 38
    public static readonly RULE_onConflict = 39
    public static readonly RULE_insertStatementLegacy = 40
    public static readonly RULE_onConflictLegacy = 41
    public static readonly RULE_conflictTarget = 42
    public static readonly RULE_constraintName = 43
    public static readonly RULE_conflictAction = 44
    public static readonly RULE_doReplace = 45
    public static readonly RULE_doUpdate = 46
    public static readonly RULE_updateClause = 47
    public static readonly RULE_setCommand = 48
    public static readonly RULE_setAssignment = 49
    public static readonly RULE_deleteCommand = 50
    public static readonly RULE_returningClause = 51
    public static readonly RULE_returningColumn = 52
    public static readonly RULE_fromClauseSimple = 53
    public static readonly RULE_whereClause = 54
    public static readonly RULE_selectClause = 55
    public static readonly RULE_projectionItems = 56
    public static readonly RULE_projectionItem = 57
    public static readonly RULE_setQuantifierStrategy = 58
    public static readonly RULE_letClause = 59
    public static readonly RULE_letBinding = 60
    public static readonly RULE_orderByClause = 61
    public static readonly RULE_orderSortSpec = 62
    public static readonly RULE_groupClause = 63
    public static readonly RULE_groupAlias = 64
    public static readonly RULE_groupKey = 65
    public static readonly RULE_over = 66
    public static readonly RULE_windowPartitionList = 67
    public static readonly RULE_windowSortSpecList = 68
    public static readonly RULE_havingClause = 69
    public static readonly RULE_excludeClause = 70
    public static readonly RULE_excludeExpr = 71
    public static readonly RULE_excludeExprSteps = 72
    public static readonly RULE_fromClause = 73
    public static readonly RULE_whereClauseSelect = 74
    public static readonly RULE_offsetByClause = 75
    public static readonly RULE_limitClause = 76
    public static readonly RULE_gpmlPattern = 77
    public static readonly RULE_gpmlPatternList = 78
    public static readonly RULE_matchPattern = 79
    public static readonly RULE_graphPart = 80
    public static readonly RULE_matchSelector = 81
    public static readonly RULE_patternPathVariable = 82
    public static readonly RULE_patternRestrictor = 83
    public static readonly RULE_node = 84
    public static readonly RULE_edge = 85
    public static readonly RULE_pattern = 86
    public static readonly RULE_patternQuantifier = 87
    public static readonly RULE_edgeWSpec = 88
    public static readonly RULE_edgeSpec = 89
    public static readonly RULE_labelSpec = 90
    public static readonly RULE_labelTerm = 91
    public static readonly RULE_labelFactor = 92
    public static readonly RULE_labelPrimary = 93
    public static readonly RULE_edgeAbbrev = 94
    public static readonly RULE_tableReference = 95
    public static readonly RULE_tableNonJoin = 96
    public static readonly RULE_tableBaseReference = 97
    public static readonly RULE_tableUnpivot = 98
    public static readonly RULE_joinRhs = 99
    public static readonly RULE_joinSpec = 100
    public static readonly RULE_joinType = 101
    public static readonly RULE_expr = 102
    public static readonly RULE_exprBagOp = 103
    public static readonly RULE_exprSelect = 104
    public static readonly RULE_exprOr = 105
    public static readonly RULE_exprAnd = 106
    public static readonly RULE_exprNot = 107
    public static readonly RULE_exprPredicate = 108
    public static readonly RULE_mathOp00 = 109
    public static readonly RULE_mathOp01 = 110
    public static readonly RULE_mathOp02 = 111
    public static readonly RULE_valueExpr = 112
    public static readonly RULE_exprPrimary = 113
    public static readonly RULE_exprTerm = 114
    public static readonly RULE_nullIf = 115
    public static readonly RULE_coalesce = 116
    public static readonly RULE_caseExpr = 117
    public static readonly RULE_values = 118
    public static readonly RULE_valueRow = 119
    public static readonly RULE_valueList = 120
    public static readonly RULE_sequenceConstructor = 121
    public static readonly RULE_substring = 122
    public static readonly RULE_position = 123
    public static readonly RULE_overlay = 124
    public static readonly RULE_aggregate = 125
    public static readonly RULE_windowFunction = 126
    public static readonly RULE_cast = 127
    public static readonly RULE_canLosslessCast = 128
    public static readonly RULE_canCast = 129
    public static readonly RULE_extract = 130
    public static readonly RULE_trimFunction = 131
    public static readonly RULE_dateFunction = 132
    public static readonly RULE_functionCall = 133
    public static readonly RULE_functionName = 134
    public static readonly RULE_pathStep = 135
    public static readonly RULE_exprGraphMatchMany = 136
    public static readonly RULE_exprGraphMatchOne = 137
    public static readonly RULE_parameter = 138
    public static readonly RULE_varRefExpr = 139
    public static readonly RULE_nonReservedKeywords = 140
    public static readonly RULE_collection = 141
    public static readonly RULE_array = 142
    public static readonly RULE_bag = 143
    public static readonly RULE_tuple = 144
    public static readonly RULE_pair = 145
    public static readonly RULE_literal = 146
    public static readonly RULE_type = 147

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
        "'CLUSTERING'",
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
        'CLUSTERING',
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
        'tableOption',
        'tableOptionValue',
        'clusteringDirection',
        'ddl',
        'createCommand',
        'dropCommand',
        'tableDef',
        'tableDefPart',
        'columnDef',
        'columnConstraint',
        'columnConstraintDef',
        'withDef',
        'tableOptions',
        'tableOptionMap',
        'clusteringOrder',
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
                this.state = 300
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 296
                            this.statement()
                            this.state = 298
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            if (_la === 298) {
                                {
                                    this.state = 297
                                    this.match(PartiQLParser.COLON_SEMI)
                                }
                            }
                        }
                    }
                    this.state = 302
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
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                )
                this.state = 304
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
                this.state = 320
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 83) {
                    {
                        this.state = 306
                        this.match(PartiQLParser.EXPLAIN)
                        this.state = 318
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 3, this.context)) {
                            case 1:
                                {
                                    this.state = 307
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 308
                                    this.explainOption()
                                    this.state = 313
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    while (_la === 271) {
                                        {
                                            {
                                                this.state = 309
                                                this.match(PartiQLParser.COMMA)
                                                this.state = 310
                                                this.explainOption()
                                            }
                                        }
                                        this.state = 315
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                    }
                                    this.state = 316
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                    }
                }

                this.state = 322
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
            this.state = 328
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
                        this.state = 324
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
                        this.state = 325
                        this.dml()
                    }
                    break
                case PartiQLParser.CREATE:
                case PartiQLParser.DROP:
                    localContext = new QueryDdlContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 326
                        this.ddl()
                    }
                    break
                case PartiQLParser.EXEC:
                    localContext = new QueryExecContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 327
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
                this.state = 330
                localContext._param = this.match(PartiQLParser.IDENTIFIER)
                this.state = 331
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
                this.state = 333
                this.match(PartiQLParser.AS)
                this.state = 334
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
                this.state = 336
                this.match(PartiQLParser.AT)
                this.state = 337
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
                this.state = 339
                this.match(PartiQLParser.BY)
                this.state = 340
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
                this.state = 342
                localContext._ident = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 304 || _la === 305)) {
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
                this.state = 344
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
                this.state = 346
                this.match(PartiQLParser.EXEC)
                this.state = 347
                localContext._name = this.expr()
                this.state = 356
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 7, this.context)) {
                    case 1:
                        {
                            this.state = 348
                            localContext._expr = this.expr()
                            localContext._args.push(localContext._expr!)
                            this.state = 353
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            while (_la === 271) {
                                {
                                    {
                                        this.state = 349
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 350
                                        localContext._expr = this.expr()
                                        localContext._args.push(localContext._expr!)
                                    }
                                }
                                this.state = 355
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
                this.state = 363
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 358
                                localContext._symbolPrimitive = this.symbolPrimitive()
                                localContext._qualifier.push(localContext._symbolPrimitive!)
                                this.state = 359
                                this.match(PartiQLParser.PERIOD)
                            }
                        }
                    }
                    this.state = 365
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 8, this.context)
                }
                this.state = 366
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
                this.state = 368
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
                this.state = 370
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
                this.state = 372
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
                this.state = 374
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
    public tableOption(): TableOptionContext {
        let localContext = new TableOptionContext(this.context, this.state)
        this.enterRule(localContext, 30, PartiQLParser.RULE_tableOption)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 376
                this.match(PartiQLParser.IDENTIFIER)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
                this.errorHandler.recover(this, re)
            } else {
                throw re
            }
        } finally {
            this.exitRule()
        }
        return localContext
    }
    public tableOptionValue(): TableOptionValueContext {
        let localContext = new TableOptionValueContext(this.context, this.state)
        this.enterRule(localContext, 32, PartiQLParser.RULE_tableOptionValue)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 378
                _la = this.tokenStream.LA(1)
                if (!(_la === 301 || _la === 302)) {
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
    public clusteringDirection(): ClusteringDirectionContext {
        let localContext = new ClusteringDirectionContext(this.context, this.state)
        this.enterRule(localContext, 34, PartiQLParser.RULE_clusteringDirection)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 380
                _la = this.tokenStream.LA(1)
                if (!(_la === 11 || _la === 62)) {
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
    public ddl(): DdlContext {
        let localContext = new DdlContext(this.context, this.state)
        this.enterRule(localContext, 36, PartiQLParser.RULE_ddl)
        try {
            this.state = 384
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.CREATE:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 382
                        this.createCommand()
                    }
                    break
                case PartiQLParser.DROP:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 383
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
        this.enterRule(localContext, 38, PartiQLParser.RULE_createCommand)
        let _la: number
        try {
            this.state = 413
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 13, this.context)) {
                case 1:
                    localContext = new CreateTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 386
                        this.match(PartiQLParser.CREATE)
                        this.state = 387
                        this.match(PartiQLParser.TABLE)
                        this.state = 388
                        this.qualifiedName()
                        this.state = 393
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 10, this.context)) {
                            case 1:
                                {
                                    this.state = 389
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 390
                                    this.tableDef()
                                    this.state = 391
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                        this.state = 396
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 395
                                this.withDef()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new CreateIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 398
                        this.match(PartiQLParser.CREATE)
                        this.state = 399
                        this.match(PartiQLParser.INDEX)
                        this.state = 400
                        this.match(PartiQLParser.ON)
                        this.state = 401
                        this.symbolPrimitive()
                        this.state = 402
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 403
                        this.pathSimple()
                        this.state = 408
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 404
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 405
                                    this.pathSimple()
                                }
                            }
                            this.state = 410
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 411
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
        this.enterRule(localContext, 40, PartiQLParser.RULE_dropCommand)
        try {
            this.state = 424
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 14, this.context)) {
                case 1:
                    localContext = new DropTableContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 415
                        this.match(PartiQLParser.DROP)
                        this.state = 416
                        this.match(PartiQLParser.TABLE)
                        this.state = 417
                        this.qualifiedName()
                    }
                    break
                case 2:
                    localContext = new DropIndexContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 418
                        this.match(PartiQLParser.DROP)
                        this.state = 419
                        this.match(PartiQLParser.INDEX)
                        this.state = 420
                        ;(localContext as DropIndexContext)._target = this.symbolPrimitive()
                        this.state = 421
                        this.match(PartiQLParser.ON)
                        this.state = 422
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
        this.enterRule(localContext, 42, PartiQLParser.RULE_tableDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 426
                this.tableDefPart()
                this.state = 431
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 427
                            this.match(PartiQLParser.COMMA)
                            this.state = 428
                            this.tableDefPart()
                        }
                    }
                    this.state = 433
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
        this.enterRule(localContext, 44, PartiQLParser.RULE_tableDefPart)
        let _la: number
        try {
            this.state = 448
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new ColumnDeclarationContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 434
                        this.columnName()
                        this.state = 435
                        this.type_()
                        this.state = 439
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 39 || _la === 140 || _la === 141) {
                            {
                                {
                                    this.state = 436
                                    this.columnConstraint()
                                }
                            }
                            this.state = 441
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                    break
                case PartiQLParser.PRIMARY:
                    localContext = new PrimaryKeyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 442
                        this.match(PartiQLParser.PRIMARY)
                        this.state = 443
                        this.match(PartiQLParser.KEY)
                        {
                            this.state = 444
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 445
                            this.columnDef()
                            this.state = 446
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
        this.enterRule(localContext, 46, PartiQLParser.RULE_columnDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 450
                this.columnName()
                this.state = 455
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 451
                            this.match(PartiQLParser.COMMA)
                            this.state = 452
                            this.columnName()
                        }
                    }
                    this.state = 457
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
        this.enterRule(localContext, 48, PartiQLParser.RULE_columnConstraint)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 460
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 39) {
                    {
                        this.state = 458
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 459
                        this.columnConstraintName()
                    }
                }

                this.state = 462
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
        this.enterRule(localContext, 50, PartiQLParser.RULE_columnConstraintDef)
        try {
            this.state = 467
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new ColConstrNotNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 464
                        this.match(PartiQLParser.NOT)
                        this.state = 465
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.NULL:
                    localContext = new ColConstrNullContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 466
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
    public withDef(): WithDefContext {
        let localContext = new WithDefContext(this.context, this.state)
        this.enterRule(localContext, 52, PartiQLParser.RULE_withDef)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 469
                this.match(PartiQLParser.WITH)
                this.state = 470
                this.tableOptions()
                this.state = 475
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 7) {
                    {
                        {
                            this.state = 471
                            this.match(PartiQLParser.AND)
                            this.state = 472
                            this.tableOptions()
                        }
                    }
                    this.state = 477
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
    public tableOptions(): TableOptionsContext {
        let localContext = new TableOptionsContext(this.context, this.state)
        this.enterRule(localContext, 54, PartiQLParser.RULE_tableOptions)
        try {
            this.state = 493
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 22, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 478
                        this.tableOption()
                        this.state = 479
                        this.match(PartiQLParser.EQ)
                        this.state = 480
                        this.tableOptionMap()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 482
                        this.tableOption()
                        this.state = 483
                        this.match(PartiQLParser.EQ)
                        this.state = 484
                        this.tableOptionValue()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 486
                        this.match(PartiQLParser.CLUSTERING)
                        this.state = 487
                        this.match(PartiQLParser.ORDER)
                        this.state = 488
                        this.match(PartiQLParser.BY)
                        this.state = 489
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 490
                        this.clusteringOrder()
                        this.state = 491
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
    public tableOptionMap(): TableOptionMapContext {
        let localContext = new TableOptionMapContext(this.context, this.state)
        this.enterRule(localContext, 56, PartiQLParser.RULE_tableOptionMap)
        let _la: number
        try {
            this.state = 514
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 24, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 495
                        this.match(PartiQLParser.BRACE_LEFT)
                        this.state = 496
                        this.tableOptionMap()
                        this.state = 501
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 497
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 498
                                    this.tableOptionMap()
                                }
                            }
                            this.state = 503
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 504
                        this.match(PartiQLParser.BRACE_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 506
                        this.tableOptionValue()
                        this.state = 507
                        this.match(PartiQLParser.COLON)
                        this.state = 508
                        this.tableOptionValue()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 510
                        this.tableOptionValue()
                        this.state = 511
                        this.match(PartiQLParser.COLON)
                        this.state = 512
                        this.tableOptionMap()
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
    public clusteringOrder(): ClusteringOrderContext {
        let localContext = new ClusteringOrderContext(this.context, this.state)
        this.enterRule(localContext, 58, PartiQLParser.RULE_clusteringOrder)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 516
                this.columnName()
                this.state = 517
                this.clusteringDirection()
                this.state = 524
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 518
                            this.match(PartiQLParser.COMMA)
                            this.state = 519
                            this.columnName()
                            this.state = 520
                            this.clusteringDirection()
                        }
                    }
                    this.state = 526
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
    public dml(): DmlContext {
        let localContext = new DmlContext(this.context, this.state)
        this.enterRule(localContext, 60, PartiQLParser.RULE_dml)
        let _la: number
        try {
            let alternative: number
            this.state = 554
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 32, this.context)) {
                case 1:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 527
                        this.updateClause()
                        this.state = 529
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 528
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 531
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 26, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 534
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 533
                                this.whereClause()
                            }
                        }

                        this.state = 537
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 536
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new DmlBaseWrapperContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 539
                        this.fromClause()
                        this.state = 541
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 540
                                this.whereClause()
                            }
                        }

                        this.state = 544
                        this.errorHandler.sync(this)
                        alternative = 1
                        do {
                            switch (alternative) {
                                case 1:
                                    {
                                        {
                                            this.state = 543
                                            this.dmlBaseCommand()
                                        }
                                    }
                                    break
                                default:
                                    throw new antlr.NoViableAltException(this)
                            }
                            this.state = 546
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 30, this.context)
                        } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                        this.state = 549
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 246) {
                            {
                                this.state = 548
                                this.returningClause()
                            }
                        }
                    }
                    break
                case 3:
                    localContext = new DmlDeleteContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 551
                        this.deleteCommand()
                    }
                    break
                case 4:
                    localContext = new DmlInsertReturningContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 552
                        this.insertCommandReturning()
                    }
                    break
                case 5:
                    localContext = new DmlBaseContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 553
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
        this.enterRule(localContext, 62, PartiQLParser.RULE_dmlBaseCommand)
        try {
            this.state = 562
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 33, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 556
                        this.insertStatement()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 557
                        this.insertStatementLegacy()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 558
                        this.setCommand()
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 559
                        this.replaceCommand()
                    }
                    break
                case 5:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 560
                        this.removeCommand()
                    }
                    break
                case 6:
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 561
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
        this.enterRule(localContext, 64, PartiQLParser.RULE_pathSimple)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 564
                this.symbolPrimitive()
                this.state = 568
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 34, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 565
                                this.pathSimpleSteps()
                            }
                        }
                    }
                    this.state = 570
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 34, this.context)
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
        this.enterRule(localContext, 66, PartiQLParser.RULE_pathSimpleSteps)
        try {
            this.state = 581
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 35, this.context)) {
                case 1:
                    localContext = new PathSimpleLiteralContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 571
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 572
                        ;(localContext as PathSimpleLiteralContext)._key = this.literal()
                        this.state = 573
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathSimpleSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 575
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 576
                        ;(localContext as PathSimpleSymbolContext)._key = this.symbolPrimitive()
                        this.state = 577
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathSimpleDotSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 579
                        this.match(PartiQLParser.PERIOD)
                        this.state = 580
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
        this.enterRule(localContext, 68, PartiQLParser.RULE_replaceCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 583
                this.match(PartiQLParser.REPLACE)
                this.state = 584
                this.match(PartiQLParser.INTO)
                this.state = 585
                this.symbolPrimitive()
                this.state = 587
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 586
                        this.asIdent()
                    }
                }

                this.state = 589
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
        this.enterRule(localContext, 70, PartiQLParser.RULE_upsertCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 591
                this.match(PartiQLParser.UPSERT)
                this.state = 592
                this.match(PartiQLParser.INTO)
                this.state = 593
                this.symbolPrimitive()
                this.state = 595
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 594
                        this.asIdent()
                    }
                }

                this.state = 597
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
        this.enterRule(localContext, 72, PartiQLParser.RULE_removeCommand)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 599
                this.match(PartiQLParser.REMOVE)
                this.state = 600
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
        this.enterRule(localContext, 74, PartiQLParser.RULE_insertCommandReturning)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 602
                this.match(PartiQLParser.INSERT)
                this.state = 603
                this.match(PartiQLParser.INTO)
                this.state = 604
                this.pathSimple()
                this.state = 605
                this.match(PartiQLParser.VALUE)
                this.state = 606
                localContext._value = this.expr()
                this.state = 609
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 607
                        this.match(PartiQLParser.AT)
                        this.state = 608
                        localContext._pos = this.expr()
                    }
                }

                this.state = 612
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 611
                        this.onConflictLegacy()
                    }
                }

                this.state = 615
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 614
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
        this.enterRule(localContext, 76, PartiQLParser.RULE_insertStatement)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 617
                this.match(PartiQLParser.INSERT)
                this.state = 618
                this.match(PartiQLParser.INTO)
                this.state = 619
                this.symbolPrimitive()
                this.state = 621
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10) {
                    {
                        this.state = 620
                        this.asIdent()
                    }
                }

                this.state = 623
                localContext._value = this.expr()
                this.state = 625
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 624
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
        this.enterRule(localContext, 78, PartiQLParser.RULE_onConflict)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 627
                this.match(PartiQLParser.ON)
                this.state = 628
                this.match(PartiQLParser.CONFLICT)
                this.state = 630
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147 || _la === 295) {
                    {
                        this.state = 629
                        this.conflictTarget()
                    }
                }

                this.state = 632
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
        this.enterRule(localContext, 80, PartiQLParser.RULE_insertStatementLegacy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 634
                this.match(PartiQLParser.INSERT)
                this.state = 635
                this.match(PartiQLParser.INTO)
                this.state = 636
                this.pathSimple()
                this.state = 637
                this.match(PartiQLParser.VALUE)
                this.state = 638
                localContext._value = this.expr()
                this.state = 641
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 13) {
                    {
                        this.state = 639
                        this.match(PartiQLParser.AT)
                        this.state = 640
                        localContext._pos = this.expr()
                    }
                }

                this.state = 644
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 147) {
                    {
                        this.state = 643
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
        this.enterRule(localContext, 82, PartiQLParser.RULE_onConflictLegacy)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 646
                this.match(PartiQLParser.ON)
                this.state = 647
                this.match(PartiQLParser.CONFLICT)
                this.state = 648
                this.match(PartiQLParser.WHERE)
                this.state = 649
                this.expr()
                this.state = 650
                this.match(PartiQLParser.DO)
                this.state = 651
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
        this.enterRule(localContext, 84, PartiQLParser.RULE_conflictTarget)
        let _la: number
        try {
            this.state = 667
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 653
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 654
                        this.symbolPrimitive()
                        this.state = 659
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 655
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 656
                                    this.symbolPrimitive()
                                }
                            }
                            this.state = 661
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 662
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.ON:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 664
                        this.match(PartiQLParser.ON)
                        this.state = 665
                        this.match(PartiQLParser.CONSTRAINT)
                        this.state = 666
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
        this.enterRule(localContext, 86, PartiQLParser.RULE_constraintName)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 669
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
        this.enterRule(localContext, 88, PartiQLParser.RULE_conflictAction)
        try {
            this.state = 679
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 48, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 671
                        this.match(PartiQLParser.DO)
                        this.state = 672
                        this.match(PartiQLParser.NOTHING)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 673
                        this.match(PartiQLParser.DO)
                        this.state = 674
                        this.match(PartiQLParser.REPLACE)
                        this.state = 675
                        this.doReplace()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 676
                        this.match(PartiQLParser.DO)
                        this.state = 677
                        this.match(PartiQLParser.UPDATE)
                        this.state = 678
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
        this.enterRule(localContext, 90, PartiQLParser.RULE_doReplace)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 681
                this.match(PartiQLParser.EXCLUDED)
                this.state = 684
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 49, this.context)) {
                    case 1:
                        {
                            this.state = 682
                            this.match(PartiQLParser.WHERE)
                            this.state = 683
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
        this.enterRule(localContext, 92, PartiQLParser.RULE_doUpdate)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 686
                this.match(PartiQLParser.EXCLUDED)
                this.state = 689
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 50, this.context)) {
                    case 1:
                        {
                            this.state = 687
                            this.match(PartiQLParser.WHERE)
                            this.state = 688
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
        this.enterRule(localContext, 94, PartiQLParser.RULE_updateClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 691
                this.match(PartiQLParser.UPDATE)
                this.state = 692
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
        this.enterRule(localContext, 96, PartiQLParser.RULE_setCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 694
                this.match(PartiQLParser.SET)
                this.state = 695
                this.setAssignment()
                this.state = 700
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 696
                            this.match(PartiQLParser.COMMA)
                            this.state = 697
                            this.setAssignment()
                        }
                    }
                    this.state = 702
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
        this.enterRule(localContext, 98, PartiQLParser.RULE_setAssignment)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 703
                this.pathSimple()
                this.state = 704
                this.match(PartiQLParser.EQ)
                this.state = 705
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
        this.enterRule(localContext, 100, PartiQLParser.RULE_deleteCommand)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 707
                this.match(PartiQLParser.DELETE)
                this.state = 708
                this.fromClauseSimple()
                this.state = 710
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 709
                        this.whereClause()
                    }
                }

                this.state = 713
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 246) {
                    {
                        this.state = 712
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
        this.enterRule(localContext, 102, PartiQLParser.RULE_returningClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 715
                this.match(PartiQLParser.RETURNING)
                this.state = 716
                this.returningColumn()
                this.state = 721
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 717
                            this.match(PartiQLParser.COMMA)
                            this.state = 718
                            this.returningColumn()
                        }
                    }
                    this.state = 723
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
        this.enterRule(localContext, 104, PartiQLParser.RULE_returningColumn)
        let _la: number
        try {
            this.state = 730
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 55, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 724
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 725
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 726
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 727
                        localContext._status = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 247)) {
                            localContext._status = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 728
                        localContext._age = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 248 || _la === 249)) {
                            localContext._age = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 729
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
        this.enterRule(localContext, 106, PartiQLParser.RULE_fromClauseSimple)
        let _la: number
        try {
            this.state = 747
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 59, this.context)) {
                case 1:
                    localContext = new FromClauseSimpleExplicitContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 732
                        this.match(PartiQLParser.FROM)
                        this.state = 733
                        this.pathSimple()
                        this.state = 735
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 734
                                this.asIdent()
                            }
                        }

                        this.state = 738
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 13) {
                            {
                                this.state = 737
                                this.atIdent()
                            }
                        }

                        this.state = 741
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 20) {
                            {
                                this.state = 740
                                this.byIdent()
                            }
                        }
                    }
                    break
                case 2:
                    localContext = new FromClauseSimpleImplicitContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 743
                        this.match(PartiQLParser.FROM)
                        this.state = 744
                        this.pathSimple()
                        this.state = 745
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
        this.enterRule(localContext, 108, PartiQLParser.RULE_whereClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 749
                this.match(PartiQLParser.WHERE)
                this.state = 750
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
        this.enterRule(localContext, 110, PartiQLParser.RULE_selectClause)
        let _la: number
        try {
            this.state = 773
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 63, this.context)) {
                case 1:
                    localContext = new SelectAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 752
                        this.match(PartiQLParser.SELECT)
                        this.state = 754
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 753
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 756
                        this.match(PartiQLParser.ASTERISK)
                    }
                    break
                case 2:
                    localContext = new SelectItemsContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 757
                        this.match(PartiQLParser.SELECT)
                        this.state = 759
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 758
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 761
                        this.projectionItems()
                    }
                    break
                case 3:
                    localContext = new SelectValueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 762
                        this.match(PartiQLParser.SELECT)
                        this.state = 764
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 763
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 766
                        this.match(PartiQLParser.VALUE)
                        this.state = 767
                        this.expr()
                    }
                    break
                case 4:
                    localContext = new SelectPivotContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 768
                        this.match(PartiQLParser.PIVOT)
                        this.state = 769
                        ;(localContext as SelectPivotContext)._pivot = this.expr()
                        this.state = 770
                        this.match(PartiQLParser.AT)
                        this.state = 771
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
        this.enterRule(localContext, 112, PartiQLParser.RULE_projectionItems)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 775
                this.projectionItem()
                this.state = 780
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 776
                            this.match(PartiQLParser.COMMA)
                            this.state = 777
                            this.projectionItem()
                        }
                    }
                    this.state = 782
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
        this.enterRule(localContext, 114, PartiQLParser.RULE_projectionItem)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 783
                this.expr()
                this.state = 788
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 10 || _la === 304 || _la === 305) {
                    {
                        this.state = 785
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 10) {
                            {
                                this.state = 784
                                this.match(PartiQLParser.AS)
                            }
                        }

                        this.state = 787
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
        this.enterRule(localContext, 116, PartiQLParser.RULE_setQuantifierStrategy)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 790
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
        this.enterRule(localContext, 118, PartiQLParser.RULE_letClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 792
                this.match(PartiQLParser.LET)
                this.state = 793
                this.letBinding()
                this.state = 798
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 67, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 794
                                this.match(PartiQLParser.COMMA)
                                this.state = 795
                                this.letBinding()
                            }
                        }
                    }
                    this.state = 800
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 67, this.context)
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
        this.enterRule(localContext, 120, PartiQLParser.RULE_letBinding)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 801
                this.expr()
                this.state = 802
                this.match(PartiQLParser.AS)
                this.state = 803
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
        this.enterRule(localContext, 122, PartiQLParser.RULE_orderByClause)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 805
                this.match(PartiQLParser.ORDER)
                this.state = 806
                this.match(PartiQLParser.BY)
                this.state = 807
                this.orderSortSpec()
                this.state = 812
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 68, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 808
                                this.match(PartiQLParser.COMMA)
                                this.state = 809
                                this.orderSortSpec()
                            }
                        }
                    }
                    this.state = 814
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 68, this.context)
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
        this.enterRule(localContext, 124, PartiQLParser.RULE_orderSortSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 815
                this.expr()
                this.state = 817
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 69, this.context)) {
                    case 1:
                        {
                            this.state = 816
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
                this.state = 821
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 70, this.context)) {
                    case 1:
                        {
                            this.state = 819
                            this.match(PartiQLParser.NULLS)
                            this.state = 820
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
        this.enterRule(localContext, 126, PartiQLParser.RULE_groupClause)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 823
                this.match(PartiQLParser.GROUP)
                this.state = 825
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 158) {
                    {
                        this.state = 824
                        this.match(PartiQLParser.PARTIAL)
                    }
                }

                this.state = 827
                this.match(PartiQLParser.BY)
                this.state = 828
                this.groupKey()
                this.state = 833
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 72, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 829
                                this.match(PartiQLParser.COMMA)
                                this.state = 830
                                this.groupKey()
                            }
                        }
                    }
                    this.state = 835
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 72, this.context)
                }
                this.state = 837
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 73, this.context)) {
                    case 1:
                        {
                            this.state = 836
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
        this.enterRule(localContext, 128, PartiQLParser.RULE_groupAlias)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 839
                this.match(PartiQLParser.GROUP)
                this.state = 840
                this.match(PartiQLParser.AS)
                this.state = 841
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
        this.enterRule(localContext, 130, PartiQLParser.RULE_groupKey)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 843
                localContext._key = this.exprSelect()
                this.state = 846
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 74, this.context)) {
                    case 1:
                        {
                            this.state = 844
                            this.match(PartiQLParser.AS)
                            this.state = 845
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
        this.enterRule(localContext, 132, PartiQLParser.RULE_over)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 848
                this.match(PartiQLParser.OVER)
                this.state = 849
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 851
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 233) {
                    {
                        this.state = 850
                        this.windowPartitionList()
                    }
                }

                this.state = 854
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 152) {
                    {
                        this.state = 853
                        this.windowSortSpecList()
                    }
                }

                this.state = 856
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
        this.enterRule(localContext, 134, PartiQLParser.RULE_windowPartitionList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 858
                this.match(PartiQLParser.PARTITION)
                this.state = 859
                this.match(PartiQLParser.BY)
                this.state = 860
                this.expr()
                this.state = 865
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 861
                            this.match(PartiQLParser.COMMA)
                            this.state = 862
                            this.expr()
                        }
                    }
                    this.state = 867
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
        this.enterRule(localContext, 136, PartiQLParser.RULE_windowSortSpecList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 868
                this.match(PartiQLParser.ORDER)
                this.state = 869
                this.match(PartiQLParser.BY)
                this.state = 870
                this.orderSortSpec()
                this.state = 875
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 871
                            this.match(PartiQLParser.COMMA)
                            this.state = 872
                            this.orderSortSpec()
                        }
                    }
                    this.state = 877
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
        this.enterRule(localContext, 138, PartiQLParser.RULE_havingClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 878
                this.match(PartiQLParser.HAVING)
                this.state = 879
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
        this.enterRule(localContext, 140, PartiQLParser.RULE_excludeClause)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 881
                this.match(PartiQLParser.EXCLUDE)
                this.state = 882
                this.excludeExpr()
                this.state = 887
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 883
                            this.match(PartiQLParser.COMMA)
                            this.state = 884
                            this.excludeExpr()
                        }
                    }
                    this.state = 889
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
        this.enterRule(localContext, 142, PartiQLParser.RULE_excludeExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 890
                this.symbolPrimitive()
                this.state = 892
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 891
                            this.excludeExprSteps()
                        }
                    }
                    this.state = 894
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 291 || _la === 300)
            }
        } catch (re) {
            if (re instanceof antlr.RecognitionException) {
                this.errorHandler.reportError(this, re)
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
        this.enterRule(localContext, 144, PartiQLParser.RULE_excludeExprSteps)
        try {
            this.state = 909
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 81, this.context)) {
                case 1:
                    localContext = new ExcludeExprTupleAttrContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 896
                        this.match(PartiQLParser.PERIOD)
                        this.state = 897
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new ExcludeExprCollectionAttrContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 898
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 899
                        ;(localContext as ExcludeExprCollectionAttrContext)._attr = this.match(
                            PartiQLParser.LITERAL_STRING
                        )
                        this.state = 900
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new ExcludeExprCollectionIndexContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 901
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 902
                        ;(localContext as ExcludeExprCollectionIndexContext)._index = this.match(
                            PartiQLParser.LITERAL_INTEGER
                        )
                        this.state = 903
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 4:
                    localContext = new ExcludeExprCollectionWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 904
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 905
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 906
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 5:
                    localContext = new ExcludeExprTupleWildcardContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 907
                        this.match(PartiQLParser.PERIOD)
                        this.state = 908
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
        this.enterRule(localContext, 146, PartiQLParser.RULE_fromClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 911
                this.match(PartiQLParser.FROM)
                this.state = 912
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
        this.enterRule(localContext, 148, PartiQLParser.RULE_whereClauseSelect)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 914
                this.match(PartiQLParser.WHERE)
                this.state = 915
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
        this.enterRule(localContext, 150, PartiQLParser.RULE_offsetByClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 917
                this.match(PartiQLParser.OFFSET)
                this.state = 918
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
        this.enterRule(localContext, 152, PartiQLParser.RULE_limitClause)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 920
                this.match(PartiQLParser.LIMIT)
                this.state = 921
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
        this.enterRule(localContext, 154, PartiQLParser.RULE_gpmlPattern)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 924
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 82, this.context)) {
                    case 1:
                        {
                            this.state = 923
                            localContext._selector = this.matchSelector()
                        }
                        break
                }
                this.state = 926
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
        this.enterRule(localContext, 156, PartiQLParser.RULE_gpmlPatternList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 929
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 4 || _la === 8 || _la === 186) {
                    {
                        this.state = 928
                        localContext._selector = this.matchSelector()
                    }
                }

                this.state = 931
                this.matchPattern()
                this.state = 936
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 932
                            this.match(PartiQLParser.COMMA)
                            this.state = 933
                            this.matchPattern()
                        }
                    }
                    this.state = 938
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
        this.enterRule(localContext, 158, PartiQLParser.RULE_matchPattern)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 940
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 85, this.context)) {
                    case 1:
                        {
                            this.state = 939
                            localContext._restrictor = this.patternRestrictor()
                        }
                        break
                }
                this.state = 943
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 86, this.context)) {
                    case 1:
                        {
                            this.state = 942
                            localContext._variable = this.patternPathVariable()
                        }
                        break
                }
                this.state = 948
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 87, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 945
                                this.graphPart()
                            }
                        }
                    }
                    this.state = 950
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 87, this.context)
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
        this.enterRule(localContext, 160, PartiQLParser.RULE_graphPart)
        try {
            this.state = 954
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 88, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 951
                        this.node()
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 952
                        this.edge()
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 953
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
        this.enterRule(localContext, 162, PartiQLParser.RULE_matchSelector)
        let _la: number
        try {
            this.state = 967
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 91, this.context)) {
                case 1:
                    localContext = new SelectorBasicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 956
                        ;(localContext as SelectorBasicContext)._mod = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 4 || _la === 8)) {
                            ;(localContext as SelectorBasicContext)._mod = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 957
                        this.match(PartiQLParser.SHORTEST)
                    }
                    break
                case 2:
                    localContext = new SelectorAnyContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 958
                        this.match(PartiQLParser.ANY)
                        this.state = 960
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 89, this.context)) {
                            case 1:
                                {
                                    this.state = 959
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
                        this.state = 962
                        this.match(PartiQLParser.SHORTEST)
                        this.state = 963
                        ;(localContext as SelectorShortestContext)._k = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 965
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 90, this.context)) {
                            case 1:
                                {
                                    this.state = 964
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
        this.enterRule(localContext, 164, PartiQLParser.RULE_patternPathVariable)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 969
                this.symbolPrimitive()
                this.state = 970
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
        this.enterRule(localContext, 166, PartiQLParser.RULE_patternRestrictor)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 972
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
        this.enterRule(localContext, 168, PartiQLParser.RULE_node)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 974
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 976
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 304 || _la === 305) {
                    {
                        this.state = 975
                        this.symbolPrimitive()
                    }
                }

                this.state = 980
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 297) {
                    {
                        this.state = 978
                        this.match(PartiQLParser.COLON)
                        this.state = 979
                        this.labelSpec(0)
                    }
                }

                this.state = 983
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 982
                        this.whereClause()
                    }
                }

                this.state = 985
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
        this.enterRule(localContext, 170, PartiQLParser.RULE_edge)
        try {
            this.state = 995
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 97, this.context)) {
                case 1:
                    localContext = new EdgeWithSpecContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 987
                        this.edgeWSpec()
                        this.state = 989
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 95, this.context)) {
                            case 1:
                                {
                                    this.state = 988
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
                        this.state = 991
                        this.edgeAbbrev()
                        this.state = 993
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 96, this.context)) {
                            case 1:
                                {
                                    this.state = 992
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
        this.enterRule(localContext, 172, PartiQLParser.RULE_pattern)
        let _la: number
        try {
            this.state = 1035
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 997
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 999
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 98, this.context)) {
                            case 1:
                                {
                                    this.state = 998
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 1002
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 304 || _la === 305) {
                            {
                                this.state = 1001
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 1005
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 1004
                                    this.graphPart()
                                }
                            }
                            this.state = 1007
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 273) & ~0x1f) === 0 && ((1 << (_la - 273)) & 4472849) !== 0)
                        this.state = 1010
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 1009
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 1012
                        this.match(PartiQLParser.PAREN_RIGHT)
                        this.state = 1014
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 102, this.context)) {
                            case 1:
                                {
                                    this.state = 1013
                                    localContext._quantifier = this.patternQuantifier()
                                }
                                break
                        }
                    }
                    break
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1016
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1018
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 103, this.context)) {
                            case 1:
                                {
                                    this.state = 1017
                                    localContext._restrictor = this.patternRestrictor()
                                }
                                break
                        }
                        this.state = 1021
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 304 || _la === 305) {
                            {
                                this.state = 1020
                                localContext._variable = this.patternPathVariable()
                            }
                        }

                        this.state = 1024
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        do {
                            {
                                {
                                    this.state = 1023
                                    this.graphPart()
                                }
                            }
                            this.state = 1026
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        } while (((_la - 273) & ~0x1f) === 0 && ((1 << (_la - 273)) & 4472849) !== 0)
                        this.state = 1029
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 225) {
                            {
                                this.state = 1028
                                localContext._where = this.whereClause()
                            }
                        }

                        this.state = 1031
                        this.match(PartiQLParser.BRACKET_RIGHT)
                        this.state = 1033
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 107, this.context)) {
                            case 1:
                                {
                                    this.state = 1032
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
        this.enterRule(localContext, 174, PartiQLParser.RULE_patternQuantifier)
        let _la: number
        try {
            this.state = 1045
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.ASTERISK:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1037
                        localContext._quant = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 272 || _la === 278)) {
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
                        this.state = 1038
                        this.match(PartiQLParser.BRACE_LEFT)
                        this.state = 1039
                        localContext._lower = this.match(PartiQLParser.LITERAL_INTEGER)
                        this.state = 1040
                        this.match(PartiQLParser.COMMA)
                        this.state = 1042
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 302) {
                            {
                                this.state = 1041
                                localContext._upper = this.match(PartiQLParser.LITERAL_INTEGER)
                            }
                        }

                        this.state = 1044
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
        this.enterRule(localContext, 176, PartiQLParser.RULE_edgeWSpec)
        try {
            this.state = 1081
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 111, this.context)) {
                case 1:
                    localContext = new EdgeSpecRightContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1047
                        this.match(PartiQLParser.MINUS)
                        this.state = 1048
                        this.edgeSpec()
                        this.state = 1049
                        this.match(PartiQLParser.MINUS)
                        this.state = 1050
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 2:
                    localContext = new EdgeSpecUndirectedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1052
                        this.match(PartiQLParser.TILDE)
                        this.state = 1053
                        this.edgeSpec()
                        this.state = 1054
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 3:
                    localContext = new EdgeSpecLeftContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1056
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1057
                        this.match(PartiQLParser.MINUS)
                        this.state = 1058
                        this.edgeSpec()
                        this.state = 1059
                        this.match(PartiQLParser.MINUS)
                    }
                    break
                case 4:
                    localContext = new EdgeSpecUndirectedRightContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1061
                        this.match(PartiQLParser.TILDE)
                        this.state = 1062
                        this.edgeSpec()
                        this.state = 1063
                        this.match(PartiQLParser.TILDE)
                        this.state = 1064
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 5:
                    localContext = new EdgeSpecUndirectedLeftContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1066
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1067
                        this.match(PartiQLParser.TILDE)
                        this.state = 1068
                        this.edgeSpec()
                        this.state = 1069
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 6:
                    localContext = new EdgeSpecBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1071
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1072
                        this.match(PartiQLParser.MINUS)
                        this.state = 1073
                        this.edgeSpec()
                        this.state = 1074
                        this.match(PartiQLParser.MINUS)
                        this.state = 1075
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 7:
                    localContext = new EdgeSpecUndirectedBidirectionalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1077
                        this.match(PartiQLParser.MINUS)
                        this.state = 1078
                        this.edgeSpec()
                        this.state = 1079
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
        this.enterRule(localContext, 178, PartiQLParser.RULE_edgeSpec)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1083
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1085
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 304 || _la === 305) {
                    {
                        this.state = 1084
                        this.symbolPrimitive()
                    }
                }

                this.state = 1089
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 297) {
                    {
                        this.state = 1087
                        this.match(PartiQLParser.COLON)
                        this.state = 1088
                        this.labelSpec(0)
                    }
                }

                this.state = 1092
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 225) {
                    {
                        this.state = 1091
                        this.whereClause()
                    }
                }

                this.state = 1094
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
        let _startState = 180
        this.enterRecursionRule(localContext, 180, PartiQLParser.RULE_labelSpec, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelSpecTermContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1097
                    this.labelTerm(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1104
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 115, this.context)
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
                                this.state = 1099
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1100
                                this.match(PartiQLParser.VERTBAR)
                                this.state = 1101
                                this.labelTerm(0)
                            }
                        }
                    }
                    this.state = 1106
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 115, this.context)
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
        let _startState = 182
        this.enterRecursionRule(localContext, 182, PartiQLParser.RULE_labelTerm, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new LabelTermFactorContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1108
                    this.labelFactor()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1115
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 116, this.context)
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
                                this.state = 1110
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1111
                                this.match(PartiQLParser.AMPERSAND)
                                this.state = 1112
                                this.labelFactor()
                            }
                        }
                    }
                    this.state = 1117
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 116, this.context)
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
        this.enterRule(localContext, 184, PartiQLParser.RULE_labelFactor)
        try {
            this.state = 1121
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BANG:
                    localContext = new LabelFactorNotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1118
                        this.match(PartiQLParser.BANG)
                        this.state = 1119
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
                        this.state = 1120
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
        this.enterRule(localContext, 186, PartiQLParser.RULE_labelPrimary)
        try {
            this.state = 1129
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.IDENTIFIER:
                case PartiQLParser.IDENTIFIER_QUOTED:
                    localContext = new LabelPrimaryNameContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1123
                        this.symbolPrimitive()
                    }
                    break
                case PartiQLParser.PERCENT:
                    localContext = new LabelPrimaryWildContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1124
                        this.match(PartiQLParser.PERCENT)
                    }
                    break
                case PartiQLParser.PAREN_LEFT:
                    localContext = new LabelPrimaryParenContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1125
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1126
                        this.labelSpec(0)
                        this.state = 1127
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
        this.enterRule(localContext, 188, PartiQLParser.RULE_edgeAbbrev)
        let _la: number
        try {
            this.state = 1143
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 121, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1131
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1132
                        this.match(PartiQLParser.TILDE)
                        this.state = 1133
                        this.match(PartiQLParser.ANGLE_RIGHT)
                    }
                    break
                case 3:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1134
                        this.match(PartiQLParser.ANGLE_LEFT)
                        this.state = 1135
                        this.match(PartiQLParser.TILDE)
                    }
                    break
                case 4:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1137
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 287) {
                            {
                                this.state = 1136
                                this.match(PartiQLParser.ANGLE_LEFT)
                            }
                        }

                        this.state = 1139
                        this.match(PartiQLParser.MINUS)
                        this.state = 1141
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 120, this.context)) {
                            case 1:
                                {
                                    this.state = 1140
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
        let _startState = 190
        this.enterRecursionRule(localContext, 190, PartiQLParser.RULE_tableReference, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1151
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 122, this.context)) {
                    case 1:
                        {
                            localContext = new TableRefBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1146
                            this.tableNonJoin()
                        }
                        break
                    case 2:
                        {
                            localContext = new TableWrappedContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1147
                            this.match(PartiQLParser.PAREN_LEFT)
                            this.state = 1148
                            this.tableReference(0)
                            this.state = 1149
                            this.match(PartiQLParser.PAREN_RIGHT)
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1173
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 126, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1171
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 125, this.context)) {
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
                                        this.state = 1153
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1155
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1154
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1157
                                        this.match(PartiQLParser.CROSS)
                                        this.state = 1158
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1159
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
                                        this.state = 1160
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1161
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1162
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
                                        this.state = 1163
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1165
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (
                                            (((_la - 96) & ~0x1f) === 0 && ((1 << (_la - 96)) & 536879105) !== 0) ||
                                            _la === 153 ||
                                            _la === 176
                                        ) {
                                            {
                                                this.state = 1164
                                                this.joinType()
                                            }
                                        }

                                        this.state = 1167
                                        this.match(PartiQLParser.JOIN)
                                        this.state = 1168
                                        ;(localContext as TableQualifiedJoinContext)._rhs = this.joinRhs()
                                        this.state = 1169
                                        this.joinSpec()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1175
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 126, this.context)
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
        this.enterRule(localContext, 192, PartiQLParser.RULE_tableNonJoin)
        try {
            this.state = 1178
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
                        this.state = 1176
                        this.tableBaseReference()
                    }
                    break
                case PartiQLParser.UNPIVOT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1177
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
        this.enterRule(localContext, 194, PartiQLParser.RULE_tableBaseReference)
        try {
            this.state = 1203
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 134, this.context)) {
                case 1:
                    localContext = new TableBaseRefSymbolContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1180
                        ;(localContext as TableBaseRefSymbolContext)._source = this.exprSelect()
                        this.state = 1181
                        this.symbolPrimitive()
                    }
                    break
                case 2:
                    localContext = new TableBaseRefClausesContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1183
                        ;(localContext as TableBaseRefClausesContext)._source = this.exprSelect()
                        this.state = 1185
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 128, this.context)) {
                            case 1:
                                {
                                    this.state = 1184
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1188
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 129, this.context)) {
                            case 1:
                                {
                                    this.state = 1187
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1191
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 130, this.context)) {
                            case 1:
                                {
                                    this.state = 1190
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
                        this.state = 1193
                        ;(localContext as TableBaseRefMatchContext)._source = this.exprGraphMatchOne()
                        this.state = 1195
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 131, this.context)) {
                            case 1:
                                {
                                    this.state = 1194
                                    this.asIdent()
                                }
                                break
                        }
                        this.state = 1198
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 132, this.context)) {
                            case 1:
                                {
                                    this.state = 1197
                                    this.atIdent()
                                }
                                break
                        }
                        this.state = 1201
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 133, this.context)) {
                            case 1:
                                {
                                    this.state = 1200
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
        this.enterRule(localContext, 196, PartiQLParser.RULE_tableUnpivot)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1205
                this.match(PartiQLParser.UNPIVOT)
                this.state = 1206
                this.expr()
                this.state = 1208
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 135, this.context)) {
                    case 1:
                        {
                            this.state = 1207
                            this.asIdent()
                        }
                        break
                }
                this.state = 1211
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 136, this.context)) {
                    case 1:
                        {
                            this.state = 1210
                            this.atIdent()
                        }
                        break
                }
                this.state = 1214
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 137, this.context)) {
                    case 1:
                        {
                            this.state = 1213
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
        this.enterRule(localContext, 198, PartiQLParser.RULE_joinRhs)
        try {
            this.state = 1221
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 138, this.context)) {
                case 1:
                    localContext = new JoinRhsBaseContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1216
                        this.tableNonJoin()
                    }
                    break
                case 2:
                    localContext = new JoinRhsTableJoinedContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1217
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1218
                        this.tableReference(0)
                        this.state = 1219
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
        this.enterRule(localContext, 200, PartiQLParser.RULE_joinSpec)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1223
                this.match(PartiQLParser.ON)
                this.state = 1224
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
        this.enterRule(localContext, 202, PartiQLParser.RULE_joinType)
        let _la: number
        try {
            this.state = 1240
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.INNER:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1226
                        localContext._mod = this.match(PartiQLParser.INNER)
                    }
                    break
                case PartiQLParser.LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1227
                        localContext._mod = this.match(PartiQLParser.LEFT)
                        this.state = 1229
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1228
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.RIGHT:
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1231
                        localContext._mod = this.match(PartiQLParser.RIGHT)
                        this.state = 1233
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1232
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.FULL:
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1235
                        localContext._mod = this.match(PartiQLParser.FULL)
                        this.state = 1237
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 153) {
                            {
                                this.state = 1236
                                this.match(PartiQLParser.OUTER)
                            }
                        }
                    }
                    break
                case PartiQLParser.OUTER:
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1239
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
        this.enterRule(localContext, 204, PartiQLParser.RULE_expr)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1242
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
        let _startState = 206
        this.enterRecursionRule(localContext, 206, PartiQLParser.RULE_exprBagOp, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new QueryBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1245
                    this.exprSelect()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1276
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 150, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1274
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 149, this.context)) {
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
                                        this.state = 1247
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1249
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1248
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1251
                                        this.match(PartiQLParser.EXCEPT)
                                        this.state = 1253
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1252
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1255
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
                                        this.state = 1256
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1258
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1257
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1260
                                        this.match(PartiQLParser.UNION)
                                        this.state = 1262
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1261
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1264
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
                                        this.state = 1265
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1267
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 153) {
                                            {
                                                this.state = 1266
                                                this.match(PartiQLParser.OUTER)
                                            }
                                        }

                                        this.state = 1269
                                        this.match(PartiQLParser.INTERSECT)
                                        this.state = 1271
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 4 || _la === 67) {
                                            {
                                                this.state = 1270
                                                _la = this.tokenStream.LA(1)
                                                if (!(_la === 4 || _la === 67)) {
                                                    this.errorHandler.recoverInline(this)
                                                } else {
                                                    this.errorHandler.reportMatch(this)
                                                    this.consume()
                                                }
                                            }
                                        }

                                        this.state = 1273
                                        ;(localContext as IntersectContext)._rhs = this.exprSelect()
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1278
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 150, this.context)
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
        this.enterRule(localContext, 208, PartiQLParser.RULE_exprSelect)
        let _la: number
        try {
            this.state = 1306
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.SELECT:
                case PartiQLParser.PIVOT:
                    localContext = new SfwQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1279
                        ;(localContext as SfwQueryContext)._select = this.selectClause()
                        this.state = 1281
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 78) {
                            {
                                this.state = 1280
                                ;(localContext as SfwQueryContext)._exclude = this.excludeClause()
                            }
                        }

                        this.state = 1283
                        ;(localContext as SfwQueryContext)._from_ = this.fromClause()
                        this.state = 1285
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 152, this.context)) {
                            case 1:
                                {
                                    this.state = 1284
                                    ;(localContext as SfwQueryContext)._let_ = this.letClause()
                                }
                                break
                        }
                        this.state = 1288
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 153, this.context)) {
                            case 1:
                                {
                                    this.state = 1287
                                    ;(localContext as SfwQueryContext)._where = this.whereClauseSelect()
                                }
                                break
                        }
                        this.state = 1291
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 154, this.context)) {
                            case 1:
                                {
                                    this.state = 1290
                                    ;(localContext as SfwQueryContext)._group = this.groupClause()
                                }
                                break
                        }
                        this.state = 1294
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 155, this.context)) {
                            case 1:
                                {
                                    this.state = 1293
                                    ;(localContext as SfwQueryContext)._having = this.havingClause()
                                }
                                break
                        }
                        this.state = 1297
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 156, this.context)) {
                            case 1:
                                {
                                    this.state = 1296
                                    ;(localContext as SfwQueryContext)._order = this.orderByClause()
                                }
                                break
                        }
                        this.state = 1300
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 157, this.context)) {
                            case 1:
                                {
                                    this.state = 1299
                                    ;(localContext as SfwQueryContext)._limit = this.limitClause()
                                }
                                break
                        }
                        this.state = 1303
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 158, this.context)) {
                            case 1:
                                {
                                    this.state = 1302
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
                        this.state = 1305
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
        let _startState = 210
        this.enterRecursionRule(localContext, 210, PartiQLParser.RULE_exprOr, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprOrBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1309
                    ;(localContext as ExprOrBaseContext)._parent = this.exprAnd(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1316
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 160, this.context)
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
                                this.state = 1311
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1312
                                this.match(PartiQLParser.OR)
                                this.state = 1313
                                ;(localContext as OrContext)._rhs = this.exprAnd(0)
                            }
                        }
                    }
                    this.state = 1318
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 160, this.context)
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
        let _startState = 212
        this.enterRecursionRule(localContext, 212, PartiQLParser.RULE_exprAnd, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new ExprAndBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1320
                    ;(localContext as ExprAndBaseContext)._parent = this.exprNot()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1327
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 161, this.context)
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
                                this.state = 1322
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1323
                                ;(localContext as AndContext)._op = this.match(PartiQLParser.AND)
                                this.state = 1324
                                ;(localContext as AndContext)._rhs = this.exprNot()
                            }
                        }
                    }
                    this.state = 1329
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 161, this.context)
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
        this.enterRule(localContext, 214, PartiQLParser.RULE_exprNot)
        try {
            this.state = 1333
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NOT:
                    localContext = new NotContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1330
                        ;(localContext as NotContext)._op = this.match(PartiQLParser.NOT)
                        this.state = 1331
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
                        this.state = 1332
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
        let _startState = 216
        this.enterRecursionRule(localContext, 216, PartiQLParser.RULE_exprPredicate, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    localContext = new PredicateBaseContext(localContext)
                    this.context = localContext
                    previousContext = localContext

                    this.state = 1336
                    ;(localContext as PredicateBaseContext)._parent = this.mathOp00(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1383
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 170, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        if (this.parseListeners != null) {
                            this.triggerExitRuleEvent()
                        }
                        previousContext = localContext
                        {
                            this.state = 1381
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 169, this.context)) {
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
                                        this.state = 1338
                                        if (!this.precpred(this.context, 7)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 7)')
                                        }
                                        this.state = 1339
                                        ;(localContext as PredicateComparisonContext)._op = this.tokenStream.LT(1)
                                        _la = this.tokenStream.LA(1)
                                        if (!(((_la - 282) & ~0x1f) === 0 && ((1 << (_la - 282)) & 111) !== 0)) {
                                            ;(localContext as PredicateComparisonContext)._op =
                                                this.errorHandler.recoverInline(this)
                                        } else {
                                            this.errorHandler.reportMatch(this)
                                            this.consume()
                                        }
                                        this.state = 1340
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
                                        this.state = 1341
                                        if (!this.precpred(this.context, 6)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                        }
                                        this.state = 1342
                                        this.match(PartiQLParser.IS)
                                        this.state = 1344
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1343
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1346
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
                                        this.state = 1347
                                        if (!this.precpred(this.context, 5)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 5)')
                                        }
                                        this.state = 1349
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1348
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1351
                                        this.match(PartiQLParser.IN)
                                        this.state = 1352
                                        this.match(PartiQLParser.PAREN_LEFT)
                                        this.state = 1353
                                        this.expr()
                                        this.state = 1354
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
                                        this.state = 1356
                                        if (!this.precpred(this.context, 4)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 4)')
                                        }
                                        this.state = 1358
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1357
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1360
                                        this.match(PartiQLParser.IN)
                                        this.state = 1361
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
                                        this.state = 1362
                                        if (!this.precpred(this.context, 3)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 3)')
                                        }
                                        this.state = 1364
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1363
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1366
                                        this.match(PartiQLParser.LIKE)
                                        this.state = 1367
                                        ;(localContext as PredicateLikeContext)._rhs = this.mathOp00(0)
                                        this.state = 1370
                                        this.errorHandler.sync(this)
                                        switch (this.interpreter.adaptivePredict(this.tokenStream, 167, this.context)) {
                                            case 1:
                                                {
                                                    this.state = 1368
                                                    this.match(PartiQLParser.ESCAPE)
                                                    this.state = 1369
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
                                        this.state = 1372
                                        if (!this.precpred(this.context, 2)) {
                                            throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                        }
                                        this.state = 1374
                                        this.errorHandler.sync(this)
                                        _la = this.tokenStream.LA(1)
                                        if (_la === 140) {
                                            {
                                                this.state = 1373
                                                this.match(PartiQLParser.NOT)
                                            }
                                        }

                                        this.state = 1376
                                        this.match(PartiQLParser.BETWEEN)
                                        this.state = 1377
                                        ;(localContext as PredicateBetweenContext)._lower = this.mathOp00(0)
                                        this.state = 1378
                                        this.match(PartiQLParser.AND)
                                        this.state = 1379
                                        ;(localContext as PredicateBetweenContext)._upper = this.mathOp00(0)
                                    }
                                    break
                            }
                        }
                    }
                    this.state = 1385
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 170, this.context)
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
        let _startState = 218
        this.enterRecursionRule(localContext, 218, PartiQLParser.RULE_mathOp00, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1387
                    localContext._parent = this.mathOp01(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1394
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
                                localContext = new MathOp00Context(parentContext, parentState)
                                localContext._lhs = previousContext
                                this.pushNewRecursionContext(localContext, _startState, PartiQLParser.RULE_mathOp00)
                                this.state = 1389
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1390
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 280 || _la === 286)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1391
                                localContext._rhs = this.mathOp01(0)
                            }
                        }
                    }
                    this.state = 1396
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
        let _startState = 220
        this.enterRecursionRule(localContext, 220, PartiQLParser.RULE_mathOp01, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1398
                    localContext._parent = this.mathOp02(0)
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1405
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 172, this.context)
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
                                this.state = 1400
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1401
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(_la === 272 || _la === 273)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1402
                                localContext._rhs = this.mathOp02(0)
                            }
                        }
                    }
                    this.state = 1407
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 172, this.context)
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
        let _startState = 222
        this.enterRecursionRule(localContext, 222, PartiQLParser.RULE_mathOp02, _p)
        let _la: number
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                {
                    this.state = 1409
                    localContext._parent = this.valueExpr()
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1416
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 173, this.context)
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
                                this.state = 1411
                                if (!this.precpred(this.context, 2)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 2)')
                                }
                                this.state = 1412
                                localContext._op = this.tokenStream.LT(1)
                                _la = this.tokenStream.LA(1)
                                if (!(((_la - 274) & ~0x1f) === 0 && ((1 << (_la - 274)) & 19) !== 0)) {
                                    localContext._op = this.errorHandler.recoverInline(this)
                                } else {
                                    this.errorHandler.reportMatch(this)
                                    this.consume()
                                }
                                this.state = 1413
                                localContext._rhs = this.valueExpr()
                            }
                        }
                    }
                    this.state = 1418
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 173, this.context)
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
        this.enterRule(localContext, 224, PartiQLParser.RULE_valueExpr)
        let _la: number
        try {
            this.state = 1422
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PLUS:
                case PartiQLParser.MINUS:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1419
                        localContext._sign = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 272 || _la === 273)) {
                            localContext._sign = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1420
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
                        this.state = 1421
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
        let _startState = 226
        this.enterRecursionRule(localContext, 226, PartiQLParser.RULE_exprPrimary, _p)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1445
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 175, this.context)) {
                    case 1:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext

                            this.state = 1425
                            this.exprTerm()
                        }
                        break
                    case 2:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1426
                            this.cast()
                        }
                        break
                    case 3:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1427
                            this.sequenceConstructor()
                        }
                        break
                    case 4:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1428
                            this.substring()
                        }
                        break
                    case 5:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1429
                            this.position()
                        }
                        break
                    case 6:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1430
                            this.overlay()
                        }
                        break
                    case 7:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1431
                            this.canCast()
                        }
                        break
                    case 8:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1432
                            this.canLosslessCast()
                        }
                        break
                    case 9:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1433
                            this.extract()
                        }
                        break
                    case 10:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1434
                            this.coalesce()
                        }
                        break
                    case 11:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1435
                            this.dateFunction()
                        }
                        break
                    case 12:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1436
                            this.aggregate()
                        }
                        break
                    case 13:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1437
                            this.trimFunction()
                        }
                        break
                    case 14:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1438
                            this.functionCall()
                        }
                        break
                    case 15:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1439
                            this.nullIf()
                        }
                        break
                    case 16:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1440
                            this.exprGraphMatchMany()
                        }
                        break
                    case 17:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1441
                            this.caseExpr()
                        }
                        break
                    case 18:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1442
                            this.valueList()
                        }
                        break
                    case 19:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1443
                            this.values()
                        }
                        break
                    case 20:
                        {
                            localContext = new ExprPrimaryBaseContext(localContext)
                            this.context = localContext
                            previousContext = localContext
                            this.state = 1444
                            this.windowFunction()
                        }
                        break
                }
                this.context!.stop = this.tokenStream.LT(-1)
                this.state = 1455
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 177, this.context)
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
                                this.state = 1447
                                if (!this.precpred(this.context, 6)) {
                                    throw this.createFailedPredicateException('this.precpred(this.context, 6)')
                                }
                                this.state = 1449
                                this.errorHandler.sync(this)
                                alternative = 1
                                do {
                                    switch (alternative) {
                                        case 1:
                                            {
                                                {
                                                    this.state = 1448
                                                    this.pathStep()
                                                }
                                            }
                                            break
                                        default:
                                            throw new antlr.NoViableAltException(this)
                                    }
                                    this.state = 1451
                                    this.errorHandler.sync(this)
                                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 176, this.context)
                                } while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER)
                            }
                        }
                    }
                    this.state = 1457
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
            this.unrollRecursionContexts(parentContext)
        }
        return localContext
    }
    public exprTerm(): ExprTermContext {
        let localContext = new ExprTermContext(this.context, this.state)
        this.enterRule(localContext, 228, PartiQLParser.RULE_exprTerm)
        try {
            this.state = 1469
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.PAREN_LEFT:
                    localContext = new ExprTermWrappedQueryContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1458
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1459
                        this.expr()
                        this.state = 1460
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case PartiQLParser.CURRENT_USER:
                    localContext = new ExprTermCurrentUserContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1462
                        this.match(PartiQLParser.CURRENT_USER)
                    }
                    break
                case PartiQLParser.CURRENT_DATE:
                    localContext = new ExprTermCurrentDateContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1463
                        this.match(PartiQLParser.CURRENT_DATE)
                    }
                    break
                case PartiQLParser.QUESTION_MARK:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1464
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
                        this.state = 1465
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
                        this.state = 1466
                        this.literal()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                case PartiQLParser.BRACKET_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1467
                        this.collection()
                    }
                    break
                case PartiQLParser.BRACE_LEFT:
                    localContext = new ExprTermBaseContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1468
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
        this.enterRule(localContext, 230, PartiQLParser.RULE_nullIf)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1471
                this.match(PartiQLParser.NULLIF)
                this.state = 1472
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1473
                this.expr()
                this.state = 1474
                this.match(PartiQLParser.COMMA)
                this.state = 1475
                this.expr()
                this.state = 1476
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
        this.enterRule(localContext, 232, PartiQLParser.RULE_coalesce)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1478
                this.match(PartiQLParser.COALESCE)
                this.state = 1479
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1480
                this.expr()
                this.state = 1485
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 1481
                            this.match(PartiQLParser.COMMA)
                            this.state = 1482
                            this.expr()
                        }
                    }
                    this.state = 1487
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1488
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
        this.enterRule(localContext, 234, PartiQLParser.RULE_caseExpr)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1490
                this.match(PartiQLParser.CASE)
                this.state = 1492
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1491
                        localContext._case_ = this.expr()
                    }
                }

                this.state = 1499
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1494
                            this.match(PartiQLParser.WHEN)
                            this.state = 1495
                            localContext._expr = this.expr()
                            localContext._whens.push(localContext._expr!)
                            this.state = 1496
                            this.match(PartiQLParser.THEN)
                            this.state = 1497
                            localContext._expr = this.expr()
                            localContext._thens.push(localContext._expr!)
                        }
                    }
                    this.state = 1501
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 223)
                this.state = 1505
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 71) {
                    {
                        this.state = 1503
                        this.match(PartiQLParser.ELSE)
                        this.state = 1504
                        localContext._else_ = this.expr()
                    }
                }

                this.state = 1507
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
        this.enterRule(localContext, 236, PartiQLParser.RULE_values)
        try {
            let alternative: number
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1509
                this.match(PartiQLParser.VALUES)
                this.state = 1510
                this.valueRow()
                this.state = 1515
                this.errorHandler.sync(this)
                alternative = this.interpreter.adaptivePredict(this.tokenStream, 183, this.context)
                while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                    if (alternative === 1) {
                        {
                            {
                                this.state = 1511
                                this.match(PartiQLParser.COMMA)
                                this.state = 1512
                                this.valueRow()
                            }
                        }
                    }
                    this.state = 1517
                    this.errorHandler.sync(this)
                    alternative = this.interpreter.adaptivePredict(this.tokenStream, 183, this.context)
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
        this.enterRule(localContext, 238, PartiQLParser.RULE_valueRow)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1518
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1519
                this.expr()
                this.state = 1524
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                while (_la === 271) {
                    {
                        {
                            this.state = 1520
                            this.match(PartiQLParser.COMMA)
                            this.state = 1521
                            this.expr()
                        }
                    }
                    this.state = 1526
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                }
                this.state = 1527
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
        this.enterRule(localContext, 240, PartiQLParser.RULE_valueList)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1529
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1530
                this.expr()
                this.state = 1533
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                do {
                    {
                        {
                            this.state = 1531
                            this.match(PartiQLParser.COMMA)
                            this.state = 1532
                            this.expr()
                        }
                    }
                    this.state = 1535
                    this.errorHandler.sync(this)
                    _la = this.tokenStream.LA(1)
                } while (_la === 271)
                this.state = 1537
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
        this.enterRule(localContext, 242, PartiQLParser.RULE_sequenceConstructor)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1539
                localContext._datatype = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 267 || _la === 268)) {
                    localContext._datatype = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1540
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1549
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1541
                        this.expr()
                        this.state = 1546
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 1542
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1543
                                    this.expr()
                                }
                            }
                            this.state = 1548
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1551
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
        this.enterRule(localContext, 244, PartiQLParser.RULE_substring)
        let _la: number
        try {
            this.state = 1579
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 192, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1553
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1554
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1555
                        this.expr()
                        this.state = 1562
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 271) {
                            {
                                this.state = 1556
                                this.match(PartiQLParser.COMMA)
                                this.state = 1557
                                this.expr()
                                this.state = 1560
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 271) {
                                    {
                                        this.state = 1558
                                        this.match(PartiQLParser.COMMA)
                                        this.state = 1559
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1564
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1566
                        this.match(PartiQLParser.SUBSTRING)
                        this.state = 1567
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1568
                        this.expr()
                        this.state = 1575
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 95) {
                            {
                                this.state = 1569
                                this.match(PartiQLParser.FROM)
                                this.state = 1570
                                this.expr()
                                this.state = 1573
                                this.errorHandler.sync(this)
                                _la = this.tokenStream.LA(1)
                                if (_la === 92) {
                                    {
                                        this.state = 1571
                                        this.match(PartiQLParser.FOR)
                                        this.state = 1572
                                        this.expr()
                                    }
                                }
                            }
                        }

                        this.state = 1577
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
        this.enterRule(localContext, 246, PartiQLParser.RULE_position)
        try {
            this.state = 1595
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 193, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1581
                        this.match(PartiQLParser.POSITION)
                        this.state = 1582
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1583
                        this.expr()
                        this.state = 1584
                        this.match(PartiQLParser.COMMA)
                        this.state = 1585
                        this.expr()
                        this.state = 1586
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1588
                        this.match(PartiQLParser.POSITION)
                        this.state = 1589
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1590
                        this.expr()
                        this.state = 1591
                        this.match(PartiQLParser.IN)
                        this.state = 1592
                        this.expr()
                        this.state = 1593
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
        this.enterRule(localContext, 248, PartiQLParser.RULE_overlay)
        let _la: number
        try {
            this.state = 1623
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 196, this.context)) {
                case 1:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1597
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1598
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1599
                        this.expr()
                        this.state = 1600
                        this.match(PartiQLParser.COMMA)
                        this.state = 1601
                        this.expr()
                        this.state = 1602
                        this.match(PartiQLParser.COMMA)
                        this.state = 1603
                        this.expr()
                        this.state = 1606
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 271) {
                            {
                                this.state = 1604
                                this.match(PartiQLParser.COMMA)
                                this.state = 1605
                                this.expr()
                            }
                        }

                        this.state = 1608
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1610
                        this.match(PartiQLParser.OVERLAY)
                        this.state = 1611
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1612
                        this.expr()
                        this.state = 1613
                        this.match(PartiQLParser.PLACING)
                        this.state = 1614
                        this.expr()
                        this.state = 1615
                        this.match(PartiQLParser.FROM)
                        this.state = 1616
                        this.expr()
                        this.state = 1619
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 92) {
                            {
                                this.state = 1617
                                this.match(PartiQLParser.FOR)
                                this.state = 1618
                                this.expr()
                            }
                        }

                        this.state = 1621
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
        this.enterRule(localContext, 250, PartiQLParser.RULE_aggregate)
        let _la: number
        try {
            this.state = 1637
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 198, this.context)) {
                case 1:
                    localContext = new CountAllContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1625
                        ;(localContext as CountAllContext)._func = this.match(PartiQLParser.COUNT)
                        this.state = 1626
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1627
                        this.match(PartiQLParser.ASTERISK)
                        this.state = 1628
                        this.match(PartiQLParser.PAREN_RIGHT)
                    }
                    break
                case 2:
                    localContext = new AggregateBaseContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1629
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
                        this.state = 1630
                        this.match(PartiQLParser.PAREN_LEFT)
                        this.state = 1632
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 4 || _la === 67) {
                            {
                                this.state = 1631
                                this.setQuantifierStrategy()
                            }
                        }

                        this.state = 1634
                        this.expr()
                        this.state = 1635
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
        this.enterRule(localContext, 252, PartiQLParser.RULE_windowFunction)
        let _la: number
        try {
            localContext = new LagLeadFunctionContext(localContext)
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1639
                ;(localContext as LagLeadFunctionContext)._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 230 || _la === 231)) {
                    ;(localContext as LagLeadFunctionContext)._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1640
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1641
                this.expr()
                this.state = 1648
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (_la === 271) {
                    {
                        this.state = 1642
                        this.match(PartiQLParser.COMMA)
                        this.state = 1643
                        this.expr()
                        this.state = 1646
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 271) {
                            {
                                this.state = 1644
                                this.match(PartiQLParser.COMMA)
                                this.state = 1645
                                this.expr()
                            }
                        }
                    }
                }

                this.state = 1650
                this.match(PartiQLParser.PAREN_RIGHT)
                this.state = 1651
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
        this.enterRule(localContext, 254, PartiQLParser.RULE_cast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1653
                this.match(PartiQLParser.CAST)
                this.state = 1654
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1655
                this.expr()
                this.state = 1656
                this.match(PartiQLParser.AS)
                this.state = 1657
                this.type_()
                this.state = 1658
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
        this.enterRule(localContext, 256, PartiQLParser.RULE_canLosslessCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1660
                this.match(PartiQLParser.CAN_LOSSLESS_CAST)
                this.state = 1661
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1662
                this.expr()
                this.state = 1663
                this.match(PartiQLParser.AS)
                this.state = 1664
                this.type_()
                this.state = 1665
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
        this.enterRule(localContext, 258, PartiQLParser.RULE_canCast)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1667
                this.match(PartiQLParser.CAN_CAST)
                this.state = 1668
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1669
                this.expr()
                this.state = 1670
                this.match(PartiQLParser.AS)
                this.state = 1671
                this.type_()
                this.state = 1672
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
        this.enterRule(localContext, 260, PartiQLParser.RULE_extract)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1674
                this.match(PartiQLParser.EXTRACT)
                this.state = 1675
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1676
                this.match(PartiQLParser.IDENTIFIER)
                this.state = 1677
                this.match(PartiQLParser.FROM)
                this.state = 1678
                localContext._rhs = this.expr()
                this.state = 1679
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
        this.enterRule(localContext, 262, PartiQLParser.RULE_trimFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1681
                localContext._func = this.match(PartiQLParser.TRIM)
                this.state = 1682
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1690
                this.errorHandler.sync(this)
                switch (this.interpreter.adaptivePredict(this.tokenStream, 203, this.context)) {
                    case 1:
                        {
                            this.state = 1684
                            this.errorHandler.sync(this)
                            switch (this.interpreter.adaptivePredict(this.tokenStream, 201, this.context)) {
                                case 1:
                                    {
                                        this.state = 1683
                                        localContext._mod = this.match(PartiQLParser.IDENTIFIER)
                                    }
                                    break
                            }
                            this.state = 1687
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                            if (
                                ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                                (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                                (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                                (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                                (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                                (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                                (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                                (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                            ) {
                                {
                                    this.state = 1686
                                    localContext._sub = this.expr()
                                }
                            }

                            this.state = 1689
                            this.match(PartiQLParser.FROM)
                        }
                        break
                }
                this.state = 1692
                localContext._target = this.expr()
                this.state = 1693
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
        this.enterRule(localContext, 264, PartiQLParser.RULE_dateFunction)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1695
                localContext._func = this.tokenStream.LT(1)
                _la = this.tokenStream.LA(1)
                if (!(_la === 86 || _la === 87)) {
                    localContext._func = this.errorHandler.recoverInline(this)
                } else {
                    this.errorHandler.reportMatch(this)
                    this.consume()
                }
                this.state = 1696
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1697
                localContext._dt = this.match(PartiQLParser.IDENTIFIER)
                this.state = 1698
                this.match(PartiQLParser.COMMA)
                this.state = 1699
                this.expr()
                this.state = 1700
                this.match(PartiQLParser.COMMA)
                this.state = 1701
                this.expr()
                this.state = 1702
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
        this.enterRule(localContext, 266, PartiQLParser.RULE_functionCall)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1704
                this.functionName()
                this.state = 1705
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1714
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1706
                        this.expr()
                        this.state = 1711
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 1707
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1708
                                    this.expr()
                                }
                            }
                            this.state = 1713
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1716
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
        this.enterRule(localContext, 268, PartiQLParser.RULE_functionName)
        let _la: number
        try {
            let alternative: number
            this.state = 1736
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 208, this.context)) {
                case 1:
                    localContext = new FunctionNameReservedContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1723
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 304 || _la === 305) {
                            {
                                {
                                    this.state = 1718
                                    ;(localContext as FunctionNameReservedContext)._symbolPrimitive =
                                        this.symbolPrimitive()
                                    ;(localContext as FunctionNameReservedContext)._qualifier.push(
                                        (localContext as FunctionNameReservedContext)._symbolPrimitive!
                                    )
                                    this.state = 1719
                                    this.match(PartiQLParser.PERIOD)
                                }
                            }
                            this.state = 1725
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                        this.state = 1726
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
                        this.state = 1732
                        this.errorHandler.sync(this)
                        alternative = this.interpreter.adaptivePredict(this.tokenStream, 207, this.context)
                        while (alternative !== 2 && alternative !== antlr.ATN.INVALID_ALT_NUMBER) {
                            if (alternative === 1) {
                                {
                                    {
                                        this.state = 1727
                                        ;(localContext as FunctionNameSymbolContext)._symbolPrimitive =
                                            this.symbolPrimitive()
                                        ;(localContext as FunctionNameSymbolContext)._qualifier.push(
                                            (localContext as FunctionNameSymbolContext)._symbolPrimitive!
                                        )
                                        this.state = 1728
                                        this.match(PartiQLParser.PERIOD)
                                    }
                                }
                            }
                            this.state = 1734
                            this.errorHandler.sync(this)
                            alternative = this.interpreter.adaptivePredict(this.tokenStream, 207, this.context)
                        }
                        this.state = 1735
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
        this.enterRule(localContext, 270, PartiQLParser.RULE_pathStep)
        try {
            this.state = 1749
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 209, this.context)) {
                case 1:
                    localContext = new PathStepIndexExprContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1738
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1739
                        ;(localContext as PathStepIndexExprContext)._key = this.expr()
                        this.state = 1740
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 2:
                    localContext = new PathStepIndexAllContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1742
                        this.match(PartiQLParser.BRACKET_LEFT)
                        this.state = 1743
                        ;(localContext as PathStepIndexAllContext)._all = this.match(PartiQLParser.ASTERISK)
                        this.state = 1744
                        this.match(PartiQLParser.BRACKET_RIGHT)
                    }
                    break
                case 3:
                    localContext = new PathStepDotExprContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1745
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1746
                        ;(localContext as PathStepDotExprContext)._key = this.symbolPrimitive()
                    }
                    break
                case 4:
                    localContext = new PathStepDotAllContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1747
                        this.match(PartiQLParser.PERIOD)
                        this.state = 1748
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
        this.enterRule(localContext, 272, PartiQLParser.RULE_exprGraphMatchMany)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1751
                this.match(PartiQLParser.PAREN_LEFT)
                this.state = 1752
                this.exprPrimary(0)
                this.state = 1753
                this.match(PartiQLParser.MATCH)
                this.state = 1754
                this.gpmlPatternList()
                this.state = 1755
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
        this.enterRule(localContext, 274, PartiQLParser.RULE_exprGraphMatchOne)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1757
                this.exprPrimary(0)
                this.state = 1758
                this.match(PartiQLParser.MATCH)
                this.state = 1759
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
        this.enterRule(localContext, 276, PartiQLParser.RULE_parameter)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1761
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
        this.enterRule(localContext, 278, PartiQLParser.RULE_varRefExpr)
        let _la: number
        try {
            this.state = 1771
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 212, this.context)) {
                case 1:
                    localContext = new VariableIdentifierContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1764
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 276) {
                            {
                                this.state = 1763
                                ;(localContext as VariableIdentifierContext)._qualifier = this.match(
                                    PartiQLParser.AT_SIGN
                                )
                            }
                        }

                        this.state = 1766
                        ;(localContext as VariableIdentifierContext)._ident = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 304 || _la === 305)) {
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
                        this.state = 1768
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 276) {
                            {
                                this.state = 1767
                                ;(localContext as VariableKeywordContext)._qualifier = this.match(PartiQLParser.AT_SIGN)
                            }
                        }

                        this.state = 1770
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
        this.enterRule(localContext, 280, PartiQLParser.RULE_nonReservedKeywords)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1773
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
        this.enterRule(localContext, 282, PartiQLParser.RULE_collection)
        try {
            this.state = 1777
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.BRACKET_LEFT:
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1775
                        this.array()
                    }
                    break
                case PartiQLParser.ANGLE_DOUBLE_LEFT:
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1776
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
        this.enterRule(localContext, 284, PartiQLParser.RULE_array)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1779
                this.match(PartiQLParser.BRACKET_LEFT)
                this.state = 1788
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1780
                        this.expr()
                        this.state = 1785
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 1781
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1782
                                    this.expr()
                                }
                            }
                            this.state = 1787
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1790
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
        this.enterRule(localContext, 286, PartiQLParser.RULE_bag)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1792
                this.match(PartiQLParser.ANGLE_DOUBLE_LEFT)
                this.state = 1801
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1793
                        this.expr()
                        this.state = 1798
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 1794
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1795
                                    this.expr()
                                }
                            }
                            this.state = 1800
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1803
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
        this.enterRule(localContext, 288, PartiQLParser.RULE_tuple)
        let _la: number
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1805
                this.match(PartiQLParser.BRACE_LEFT)
                this.state = 1814
                this.errorHandler.sync(this)
                _la = this.tokenStream.LA(1)
                if (
                    ((_la & ~0x1f) === 0 && ((1 << _la) & 831029504) !== 0) ||
                    (((_la - 32) & ~0x1f) === 0 && ((1 << (_la - 32)) & 2691073) !== 0) ||
                    (((_la - 75) & ~0x1f) === 0 && ((1 << (_la - 75)) & 15505) !== 0) ||
                    (((_la - 129) & ~0x1f) === 0 && ((1 << (_la - 129)) & 2281789453) !== 0) ||
                    (((_la - 182) & ~0x1f) === 0 && ((1 << (_la - 182)) & 2249744545) !== 0) ||
                    (((_la - 219) & ~0x1f) === 0 && ((1 << (_la - 219)) & 497665) !== 0) ||
                    (((_la - 267) & ~0x1f) === 0 && ((1 << (_la - 267)) & 356516451) !== 0) ||
                    (((_la - 299) & ~0x1f) === 0 && ((1 << (_la - 299)) & 2173) !== 0)
                ) {
                    {
                        this.state = 1806
                        this.pair()
                        this.state = 1811
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        while (_la === 271) {
                            {
                                {
                                    this.state = 1807
                                    this.match(PartiQLParser.COMMA)
                                    this.state = 1808
                                    this.pair()
                                }
                            }
                            this.state = 1813
                            this.errorHandler.sync(this)
                            _la = this.tokenStream.LA(1)
                        }
                    }
                }

                this.state = 1816
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
        this.enterRule(localContext, 290, PartiQLParser.RULE_pair)
        try {
            this.enterOuterAlt(localContext, 1)
            {
                this.state = 1818
                localContext._lhs = this.expr()
                this.state = 1819
                this.match(PartiQLParser.COLON)
                this.state = 1820
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
        this.enterRule(localContext, 292, PartiQLParser.RULE_literal)
        let _la: number
        try {
            this.state = 1856
            this.errorHandler.sync(this)
            switch (this.tokenStream.LA(1)) {
                case PartiQLParser.NULL:
                    localContext = new LiteralNullContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1822
                        this.match(PartiQLParser.NULL)
                    }
                    break
                case PartiQLParser.MISSING:
                    localContext = new LiteralMissingContext(localContext)
                    this.enterOuterAlt(localContext, 2)
                    {
                        this.state = 1823
                        this.match(PartiQLParser.MISSING)
                    }
                    break
                case PartiQLParser.TRUE:
                    localContext = new LiteralTrueContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1824
                        this.match(PartiQLParser.TRUE)
                    }
                    break
                case PartiQLParser.FALSE:
                    localContext = new LiteralFalseContext(localContext)
                    this.enterOuterAlt(localContext, 4)
                    {
                        this.state = 1825
                        this.match(PartiQLParser.FALSE)
                    }
                    break
                case PartiQLParser.LITERAL_STRING:
                    localContext = new LiteralStringContext(localContext)
                    this.enterOuterAlt(localContext, 5)
                    {
                        this.state = 1826
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.LITERAL_INTEGER:
                    localContext = new LiteralIntegerContext(localContext)
                    this.enterOuterAlt(localContext, 6)
                    {
                        this.state = 1827
                        this.match(PartiQLParser.LITERAL_INTEGER)
                    }
                    break
                case PartiQLParser.LITERAL_DECIMAL:
                    localContext = new LiteralDecimalContext(localContext)
                    this.enterOuterAlt(localContext, 7)
                    {
                        this.state = 1828
                        this.match(PartiQLParser.LITERAL_DECIMAL)
                    }
                    break
                case PartiQLParser.ION_CLOSURE:
                    localContext = new LiteralIonContext(localContext)
                    this.enterOuterAlt(localContext, 8)
                    {
                        this.state = 1829
                        this.match(PartiQLParser.ION_CLOSURE)
                    }
                    break
                case PartiQLParser.DATE:
                    localContext = new LiteralDateContext(localContext)
                    this.enterOuterAlt(localContext, 9)
                    {
                        this.state = 1830
                        this.match(PartiQLParser.DATE)
                        this.state = 1831
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIME:
                    localContext = new LiteralTimeContext(localContext)
                    this.enterOuterAlt(localContext, 10)
                    {
                        this.state = 1832
                        this.match(PartiQLParser.TIME)
                        this.state = 1836
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 295) {
                            {
                                this.state = 1833
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1834
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1835
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1841
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1838
                                this.match(PartiQLParser.WITH)
                                this.state = 1839
                                this.match(PartiQLParser.TIME)
                                this.state = 1840
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1843
                        this.match(PartiQLParser.LITERAL_STRING)
                    }
                    break
                case PartiQLParser.TIMESTAMP:
                    localContext = new LiteralTimestampContext(localContext)
                    this.enterOuterAlt(localContext, 11)
                    {
                        this.state = 1844
                        this.match(PartiQLParser.TIMESTAMP)
                        this.state = 1848
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 295) {
                            {
                                this.state = 1845
                                this.match(PartiQLParser.PAREN_LEFT)
                                this.state = 1846
                                this.match(PartiQLParser.LITERAL_INTEGER)
                                this.state = 1847
                                this.match(PartiQLParser.PAREN_RIGHT)
                            }
                        }

                        this.state = 1853
                        this.errorHandler.sync(this)
                        _la = this.tokenStream.LA(1)
                        if (_la === 226) {
                            {
                                this.state = 1850
                                this.match(PartiQLParser.WITH)
                                this.state = 1851
                                this.match(PartiQLParser.TIME)
                                this.state = 1852
                                this.match(PartiQLParser.ZONE)
                            }
                        }

                        this.state = 1855
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
        this.enterRule(localContext, 294, PartiQLParser.RULE_type)
        let _la: number
        try {
            this.state = 1896
            this.errorHandler.sync(this)
            switch (this.interpreter.adaptivePredict(this.tokenStream, 231, this.context)) {
                case 1:
                    localContext = new TypeAtomicContext(localContext)
                    this.enterOuterAlt(localContext, 1)
                    {
                        this.state = 1858
                        ;(localContext as TypeAtomicContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (
                            !(
                                ((_la & ~0x1f) === 0 && ((1 << _la) & 201326848) !== 0) ||
                                _la === 53 ||
                                (((_la - 113) & ~0x1f) === 0 && ((1 << (_la - 113)) & 268435459) !== 0) ||
                                _la === 170 ||
                                _la === 188 ||
                                (((_la - 236) & ~0x1f) === 0 && ((1 << (_la - 236)) & 4294901761) !== 0) ||
                                _la === 268 ||
                                _la === 269
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
                        this.state = 1859
                        ;(localContext as TypeAtomicContext)._datatype = this.match(PartiQLParser.DOUBLE)
                        this.state = 1860
                        this.match(PartiQLParser.PRECISION)
                    }
                    break
                case 3:
                    localContext = new TypeArgSingleContext(localContext)
                    this.enterOuterAlt(localContext, 3)
                    {
                        this.state = 1861
                        ;(localContext as TypeArgSingleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 26 || _la === 27 || _la === 91 || _la === 220)) {
                            ;(localContext as TypeArgSingleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1865
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 225, this.context)) {
                            case 1:
                                {
                                    this.state = 1862
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1863
                                    ;(localContext as TypeArgSingleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1864
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
                        this.state = 1867
                        this.match(PartiQLParser.CHARACTER)
                        this.state = 1868
                        this.match(PartiQLParser.VARYING)
                        this.state = 1872
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 226, this.context)) {
                            case 1:
                                {
                                    this.state = 1869
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1870
                                    ;(localContext as TypeVarCharContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1871
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
                        this.state = 1874
                        ;(localContext as TypeArgDoubleContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 55 || _la === 56 || _la === 144)) {
                            ;(localContext as TypeArgDoubleContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1882
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 228, this.context)) {
                            case 1:
                                {
                                    this.state = 1875
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1876
                                    ;(localContext as TypeArgDoubleContext)._arg0 = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1879
                                    this.errorHandler.sync(this)
                                    _la = this.tokenStream.LA(1)
                                    if (_la === 271) {
                                        {
                                            this.state = 1877
                                            this.match(PartiQLParser.COMMA)
                                            this.state = 1878
                                            ;(localContext as TypeArgDoubleContext)._arg1 = this.match(
                                                PartiQLParser.LITERAL_INTEGER
                                            )
                                        }
                                    }

                                    this.state = 1881
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
                        this.state = 1884
                        ;(localContext as TypeTimeZoneContext)._datatype = this.tokenStream.LT(1)
                        _la = this.tokenStream.LA(1)
                        if (!(_la === 201 || _la === 202)) {
                            ;(localContext as TypeTimeZoneContext)._datatype = this.errorHandler.recoverInline(this)
                        } else {
                            this.errorHandler.reportMatch(this)
                            this.consume()
                        }
                        this.state = 1888
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 229, this.context)) {
                            case 1:
                                {
                                    this.state = 1885
                                    this.match(PartiQLParser.PAREN_LEFT)
                                    this.state = 1886
                                    ;(localContext as TypeTimeZoneContext)._precision = this.match(
                                        PartiQLParser.LITERAL_INTEGER
                                    )
                                    this.state = 1887
                                    this.match(PartiQLParser.PAREN_RIGHT)
                                }
                                break
                        }
                        this.state = 1893
                        this.errorHandler.sync(this)
                        switch (this.interpreter.adaptivePredict(this.tokenStream, 230, this.context)) {
                            case 1:
                                {
                                    this.state = 1890
                                    this.match(PartiQLParser.WITH)
                                    this.state = 1891
                                    this.match(PartiQLParser.TIME)
                                    this.state = 1892
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
                        this.state = 1895
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
            case 90:
                return this.labelSpec_sempred(localContext as LabelSpecContext, predIndex)
            case 91:
                return this.labelTerm_sempred(localContext as LabelTermContext, predIndex)
            case 95:
                return this.tableReference_sempred(localContext as TableReferenceContext, predIndex)
            case 103:
                return this.exprBagOp_sempred(localContext as ExprBagOpContext, predIndex)
            case 105:
                return this.exprOr_sempred(localContext as ExprOrContext, predIndex)
            case 106:
                return this.exprAnd_sempred(localContext as ExprAndContext, predIndex)
            case 108:
                return this.exprPredicate_sempred(localContext as ExprPredicateContext, predIndex)
            case 109:
                return this.mathOp00_sempred(localContext as MathOp00Context, predIndex)
            case 110:
                return this.mathOp01_sempred(localContext as MathOp01Context, predIndex)
            case 111:
                return this.mathOp02_sempred(localContext as MathOp02Context, predIndex)
            case 113:
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
        4, 1, 311, 1899, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2, 4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7,
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
        138, 2, 139, 7, 139, 2, 140, 7, 140, 2, 141, 7, 141, 2, 142, 7, 142, 2, 143, 7, 143, 2, 144, 7, 144, 2, 145, 7,
        145, 2, 146, 7, 146, 2, 147, 7, 147, 1, 0, 1, 0, 3, 0, 299, 8, 0, 4, 0, 301, 8, 0, 11, 0, 12, 0, 302, 1, 0, 1,
        0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 312, 8, 1, 10, 1, 12, 1, 315, 9, 1, 1, 1, 1, 1, 3, 1, 319, 8, 1, 3, 1,
        321, 8, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 2, 3, 2, 329, 8, 2, 1, 3, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4, 1, 5, 1, 5,
        1, 5, 1, 6, 1, 6, 1, 6, 1, 7, 1, 7, 1, 8, 1, 8, 1, 9, 1, 9, 1, 9, 1, 9, 1, 9, 5, 9, 352, 8, 9, 10, 9, 12, 9,
        355, 9, 9, 3, 9, 357, 8, 9, 1, 10, 1, 10, 1, 10, 5, 10, 362, 8, 10, 10, 10, 12, 10, 365, 9, 10, 1, 10, 1, 10, 1,
        11, 1, 11, 1, 12, 1, 12, 1, 13, 1, 13, 1, 14, 1, 14, 1, 15, 1, 15, 1, 16, 1, 16, 1, 17, 1, 17, 1, 18, 1, 18, 3,
        18, 385, 8, 18, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 3, 19, 394, 8, 19, 1, 19, 3, 19, 397, 8, 19, 1,
        19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 1, 19, 5, 19, 407, 8, 19, 10, 19, 12, 19, 410, 9, 19, 1, 19, 1,
        19, 3, 19, 414, 8, 19, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 1, 20, 3, 20, 425, 8, 20, 1, 21,
        1, 21, 1, 21, 5, 21, 430, 8, 21, 10, 21, 12, 21, 433, 9, 21, 1, 22, 1, 22, 1, 22, 5, 22, 438, 8, 22, 10, 22, 12,
        22, 441, 9, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 1, 22, 3, 22, 449, 8, 22, 1, 23, 1, 23, 1, 23, 5, 23, 454, 8,
        23, 10, 23, 12, 23, 457, 9, 23, 1, 24, 1, 24, 3, 24, 461, 8, 24, 1, 24, 1, 24, 1, 25, 1, 25, 1, 25, 3, 25, 468,
        8, 25, 1, 26, 1, 26, 1, 26, 1, 26, 5, 26, 474, 8, 26, 10, 26, 12, 26, 477, 9, 26, 1, 27, 1, 27, 1, 27, 1, 27, 1,
        27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 1, 27, 3, 27, 494, 8, 27, 1, 28, 1, 28, 1,
        28, 1, 28, 5, 28, 500, 8, 28, 10, 28, 12, 28, 503, 9, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1, 28, 1,
        28, 1, 28, 1, 28, 3, 28, 515, 8, 28, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 1, 29, 5, 29, 523, 8, 29, 10, 29, 12,
        29, 526, 9, 29, 1, 30, 1, 30, 4, 30, 530, 8, 30, 11, 30, 12, 30, 531, 1, 30, 3, 30, 535, 8, 30, 1, 30, 3, 30,
        538, 8, 30, 1, 30, 1, 30, 3, 30, 542, 8, 30, 1, 30, 4, 30, 545, 8, 30, 11, 30, 12, 30, 546, 1, 30, 3, 30, 550,
        8, 30, 1, 30, 1, 30, 1, 30, 3, 30, 555, 8, 30, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 1, 31, 3, 31, 563, 8, 31, 1,
        32, 1, 32, 5, 32, 567, 8, 32, 10, 32, 12, 32, 570, 9, 32, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1, 33, 1,
        33, 1, 33, 1, 33, 3, 33, 582, 8, 33, 1, 34, 1, 34, 1, 34, 1, 34, 3, 34, 588, 8, 34, 1, 34, 1, 34, 1, 35, 1, 35,
        1, 35, 1, 35, 3, 35, 596, 8, 35, 1, 35, 1, 35, 1, 36, 1, 36, 1, 36, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1, 37, 1,
        37, 3, 37, 610, 8, 37, 1, 37, 3, 37, 613, 8, 37, 1, 37, 3, 37, 616, 8, 37, 1, 38, 1, 38, 1, 38, 1, 38, 3, 38,
        622, 8, 38, 1, 38, 1, 38, 3, 38, 626, 8, 38, 1, 39, 1, 39, 1, 39, 3, 39, 631, 8, 39, 1, 39, 1, 39, 1, 40, 1, 40,
        1, 40, 1, 40, 1, 40, 1, 40, 1, 40, 3, 40, 642, 8, 40, 1, 40, 3, 40, 645, 8, 40, 1, 41, 1, 41, 1, 41, 1, 41, 1,
        41, 1, 41, 1, 41, 1, 42, 1, 42, 1, 42, 1, 42, 5, 42, 658, 8, 42, 10, 42, 12, 42, 661, 9, 42, 1, 42, 1, 42, 1,
        42, 1, 42, 1, 42, 3, 42, 668, 8, 42, 1, 43, 1, 43, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 1, 44, 3,
        44, 680, 8, 44, 1, 45, 1, 45, 1, 45, 3, 45, 685, 8, 45, 1, 46, 1, 46, 1, 46, 3, 46, 690, 8, 46, 1, 47, 1, 47, 1,
        47, 1, 48, 1, 48, 1, 48, 1, 48, 5, 48, 699, 8, 48, 10, 48, 12, 48, 702, 9, 48, 1, 49, 1, 49, 1, 49, 1, 49, 1,
        50, 1, 50, 1, 50, 3, 50, 711, 8, 50, 1, 50, 3, 50, 714, 8, 50, 1, 51, 1, 51, 1, 51, 1, 51, 5, 51, 720, 8, 51,
        10, 51, 12, 51, 723, 9, 51, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 1, 52, 3, 52, 731, 8, 52, 1, 53, 1, 53, 1, 53, 3,
        53, 736, 8, 53, 1, 53, 3, 53, 739, 8, 53, 1, 53, 3, 53, 742, 8, 53, 1, 53, 1, 53, 1, 53, 1, 53, 3, 53, 748, 8,
        53, 1, 54, 1, 54, 1, 54, 1, 55, 1, 55, 3, 55, 755, 8, 55, 1, 55, 1, 55, 1, 55, 3, 55, 760, 8, 55, 1, 55, 1, 55,
        1, 55, 3, 55, 765, 8, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 1, 55, 3, 55, 774, 8, 55, 1, 56, 1, 56, 1,
        56, 5, 56, 779, 8, 56, 10, 56, 12, 56, 782, 9, 56, 1, 57, 1, 57, 3, 57, 786, 8, 57, 1, 57, 3, 57, 789, 8, 57, 1,
        58, 1, 58, 1, 59, 1, 59, 1, 59, 1, 59, 5, 59, 797, 8, 59, 10, 59, 12, 59, 800, 9, 59, 1, 60, 1, 60, 1, 60, 1,
        60, 1, 61, 1, 61, 1, 61, 1, 61, 1, 61, 5, 61, 811, 8, 61, 10, 61, 12, 61, 814, 9, 61, 1, 62, 1, 62, 3, 62, 818,
        8, 62, 1, 62, 1, 62, 3, 62, 822, 8, 62, 1, 63, 1, 63, 3, 63, 826, 8, 63, 1, 63, 1, 63, 1, 63, 1, 63, 5, 63, 832,
        8, 63, 10, 63, 12, 63, 835, 9, 63, 1, 63, 3, 63, 838, 8, 63, 1, 64, 1, 64, 1, 64, 1, 64, 1, 65, 1, 65, 1, 65, 3,
        65, 847, 8, 65, 1, 66, 1, 66, 1, 66, 3, 66, 852, 8, 66, 1, 66, 3, 66, 855, 8, 66, 1, 66, 1, 66, 1, 67, 1, 67, 1,
        67, 1, 67, 1, 67, 5, 67, 864, 8, 67, 10, 67, 12, 67, 867, 9, 67, 1, 68, 1, 68, 1, 68, 1, 68, 1, 68, 5, 68, 874,
        8, 68, 10, 68, 12, 68, 877, 9, 68, 1, 69, 1, 69, 1, 69, 1, 70, 1, 70, 1, 70, 1, 70, 5, 70, 886, 8, 70, 10, 70,
        12, 70, 889, 9, 70, 1, 71, 1, 71, 4, 71, 893, 8, 71, 11, 71, 12, 71, 894, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1,
        72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 1, 72, 3, 72, 910, 8, 72, 1, 73, 1, 73, 1, 73, 1, 74, 1, 74, 1,
        74, 1, 75, 1, 75, 1, 75, 1, 76, 1, 76, 1, 76, 1, 77, 3, 77, 925, 8, 77, 1, 77, 1, 77, 1, 78, 3, 78, 930, 8, 78,
        1, 78, 1, 78, 1, 78, 5, 78, 935, 8, 78, 10, 78, 12, 78, 938, 9, 78, 1, 79, 3, 79, 941, 8, 79, 1, 79, 3, 79, 944,
        8, 79, 1, 79, 5, 79, 947, 8, 79, 10, 79, 12, 79, 950, 9, 79, 1, 80, 1, 80, 1, 80, 3, 80, 955, 8, 80, 1, 81, 1,
        81, 1, 81, 1, 81, 3, 81, 961, 8, 81, 1, 81, 1, 81, 1, 81, 3, 81, 966, 8, 81, 3, 81, 968, 8, 81, 1, 82, 1, 82, 1,
        82, 1, 83, 1, 83, 1, 84, 1, 84, 3, 84, 977, 8, 84, 1, 84, 1, 84, 3, 84, 981, 8, 84, 1, 84, 3, 84, 984, 8, 84, 1,
        84, 1, 84, 1, 85, 1, 85, 3, 85, 990, 8, 85, 1, 85, 1, 85, 3, 85, 994, 8, 85, 3, 85, 996, 8, 85, 1, 86, 1, 86, 3,
        86, 1000, 8, 86, 1, 86, 3, 86, 1003, 8, 86, 1, 86, 4, 86, 1006, 8, 86, 11, 86, 12, 86, 1007, 1, 86, 3, 86, 1011,
        8, 86, 1, 86, 1, 86, 3, 86, 1015, 8, 86, 1, 86, 1, 86, 3, 86, 1019, 8, 86, 1, 86, 3, 86, 1022, 8, 86, 1, 86, 4,
        86, 1025, 8, 86, 11, 86, 12, 86, 1026, 1, 86, 3, 86, 1030, 8, 86, 1, 86, 1, 86, 3, 86, 1034, 8, 86, 3, 86, 1036,
        8, 86, 1, 87, 1, 87, 1, 87, 1, 87, 1, 87, 3, 87, 1043, 8, 87, 1, 87, 3, 87, 1046, 8, 87, 1, 88, 1, 88, 1, 88, 1,
        88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1,
        88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 1, 88, 3, 88,
        1082, 8, 88, 1, 89, 1, 89, 3, 89, 1086, 8, 89, 1, 89, 1, 89, 3, 89, 1090, 8, 89, 1, 89, 3, 89, 1093, 8, 89, 1,
        89, 1, 89, 1, 90, 1, 90, 1, 90, 1, 90, 1, 90, 1, 90, 5, 90, 1103, 8, 90, 10, 90, 12, 90, 1106, 9, 90, 1, 91, 1,
        91, 1, 91, 1, 91, 1, 91, 1, 91, 5, 91, 1114, 8, 91, 10, 91, 12, 91, 1117, 9, 91, 1, 92, 1, 92, 1, 92, 3, 92,
        1122, 8, 92, 1, 93, 1, 93, 1, 93, 1, 93, 1, 93, 1, 93, 3, 93, 1130, 8, 93, 1, 94, 1, 94, 1, 94, 1, 94, 1, 94, 1,
        94, 3, 94, 1138, 8, 94, 1, 94, 1, 94, 3, 94, 1142, 8, 94, 3, 94, 1144, 8, 94, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95,
        1, 95, 3, 95, 1152, 8, 95, 1, 95, 1, 95, 3, 95, 1156, 8, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1, 95, 1,
        95, 3, 95, 1166, 8, 95, 1, 95, 1, 95, 1, 95, 1, 95, 5, 95, 1172, 8, 95, 10, 95, 12, 95, 1175, 9, 95, 1, 96, 1,
        96, 3, 96, 1179, 8, 96, 1, 97, 1, 97, 1, 97, 1, 97, 1, 97, 3, 97, 1186, 8, 97, 1, 97, 3, 97, 1189, 8, 97, 1, 97,
        3, 97, 1192, 8, 97, 1, 97, 1, 97, 3, 97, 1196, 8, 97, 1, 97, 3, 97, 1199, 8, 97, 1, 97, 3, 97, 1202, 8, 97, 3,
        97, 1204, 8, 97, 1, 98, 1, 98, 1, 98, 3, 98, 1209, 8, 98, 1, 98, 3, 98, 1212, 8, 98, 1, 98, 3, 98, 1215, 8, 98,
        1, 99, 1, 99, 1, 99, 1, 99, 1, 99, 3, 99, 1222, 8, 99, 1, 100, 1, 100, 1, 100, 1, 101, 1, 101, 1, 101, 3, 101,
        1230, 8, 101, 1, 101, 1, 101, 3, 101, 1234, 8, 101, 1, 101, 1, 101, 3, 101, 1238, 8, 101, 1, 101, 3, 101, 1241,
        8, 101, 1, 102, 1, 102, 1, 103, 1, 103, 1, 103, 1, 103, 1, 103, 3, 103, 1250, 8, 103, 1, 103, 1, 103, 3, 103,
        1254, 8, 103, 1, 103, 1, 103, 1, 103, 3, 103, 1259, 8, 103, 1, 103, 1, 103, 3, 103, 1263, 8, 103, 1, 103, 1,
        103, 1, 103, 3, 103, 1268, 8, 103, 1, 103, 1, 103, 3, 103, 1272, 8, 103, 1, 103, 5, 103, 1275, 8, 103, 10, 103,
        12, 103, 1278, 9, 103, 1, 104, 1, 104, 3, 104, 1282, 8, 104, 1, 104, 1, 104, 3, 104, 1286, 8, 104, 1, 104, 3,
        104, 1289, 8, 104, 1, 104, 3, 104, 1292, 8, 104, 1, 104, 3, 104, 1295, 8, 104, 1, 104, 3, 104, 1298, 8, 104, 1,
        104, 3, 104, 1301, 8, 104, 1, 104, 3, 104, 1304, 8, 104, 1, 104, 3, 104, 1307, 8, 104, 1, 105, 1, 105, 1, 105,
        1, 105, 1, 105, 1, 105, 5, 105, 1315, 8, 105, 10, 105, 12, 105, 1318, 9, 105, 1, 106, 1, 106, 1, 106, 1, 106, 1,
        106, 1, 106, 5, 106, 1326, 8, 106, 10, 106, 12, 106, 1329, 9, 106, 1, 107, 1, 107, 1, 107, 3, 107, 1334, 8, 107,
        1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 3, 108, 1345, 8, 108, 1, 108, 1, 108, 1,
        108, 3, 108, 1350, 8, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 3, 108, 1359, 8, 108, 1, 108,
        1, 108, 1, 108, 1, 108, 3, 108, 1365, 8, 108, 1, 108, 1, 108, 1, 108, 1, 108, 3, 108, 1371, 8, 108, 1, 108, 1,
        108, 3, 108, 1375, 8, 108, 1, 108, 1, 108, 1, 108, 1, 108, 1, 108, 5, 108, 1382, 8, 108, 10, 108, 12, 108, 1385,
        9, 108, 1, 109, 1, 109, 1, 109, 1, 109, 1, 109, 1, 109, 5, 109, 1393, 8, 109, 10, 109, 12, 109, 1396, 9, 109, 1,
        110, 1, 110, 1, 110, 1, 110, 1, 110, 1, 110, 5, 110, 1404, 8, 110, 10, 110, 12, 110, 1407, 9, 110, 1, 111, 1,
        111, 1, 111, 1, 111, 1, 111, 1, 111, 5, 111, 1415, 8, 111, 10, 111, 12, 111, 1418, 9, 111, 1, 112, 1, 112, 1,
        112, 3, 112, 1423, 8, 112, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1,
        113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 1, 113, 3, 113, 1446, 8, 113, 1,
        113, 1, 113, 4, 113, 1450, 8, 113, 11, 113, 12, 113, 1451, 5, 113, 1454, 8, 113, 10, 113, 12, 113, 1457, 9, 113,
        1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 1, 114, 3, 114, 1470, 8, 114, 1,
        115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 115, 1, 116, 1, 116, 1, 116, 1, 116, 1, 116, 5, 116, 1484, 8,
        116, 10, 116, 12, 116, 1487, 9, 116, 1, 116, 1, 116, 1, 117, 1, 117, 3, 117, 1493, 8, 117, 1, 117, 1, 117, 1,
        117, 1, 117, 1, 117, 4, 117, 1500, 8, 117, 11, 117, 12, 117, 1501, 1, 117, 1, 117, 3, 117, 1506, 8, 117, 1, 117,
        1, 117, 1, 118, 1, 118, 1, 118, 1, 118, 5, 118, 1514, 8, 118, 10, 118, 12, 118, 1517, 9, 118, 1, 119, 1, 119, 1,
        119, 1, 119, 5, 119, 1523, 8, 119, 10, 119, 12, 119, 1526, 9, 119, 1, 119, 1, 119, 1, 120, 1, 120, 1, 120, 1,
        120, 4, 120, 1534, 8, 120, 11, 120, 12, 120, 1535, 1, 120, 1, 120, 1, 121, 1, 121, 1, 121, 1, 121, 1, 121, 5,
        121, 1545, 8, 121, 10, 121, 12, 121, 1548, 9, 121, 3, 121, 1550, 8, 121, 1, 121, 1, 121, 1, 122, 1, 122, 1, 122,
        1, 122, 1, 122, 1, 122, 1, 122, 3, 122, 1561, 8, 122, 3, 122, 1563, 8, 122, 1, 122, 1, 122, 1, 122, 1, 122, 1,
        122, 1, 122, 1, 122, 1, 122, 1, 122, 3, 122, 1574, 8, 122, 3, 122, 1576, 8, 122, 1, 122, 1, 122, 3, 122, 1580,
        8, 122, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123, 1, 123,
        1, 123, 3, 123, 1596, 8, 123, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 3, 124,
        1607, 8, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 1, 124, 3, 124,
        1620, 8, 124, 1, 124, 1, 124, 3, 124, 1624, 8, 124, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 1, 125, 3,
        125, 1633, 8, 125, 1, 125, 1, 125, 1, 125, 3, 125, 1638, 8, 125, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126, 1, 126,
        1, 126, 3, 126, 1647, 8, 126, 3, 126, 1649, 8, 126, 1, 126, 1, 126, 1, 126, 1, 127, 1, 127, 1, 127, 1, 127, 1,
        127, 1, 127, 1, 127, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 128, 1, 129, 1, 129, 1, 129, 1, 129, 1,
        129, 1, 129, 1, 129, 1, 130, 1, 130, 1, 130, 1, 130, 1, 130, 1, 130, 1, 130, 1, 131, 1, 131, 1, 131, 3, 131,
        1685, 8, 131, 1, 131, 3, 131, 1688, 8, 131, 1, 131, 3, 131, 1691, 8, 131, 1, 131, 1, 131, 1, 131, 1, 132, 1,
        132, 1, 132, 1, 132, 1, 132, 1, 132, 1, 132, 1, 132, 1, 132, 1, 133, 1, 133, 1, 133, 1, 133, 1, 133, 5, 133,
        1710, 8, 133, 10, 133, 12, 133, 1713, 9, 133, 3, 133, 1715, 8, 133, 1, 133, 1, 133, 1, 134, 1, 134, 1, 134, 5,
        134, 1722, 8, 134, 10, 134, 12, 134, 1725, 9, 134, 1, 134, 1, 134, 1, 134, 1, 134, 5, 134, 1731, 8, 134, 10,
        134, 12, 134, 1734, 9, 134, 1, 134, 3, 134, 1737, 8, 134, 1, 135, 1, 135, 1, 135, 1, 135, 1, 135, 1, 135, 1,
        135, 1, 135, 1, 135, 1, 135, 1, 135, 3, 135, 1750, 8, 135, 1, 136, 1, 136, 1, 136, 1, 136, 1, 136, 1, 136, 1,
        137, 1, 137, 1, 137, 1, 137, 1, 138, 1, 138, 1, 139, 3, 139, 1765, 8, 139, 1, 139, 1, 139, 3, 139, 1769, 8, 139,
        1, 139, 3, 139, 1772, 8, 139, 1, 140, 1, 140, 1, 141, 1, 141, 3, 141, 1778, 8, 141, 1, 142, 1, 142, 1, 142, 1,
        142, 5, 142, 1784, 8, 142, 10, 142, 12, 142, 1787, 9, 142, 3, 142, 1789, 8, 142, 1, 142, 1, 142, 1, 143, 1, 143,
        1, 143, 1, 143, 5, 143, 1797, 8, 143, 10, 143, 12, 143, 1800, 9, 143, 3, 143, 1802, 8, 143, 1, 143, 1, 143, 1,
        144, 1, 144, 1, 144, 1, 144, 5, 144, 1810, 8, 144, 10, 144, 12, 144, 1813, 9, 144, 3, 144, 1815, 8, 144, 1, 144,
        1, 144, 1, 145, 1, 145, 1, 145, 1, 145, 1, 146, 1, 146, 1, 146, 1, 146, 1, 146, 1, 146, 1, 146, 1, 146, 1, 146,
        1, 146, 1, 146, 1, 146, 1, 146, 1, 146, 3, 146, 1837, 8, 146, 1, 146, 1, 146, 1, 146, 3, 146, 1842, 8, 146, 1,
        146, 1, 146, 1, 146, 1, 146, 1, 146, 3, 146, 1849, 8, 146, 1, 146, 1, 146, 1, 146, 3, 146, 1854, 8, 146, 1, 146,
        3, 146, 1857, 8, 146, 1, 147, 1, 147, 1, 147, 1, 147, 1, 147, 1, 147, 1, 147, 3, 147, 1866, 8, 147, 1, 147, 1,
        147, 1, 147, 1, 147, 1, 147, 3, 147, 1873, 8, 147, 1, 147, 1, 147, 1, 147, 1, 147, 1, 147, 3, 147, 1880, 8, 147,
        1, 147, 3, 147, 1883, 8, 147, 1, 147, 1, 147, 1, 147, 1, 147, 3, 147, 1889, 8, 147, 1, 147, 1, 147, 1, 147, 3,
        147, 1894, 8, 147, 1, 147, 3, 147, 1897, 8, 147, 1, 147, 0, 11, 180, 182, 190, 206, 210, 212, 216, 218, 220,
        222, 226, 148, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48,
        50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72, 74, 76, 78, 80, 82, 84, 86, 88, 90, 92, 94, 96, 98, 100, 102,
        104, 106, 108, 110, 112, 114, 116, 118, 120, 122, 124, 126, 128, 130, 132, 134, 136, 138, 140, 142, 144, 146,
        148, 150, 152, 154, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182, 184, 186, 188, 190,
        192, 194, 196, 198, 200, 202, 204, 206, 208, 210, 212, 214, 216, 218, 220, 222, 224, 226, 228, 230, 232, 234,
        236, 238, 240, 242, 244, 246, 248, 250, 252, 254, 256, 258, 260, 262, 264, 266, 268, 270, 272, 274, 276, 278,
        280, 282, 284, 286, 288, 290, 292, 294, 0, 22, 1, 0, 304, 305, 1, 0, 301, 302, 2, 0, 11, 11, 62, 62, 2, 0, 4, 4,
        247, 247, 1, 0, 248, 249, 2, 0, 4, 4, 67, 67, 2, 0, 90, 90, 123, 123, 2, 0, 4, 4, 8, 8, 2, 0, 272, 272, 278,
        278, 2, 0, 282, 285, 287, 288, 2, 0, 280, 280, 286, 286, 1, 0, 272, 273, 2, 0, 274, 275, 278, 278, 1, 0, 267,
        268, 7, 0, 8, 8, 15, 15, 44, 44, 75, 75, 131, 132, 189, 189, 196, 196, 1, 0, 230, 231, 1, 0, 86, 87, 8, 0, 19,
        19, 28, 29, 44, 44, 82, 82, 129, 129, 145, 145, 187, 187, 213, 213, 9, 0, 8, 8, 26, 27, 53, 53, 113, 114, 141,
        141, 170, 170, 188, 188, 236, 236, 252, 269, 3, 0, 26, 27, 91, 91, 220, 220, 2, 0, 55, 56, 144, 144, 1, 0, 201,
        202, 2060, 0, 300, 1, 0, 0, 0, 2, 320, 1, 0, 0, 0, 4, 328, 1, 0, 0, 0, 6, 330, 1, 0, 0, 0, 8, 333, 1, 0, 0, 0,
        10, 336, 1, 0, 0, 0, 12, 339, 1, 0, 0, 0, 14, 342, 1, 0, 0, 0, 16, 344, 1, 0, 0, 0, 18, 346, 1, 0, 0, 0, 20,
        363, 1, 0, 0, 0, 22, 368, 1, 0, 0, 0, 24, 370, 1, 0, 0, 0, 26, 372, 1, 0, 0, 0, 28, 374, 1, 0, 0, 0, 30, 376, 1,
        0, 0, 0, 32, 378, 1, 0, 0, 0, 34, 380, 1, 0, 0, 0, 36, 384, 1, 0, 0, 0, 38, 413, 1, 0, 0, 0, 40, 424, 1, 0, 0,
        0, 42, 426, 1, 0, 0, 0, 44, 448, 1, 0, 0, 0, 46, 450, 1, 0, 0, 0, 48, 460, 1, 0, 0, 0, 50, 467, 1, 0, 0, 0, 52,
        469, 1, 0, 0, 0, 54, 493, 1, 0, 0, 0, 56, 514, 1, 0, 0, 0, 58, 516, 1, 0, 0, 0, 60, 554, 1, 0, 0, 0, 62, 562, 1,
        0, 0, 0, 64, 564, 1, 0, 0, 0, 66, 581, 1, 0, 0, 0, 68, 583, 1, 0, 0, 0, 70, 591, 1, 0, 0, 0, 72, 599, 1, 0, 0,
        0, 74, 602, 1, 0, 0, 0, 76, 617, 1, 0, 0, 0, 78, 627, 1, 0, 0, 0, 80, 634, 1, 0, 0, 0, 82, 646, 1, 0, 0, 0, 84,
        667, 1, 0, 0, 0, 86, 669, 1, 0, 0, 0, 88, 679, 1, 0, 0, 0, 90, 681, 1, 0, 0, 0, 92, 686, 1, 0, 0, 0, 94, 691, 1,
        0, 0, 0, 96, 694, 1, 0, 0, 0, 98, 703, 1, 0, 0, 0, 100, 707, 1, 0, 0, 0, 102, 715, 1, 0, 0, 0, 104, 730, 1, 0,
        0, 0, 106, 747, 1, 0, 0, 0, 108, 749, 1, 0, 0, 0, 110, 773, 1, 0, 0, 0, 112, 775, 1, 0, 0, 0, 114, 783, 1, 0, 0,
        0, 116, 790, 1, 0, 0, 0, 118, 792, 1, 0, 0, 0, 120, 801, 1, 0, 0, 0, 122, 805, 1, 0, 0, 0, 124, 815, 1, 0, 0, 0,
        126, 823, 1, 0, 0, 0, 128, 839, 1, 0, 0, 0, 130, 843, 1, 0, 0, 0, 132, 848, 1, 0, 0, 0, 134, 858, 1, 0, 0, 0,
        136, 868, 1, 0, 0, 0, 138, 878, 1, 0, 0, 0, 140, 881, 1, 0, 0, 0, 142, 890, 1, 0, 0, 0, 144, 909, 1, 0, 0, 0,
        146, 911, 1, 0, 0, 0, 148, 914, 1, 0, 0, 0, 150, 917, 1, 0, 0, 0, 152, 920, 1, 0, 0, 0, 154, 924, 1, 0, 0, 0,
        156, 929, 1, 0, 0, 0, 158, 940, 1, 0, 0, 0, 160, 954, 1, 0, 0, 0, 162, 967, 1, 0, 0, 0, 164, 969, 1, 0, 0, 0,
        166, 972, 1, 0, 0, 0, 168, 974, 1, 0, 0, 0, 170, 995, 1, 0, 0, 0, 172, 1035, 1, 0, 0, 0, 174, 1045, 1, 0, 0, 0,
        176, 1081, 1, 0, 0, 0, 178, 1083, 1, 0, 0, 0, 180, 1096, 1, 0, 0, 0, 182, 1107, 1, 0, 0, 0, 184, 1121, 1, 0, 0,
        0, 186, 1129, 1, 0, 0, 0, 188, 1143, 1, 0, 0, 0, 190, 1151, 1, 0, 0, 0, 192, 1178, 1, 0, 0, 0, 194, 1203, 1, 0,
        0, 0, 196, 1205, 1, 0, 0, 0, 198, 1221, 1, 0, 0, 0, 200, 1223, 1, 0, 0, 0, 202, 1240, 1, 0, 0, 0, 204, 1242, 1,
        0, 0, 0, 206, 1244, 1, 0, 0, 0, 208, 1306, 1, 0, 0, 0, 210, 1308, 1, 0, 0, 0, 212, 1319, 1, 0, 0, 0, 214, 1333,
        1, 0, 0, 0, 216, 1335, 1, 0, 0, 0, 218, 1386, 1, 0, 0, 0, 220, 1397, 1, 0, 0, 0, 222, 1408, 1, 0, 0, 0, 224,
        1422, 1, 0, 0, 0, 226, 1445, 1, 0, 0, 0, 228, 1469, 1, 0, 0, 0, 230, 1471, 1, 0, 0, 0, 232, 1478, 1, 0, 0, 0,
        234, 1490, 1, 0, 0, 0, 236, 1509, 1, 0, 0, 0, 238, 1518, 1, 0, 0, 0, 240, 1529, 1, 0, 0, 0, 242, 1539, 1, 0, 0,
        0, 244, 1579, 1, 0, 0, 0, 246, 1595, 1, 0, 0, 0, 248, 1623, 1, 0, 0, 0, 250, 1637, 1, 0, 0, 0, 252, 1639, 1, 0,
        0, 0, 254, 1653, 1, 0, 0, 0, 256, 1660, 1, 0, 0, 0, 258, 1667, 1, 0, 0, 0, 260, 1674, 1, 0, 0, 0, 262, 1681, 1,
        0, 0, 0, 264, 1695, 1, 0, 0, 0, 266, 1704, 1, 0, 0, 0, 268, 1736, 1, 0, 0, 0, 270, 1749, 1, 0, 0, 0, 272, 1751,
        1, 0, 0, 0, 274, 1757, 1, 0, 0, 0, 276, 1761, 1, 0, 0, 0, 278, 1771, 1, 0, 0, 0, 280, 1773, 1, 0, 0, 0, 282,
        1777, 1, 0, 0, 0, 284, 1779, 1, 0, 0, 0, 286, 1792, 1, 0, 0, 0, 288, 1805, 1, 0, 0, 0, 290, 1818, 1, 0, 0, 0,
        292, 1856, 1, 0, 0, 0, 294, 1896, 1, 0, 0, 0, 296, 298, 3, 2, 1, 0, 297, 299, 5, 298, 0, 0, 298, 297, 1, 0, 0,
        0, 298, 299, 1, 0, 0, 0, 299, 301, 1, 0, 0, 0, 300, 296, 1, 0, 0, 0, 301, 302, 1, 0, 0, 0, 302, 300, 1, 0, 0, 0,
        302, 303, 1, 0, 0, 0, 303, 304, 1, 0, 0, 0, 304, 305, 5, 0, 0, 1, 305, 1, 1, 0, 0, 0, 306, 318, 5, 83, 0, 0,
        307, 308, 5, 295, 0, 0, 308, 313, 3, 6, 3, 0, 309, 310, 5, 271, 0, 0, 310, 312, 3, 6, 3, 0, 311, 309, 1, 0, 0,
        0, 312, 315, 1, 0, 0, 0, 313, 311, 1, 0, 0, 0, 313, 314, 1, 0, 0, 0, 314, 316, 1, 0, 0, 0, 315, 313, 1, 0, 0, 0,
        316, 317, 5, 296, 0, 0, 317, 319, 1, 0, 0, 0, 318, 307, 1, 0, 0, 0, 318, 319, 1, 0, 0, 0, 319, 321, 1, 0, 0, 0,
        320, 306, 1, 0, 0, 0, 320, 321, 1, 0, 0, 0, 321, 322, 1, 0, 0, 0, 322, 323, 3, 4, 2, 0, 323, 3, 1, 0, 0, 0, 324,
        329, 3, 16, 8, 0, 325, 329, 3, 60, 30, 0, 326, 329, 3, 36, 18, 0, 327, 329, 3, 18, 9, 0, 328, 324, 1, 0, 0, 0,
        328, 325, 1, 0, 0, 0, 328, 326, 1, 0, 0, 0, 328, 327, 1, 0, 0, 0, 329, 5, 1, 0, 0, 0, 330, 331, 5, 304, 0, 0,
        331, 332, 5, 304, 0, 0, 332, 7, 1, 0, 0, 0, 333, 334, 5, 10, 0, 0, 334, 335, 3, 14, 7, 0, 335, 9, 1, 0, 0, 0,
        336, 337, 5, 13, 0, 0, 337, 338, 3, 14, 7, 0, 338, 11, 1, 0, 0, 0, 339, 340, 5, 20, 0, 0, 340, 341, 3, 14, 7, 0,
        341, 13, 1, 0, 0, 0, 342, 343, 7, 0, 0, 0, 343, 15, 1, 0, 0, 0, 344, 345, 3, 204, 102, 0, 345, 17, 1, 0, 0, 0,
        346, 347, 5, 80, 0, 0, 347, 356, 3, 204, 102, 0, 348, 353, 3, 204, 102, 0, 349, 350, 5, 271, 0, 0, 350, 352, 3,
        204, 102, 0, 351, 349, 1, 0, 0, 0, 352, 355, 1, 0, 0, 0, 353, 351, 1, 0, 0, 0, 353, 354, 1, 0, 0, 0, 354, 357,
        1, 0, 0, 0, 355, 353, 1, 0, 0, 0, 356, 348, 1, 0, 0, 0, 356, 357, 1, 0, 0, 0, 357, 19, 1, 0, 0, 0, 358, 359, 3,
        14, 7, 0, 359, 360, 5, 300, 0, 0, 360, 362, 1, 0, 0, 0, 361, 358, 1, 0, 0, 0, 362, 365, 1, 0, 0, 0, 363, 361, 1,
        0, 0, 0, 363, 364, 1, 0, 0, 0, 364, 366, 1, 0, 0, 0, 365, 363, 1, 0, 0, 0, 366, 367, 3, 14, 7, 0, 367, 21, 1, 0,
        0, 0, 368, 369, 3, 14, 7, 0, 369, 23, 1, 0, 0, 0, 370, 371, 3, 14, 7, 0, 371, 25, 1, 0, 0, 0, 372, 373, 3, 14,
        7, 0, 373, 27, 1, 0, 0, 0, 374, 375, 3, 14, 7, 0, 375, 29, 1, 0, 0, 0, 376, 377, 5, 304, 0, 0, 377, 31, 1, 0, 0,
        0, 378, 379, 7, 1, 0, 0, 379, 33, 1, 0, 0, 0, 380, 381, 7, 2, 0, 0, 381, 35, 1, 0, 0, 0, 382, 385, 3, 38, 19, 0,
        383, 385, 3, 40, 20, 0, 384, 382, 1, 0, 0, 0, 384, 383, 1, 0, 0, 0, 385, 37, 1, 0, 0, 0, 386, 387, 5, 45, 0, 0,
        387, 388, 5, 198, 0, 0, 388, 393, 3, 20, 10, 0, 389, 390, 5, 295, 0, 0, 390, 391, 3, 42, 21, 0, 391, 392, 5,
        296, 0, 0, 392, 394, 1, 0, 0, 0, 393, 389, 1, 0, 0, 0, 393, 394, 1, 0, 0, 0, 394, 396, 1, 0, 0, 0, 395, 397, 3,
        52, 26, 0, 396, 395, 1, 0, 0, 0, 396, 397, 1, 0, 0, 0, 397, 414, 1, 0, 0, 0, 398, 399, 5, 45, 0, 0, 399, 400, 5,
        242, 0, 0, 400, 401, 5, 147, 0, 0, 401, 402, 3, 14, 7, 0, 402, 403, 5, 295, 0, 0, 403, 408, 3, 64, 32, 0, 404,
        405, 5, 271, 0, 0, 405, 407, 3, 64, 32, 0, 406, 404, 1, 0, 0, 0, 407, 410, 1, 0, 0, 0, 408, 406, 1, 0, 0, 0,
        408, 409, 1, 0, 0, 0, 409, 411, 1, 0, 0, 0, 410, 408, 1, 0, 0, 0, 411, 412, 5, 296, 0, 0, 412, 414, 1, 0, 0, 0,
        413, 386, 1, 0, 0, 0, 413, 398, 1, 0, 0, 0, 414, 39, 1, 0, 0, 0, 415, 416, 5, 70, 0, 0, 416, 417, 5, 198, 0, 0,
        417, 425, 3, 20, 10, 0, 418, 419, 5, 70, 0, 0, 419, 420, 5, 242, 0, 0, 420, 421, 3, 14, 7, 0, 421, 422, 5, 147,
        0, 0, 422, 423, 3, 14, 7, 0, 423, 425, 1, 0, 0, 0, 424, 415, 1, 0, 0, 0, 424, 418, 1, 0, 0, 0, 425, 41, 1, 0, 0,
        0, 426, 431, 3, 44, 22, 0, 427, 428, 5, 271, 0, 0, 428, 430, 3, 44, 22, 0, 429, 427, 1, 0, 0, 0, 430, 433, 1, 0,
        0, 0, 431, 429, 1, 0, 0, 0, 431, 432, 1, 0, 0, 0, 432, 43, 1, 0, 0, 0, 433, 431, 1, 0, 0, 0, 434, 435, 3, 26,
        13, 0, 435, 439, 3, 294, 147, 0, 436, 438, 3, 48, 24, 0, 437, 436, 1, 0, 0, 0, 438, 441, 1, 0, 0, 0, 439, 437,
        1, 0, 0, 0, 439, 440, 1, 0, 0, 0, 440, 449, 1, 0, 0, 0, 441, 439, 1, 0, 0, 0, 442, 443, 5, 164, 0, 0, 443, 444,
        5, 121, 0, 0, 444, 445, 5, 295, 0, 0, 445, 446, 3, 46, 23, 0, 446, 447, 5, 296, 0, 0, 447, 449, 1, 0, 0, 0, 448,
        434, 1, 0, 0, 0, 448, 442, 1, 0, 0, 0, 449, 45, 1, 0, 0, 0, 450, 455, 3, 26, 13, 0, 451, 452, 5, 271, 0, 0, 452,
        454, 3, 26, 13, 0, 453, 451, 1, 0, 0, 0, 454, 457, 1, 0, 0, 0, 455, 453, 1, 0, 0, 0, 455, 456, 1, 0, 0, 0, 456,
        47, 1, 0, 0, 0, 457, 455, 1, 0, 0, 0, 458, 459, 5, 39, 0, 0, 459, 461, 3, 28, 14, 0, 460, 458, 1, 0, 0, 0, 460,
        461, 1, 0, 0, 0, 461, 462, 1, 0, 0, 0, 462, 463, 3, 50, 25, 0, 463, 49, 1, 0, 0, 0, 464, 465, 5, 140, 0, 0, 465,
        468, 5, 141, 0, 0, 466, 468, 5, 141, 0, 0, 467, 464, 1, 0, 0, 0, 467, 466, 1, 0, 0, 0, 468, 51, 1, 0, 0, 0, 469,
        470, 5, 226, 0, 0, 470, 475, 3, 54, 27, 0, 471, 472, 5, 7, 0, 0, 472, 474, 3, 54, 27, 0, 473, 471, 1, 0, 0, 0,
        474, 477, 1, 0, 0, 0, 475, 473, 1, 0, 0, 0, 475, 476, 1, 0, 0, 0, 476, 53, 1, 0, 0, 0, 477, 475, 1, 0, 0, 0,
        478, 479, 3, 30, 15, 0, 479, 480, 5, 284, 0, 0, 480, 481, 3, 56, 28, 0, 481, 494, 1, 0, 0, 0, 482, 483, 3, 30,
        15, 0, 483, 484, 5, 284, 0, 0, 484, 485, 3, 32, 16, 0, 485, 494, 1, 0, 0, 0, 486, 487, 5, 251, 0, 0, 487, 488,
        5, 152, 0, 0, 488, 489, 5, 20, 0, 0, 489, 490, 5, 295, 0, 0, 490, 491, 3, 58, 29, 0, 491, 492, 5, 296, 0, 0,
        492, 494, 1, 0, 0, 0, 493, 478, 1, 0, 0, 0, 493, 482, 1, 0, 0, 0, 493, 486, 1, 0, 0, 0, 494, 55, 1, 0, 0, 0,
        495, 496, 5, 293, 0, 0, 496, 501, 3, 56, 28, 0, 497, 498, 5, 271, 0, 0, 498, 500, 3, 56, 28, 0, 499, 497, 1, 0,
        0, 0, 500, 503, 1, 0, 0, 0, 501, 499, 1, 0, 0, 0, 501, 502, 1, 0, 0, 0, 502, 504, 1, 0, 0, 0, 503, 501, 1, 0, 0,
        0, 504, 505, 5, 294, 0, 0, 505, 515, 1, 0, 0, 0, 506, 507, 3, 32, 16, 0, 507, 508, 5, 297, 0, 0, 508, 509, 3,
        32, 16, 0, 509, 515, 1, 0, 0, 0, 510, 511, 3, 32, 16, 0, 511, 512, 5, 297, 0, 0, 512, 513, 3, 56, 28, 0, 513,
        515, 1, 0, 0, 0, 514, 495, 1, 0, 0, 0, 514, 506, 1, 0, 0, 0, 514, 510, 1, 0, 0, 0, 515, 57, 1, 0, 0, 0, 516,
        517, 3, 26, 13, 0, 517, 524, 3, 34, 17, 0, 518, 519, 5, 271, 0, 0, 519, 520, 3, 26, 13, 0, 520, 521, 3, 34, 17,
        0, 521, 523, 1, 0, 0, 0, 522, 518, 1, 0, 0, 0, 523, 526, 1, 0, 0, 0, 524, 522, 1, 0, 0, 0, 524, 525, 1, 0, 0, 0,
        525, 59, 1, 0, 0, 0, 526, 524, 1, 0, 0, 0, 527, 529, 3, 94, 47, 0, 528, 530, 3, 62, 31, 0, 529, 528, 1, 0, 0, 0,
        530, 531, 1, 0, 0, 0, 531, 529, 1, 0, 0, 0, 531, 532, 1, 0, 0, 0, 532, 534, 1, 0, 0, 0, 533, 535, 3, 108, 54, 0,
        534, 533, 1, 0, 0, 0, 534, 535, 1, 0, 0, 0, 535, 537, 1, 0, 0, 0, 536, 538, 3, 102, 51, 0, 537, 536, 1, 0, 0, 0,
        537, 538, 1, 0, 0, 0, 538, 555, 1, 0, 0, 0, 539, 541, 3, 146, 73, 0, 540, 542, 3, 108, 54, 0, 541, 540, 1, 0, 0,
        0, 541, 542, 1, 0, 0, 0, 542, 544, 1, 0, 0, 0, 543, 545, 3, 62, 31, 0, 544, 543, 1, 0, 0, 0, 545, 546, 1, 0, 0,
        0, 546, 544, 1, 0, 0, 0, 546, 547, 1, 0, 0, 0, 547, 549, 1, 0, 0, 0, 548, 550, 3, 102, 51, 0, 549, 548, 1, 0, 0,
        0, 549, 550, 1, 0, 0, 0, 550, 555, 1, 0, 0, 0, 551, 555, 3, 100, 50, 0, 552, 555, 3, 74, 37, 0, 553, 555, 3, 62,
        31, 0, 554, 527, 1, 0, 0, 0, 554, 539, 1, 0, 0, 0, 554, 551, 1, 0, 0, 0, 554, 552, 1, 0, 0, 0, 554, 553, 1, 0,
        0, 0, 555, 61, 1, 0, 0, 0, 556, 563, 3, 76, 38, 0, 557, 563, 3, 80, 40, 0, 558, 563, 3, 96, 48, 0, 559, 563, 3,
        68, 34, 0, 560, 563, 3, 72, 36, 0, 561, 563, 3, 70, 35, 0, 562, 556, 1, 0, 0, 0, 562, 557, 1, 0, 0, 0, 562, 558,
        1, 0, 0, 0, 562, 559, 1, 0, 0, 0, 562, 560, 1, 0, 0, 0, 562, 561, 1, 0, 0, 0, 563, 63, 1, 0, 0, 0, 564, 568, 3,
        14, 7, 0, 565, 567, 3, 66, 33, 0, 566, 565, 1, 0, 0, 0, 567, 570, 1, 0, 0, 0, 568, 566, 1, 0, 0, 0, 568, 569, 1,
        0, 0, 0, 569, 65, 1, 0, 0, 0, 570, 568, 1, 0, 0, 0, 571, 572, 5, 291, 0, 0, 572, 573, 3, 292, 146, 0, 573, 574,
        5, 292, 0, 0, 574, 582, 1, 0, 0, 0, 575, 576, 5, 291, 0, 0, 576, 577, 3, 14, 7, 0, 577, 578, 5, 292, 0, 0, 578,
        582, 1, 0, 0, 0, 579, 580, 5, 300, 0, 0, 580, 582, 3, 14, 7, 0, 581, 571, 1, 0, 0, 0, 581, 575, 1, 0, 0, 0, 581,
        579, 1, 0, 0, 0, 582, 67, 1, 0, 0, 0, 583, 584, 5, 173, 0, 0, 584, 585, 5, 117, 0, 0, 585, 587, 3, 14, 7, 0,
        586, 588, 3, 8, 4, 0, 587, 586, 1, 0, 0, 0, 587, 588, 1, 0, 0, 0, 588, 589, 1, 0, 0, 0, 589, 590, 3, 204, 102,
        0, 590, 69, 1, 0, 0, 0, 591, 592, 5, 214, 0, 0, 592, 593, 5, 117, 0, 0, 593, 595, 3, 14, 7, 0, 594, 596, 3, 8,
        4, 0, 595, 594, 1, 0, 0, 0, 595, 596, 1, 0, 0, 0, 596, 597, 1, 0, 0, 0, 597, 598, 3, 204, 102, 0, 598, 71, 1, 0,
        0, 0, 599, 600, 5, 241, 0, 0, 600, 601, 3, 64, 32, 0, 601, 73, 1, 0, 0, 0, 602, 603, 5, 112, 0, 0, 603, 604, 5,
        117, 0, 0, 604, 605, 3, 64, 32, 0, 605, 606, 5, 218, 0, 0, 606, 609, 3, 204, 102, 0, 607, 608, 5, 13, 0, 0, 608,
        610, 3, 204, 102, 0, 609, 607, 1, 0, 0, 0, 609, 610, 1, 0, 0, 0, 610, 612, 1, 0, 0, 0, 611, 613, 3, 82, 41, 0,
        612, 611, 1, 0, 0, 0, 612, 613, 1, 0, 0, 0, 613, 615, 1, 0, 0, 0, 614, 616, 3, 102, 51, 0, 615, 614, 1, 0, 0, 0,
        615, 616, 1, 0, 0, 0, 616, 75, 1, 0, 0, 0, 617, 618, 5, 112, 0, 0, 618, 619, 5, 117, 0, 0, 619, 621, 3, 14, 7,
        0, 620, 622, 3, 8, 4, 0, 621, 620, 1, 0, 0, 0, 621, 622, 1, 0, 0, 0, 622, 623, 1, 0, 0, 0, 623, 625, 3, 204,
        102, 0, 624, 626, 3, 78, 39, 0, 625, 624, 1, 0, 0, 0, 625, 626, 1, 0, 0, 0, 626, 77, 1, 0, 0, 0, 627, 628, 5,
        147, 0, 0, 628, 630, 5, 244, 0, 0, 629, 631, 3, 84, 42, 0, 630, 629, 1, 0, 0, 0, 630, 631, 1, 0, 0, 0, 631, 632,
        1, 0, 0, 0, 632, 633, 3, 88, 44, 0, 633, 79, 1, 0, 0, 0, 634, 635, 5, 112, 0, 0, 635, 636, 5, 117, 0, 0, 636,
        637, 3, 64, 32, 0, 637, 638, 5, 218, 0, 0, 638, 641, 3, 204, 102, 0, 639, 640, 5, 13, 0, 0, 640, 642, 3, 204,
        102, 0, 641, 639, 1, 0, 0, 0, 641, 642, 1, 0, 0, 0, 642, 644, 1, 0, 0, 0, 643, 645, 3, 82, 41, 0, 644, 643, 1,
        0, 0, 0, 644, 645, 1, 0, 0, 0, 645, 81, 1, 0, 0, 0, 646, 647, 5, 147, 0, 0, 647, 648, 5, 244, 0, 0, 648, 649, 5,
        225, 0, 0, 649, 650, 3, 204, 102, 0, 650, 651, 5, 245, 0, 0, 651, 652, 5, 250, 0, 0, 652, 83, 1, 0, 0, 0, 653,
        654, 5, 295, 0, 0, 654, 659, 3, 14, 7, 0, 655, 656, 5, 271, 0, 0, 656, 658, 3, 14, 7, 0, 657, 655, 1, 0, 0, 0,
        658, 661, 1, 0, 0, 0, 659, 657, 1, 0, 0, 0, 659, 660, 1, 0, 0, 0, 660, 662, 1, 0, 0, 0, 661, 659, 1, 0, 0, 0,
        662, 663, 5, 296, 0, 0, 663, 668, 1, 0, 0, 0, 664, 665, 5, 147, 0, 0, 665, 666, 5, 39, 0, 0, 666, 668, 3, 86,
        43, 0, 667, 653, 1, 0, 0, 0, 667, 664, 1, 0, 0, 0, 668, 85, 1, 0, 0, 0, 669, 670, 3, 14, 7, 0, 670, 87, 1, 0, 0,
        0, 671, 672, 5, 245, 0, 0, 672, 680, 5, 250, 0, 0, 673, 674, 5, 245, 0, 0, 674, 675, 5, 173, 0, 0, 675, 680, 3,
        90, 45, 0, 676, 677, 5, 245, 0, 0, 677, 678, 5, 212, 0, 0, 678, 680, 3, 92, 46, 0, 679, 671, 1, 0, 0, 0, 679,
        673, 1, 0, 0, 0, 679, 676, 1, 0, 0, 0, 680, 89, 1, 0, 0, 0, 681, 684, 5, 79, 0, 0, 682, 683, 5, 225, 0, 0, 683,
        685, 3, 204, 102, 0, 684, 682, 1, 0, 0, 0, 684, 685, 1, 0, 0, 0, 685, 91, 1, 0, 0, 0, 686, 689, 5, 79, 0, 0,
        687, 688, 5, 225, 0, 0, 688, 690, 3, 204, 102, 0, 689, 687, 1, 0, 0, 0, 689, 690, 1, 0, 0, 0, 690, 93, 1, 0, 0,
        0, 691, 692, 5, 212, 0, 0, 692, 693, 3, 194, 97, 0, 693, 95, 1, 0, 0, 0, 694, 695, 5, 185, 0, 0, 695, 700, 3,
        98, 49, 0, 696, 697, 5, 271, 0, 0, 697, 699, 3, 98, 49, 0, 698, 696, 1, 0, 0, 0, 699, 702, 1, 0, 0, 0, 700, 698,
        1, 0, 0, 0, 700, 701, 1, 0, 0, 0, 701, 97, 1, 0, 0, 0, 702, 700, 1, 0, 0, 0, 703, 704, 3, 64, 32, 0, 704, 705,
        5, 284, 0, 0, 705, 706, 3, 204, 102, 0, 706, 99, 1, 0, 0, 0, 707, 708, 5, 61, 0, 0, 708, 710, 3, 106, 53, 0,
        709, 711, 3, 108, 54, 0, 710, 709, 1, 0, 0, 0, 710, 711, 1, 0, 0, 0, 711, 713, 1, 0, 0, 0, 712, 714, 3, 102, 51,
        0, 713, 712, 1, 0, 0, 0, 713, 714, 1, 0, 0, 0, 714, 101, 1, 0, 0, 0, 715, 716, 5, 246, 0, 0, 716, 721, 3, 104,
        52, 0, 717, 718, 5, 271, 0, 0, 718, 720, 3, 104, 52, 0, 719, 717, 1, 0, 0, 0, 720, 723, 1, 0, 0, 0, 721, 719, 1,
        0, 0, 0, 721, 722, 1, 0, 0, 0, 722, 103, 1, 0, 0, 0, 723, 721, 1, 0, 0, 0, 724, 725, 7, 3, 0, 0, 725, 726, 7, 4,
        0, 0, 726, 731, 5, 278, 0, 0, 727, 728, 7, 3, 0, 0, 728, 729, 7, 4, 0, 0, 729, 731, 3, 204, 102, 0, 730, 724, 1,
        0, 0, 0, 730, 727, 1, 0, 0, 0, 731, 105, 1, 0, 0, 0, 732, 733, 5, 95, 0, 0, 733, 735, 3, 64, 32, 0, 734, 736, 3,
        8, 4, 0, 735, 734, 1, 0, 0, 0, 735, 736, 1, 0, 0, 0, 736, 738, 1, 0, 0, 0, 737, 739, 3, 10, 5, 0, 738, 737, 1,
        0, 0, 0, 738, 739, 1, 0, 0, 0, 739, 741, 1, 0, 0, 0, 740, 742, 3, 12, 6, 0, 741, 740, 1, 0, 0, 0, 741, 742, 1,
        0, 0, 0, 742, 748, 1, 0, 0, 0, 743, 744, 5, 95, 0, 0, 744, 745, 3, 64, 32, 0, 745, 746, 3, 14, 7, 0, 746, 748,
        1, 0, 0, 0, 747, 732, 1, 0, 0, 0, 747, 743, 1, 0, 0, 0, 748, 107, 1, 0, 0, 0, 749, 750, 5, 225, 0, 0, 750, 751,
        3, 204, 102, 0, 751, 109, 1, 0, 0, 0, 752, 754, 5, 182, 0, 0, 753, 755, 3, 116, 58, 0, 754, 753, 1, 0, 0, 0,
        754, 755, 1, 0, 0, 0, 755, 756, 1, 0, 0, 0, 756, 774, 5, 278, 0, 0, 757, 759, 5, 182, 0, 0, 758, 760, 3, 116,
        58, 0, 759, 758, 1, 0, 0, 0, 759, 760, 1, 0, 0, 0, 760, 761, 1, 0, 0, 0, 761, 774, 3, 112, 56, 0, 762, 764, 5,
        182, 0, 0, 763, 765, 3, 116, 58, 0, 764, 763, 1, 0, 0, 0, 764, 765, 1, 0, 0, 0, 765, 766, 1, 0, 0, 0, 766, 767,
        5, 218, 0, 0, 767, 774, 3, 204, 102, 0, 768, 769, 5, 237, 0, 0, 769, 770, 3, 204, 102, 0, 770, 771, 5, 13, 0, 0,
        771, 772, 3, 204, 102, 0, 772, 774, 1, 0, 0, 0, 773, 752, 1, 0, 0, 0, 773, 757, 1, 0, 0, 0, 773, 762, 1, 0, 0,
        0, 773, 768, 1, 0, 0, 0, 774, 111, 1, 0, 0, 0, 775, 780, 3, 114, 57, 0, 776, 777, 5, 271, 0, 0, 777, 779, 3,
        114, 57, 0, 778, 776, 1, 0, 0, 0, 779, 782, 1, 0, 0, 0, 780, 778, 1, 0, 0, 0, 780, 781, 1, 0, 0, 0, 781, 113, 1,
        0, 0, 0, 782, 780, 1, 0, 0, 0, 783, 788, 3, 204, 102, 0, 784, 786, 5, 10, 0, 0, 785, 784, 1, 0, 0, 0, 785, 786,
        1, 0, 0, 0, 786, 787, 1, 0, 0, 0, 787, 789, 3, 14, 7, 0, 788, 785, 1, 0, 0, 0, 788, 789, 1, 0, 0, 0, 789, 115,
        1, 0, 0, 0, 790, 791, 7, 5, 0, 0, 791, 117, 1, 0, 0, 0, 792, 793, 5, 243, 0, 0, 793, 798, 3, 120, 60, 0, 794,
        795, 5, 271, 0, 0, 795, 797, 3, 120, 60, 0, 796, 794, 1, 0, 0, 0, 797, 800, 1, 0, 0, 0, 798, 796, 1, 0, 0, 0,
        798, 799, 1, 0, 0, 0, 799, 119, 1, 0, 0, 0, 800, 798, 1, 0, 0, 0, 801, 802, 3, 204, 102, 0, 802, 803, 5, 10, 0,
        0, 803, 804, 3, 14, 7, 0, 804, 121, 1, 0, 0, 0, 805, 806, 5, 152, 0, 0, 806, 807, 5, 20, 0, 0, 807, 812, 3, 124,
        62, 0, 808, 809, 5, 271, 0, 0, 809, 811, 3, 124, 62, 0, 810, 808, 1, 0, 0, 0, 811, 814, 1, 0, 0, 0, 812, 810, 1,
        0, 0, 0, 812, 813, 1, 0, 0, 0, 813, 123, 1, 0, 0, 0, 814, 812, 1, 0, 0, 0, 815, 817, 3, 204, 102, 0, 816, 818,
        7, 2, 0, 0, 817, 816, 1, 0, 0, 0, 817, 818, 1, 0, 0, 0, 818, 821, 1, 0, 0, 0, 819, 820, 5, 142, 0, 0, 820, 822,
        7, 6, 0, 0, 821, 819, 1, 0, 0, 0, 821, 822, 1, 0, 0, 0, 822, 125, 1, 0, 0, 0, 823, 825, 5, 102, 0, 0, 824, 826,
        5, 158, 0, 0, 825, 824, 1, 0, 0, 0, 825, 826, 1, 0, 0, 0, 826, 827, 1, 0, 0, 0, 827, 828, 5, 20, 0, 0, 828, 833,
        3, 130, 65, 0, 829, 830, 5, 271, 0, 0, 830, 832, 3, 130, 65, 0, 831, 829, 1, 0, 0, 0, 832, 835, 1, 0, 0, 0, 833,
        831, 1, 0, 0, 0, 833, 834, 1, 0, 0, 0, 834, 837, 1, 0, 0, 0, 835, 833, 1, 0, 0, 0, 836, 838, 3, 128, 64, 0, 837,
        836, 1, 0, 0, 0, 837, 838, 1, 0, 0, 0, 838, 127, 1, 0, 0, 0, 839, 840, 5, 102, 0, 0, 840, 841, 5, 10, 0, 0, 841,
        842, 3, 14, 7, 0, 842, 129, 1, 0, 0, 0, 843, 846, 3, 208, 104, 0, 844, 845, 5, 10, 0, 0, 845, 847, 3, 14, 7, 0,
        846, 844, 1, 0, 0, 0, 846, 847, 1, 0, 0, 0, 847, 131, 1, 0, 0, 0, 848, 849, 5, 232, 0, 0, 849, 851, 5, 295, 0,
        0, 850, 852, 3, 134, 67, 0, 851, 850, 1, 0, 0, 0, 851, 852, 1, 0, 0, 0, 852, 854, 1, 0, 0, 0, 853, 855, 3, 136,
        68, 0, 854, 853, 1, 0, 0, 0, 854, 855, 1, 0, 0, 0, 855, 856, 1, 0, 0, 0, 856, 857, 5, 296, 0, 0, 857, 133, 1, 0,
        0, 0, 858, 859, 5, 233, 0, 0, 859, 860, 5, 20, 0, 0, 860, 865, 3, 204, 102, 0, 861, 862, 5, 271, 0, 0, 862, 864,
        3, 204, 102, 0, 863, 861, 1, 0, 0, 0, 864, 867, 1, 0, 0, 0, 865, 863, 1, 0, 0, 0, 865, 866, 1, 0, 0, 0, 866,
        135, 1, 0, 0, 0, 867, 865, 1, 0, 0, 0, 868, 869, 5, 152, 0, 0, 869, 870, 5, 20, 0, 0, 870, 875, 3, 124, 62, 0,
        871, 872, 5, 271, 0, 0, 872, 874, 3, 124, 62, 0, 873, 871, 1, 0, 0, 0, 874, 877, 1, 0, 0, 0, 875, 873, 1, 0, 0,
        0, 875, 876, 1, 0, 0, 0, 876, 137, 1, 0, 0, 0, 877, 875, 1, 0, 0, 0, 878, 879, 5, 103, 0, 0, 879, 880, 3, 208,
        104, 0, 880, 139, 1, 0, 0, 0, 881, 882, 5, 78, 0, 0, 882, 887, 3, 142, 71, 0, 883, 884, 5, 271, 0, 0, 884, 886,
        3, 142, 71, 0, 885, 883, 1, 0, 0, 0, 886, 889, 1, 0, 0, 0, 887, 885, 1, 0, 0, 0, 887, 888, 1, 0, 0, 0, 888, 141,
        1, 0, 0, 0, 889, 887, 1, 0, 0, 0, 890, 892, 3, 14, 7, 0, 891, 893, 3, 144, 72, 0, 892, 891, 1, 0, 0, 0, 893,
        894, 1, 0, 0, 0, 894, 892, 1, 0, 0, 0, 894, 895, 1, 0, 0, 0, 895, 143, 1, 0, 0, 0, 896, 897, 5, 300, 0, 0, 897,
        910, 3, 14, 7, 0, 898, 899, 5, 291, 0, 0, 899, 900, 5, 301, 0, 0, 900, 910, 5, 292, 0, 0, 901, 902, 5, 291, 0,
        0, 902, 903, 5, 302, 0, 0, 903, 910, 5, 292, 0, 0, 904, 905, 5, 291, 0, 0, 905, 906, 5, 278, 0, 0, 906, 910, 5,
        292, 0, 0, 907, 908, 5, 300, 0, 0, 908, 910, 5, 278, 0, 0, 909, 896, 1, 0, 0, 0, 909, 898, 1, 0, 0, 0, 909, 901,
        1, 0, 0, 0, 909, 904, 1, 0, 0, 0, 909, 907, 1, 0, 0, 0, 910, 145, 1, 0, 0, 0, 911, 912, 5, 95, 0, 0, 912, 913,
        3, 190, 95, 0, 913, 147, 1, 0, 0, 0, 914, 915, 5, 225, 0, 0, 915, 916, 3, 208, 104, 0, 916, 149, 1, 0, 0, 0,
        917, 918, 5, 240, 0, 0, 918, 919, 3, 208, 104, 0, 919, 151, 1, 0, 0, 0, 920, 921, 5, 239, 0, 0, 921, 922, 3,
        208, 104, 0, 922, 153, 1, 0, 0, 0, 923, 925, 3, 162, 81, 0, 924, 923, 1, 0, 0, 0, 924, 925, 1, 0, 0, 0, 925,
        926, 1, 0, 0, 0, 926, 927, 3, 158, 79, 0, 927, 155, 1, 0, 0, 0, 928, 930, 3, 162, 81, 0, 929, 928, 1, 0, 0, 0,
        929, 930, 1, 0, 0, 0, 930, 931, 1, 0, 0, 0, 931, 936, 3, 158, 79, 0, 932, 933, 5, 271, 0, 0, 933, 935, 3, 158,
        79, 0, 934, 932, 1, 0, 0, 0, 935, 938, 1, 0, 0, 0, 936, 934, 1, 0, 0, 0, 936, 937, 1, 0, 0, 0, 937, 157, 1, 0,
        0, 0, 938, 936, 1, 0, 0, 0, 939, 941, 3, 166, 83, 0, 940, 939, 1, 0, 0, 0, 940, 941, 1, 0, 0, 0, 941, 943, 1, 0,
        0, 0, 942, 944, 3, 164, 82, 0, 943, 942, 1, 0, 0, 0, 943, 944, 1, 0, 0, 0, 944, 948, 1, 0, 0, 0, 945, 947, 3,
        160, 80, 0, 946, 945, 1, 0, 0, 0, 947, 950, 1, 0, 0, 0, 948, 946, 1, 0, 0, 0, 948, 949, 1, 0, 0, 0, 949, 159, 1,
        0, 0, 0, 950, 948, 1, 0, 0, 0, 951, 955, 3, 168, 84, 0, 952, 955, 3, 170, 85, 0, 953, 955, 3, 172, 86, 0, 954,
        951, 1, 0, 0, 0, 954, 952, 1, 0, 0, 0, 954, 953, 1, 0, 0, 0, 955, 161, 1, 0, 0, 0, 956, 957, 7, 7, 0, 0, 957,
        968, 5, 186, 0, 0, 958, 960, 5, 8, 0, 0, 959, 961, 5, 302, 0, 0, 960, 959, 1, 0, 0, 0, 960, 961, 1, 0, 0, 0,
        961, 968, 1, 0, 0, 0, 962, 963, 5, 186, 0, 0, 963, 965, 5, 302, 0, 0, 964, 966, 5, 102, 0, 0, 965, 964, 1, 0, 0,
        0, 965, 966, 1, 0, 0, 0, 966, 968, 1, 0, 0, 0, 967, 956, 1, 0, 0, 0, 967, 958, 1, 0, 0, 0, 967, 962, 1, 0, 0, 0,
        968, 163, 1, 0, 0, 0, 969, 970, 3, 14, 7, 0, 970, 971, 5, 284, 0, 0, 971, 165, 1, 0, 0, 0, 972, 973, 5, 304, 0,
        0, 973, 167, 1, 0, 0, 0, 974, 976, 5, 295, 0, 0, 975, 977, 3, 14, 7, 0, 976, 975, 1, 0, 0, 0, 976, 977, 1, 0, 0,
        0, 977, 980, 1, 0, 0, 0, 978, 979, 5, 297, 0, 0, 979, 981, 3, 180, 90, 0, 980, 978, 1, 0, 0, 0, 980, 981, 1, 0,
        0, 0, 981, 983, 1, 0, 0, 0, 982, 984, 3, 108, 54, 0, 983, 982, 1, 0, 0, 0, 983, 984, 1, 0, 0, 0, 984, 985, 1, 0,
        0, 0, 985, 986, 5, 296, 0, 0, 986, 169, 1, 0, 0, 0, 987, 989, 3, 176, 88, 0, 988, 990, 3, 174, 87, 0, 989, 988,
        1, 0, 0, 0, 989, 990, 1, 0, 0, 0, 990, 996, 1, 0, 0, 0, 991, 993, 3, 188, 94, 0, 992, 994, 3, 174, 87, 0, 993,
        992, 1, 0, 0, 0, 993, 994, 1, 0, 0, 0, 994, 996, 1, 0, 0, 0, 995, 987, 1, 0, 0, 0, 995, 991, 1, 0, 0, 0, 996,
        171, 1, 0, 0, 0, 997, 999, 5, 295, 0, 0, 998, 1000, 3, 166, 83, 0, 999, 998, 1, 0, 0, 0, 999, 1000, 1, 0, 0, 0,
        1000, 1002, 1, 0, 0, 0, 1001, 1003, 3, 164, 82, 0, 1002, 1001, 1, 0, 0, 0, 1002, 1003, 1, 0, 0, 0, 1003, 1005,
        1, 0, 0, 0, 1004, 1006, 3, 160, 80, 0, 1005, 1004, 1, 0, 0, 0, 1006, 1007, 1, 0, 0, 0, 1007, 1005, 1, 0, 0, 0,
        1007, 1008, 1, 0, 0, 0, 1008, 1010, 1, 0, 0, 0, 1009, 1011, 3, 108, 54, 0, 1010, 1009, 1, 0, 0, 0, 1010, 1011,
        1, 0, 0, 0, 1011, 1012, 1, 0, 0, 0, 1012, 1014, 5, 296, 0, 0, 1013, 1015, 3, 174, 87, 0, 1014, 1013, 1, 0, 0, 0,
        1014, 1015, 1, 0, 0, 0, 1015, 1036, 1, 0, 0, 0, 1016, 1018, 5, 291, 0, 0, 1017, 1019, 3, 166, 83, 0, 1018, 1017,
        1, 0, 0, 0, 1018, 1019, 1, 0, 0, 0, 1019, 1021, 1, 0, 0, 0, 1020, 1022, 3, 164, 82, 0, 1021, 1020, 1, 0, 0, 0,
        1021, 1022, 1, 0, 0, 0, 1022, 1024, 1, 0, 0, 0, 1023, 1025, 3, 160, 80, 0, 1024, 1023, 1, 0, 0, 0, 1025, 1026,
        1, 0, 0, 0, 1026, 1024, 1, 0, 0, 0, 1026, 1027, 1, 0, 0, 0, 1027, 1029, 1, 0, 0, 0, 1028, 1030, 3, 108, 54, 0,
        1029, 1028, 1, 0, 0, 0, 1029, 1030, 1, 0, 0, 0, 1030, 1031, 1, 0, 0, 0, 1031, 1033, 5, 292, 0, 0, 1032, 1034, 3,
        174, 87, 0, 1033, 1032, 1, 0, 0, 0, 1033, 1034, 1, 0, 0, 0, 1034, 1036, 1, 0, 0, 0, 1035, 997, 1, 0, 0, 0, 1035,
        1016, 1, 0, 0, 0, 1036, 173, 1, 0, 0, 0, 1037, 1046, 7, 8, 0, 0, 1038, 1039, 5, 293, 0, 0, 1039, 1040, 5, 302,
        0, 0, 1040, 1042, 5, 271, 0, 0, 1041, 1043, 5, 302, 0, 0, 1042, 1041, 1, 0, 0, 0, 1042, 1043, 1, 0, 0, 0, 1043,
        1044, 1, 0, 0, 0, 1044, 1046, 5, 294, 0, 0, 1045, 1037, 1, 0, 0, 0, 1045, 1038, 1, 0, 0, 0, 1046, 175, 1, 0, 0,
        0, 1047, 1048, 5, 273, 0, 0, 1048, 1049, 3, 178, 89, 0, 1049, 1050, 5, 273, 0, 0, 1050, 1051, 5, 288, 0, 0,
        1051, 1082, 1, 0, 0, 0, 1052, 1053, 5, 277, 0, 0, 1053, 1054, 3, 178, 89, 0, 1054, 1055, 5, 277, 0, 0, 1055,
        1082, 1, 0, 0, 0, 1056, 1057, 5, 287, 0, 0, 1057, 1058, 5, 273, 0, 0, 1058, 1059, 3, 178, 89, 0, 1059, 1060, 5,
        273, 0, 0, 1060, 1082, 1, 0, 0, 0, 1061, 1062, 5, 277, 0, 0, 1062, 1063, 3, 178, 89, 0, 1063, 1064, 5, 277, 0,
        0, 1064, 1065, 5, 288, 0, 0, 1065, 1082, 1, 0, 0, 0, 1066, 1067, 5, 287, 0, 0, 1067, 1068, 5, 277, 0, 0, 1068,
        1069, 3, 178, 89, 0, 1069, 1070, 5, 277, 0, 0, 1070, 1082, 1, 0, 0, 0, 1071, 1072, 5, 287, 0, 0, 1072, 1073, 5,
        273, 0, 0, 1073, 1074, 3, 178, 89, 0, 1074, 1075, 5, 273, 0, 0, 1075, 1076, 5, 288, 0, 0, 1076, 1082, 1, 0, 0,
        0, 1077, 1078, 5, 273, 0, 0, 1078, 1079, 3, 178, 89, 0, 1079, 1080, 5, 273, 0, 0, 1080, 1082, 1, 0, 0, 0, 1081,
        1047, 1, 0, 0, 0, 1081, 1052, 1, 0, 0, 0, 1081, 1056, 1, 0, 0, 0, 1081, 1061, 1, 0, 0, 0, 1081, 1066, 1, 0, 0,
        0, 1081, 1071, 1, 0, 0, 0, 1081, 1077, 1, 0, 0, 0, 1082, 177, 1, 0, 0, 0, 1083, 1085, 5, 291, 0, 0, 1084, 1086,
        3, 14, 7, 0, 1085, 1084, 1, 0, 0, 0, 1085, 1086, 1, 0, 0, 0, 1086, 1089, 1, 0, 0, 0, 1087, 1088, 5, 297, 0, 0,
        1088, 1090, 3, 180, 90, 0, 1089, 1087, 1, 0, 0, 0, 1089, 1090, 1, 0, 0, 0, 1090, 1092, 1, 0, 0, 0, 1091, 1093,
        3, 108, 54, 0, 1092, 1091, 1, 0, 0, 0, 1092, 1093, 1, 0, 0, 0, 1093, 1094, 1, 0, 0, 0, 1094, 1095, 5, 292, 0, 0,
        1095, 179, 1, 0, 0, 0, 1096, 1097, 6, 90, -1, 0, 1097, 1098, 3, 182, 91, 0, 1098, 1104, 1, 0, 0, 0, 1099, 1100,
        10, 2, 0, 0, 1100, 1101, 5, 279, 0, 0, 1101, 1103, 3, 182, 91, 0, 1102, 1099, 1, 0, 0, 0, 1103, 1106, 1, 0, 0,
        0, 1104, 1102, 1, 0, 0, 0, 1104, 1105, 1, 0, 0, 0, 1105, 181, 1, 0, 0, 0, 1106, 1104, 1, 0, 0, 0, 1107, 1108, 6,
        91, -1, 0, 1108, 1109, 3, 184, 92, 0, 1109, 1115, 1, 0, 0, 0, 1110, 1111, 10, 2, 0, 0, 1111, 1112, 5, 280, 0, 0,
        1112, 1114, 3, 184, 92, 0, 1113, 1110, 1, 0, 0, 0, 1114, 1117, 1, 0, 0, 0, 1115, 1113, 1, 0, 0, 0, 1115, 1116,
        1, 0, 0, 0, 1116, 183, 1, 0, 0, 0, 1117, 1115, 1, 0, 0, 0, 1118, 1119, 5, 281, 0, 0, 1119, 1122, 3, 186, 93, 0,
        1120, 1122, 3, 186, 93, 0, 1121, 1118, 1, 0, 0, 0, 1121, 1120, 1, 0, 0, 0, 1122, 185, 1, 0, 0, 0, 1123, 1130, 3,
        14, 7, 0, 1124, 1130, 5, 275, 0, 0, 1125, 1126, 5, 295, 0, 0, 1126, 1127, 3, 180, 90, 0, 1127, 1128, 5, 296, 0,
        0, 1128, 1130, 1, 0, 0, 0, 1129, 1123, 1, 0, 0, 0, 1129, 1124, 1, 0, 0, 0, 1129, 1125, 1, 0, 0, 0, 1130, 187, 1,
        0, 0, 0, 1131, 1144, 5, 277, 0, 0, 1132, 1133, 5, 277, 0, 0, 1133, 1144, 5, 288, 0, 0, 1134, 1135, 5, 287, 0, 0,
        1135, 1144, 5, 277, 0, 0, 1136, 1138, 5, 287, 0, 0, 1137, 1136, 1, 0, 0, 0, 1137, 1138, 1, 0, 0, 0, 1138, 1139,
        1, 0, 0, 0, 1139, 1141, 5, 273, 0, 0, 1140, 1142, 5, 288, 0, 0, 1141, 1140, 1, 0, 0, 0, 1141, 1142, 1, 0, 0, 0,
        1142, 1144, 1, 0, 0, 0, 1143, 1131, 1, 0, 0, 0, 1143, 1132, 1, 0, 0, 0, 1143, 1134, 1, 0, 0, 0, 1143, 1137, 1,
        0, 0, 0, 1144, 189, 1, 0, 0, 0, 1145, 1146, 6, 95, -1, 0, 1146, 1152, 3, 192, 96, 0, 1147, 1148, 5, 295, 0, 0,
        1148, 1149, 3, 190, 95, 0, 1149, 1150, 5, 296, 0, 0, 1150, 1152, 1, 0, 0, 0, 1151, 1145, 1, 0, 0, 0, 1151, 1147,
        1, 0, 0, 0, 1152, 1173, 1, 0, 0, 0, 1153, 1155, 10, 5, 0, 0, 1154, 1156, 3, 202, 101, 0, 1155, 1154, 1, 0, 0, 0,
        1155, 1156, 1, 0, 0, 0, 1156, 1157, 1, 0, 0, 0, 1157, 1158, 5, 46, 0, 0, 1158, 1159, 5, 120, 0, 0, 1159, 1172,
        3, 198, 99, 0, 1160, 1161, 10, 4, 0, 0, 1161, 1162, 5, 271, 0, 0, 1162, 1172, 3, 198, 99, 0, 1163, 1165, 10, 3,
        0, 0, 1164, 1166, 3, 202, 101, 0, 1165, 1164, 1, 0, 0, 0, 1165, 1166, 1, 0, 0, 0, 1166, 1167, 1, 0, 0, 0, 1167,
        1168, 5, 120, 0, 0, 1168, 1169, 3, 198, 99, 0, 1169, 1170, 3, 200, 100, 0, 1170, 1172, 1, 0, 0, 0, 1171, 1153,
        1, 0, 0, 0, 1171, 1160, 1, 0, 0, 0, 1171, 1163, 1, 0, 0, 0, 1172, 1175, 1, 0, 0, 0, 1173, 1171, 1, 0, 0, 0,
        1173, 1174, 1, 0, 0, 0, 1174, 191, 1, 0, 0, 0, 1175, 1173, 1, 0, 0, 0, 1176, 1179, 3, 194, 97, 0, 1177, 1179, 3,
        196, 98, 0, 1178, 1176, 1, 0, 0, 0, 1178, 1177, 1, 0, 0, 0, 1179, 193, 1, 0, 0, 0, 1180, 1181, 3, 208, 104, 0,
        1181, 1182, 3, 14, 7, 0, 1182, 1204, 1, 0, 0, 0, 1183, 1185, 3, 208, 104, 0, 1184, 1186, 3, 8, 4, 0, 1185, 1184,
        1, 0, 0, 0, 1185, 1186, 1, 0, 0, 0, 1186, 1188, 1, 0, 0, 0, 1187, 1189, 3, 10, 5, 0, 1188, 1187, 1, 0, 0, 0,
        1188, 1189, 1, 0, 0, 0, 1189, 1191, 1, 0, 0, 0, 1190, 1192, 3, 12, 6, 0, 1191, 1190, 1, 0, 0, 0, 1191, 1192, 1,
        0, 0, 0, 1192, 1204, 1, 0, 0, 0, 1193, 1195, 3, 274, 137, 0, 1194, 1196, 3, 8, 4, 0, 1195, 1194, 1, 0, 0, 0,
        1195, 1196, 1, 0, 0, 0, 1196, 1198, 1, 0, 0, 0, 1197, 1199, 3, 10, 5, 0, 1198, 1197, 1, 0, 0, 0, 1198, 1199, 1,
        0, 0, 0, 1199, 1201, 1, 0, 0, 0, 1200, 1202, 3, 12, 6, 0, 1201, 1200, 1, 0, 0, 0, 1201, 1202, 1, 0, 0, 0, 1202,
        1204, 1, 0, 0, 0, 1203, 1180, 1, 0, 0, 0, 1203, 1183, 1, 0, 0, 0, 1203, 1193, 1, 0, 0, 0, 1204, 195, 1, 0, 0, 0,
        1205, 1206, 5, 238, 0, 0, 1206, 1208, 3, 204, 102, 0, 1207, 1209, 3, 8, 4, 0, 1208, 1207, 1, 0, 0, 0, 1208,
        1209, 1, 0, 0, 0, 1209, 1211, 1, 0, 0, 0, 1210, 1212, 3, 10, 5, 0, 1211, 1210, 1, 0, 0, 0, 1211, 1212, 1, 0, 0,
        0, 1212, 1214, 1, 0, 0, 0, 1213, 1215, 3, 12, 6, 0, 1214, 1213, 1, 0, 0, 0, 1214, 1215, 1, 0, 0, 0, 1215, 197,
        1, 0, 0, 0, 1216, 1222, 3, 192, 96, 0, 1217, 1218, 5, 295, 0, 0, 1218, 1219, 3, 190, 95, 0, 1219, 1220, 5, 296,
        0, 0, 1220, 1222, 1, 0, 0, 0, 1221, 1216, 1, 0, 0, 0, 1221, 1217, 1, 0, 0, 0, 1222, 199, 1, 0, 0, 0, 1223, 1224,
        5, 147, 0, 0, 1224, 1225, 3, 204, 102, 0, 1225, 201, 1, 0, 0, 0, 1226, 1241, 5, 109, 0, 0, 1227, 1229, 5, 125,
        0, 0, 1228, 1230, 5, 153, 0, 0, 1229, 1228, 1, 0, 0, 0, 1229, 1230, 1, 0, 0, 0, 1230, 1241, 1, 0, 0, 0, 1231,
        1233, 5, 176, 0, 0, 1232, 1234, 5, 153, 0, 0, 1233, 1232, 1, 0, 0, 0, 1233, 1234, 1, 0, 0, 0, 1234, 1241, 1, 0,
        0, 0, 1235, 1237, 5, 96, 0, 0, 1236, 1238, 5, 153, 0, 0, 1237, 1236, 1, 0, 0, 0, 1237, 1238, 1, 0, 0, 0, 1238,
        1241, 1, 0, 0, 0, 1239, 1241, 5, 153, 0, 0, 1240, 1226, 1, 0, 0, 0, 1240, 1227, 1, 0, 0, 0, 1240, 1231, 1, 0, 0,
        0, 1240, 1235, 1, 0, 0, 0, 1240, 1239, 1, 0, 0, 0, 1241, 203, 1, 0, 0, 0, 1242, 1243, 3, 206, 103, 0, 1243, 205,
        1, 0, 0, 0, 1244, 1245, 6, 103, -1, 0, 1245, 1246, 3, 208, 104, 0, 1246, 1276, 1, 0, 0, 0, 1247, 1249, 10, 4, 0,
        0, 1248, 1250, 5, 153, 0, 0, 1249, 1248, 1, 0, 0, 0, 1249, 1250, 1, 0, 0, 0, 1250, 1251, 1, 0, 0, 0, 1251, 1253,
        5, 76, 0, 0, 1252, 1254, 7, 5, 0, 0, 1253, 1252, 1, 0, 0, 0, 1253, 1254, 1, 0, 0, 0, 1254, 1255, 1, 0, 0, 0,
        1255, 1275, 3, 208, 104, 0, 1256, 1258, 10, 3, 0, 0, 1257, 1259, 5, 153, 0, 0, 1258, 1257, 1, 0, 0, 0, 1258,
        1259, 1, 0, 0, 0, 1259, 1260, 1, 0, 0, 0, 1260, 1262, 5, 209, 0, 0, 1261, 1263, 7, 5, 0, 0, 1262, 1261, 1, 0, 0,
        0, 1262, 1263, 1, 0, 0, 0, 1263, 1264, 1, 0, 0, 0, 1264, 1275, 3, 208, 104, 0, 1265, 1267, 10, 2, 0, 0, 1266,
        1268, 5, 153, 0, 0, 1267, 1266, 1, 0, 0, 0, 1267, 1268, 1, 0, 0, 0, 1268, 1269, 1, 0, 0, 0, 1269, 1271, 5, 115,
        0, 0, 1270, 1272, 7, 5, 0, 0, 1271, 1270, 1, 0, 0, 0, 1271, 1272, 1, 0, 0, 0, 1272, 1273, 1, 0, 0, 0, 1273,
        1275, 3, 208, 104, 0, 1274, 1247, 1, 0, 0, 0, 1274, 1256, 1, 0, 0, 0, 1274, 1265, 1, 0, 0, 0, 1275, 1278, 1, 0,
        0, 0, 1276, 1274, 1, 0, 0, 0, 1276, 1277, 1, 0, 0, 0, 1277, 207, 1, 0, 0, 0, 1278, 1276, 1, 0, 0, 0, 1279, 1281,
        3, 110, 55, 0, 1280, 1282, 3, 140, 70, 0, 1281, 1280, 1, 0, 0, 0, 1281, 1282, 1, 0, 0, 0, 1282, 1283, 1, 0, 0,
        0, 1283, 1285, 3, 146, 73, 0, 1284, 1286, 3, 118, 59, 0, 1285, 1284, 1, 0, 0, 0, 1285, 1286, 1, 0, 0, 0, 1286,
        1288, 1, 0, 0, 0, 1287, 1289, 3, 148, 74, 0, 1288, 1287, 1, 0, 0, 0, 1288, 1289, 1, 0, 0, 0, 1289, 1291, 1, 0,
        0, 0, 1290, 1292, 3, 126, 63, 0, 1291, 1290, 1, 0, 0, 0, 1291, 1292, 1, 0, 0, 0, 1292, 1294, 1, 0, 0, 0, 1293,
        1295, 3, 138, 69, 0, 1294, 1293, 1, 0, 0, 0, 1294, 1295, 1, 0, 0, 0, 1295, 1297, 1, 0, 0, 0, 1296, 1298, 3, 122,
        61, 0, 1297, 1296, 1, 0, 0, 0, 1297, 1298, 1, 0, 0, 0, 1298, 1300, 1, 0, 0, 0, 1299, 1301, 3, 152, 76, 0, 1300,
        1299, 1, 0, 0, 0, 1300, 1301, 1, 0, 0, 0, 1301, 1303, 1, 0, 0, 0, 1302, 1304, 3, 150, 75, 0, 1303, 1302, 1, 0,
        0, 0, 1303, 1304, 1, 0, 0, 0, 1304, 1307, 1, 0, 0, 0, 1305, 1307, 3, 210, 105, 0, 1306, 1279, 1, 0, 0, 0, 1306,
        1305, 1, 0, 0, 0, 1307, 209, 1, 0, 0, 0, 1308, 1309, 6, 105, -1, 0, 1309, 1310, 3, 212, 106, 0, 1310, 1316, 1,
        0, 0, 0, 1311, 1312, 10, 2, 0, 0, 1312, 1313, 5, 151, 0, 0, 1313, 1315, 3, 212, 106, 0, 1314, 1311, 1, 0, 0, 0,
        1315, 1318, 1, 0, 0, 0, 1316, 1314, 1, 0, 0, 0, 1316, 1317, 1, 0, 0, 0, 1317, 211, 1, 0, 0, 0, 1318, 1316, 1, 0,
        0, 0, 1319, 1320, 6, 106, -1, 0, 1320, 1321, 3, 214, 107, 0, 1321, 1327, 1, 0, 0, 0, 1322, 1323, 10, 2, 0, 0,
        1323, 1324, 5, 7, 0, 0, 1324, 1326, 3, 214, 107, 0, 1325, 1322, 1, 0, 0, 0, 1326, 1329, 1, 0, 0, 0, 1327, 1325,
        1, 0, 0, 0, 1327, 1328, 1, 0, 0, 0, 1328, 213, 1, 0, 0, 0, 1329, 1327, 1, 0, 0, 0, 1330, 1331, 5, 140, 0, 0,
        1331, 1334, 3, 214, 107, 0, 1332, 1334, 3, 216, 108, 0, 1333, 1330, 1, 0, 0, 0, 1333, 1332, 1, 0, 0, 0, 1334,
        215, 1, 0, 0, 0, 1335, 1336, 6, 108, -1, 0, 1336, 1337, 3, 218, 109, 0, 1337, 1383, 1, 0, 0, 0, 1338, 1339, 10,
        7, 0, 0, 1339, 1340, 7, 9, 0, 0, 1340, 1382, 3, 218, 109, 0, 1341, 1342, 10, 6, 0, 0, 1342, 1344, 5, 118, 0, 0,
        1343, 1345, 5, 140, 0, 0, 1344, 1343, 1, 0, 0, 0, 1344, 1345, 1, 0, 0, 0, 1345, 1346, 1, 0, 0, 0, 1346, 1382, 3,
        294, 147, 0, 1347, 1349, 10, 5, 0, 0, 1348, 1350, 5, 140, 0, 0, 1349, 1348, 1, 0, 0, 0, 1349, 1350, 1, 0, 0, 0,
        1350, 1351, 1, 0, 0, 0, 1351, 1352, 5, 106, 0, 0, 1352, 1353, 5, 295, 0, 0, 1353, 1354, 3, 204, 102, 0, 1354,
        1355, 5, 296, 0, 0, 1355, 1382, 1, 0, 0, 0, 1356, 1358, 10, 4, 0, 0, 1357, 1359, 5, 140, 0, 0, 1358, 1357, 1, 0,
        0, 0, 1358, 1359, 1, 0, 0, 0, 1359, 1360, 1, 0, 0, 0, 1360, 1361, 5, 106, 0, 0, 1361, 1382, 3, 218, 109, 0,
        1362, 1364, 10, 3, 0, 0, 1363, 1365, 5, 140, 0, 0, 1364, 1363, 1, 0, 0, 0, 1364, 1365, 1, 0, 0, 0, 1365, 1366,
        1, 0, 0, 0, 1366, 1367, 5, 127, 0, 0, 1367, 1370, 3, 218, 109, 0, 1368, 1369, 5, 74, 0, 0, 1369, 1371, 3, 204,
        102, 0, 1370, 1368, 1, 0, 0, 0, 1370, 1371, 1, 0, 0, 0, 1371, 1382, 1, 0, 0, 0, 1372, 1374, 10, 2, 0, 0, 1373,
        1375, 5, 140, 0, 0, 1374, 1373, 1, 0, 0, 0, 1374, 1375, 1, 0, 0, 0, 1375, 1376, 1, 0, 0, 0, 1376, 1377, 5, 17,
        0, 0, 1377, 1378, 3, 218, 109, 0, 1378, 1379, 5, 7, 0, 0, 1379, 1380, 3, 218, 109, 0, 1380, 1382, 1, 0, 0, 0,
        1381, 1338, 1, 0, 0, 0, 1381, 1341, 1, 0, 0, 0, 1381, 1347, 1, 0, 0, 0, 1381, 1356, 1, 0, 0, 0, 1381, 1362, 1,
        0, 0, 0, 1381, 1372, 1, 0, 0, 0, 1382, 1385, 1, 0, 0, 0, 1383, 1381, 1, 0, 0, 0, 1383, 1384, 1, 0, 0, 0, 1384,
        217, 1, 0, 0, 0, 1385, 1383, 1, 0, 0, 0, 1386, 1387, 6, 109, -1, 0, 1387, 1388, 3, 220, 110, 0, 1388, 1394, 1,
        0, 0, 0, 1389, 1390, 10, 2, 0, 0, 1390, 1391, 7, 10, 0, 0, 1391, 1393, 3, 220, 110, 0, 1392, 1389, 1, 0, 0, 0,
        1393, 1396, 1, 0, 0, 0, 1394, 1392, 1, 0, 0, 0, 1394, 1395, 1, 0, 0, 0, 1395, 219, 1, 0, 0, 0, 1396, 1394, 1, 0,
        0, 0, 1397, 1398, 6, 110, -1, 0, 1398, 1399, 3, 222, 111, 0, 1399, 1405, 1, 0, 0, 0, 1400, 1401, 10, 2, 0, 0,
        1401, 1402, 7, 11, 0, 0, 1402, 1404, 3, 222, 111, 0, 1403, 1400, 1, 0, 0, 0, 1404, 1407, 1, 0, 0, 0, 1405, 1403,
        1, 0, 0, 0, 1405, 1406, 1, 0, 0, 0, 1406, 221, 1, 0, 0, 0, 1407, 1405, 1, 0, 0, 0, 1408, 1409, 6, 111, -1, 0,
        1409, 1410, 3, 224, 112, 0, 1410, 1416, 1, 0, 0, 0, 1411, 1412, 10, 2, 0, 0, 1412, 1413, 7, 12, 0, 0, 1413,
        1415, 3, 224, 112, 0, 1414, 1411, 1, 0, 0, 0, 1415, 1418, 1, 0, 0, 0, 1416, 1414, 1, 0, 0, 0, 1416, 1417, 1, 0,
        0, 0, 1417, 223, 1, 0, 0, 0, 1418, 1416, 1, 0, 0, 0, 1419, 1420, 7, 11, 0, 0, 1420, 1423, 3, 224, 112, 0, 1421,
        1423, 3, 226, 113, 0, 1422, 1419, 1, 0, 0, 0, 1422, 1421, 1, 0, 0, 0, 1423, 225, 1, 0, 0, 0, 1424, 1425, 6, 113,
        -1, 0, 1425, 1446, 3, 228, 114, 0, 1426, 1446, 3, 254, 127, 0, 1427, 1446, 3, 242, 121, 0, 1428, 1446, 3, 244,
        122, 0, 1429, 1446, 3, 246, 123, 0, 1430, 1446, 3, 248, 124, 0, 1431, 1446, 3, 258, 129, 0, 1432, 1446, 3, 256,
        128, 0, 1433, 1446, 3, 260, 130, 0, 1434, 1446, 3, 232, 116, 0, 1435, 1446, 3, 264, 132, 0, 1436, 1446, 3, 250,
        125, 0, 1437, 1446, 3, 262, 131, 0, 1438, 1446, 3, 266, 133, 0, 1439, 1446, 3, 230, 115, 0, 1440, 1446, 3, 272,
        136, 0, 1441, 1446, 3, 234, 117, 0, 1442, 1446, 3, 240, 120, 0, 1443, 1446, 3, 236, 118, 0, 1444, 1446, 3, 252,
        126, 0, 1445, 1424, 1, 0, 0, 0, 1445, 1426, 1, 0, 0, 0, 1445, 1427, 1, 0, 0, 0, 1445, 1428, 1, 0, 0, 0, 1445,
        1429, 1, 0, 0, 0, 1445, 1430, 1, 0, 0, 0, 1445, 1431, 1, 0, 0, 0, 1445, 1432, 1, 0, 0, 0, 1445, 1433, 1, 0, 0,
        0, 1445, 1434, 1, 0, 0, 0, 1445, 1435, 1, 0, 0, 0, 1445, 1436, 1, 0, 0, 0, 1445, 1437, 1, 0, 0, 0, 1445, 1438,
        1, 0, 0, 0, 1445, 1439, 1, 0, 0, 0, 1445, 1440, 1, 0, 0, 0, 1445, 1441, 1, 0, 0, 0, 1445, 1442, 1, 0, 0, 0,
        1445, 1443, 1, 0, 0, 0, 1445, 1444, 1, 0, 0, 0, 1446, 1455, 1, 0, 0, 0, 1447, 1449, 10, 6, 0, 0, 1448, 1450, 3,
        270, 135, 0, 1449, 1448, 1, 0, 0, 0, 1450, 1451, 1, 0, 0, 0, 1451, 1449, 1, 0, 0, 0, 1451, 1452, 1, 0, 0, 0,
        1452, 1454, 1, 0, 0, 0, 1453, 1447, 1, 0, 0, 0, 1454, 1457, 1, 0, 0, 0, 1455, 1453, 1, 0, 0, 0, 1455, 1456, 1,
        0, 0, 0, 1456, 227, 1, 0, 0, 0, 1457, 1455, 1, 0, 0, 0, 1458, 1459, 5, 295, 0, 0, 1459, 1460, 3, 204, 102, 0,
        1460, 1461, 5, 296, 0, 0, 1461, 1470, 1, 0, 0, 0, 1462, 1470, 5, 51, 0, 0, 1463, 1470, 5, 48, 0, 0, 1464, 1470,
        3, 276, 138, 0, 1465, 1470, 3, 278, 139, 0, 1466, 1470, 3, 292, 146, 0, 1467, 1470, 3, 282, 141, 0, 1468, 1470,
        3, 288, 144, 0, 1469, 1458, 1, 0, 0, 0, 1469, 1462, 1, 0, 0, 0, 1469, 1463, 1, 0, 0, 0, 1469, 1464, 1, 0, 0, 0,
        1469, 1465, 1, 0, 0, 0, 1469, 1466, 1, 0, 0, 0, 1469, 1467, 1, 0, 0, 0, 1469, 1468, 1, 0, 0, 0, 1470, 229, 1, 0,
        0, 0, 1471, 1472, 5, 143, 0, 0, 1472, 1473, 5, 295, 0, 0, 1473, 1474, 3, 204, 102, 0, 1474, 1475, 5, 271, 0, 0,
        1475, 1476, 3, 204, 102, 0, 1476, 1477, 5, 296, 0, 0, 1477, 231, 1, 0, 0, 0, 1478, 1479, 5, 32, 0, 0, 1479,
        1480, 5, 295, 0, 0, 1480, 1485, 3, 204, 102, 0, 1481, 1482, 5, 271, 0, 0, 1482, 1484, 3, 204, 102, 0, 1483,
        1481, 1, 0, 0, 0, 1484, 1487, 1, 0, 0, 0, 1485, 1483, 1, 0, 0, 0, 1485, 1486, 1, 0, 0, 0, 1486, 1488, 1, 0, 0,
        0, 1487, 1485, 1, 0, 0, 0, 1488, 1489, 5, 296, 0, 0, 1489, 233, 1, 0, 0, 0, 1490, 1492, 5, 23, 0, 0, 1491, 1493,
        3, 204, 102, 0, 1492, 1491, 1, 0, 0, 0, 1492, 1493, 1, 0, 0, 0, 1493, 1499, 1, 0, 0, 0, 1494, 1495, 5, 223, 0,
        0, 1495, 1496, 3, 204, 102, 0, 1496, 1497, 5, 200, 0, 0, 1497, 1498, 3, 204, 102, 0, 1498, 1500, 1, 0, 0, 0,
        1499, 1494, 1, 0, 0, 0, 1500, 1501, 1, 0, 0, 0, 1501, 1499, 1, 0, 0, 0, 1501, 1502, 1, 0, 0, 0, 1502, 1505, 1,
        0, 0, 0, 1503, 1504, 5, 71, 0, 0, 1504, 1506, 3, 204, 102, 0, 1505, 1503, 1, 0, 0, 0, 1505, 1506, 1, 0, 0, 0,
        1506, 1507, 1, 0, 0, 0, 1507, 1508, 5, 72, 0, 0, 1508, 235, 1, 0, 0, 0, 1509, 1510, 5, 219, 0, 0, 1510, 1515, 3,
        238, 119, 0, 1511, 1512, 5, 271, 0, 0, 1512, 1514, 3, 238, 119, 0, 1513, 1511, 1, 0, 0, 0, 1514, 1517, 1, 0, 0,
        0, 1515, 1513, 1, 0, 0, 0, 1515, 1516, 1, 0, 0, 0, 1516, 237, 1, 0, 0, 0, 1517, 1515, 1, 0, 0, 0, 1518, 1519, 5,
        295, 0, 0, 1519, 1524, 3, 204, 102, 0, 1520, 1521, 5, 271, 0, 0, 1521, 1523, 3, 204, 102, 0, 1522, 1520, 1, 0,
        0, 0, 1523, 1526, 1, 0, 0, 0, 1524, 1522, 1, 0, 0, 0, 1524, 1525, 1, 0, 0, 0, 1525, 1527, 1, 0, 0, 0, 1526,
        1524, 1, 0, 0, 0, 1527, 1528, 5, 296, 0, 0, 1528, 239, 1, 0, 0, 0, 1529, 1530, 5, 295, 0, 0, 1530, 1533, 3, 204,
        102, 0, 1531, 1532, 5, 271, 0, 0, 1532, 1534, 3, 204, 102, 0, 1533, 1531, 1, 0, 0, 0, 1534, 1535, 1, 0, 0, 0,
        1535, 1533, 1, 0, 0, 0, 1535, 1536, 1, 0, 0, 0, 1536, 1537, 1, 0, 0, 0, 1537, 1538, 5, 296, 0, 0, 1538, 241, 1,
        0, 0, 0, 1539, 1540, 7, 13, 0, 0, 1540, 1549, 5, 295, 0, 0, 1541, 1546, 3, 204, 102, 0, 1542, 1543, 5, 271, 0,
        0, 1543, 1545, 3, 204, 102, 0, 1544, 1542, 1, 0, 0, 0, 1545, 1548, 1, 0, 0, 0, 1546, 1544, 1, 0, 0, 0, 1546,
        1547, 1, 0, 0, 0, 1547, 1550, 1, 0, 0, 0, 1548, 1546, 1, 0, 0, 0, 1549, 1541, 1, 0, 0, 0, 1549, 1550, 1, 0, 0,
        0, 1550, 1551, 1, 0, 0, 0, 1551, 1552, 5, 296, 0, 0, 1552, 243, 1, 0, 0, 0, 1553, 1554, 5, 195, 0, 0, 1554,
        1555, 5, 295, 0, 0, 1555, 1562, 3, 204, 102, 0, 1556, 1557, 5, 271, 0, 0, 1557, 1560, 3, 204, 102, 0, 1558,
        1559, 5, 271, 0, 0, 1559, 1561, 3, 204, 102, 0, 1560, 1558, 1, 0, 0, 0, 1560, 1561, 1, 0, 0, 0, 1561, 1563, 1,
        0, 0, 0, 1562, 1556, 1, 0, 0, 0, 1562, 1563, 1, 0, 0, 0, 1563, 1564, 1, 0, 0, 0, 1564, 1565, 5, 296, 0, 0, 1565,
        1580, 1, 0, 0, 0, 1566, 1567, 5, 195, 0, 0, 1567, 1568, 5, 295, 0, 0, 1568, 1575, 3, 204, 102, 0, 1569, 1570, 5,
        95, 0, 0, 1570, 1573, 3, 204, 102, 0, 1571, 1572, 5, 92, 0, 0, 1572, 1574, 3, 204, 102, 0, 1573, 1571, 1, 0, 0,
        0, 1573, 1574, 1, 0, 0, 0, 1574, 1576, 1, 0, 0, 0, 1575, 1569, 1, 0, 0, 0, 1575, 1576, 1, 0, 0, 0, 1576, 1577,
        1, 0, 0, 0, 1577, 1578, 5, 296, 0, 0, 1578, 1580, 1, 0, 0, 0, 1579, 1553, 1, 0, 0, 0, 1579, 1566, 1, 0, 0, 0,
        1580, 245, 1, 0, 0, 0, 1581, 1582, 5, 160, 0, 0, 1582, 1583, 5, 295, 0, 0, 1583, 1584, 3, 204, 102, 0, 1584,
        1585, 5, 271, 0, 0, 1585, 1586, 3, 204, 102, 0, 1586, 1587, 5, 296, 0, 0, 1587, 1596, 1, 0, 0, 0, 1588, 1589, 5,
        160, 0, 0, 1589, 1590, 5, 295, 0, 0, 1590, 1591, 3, 204, 102, 0, 1591, 1592, 5, 106, 0, 0, 1592, 1593, 3, 204,
        102, 0, 1593, 1594, 5, 296, 0, 0, 1594, 1596, 1, 0, 0, 0, 1595, 1581, 1, 0, 0, 0, 1595, 1588, 1, 0, 0, 0, 1596,
        247, 1, 0, 0, 0, 1597, 1598, 5, 156, 0, 0, 1598, 1599, 5, 295, 0, 0, 1599, 1600, 3, 204, 102, 0, 1600, 1601, 5,
        271, 0, 0, 1601, 1602, 3, 204, 102, 0, 1602, 1603, 5, 271, 0, 0, 1603, 1606, 3, 204, 102, 0, 1604, 1605, 5, 271,
        0, 0, 1605, 1607, 3, 204, 102, 0, 1606, 1604, 1, 0, 0, 0, 1606, 1607, 1, 0, 0, 0, 1607, 1608, 1, 0, 0, 0, 1608,
        1609, 5, 296, 0, 0, 1609, 1624, 1, 0, 0, 0, 1610, 1611, 5, 156, 0, 0, 1611, 1612, 5, 295, 0, 0, 1612, 1613, 3,
        204, 102, 0, 1613, 1614, 5, 159, 0, 0, 1614, 1615, 3, 204, 102, 0, 1615, 1616, 5, 95, 0, 0, 1616, 1619, 3, 204,
        102, 0, 1617, 1618, 5, 92, 0, 0, 1618, 1620, 3, 204, 102, 0, 1619, 1617, 1, 0, 0, 0, 1619, 1620, 1, 0, 0, 0,
        1620, 1621, 1, 0, 0, 0, 1621, 1622, 5, 296, 0, 0, 1622, 1624, 1, 0, 0, 0, 1623, 1597, 1, 0, 0, 0, 1623, 1610, 1,
        0, 0, 0, 1624, 249, 1, 0, 0, 0, 1625, 1626, 5, 44, 0, 0, 1626, 1627, 5, 295, 0, 0, 1627, 1628, 5, 278, 0, 0,
        1628, 1638, 5, 296, 0, 0, 1629, 1630, 7, 14, 0, 0, 1630, 1632, 5, 295, 0, 0, 1631, 1633, 3, 116, 58, 0, 1632,
        1631, 1, 0, 0, 0, 1632, 1633, 1, 0, 0, 0, 1633, 1634, 1, 0, 0, 0, 1634, 1635, 3, 204, 102, 0, 1635, 1636, 5,
        296, 0, 0, 1636, 1638, 1, 0, 0, 0, 1637, 1625, 1, 0, 0, 0, 1637, 1629, 1, 0, 0, 0, 1638, 251, 1, 0, 0, 0, 1639,
        1640, 7, 15, 0, 0, 1640, 1641, 5, 295, 0, 0, 1641, 1648, 3, 204, 102, 0, 1642, 1643, 5, 271, 0, 0, 1643, 1646,
        3, 204, 102, 0, 1644, 1645, 5, 271, 0, 0, 1645, 1647, 3, 204, 102, 0, 1646, 1644, 1, 0, 0, 0, 1646, 1647, 1, 0,
        0, 0, 1647, 1649, 1, 0, 0, 0, 1648, 1642, 1, 0, 0, 0, 1648, 1649, 1, 0, 0, 0, 1649, 1650, 1, 0, 0, 0, 1650,
        1651, 5, 296, 0, 0, 1651, 1652, 3, 132, 66, 0, 1652, 253, 1, 0, 0, 0, 1653, 1654, 5, 24, 0, 0, 1654, 1655, 5,
        295, 0, 0, 1655, 1656, 3, 204, 102, 0, 1656, 1657, 5, 10, 0, 0, 1657, 1658, 3, 294, 147, 0, 1658, 1659, 5, 296,
        0, 0, 1659, 255, 1, 0, 0, 0, 1660, 1661, 5, 235, 0, 0, 1661, 1662, 5, 295, 0, 0, 1662, 1663, 3, 204, 102, 0,
        1663, 1664, 5, 10, 0, 0, 1664, 1665, 3, 294, 147, 0, 1665, 1666, 5, 296, 0, 0, 1666, 257, 1, 0, 0, 0, 1667,
        1668, 5, 234, 0, 0, 1668, 1669, 5, 295, 0, 0, 1669, 1670, 3, 204, 102, 0, 1670, 1671, 5, 10, 0, 0, 1671, 1672,
        3, 294, 147, 0, 1672, 1673, 5, 296, 0, 0, 1673, 259, 1, 0, 0, 0, 1674, 1675, 5, 85, 0, 0, 1675, 1676, 5, 295, 0,
        0, 1676, 1677, 5, 304, 0, 0, 1677, 1678, 5, 95, 0, 0, 1678, 1679, 3, 204, 102, 0, 1679, 1680, 5, 296, 0, 0,
        1680, 261, 1, 0, 0, 0, 1681, 1682, 5, 207, 0, 0, 1682, 1690, 5, 295, 0, 0, 1683, 1685, 5, 304, 0, 0, 1684, 1683,
        1, 0, 0, 0, 1684, 1685, 1, 0, 0, 0, 1685, 1687, 1, 0, 0, 0, 1686, 1688, 3, 204, 102, 0, 1687, 1686, 1, 0, 0, 0,
        1687, 1688, 1, 0, 0, 0, 1688, 1689, 1, 0, 0, 0, 1689, 1691, 5, 95, 0, 0, 1690, 1684, 1, 0, 0, 0, 1690, 1691, 1,
        0, 0, 0, 1691, 1692, 1, 0, 0, 0, 1692, 1693, 3, 204, 102, 0, 1693, 1694, 5, 296, 0, 0, 1694, 263, 1, 0, 0, 0,
        1695, 1696, 7, 16, 0, 0, 1696, 1697, 5, 295, 0, 0, 1697, 1698, 5, 304, 0, 0, 1698, 1699, 5, 271, 0, 0, 1699,
        1700, 3, 204, 102, 0, 1700, 1701, 5, 271, 0, 0, 1701, 1702, 3, 204, 102, 0, 1702, 1703, 5, 296, 0, 0, 1703, 265,
        1, 0, 0, 0, 1704, 1705, 3, 268, 134, 0, 1705, 1714, 5, 295, 0, 0, 1706, 1711, 3, 204, 102, 0, 1707, 1708, 5,
        271, 0, 0, 1708, 1710, 3, 204, 102, 0, 1709, 1707, 1, 0, 0, 0, 1710, 1713, 1, 0, 0, 0, 1711, 1709, 1, 0, 0, 0,
        1711, 1712, 1, 0, 0, 0, 1712, 1715, 1, 0, 0, 0, 1713, 1711, 1, 0, 0, 0, 1714, 1706, 1, 0, 0, 0, 1714, 1715, 1,
        0, 0, 0, 1715, 1716, 1, 0, 0, 0, 1716, 1717, 5, 296, 0, 0, 1717, 267, 1, 0, 0, 0, 1718, 1719, 3, 14, 7, 0, 1719,
        1720, 5, 300, 0, 0, 1720, 1722, 1, 0, 0, 0, 1721, 1718, 1, 0, 0, 0, 1722, 1725, 1, 0, 0, 0, 1723, 1721, 1, 0, 0,
        0, 1723, 1724, 1, 0, 0, 0, 1724, 1726, 1, 0, 0, 0, 1725, 1723, 1, 0, 0, 0, 1726, 1737, 7, 17, 0, 0, 1727, 1728,
        3, 14, 7, 0, 1728, 1729, 5, 300, 0, 0, 1729, 1731, 1, 0, 0, 0, 1730, 1727, 1, 0, 0, 0, 1731, 1734, 1, 0, 0, 0,
        1732, 1730, 1, 0, 0, 0, 1732, 1733, 1, 0, 0, 0, 1733, 1735, 1, 0, 0, 0, 1734, 1732, 1, 0, 0, 0, 1735, 1737, 3,
        14, 7, 0, 1736, 1723, 1, 0, 0, 0, 1736, 1732, 1, 0, 0, 0, 1737, 269, 1, 0, 0, 0, 1738, 1739, 5, 291, 0, 0, 1739,
        1740, 3, 204, 102, 0, 1740, 1741, 5, 292, 0, 0, 1741, 1750, 1, 0, 0, 0, 1742, 1743, 5, 291, 0, 0, 1743, 1744, 5,
        278, 0, 0, 1744, 1750, 5, 292, 0, 0, 1745, 1746, 5, 300, 0, 0, 1746, 1750, 3, 14, 7, 0, 1747, 1748, 5, 300, 0,
        0, 1748, 1750, 5, 278, 0, 0, 1749, 1738, 1, 0, 0, 0, 1749, 1742, 1, 0, 0, 0, 1749, 1745, 1, 0, 0, 0, 1749, 1747,
        1, 0, 0, 0, 1750, 271, 1, 0, 0, 0, 1751, 1752, 5, 295, 0, 0, 1752, 1753, 3, 226, 113, 0, 1753, 1754, 5, 130, 0,
        0, 1754, 1755, 3, 156, 78, 0, 1755, 1756, 5, 296, 0, 0, 1756, 273, 1, 0, 0, 0, 1757, 1758, 3, 226, 113, 0, 1758,
        1759, 5, 130, 0, 0, 1759, 1760, 3, 154, 77, 0, 1760, 275, 1, 0, 0, 0, 1761, 1762, 5, 299, 0, 0, 1762, 277, 1, 0,
        0, 0, 1763, 1765, 5, 276, 0, 0, 1764, 1763, 1, 0, 0, 0, 1764, 1765, 1, 0, 0, 0, 1765, 1766, 1, 0, 0, 0, 1766,
        1772, 7, 0, 0, 0, 1767, 1769, 5, 276, 0, 0, 1768, 1767, 1, 0, 0, 0, 1768, 1769, 1, 0, 0, 0, 1769, 1770, 1, 0, 0,
        0, 1770, 1772, 3, 280, 140, 0, 1771, 1764, 1, 0, 0, 0, 1771, 1768, 1, 0, 0, 0, 1772, 279, 1, 0, 0, 0, 1773,
        1774, 5, 79, 0, 0, 1774, 281, 1, 0, 0, 0, 1775, 1778, 3, 284, 142, 0, 1776, 1778, 3, 286, 143, 0, 1777, 1775, 1,
        0, 0, 0, 1777, 1776, 1, 0, 0, 0, 1778, 283, 1, 0, 0, 0, 1779, 1788, 5, 291, 0, 0, 1780, 1785, 3, 204, 102, 0,
        1781, 1782, 5, 271, 0, 0, 1782, 1784, 3, 204, 102, 0, 1783, 1781, 1, 0, 0, 0, 1784, 1787, 1, 0, 0, 0, 1785,
        1783, 1, 0, 0, 0, 1785, 1786, 1, 0, 0, 0, 1786, 1789, 1, 0, 0, 0, 1787, 1785, 1, 0, 0, 0, 1788, 1780, 1, 0, 0,
        0, 1788, 1789, 1, 0, 0, 0, 1789, 1790, 1, 0, 0, 0, 1790, 1791, 5, 292, 0, 0, 1791, 285, 1, 0, 0, 0, 1792, 1801,
        5, 289, 0, 0, 1793, 1798, 3, 204, 102, 0, 1794, 1795, 5, 271, 0, 0, 1795, 1797, 3, 204, 102, 0, 1796, 1794, 1,
        0, 0, 0, 1797, 1800, 1, 0, 0, 0, 1798, 1796, 1, 0, 0, 0, 1798, 1799, 1, 0, 0, 0, 1799, 1802, 1, 0, 0, 0, 1800,
        1798, 1, 0, 0, 0, 1801, 1793, 1, 0, 0, 0, 1801, 1802, 1, 0, 0, 0, 1802, 1803, 1, 0, 0, 0, 1803, 1804, 5, 290, 0,
        0, 1804, 287, 1, 0, 0, 0, 1805, 1814, 5, 293, 0, 0, 1806, 1811, 3, 290, 145, 0, 1807, 1808, 5, 271, 0, 0, 1808,
        1810, 3, 290, 145, 0, 1809, 1807, 1, 0, 0, 0, 1810, 1813, 1, 0, 0, 0, 1811, 1809, 1, 0, 0, 0, 1811, 1812, 1, 0,
        0, 0, 1812, 1815, 1, 0, 0, 0, 1813, 1811, 1, 0, 0, 0, 1814, 1806, 1, 0, 0, 0, 1814, 1815, 1, 0, 0, 0, 1815,
        1816, 1, 0, 0, 0, 1816, 1817, 5, 294, 0, 0, 1817, 289, 1, 0, 0, 0, 1818, 1819, 3, 204, 102, 0, 1819, 1820, 5,
        297, 0, 0, 1820, 1821, 3, 204, 102, 0, 1821, 291, 1, 0, 0, 0, 1822, 1857, 5, 141, 0, 0, 1823, 1857, 5, 236, 0,
        0, 1824, 1857, 5, 208, 0, 0, 1825, 1857, 5, 88, 0, 0, 1826, 1857, 5, 301, 0, 0, 1827, 1857, 5, 302, 0, 0, 1828,
        1857, 5, 303, 0, 0, 1829, 1857, 5, 310, 0, 0, 1830, 1831, 5, 53, 0, 0, 1831, 1857, 5, 301, 0, 0, 1832, 1836, 5,
        201, 0, 0, 1833, 1834, 5, 295, 0, 0, 1834, 1835, 5, 302, 0, 0, 1835, 1837, 5, 296, 0, 0, 1836, 1833, 1, 0, 0, 0,
        1836, 1837, 1, 0, 0, 0, 1837, 1841, 1, 0, 0, 0, 1838, 1839, 5, 226, 0, 0, 1839, 1840, 5, 201, 0, 0, 1840, 1842,
        5, 229, 0, 0, 1841, 1838, 1, 0, 0, 0, 1841, 1842, 1, 0, 0, 0, 1842, 1843, 1, 0, 0, 0, 1843, 1857, 5, 301, 0, 0,
        1844, 1848, 5, 202, 0, 0, 1845, 1846, 5, 295, 0, 0, 1846, 1847, 5, 302, 0, 0, 1847, 1849, 5, 296, 0, 0, 1848,
        1845, 1, 0, 0, 0, 1848, 1849, 1, 0, 0, 0, 1849, 1853, 1, 0, 0, 0, 1850, 1851, 5, 226, 0, 0, 1851, 1852, 5, 201,
        0, 0, 1852, 1854, 5, 229, 0, 0, 1853, 1850, 1, 0, 0, 0, 1853, 1854, 1, 0, 0, 0, 1854, 1855, 1, 0, 0, 0, 1855,
        1857, 5, 301, 0, 0, 1856, 1822, 1, 0, 0, 0, 1856, 1823, 1, 0, 0, 0, 1856, 1824, 1, 0, 0, 0, 1856, 1825, 1, 0, 0,
        0, 1856, 1826, 1, 0, 0, 0, 1856, 1827, 1, 0, 0, 0, 1856, 1828, 1, 0, 0, 0, 1856, 1829, 1, 0, 0, 0, 1856, 1830,
        1, 0, 0, 0, 1856, 1832, 1, 0, 0, 0, 1856, 1844, 1, 0, 0, 0, 1857, 293, 1, 0, 0, 0, 1858, 1897, 7, 18, 0, 0,
        1859, 1860, 5, 69, 0, 0, 1860, 1897, 5, 161, 0, 0, 1861, 1865, 7, 19, 0, 0, 1862, 1863, 5, 295, 0, 0, 1863,
        1864, 5, 302, 0, 0, 1864, 1866, 5, 296, 0, 0, 1865, 1862, 1, 0, 0, 0, 1865, 1866, 1, 0, 0, 0, 1866, 1897, 1, 0,
        0, 0, 1867, 1868, 5, 27, 0, 0, 1868, 1872, 5, 221, 0, 0, 1869, 1870, 5, 295, 0, 0, 1870, 1871, 5, 302, 0, 0,
        1871, 1873, 5, 296, 0, 0, 1872, 1869, 1, 0, 0, 0, 1872, 1873, 1, 0, 0, 0, 1873, 1897, 1, 0, 0, 0, 1874, 1882, 7,
        20, 0, 0, 1875, 1876, 5, 295, 0, 0, 1876, 1879, 5, 302, 0, 0, 1877, 1878, 5, 271, 0, 0, 1878, 1880, 5, 302, 0,
        0, 1879, 1877, 1, 0, 0, 0, 1879, 1880, 1, 0, 0, 0, 1880, 1881, 1, 0, 0, 0, 1881, 1883, 5, 296, 0, 0, 1882, 1875,
        1, 0, 0, 0, 1882, 1883, 1, 0, 0, 0, 1883, 1897, 1, 0, 0, 0, 1884, 1888, 7, 21, 0, 0, 1885, 1886, 5, 295, 0, 0,
        1886, 1887, 5, 302, 0, 0, 1887, 1889, 5, 296, 0, 0, 1888, 1885, 1, 0, 0, 0, 1888, 1889, 1, 0, 0, 0, 1889, 1893,
        1, 0, 0, 0, 1890, 1891, 5, 226, 0, 0, 1891, 1892, 5, 201, 0, 0, 1892, 1894, 5, 229, 0, 0, 1893, 1890, 1, 0, 0,
        0, 1893, 1894, 1, 0, 0, 0, 1894, 1897, 1, 0, 0, 0, 1895, 1897, 3, 14, 7, 0, 1896, 1858, 1, 0, 0, 0, 1896, 1859,
        1, 0, 0, 0, 1896, 1861, 1, 0, 0, 0, 1896, 1867, 1, 0, 0, 0, 1896, 1874, 1, 0, 0, 0, 1896, 1884, 1, 0, 0, 0,
        1896, 1895, 1, 0, 0, 0, 1897, 295, 1, 0, 0, 0, 232, 298, 302, 313, 318, 320, 328, 353, 356, 363, 384, 393, 396,
        408, 413, 424, 431, 439, 448, 455, 460, 467, 475, 493, 501, 514, 524, 531, 534, 537, 541, 546, 549, 554, 562,
        568, 581, 587, 595, 609, 612, 615, 621, 625, 630, 641, 644, 659, 667, 679, 684, 689, 700, 710, 713, 721, 730,
        735, 738, 741, 747, 754, 759, 764, 773, 780, 785, 788, 798, 812, 817, 821, 825, 833, 837, 846, 851, 854, 865,
        875, 887, 894, 909, 924, 929, 936, 940, 943, 948, 954, 960, 965, 967, 976, 980, 983, 989, 993, 995, 999, 1002,
        1007, 1010, 1014, 1018, 1021, 1026, 1029, 1033, 1035, 1042, 1045, 1081, 1085, 1089, 1092, 1104, 1115, 1121,
        1129, 1137, 1141, 1143, 1151, 1155, 1165, 1171, 1173, 1178, 1185, 1188, 1191, 1195, 1198, 1201, 1203, 1208,
        1211, 1214, 1221, 1229, 1233, 1237, 1240, 1249, 1253, 1258, 1262, 1267, 1271, 1274, 1276, 1281, 1285, 1288,
        1291, 1294, 1297, 1300, 1303, 1306, 1316, 1327, 1333, 1344, 1349, 1358, 1364, 1370, 1374, 1381, 1383, 1394,
        1405, 1416, 1422, 1445, 1451, 1455, 1469, 1485, 1492, 1501, 1505, 1515, 1524, 1535, 1546, 1549, 1560, 1562,
        1573, 1575, 1579, 1595, 1606, 1619, 1623, 1632, 1637, 1646, 1648, 1684, 1687, 1690, 1711, 1714, 1723, 1732,
        1736, 1749, 1764, 1768, 1771, 1777, 1785, 1788, 1798, 1801, 1811, 1814, 1836, 1841, 1848, 1853, 1856, 1865,
        1872, 1879, 1882, 1888, 1893, 1896,
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

export class TableOptionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public IDENTIFIER(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.IDENTIFIER, 0)!
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableOption
    }
}

export class TableOptionValueContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public LITERAL_STRING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_STRING, 0)
    }
    public LITERAL_INTEGER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.LITERAL_INTEGER, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableOptionValue
    }
}

export class ClusteringDirectionContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public ASC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ASC, 0)
    }
    public DESC(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.DESC, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_clusteringDirection
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
    public withDef(): WithDefContext | null {
        return this.getRuleContext(0, WithDefContext)
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

export class WithDefContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public WITH(): antlr.TerminalNode {
        return this.getToken(PartiQLParser.WITH, 0)!
    }
    public tableOptions(): TableOptionsContext[]
    public tableOptions(i: number): TableOptionsContext | null
    public tableOptions(i?: number): TableOptionsContext[] | TableOptionsContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TableOptionsContext)
        }

        return this.getRuleContext(i, TableOptionsContext)
    }
    public AND(): antlr.TerminalNode[]
    public AND(i: number): antlr.TerminalNode | null
    public AND(i?: number): antlr.TerminalNode | null | antlr.TerminalNode[] {
        if (i === undefined) {
            return this.getTokens(PartiQLParser.AND)
        } else {
            return this.getToken(PartiQLParser.AND, i)
        }
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_withDef
    }
}

export class TableOptionsContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public tableOption(): TableOptionContext | null {
        return this.getRuleContext(0, TableOptionContext)
    }
    public EQ(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.EQ, 0)
    }
    public tableOptionMap(): TableOptionMapContext | null {
        return this.getRuleContext(0, TableOptionMapContext)
    }
    public tableOptionValue(): TableOptionValueContext | null {
        return this.getRuleContext(0, TableOptionValueContext)
    }
    public CLUSTERING(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.CLUSTERING, 0)
    }
    public ORDER(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.ORDER, 0)
    }
    public BY(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BY, 0)
    }
    public PAREN_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_LEFT, 0)
    }
    public clusteringOrder(): ClusteringOrderContext | null {
        return this.getRuleContext(0, ClusteringOrderContext)
    }
    public PAREN_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.PAREN_RIGHT, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableOptions
    }
}

export class TableOptionMapContext extends antlr.ParserRuleContext {
    public constructor(parent: antlr.ParserRuleContext | null, invokingState: number) {
        super(parent, invokingState)
    }
    public BRACE_LEFT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACE_LEFT, 0)
    }
    public tableOptionMap(): TableOptionMapContext[]
    public tableOptionMap(i: number): TableOptionMapContext | null
    public tableOptionMap(i?: number): TableOptionMapContext[] | TableOptionMapContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TableOptionMapContext)
        }

        return this.getRuleContext(i, TableOptionMapContext)
    }
    public BRACE_RIGHT(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.BRACE_RIGHT, 0)
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
    public tableOptionValue(): TableOptionValueContext[]
    public tableOptionValue(i: number): TableOptionValueContext | null
    public tableOptionValue(i?: number): TableOptionValueContext[] | TableOptionValueContext | null {
        if (i === undefined) {
            return this.getRuleContexts(TableOptionValueContext)
        }

        return this.getRuleContext(i, TableOptionValueContext)
    }
    public COLON(): antlr.TerminalNode | null {
        return this.getToken(PartiQLParser.COLON, 0)
    }
    public override get ruleIndex(): number {
        return PartiQLParser.RULE_tableOptionMap
    }
}

export class ClusteringOrderContext extends antlr.ParserRuleContext {
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
    public clusteringDirection(): ClusteringDirectionContext[]
    public clusteringDirection(i: number): ClusteringDirectionContext | null
    public clusteringDirection(i?: number): ClusteringDirectionContext[] | ClusteringDirectionContext | null {
        if (i === undefined) {
            return this.getRuleContexts(ClusteringDirectionContext)
        }

        return this.getRuleContext(i, ClusteringDirectionContext)
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
        return PartiQLParser.RULE_clusteringOrder
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
