import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No proxy — set VITE_API_BASE_URL to your FastAPI origin (e.g. http://localhost:8000).
export default defineConfig({
  plugins: [react()],
});
