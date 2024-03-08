import { ExtensionContext, commands } from 'vscode'
import { ExecuteCommandParams, ExecuteCommandRequest, LanguageClient } from 'vscode-languageclient/node'

export function registerLogCommand(languageClient: LanguageClient, extensionContext: ExtensionContext) {
    extensionContext.subscriptions.push(commands.registerCommand('helloWorld.log', logCommand(languageClient)))
}
export function registerTransformCommand(languageClient: LanguageClient, extensionContext: ExtensionContext) {
    extensionContext.subscriptions.push(
        commands.registerCommand('aws/qNetTransform/startTransform', qNetCommand(languageClient))
    )
}
export function logCommand(languageClient: LanguageClient) {
    return async () => {
        const request: ExecuteCommandParams = {
            command: '/helloWorld/log',
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The log command has been executed`)
    }
}

export function qNetCommand(languageClient: LanguageClient) {
    return async () => {
        const request = {
            command: 'aws/qNetTransform/startTransform',
            SolutionRootPath: 'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore.sln',
            TargetFramework: 'net8.0',
            SourceCodeFilePaths: [
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\Global.asax',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\Global.asax.cs',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj.user',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\Web.config',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\Web.Debug.config',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\Web.Release.config',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore-Create.sql',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore.sln',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\UpgradeLog.htm',
                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\UpgradeLog2.htm',
            ],
            ProjectMetadata: [
                {
                    Name: 'MvcMusicStore',
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                    ProjectLanguage: 'C#',
                    ProjectType: '',
                    ExternalReferences: [
                        {
                            ProjectPath:
                                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                            RelativePath:
                                'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Xml.dll',
                            AssemblyFullPath:
                                'C:\\Program Files (x86)\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Xml.dll',
                            TargetFrameworkId: 'netframework4.0',
                            IncludedInArtifact: false,
                        },
                        {
                            ProjectPath:
                                'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                            RelativePath:
                                'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.Abstractions.dll',
                            AssemblyFullPath:
                                'C:\\Program Files (x86)\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.Abstractions.dll',
                            TargetFrameworkId: 'netframework4.0',
                            IncludedInArtifact: false,
                        },
                    ],
                },
            ],
        }
        await languageClient.sendRequest(ExecuteCommandRequest.method, request)
        languageClient.info(`Client: The qNet command has been executed`)
    }
}