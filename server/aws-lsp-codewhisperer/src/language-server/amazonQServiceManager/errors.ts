// Base error class for Amazon Q
export class AmazonQError extends Error {
    public code: string
    constructor(message: string, code: string) {
        super(message)
        this.name = 'AmazonQError'
        this.code = code
    }
}

export class AmazonQConnectionError extends AmazonQError {
    constructor(message: string = 'Failed to connect to Amazon Q service') {
        super(message, 'E_AMAZON_Q_CONNECTION')
        this.name = 'AmazonQConnectionError'
    }
}

export class AmazonQAuthenticationError extends AmazonQError {
    constructor(message: string = 'Failed to authenticate with Amazon Q service') {
        super(message, 'E_AMAZON_Q_AUTHENTICATION')
        this.name = 'AmazonQAuthenticationError'
    }
}

export class AmazonQConfigurationError extends AmazonQError {
    constructor(message: string = 'Invalid Amazon Q configuration') {
        super(message, 'E_AMAZON_Q_CONFIGURATION')
        this.name = 'AmazonQConfigurationError'
    }
}

export class AmazonQServiceNotInitializedError extends AmazonQError {
    constructor(message: string = 'Amazon Q service SDK is not initialized') {
        super(message, 'E_AMAZON_Q_NOT_INITIALIZED')
        this.name = 'AmazonQServiceNotInitializedError'
    }
}

export class AmazonQServicePendingSigninError extends AmazonQError {
    constructor(message: string = 'Amazon Q service is not signed in') {
        super(message, 'E_AMAZON_Q_PENDING_CONNECTION')
        this.name = 'AmazonQServicePendingSigninError'
    }
}

export class AmazonQServicePendingProfileError extends AmazonQError {
    constructor(message: string = 'Amazon Q Profile is not selected for IDC connection type') {
        super(message, 'E_AMAZON_Q_PENDING_PROFILE')
        this.name = 'AmazonQServicePendingProfileError'
    }
}

export class AmazonQServicePendingProfileUpdateError extends AmazonQError {
    constructor(message: string = 'Amazon Q Profile is pending update') {
        super(message, 'E_AMAZON_Q_PENDING_PROFILE_UPDATE')
        this.name = 'AmazonQServicePendingProfileUpdateError'
    }
}

export class AmazonQServiceInvalidProfileError extends AmazonQError {
    constructor(message: string = 'Selected Amazon Q Profile is invalid') {
        super(message, 'E_AMAZON_Q_INVALID_PROFILE')
        this.name = 'AmazonQServiceInvalidProfileError'
    }
}

export class AmazonQServiceNoProfileSupportError extends AmazonQError {
    constructor(message: string = 'Current Connection type does not support Amazon Q Profiles') {
        super(message, 'E_AMAZON_Q_CONNECTION_NO_PROFILE_SUPPORT')
        this.name = 'AmazonQServiceNoProfileSupportError'
    }
}
