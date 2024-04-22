export interface Tab {
    readonly id: string
    isSelected: boolean
}

export class TabStorage {
    private tabs: Map<string, Tab> = new Map()
    private lastSelectedTab?: Tab

    public addTab(tab: Tab) {
        if (this.tabs.has(tab.id)) {
            return
        }
        this.tabs.set(tab.id, tab)
        if (tab.isSelected) {
            this.setSelectedTab(tab.id)
        }
    }

    public deleteTab(tabID: string) {
        if (tabID === this.lastSelectedTab?.id) {
            this.lastSelectedTab = undefined
        }
        this.tabs.delete(tabID)
    }

    public getTab(tabID: string): Tab | undefined {
        return this.tabs.get(tabID)
    }

    public setSelectedTab(tabID: string): string | undefined {
        const prevSelectedTab = this.lastSelectedTab
        const prevSelectedTabId = this.lastSelectedTab?.id
        if (prevSelectedTab !== undefined) {
            prevSelectedTab.isSelected = false
            this.tabs.set(prevSelectedTab.id, prevSelectedTab)
        }

        const newSelectedTab = this.tabs.get(tabID)
        if (newSelectedTab === undefined) {
            return prevSelectedTabId
        }

        newSelectedTab.isSelected = true
        this.tabs.set(newSelectedTab.id, newSelectedTab)
        this.lastSelectedTab = newSelectedTab
        return prevSelectedTabId
    }

    public getSelectedTab(): Tab | undefined {
        return this.lastSelectedTab
    }
}
