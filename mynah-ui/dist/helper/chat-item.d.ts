import { ChatItem } from '../static';
export declare const chatItemHasContent: (chatItem: Partial<ChatItem>) => boolean;
export declare const copyToClipboard: (textToSendClipboard: string, onCopied?: () => void) => Promise<void>;
