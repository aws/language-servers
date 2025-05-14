export enum QuickAction {
    Clear = '/clear',
    Help = '/help',
    Manage = '/manage',
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

export const MANAGE_QUICK_ACTION = {
    command: QuickAction.Manage,
    description: 'Manage Amazon Q Subscription',
    icon: 'menu', // 'check-list'
}
