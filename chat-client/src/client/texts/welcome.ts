import { TabHeaderDetails } from '@aws/mynah-ui'

const tips: string[] = [
    'You can now see logs with 1-Click!',
    'MCP is available in Amazon Q!',
    'Pinned context is always included in future chat messages',
    'Create and add Saved Prompts using the @ context menu',
    'Compact your conversation with /compact',
    'Ask Q to review your code and see results in the code issues panel!',
]

const getRandomTip = (): string => {
    return tips[Math.floor(Math.random() * tips.length)]
}

/**
 * Tab-level welcome splash for new chat tabs.
 *
 * mynah-ui's `tabHeaderDetails` (>= the version that ships `centered` and
 * `tip` on `TitleDescriptionWithIcon`) renders the entire splash from this
 * data object: centered "Amazon Q" title, "Did you know?" tip card, and
 * helper description. The chat-client only passes data; mynah-ui owns the
 * styling.
 *
 * Returns a fresh object on each call so a new random tip is shown each
 * time a new tab is created.
 */
export const getWelcomeTabHeader = (): TabHeaderDetails => ({
    title: 'Amazon Q',
    tip: {
        title: 'Did you know?',
        body: getRandomTip(),
    },
    description: 'Select code & ask me to explain, debug or optimize it, or type / for quick actions.',
    centered: true,
})
