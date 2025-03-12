import { CodeWhispererServiceToken } from './codeWhispererService'

export class CodeWhispererServiceManager {
    private static instance: CodeWhispererServiceManager
    private codewhispererService: CodeWhispererServiceToken | null = null

    private constructor() {}

    public static getInstance(): CodeWhispererServiceManager {
        if (!CodeWhispererServiceManager.instance) {
            CodeWhispererServiceManager.instance = new CodeWhispererServiceManager()
        }
        return CodeWhispererServiceManager.instance
    }

    // public getCodeWhispererClient(): CodeWhispererServiceToken {
    //     // const awsQRegion = runtime.getConfiguration('AWS_Q_REGION') ?? DEFAULT_AWS_Q_REGION
    //     // const awsQEndpointUrl = runtime.getConfiguration('AWS_Q_ENDPOINT_URL') ?? DEFAULT_AWS_Q_ENDPOINT_URL

    //     // if (!this.codewhispererService) {
    //     //     this.codewhispererService = new CodeWhispererServiceToken(
    //     //         credentialsProvider,
    //     //         workspace,
    //     //         awsQRegion,
    //     //         awsQEndpointUrl,
    //     //         sdkInitializator
    //     //     );
    //     // }

    //     // return this.codewhispererService;
    // }

    public resetClient(): void {
        this.codewhispererService = null
    }
}

// Usage example:
// export const getCodeWhispererClient = (): CodeWhispererServiceToken => {
//     return CodeWhispererServiceManager.getInstance().getCodeWhispererClient();
// };
