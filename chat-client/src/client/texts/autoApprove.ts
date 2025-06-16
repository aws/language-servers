import { ChatItem, ChatItemFormItem, ChatItemType } from '@aws/mynah-ui'

export const autoApproveEnableInput: ChatItemFormItem = {
    type: 'checkbox',
    id: 'auto-approve',
    label: 'Auto Approve',
    value: 'false',
    icon: 'flash',
    tooltip: 'Enable auto-approve for executing tools',
    alternateTooltip: 'Disable auto-approve for executing tools',
}

export const autoApproveEnabled: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Auto Approve - ON',
}
export const autoApproveDisabled: ChatItem = {
    type: ChatItemType.DIRECTIVE,
    contentHorizontalAlignment: 'center',
    fullWidth: true,
    body: 'Auto Approve - OFF',
}
