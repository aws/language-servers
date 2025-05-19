import { ChatMessage } from '@aws/language-server-runtimes/protocol'

const userGuideURL = 'https://docs.aws.amazon.com/amazonq/latest/aws-builder-use-ug/getting-started.html'

export const HELP_MESSAGE = `I'm Amazon Q, a generative AI assistant. Learn more about me below. Your feedback will help me improve.
\n\n### What I can do:
\n\n- Answer questions about AWS
\n\n- Answer questions about general programming concepts
\n\n- Explain what a line of code or code function does
\n\n- Write unit tests and code
\n\n- Debug and fix code
\n\n- Refactor code
\n\n### What I don't do right now:
\n\n- Answer questions in languages other than English
\n\n- Remember conversations from your previous sessions
\n\n- Have information about your AWS account or your specific AWS resources
\n\n### Examples of questions I can answer:
\n\n- When should I use ElastiCache?
\n\n- How do I create an Application Load Balancer?
\n\n- Explain selected code and ask clarifying questions about it.
\n\n- What is the syntax of declaring a variable in TypeScript?
\n\n### Special Commands
\n\n- /clear - Clear the conversation.
\n\n- /help - View chat topics and commands.
\n\n### Things to note:
\n\n- I may not always provide completely accurate or current information.
\n\n- Provide feedback by choosing the like or dislike buttons that appear below answers.
\n\n- When you use Amazon Q, AWS may, for service improvement purposes, store data about your usage and content. You can opt-out of sharing this data by following the steps in AI services opt-out policies. See <a href="https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/opt-out-IDE.html">here</a>
\n\n- Do not enter any confidential, sensitive, or personal information.
\n\n*For additional help, visit the [Amazon Q User Guide](${userGuideURL}).*`

export const DEFAULT_HELP_FOLLOW_UP_PROMPT = 'How can Amazon Q help me?'

export const DEFAULT_EXCLUDE_DIRS = [
    // Dependency directories
    'node_modules',
    // Build outputs
    'dist',
    'build',
    'out',
    // Version control
    '.git',
    '.svn',
    '.hg',
    // IDE and Editor
    '.idea',
    '.vscode',
    '.vs',
    '.metals',
    '.bloop',
    '.ensime_cache',
    '.project',
    // Python Specific
    '.venv',
    'venv',
    '.virtualenv',
    'eggs',
    '.eggs',
    'sdist',
    '.ipynb_checkpoints',
    // Environment and Config
    '.env',
    '.aws-sam',
    '.brazil',
    '.rvm',
    '.gem',
    // Cache and Temporary
    '.cache',
    '.sass-cache',
    '.pytest_cache',
    '__pycache__',
    'tmp',
]

export const DEFAULT_EXCLUDE_FILES = [
    // OS specific files
    '.DS_Store',
]

export const loadingMessage: ChatMessage = {
    body: '',
    // @ts-ignore
    // TODO: Add this to runtimes
    type: 'answer-stream',
}
