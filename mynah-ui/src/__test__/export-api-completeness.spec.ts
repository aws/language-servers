/**
 * **Feature: mynah-ui-port, Property 2: Export API Completeness**
 * **Validates: Requirements 2.4, 8.2, 10.5**
 *
 * Property: For any public export (class, type, interface, function, or constant)
 * that is exported from the original mynah-ui package's main entry point,
 * the same export SHALL be available from the ported package's main entry point
 * with identical type signatures.
 *
 * Note: TypeScript interfaces and types are compile-time only constructs and
 * cannot be verified at runtime. This test verifies runtime exports (classes,
 * functions, enums, objects) and relies on TypeScript compilation to verify
 * type exports.
 */

import * as fc from 'fast-check'

// Runtime exports that can be verified at runtime
// These are classes, functions, enums, and objects that exist at runtime
const RUNTIME_EXPORTS = {
    // Main class
    classes: ['MynahUI'],

    // Helper functions
    functions: ['generateUID', 'cleanHtml', 'escapeHtml'],

    // Component abstract classes (these are classes, not interfaces)
    componentAbstracts: [
        'ButtonAbstract',
        'RadioGroupAbstract',
        'SelectAbstract',
        'TextInputAbstract',
        'TextAreaAbstract',
    ],

    // DOM utilities (classes only - ExtendedHTMLElement is an interface)
    domUtilities: ['DomBuilder'],

    // Icon exports (enum - MynahIcons is an enum, MynahIconsType is a type alias)
    iconExports: ['MynahIcons'],

    // Test IDs (object)
    testExports: ['MynahUITestIds'],

    // Chat item component class
    chatItemExports: ['ChatItemCardContent'],

    // Enums from static.ts
    enums: [
        'MynahEventNames',
        'MynahPortalNames',
        'ChatItemType',
        'KeyMap',
        'RelevancyVoteType',
        'EngagementType',
        'NotificationType',
    ],
} as const

// Flatten all runtime exports into a single array
const ALL_RUNTIME_EXPORTS = [
    ...RUNTIME_EXPORTS.classes,
    ...RUNTIME_EXPORTS.functions,
    ...RUNTIME_EXPORTS.componentAbstracts,
    ...RUNTIME_EXPORTS.domUtilities,
    ...RUNTIME_EXPORTS.iconExports,
    ...RUNTIME_EXPORTS.testExports,
    ...RUNTIME_EXPORTS.chatItemExports,
    ...RUNTIME_EXPORTS.enums,
]

// Type-only exports that are verified at compile time
// These are TypeScript interfaces and type aliases that don't exist at runtime
// We verify these by importing them and using them in type assertions
import type {
    // Props interfaces
    ButtonProps,
    RadioGroupProps,
    SelectProps,
    TextInputProps,
    TextAreaProps,
    ChatItemCardContentProps,
    // Main interfaces
    MynahUIProps,
    // DOM types
    DomBuilderObject,
    ChatItemBodyRenderer,
    ExtendedHTMLElement,
    // Sanitize types
    AllowedAttributesInCustomRenderer,
    AllowedTagsInCustomRenderer,
    // Tab types
    ToggleOption,
    // Icon types
    MynahIconsType,
    // Static types
    QuickActionCommand,
    CustomQuickActionCommand,
    QuickActionCommandGroup,
    QuickActionCommandsHeader,
    MynahUIDataModel,
    MynahUITabStoreTab,
    MynahUITabStoreModel,
    SourceLinkMetaData,
    SourceLink,
    DetailedList,
    DetailedListItemGroup,
    DetailedListItem,
    ProgressField,
    TreeNodeDetails,
    DropdownListOption,
    DropdownListProps,
    DropdownFactoryProps,
    ChatItemContent,
    ChatItem,
    ValidationPattern,
    ChatPrompt,
    ChatItemAction,
    ChatItemButton,
    Action,
    TabBarAction,
    TabBarMainAction,
    FileNodeAction,
    ReferenceTrackerInformation,
    Engagement,
    FeedbackPayload,
    TabHeaderDetails,
    CodeBlockAction,
    CodeBlockActions,
    ConfigTexts,
    ComponentOverrides,
    ConfigOptions,
    ConfigModel,
    CardRenderDetails,
    ListFormItem,
    ListItemEntry,
    Status,
    PromptAttachmentType,
    CodeSelectionType,
    OnCopiedToClipboardFunction,
    OnCodeBlockActionFunction,
    SingularFormItem,
    ChatItemFormItem,
    FilterOption,
    TextBasedFormItem,
} from '../main'

// Type assertions to verify type exports exist at compile time
// If any of these types are missing, TypeScript compilation will fail
type TypeExportVerification = {
    buttonProps: ButtonProps
    radioGroupProps: RadioGroupProps
    selectProps: SelectProps
    textInputProps: TextInputProps
    textAreaProps: TextAreaProps
    chatItemCardContentProps: ChatItemCardContentProps
    mynahUIProps: MynahUIProps
    domBuilderObject: DomBuilderObject
    chatItemBodyRenderer: ChatItemBodyRenderer
    extendedHTMLElement: ExtendedHTMLElement
    allowedAttributesInCustomRenderer: AllowedAttributesInCustomRenderer
    allowedTagsInCustomRenderer: AllowedTagsInCustomRenderer
    toggleOption: ToggleOption
    mynahIconsType: MynahIconsType
    quickActionCommand: QuickActionCommand
    customQuickActionCommand: CustomQuickActionCommand
    quickActionCommandGroup: QuickActionCommandGroup
    quickActionCommandsHeader: QuickActionCommandsHeader
    mynahUIDataModel: MynahUIDataModel
    mynahUITabStoreTab: MynahUITabStoreTab
    mynahUITabStoreModel: MynahUITabStoreModel
    sourceLinkMetaData: SourceLinkMetaData
    sourceLink: SourceLink
    detailedList: DetailedList
    detailedListItemGroup: DetailedListItemGroup
    detailedListItem: DetailedListItem
    progressField: ProgressField
    treeNodeDetails: TreeNodeDetails
    dropdownListOption: DropdownListOption
    dropdownListProps: DropdownListProps
    dropdownFactoryProps: DropdownFactoryProps
    chatItemContent: ChatItemContent
    chatItem: ChatItem
    validationPattern: ValidationPattern
    chatPrompt: ChatPrompt
    chatItemAction: ChatItemAction
    chatItemButton: ChatItemButton
    action: Action
    tabBarAction: TabBarAction
    tabBarMainAction: TabBarMainAction
    fileNodeAction: FileNodeAction
    referenceTrackerInformation: ReferenceTrackerInformation
    engagement: Engagement
    feedbackPayload: FeedbackPayload
    tabHeaderDetails: TabHeaderDetails
    codeBlockAction: CodeBlockAction
    codeBlockActions: CodeBlockActions
    configTexts: ConfigTexts
    componentOverrides: ComponentOverrides
    configOptions: ConfigOptions
    configModel: ConfigModel
    cardRenderDetails: CardRenderDetails
    listFormItem: ListFormItem
    listItemEntry: ListItemEntry
    status: Status
    promptAttachmentType: PromptAttachmentType
    codeSelectionType: CodeSelectionType
    onCopiedToClipboardFunction: OnCopiedToClipboardFunction
    onCodeBlockActionFunction: OnCodeBlockActionFunction
    singularFormItem: SingularFormItem
    chatItemFormItem: ChatItemFormItem
    filterOption: FilterOption
    textBasedFormItem: TextBasedFormItem
}

// This variable is never used but ensures TypeScript verifies the types exist
// eslint-disable-next-line @typescript-eslint/no-unused-vars
declare const _typeVerification: TypeExportVerification

describe('Export API Completeness Property Test', () => {
    // Import the ported package
    let portedExports: Record<string, unknown>

    beforeAll(async () => {
        // Dynamic import to get all exports
        portedExports = await import('../main')
    })

    /**
     * Property 2: Export API Completeness (Runtime Exports)
     *
     * For any runtime export from the expected exports list,
     * the ported package SHALL export the same symbol.
     */
    it('should export all expected runtime symbols from the ported package', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_RUNTIME_EXPORTS), exportName => {
                // Check that the export exists in the ported package
                const exportExists = exportName in portedExports

                // If the export doesn't exist, provide a helpful error message
                if (!exportExists) {
                    throw new Error(`Missing export: '${exportName}' is not exported from the ported package`)
                }

                return exportExists
            }),
            { numRuns: ALL_RUNTIME_EXPORTS.length } // Run once for each expected export
        )
    })

    /**
     * Additional verification: Check that all expected runtime exports are defined (not undefined)
     */
    it('should have all expected runtime exports defined (not undefined)', () => {
        fc.assert(
            fc.property(fc.constantFrom(...ALL_RUNTIME_EXPORTS), exportName => {
                const exportValue = portedExports[exportName]
                const isDefined = exportValue !== undefined

                if (!isDefined) {
                    throw new Error(`Export '${exportName}' exists but is undefined`)
                }

                return isDefined
            }),
            { numRuns: ALL_RUNTIME_EXPORTS.length }
        )
    })

    /**
     * Verify that the MynahUI class is a constructor function
     */
    it('should export MynahUI as a class/constructor', () => {
        expect(typeof portedExports.MynahUI).toBe('function')
    })

    /**
     * Verify that helper functions are actually functions
     */
    it('should export helper functions as functions', () => {
        fc.assert(
            fc.property(fc.constantFrom(...RUNTIME_EXPORTS.functions), functionName => {
                const exportValue = portedExports[functionName]
                const isFunction = typeof exportValue === 'function'

                if (!isFunction) {
                    throw new Error(`Export '${functionName}' should be a function but is ${typeof exportValue}`)
                }

                return isFunction
            }),
            { numRuns: RUNTIME_EXPORTS.functions.length }
        )
    })

    /**
     * Verify that component abstracts are classes/constructors
     */
    it('should export component abstracts as classes', () => {
        fc.assert(
            fc.property(fc.constantFrom(...RUNTIME_EXPORTS.componentAbstracts), abstractName => {
                const exportValue = portedExports[abstractName]
                const isFunction = typeof exportValue === 'function'

                if (!isFunction) {
                    throw new Error(`Export '${abstractName}' should be a class but is ${typeof exportValue}`)
                }

                return isFunction
            }),
            { numRuns: RUNTIME_EXPORTS.componentAbstracts.length }
        )
    })

    /**
     * Verify that enums are objects with expected values
     */
    it('should export enums as objects', () => {
        fc.assert(
            fc.property(fc.constantFrom(...RUNTIME_EXPORTS.enums), enumName => {
                const exportValue = portedExports[enumName]
                const isObject = typeof exportValue === 'object' && exportValue !== null

                if (!isObject) {
                    throw new Error(`Export '${enumName}' should be an enum/object but is ${typeof exportValue}`)
                }

                return isObject
            }),
            { numRuns: RUNTIME_EXPORTS.enums.length }
        )
    })

    /**
     * Verify DomBuilder is a class with getInstance method
     */
    it('should export DomBuilder with getInstance method', () => {
        const DomBuilder = portedExports.DomBuilder as { getInstance: () => unknown }
        expect(typeof DomBuilder).toBe('function')
        expect(typeof DomBuilder.getInstance).toBe('function')
    })

    /**
     * Verify generateUID returns a string
     */
    it('should have generateUID that returns a string', () => {
        const generateUID = portedExports.generateUID as () => string
        const result = generateUID()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
    })

    /**
     * Verify MynahUITestIds is an object with test ID properties
     */
    it('should export MynahUITestIds as an object with nested properties', () => {
        const testIds = portedExports.MynahUITestIds as Record<string, unknown>
        expect(typeof testIds).toBe('object')
        expect(testIds).not.toBeNull()
        // Verify the structure has expected nested properties
        expect(typeof testIds.selector).toBe('string')
        expect(typeof testIds.prompt).toBe('object')
        expect(typeof testIds.chat).toBe('object')
        expect(typeof testIds.chatItem).toBe('object')
    })

    /**
     * Verify ChatItemType enum has expected values
     */
    it('should export ChatItemType enum with expected values', () => {
        const ChatItemType = portedExports.ChatItemType as Record<string, string>
        expect(ChatItemType.PROMPT).toBe('prompt')
        expect(ChatItemType.ANSWER).toBe('answer')
        expect(ChatItemType.ANSWER_STREAM).toBe('answer-stream')
    })

    /**
     * Verify MynahEventNames enum has expected values
     */
    it('should export MynahEventNames enum with expected values', () => {
        const MynahEventNames = portedExports.MynahEventNames as Record<string, string>
        expect(MynahEventNames.CHAT_PROMPT).toBe('chatPrompt')
        expect(MynahEventNames.FEEDBACK_SET).toBe('feedbackSet')
        expect(MynahEventNames.CARD_VOTE).toBe('cardVote')
    })

    /**
     * Compile-time type verification
     * This test always passes at runtime but ensures TypeScript compilation
     * verifies all type exports exist
     */
    it('should have all type exports verified at compile time', () => {
        // This test verifies that the TypeScript compiler successfully
        // resolved all type imports at the top of this file.
        // If any type export is missing, the test file won't compile.
        expect(true).toBe(true)
    })
})
