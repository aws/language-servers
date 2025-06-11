import * as awsLsp from '@aws/language-server-runtimes/server-interface'

export type PaidTierMode = 'freetier' | 'freetier-limit' | 'upgrade-pending' | 'paidtier'

export const qProName = 'Q Developer Pro'
export const paidTierLearnMoreUrl = 'https://aws.amazon.com/q/pricing/'
export const paidTierManageSubscription =
    'https://us-east-1.console.aws.amazon.com/amazonq/developer/home?region=us-east-1#/subscriptions'
export const freeTierLimitUserMsg = `Monthly request limit reached. Connect your Builder ID to an AWS account to upgrade to ${qProName} and increase your monthly limits.`

export function onPaidTierLearnMore(lsp: awsLsp.Lsp, log: awsLsp.Logging) {
    lsp.window
        .showDocument({
            external: true, // Client is expected to open the URL in a web browser.
            uri: paidTierLearnMoreUrl,
        })
        .catch(e => {
            log.log(`onPaidTierLearnMore: showDocument failed: ${(e as Error).message}`)
        })
}
