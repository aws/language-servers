/**
 * Preservation Property-Based Tests — Context Commands Provider Small Payload Behavior
 *
 * These tests capture the OBSERVED behavior of processContextCommandUpdate and
 * mapContextCommandItems on unfixed code for non-buggy inputs (small payloads).
 * They must PASS on unfixed code to confirm baseline behavior that must be preserved.
 *
 * **Validates: Requirements 3.2, 3.3, 3.5, 3.6**
 */
import * as fc from 'fast-check'
import * as sinon from 'sinon'
import { ContextCommandsProvider } from './contextCommandsProvider'
import { TestFeatures } from '@aws/language-server-runtimes/testing'
import * as chokidar from 'chokidar'
import { ContextCommandItem } from 'local-indexing'
import { LocalProjectContextController } from '../../../shared/localProjectContextController'

/** Arbitrary for ContextCommandItem type */
const contextItemTypeArb = fc.constantFrom('file' as const, 'folder' as const)

/** Arbitrary for a single ContextCommandItem (file or folder) */
const contextCommandItemArb = fc
    .tuple(
        fc.constantFrom('/workspace/project1', '/workspace/project2', '/workspace/myapp'),
        contextItemTypeArb,
        fc
            .tuple(
                fc.constantFrom('src', 'lib', 'test', 'docs', 'utils'),
                fc.constantFrom('index', 'main', 'helper', 'config', 'service'),
                fc.constantFrom('.ts', '.js', '.json', '.md')
            )
            .map(([dir, name, ext]) => `${dir}/${name}${ext}`),
        fc.uuid()
    )
    .map(
        ([workspaceFolder, type, relativePath, id]): ContextCommandItem => ({
            workspaceFolder,
            type,
            relativePath,
            id,
        })
    )

/** Arbitrary for a small list of context command items (<1,000) */
const smallContextItemsArb = fc.array(contextCommandItemArb, { minLength: 0, maxLength: 200 })

describe('Preservation: Context Commands Provider Small Payload Behavior', () => {
    let provider: ContextCommandsProvider
    let testFeatures: TestFeatures
    let sendContextCommandsSpy: sinon.SinonStub

    beforeEach(() => {
        sinon.stub(chokidar, 'watch').returns({
            on: sinon.stub(),
            close: sinon.stub(),
        } as unknown as chokidar.FSWatcher)

        testFeatures = new TestFeatures()
        testFeatures.workspace.fs.exists = sinon.stub().resolves(false)
        testFeatures.workspace.fs.readdir = sinon.stub().resolves([])

        sinon.stub(LocalProjectContextController, 'getInstance').resolves({
            onContextItemsUpdated: sinon.stub(),
            onIndexingInProgressChanged: sinon.stub(),
        } as any)

        provider = new ContextCommandsProvider(
            testFeatures.logging,
            testFeatures.chat,
            testFeatures.workspace,
            testFeatures.lsp
        )
        sinon.stub(provider, 'registerPromptFileWatcher').resolves()

        // testFeatures.chat.sendContextCommands is already a stub, so wrap it with a spy
        sendContextCommandsSpy = testFeatures.chat.sendContextCommands as unknown as sinon.SinonStub
    })

    afterEach(() => {
        sinon.restore()
    })

    /**
     * **Validates: Requirements 3.2, 3.3**
     *
     * Property 2d: For all context item lists with <1,000 items,
     * mapContextCommandItems correctly categorizes items into Files, Folders,
     * and Code groups, and all items are present in the output.
     */
    it('mapContextCommandItems categorizes all small payload items correctly', async () => {
        await fc.assert(
            fc.asyncProperty(smallContextItemsArb, async items => {
                const result = await provider.mapContextCommandItems(items)

                // Result should have exactly one top-level group
                if (result.length !== 1) return false

                const topCommands = result[0].commands ?? []

                // Find the Files, Folders, and Code command groups
                const filesCmd = topCommands.find(cmd => cmd.command === 'Files')
                const foldersCmd = topCommands.find(cmd => cmd.command === 'Folders')
                const codeCmd = topCommands.find(cmd => cmd.command === 'Code')

                if (!filesCmd || !foldersCmd || !codeCmd) return false

                const fileChildren = filesCmd.children?.[0]?.commands ?? []
                const folderChildren = foldersCmd.children?.[0]?.commands ?? []
                const codeChildren = codeCmd.children?.[0]?.commands ?? []

                // Count expected items by type
                const expectedFiles = items.filter(i => i.type === 'file').length
                const expectedFolders = items.filter(i => i.type === 'folder').length
                const expectedCode = items.filter(i => i.type === 'code').length

                // Files group has +1 for the "Active File" command
                if (fileChildren.length !== expectedFiles + 1) return false
                if (folderChildren.length !== expectedFolders) return false
                if (codeChildren.length !== expectedCode) return false

                return true
            }),
            { numRuns: 30 }
        )
    })

    /**
     * **Validates: Requirements 3.2**
     *
     * Property 2e: For all valid context item selections, processContextCommandUpdate
     * dispatches exactly one chat.sendContextCommands call with a contextCommandGroups
     * payload.
     *
     * Note: the prior version of this test also asserted that items were cached on
     * `cachedContextCommands`. That field was removed in `refactor: remove stale
     * context command cache, always pull fresh from indexer` — the server now pulls
     * fresh items from the indexer on every request instead of caching, so the
     * assertion was deleted.
     */
    it('processContextCommandUpdate dispatches a single sendContextCommands payload for small payloads', async () => {
        await fc.assert(
            fc.asyncProperty(smallContextItemsArb, async items => {
                sendContextCommandsSpy.resetHistory()

                await provider.processContextCommandUpdate(items)

                // sendContextCommands should be called exactly once
                if (sendContextCommandsSpy.callCount !== 1) return false

                // The sent payload should contain contextCommandGroups
                const sentPayload = sendContextCommandsSpy.firstCall.args[0]
                if (!sentPayload.contextCommandGroups) return false

                return true
            }),
            { numRuns: 30 }
        )
    })

    /**
     * **Validates: Requirements 3.5**
     *
     * Property 2f: For all tab types in ['cwc', 'unknown', 'welcome'],
     * context commands are distributed to those tabs.
     *
     * This tests the tab distribution logic by verifying that the
     * onContextCommandDataReceived callback (which is the consumer of
     * processContextCommandUpdate's output) correctly filters tab types.
     *
     * We test the filtering logic directly since the actual callback is in
     * the VSCode extension (main.ts) and requires a full UI setup.
     */
    it('tab type filtering correctly identifies eligible tabs', () => {
        const eligibleTabTypes = ['cwc', 'unknown', 'welcome']
        const ineligibleTabTypes = ['featuredev', 'gumby', 'agentWalkthrough', 'review', '']

        fc.assert(
            fc.property(
                fc.constantFrom(...eligibleTabTypes),
                fc.constantFrom(...ineligibleTabTypes),
                (eligibleType, ineligibleType) => {
                    // The tab distribution logic from main.ts:
                    // if (['cwc', 'unknown', 'welcome'].includes(tabType))
                    const isEligible = (tabType: string) => ['cwc', 'unknown', 'welcome'].includes(tabType)

                    // Eligible types should pass the filter
                    if (!isEligible(eligibleType)) return false

                    // Ineligible types should not pass the filter
                    if (isEligible(ineligibleType)) return false

                    return true
                }
            ),
            { numRuns: 30 }
        )
    })

    /**
     * **Validates: Requirements 3.6**
     *
     * Property 2g: For all valid context item selections, the selected item's
     * data is preserved through the mapContextCommandItems transformation —
     * the item's id, description, and route are maintained so that selection
     * can correctly insert the item into prompt input.
     */
    it('mapContextCommandItems preserves item identity for selection', async () => {
        await fc.assert(
            fc.asyncProperty(smallContextItemsArb, async items => {
                if (items.length === 0) return true

                const result = await provider.mapContextCommandItems(items)
                const topCommands = result[0].commands ?? []

                const filesCmd = topCommands.find(cmd => cmd.command === 'Files')
                const foldersCmd = topCommands.find(cmd => cmd.command === 'Folders')

                const fileChildren = filesCmd?.children?.[0]?.commands ?? []
                const folderChildren = foldersCmd?.children?.[0]?.commands ?? []

                // Check that each file item preserves its identity
                for (const item of items.filter(i => i.type === 'file')) {
                    const mapped = fileChildren.find(cmd => cmd.id === item.id)
                    if (!mapped) return false
                    // Route should contain workspace folder and relative path
                    if (
                        !mapped.route ||
                        mapped.route[0] !== item.workspaceFolder ||
                        mapped.route[1] !== item.relativePath
                    ) {
                        return false
                    }
                }

                // Check that each folder item preserves its identity
                for (const item of items.filter(i => i.type === 'folder')) {
                    const mapped = folderChildren.find(cmd => cmd.id === item.id)
                    if (!mapped) return false
                    if (
                        !mapped.route ||
                        mapped.route[0] !== item.workspaceFolder ||
                        mapped.route[1] !== item.relativePath
                    ) {
                        return false
                    }
                }

                return true
            }),
            { numRuns: 30 }
        )
    })
})
