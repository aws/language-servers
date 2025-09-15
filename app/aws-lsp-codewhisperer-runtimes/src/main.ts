import {
    createMessageConnection,
    BrowserMessageReader,
    BrowserMessageWriter,
} from 'vscode-languageserver-protocol/browser'
import { ProtocolConnection, InitializeParams, InitializeRequest } from 'vscode-languageserver-protocol'

export class LanguageClient {
    private connection?: ProtocolConnection
    private worker: Worker

    constructor(worker: Worker) {
        this.worker = worker
    }

    async start() {
        this.connection = createMessageConnection(
            new BrowserMessageReader(this.worker),
            new BrowserMessageWriter(this.worker)
        )

        this.connection.listen()

        try {
            const initParams: InitializeParams = {
                processId: null,
                rootUri: null,
                capabilities: {},
            }
            // send initialize message to lsp server
            const result = await this.connection.sendRequest(InitializeRequest.method, initParams)
            console.log('Server initialized:', result)
        } catch (error) {
            console.error('Initialization failed:', error)
        }
    }
}

// Create Worker
const worker = new Worker(
    URL.createObjectURL(new Blob([`import "http://127.0.0.1:8080/worker.js";`], { type: 'application/javascript' })),
    { type: 'module' }
)

// Start Language Client
const client = new LanguageClient(worker)
client
    .start()
    .then(() => {
        console.log('Language Client started')
    })
    .catch(err => {
        console.error('Error starting Language Client:', err)
    })
