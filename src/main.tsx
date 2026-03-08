import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Recovery for stale published caches/service workers that can cause black screen
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.includes("vidal-pedalboard") || k.includes("workbox"))
            .map((k) => caches.delete(k))
        );
      }
    } catch {
      // no-op
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);

