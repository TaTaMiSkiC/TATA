import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "next-themes";

// Dohvati inicijalni jezik iz localStorage
let initialLang = "hr";
if (typeof window !== "undefined") {
  const savedLang = localStorage.getItem("language");
  if (savedLang && ["hr", "en", "de"].includes(savedLang)) {
    initialLang = savedLang;
    document.documentElement.lang = savedLang;
  }
}

// Dohvati inicijalni tema iz localStorage
let initialTheme = "light";
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme && ["light", "dark", "system"].includes(savedTheme)) {
    initialTheme = savedTheme;
  }
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme={initialTheme}>
    <App />
  </ThemeProvider>
);
