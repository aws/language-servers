import { ChatItem, ChatItemButton, ChatItemFormItem, ChatItemType, TextBasedFormItem } from '@aws/mynah-ui'

export const plansAndPricingTitle = 'Plans &amp; Pricing'

export const paidTierLearnMoreUrl = 'https://aws.amazon.com/q/pricing/'

export const upgradeQButton: ChatItemButton = {
    id: 'paidtier-upgrade-q',
    flash: 'once',
    fillState: 'always',
    position: 'inside',
    icon: 'external',
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/q.svg
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/rocket.svg
    // icon: MynahIcons.Q,
    description: 'Upgrade to Amazon Q Pro',
    text: 'Upgrade Q',
    status: 'primary',
    disabled: false,
}

export const learnMoreButton: ChatItemButton = {
    id: 'paidtier-upgrade-q-learnmore',
    fillState: 'hover',
    // position: 'inside',
    icon: 'external',
    description: 'Learn about Amazon Q Pro',
    text: 'Learn more',
    status: 'info',
    disabled: false,
}

export const continueUpgradeQButton: ChatItemButton = {
    id: 'paidtier-upgrade-q-continue',
    icon: 'rocket',
    flash: 'once',
    fillState: 'hover',
    position: 'inside',
    // description: 'Link an AWS account to upgrade Amazon Q',
    text: 'Continue',
    disabled: false,
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
    body: `You have reached the free tier limit. Upgrade to Amazon Q Pro.\n\n[Learn More...](${paidTierLearnMoreUrl})`,
}

/** "Banner" (sticky card) shown above the chat prompt. */
export const freeTierLimitSticky: Partial<ChatItem> = {
    messageId: 'freetier-limit-banner',
    title: 'FREE TIER LIMIT REACHED',
    body: `You've reached your invocation limit for this month. Upgrade to Amazon Q Pro. [Learn More...](${paidTierLearnMoreUrl})`,
    buttons: [upgradeQButton, learnMoreButton],
    canBeDismissed: false,
}

export const upgradePendingSticky: Partial<ChatItem> = {
    messageId: 'upgrade-pending-banner',
    body: 'Waiting for subscription status...',
    status: 'info',
    buttons: [],
    canBeDismissed: true,
}

export const upgradeSuccessSticky: Partial<ChatItem> = {
    messageId: 'upgrade-success-banner',
    // body: 'Successfully upgraded to Amazon Q Pro.',
    status: 'success',
    buttons: [],
    // icon: 'q',
    // iconStatus: 'success',
    header: {
        icon: 'ok-circled',
        iconStatus: 'success',
        body: 'Successfully upgraded to Amazon Q Pro.',
        // status: {
        //     status: 'success',
        //     position: 'right',
        //     text: 'Successfully upgraded to Amazon Q Pro.',
        // },
    },
    canBeDismissed: true,
}

export const paidTierInfoCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'UPGRADE TO AMAZON Q PRO',
    buttons: [upgradeQButton, learnMoreButton],
    header: {
        icon: 'q',
        iconStatus: 'primary',
        body: 'This feature requires a subscription to Amazon Q Pro.',
        status: {
            status: 'info',
            icon: 'q',
        },
    },
    body: `Upgrade to Amazon Q Pro. [Learn More...](${paidTierLearnMoreUrl})`,
    messageId: 'paidtier-info',
    fullWidth: true,
    canBeDismissed: true,
    snapToTop: true,
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
    body: `Upgraded to Amazon Q Pro\n\n[Learn More...](${paidTierLearnMoreUrl})`,
    snapToTop: true,
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

/** "Upgrade Q" form with a "AWS account id" user-input textbox. */
export const paidTierUpgradeForm: ChatItem = {
    type: ChatItemType.ANSWER,
    status: 'info',
    fullWidth: true,
    // title: 'Connect AWS account and upgrade',
    body: `
# Connect AWS account and upgrade

Provide your AWS account number to enable your Pro subscription. Upon confirming the subscription, your AWS account will begin to be charged.

[Learn More...](${paidTierLearnMoreUrl})
`,
    formItems: [
        {
            id: 'awsAccountId',
            type: 'textinput',
            title: 'AWS account ID',
            description: '12-digit AWS account ID',
            // tooltip: 'Link an AWS account to upgrade to Amazon Q Pro',
            validationPatterns: {
                patterns: [{ pattern: '[0-9]{12}', errorMessage: 'Must be a valid 12-digit AWS account ID' }],
            },
        },
    ],
    buttons: [continueUpgradeQButton],
    snapToTop: true,
}
