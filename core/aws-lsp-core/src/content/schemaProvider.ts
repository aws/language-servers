/**
 * The schema request service is used to fetch schemas. If successful, returns a resolved promise with the content of the schema.
 * In case of an error, returns a rejected promise with a displayable error string.
 */
export interface SchemaProvider {
    (uri: string): Promise<string>
}
