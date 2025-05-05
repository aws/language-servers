import { ChatItem, ChatItemButton, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

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

export const upgradeQButton: ChatItemButton = {
    flash: 'once',
    fillState: 'hover',
    position: 'outside',
    id: 'upgrade-q',
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/q.svg
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/rocket.svg
    // icon: MynahIcons.Q,
    description: 'Upgrade to Amazon Q Pro',
    text: 'Upgrade Q',
    status: 'info',
}
