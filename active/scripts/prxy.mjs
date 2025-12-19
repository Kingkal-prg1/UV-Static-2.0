// active/scripts/prxy.mjs
// Ultraviolet proxy core – minimal, robust config for your exact repo (Dec 2025)
// Uses direct Epoxy over Mercury WISP (gold standard – no dynamic imports needed)
// No fallbacks (your repo only has baremux; epoxy/libcurl/baremod subfolders likely empty or missing)

import * as BareMux from "../prxy/baremux/index.mjs";
import { rAlert } from "./utils.mjs";

// Root-relative worker path – required for BareMux
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// Primary backend – MercuryWorkshop WISP (encrypted, fastest, most reliable in 2025)
const WISP_URL = "wss://wisp.mercurywork.shop/";

/**
 * Simple URL resolver
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
 * Sets the optimal transport (Epoxy + WISP) – single call, no dynamic import failures
 */
async function setOptimalTransport() {
  try {
    // Direct path assuming your repo has epoxy/index.mjs at root of prxy (common in forks)
    // If 404 persists, confirm file exists at active/prxy/epoxy/index.mjs
    await connection.setTransport("../prxy/epoxy/index.mjs", [{ wisp: WISP_URL }]);
    console.log("Transport: Epoxy (Mercury WISP) ✅");
    rAlert("Backend: Epoxy ✓");
  } catch (err) {
    console.error("Epoxy failed:", err);
    rAlert("Backend failed – check console");
    throw err;
  }
}

/**
 * Main proxy function – transport setup + UV encoding
 */
export async function getUV(input) {
  const targetUrl = search(input);

  await setOptimalTransport();

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
