import { StartTransformRequest } from '../models'

export const EXAMPLE_REQUEST: StartTransformRequest = {
    SolutionFilePath: 'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\CoreMVC.sln',
    SolutionConfigPaths: [],
    TransformNetStandardProjects: true,
    EnableRazorViewTransform: true,
    SolutionRootPath: 'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC',
    TargetFramework: 'net8.0',
    ProgramLanguage: 'csharp',
    SelectedProjectPath:
        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
    ProjectMetadata: [
        {
            Name: 'CoreMVC',
            ProjectPath:
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
            ProjectLanguage: 'csharp',
            ProjectType: '',
            ExternalReferences: [
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    IncludedInArtifact: true,
                },
            ],
            ProjectTargetFramework: 'net8.0',
            SourceCodeFilePaths: [
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\appsettings.Development.json',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\appsettings.json',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\Program.cs',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\Startup.cs',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC.sln',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\PortSolutionResult.json',
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\PortSolutionResult.txt',
            ],
        },
        {
            Name: 'test',
            ProjectPath: 'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\test\\test.csproj',
            ProjectLanguage: 'C#',
            ProjectType: '',
            ExternalReferences: [
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                    RelativePath:
                        'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Drawing.dll',
                    AssemblyFullPath:
                        'C:\\Program Files (x86)\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Drawing.dll',
                    IncludedInArtifact: false,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                    RelativePath:
                        'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.dll',
                    AssemblyFullPath:
                        'C:\\Program Files (x86)\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.dll',
                    IncludedInArtifact: false,
                },
            ],
            ProjectTargetFramework: 'net8.0',
            SourceCodeFilePaths: [],
        },
    ],
    command: 'aws/qNetTransform/startTransform',
}
