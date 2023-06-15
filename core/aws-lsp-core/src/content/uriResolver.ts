/**
 * Gets the contents for a Uri.
 * In case of an error, returns a rejected promise with a displayable error string.
 *
 * This is used by JSON and Yaml language services to resolve loading of JSON Schemas.
 * It has been generalized for use by other systems as well.
 */
export interface UriResolver {
    (uri: string): Promise<string>
}
