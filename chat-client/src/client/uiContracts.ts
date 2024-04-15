import { MessageCommand } from '../ui/commands'
import { TabType } from '../ui/storages/tabsStorage'

export interface UiRequest {
    command: MessageCommand
    tabType?: TabType
    params?: RequestParams
}

export type RequestParams = FocusParams

export interface FocusParams {
    type: string
}
