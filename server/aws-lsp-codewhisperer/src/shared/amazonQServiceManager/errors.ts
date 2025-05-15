// Base error class for Amazon Q
export class AmazonQError extends Error {
    public code: string
    constructor(message: string, code: string) {
        super(message)
        this.name = 'AmazonQError'
        this.code = code
    }
}

export class AmazonQServiceInitializationError extends AmazonQError {
    constructor(message: string = 'Amazon Q service manager initilization error') {
        super(message, 'E_AMAZON_Q_INITIALIZATION_ERROR')
        this.name = 'AmazonQServiceInitializationError'
    }
}

export class AmazonQServiceNotInitializedError extends AmazonQError {
    constructor(message: string = 'Amazon Q service SDK is not initialized') {
        super(message, 'E_AMAZON_Q_NOT_INITIALIZED')
        this.name = 'AmazonQServiceNotInitializedError'
    }
}

export class AmazonQServiceAlreadyInitializedError extends AmazonQError {
    constructor(message: string = 'Amazon Q service manager was already previously initialized') {
        super(message, 'E_AMAZON_Q_ALREADY_INITIALIZED_ERROR')
        this.name = 'AmazonQServiceAlreadyInitializationError'
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

export class AmazonQServiceProfileUpdateCancelled extends AmazonQError {
    constructor(message: string = 'Amazon Q Profile cancelled') {
        super(message, 'E_AMAZON_Q_PROFILE_UPDATE_CANCELLED')
        this.name = 'AmazonQServiceProfileUpdateCancelled'
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

export class AmazonQServiceProfileThrottlingError extends AmazonQError {
    constructor(message: string = 'Amazon Q Profile has encountered throttling error') {
        super(message, 'E_AMAZON_Q_PROFILE_THROTTLING')
        this.name = 'AmazonQServiceProfileThrottlingError'
    }
}

export class AmazonQServiceConnectionExpiredError extends AmazonQError {
    constructor(message: string = 'Current authentication token is expired.') {
        super(message, 'E_AMAZON_Q_CONNECTION_EXPIRED')
        this.name = 'AmazonQServiceConnectionExpiredError'
    }
}
