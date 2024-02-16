import { uploadPayload } from './transformHandler'

export async function startTransformByQ() {
    // step 1: CreateCodeUploadUrl and upload code
    const uploadId = await preTransformationUploadCode('userInputState')
}
export async function preTransformationUploadCode(userInputState: any) {
    let uploadId = ''
    let payloadFilePath = ''
    try {
        payloadFilePath = '' //ZIP location which client created
        uploadId = 'await uploadPayload(payloadFilePath)'
    } catch (error) {
        const errorMessage = 'Failed to upload code'
    }
    return uploadId
}
