import { ChatItem, ChatItemButton, ChatItemType, TextBasedFormItem } from '@aws/mynah-ui'

export const plansAndPricingTitle = 'Plans &amp; Pricing'
export const paidTierLearnMoreUrl = 'https://aws.amazon.com/q/pricing/'
export const subscriptionsLearnMoreUrl = 'https://docs.aws.amazon.com/console/amazonq/subscriptions'
export const qProName = 'Q Developer Pro'

export const upgradeQButton: ChatItemButton = {
    id: 'paidtier-upgrade-q',
    flash: 'once',
    fillState: 'always',
    position: 'inside',
    icon: 'external',
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/q.svg
    // https://github.com/aws/mynah-ui/blob/main/src/components/icon/icons/rocket.svg
    // icon: MynahIcons.Q,
    text: `Subscribe to ${qProName}`,
    // description: `Upgrade to ${qProName}`,
    status: 'primary',
    disabled: false,
}

export const learnMoreButton: ChatItemButton = {
    id: 'paidtier-upgrade-q-learnmore',
    fillState: 'hover',
    // position: 'inside',
    icon: 'external',
    description: `Learn about ${qProName}`,
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
    // description: `Link an AWS account to upgrade ${qProName}`,
    text: 'Continue',
    disabled: false,
}

export const freeTierLimitDirective: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    messageId: 'freetier-limit-directive',
    fullWidth: true,
    contentHorizontalAlignment: 'center',
    canBeDismissed: false,
    body: 'Unable to send. Monthly invocation limit met for this month.',
}

/** "Banner" (sticky card) shown above the chat prompt. */
export const freeTierLimitSticky: Partial<ChatItem> = {
    messageId: 'freetier-limit-banner',
    body: `To increase your limit, subscribe to ${qProName}. During the upgrade, you'll be asked to link your Builder ID to the AWS account that will be billed the monthly subscription fee. Learn more about [pricing &gt;](${paidTierLearnMoreUrl})`,
    buttons: [upgradeQButton],
    header: {
        icon: 'warning',
        iconStatus: 'warning',
        body: '### Monthly request limit reached',
    },
    canBeDismissed: false,
}

export const upgradePendingSticky: Partial<ChatItem> = {
    messageId: 'upgrade-pending-banner',
    body: freeTierLimitSticky.body,
    buttons: [upgradeQButton],
    header: {
        icon: 'progress',
        iconStatus: undefined,
        body: '### Waiting for subscription status...',
    },
    canBeDismissed: true,
}

export const upgradeSuccessSticky: Partial<ChatItem> = {
    messageId: 'upgrade-success-banner',
    // body: `Successfully upgraded to ${qProName}.`,
    status: 'success',
    buttons: [],
    // icon: 'q',
    // iconStatus: 'success',
    header: {
        icon: 'ok-circled',
        iconStatus: 'success',
        body: `Successfully upgraded to ${qProName}.`,
        // status: {
        //     status: 'success',
        //     position: 'right',
        //     text: `Successfully upgraded to ${qProName}.`,
        // },
    },
    canBeDismissed: true,
}

export const paidTierInfoCard: ChatItem = {
    type: ChatItemType.ANSWER,
    title: 'UPGRADE TO AMAZON Q PRO',
    buttons: [upgradeQButton],
    header: {
        icon: 'q',
        iconStatus: 'primary',
        body: `This feature requires a subscription to ${qProName}.`,
        status: {
            status: 'info',
            icon: 'q',
        },
    },
    body: `Upgrade to ${qProName}. [Learn More...](${paidTierLearnMoreUrl})`,
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
        body: `Welcome to ${qProName}`,
        status: {
            status: 'success',
            icon: 'q',
            text: 'Success',
        },
    },
    messageId: 'paidtier-success',
    fullWidth: true,
    canBeDismissed: true,
    body: `Upgraded to ${qProName}\n\n[Learn More...](${paidTierLearnMoreUrl})`,
    snapToTop: true,
}

export const paidTierPromptInput: TextBasedFormItem = {
    placeholder: '111111111111',
    type: 'textinput',
    id: 'paid-tier',
    // tooltip: `Upgrade to ${qProName}`,
    value: 'true',
    icon: 'magic',
}

export const paidTierStep0: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    body: `You have upgraded to ${qProName}`,
}

export const paidTierStep1: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    body: `You have upgraded to ${qProName}`,
}

/** "Upgrade Q" form with a "AWS account id" user-input textbox. */
export const paidTierUpgradeForm: ChatItem = {
    type: ChatItemType.ANSWER,
    status: 'info',
    fullWidth: true,
    // title: 'Connect AWS account and upgrade',
    body: `
# Connect AWS account and upgrade

Provide your AWS account number to enable your ${qProName} subscription. Upon confirming the subscription, your AWS account will begin to be charged.

[Learn More...](${paidTierLearnMoreUrl})
`,
    formItems: [
        {
            id: 'awsAccountId',
            type: 'textinput',
            title: 'AWS account ID',
            description: '12-digit AWS account ID',
            // tooltip: `Link an AWS account to upgrade to ${qProName}`,
            validationPatterns: {
                patterns: [{ pattern: '[0-9]{12}', errorMessage: 'Must be a valid 12-digit AWS account ID' }],
            },
        },
    ],
    buttons: [continueUpgradeQButton],
    snapToTop: true,
}

export const IdCRequestLimtReachedSticky: Partial<ChatItem> = {
    messageId: 'Idc-request-limit-reached-banner',
    body: `To increase your limit, contact your administrator to enable overages or upgrade your subscription tier. Learn more about [subscriptions &gt;](${subscriptionsLearnMoreUrl})`,
    header: {
        icon: 'warning',
        iconStatus: 'warning',
        body: '### Monthly request limit reached',
    },
    canBeDismissed: false,
}
