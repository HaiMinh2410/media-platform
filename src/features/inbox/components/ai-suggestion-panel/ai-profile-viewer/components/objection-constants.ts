/**
 * Định nghĩa chi tiết các rào cản mua hàng (Objections) phổ biến theo Playbook 2.0
 */
export const OBJECTION_DETAILS: Record<string, { label: string; reason: string }> = {
  too_expensive: {
    label: "Chê đắt / Giá cao",
    reason: "Khách hàng không có đủ khả năng tài chính hiện tại.",
  },
  not_trusted: {
    label: "Chưa tin tưởng",
    reason: "Khách hàng lo ngại tài khoản giả mạo hoặc lừa đảo.",
  },
  too_busy: {
    label: "Bận rộn / Hẹn sau",
    reason: "Khách hàng trì hoãn phản hồi.",
  },
  privacy_concern: {
    label: "Lo ngại bảo mật",
    reason:
      "Khách hàng lo sợ bị rò rỉ hình ảnh, video riêng tư hoặc thông tin cá nhân ra ngoài.",
  },
  want_free: {
    label: "Đòi xem miễn phí",
    reason:
      "Khách hàng yêu cầu gửi hình ảnh, video xem thử miễn phí trước khi quyết định chi tiền.",
  },
  asking_price: {
    label: "Hỏi giá trực tiếp",
    reason:
      "Khách hàng chủ động hỏi thăm chi phí hoặc các gói dịch vụ đặc quyền.",
  },
  other: {
    label: "Từ chối khác",
    reason:
      "Khách hàng đưa ra các lý do từ chối hoặc rào cản khác ngoài các danh mục phổ biến.",
  },
};

/**
 * Các biểu thức chính quy (Regex) dùng để quét nhanh tin nhắn của fan
 */
export const OBJECTION_REGEXES: Record<string, RegExp> = {
  want_free:
    /(free|miễn phí|cho xin|xin ảnh|gửi ảnh|cho xem|xin video|gửi video|coi free|xin hình|gửi hình|coi thử|xem thử|leak)/i,
  too_expensive:
    /((đắt|mắc|cao|phí) quá|không có tiền|hết tiền|giá chát|đắt thế|bớt không|giảm giá|sale)/i,
  not_trusted:
    /((chưa|không) tin|ảo|lừa|lừa đảo|thật không|có thật không|tin được không|uy tín|thật hay giả)/i,
  privacy_concern:
    /(sợ lộ|bảo mật|an toàn hông|an toàn không|lộ ảnh|lộ hình|lộ video|kín đáo|riêng tư không|bị lộ)/i,
  too_busy:
    /((đang|anh) bận|lúc khác|khi khác|sau nha|sau nhen|tí nữa|mai nha|bận quá|bận rồi)/i,
  asking_price:
    /(bao nhiêu|nhiêu|giá sao|giá gói|giá cả|nhiêu tiền|gói nào|xin giá|hỏi giá)/i,
};
