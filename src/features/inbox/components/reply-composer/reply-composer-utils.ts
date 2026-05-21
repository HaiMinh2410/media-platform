import { MessageWithSender } from '@features/inbox/types';

export const SNIPPETS = [
  { id: '1', title: 'Welcome', text: 'Chào mừng bạn đến với Media Platform! Rất vui được hỗ trợ bạn.' },
  { id: '2', title: 'Pricing', text: 'Hiện tại chúng tôi có các gói: Basic (9$) , Pro (29$) và Enterprise.' },
  { id: '3', title: 'Bye', text: 'Cảm ơn bạn. Chúc bạn một ngày tốt lành!' },
];

export const MAX_TEXTAREA_HEIGHT = 320;

export const getReplyMessagePreview = (message: MessageWithSender): string => {
  if (message.content) return message.content;
  if (!message.attachments || message.attachments.length === 0) return '[Tệp đính kèm]';
  
  const first = message.attachments[0];
  switch (first.type) {
    case 'image':
      return '[Hình ảnh]';
    case 'video':
      return '[Video]';
    case 'audio':
      return '[Tin nhắn thoại]';
    case 'file':
      return '[Tài liệu]';
    default:
      return '[Tệp đính kèm]';
  }
};
