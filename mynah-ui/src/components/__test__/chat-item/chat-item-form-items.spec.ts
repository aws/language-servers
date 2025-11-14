import { ChatItemFormItemsWrapper } from '../../chat-item/chat-item-form-items';

describe('ChatItemFormItemsWrapper', () => {
    it('should render form items wrapper', () => {
        const wrapper = new ChatItemFormItemsWrapper({
            tabId: 'test-tab',
            chatItem: {},
        });

        expect(wrapper.render).toBeDefined();
    });
});
