// active/scripts/prxy.mjs
// Core proxy logic – transport only (SW registration belongs in tabs/init)
// Veteran dev style: lean, defensive, maximum compatibility

import * as BareMux from "../prxy/baremux/index.mjs";
import { rAlert } from "./utils.mjs";

// Root-relative worker (BareMux demands valid URL)
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// 2025 gold-standard backends
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";     // Fastest, most stealthy
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";

export function search(input, template = "https://html.duckduckgo.com/html?t=h_&q=%s") {
  try { return new URL(input).toString(); } catch (_) {}
  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (_) {}
  return template.replace("%s", encodeURIComponent(input));
}

async function configureTransport() {
  const transports = [
    { path: "../prxy/epoxy/index.mjs",       args: [{ wisp: WISP_PRIMARY }], name: "Epoxy (Mercury)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_PRIMARY }], name: "Libcurl (Mercury)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_BACKUP }],  name: "Libcurl (TN)" },
    { path: "../prxy/baremod/bare-module.mjs", args: [BARE_FALLBACK],       name: "Bare HTTP" },
  ];

  for (const t of transports) {
    try {
      if ((await connection.getTransport()) === t.path) return;
      await connection.setTransport(t.path, t.args);
      console.log(`Transport: ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return;
    } catch (err) {
      console.warn(`Failed ${t.name}:`, err);
    }
  }
  throw new Error("No backend");
}

export async function getUV(input) {
  const targetUrl = search(input);
  await configureTransport();
  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
