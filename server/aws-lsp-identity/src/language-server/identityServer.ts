import { createConnection, ProposedFeatures } from 'vscode-languageserver/node'
import {
    listProfilesRequestType,
    ListProfilesParams,
    ListProfilesResult,
    ListProfilesError,
} from '@aws/language-server-runtimes/protocol/identity-management'
import { ProfileService } from './profiles/profileService'
import {
    UpdateProfileParams,
    UpdateProfileResult,
    UpdateProfileError,
    updateProfileRequestType,
} from '@aws/language-server-runtimes/protocol/identity-management'
import { SharedConfigProfileStore } from './profiles/sharedConfigProfileStore'

const connection = createConnection(ProposedFeatures.all)

const profileServer = new ProfileService(new SharedConfigProfileStore())

connection.onRequest<ListProfilesParams, ListProfilesResult, void, ListProfilesError, void>(
    listProfilesRequestType,
    profileServer.listProfiles.bind(profileServer)
)

connection.onRequest<UpdateProfileParams, UpdateProfileResult, void, UpdateProfileError, void>(
    updateProfileRequestType,
    profileServer.updateProfile.bind(profileServer)
)

connection.listen()
