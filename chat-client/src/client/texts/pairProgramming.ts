import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export const programmerModeCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'NEW FEATURE',
    header: {
        icon: 'code-block',
        iconStatus: 'primary',
        body: '### An interactive, agentic coding experience',
    },
    messageId: 'programmerModeCardId',
    fullWidth: true,
    canBeDismissed: true,
    body: 'Amazon Q Developer can now help you write, modify, and maintain code by seamlessly taking actions on your behalf such as reading files, generating code diffs, and running commands.',
}

export const pairProgrammingPromptInput: ChatItemFormItem = {
    type: 'switch',
    id: 'pair-programmer-mode',
    tooltip: 'Agentic coding experience - OFF',
    alternateTooltip: 'Agentic coding experience - ON',
    value: 'true',
    icon: 'code-block',
}

export const pairProgrammingModeOn: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Turn ON agentic coding experience',
}

export const pairProgrammingModeOff: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Turn OFF agentic coding experience',
}
