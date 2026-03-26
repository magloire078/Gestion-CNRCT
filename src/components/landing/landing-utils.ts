
export const getInitials = (name: string = '') => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

export const cleanRegionName = (region: string = '') => {
  return region
    .replace(/^Région de la\s+/i, '')
    .replace(/^Région du\s+/i, '')
    .replace(/^Région d'\s+/i, '')
    .replace(/^La Région de\s+/i, '')
    .replace(/^Le District de\s+/i, '')
    .replace(/^District Autonome de\s+/i, '')
    .replace(/^District Autonome d'\s+/i, '')
    .trim();
};
