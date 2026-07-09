import { ChatResult } from '@aws/language-server-runtimes/server-interface'
import { GENERIC_UNAUTHORIZED_ERROR, INVALID_TOKEN, MISSING_BEARER_TOKEN_ERROR } from '../../shared/constants'
import { DEFAULT_HELP_FOLLOW_UP_PROMPT, HELP_MESSAGE, INVALID_PROMPT_MESSAGE } from './constants'
import { v4 as uuid } from 'uuid'
import {
    AmazonQError,
    AmazonQServicePendingProfileError,
    AmazonQServicePendingProfileUpdateError,
    AmazonQServicePendingSigninError,
} from '../../shared/amazonQServiceManager/errors'

type AuthFollowUpType = 'full-auth' | 're-auth' | 'missing_scopes' | 'use-supported-auth'

type AuthErrorDefinition<E extends Error> = { match: (err: E) => boolean; authFollowType: AuthFollowUpType }

const AUTH_ERROR_DEFINITION_LIST: AuthErrorDefinition<Error>[] = [
    {
        match: (err: Error) => err.message.startsWith(MISSING_BEARER_TOKEN_ERROR),
        authFollowType: 'full-auth',
    },
    {
        match: (err: Error) => err.message.startsWith(INVALID_TOKEN),
        authFollowType: 're-auth',
    },
    {
        match: (err: Error) => err.message.startsWith(GENERIC_UNAUTHORIZED_ERROR),
        authFollowType: 'full-auth',
    },
]

const AMAZON_Q_ERROR_DEFINITION_LIST: AuthErrorDefinition<AmazonQError>[] = [
    {
        match: (err: AmazonQError) => err instanceof AmazonQServicePendingProfileError,
        authFollowType: 'use-supported-auth',
    },
    {
        match: (err: AmazonQError) => err instanceof AmazonQServicePendingSigninError,
        authFollowType: 'full-auth',
    },
]

export function getAuthFollowUpType(err: unknown): AuthFollowUpType | undefined {
    return err instanceof AmazonQError
        ? AMAZON_Q_ERROR_DEFINITION_LIST.find(definition => definition.match(err))?.authFollowType
        : err instanceof Error
          ? AUTH_ERROR_DEFINITION_LIST.find(definition => definition.match(err))?.authFollowType
          : undefined
}

export function createAuthFollowUpResult(authType: AuthFollowUpType): ChatResult {
    let pillText
    switch (authType) {
        case 'full-auth':
            pillText = 'Authenticate'
            break
        case 'use-supported-auth':
            pillText = 'Select Q Developer Profile'
            break
        case 'missing_scopes':
            pillText = 'Enable Amazon Q'
            break
        case 're-auth':
            pillText = 'Re-authenticate'
            break
    }

    return {
        body: '',
        followUp: {
            text: '',
            options: [{ pillText, type: authType }],
        },
    }
}

export function getDefaultChatResponse(prompt?: string): ChatResult | undefined {
    if (prompt === DEFAULT_HELP_FOLLOW_UP_PROMPT) {
        return {
            messageId: uuid(),
            body: HELP_MESSAGE,
        }
    }

    if (!prompt || !prompt.trim()) {
        return {
            messageId: uuid(),
            body: INVALID_PROMPT_MESSAGE,
        }
    }

    return undefined
}

/**
 * AWS GovCloud regions. Amazon Q is not supported in these regions.
 * Mirror of GOV_REGIONS in amazon-q-developer-cli
 * (crates/chat-cli/src/util/consts.rs).
 */
const GOV_REGIONS: readonly string[] = ['us-gov-east-1', 'us-gov-west-1']

/**
 * Returns a chat response indicating Amazon Q is not supported in GovCloud,
 * or undefined if the current region is not a GovCloud region.
 *
 * Region resolution order:
 *   1. `initializationOptions.aws.region` sent by the LSP client
 *   2. `AWS_REGION` process env var
 *   3. `AWS_DEFAULT_REGION` process env var (AWS SDK fallback convention)
 *
 * The env vars are populated by SageMaker AI CodeEditor spaces and other
 * AWS-managed environments; both are logged under `[SageMaker Debug]` when
 * the LSP is spawned. See `createServerOptions` in amazon-q-vscode.
 *
 * Parallels amazon-q-developer-cli's startup gate in
 * crates/chat-cli/src/cli/mod.rs:
 *
 *     if let Ok(region) = get_aws_region() {
 *         if GOV_REGIONS.contains(&region.as_str()) {
 *             bail!("AWS GovCloud ({region}) is not supported.")
 *         }
 *     }
 */
export function getGovCloudUnsupportedResponse(clientRegion?: string): ChatResult | undefined {
    const region = clientRegion ?? process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION
    if (region && GOV_REGIONS.includes(region)) {
        return {
            messageId: uuid(),
            body: `Amazon Q is not supported in AWS GovCloud (${region}).`,
        }
    }
    return undefined
}
