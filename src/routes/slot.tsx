import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Slot } from "@/features/Slot";

import "./tailwind.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Slot />
  </StrictMode>,
);
