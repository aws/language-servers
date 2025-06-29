import { expect } from 'chai'
import { Workspace, Logging } from '@aws/language-server-runtimes/server-interface'
import { StartTransformRequest, TransformationPreferences, DatabaseSettings, Tool, DatabaseInfo } from '../models'
import { ArtifactManager } from '../artifactManager'
import { StubbedInstance, stubInterface } from 'ts-sinon'
import { EXAMPLE_REQUEST } from './mockData'

describe('ArtifactManager - createTransformationPreferencesContent', () => {
    let workspace: StubbedInstance<Workspace>
    let artifactManager: ArtifactManager
    let mockedLogging: StubbedInstance<Logging>
    let baseRequest: StartTransformRequest

    beforeEach(() => {
        workspace = stubInterface<Workspace>()
        mockedLogging = stubInterface<Logging>()
        artifactManager = new ArtifactManager(workspace, mockedLogging, '')

        // Create a clean base request for each test
        baseRequest = {
            ...EXAMPLE_REQUEST,
            DmsArn: undefined,
            DatabaseSettings: undefined,
        }
    })

    describe('Full DatabaseSettings scenario', () => {
        it('should generate transformation preferences with complete DatabaseSettings', async () => {
            // Arrange
            const dmsArn = 'arn:aws:dms:us-east-1:123456789012:replication-instance:test-instance'
            const databaseSettings: DatabaseSettings = {
                Tools: [
                    {
                        Name: 'DMS',
                        Properties: { DmsArn: dmsArn },
                    },
                    {
                        Name: 'SCT',
                        Properties: { Version: '1.0.0' },
                    },
                ],
                Source: {
                    DatabaseName: 'MSSQL',
                    DatabaseVersion: '2019',
                },
                Target: {
                    DatabaseName: 'POSTGRES',
                    DatabaseVersion: '13',
                },
            }

            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: dmsArn,
                DatabaseSettings: databaseSettings,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result).to.not.be.null
            expect(result.Transformations).to.not.be.null
            expect(result.Transformations.DatabaseModernization).to.not.be.undefined
            expect(result.Transformations.DatabaseModernization!.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization!.DmsArn).to.equal(dmsArn)
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings).to.deep.equal(databaseSettings)

            // Verify metadata
            expect(result.Metadata).to.not.be.null
            expect(result.Metadata.GeneratedAt).to.not.be.empty
            expect(new Date(result.Metadata.GeneratedAt)).to.be.instanceOf(Date)
        })

        it('should preserve all tool configurations from DatabaseSettings', async () => {
            // Arrange
            const complexDatabaseSettings: DatabaseSettings = {
                Tools: [
                    {
                        Name: 'DMS',
                        Properties: {
                            DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:test',
                            ReplicationTaskArn: 'arn:aws:dms:us-east-1:123456789012:task:test-task',
                        },
                    },
                    {
                        Name: 'SCT',
                        Properties: {
                            Version: '1.0.0',
                            ConfigPath: '/path/to/config',
                        },
                    },
                    {
                        Name: 'CustomTool',
                        Properties: {
                            CustomProperty: 'value',
                        },
                    },
                ],
                Source: {
                    DatabaseName: 'ORACLE',
                    DatabaseVersion: '19c',
                },
                Target: {
                    DatabaseName: 'AURORA_POSTGRESQL',
                    DatabaseVersion: '13.7',
                },
            }

            const request: StartTransformRequest = {
                ...baseRequest,
                DatabaseSettings: complexDatabaseSettings,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            const dbSettings = result.Transformations.DatabaseModernization!.DatabaseSettings!
            expect(dbSettings.Tools).to.have.length(3)
            expect(dbSettings.Tools![0].Name).to.equal('DMS')
            expect(dbSettings.Tools![0].Properties).to.deep.equal({
                DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:test',
                ReplicationTaskArn: 'arn:aws:dms:us-east-1:123456789012:task:test-task',
            })
            expect(dbSettings.Tools![1].Name).to.equal('SCT')
            expect(dbSettings.Tools![2].Name).to.equal('CustomTool')
            expect(dbSettings.Source).to.deep.equal(complexDatabaseSettings.Source)
            expect(dbSettings.Target).to.deep.equal(complexDatabaseSettings.Target)
        })
    })

    describe('DmsArn only scenario', () => {
        it('should generate transformation preferences with minimal DMS tool configuration', async () => {
            // Arrange
            const dmsArn = 'arn:aws:dms:us-west-2:987654321098:replication-instance:prod-instance'
            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: dmsArn,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations.DatabaseModernization).to.not.be.undefined
            expect(result.Transformations.DatabaseModernization!.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization!.DmsArn).to.equal(dmsArn)

            // Verify minimal tool configuration is created
            const dbSettings = result.Transformations.DatabaseModernization!.DatabaseSettings!
            expect(dbSettings).to.not.be.undefined
            expect(dbSettings.Tools).to.have.length(1)
            expect(dbSettings.Tools![0].Name).to.equal('DMS')
            expect(dbSettings.Tools![0].Properties).to.deep.equal({ DmsArn: dmsArn })

            // Source and Target should be undefined in minimal scenario
            expect(dbSettings.Source).to.be.undefined
            expect(dbSettings.Target).to.be.undefined
        })

        it('should include metadata with valid timestamp', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:test',
            }

            // Act
            const beforeTime = new Date()
            const result = await artifactManager.createTransformationPreferencesContent(request)
            const afterTime = new Date()

            // Assert
            expect(result.Metadata.GeneratedAt).to.not.be.empty
            const generatedTime = new Date(result.Metadata.GeneratedAt)
            expect(generatedTime).to.be.at.least(beforeTime)
            expect(generatedTime).to.be.at.most(afterTime)

            // Verify ISO 8601 format
            expect(result.Metadata.GeneratedAt).to.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
        })
    })

    describe('No database modernization scenario', () => {
        it('should generate transformation preferences without DatabaseModernization when neither DmsArn nor DatabaseSettings provided', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                // Neither DmsArn nor DatabaseSettings are set
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations).to.not.be.null
            expect(result.Transformations.DatabaseModernization).to.be.undefined

            // Metadata should still be present
            expect(result.Metadata).to.not.be.null
            expect(result.Metadata.GeneratedAt).to.not.be.empty
        })

        it('should generate empty transformation settings when no transformations are enabled', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: undefined,
                DatabaseSettings: undefined,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations).to.deep.equal({})
            expect(Object.keys(result.Transformations)).to.have.length(0)
        })
    })

    describe('JSON structure validation', () => {
        it('should generate JSON structure matching expected format for full configuration', async () => {
            // Arrange
            const dmsArn = 'arn:aws:dms:us-east-1:123456789012:replication-instance:test'
            const databaseSettings: DatabaseSettings = {
                Tools: [
                    {
                        Name: 'DMS',
                        Properties: { DmsArn: dmsArn },
                    },
                ],
                Source: {
                    DatabaseName: 'MSSQL',
                    DatabaseVersion: '2019',
                },
                Target: {
                    DatabaseName: 'POSTGRES',
                    DatabaseVersion: '13',
                },
            }

            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: dmsArn,
                DatabaseSettings: databaseSettings,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)
            const jsonString = JSON.stringify(result)
            const parsedResult = JSON.parse(jsonString)

            // Assert - Verify top-level structure
            expect(parsedResult).to.have.property('Transformations')
            expect(parsedResult).to.have.property('Metadata')

            // Verify Transformations structure
            expect(parsedResult.Transformations).to.have.property('DatabaseModernization')
            expect(parsedResult.Transformations.DatabaseModernization).to.have.property('Enabled', true)
            expect(parsedResult.Transformations.DatabaseModernization).to.have.property('DmsArn', dmsArn)
            expect(parsedResult.Transformations.DatabaseModernization).to.have.property('DatabaseSettings')

            // Verify DatabaseSettings structure
            const dbSettings = parsedResult.Transformations.DatabaseModernization.DatabaseSettings
            expect(dbSettings).to.have.property('Tools')
            expect(dbSettings).to.have.property('Source')
            expect(dbSettings).to.have.property('Target')

            // Verify Tools structure
            expect(dbSettings.Tools).to.be.an('array').with.length(1)
            expect(dbSettings.Tools[0]).to.have.property('Name', 'DMS')
            expect(dbSettings.Tools[0]).to.have.property('Properties')
            expect(dbSettings.Tools[0].Properties).to.have.property('DmsArn', dmsArn)

            // Verify Source and Target structure
            expect(dbSettings.Source).to.have.property('DatabaseName', 'MSSQL')
            expect(dbSettings.Source).to.have.property('DatabaseVersion', '2019')
            expect(dbSettings.Target).to.have.property('DatabaseName', 'POSTGRES')
            expect(dbSettings.Target).to.have.property('DatabaseVersion', '13')

            // Verify Metadata structure
            expect(parsedResult.Metadata).to.have.property('GeneratedAt')
            expect(parsedResult.Metadata.GeneratedAt).to.be.a('string')
        })

        it('should generate valid JSON for minimal DmsArn-only configuration', async () => {
            // Arrange
            const dmsArn = 'arn:aws:dms:us-east-1:123456789012:replication-instance:minimal'
            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: dmsArn,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)
            const jsonString = JSON.stringify(result)
            const parsedResult = JSON.parse(jsonString)

            // Assert
            expect(parsedResult.Transformations.DatabaseModernization.Enabled).to.be.true
            expect(parsedResult.Transformations.DatabaseModernization.DmsArn).to.equal(dmsArn)
            expect(parsedResult.Transformations.DatabaseModernization.DatabaseSettings.Tools).to.have.length(1)
            expect(parsedResult.Transformations.DatabaseModernization.DatabaseSettings.Tools[0].Name).to.equal('DMS')
            expect(
                parsedResult.Transformations.DatabaseModernization.DatabaseSettings.Tools[0].Properties.DmsArn
            ).to.equal(dmsArn)

            // Source and Target should not be present in JSON
            expect(parsedResult.Transformations.DatabaseModernization.DatabaseSettings).to.not.have.property('Source')
            expect(parsedResult.Transformations.DatabaseModernization.DatabaseSettings).to.not.have.property('Target')
        })

        it('should generate valid JSON for no database modernization scenario', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)
            const jsonString = JSON.stringify(result)
            const parsedResult = JSON.parse(jsonString)

            // Assert
            expect(parsedResult).to.have.property('Transformations')
            expect(parsedResult).to.have.property('Metadata')
            expect(parsedResult.Transformations).to.not.have.property('DatabaseModernization')
            expect(parsedResult.Metadata).to.have.property('GeneratedAt')
        })

        it('should serialize and deserialize without data loss', async () => {
            // Arrange
            const complexRequest: StartTransformRequest = {
                ...baseRequest,
                DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:complex',
                DatabaseSettings: {
                    Tools: [
                        {
                            Name: 'DMS',
                            Properties: {
                                DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:complex',
                                AdditionalConfig: { nested: { value: 'test' } },
                            },
                        },
                    ],
                    Source: {
                        DatabaseName: 'ORACLE',
                        DatabaseVersion: '19c',
                    },
                    Target: {
                        DatabaseName: 'AURORA_POSTGRESQL',
                        DatabaseVersion: '13.7',
                    },
                },
            }

            // Act
            const originalResult = await artifactManager.createTransformationPreferencesContent(complexRequest)
            const jsonString = JSON.stringify(originalResult)
            const deserializedResult: TransformationPreferences = JSON.parse(jsonString)

            // Assert - Compare original and deserialized results
            expect(deserializedResult.Transformations.DatabaseModernization!.Enabled).to.equal(
                originalResult.Transformations.DatabaseModernization!.Enabled
            )
            expect(deserializedResult.Transformations.DatabaseModernization!.DmsArn).to.equal(
                originalResult.Transformations.DatabaseModernization!.DmsArn
            )
            expect(deserializedResult.Transformations.DatabaseModernization!.DatabaseSettings).to.deep.equal(
                originalResult.Transformations.DatabaseModernization!.DatabaseSettings
            )
            expect(deserializedResult.Metadata.GeneratedAt).to.equal(originalResult.Metadata.GeneratedAt)
        })
    })

    describe('Edge cases and error handling', () => {
        it('should handle null DatabaseSettings gracefully', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                DmsArn: 'arn:aws:dms:us-east-1:123456789012:replication-instance:test',
                DatabaseSettings: null as any,
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations.DatabaseModernization!.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization!.DmsArn).to.equal(request.DmsArn)
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings!.Tools).to.have.length(1)
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings!.Tools![0].Name).to.equal('DMS')
        })

        it('should handle empty DatabaseSettings Tools array', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                DatabaseSettings: {
                    Tools: [],
                    Source: {
                        DatabaseName: 'MSSQL',
                        DatabaseVersion: '2019',
                    },
                    Target: {
                        DatabaseName: 'POSTGRES',
                        DatabaseVersion: '13',
                    },
                },
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations.DatabaseModernization!.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings!.Tools).to.have.length(0)
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings!.Source).to.deep.equal(
                request.DatabaseSettings!.Source
            )
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings!.Target).to.deep.equal(
                request.DatabaseSettings!.Target
            )
        })

        it('should handle undefined properties in DatabaseSettings gracefully', async () => {
            // Arrange
            const request: StartTransformRequest = {
                ...baseRequest,
                DatabaseSettings: {
                    Tools: undefined,
                    Source: undefined,
                    Target: undefined,
                },
            }

            // Act
            const result = await artifactManager.createTransformationPreferencesContent(request)

            // Assert
            expect(result.Transformations.DatabaseModernization!.Enabled).to.be.true
            expect(result.Transformations.DatabaseModernization!.DatabaseSettings).to.deep.equal({
                Tools: undefined,
                Source: undefined,
                Target: undefined,
            })
        })
    })
})
