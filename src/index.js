import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@ui5/webcomponents/dist/Assets";
import "@ui5/webcomponents-fiori/dist/Assets";
import "@ui5/webcomponents-icons/dist/Assets";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme";

// Applique le thème sauvegardé avant le premier rendu, pour éviter un flash
// clair -> sombre au chargement si l'utilisateur avait choisi le mode sombre.
// ThemeProvider (dans App.jsx) prend ensuite le relais pour les changements
// effectués pendant la session.
const savedTheme = window.localStorage.getItem("avaxia-theme");
setTheme(savedTheme === "dark" ? "sap_horizon_dark" : "sap_horizon");
document.documentElement.setAttribute("data-theme", savedTheme === "dark" ? "dark" : "light");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
