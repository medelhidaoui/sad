import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Add global styles
document.documentElement.style.setProperty('--whatsapp-green', '#25D366');
document.documentElement.style.setProperty('--whatsapp-dark-green', '#128C7E');
document.documentElement.style.setProperty('--whatsapp-blue', '#34B7F1');
document.documentElement.style.setProperty('--whatsapp-light', '#F0F2F5');
document.documentElement.style.setProperty('--whatsapp-lighter', '#E4E6EB');
document.documentElement.style.setProperty('--status-connected', '#25D366');
document.documentElement.style.setProperty('--status-disconnected', '#F15B42');
document.documentElement.style.setProperty('--status-connecting', '#F2AD41');

createRoot(document.getElementById("root")!).render(<App />);
