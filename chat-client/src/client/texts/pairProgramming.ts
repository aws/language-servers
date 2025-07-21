import { ChatItem, ChatItemFormItem, ChatItemType, MynahIcons } from '@aws/mynah-ui'

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

export const testRerouteCard: ChatItem = {
    type: ChatItemType.ANSWER,
    border: true,
    header: {
        padding: true,
        iconForegroundStatus: 'warning',
        icon: MynahIcons.INFO,
        body: 'You can now ask to generate unit tests directly in the chat.',
    },
    body: `You don't need to explicitly use /test. We've redirected your request to chat.
Ask me to do things like:
• Add unit tests for highlighted functions in my active file
• Generate tests for null and empty inputs in my project`,
}

export const docRerouteCard: ChatItem = {
    type: ChatItemType.ANSWER,
    border: true,
    header: {
        padding: true,
        iconForegroundStatus: 'warning',
        icon: MynahIcons.INFO,
        body: 'You can now ask to generate documentation directly in the chat.',
    },
    body: `You don't need to explicitly use /doc. We've redirected your request to chat.`,
}

export const devRerouteCard: ChatItem = {
    type: ChatItemType.ANSWER,
    border: true,
    header: {
        padding: true,
        iconForegroundStatus: 'warning',
        icon: MynahIcons.INFO,
        body: 'You can now ask to generate code directly in the chat.',
    },
    body: `You don't need to explicitly use /dev. We've redirected your request to chat.
Ask me to do things like:
1. Create a project
2. Add a feature
3. Modify your files`,
}

export const reviewRerouteCard: ChatItem = {
    type: ChatItemType.ANSWER,
    border: true,
    header: {
        padding: true,
        iconForegroundStatus: 'warning',
        icon: MynahIcons.INFO,
        body: 'You can now ask to run code reviews directly in the chat.',
    },
    body: `You don't need to explicitly use /review. We've redirected your request to chat.
Ask me to do things like:
• Perform a code review of my active file
• Perform a code review of uncommitted changes in my active file
• Perform a code review of my @workspace`,
}

export const createRerouteCard = (command: string): ChatItem => {
    switch (command) {
        case '/test':
            return testRerouteCard
        case '/doc':
            return docRerouteCard
        case '/dev':
            return devRerouteCard
        case '/review':
            return reviewRerouteCard
        default:
            return devRerouteCard // Default fallback
    }
}
