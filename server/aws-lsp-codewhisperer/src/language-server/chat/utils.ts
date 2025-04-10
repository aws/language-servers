import { ChatResult } from '@aws/language-server-runtimes/server-interface'
import { GENERIC_UNAUTHORIZED_ERROR, INVALID_TOKEN, MISSING_BEARER_TOKEN_ERROR } from '../../shared/constants'
import { DEFAULT_HELP_FOLLOW_UP_PROMPT, HELP_MESSAGE } from './constants'
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

    return undefined
}
