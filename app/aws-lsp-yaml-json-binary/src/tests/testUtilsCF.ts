export const COMPLETIONS_EMPTY_OBJECT_JSON = {
    isIncomplete: false,
    items: [
        {
            kind: 10,
            label: 'AWSTemplateFormatVersion',
            insertText: '"AWSTemplateFormatVersion": "${1:2010-09-09}"',
            insertTextFormat: 2,
            filterText: '"AWSTemplateFormatVersion"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"AWSTemplateFormatVersion": "${1:2010-09-09}"',
            },
        },
        {
            kind: 10,
            label: 'Conditions',
            insertText: '"Conditions": {$1}',
            insertTextFormat: 2,
            filterText: '"Conditions"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Conditions": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Description',
            insertText: '"Description": "$1"',
            insertTextFormat: 2,
            filterText: '"Description"',
            documentation: 'Template description',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Description": "$1"',
            },
        },
        {
            kind: 10,
            label: 'Globals',
            insertText: '"Globals": {$1}',
            insertTextFormat: 2,
            filterText: '"Globals"',
            documentation: '',
            textEdit: {
                range: {
                    start: {
                        line: 0,
                        character: 1,
                    },
                    end: {
                        line: 0,
                        character: 1,
                    },
                },
                newText: '"Globals": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Mappings',
            insertText: '"Mappings": {$1}',
            insertTextFormat: 2,
            filterText: '"Mappings"',
            documentation: '',
            textEdit: {
                range: {
                    start: {
                        line: 0,
                        character: 1,
                    },
                    end: {
                        line: 0,
                        character: 1,
                    },
                },
                newText: '"Mappings": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Metadata',
            insertText: '"Metadata": {$1}',
            insertTextFormat: 2,
            filterText: '"Metadata"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Metadata": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Outputs',
            insertText: '"Outputs": {$1}',
            insertTextFormat: 2,
            filterText: '"Outputs"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Outputs": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Parameters',
            insertText: '"Parameters": {$1}',
            insertTextFormat: 2,
            filterText: '"Parameters"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Parameters": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Resources',
            insertText: '"Resources": {$1}',
            insertTextFormat: 2,
            filterText: '"Resources"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Resources": {$1}',
            },
        },
        {
            kind: 10,
            label: 'Transform',
            insertText: '"Transform"',
            insertTextFormat: 2,
            filterText: '"Transform"',
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 1 },
                    end: { line: 0, character: 1 },
                },
                newText: '"Transform"',
            },
        },
    ],
}

export const COMPLETIONS_EMPTY_OBJECT_YAML = {
    isIncomplete: false,
    items: [
        {
            kind: 10,
            label: 'AWSTemplateFormatVersion',
            insertText: 'AWSTemplateFormatVersion: ${1:"2010-09-09"}',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'AWSTemplateFormatVersion: ${1:"2010-09-09"}',
            },
        },
        {
            kind: 10,
            label: 'Conditions',
            insertText: 'Conditions:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Conditions:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Description',
            insertText: 'Description: ',
            insertTextFormat: 2,
            documentation: 'Template description',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Description: ',
            },
        },
        {
            kind: 10,
            label: 'Globals',
            insertText: 'Globals:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Globals:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Mappings',
            insertText: 'Mappings:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: {
                        line: 0,
                        character: 0,
                    },
                    end: {
                        line: 0,
                        character: 0,
                    },
                },
                newText: 'Mappings:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Metadata',
            insertText: 'Metadata:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Metadata:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Outputs',
            insertText: 'Outputs:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Outputs:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Parameters',
            insertText: 'Parameters:\n  ',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Parameters:\n  ',
            },
        },
        {
            documentation: '',
            insertText: 'Resources:\n  ',
            insertTextFormat: 2,
            kind: 10,
            label: 'Resources',
            textEdit: {
                newText: 'Resources:\n  ',
                range: {
                    end: {
                        character: 0,
                        line: 0,
                    },
                    start: {
                        character: 0,
                        line: 0,
                    },
                },
            },
        },
        {
            documentation: {
                kind: 'markdown',
                value: 'some description,\n\n----\n\n```yaml\nResources:\n  \n```',
            },
            kind: 7,
            insertText: 'Resources:\n  ',
            label: 'aws-lsp-yaml-json',
            sortText: '_aws-lsp-yaml-json',
            insertTextFormat: 2,
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Resources:\n  ',
            },
        },
        {
            kind: 10,
            label: 'Transform',
            insertText: 'Transform',
            insertTextFormat: 2,
            documentation: '',
            textEdit: {
                range: {
                    start: { line: 0, character: 0 },
                    end: { line: 0, character: 0 },
                },
                newText: 'Transform',
            },
        },
    ],
}

export const TEXT_TO_FORMAT_JSON = `{
    "AWSTemplateFormatVersion"      :"2010-09-09",
    "Globals":          {  }
}`

export const FORMAT_EDITS_JSON = [
    {
        // line 1: gap between "AWSTemplateFormatVersion" and :

        range: {
            start: { line: 1, character: 30 },
            end: { line: 1, character: 36 },
        },
        newText: '',
    },
    {
        // line 1: missing space between : and "2010-09-09"
        range: {
            start: { line: 1, character: 37 },
            end: { line: 1, character: 37 },
        },
        newText: ' ',
    },
    {
        // line 2: gap between "Globals" and :
        range: {
            start: { line: 2, character: 14 },
            end: { line: 2, character: 24 },
        },
        newText: ' ',
    },
    {
        // line 2: gap between { and }
        range: {
            start: { line: 2, character: 25 },
            end: { line: 2, character: 27 },
        },
        newText: '',
    },
]

export const TEXT_TO_FORMAT_YAML = `AWSTemplateFormatVersion:    "2010-09-09"
Globals: 
          something
    `

export const FORMAT_EDITS_YAML = [
    // return 1 text edit for the whole content
    {
        range: {
            start: { line: 0, character: 0 },
            end: { line: 3, character: 4 },
        },
        newText: 'AWSTemplateFormatVersion: "2010-09-09"\nGlobals: something\n',
    },
]

export const TEXT_TO_HOVER_JSON = `{
    "Globals": {},
    "Resources": {}
}`

export const HOVER_JSON = {
    contents: ['Resources'],
    range: {
        start: { line: 2, character: 4 },
        end: { line: 2, character: 15 },
    },
}

export const TEXT_TO_HOVER_YAML = `Resources:

Globals: 
`

export const HOVER_YAML = {
    contents: {
        kind: 'markdown',
        value: '#### Resources\n\nSource: [schema.json](https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json)',
    },
    range: {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 9 },
    },
}

export const TEXT_TO_DIAGNOSE_YAML = `AWSTemplateFormatVersion: "2010-09-09"
Globals:  `

const DIAGNOSTICS_YAML = [
    {
        // field "Resources" is required by CF json-schema
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
        },
        message: 'Missing property "Resources".',
        severity: 2,
        code: 0,
        source: 'yaml-schema: aws-lsp-yaml-json',
        data: {
            schemaUri: [
                'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json',
            ],
        },
    },
    {
        // If field is declared it can't be empty
        range: {
            start: { line: 1, character: 10 },
            end: { line: 1, character: 10 },
        },
        message: 'Incorrect type. Expected "Globals".',
        severity: 2,
        code: 0,
        source: 'yaml-schema: Globals',
        data: {
            schemaUri: [
                'https://raw.githubusercontent.com/aws/serverless-application-model/main/samtranslator/schema/schema.json',
            ],
        },
    },
]

export const DIAGNOSTICS_RESPONSE_YAML = {
    uri: 'diagnostics.yml',
    diagnostics: DIAGNOSTICS_YAML,
    version: 1,
}

export const TEXT_TO_DIAGNOSE_JSON = `{
    "AWSTemplateFormatVersionTest": "2010-09-09",
    "Globals": {}
{`

const DIAGNOSTICS_JSON = [
    {
        // field "Resources" is required by CF json-schema
        range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 1 },
        },
        message: 'Missing property "Resources".',
        severity: 2,
    },
    {
        // field AWSTemplateFormatVersionTest doesn't exist in CF json-schema
        range: {
            start: { line: 1, character: 4 },
            end: { line: 1, character: 34 },
        },
        message: 'Property AWSTemplateFormatVersionTest is not allowed.',
        severity: 2,
    },
    {
        // last symbol should be closing bracket
        range: {
            start: { line: 3, character: 0 },
            end: { line: 3, character: 1 },
        },
        message: 'Expected comma',
        severity: 1,
        code: 514,
        source: 'json',
    },
]

export const DIAGNOSTICS_RESPONSE_JSON = {
    uri: 'diagnostics.json',
    diagnostics: DIAGNOSTICS_JSON,
    version: 1,
}
