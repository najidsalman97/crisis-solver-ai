import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => {
  const plugins: any[] = [];
  plugins.push(react());
  plugins.push(tsconfigPaths());
  plugins.push(tailwindcss());

  try {
    const tanstack = await import("@tanstack/react-start/plugin/vite");
    const tanstackStart = (tanstack as any).tanstackStart ?? (tanstack as any).default ?? tanstack;
    plugins.push(
      tanstackStart({
        server: { entry: "server" },
      }),
    );
  } catch (err) {
    console.warn("@tanstack/react-start plugin not available:", err);
  }

  try {
    const nitroMod = await import("nitro/vite");
    if (nitroMod?.nitro) {
      plugins.push(nitroMod.nitro({ preset: "netlify" }));
    }
  } catch (err) {
    console.info("nitro/vite not installed — skipping Nitro plugin (install nitro for Netlify builds)");
  }

  return {
    server: { host: "::", port: 8080 },
    plugins,
  };
});
