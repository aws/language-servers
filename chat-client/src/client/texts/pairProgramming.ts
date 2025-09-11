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
    body: 'Amazon Q can now help you write, modify, and maintain code by combining the power of natural language understanding with the ability to take actions on your behalf such as directly making code changes, modifying files, and running commands.',
}

export const pairProgrammingPromptInput: ChatItemFormItem = {
    type: 'switch',
    id: 'pair-programmer-mode',
    tooltip: 'Turn OFF agentic coding',
    alternateTooltip: 'Turn ON agentic coding',
    value: 'true',
    icon: 'code-block',
}

export const pairProgrammingModeOn: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Agentic coding - ON',
}

export const pairProgrammingModeOff: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Agentic coding - OFF',
}
