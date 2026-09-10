import { createRootRoute, HeadContent, Scripts, Outlet } from "@tanstack/react-router";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Sarah Joe" },
      { name: "description", content: "A fictionalized AI conversational portrayal inspired by Sarah Joe Chamoun / Mia Khalifa's public persona." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@400;500;600&display=swap" },
    ],
  }),
  component: () => (
    <html lang="en" className="antialiased">
      <head><HeadContent /></head>
      <body><Outlet /><Scripts /></body>
    </html>
  ),
});
