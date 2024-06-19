import { ChatResult } from '@aws/language-server-runtimes/protocol'

export const AUTH_FOLLOW_UP_RESULT: ChatResult = {
    body: 'Please authenticate',
    followUp: {
        text: '',
        options: [{ pillText: 'Authenticate', type: 'full-auth' }],
    },
}
