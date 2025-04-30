import { InitializeParams, Platform, ServerInfo } from '@aws/language-server-runtimes/server-interface'
import { IdeCategory, UserContext } from '../client/token/codewhispererbearertokenclient'

const USER_AGENT_PREFIX = 'AWS-Language-Servers'

export const getUserAgent = (initializeParams: InitializeParams, serverInfo?: ServerInfo): string => {
    const format = (s: string) => s.replace(/\s/g, '-')

    const items: String[] = []

    items.push(USER_AGENT_PREFIX)

    // Fields specific to runtime artifact
    if (serverInfo?.name) {
        serverInfo.version
            ? items.push(`${format(serverInfo.name)}/${serverInfo.version}`)
            : items.push(format(serverInfo.name))
    }

    // Compute client-specific suffix
    // Missing required data fields are replaced with 'UNKNOWN' token
    // Whitespaces in product.name and platform.name are replaced to '-'
    if (initializeParams?.initializationOptions?.aws) {
        const { clientInfo } = initializeParams?.initializationOptions?.aws
        const { extension } = clientInfo || {}

        if (extension) {
            items.push(`${extension.name ? format(extension.name) : 'UNKNOWN'}/${extension.version || 'UNKNOWN'}`)
        }

        if (clientInfo) {
            items.push(`${clientInfo.name ? format(clientInfo.name) : 'UNKNOWN'}/${clientInfo.version || 'UNKNOWN'}`)
        }

        if (clientInfo?.clientId) {
            items.push(`ClientId/${clientInfo?.clientId}`)
        }
    } else {
        // Default to standard InitializeParams.clientInfo if no custom aws.clientInfo is set
        const { clientInfo } = initializeParams || {}
        if (clientInfo) {
            items.push(`${clientInfo.name ? format(clientInfo.name) : 'UNKNOWN'}/${clientInfo.version || 'UNKNOWN'}`)
        }
    }

    return items.join(' ')
}

const IDE_CATEGORY_MAP: { [key: string]: IdeCategory } = {
    // TODO: VSCode key needs to change for getting the correct coefficient value for inline
    'AmazonQ-For-VSCode': 'VSCODE',
    'Amazon Q For JetBrains': 'JETBRAINS',
    'AmazonQ-For-Eclipse': 'ECLIPSE',
    'AWS-Toolkit-For-VisualStudio': 'VISUAL_STUDIO',
}

const mapClientNameToIdeCategory = (clientName: string): string | undefined => {
    return IDE_CATEGORY_MAP[clientName]
}

// Use InitializeParams.initializationOptions.aws.clientInfo.extension to derive IDE Category from calling client
// https://github.com/aws/language-server-runtimes/blob/main/runtimes/protocol/lsp.ts#L60-L69
export const getIdeCategory = (initializeParams: InitializeParams) => {
    let ideCategory
    if (initializeParams.initializationOptions?.aws?.clientInfo?.extension?.name) {
        ideCategory = mapClientNameToIdeCategory(initializeParams.initializationOptions.aws.clientInfo.extension.name)
    }

    return ideCategory || 'UNKNOWN'
}

// Map result from https://github.com/aws/language-server-runtimes/blob/main/runtimes/server-interface/runtime.ts#L6 to expected Operating system
const getOperatingSystem = (platform: Platform) => {
    switch (platform) {
        case 'darwin':
            return 'MAC'
        case 'win32':
            return 'WINDOWS'
        case 'linux':
            return 'LINUX'
        default:
            return 'UNKNOWN'
    }
}

// Compute UserContext object for sendTelemetryEvent API call.
// Do not return context when unknown IDE or Operating system is found.
// This behaviour may change in the future, when API will accept not enumerated values in API definition.
export const makeUserContextObject = (
    initializeParams: InitializeParams,
    platform: Platform,
    product: string
): UserContext | undefined => {
    const userContext: UserContext = {
        ideCategory: getIdeCategory(initializeParams),
        operatingSystem: getOperatingSystem(platform),
        product: product,
        clientId: initializeParams.initializationOptions?.aws?.clientInfo?.clientId,
        ideVersion:
            initializeParams.initializationOptions?.aws?.clientInfo?.version || initializeParams.clientInfo?.version,
    }

    if (userContext.ideCategory === 'UNKNOWN' || userContext.operatingSystem === 'UNKNOWN') {
        return
    }

    return userContext
}
