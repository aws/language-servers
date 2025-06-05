import { FeatureContext } from '@aws/chat-client-ui-types'
import { Button, ChatMessage } from '@aws/language-server-runtimes-types'
import { ChatItemButton, ChatItemContent, MynahIcons, TreeNodeDetails } from '@aws/mynah-ui'

export function toMynahIcon(icon: string | undefined): MynahIcons | undefined {
    return icon && Object.values<string>(MynahIcons).includes(icon) ? (icon as MynahIcons) : undefined
}

export function toMynahButtons(buttons: Button[] | undefined): ChatItemButton[] | undefined {
    return buttons?.map(button => ({ ...button, icon: toMynahIcon(button.icon) }))
}

export function toMynahHeader(header: ChatMessage['header']): ChatItemContent['header'] {
    if (!header) return undefined
    return {
        ...header,
        icon: toMynahIcon(header.icon),
        buttons: toMynahButtons(header.buttons),
        status: header.status ? { ...header.status, icon: toMynahIcon(header.status.icon) } : undefined,
        summary: header.summary as ChatItemContent['summary'],
    }
}

export function toMynahFileList(fileList: ChatMessage['fileList']): ChatItemContent['fileList'] {
    if (!fileList) return undefined
    const fileListTree = {
        fileTreeTitle: '',
        filePaths: fileList.filePaths?.map(file => file),
        rootFolderTitle: fileList.rootFolderTitle ?? 'Context',
        flatList: true,
        hideFileCount: true,
        collapsed: true,
        details: Object.fromEntries(
            Object.entries(fileList.details || {}).map(([filePath, fileDetails]) => [
                filePath,
                {
                    label:
                        fileDetails.lineRanges
                            ?.map(range =>
                                range.first === -1 || range.second === -1 ? '' : `line ${range.first} - ${range.second}`
                            )
                            .join(', ') || '',
                    description: fileDetails.description,
                    visibleName:
                        filePath.split('/').filter(Boolean).pop() || filePath.split('/').slice(-2, -1)[0] || filePath,
                    clickable: true,
                    data: {
                        fullPath: fileDetails.fullPath || '',
                    },
                },
            ])
        ),
    }

    return fileListTree
}

export function toDetailsWithoutIcon(
    details: Record<string, TreeNodeDetails> | undefined
): Record<string, TreeNodeDetails> {
    return Object.fromEntries(
        Object.entries(details || {}).map(([filePath, fileDetails]) => [filePath, { ...fileDetails, icon: null }])
    )
}

export function toMynahContextCommand(feature?: FeatureContext): any {
    if (!feature || !feature.value.stringValue) {
        return {}
    }

    return {
        command: feature.value.stringValue,
        description: feature.variation,
    }
}
