import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No proxy — frontend runs fully standalone with mock data.
export default defineConfig({
  plugins: [react()],
});
