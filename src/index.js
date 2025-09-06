import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./pages/LoginSignup.css";
import "./styles/corner.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);
