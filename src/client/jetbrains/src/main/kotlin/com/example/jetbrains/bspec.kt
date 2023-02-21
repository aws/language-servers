package com.example.jetbrains

import com.intellij.lang.Language
import com.intellij.openapi.fileTypes.LanguageFileType
import javax.swing.Icon

class bspec : LanguageFileType(bspecLang.INSTANCE) {
    override fun getName(): String = "bspec"

    override fun getDescription(): String = "bspec"

    override fun getDefaultExtension(): String = "bspec"
    override fun getIcon() = null

    companion object {
        val INSTANCE = bspec()
    }
}

class bspecLang : Language("bspec") {
    companion object {
        val INSTANCE = bspecLang()
    }
}