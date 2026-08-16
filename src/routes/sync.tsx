import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Sync } from "@/features/Sync";

import "./tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sync />
  </StrictMode>,
);
