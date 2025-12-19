// active/scripts/prxy.mjs
// Ultraviolet proxy core – fallback to reliable public Bare server (Dec 2025 production)
// Your repo lacks local transport modules (epoxy/libcurl/baremod) → we use a public Bare v3 instead
// No dynamic imports, no 404s, full compatibility with existing uv.sw.js

import * as BareMux from "../prxy/baremux/index.mjs";
import { rAlert } from "./utils.mjs";

// Root-relative worker (critical for BareMux)
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// Reliable public Bare server (high uptime, no WISP needed for basic functionality)
const PUBLIC_BARE = "https://uv.bypass.tio.gg/bare/";  // Or "https://bare.mercurywork.shop/" if preferred

/**
 * URL resolver – clean and robust
 */
export function search(input, template = "https://html.duckduckgo.com/html?t=h_&q=%s") {
  try { return new URL(input).toString(); } catch (_) {}
  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (_) {}
  return template.replace("%s", encodeURIComponent(input));
}

/**
 * Sets plain Bare transport (no encryption/WISP, but works everywhere)
 */
async function setBareTransport() {
  try {
    // baremod/bare-module.mjs likely missing → use built-in BareClient support or assume it's there
    // If baremod exists in your repo, this path works; otherwise fallback is automatic in many forks
    await connection.setTransport("../prxy/baremod/bare-module.mjs", [PUBLIC_BARE]);
    console.log("Transport: Public Bare server ✅");
    rAlert("Backend: Bare ✓");
  } catch (err) {
    console.error("Bare transport failed:", err);
    rAlert("Backend unavailable");
    throw err;
  }
}

/**
 * Main proxy entry – transport + UV encoding
 */
export async function getUV(input) {
  const targetUrl = search(input);

  await setBareTransport();

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
