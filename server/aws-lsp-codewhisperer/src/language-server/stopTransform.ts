export async function stopJob(jobId: string) {
    let response = {}
    if (jobId !== '') {
        try {
            const apiStartTime = Date.now()
            // const response = await codeWhisperer.codeWhispererClient.codeModernizerStopCodeTransformation({
            //   transformationJobId: jobId,
            // })
            response = {
                transformationStatus: 'STOPPED',
            }
        } catch (e: any) {
            const errorMessage = 'Error stopping job'
            console.log(errorMessage)
        }
    }
    return response
}
console.log(stopJob('1234'))
