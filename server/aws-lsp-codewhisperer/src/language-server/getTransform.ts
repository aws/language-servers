// step 3 (intermediate step): show transformation-plan.md file
const jobId = '1234'
export const validStatesForGettingPlan = ['COMPLETED', 'PARTIALLY_COMPLETED', 'PLANNED', 'TRANSFORMING', 'TRANSFORMED']
export const planIntroductionMessage =
    'We reviewed your Java JAVA_VERSION_HERE application and generated a transformation plan. Any code changes made to your application will be done in the sandbox so as to not interfere with your working repository. Once the transformation job is done, we will share the new code which you can review before acccepting the code changes. In the meantime, you can work on your codebase and invoke Q Chat to answer questions about your codebase.'
export const planDisclaimerMessage = '**Proposed transformation changes** \n\n\n'
// pollTransformationStatusUntilPlanReady(jobId)

// step 4: poll until artifacts are ready to download
const status = pollTransformationStatusUntilComplete(jobId)
console.log(status)

export async function pollTransformationStatusUntilPlanReady(jobId: string) {
    try {
        await pollTransformationJob(jobId, validStatesForGettingPlan)
    } catch (error) {
        const errorMessage = 'Failed to poll transformation job for plan availability, or job itself failed'
        console.log(errorMessage)
    }
    let plan = undefined
    try {
        plan = await getTransformationPlan(jobId)
    } catch (error) {
        const errorMessage = 'Failed to get transformation plan'
        console.log(errorMessage)
    }
    // sessionPlanProgress['buildCode'] = StepProgress.Succeeded
    // const planFilePath = path.join(os.tmpdir(), 'transformation-plan.md')
    // fs.writeFileSync(planFilePath, plan)
    console.log(plan)
}

export async function getTransformationPlan(jobId: string) {
    try {
        const apiStartTime = Date.now()
        const response = {
            //This response should be from api
            transformationPlan: {
                transformationSteps: [
                    {
                        id: 'StepId',
                        name: 'String',
                        description: 'String',
                        status: 'CREATED',
                    },
                ],
            },
        }
        // const logoAbsolutePath = globals.context.asAbsolutePath(
        //   path.join('resources', 'icons', 'aws', 'amazonq', 'transform-landing-page-icon.svg')
        // )
        const logoBase64 = 'getImageAsBase64(logoAbsolutePath)'
        let plan = `![Transform by Q](${logoBase64}) \n # Code Transformation Plan by Amazon Q \n\n`
        plan += planIntroductionMessage.replace('Dotnet_VERSION_HERE', 'dotnet')
        plan += `\n\nExpected total transformation steps: ${response.transformationPlan.transformationSteps.length}\n\n`
        plan += planDisclaimerMessage
        for (const step of response.transformationPlan.transformationSteps) {
            plan += `**${step.name}**\n\n- ${step.description}\n\n\n`
        }

        return plan
    } catch (e: any) {
        const errorMessage = (e as Error).message ?? 'Error in GetTransformationPlan API call'
        console.log(errorMessage)
    }
}

export function pollTransformationJob(jobId: string, validStates: string[]) {
    let status: string = ''
    let timer: number = 0
    while (true) {
        try {
            const apiStartTime = Date.now()
            // const response = await codeWhisperer.codeWhispererClient.codeModernizerGetCodeTransformation({
            //   transformationJobId: jobId,
            // })
            //Mocking response here
            const response = {
                transformationJob: {
                    status: 'hello',
                    reason: '',
                },
            }
            status = response.transformationJob.status!
        } catch (error) {
            console.log('Failed while polling')
        }
        return status
    }
}

export const validStatesForCheckingDownloadUrl = [
    'COMPLETED',
    'PARTIALLY_COMPLETED',
    'FAILED',
    'STOPPING',
    'STOPPED',
    'REJECTED',
]

export async function pollTransformationStatusUntilComplete(jobId: string) {
    let status = ''
    try {
        status = pollTransformationJob(jobId, validStatesForCheckingDownloadUrl)
    } catch (error) {
        const errorMessage = 'Failed to get transformation job status'
        console.log('Failed while polling')
    }

    return status
}
