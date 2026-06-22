import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(async () => {
  const plugins: any[] = [];

  try {
    const tanstack = await import("@tanstack/react-start/plugin/vite");
    const tanstackStart = (tanstack as any).tanstackStart ?? (tanstack as any).default ?? tanstack;
    if (typeof tanstackStart === "function") {
      plugins.push(
        tanstackStart({
          server: { entry: "server" },
        }),
      );
    }
  } catch (err) {
    console.warn("@tanstack/react-start plugin not available:", err);
  }

  // Ensure TanStack Router plugin runs before JSX transformation
  try {
    const routerMod = await import("@tanstack/router-plugin");
    const tanstackRouter = (routerMod as any).default ?? (routerMod as any).tanstackRouter ?? routerMod;
    if (typeof tanstackRouter === "function") plugins.push(tanstackRouter());
  } catch (err) {
    console.warn("@tanstack/router-plugin not available:", err);
  }

  // Add React plugin after TanStack plugins
  plugins.push(react());

  // Tailwind plugin
  plugins.push(tailwindcss());

  // Nitro plugin for Netlify builds
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
    resolve: { tsconfigPaths: true },
    plugins,
  };
});
