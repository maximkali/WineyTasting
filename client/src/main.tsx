import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clear any problematic session storage that might be blocking interactions
try {
  // Clear all session storage to remove any blocking state
  const keysToRemove = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.startsWith('tempGame_') || key.startsWith('hostToken_'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
} catch (e) {
  console.warn('Session storage cleanup failed:', e);
}

createRoot(document.getElementById("root")!).render(<App />);
