export class CodeReviewError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'CodeReviewError'
    }
}

export class CodeReviewValidationError extends CodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'CodeReviewValidationError'
    }
}

export class CodeReviewTimeoutError extends CodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'CodeReviewTimeoutError'
    }
}

export class CodeReviewInternalError extends CodeReviewError {
    constructor(message: string) {
        super(message)
        this.name = 'CodeReviewInternalError'
    }
}
