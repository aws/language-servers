# aws-lsp-identity: Identity server

The aws-lsp-identity almost exclusively uses bespoke JSON-RPC requests/notifications and is not a traditional LSP server despite the name that
follows convention.  It provides identity and authx related functions, starting with SSO token handling.

## Handling imports

The language-server-runtimes protocol and server-interface modules do not export identity-management types as these types are intended to
only be consumed by this server, so those top-level namespaces are not polluted.  All import statements in this package should be specific to the 
identity-management namespace for this reason.  Alway import from server-interace, not protocol.

For example:
```
// These are not the types you're looking for...
import { ListProfilesParams } from '@aws/language-server-runtimes/server-interface'
import { ListProfilesParams } from '@aws/language-server-runtimes/protocol'
import { ListProfilesParams } from '@aws/language-server-runtimes/protocol/identity-management'

// This is the way
import { ListProfilesParams } from '@aws/language-server-runtimes/server-interface/identity-management'
```