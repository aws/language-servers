import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export const paidTierCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'FREE TIER LIMIT REACHED',
    header: {
        icon: 'q',
        iconStatus: 'primary',
        body: 'Upgrade to Amazon Q Pro',
    },
    messageId: 'paidTierCardId',
    fullWidth: true,
    canBeDismissed: false,
    body: 'You have reached the free tier limit. Upgraded to Amazon Q Pro.\n\n[Learn More...](https://aws.amazon.com/q/pricing/)',
}

export const paidTierPromptInput: ChatItemFormItem = {
    type: 'switch',
    id: 'paid-tier',
    tooltip: 'Upgrade to Amazon Q Pro',
    value: 'true',
    icon: 'magic',
}

export const paidTierStep0: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    body: 'You have upgraded to Amazon Q Pro',
}

export const paidTierStep1: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    body: 'You have upgraded to Amazon Q Pro',
}
