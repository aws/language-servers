import { ChatItem, ChatItemButton, ChatItemFormItem, ChatItemType, TextBasedFormItem } from '@aws/mynah-ui'

export const upgradeQButton: ChatItemButton = {
    flash: 'once',
    fillState: 'hover',
    position: 'outside',
    id: 'paidtier-upgrade-q',
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/q.svg
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/rocket.svg
    // icon: MynahIcons.Q,
    description: 'Upgrade to Amazon Q Pro',
    text: 'Upgrade Q',
    status: 'info',
}

export const freeTierLimitCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'FREE TIER LIMIT REACHED',
    header: {
        icon: 'q',
        iconStatus: 'primary',
        body: 'Upgrade to Amazon Q Pro',
    },
    messageId: 'freetier-limit',
    fullWidth: true,
    canBeDismissed: false,
    body: 'You have reached the free tier limit. Upgrade to Amazon Q Pro.\n\n[Learn More...](https://aws.amazon.com/q/pricing/)',
}

/** "Banner" (sticky card) shown above the chat prompt. */
export const freeTierLimitStickyCard: Partial<ChatItem> = {
    messageId: 'freetier-limit-banner',
    body: 'You have reached the free tier limit. Upgrade to Amazon Q Pro. [Learn More...](https://aws.amazon.com/q/pricing/)',
    buttons: [upgradeQButton],
}

export const paidTierSuccessCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'UPGRADED TO AMAZON Q PRO',
    header: {
        icon: 'q',
        iconStatus: 'primary',
        body: 'Welcome to Amazon Q Pro',
        status: {
            status: 'success',
            icon: 'q',
            text: 'Success',
        },
    },
    messageId: 'paidtier-success',
    fullWidth: true,
    canBeDismissed: true,
    body: 'Upgraded to Amazon Q Pro\n\n[Learn More...](https://aws.amazon.com/q/)',
}

export const paidTierPromptInput: TextBasedFormItem = {
    placeholder: '111111111111',
    type: 'textinput',
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
