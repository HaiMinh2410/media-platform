// --- Format File Size Utility ---
export const formatFileSize = (bytes?: number): string => {
  if (!bytes) return '';
  const bytesPerKb = 1024;
  const bytesPerMb = bytesPerKb * 1024;
  
  if (bytes < bytesPerKb) return `${bytes} B`;
  if (bytes < bytesPerMb) return `${(bytes / bytesPerKb).toFixed(1)} KB`;
  return `${(bytes / bytesPerMb).toFixed(1)} MB`;
};

// --- Extract Initials Utility ---
export const getInitials = (name: string): string => {
  const split = name.trim().split(' ');
  if (split.length > 1) {
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// --- Dynamic Border Radius Utility (Messenger-style grouping) ---
export const getDynamicCornersClass = (
  isUser: boolean,
  isPrevConsecutive: boolean,
  isNextConsecutive: boolean,
  defaultBase: string = "rounded-2xl",
  isReply: boolean = false
): string => {
  if (isReply) {
    return defaultBase; // Trả về góc bo tròn hoàn hảo đầy đủ 100% không dẹt cạnh nào đối với tin nhắn phản hồi
  }

  if (isUser) {
    // Tin nhắn gửi đến (Trái)
    if (isPrevConsecutive && isNextConsecutive) {
      return `${defaultBase} rounded-tl-sm rounded-bl-sm`; // Tin nhắn ở giữa
    }
    if (isPrevConsecutive && !isNextConsecutive) {
      return `${defaultBase} rounded-tl-sm`; // Tin nhắn cuối nhóm
    }
    return `${defaultBase} rounded-bl-sm`; // Tin nhắn đầu nhóm hoặc đơn lẻ
  } else {
    // Tin nhắn gửi đi (Phải)
    if (isPrevConsecutive && isNextConsecutive) {
      return `${defaultBase} rounded-tr-sm rounded-br-sm`; // Tin nhắn ở giữa
    }
    if (isPrevConsecutive && !isNextConsecutive) {
      return `${defaultBase} rounded-tr-sm`; // Tin nhắn cuối nhóm
    }
    return `${defaultBase} rounded-br-sm`; // Tin nhắn đầu nhóm hoặc đơn lẻ
  }
};

// --- Format Bubble Time Utility ---
export const formatBubbleTime = (dateInput?: Date | string): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

// --- Format Full Bubble Time Utility ---
export const formatFullBubbleTime = (dateInput?: Date | string): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  const days = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  // Note: date.getDay() returns 0 for Sunday, 1 for Monday, etc.
  const dayIndex = date.getDay();
  // Adjust index for days array: Sunday is 0 -> index 6, Monday is 1 -> index 0
  const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1;
  const dayName = days[adjustedIndex];
  
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'CH' : 'SA';
  if (hours > 12) {
    hours = hours - 12;
  } else if (hours === 0) {
    hours = 12;
  }
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${dayName} ${hours}:${minutes} ${ampm}`;
};
