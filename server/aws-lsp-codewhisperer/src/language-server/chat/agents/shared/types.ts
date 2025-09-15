/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { WorkspaceFolder } from '@aws/language-server-runtimes/protocol'

//TODO: May not be needed follow up with flare
export enum FollowUpTypes {
    // UnitTestGeneration
    ViewDiff = 'ViewDiff',
    AcceptCode = 'AcceptCode',
    RejectCode = 'RejectCode',
    BuildAndExecute = 'BuildAndExecute',
    ModifyCommands = 'ModifyCommands',
    SkipBuildAndFinish = 'SkipBuildAndFinish',
    InstallDependenciesAndContinue = 'InstallDependenciesAndContinue',
    ContinueBuildAndExecute = 'ContinueBuildAndExecute',
    ViewCodeDiffAfterIteration = 'ViewCodeDiffAfterIteration',
    // FeatureDev
    GenerateCode = 'GenerateCode',
    InsertCode = 'InsertCode',
    ProvideFeedbackAndRegenerateCode = 'ProvideFeedbackAndRegenerateCode',
    Retry = 'Retry',
    ModifyDefaultSourceFolder = 'ModifyDefaultSourceFolder',
    DevExamples = 'DevExamples',
    NewTask = 'NewTask',
    CloseSession = 'CloseSession',
    SendFeedback = 'SendFeedback',
    AcceptAutoBuild = 'AcceptAutoBuild',
    DenyAutoBuild = 'DenyAutoBuild',
    GenerateDevFile = 'GenerateDevFile',
    // Doc
    CreateDocumentation = 'CreateDocumentation',
    ChooseFolder = 'ChooseFolder',
    UpdateDocumentation = 'UpdateDocumentation',
    SynchronizeDocumentation = 'SynchronizeDocumentation',
    EditDocumentation = 'EditDocumentation',
    AcceptChanges = 'AcceptChanges',
    RejectChanges = 'RejectChanges',
    MakeChanges = 'MakeChanges',
    ProceedFolderSelection = 'ProceedFolderSelection',
    CancelFolderSelection = 'CancelFolderSelection',
}

export type DiffTreeFileInfo = {
    zipFilePath: string
    relativePath: string
    rejected: boolean
    changeApplied: boolean
}

export type NewFileZipContents = { zipFilePath: string; fileContent: string }

export type DeletedFileInfo = DiffTreeFileInfo & {
    workspaceFolder: WorkspaceFolder
}

export type NewFileInfo = DiffTreeFileInfo &
    NewFileZipContents & {
        virtualMemoryUri: string
        workspaceFolder: WorkspaceFolder
    }
