import { createRoot } from "react-dom/client";
import App from "./App";
// Temporarily disabled CSS to test interaction blocking
// import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
