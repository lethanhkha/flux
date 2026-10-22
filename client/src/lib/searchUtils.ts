/**
 * Normalizes Vietnamese text by removing diacritical accents (bỏ dấu tiếng Việt)
 * and converting to lowercase.
 *
 * Examples:
 * - "Ăn uống & Cà phê" -> "an uong & ca phe"
 * - "Điện thoại Đắk Lắk" -> "dien thoai dak lak"
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

/**
 * Checks if target text matches a search query, case-insensitively
 * and ignoring Vietnamese tone marks.
 *
 * @param targetText The text or label to search within
 * @param query The user's search query
 */
export function matchesSearch(targetText: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!targetText) return false;

  const normalizedTarget = removeVietnameseTones(targetText);
  const normalizedQuery = removeVietnameseTones(query);

  return normalizedTarget.includes(normalizedQuery);
}
