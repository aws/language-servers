/* tslint:disable */
/* eslint-disable */
/**
 * @param {string} query
 * @param {string} env
 * @returns {string}
 */
export function generate_session(query: string, env: string): string
/**
 * @param {string} session
 * @returns {Array<any>}
 */
export function decode_session_as_array(session: string): Array<any>
/**
 * Parses the given query and returns the json serialized string.
 * @param {string} query
 * @returns {string}
 */
export function parse_as_json(query: string): string
/**
 * Evaluates the given query using the given environment and returns the json serialized string.
 * @param {string} statement
 * @param {string} env
 * @returns {string}
 */
export function eval_as_json(statement: string, env: string): string
/**
 * Evaluates the given query using the given environment and returns the output string.
 * @param {string} statement
 * @param {string} env
 * @returns {string}
 */
export function eval_as_string(statement: string, env: string): string
/**
 * Creates a logical plan for the given query and returns the json serialized string.
 * @param {string} statement
 * @returns {string}
 */
export function explain_as_json(statement: string): string
/**
 * Creates a logical plan for the given query and returns the output string.
 * @param {string} statement
 * @returns {string}
 */
export function explain_as_string(statement: string): string

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module

export interface InitOutput {
    readonly memory: WebAssembly.Memory
    readonly generate_session: (a: number, b: number, c: number, d: number, e: number) => void
    readonly decode_session_as_array: (a: number, b: number) => number
    readonly parse_as_json: (a: number, b: number, c: number) => void
    readonly eval_as_json: (a: number, b: number, c: number, d: number, e: number) => void
    readonly eval_as_string: (a: number, b: number, c: number, d: number, e: number) => void
    readonly explain_as_json: (a: number, b: number, c: number) => void
    readonly explain_as_string: (a: number, b: number, c: number) => void
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number
    readonly __wbindgen_malloc: (a: number, b: number) => number
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number
    readonly __wbindgen_free: (a: number, b: number, c: number) => void
}

export type SyncInitInput = BufferSource | WebAssembly.Module
/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {SyncInitInput} module
 *
 * @returns {InitOutput}
 */
export function initSync(module: SyncInitInput): InitOutput

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {InitInput | Promise<InitInput>} module_or_path
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init(module_or_path?: InitInput | Promise<InitInput>): Promise<InitOutput>
