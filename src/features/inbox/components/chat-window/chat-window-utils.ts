export const getInitials = (name: string): string => {
  const split = name.trim().split(' ');
  if (split.length > 1) {
    return (split[0][0] + split[split.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const formatBubbleTime = (dateInput?: Date | string): string => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
