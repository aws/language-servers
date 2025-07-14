export class QCodeReviewError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'QCodeReviewError'
    }
}

export class QCodeReviewValidationError extends QCodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'QCodeReviewValidationError'
    }
}

export class QCodeReviewTimeoutError extends QCodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'QCodeReviewTimeoutError'
    }
}

export class QCodeReviewInternalError extends QCodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'QCodeReviewInternalError'
    }
}
