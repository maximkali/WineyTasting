// Shared style hooks
import { theme } from '../styles/theme';

export const useWineGameStyles = () => ({
  card: {
    borderRadius: theme.spacing(1),
    backgroundColor: theme.colors.wineRed,
    padding: theme.spacing(2)
  },
  // Add more shared styles here
});
