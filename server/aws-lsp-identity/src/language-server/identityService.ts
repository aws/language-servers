import { SsoTokenChangedParams } from '@aws/language-server-runtimes/server-interface'
import { AsyncEvent } from '../asyncEvent'

export class IdentityService {
    SsoTokenChanged: AsyncEvent<SsoTokenChangedParams> = new AsyncEvent<SsoTokenChangedParams>()
}
