import {
    BearerCredentials,
    CredentialsProvider,
    Workspace,
    Logging,
    SDKInitializator,
} from '@aws/language-server-runtimes/server-interface'
import {
    CodeWhispererServiceToken,
    CodeWhispererServiceIAM,
    GenerateSuggestionsRequest,
    FileContext,
} from './codeWhispererService'
import * as assert from 'assert'
import { v4 as uuidv4 } from 'uuid'

import { AWSError, Request, Service, Endpoint } from 'aws-sdk'
import { ServiceConfigurationOptions } from 'aws-sdk/lib/service'
import { RequestExtras, CodeWhispererTokenClientConfigurationOptions } from '../client/token/codewhisperer'
import CodeWhispererClient = require('../client/token/codewhispererbearertokenclient')

/**
 * This is a functional test for the CodeWhisperer service.
 * It initializes the service with real credentials and makes actual API calls.
 *
 * NOTE: This test requires valid AWS credentials to be set up in your environment.
 * For token-based authentication, you need a valid bearer token.
 * For IAM-based authentication, you need valid AWS credentials.
 *
 * To run this test:
 * 1. Make sure you have valid credentials set up
 * 2. Run: npm test -- --grep "CodeWhisperer Service Functional Test"
 */
describe('CodeWhisperer Service Functional Test', function () {
    // Increase timeout for API calls
    this.timeout(30000)

    // Test region and endpoint
    const region = 'us-east-1'
    const endpoint = 'https://codewhisperer.us-east-1.amazonaws.com'

    describe('Token-based Authentication', () => {
        let credentialsProvider: CredentialsProvider
        let workspace: Workspace
        let logging: Logging
        let sdkInitializator: SDKInitializator
        let service: CodeWhispererServiceToken

        before(function () {
            // Initialize with static headers for testing
            credentialsProvider = {
                getCredentials: (type: string) => {
                    if (type === 'bearer') {
                        // Using a static token for testing
                        return {
                            token: 'test-token-for-functional-testing',
                        } as BearerCredentials
                    }
                    return null
                },
            } as CredentialsProvider

            workspace = {} as Workspace

            logging = {
                log: (message: string) => console.log(message),
                error: (message: string) => console.error(message),
            } as Logging

            // Use the real SDK initializer
            sdkInitializator = {
                v2: (serviceClass: any, options: any) => {
                    return new serviceClass(options)
                },
            } as SDKInitializator

            // Create the actual service
            service = new CodeWhispererServiceToken(
                credentialsProvider,
                workspace,
                logging,
                region,
                endpoint,
                sdkInitializator
            )
        })

        it('should initialize the service', () => {
            assert.ok(service, 'Service should be created')
            assert.strictEqual(service.getCredentialsType(), 'bearer')
        })

        it('should handle a real API request', async function () {
            // Real request based on the example in the file
            const request: GenerateSuggestionsRequest = {
                fileContext: {
                    filename: 'file:///Users/dhanak/NEPTestWorkspace/snake.py',
                    programmingLanguage: {
                        languageName: 'python',
                    },
                    leftFileContent:
                        '#!/usr/bin/env python3\nimport pygame\nimport random\nimport sys\nfrom pygame.locals import *\n\n# Initialize pygame\npygame.init()\n\n# Constants\nFPS = 10\nWINDOW_WIDTH = 640\nWINDOW_HEIGHT = 480\nCELL_SIZE = 20\nGRID_WIDTH = WINDOW_WIDTH // CELL_SIZE\nGRID_HEIGHT = WINDOW_HEIGHT // CELL_SIZE\n\n# Colors\nBLACK_B = (0, 0, 0)\nWHITE_B = (255, 255, 255)\nRED_B = (255, 0, 0)\nGREEN_',
                    rightFileContent:
                        ' = (0, 255, 0)\nDARK_GREEN_ = (0, 155, 0)\n\n# Directions\nUP_A = (0, -1)\nDOWN = (0, 1)\nLEFT_A = (-1, 0)\nRIGHT_ARROW = (1, 0)\n',
                },
                maxResults: 5,
                supplementalContexts: [
                    {
                        content:
                            '--- file:///Users/dhanak/NEPTestWorkspace/snake.py\t1746257718068\n+++ file:///Users/dhanak/NEPTestWorkspace/snake.py\t1746257723694\n@@ -17,8 +17,8 @@\n \n # Colors\n BLACK_B = (0, 0, 0)\n-WHITE_ = (255, 255, 255)\n-RED_K = (255, 0, 0)\n+WHITE_B = (255, 255, 255)\n+RED_B = (255, 0, 0)\n GREEN_ = (0, 255, 0)\n DARK_GREEN_ = (0, 155, 0)\n \n',
                        filePath: 'file:///Users/dhanak/NEPTestWorkspace/snake.py',
                        type: 'PreviousEditorState',
                        metadata: {
                            previousEditorStateMetadata: {
                                timeOffset: 1000,
                            },
                        },
                    },
                ],
                // NOTE - Looks like this is the only place that matters
                // predictionTypes: ['EDITS'],
                editorState: {
                    document: {
                        relativeFilePath: 'file:///Users/dhanak/NEPTestWorkspace/snake.py',
                        programmingLanguage: {
                            languageName: 'python',
                        },
                        text: '#!/usr/bin/env python3\nimport pygame\nimport random\nimport sys\nfrom pygame.locals import *\n\n# Initialize pygame\npygame.init()\n\n# Constants\nFPS = 10\nWINDOW_WIDTH = 640\nWINDOW_HEIGHT = 480\nCELL_SIZE = 20\nGRID_WIDTH = WINDOW_WIDTH // CELL_SIZE\nGRID_HEIGHT = WINDOW_HEIGHT // CELL_SIZE\n\n# Colors\nBLACK_B = (0, 0, 0)\nWHITE_B = (255, 255, 255)\nRED_B = (255, 0, 0)\nGREEN_',
                    },
                    cursorState: {
                        position: {
                            line: 21,
                            character: 6,
                        },
                    },
                },
            }

            try {
                const response = await service.generateSuggestions(request)

                // Verify response structure
                assert.ok(response, 'Response should exist')
                assert.ok(response.responseContext, 'Response context should exist')
                assert.ok(response.responseContext.requestId, 'Request ID should exist')
                assert.ok(response.responseContext.codewhispererSessionId, 'Session ID should exist')

                // Log response for debugging
                console.log('Response received:', {
                    requestId: response.responseContext.requestId,
                    sessionId: response.responseContext.codewhispererSessionId,
                    suggestionCount: response.suggestions?.length || 0,
                })

                // If suggestions were returned, verify their structure
                if (response.suggestions && response.suggestions.length > 0) {
                    const suggestion = response.suggestions[0]
                    assert.ok(suggestion.itemId, 'Suggestion should have an itemId')
                    assert.ok(suggestion.content !== undefined, 'Suggestion should have content')
                    console.log('First suggestion:', {
                        content: suggestion.content.substring(0, 50) + (suggestion.content.length > 50 ? '...' : ''),
                        itemId: suggestion.itemId,
                    })
                } else {
                    console.log('No suggestions returned')
                }
            } catch (error) {
                console.error('API request failed:', error)
                throw error
            }
        })
    })
})
