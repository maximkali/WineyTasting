// Centralized design tokens
export const theme = {
  colors: {
    primary: '#7B1FA2',
    secondary: '#69F0AE',
    error: '#FF5252',
    wineRed: '#9B1B30'
  },
  spacing: (factor: number) => `${factor * 8}px`,
  fonts: {
    main: '"Helvetica Neue", Arial, sans-serif',
    fancy: '"Cinzel", serif'
  }
};
