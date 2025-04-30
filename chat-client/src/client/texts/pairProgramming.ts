import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export const programmerModeCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'NEW FEATURE',
    header: {
        icon: 'code-block',
        iconStatus: 'primary',
        body: '## Pair Programmer',
    },
    messageId: 'programmerModeCardId',
    fullWidth: true,
    canBeDismissed: true,
    body: 'Amazon Q Developer chat can now write code and run shell commands on your behalf. Disable Pair Programmer if you prefer a read-only experience.',
}

export const pairProgrammingPromptInput: ChatItemFormItem = {
    type: 'switch',
    id: 'pair-programmer-mode',
    tooltip: 'Turn off for read only responses',
    alternateTooltip: 'Turn on to allow Q to run commands and generate code diffs',
    value: 'true',
    icon: 'code-block',
}

export const pairProgrammingModeOn: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Pair programmer mode ON',
}

export const pairProgrammingModeOff: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Pair programmer mode OFF',
}
