import { SignatureInfo, signatureDictionary } from './signatureDictionary'
import { SignatureHelp, MarkupKind } from '@aws/language-server-runtimes/server-interface'

export function findSignatureInfo(input: string): SignatureHelp | null {
    const inputLower = input.toLowerCase().trim()
    for (const key of Object.keys(signatureDictionary)) {
        const regex = new RegExp(`${key}\\((?!.*\\))`, 'i')
        if (regex.test(inputLower)) {
            const signatureInfo: SignatureInfo = signatureDictionary[key]
            return {
                signatures: [
                    {
                        label: signatureInfo.label,
                        documentation: {
                            kind: MarkupKind.Markdown,
                            value: signatureInfo.doc,
                        },
                    },
                ],
            }
        }
    }
    return null
}
