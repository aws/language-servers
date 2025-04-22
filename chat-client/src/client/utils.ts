import { Button, ChatMessage } from '@aws/language-server-runtimes-types'
import { ChatItemButton, ChatItemContent, MynahIcons, TreeNodeDetails } from '@aws/mynah-ui'

export function toMynahIcon(icon: string | undefined): MynahIcons | undefined {
    return icon && Object.values<string>(MynahIcons).includes(icon) ? (icon as MynahIcons) : undefined
}

export function toMynahButtons(buttons: Button[] | undefined): ChatItemButton[] | undefined {
    return buttons?.map(button => ({ ...button, icon: toMynahIcon(button.icon) }))
}

export function toMynahHeader(header: ChatMessage['header']): ChatItemContent['header'] {
    return { ...header, icon: toMynahIcon(header?.icon), buttons: toMynahButtons(header?.buttons) }
}

export function toDetailsWithoutIcon(
    details: Record<string, TreeNodeDetails> | undefined
): Record<string, TreeNodeDetails> {
    return Object.fromEntries(
        Object.entries(details || {}).map(([filePath, fileDetails]) => [filePath, { ...fileDetails, icon: null }])
    )
}
