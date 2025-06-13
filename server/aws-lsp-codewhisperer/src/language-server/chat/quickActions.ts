export enum QuickAction {
    Clear = '/clear',
    Help = '/help',
}

export const HELP_QUICK_ACTION = {
    command: QuickAction.Help,
    description: 'Learn more about Amazon Q',
    icon: 'help',
}

export const CLEAR_QUICK_ACTION = {
    command: QuickAction.Clear,
    description: 'Clear this session',
    icon: 'trash',
}
