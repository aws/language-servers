import { MynahIconsType, MynahUI, DetailedListItem, DetailedListItemGroup, MynahIcons } from '@aws/mynah-ui'
import { Messager } from '../messager'
import { ListRulesResult } from '@aws/language-server-runtimes-types'
import { RulesFolder } from '@aws/language-server-runtimes-types'
import { MynahDetailedList } from './history'

export const ContextRule = {
    CreateRuleId: 'create-rule',
    CancelButtonId: 'cancel-create-rule',
    SubmitButtonId: 'submit-create-rule',
    RuleNameFieldId: 'rule-name',
} as const

export class RulesList {
    rulesList: MynahDetailedList | undefined
    tabId: string = ''

    constructor(
        private mynahUi: MynahUI,
        private messager: Messager
    ) {}

    private onRuleFolderClick = (groupName: string) => {
        this.messager.onRuleClick({ tabId: this.tabId, type: 'folder', id: groupName })
    }

    private onRuleClick = (item: DetailedListItem) => {
        if (item.id) {
            if (item.id === ContextRule.CreateRuleId) {
                this.rulesList?.close()
                this.mynahUi.showCustomForm(
                    this.tabId,
                    [
                        {
                            id: ContextRule.RuleNameFieldId,
                            type: 'textinput',
                            mandatory: true,
                            autoFocus: true,
                            title: 'Rule name',
                            placeholder: 'Enter rule name',
                            validationPatterns: {
                                patterns: [
                                    {
                                        pattern: /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/,
                                        errorMessage:
                                            'Use only letters, numbers, hyphens, and underscores, starting with a letter or number. Maximum 100 characters.',
                                    },
                                ],
                            },
                            validateOnChange: true,
                            description:
                                "This will create a [rule name].md file in your project's .amazonq/rules folder.",
                        },
                    ],
                    [
                        {
                            id: ContextRule.CancelButtonId,
                            text: 'Cancel',
                            status: 'clear',
                            waitMandatoryFormItems: false,
                        },
                        {
                            id: ContextRule.SubmitButtonId,
                            text: 'Create',
                            status: 'main',
                            waitMandatoryFormItems: true,
                        },
                    ],
                    `Create a rule`
                )
            } else {
                this.messager.onRuleClick({ tabId: this.tabId, type: 'rule', id: item.id })
            }
        }
    }

    showLoading(tabId: string) {
        this.tabId = tabId
        const rulesList = this.mynahUi.openTopBarButtonOverlay({
            tabId: this.tabId,
            topBarButtonOverlay: {
                list: [{ groupName: 'Loading rules...' }],
                selectable: false,
            },
            events: {
                onGroupClick: this.onRuleFolderClick,
                onItemClick: this.onRuleClick,
                onClose: this.onClose,
                onKeyPress: this.onKeyPress,
            },
        })

        this.rulesList = {
            ...rulesList,
            changeTarget: () => {},
            getTargetElementId: () => {
                return undefined
            },
        }
    }

    show(params: ListRulesResult) {
        this.tabId = params.tabId
        if (this.rulesList) {
            this.rulesList.update({
                filterOptions: params.filterOptions?.map(option => ({
                    ...option,
                    icon: option.icon as MynahIconsType,
                })),
                list: convertRulesListToDetailedListGroup(params.rules),
                selectable: 'clickable',
            })
        } else {
            const rulesList = this.mynahUi.openTopBarButtonOverlay({
                tabId: this.tabId,
                topBarButtonOverlay: {
                    list: convertRulesListToDetailedListGroup(params.rules),
                    selectable: 'clickable',
                },
                events: {
                    onGroupClick: this.onRuleFolderClick,
                    onItemClick: this.onRuleClick,
                    onClose: this.onClose,
                    onKeyPress: this.onKeyPress,
                },
            })

            this.rulesList = {
                ...rulesList,
                changeTarget: () => {},
                getTargetElementId: () => {
                    return undefined
                },
            }
        }
    }

    private onKeyPress = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.close()
        }
    }

    close() {
        this.rulesList?.close()
    }

    private onClose = () => {
        this.rulesList = undefined
    }
}

const createRuleListItem: DetailedListItem = {
    description: 'Create a new rule',
    icon: MynahIcons.LIST_ADD,
    id: ContextRule.CreateRuleId,
}

export function convertRulesListToDetailedListGroup(rules: RulesFolder[]): DetailedListItemGroup[] {
    return rules
        .map(
            ruleFolder =>
                ({
                    groupName: ruleFolder.folderName,
                    actions: [
                        {
                            id: ruleFolder.folderName,
                            icon: convertRuleStatusToIcon(ruleFolder.active),
                            status: 'clear',
                        },
                    ],
                    icon: MynahIcons.FOLDER,
                    childrenIndented: true,
                    children: ruleFolder.rules.map(rule => ({
                        id: rule.id,
                        icon: MynahIcons.CHECK_LIST,
                        description: rule.name,
                        actions: [{ id: rule.id, icon: convertRuleStatusToIcon(rule.active), status: 'clear' }],
                    })),
                }) as DetailedListItemGroup
        )
        .concat({ children: [createRuleListItem] })
}

function convertRuleStatusToIcon(status: boolean | 'indeterminate'): MynahIcons | undefined {
    if (status === true) {
        return MynahIcons.OK
    } else if (status === 'indeterminate') {
        return MynahIcons.MINUS
    }
    return undefined
}
