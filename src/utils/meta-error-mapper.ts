/**
 * Chuyển đổi mã lỗi từ Meta API sang thông báo tiếng Việt thân thiện với người dùng.
 * Giúp người dùng hiểu rõ nguyên nhân lỗi (hết hạn token, bị chặn spam, thiếu quyền...) 
 * thay vì hiển thị các mã code kỹ thuật khó hiểu.
 * 
 * Tài liệu tham khảo: https://developers.facebook.com/docs/graph-api/overview/error-handling
 */
export function mapMetaError(error: any): string {
  if (!error) return 'Đã có lỗi không xác định xảy ra.';
  
  // Nếu error là string (không phải object từ API), trả về chính nó
  if (typeof error === 'string') return error;

  const code = error.code;
  const subcode = error.error_subcode;
  const message = error.message || '';

  // 1. Lỗi phân quyền và Token (Access Token issues)
  if (code === 190 || code === 102) {
    switch (subcode) {
      case 458: return 'Ứng dụng đã bị gỡ quyền truy cập. Vui lòng kết nối lại tài khoản.';
      case 460: return 'Người dùng đã thay đổi mật khẩu. Vui lòng kết nối lại tài khoản.';
      case 463: return 'Phiên đăng nhập đã hết hạn. Vui lòng kết nối lại tài khoản.';
      case 467: return 'Token đã bị thu hồi hoặc hết hiệu lực. Vui lòng kết nối lại.';
      case 492: return 'Tài khoản đã bị vô hiệu hóa bởi Meta.';
      default: return 'Quyền truy cập Meta đã hết hạn hoặc bị thay đổi. Vui lòng kết nối lại tài khoản.';
    }
  }

  // 2. Lỗi giới hạn tần suất (Rate Limiting)
  if (code === 4 || code === 17 || code === 32 || code === 613) {
    return 'Tài khoản của bạn đã đạt giới hạn tần suất đăng bài của Meta. Vui lòng đợi một khoảng thời gian trước khi thử lại.';
  }

  // 3. Lỗi nội dung bị chặn hoặc Spam (Spam policy)
  if (code === 368) {
    return 'Bài đăng bị Meta chặn vì nghi ngờ spam hoặc vi phạm Tiêu chuẩn cộng đồng.';
  }

  // 4. Lỗi phân quyền (Permission errors)
  if (code === 200 || code === 10 || code === 210) {
    if (message.includes('permission')) {
      return 'Ứng dụng chưa được cấp đủ quyền để thực hiện hành động này. Vui lòng kiểm tra cài đặt Page/Instagram.';
    }
    return 'Bạn không có quyền thực hiện hành động này trên tài khoản mục tiêu.';
  }

  // 5. Lỗi tham số không hợp lệ (Invalid parameters / Media issues)
  if (code === 100) {
    if (message.includes('media') || message.includes('file')) {
      return 'File media không hợp lệ, kích thước quá lớn hoặc định dạng không được Meta hỗ trợ.';
    }
    if (message.includes('link')) {
      return 'Liên kết (URL) trong bài đăng không hợp lệ hoặc bị Meta chặn.';
    }
    return 'Dữ liệu bài đăng không hợp lệ. Vui lòng kiểm tra lại nội dung và file đính kèm.';
  }

  // 6. Lỗi hệ thống từ phía Meta (Internal server errors)
  if (code === 1 || code === 2) {
    return 'Hệ thống Meta đang gặp sự cố tạm thời. Vui lòng thử lại sau vài phút.';
  }

  // 7. Lỗi đặc thù của Instagram
  if (subcode === 2207001) return 'Video vẫn đang được xử lý trên máy chủ Instagram. Vui lòng đợi thêm.';
  if (subcode === 2207005) return 'Thời lượng video không nằm trong khoảng cho phép (3s - 15p).';
  if (subcode === 2207008) return 'Định dạng video không được hỗ trợ cho Instagram.';

  // Mặc định trả về thông báo lỗi gốc từ Meta nếu không mapping được
  return message || 'Lỗi không xác định từ Meta API.';
}

/**
 * Kiểm tra xem một lỗi Meta có phải là lỗi tạm thời (transient error) và có thể retry được không.
 * Các lỗi transient thường bao gồm: Giới hạn tần suất (Rate Limit), Lỗi server nội bộ của Meta, hoặc Video đang xử lý.
 */
export function isTransientMetaError(error: any): boolean {
  if (!error || typeof error === 'string') return false;

  const code = error.code;
  const subcode = error.error_subcode;

  // Lỗi giới hạn tần suất (Rate Limiting)
  if (code === 4 || code === 17 || code === 32 || code === 613) return true;

  // Lỗi hệ thống Meta (Internal server errors)
  if (code === 1 || code === 2) return true;

  // Lỗi Video IG đang xử lý (có thể xong sau vài phút)
  if (subcode === 2207001) return true;

  return false;
}
