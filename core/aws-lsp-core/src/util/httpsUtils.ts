import * as https from 'https'
import { Agent } from 'https'

export function requestContent(url: string, agent?: Agent): Promise<{ content: string; contentType?: string }> {
    return new Promise((resolve, reject) => {
        const request = https.get(url, { agent }, response => {
            const statusCode = response.statusCode
            if (statusCode !== 200) {
                reject(new Error(`Request failed with status code ${statusCode}`))
                response.resume()
                return
            }

            const contentType = response.headers['content-type']
            let rawData = ''
            response.setEncoding('utf8')

            response.on('data', chunk => {
                rawData += chunk
            })

            response.on('end', () => {
                resolve({ content: rawData, contentType })
            })
        })

        request.on('error', error => {
            reject(error)
        })
    })
}
