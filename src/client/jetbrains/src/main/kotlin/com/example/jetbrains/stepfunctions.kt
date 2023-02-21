package com.example.jetbrains

import com.intellij.lang.Language
import com.intellij.openapi.fileTypes.LanguageFileType

class stepfunctions : LanguageFileType(stepfunctionsLang.INSTANCE) {
    override fun getName(): String = "stepfunctions"

    override fun getDescription(): String = "stepfunctions"

    override fun getDefaultExtension(): String = "stepfunctions"
    override fun getIcon() = null

    companion object {
        val INSTANCE = stepfunctions()
    }
}

class stepfunctionsLang : Language("stepfunctions") {
    companion object {
        val INSTANCE = stepfunctionsLang()
    }
}