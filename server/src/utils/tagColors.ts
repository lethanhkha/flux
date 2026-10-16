export const PASTEL_PALETTE = [
  '#F43F5E', // Blossom Rose
  '#FB923C', // Peach Coral
  '#F59E0B', // Warm Amber
  '#10B981', // Mint Sage
  '#059669', // Fresh Jade
  '#0EA5E9', // Sky Blue
  '#6366F1', // Classic Flux
  '#8B5CF6', // Soft Purple
  '#D946EF', // Orchid Fuchsia
  '#EF4444', // Berry Crimson
  '#06B6D4', // Cyan Aqua
  '#64748B', // Cool Slate
];

export function getDefaultTagColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PASTEL_PALETTE.length;
  return PASTEL_PALETTE[index];
}
