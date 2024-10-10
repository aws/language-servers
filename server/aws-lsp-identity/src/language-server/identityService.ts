import { SsoTokenChangedParams } from '@aws/language-server-runtimes/protocol'
import { AsyncEvent } from '../utils/asyncEvent'

export class IdentityService {
    SsoTokenChanged: AsyncEvent<SsoTokenChangedParams> = new AsyncEvent<SsoTokenChangedParams>()
}
