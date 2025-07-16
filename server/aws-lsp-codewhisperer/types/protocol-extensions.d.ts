import '@aws/language-server-runtimes/protocol'
import '@aws/language-server-runtimes/server-interface'
import '@aws/language-server-runtimes-types'

// — augment the wire-protocol ChatMessage so the client-side .editable flag is known
declare module '@aws/language-server-runtimes/protocol' {
    interface ChatMessage {
        editable?: boolean
    }
}

// — augment the types ChatMessage so the client-side .editable flag is known
declare module '@aws/language-server-runtimes-types' {
    interface ChatMessage {
        editable?: boolean
    }
}

// — augment the server-interface ChatResult so your handlers can return `.editable` without error
declare module '@aws/language-server-runtimes/server-interface' {
    interface ChatResult {
        editable?: boolean
    }
}

// — augment ButtonClickParams to include editedText property
declare module '@aws/language-server-runtimes-types' {
    interface ButtonClickParams {
        editedText?: string
    }
}
