import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@ui5/webcomponents/dist/Assets";
import "@ui5/webcomponents-fiori/dist/Assets";
import "@ui5/webcomponents-icons/dist/Assets";
import { setTheme } from "@ui5/webcomponents-base/dist/config/Theme";

setTheme("sap_horizon");

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);