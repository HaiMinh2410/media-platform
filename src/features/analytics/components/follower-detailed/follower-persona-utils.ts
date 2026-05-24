export const COUNTRY_MAP: Record<string, string> = {
  VN: 'Việt Nam',
  US: 'Hoa Kỳ',
  ID: 'Indonesia',
  TH: 'Thái Lan',
  PH: 'Philippines',
  MY: 'Malaysia',
  SG: 'Singapore',
  JP: 'Nhật Bản',
  KR: 'Hàn Quốc',
  IN: 'Ấn Độ',
  BR: 'Brazil',
  MX: 'Mexico',
  GB: 'Vương Quốc Anh',
  FR: 'Pháp',
  DE: 'Đức',
  AU: 'Australia',
  CA: 'Canada',
  CN: 'Trung Quốc',
  RU: 'Nga',
  ES: 'Tây Ban Nha',
  IT: 'Ý',
};

export function translateCountry(code: string): string {
  const cleanCode = code.trim().toUpperCase();
  return COUNTRY_MAP[cleanCode] || cleanCode;
}

// Helper function to check if the top country label corresponds to Vietnam
export function topCountryLabelIsVN(label: string): boolean {
  const clean = label.toLowerCase();
  return clean.includes('việt nam') || clean.includes('vietnam') || clean.includes('vn');
}
