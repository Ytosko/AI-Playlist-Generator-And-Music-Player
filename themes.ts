export type ThemeName = 'indigo' | 'crimson' | 'emerald' | 'amber';
export type ThemeType = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  type: ThemeType,
  displayName: string;
  colors: {
    preview: string;
  };
}

export const themes: Theme[] = [
  { name: 'indigo', type: 'dark', displayName: 'Indigo', colors: { preview: '#6366f1' } },
  { name: 'crimson', type: 'light', displayName: 'Crimson', colors: { preview: '#f43f5e' } },
  { name: 'emerald', type: 'light', displayName: 'Emerald', colors: { preview: '#22c55e' } },
  { name: 'amber', type: 'dark', displayName: 'Amber', colors: { preview: '#f59e0b' } },
];