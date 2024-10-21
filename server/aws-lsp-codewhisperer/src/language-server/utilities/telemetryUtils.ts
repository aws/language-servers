import { InitializeParams, ServerInfo } from '@aws/language-server-runtimes/server-interface'
import { IdeCategory, UserContext } from '../../client/token/codewhispererbearertokenclient'

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

export const IDE_CATEGORY_MAP: { [key: string]: IdeCategory } = {
    'Visual Studio Code': 'VSCODE',
    JetBrains: 'JETBRAINS',
    Eclipse: 'ECLIPSE',
    'Visual Studio': 'VISUAL_STUDIO',
}

export const mapClientNameToIdeCategory = (clientName: string): string | undefined => {
    return IDE_CATEGORY_MAP[clientName]
}

export const getIdeCategory = (initializeParams: InitializeParams) => {
    let ideCategory
    if (initializeParams.initializationOptions?.aws.clientInfo?.name) {
        ideCategory = mapClientNameToIdeCategory(initializeParams.initializationOptions?.aws.clientInfo?.name)
    } else if (initializeParams.clientInfo?.name) {
        ideCategory = mapClientNameToIdeCategory(initializeParams.clientInfo?.name)
    }

    return (
        ideCategory ||
        initializeParams.initializationOptions?.aws.clientInfo?.name.replace(/\s+/g, '_').toUpperCase() ||
        initializeParams.clientInfo?.name.replace(/\s+/g, '_').toUpperCase() ||
        'UNKNOWN'
    )
}

// Map result from https://nodejs.org/api/process.html#process_process_platform to expected Operating system
export const getOperatingSystem = () => {
    switch (process.platform) {
        case 'darwin':
            return 'MAC'
        case 'win32':
            return 'WINDOWS'
        case 'linux':
            return 'LINUX'
        default:
            return 'UNKNOWN'
        // return process.platform.toUpperCase();
    }
}

export const makeUserContextObject = (initializeParams: InitializeParams, product: string): UserContext | undefined => {
    const userContext: UserContext = {
        ideCategory: getIdeCategory(initializeParams),
        operatingSystem: getOperatingSystem(),
        product: product,
        clientId: initializeParams?.initializationOptions?.aws?.clientInfo?.clientId,
        ideVersion:
            initializeParams?.initializationOptions?.aws?.clientInfo?.version || initializeParams.clientInfo?.version,
    }

    // TODO: Clarify if we can return values not specified in CodeWhisperer service API
    if (
        !Object.values(IDE_CATEGORY_MAP).includes(userContext.ideCategory) ||
        userContext.operatingSystem === 'UNKNOWN'
    ) {
        return
    }

    return userContext
}
