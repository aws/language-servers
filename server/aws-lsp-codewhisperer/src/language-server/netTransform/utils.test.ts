import assert = require('assert')
import { QNetStartTransformRequest } from './models'
import * as utils from './utils'
import mock = require('mock-fs')

describe('util test', () => {
    describe('test utils', () => {
        it('should return requirment json content', async () => {
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as QNetStartTransformRequest
            const jsonFile = await utils.createRequirementJsonContent(request)
            assert.equal(jsonFile.ProjectToReference.length, 2)
        })

        it('should return filtered external references', async () => {
            const requestString = JSON.stringify(EXAMPLE_REQUEST)
            const request = JSON.parse(requestString) as QNetStartTransformRequest
            const references = request.ProjectMetadata.flatMap(p => p.ExternalReferences)
            assert.equal(references.length, 10)
            const filteredReference = await utils.filterReferences(request)
            assert.equal(filteredReference.length, 5)
        })
    })
})

const EXAMPLE_REQUEST = {
    SolutionRootPath: 'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC',
    TargetFramework: 'net8.0',
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
    ProjectMetadata: [
        {
            Name: 'CoreMVC',
            ProjectPath:
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
            ProjectLanguage: 'C#',
            ProjectType: '',
            ExternalReferences: [
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.Security.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.Security.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.Extensions.Http.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.AspNetCore.ResponseCaching.Abstractions.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.AspNetCore.ResponseCaching.Abstractions.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.ServicePoint.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.ServicePoint.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.AspNetCore.Authentication.Cookies.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.aspnetcore.app.ref\\3.1.10\\ref\\netcoreapp3.1\\Microsoft.AspNetCore.Authentication.Cookies.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
                    RelativePath:
                        'references\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.ServicePoint.dll',
                    AssemblyFullPath:
                        'C:\\.nuget\\packages\\microsoft.netcore.app.ref\\3.1.0\\ref\\netcoreapp3.1\\System.Net.ServicePoint.dll',
                    TargetFrameworkId: '',
                    IncludedInArtifact: true,
                },
            ],
        },
        {
            Name: 'test',
            ProjectPath:
                'D:\\TestProjects-master\\TestProjects-master\\netcoreapp3.1\\CoreMVC\\CoreMVC\\CoreMVC.csproj',
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
                    TargetFrameworkId: 'netframework4.0',
                    IncludedInArtifact: false,
                },
                {
                    ProjectPath:
                        'D:\\TestProjects-master\\TestProjects-master\\net40\\mvc\\MvcMusicStore\\MvcMusicStore.csproj',
                    RelativePath:
                        'references\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.dll',
                    AssemblyFullPath:
                        'C:\\Program Files (x86)\\Reference Assemblies\\Microsoft\\Framework\\.NETFramework\\v4.0\\System.Web.dll',
                    TargetFrameworkId: 'netframework4.0',
                    IncludedInArtifact: false,
                },
            ],
        },
    ],
    command: 'aws/qNetTransform/startTransform',
}
