# Agentic Chat Server
This folder is meant to devlop the agentic chat server separately from the existing `qChatServer`. All changes in this folder are meant to override the behavior in `qChatServer` or any of the supporting components in the `../chat/` folder.

Do not make changes to the `../chat/` folder directly unless it is clear that these won't break existing functionality. If changes are needed in any of those components, they can be copied over to this folder to modify.

The end state is that the changes in this agentic chat server be merged back into the `qChatServer` and the `../chat/` folder. The reason we don't want to create a feature branch for this work is both chat servers can be used interchangeably behind e.g., a feature flag, until one completely replaces the other.