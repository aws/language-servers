export const MISSING_BEARER_TOKEN_ERROR = 'credentialsProvider does not have bearer token credentials'
export const INVALID_TOKEN = 'The bearer token included in the request is invalid.'
export const GENERIC_UNAUTHORIZED_ERROR = 'User is not authorized to make this call'
export const BUILDER_ID_START_URL = 'https://view.awsapps.com/start'
export const INTERNAL_USER_START_URL = 'https://amzn.awsapps.com/start'
export const DEFAULT_AWS_Q_ENDPOINT_URL = 'https://codewhisperer.us-east-1.amazonaws.com/'
export const DEFAULT_AWS_Q_REGION = 'us-east-1'

export const AWS_Q_ENDPOINTS = new Map([
    [DEFAULT_AWS_Q_REGION, DEFAULT_AWS_Q_ENDPOINT_URL],
    ['us-east-1', 'https://codewhisperer.us-east-1.amazonaws.com/'],
    ['eu-central-1', 'https://q.eu-central-1.amazonaws.com/'],
])

export const AWS_Q_REGION_ENV_VAR = 'AWS_Q_REGION'
export const AWS_Q_ENDPOINT_URL_ENV_VAR = 'AWS_Q_ENDPOINT_URL'

export const Q_CONFIGURATION_SECTION = 'aws.q'
export const CODE_WHISPERER_CONFIGURATION_SECTION = 'aws.codeWhisperer'

export const SAGEMAKER_UNIFIED_STUDIO_SERVICE = 'SageMakerUnifiedStudio'

/**
 * Names of directories relevant to the crash reporting functionality.
 *
 * Moved here to resolve circular dependency issues.
 */
export const crashMonitoringDirName = 'crashMonitoring'

/** Matches Windows drive letter ("C:"). */
export const driveLetterRegex = /^[a-zA-Z]\:/

export const COMMON_GITIGNORE_PATTERNS = [
    // Package managers and dependencies
    '**/node_modules/**',
    '**/bower_components/**',
    '**/.pnp/**',
    '**/.pnp.js',
    '**/vendor/**',

    // Version control
    '**/.git/**',
    '**/.svn/**',
    '**/.hg/**',
    '**/CVS/**',

    // Build outputs and distributions
    '**/dist/**',
    '**/build/**',
    '**/out/**',
    '**/target/**',
    '**/.next/**',
    '**/.nuxt/**',
    '**/public/dist/**',
    '**/coverage/**',
    '**/.output/**',
    '**/storybook-static/**',

    // Cache and temporary files
    '**/.cache/**',
    '**/.temp/**',
    '**/tmp/**',
    '**/.sass-cache/**',
    '**/.pytest_cache/**',
    '**/__pycache__/**',
    '**/.eslintcache',
    '**/.stylelintcache',

    // IDE and editor files
    '**/.idea/**',
    '**/.vscode/**',
    '**/.history/**',
    '**/.project',
    '**/.settings/**',
    '**/.classpath',
    '**/.factorypath',
    '**/.vs/**',
    '**/*.sublime-workspace',
    '**/*.sublime-project',
    '**/nbproject/**',
    '**/.netbeans/**',

    // OS generated files
    '**/.DS_Store',
    '**/.DS_Store?',
    '**/._*',
    '**/.Spotlight-V100',
    '**/.Trashes',
    '**/ehthumbs.db',
    '**/Thumbs.db',
    '**/desktop.ini',

    // Logs and debugging
    '**/*.log',
    '**/logs/**',
    '**/npm-debug.log*',
    '**/yarn-debug.log*',
    '**/yarn-error.log*',
    '**/pnpm-debug.log*',
    '**/lerna-debug.log*',

    // Package manager files
    '**/yarn.lock',
    '**/package-lock.json',
    '**/pnpm-lock.yaml',
    '**/.pnpm-store/**',
    '**/composer.lock',
    '**/Gemfile.lock',

    // Environment and secrets
    '**/env',
    '**/.env',
    '**/.env.*',
    '**/.env.local',
    '**/.env.*.local',
    '**/.env.development',
    '**/.env.test',
    '**/.env.production',
    '**/*.pem',
    '**/*.key',
    '**/*.cert',

    // Testing and coverage
    '**/coverage/**',
    '**/.nyc_output/**',
    '**/cypress/videos/**',
    '**/cypress/screenshots/**',
    '**/test-results/**',
    '**/playwright-report/**',
    '**/playwright/.cache/**',

    // Documentation
    '**/docs/_site/**',
    '**/docs/.jekyll-cache/**',
    '**/docs/.jekyll-metadata',

    // Mobile development
    '**/ios/Pods/**',
    '**/android/.gradle/**',
    '**/android/build/**',
    '**/android/app/build/**',
    '**/ios/build/**',

    // Common compiled files
    '**/*.pyc',
    '**/*.pyo',
    '**/*.pyd',
    '**/*.so',
    '**/*.dll',
    '**/*.dylib',
    '**/*.class',
    '**/*.exe',

    // Backup files
    '**/*~',
    '**/*.bak',
    '**/*.swp',
    '**/*.swo',

    // Local configuration
    '**/.localrc',
    '**/config.local.js',
    '**/local.properties',

    // Container and deployment
    '**/.docker/**',
    '**/docker-compose.override.yml',
    '**/docker-compose.override.yaml',

    // Serverless
    '**/.serverless/**',

    // Webpack
    '**/.webpack/**',

    // Parcel
    '**/.parcel-cache/**',

    // TypeScript
    '**/tsconfig.tsbuildinfo',

    // Other tools
    '**/.grunt/**',
    '**/.npm/**',
    '**/bower_components/**',
    '**/.phpunit.result.cache',
    '**/composer.phar',
    '**/.vercel/**',
    '**/node_repl_history',
    '**/php_errorlog',
]
