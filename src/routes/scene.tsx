import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Scene } from "@/features/Scene";

import "./tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Scene />
  </StrictMode>,
);
