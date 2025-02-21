import { version } from '../package.json'
import { standalone } from '@aws/language-server-runtimes/runtimes'
import { RuntimeProps } from '@aws/language-server-runtimes/runtimes/runtime'
import {
    CodeWhispererServerTokenProxy,
    QChatServerProxy,
    QConfigurationServerTokenProxy,
} from '@aws/lsp-codewhisperer/out/language-server/proxy-server'
import { SsoAuthServer } from '@amzn/device-sso-auth-lsp'

const props: RuntimeProps = {
    version,
    servers: [SsoAuthServer, CodeWhispererServerTokenProxy, QConfigurationServerTokenProxy, QChatServerProxy],
    name: 'Amazon Q Developer Completions with Device SSO Token',
}
standalone(props)
