import * as https from 'https'

export function requestContent(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, response => {
            // Handle the response
            const statusCode = response.statusCode
            if (statusCode !== 200) {
                reject(new Error(`Request failed with status code ${statusCode}`))
                response.resume()
                return
            }

            let rawData = ''
            response.setEncoding('utf8')

            response.on('data', chunk => {
                rawData += chunk
            })

            response.on('end', () => {
                // File download completed
                resolve(rawData)
            })
        })

        request.on('error', error => {
            reject(error)
        })
    })
}
