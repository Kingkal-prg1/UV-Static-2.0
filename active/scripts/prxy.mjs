// active/scripts/prxy.mjs
// Ultraviolet proxy core – final production fix (Dec 2025)
// Relative paths fixed + worker path now root-relative for BareMux requirements

import * as BareMux from "../prxy/baremux/index.mjs";
import { registerSW } from "../prxy/register-sw.mjs"; // Safe even if not used

import { rAlert } from "./utils.mjs";

// BareMux requires the worker URL to be absolute or start with '/' (root-relative)
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// Stable 2025 backends
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";     // MercuryWorkshop – elite tier uptime & speed
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";

/**
 * URL resolver with search fallback
 */
export function search(input, template = "https://html.duckduckgo.com/html?t=h_&q=%s") {
  try {
    return new URL(input).toString();
  } catch (_) {}

  try {
    const url = new URL(`http://${input}`);
    if (url.hostname.includes(".")) return url.toString();
  } catch (_) {}

  return template.replace("%s", encodeURIComponent(input));
}

/**
 * Robust transport chain – tries best first, degrades gracefully
 */
async function configureTransport() {
  const transports = [
    { path: "../prxy/epoxy/index.mjs",       args: [{ wisp: WISP_PRIMARY }], name: "Epoxy (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_PRIMARY }], name: "Libcurl (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_BACKUP }],  name: "Libcurl (TN WISP backup)" },
    { path: "../prxy/baremod/bare-module.mjs", args: [BARE_FALLBACK],       name: "Bare HTTP (public fallback)" },
  ];

  for (const t of transports) {
    try {
      if ((await connection.getTransport()) === t.path) {
        console.log(`Transport already set: ${t.name}`);
        return true;
      }

      await connection.setTransport(t.path, t.args);
      console.log(`Transport active: ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return true;
    } catch (err) {
      console.warn(`Transport failed (${t.name}):`, err.message);
    }
  }

  throw new Error("All backends down – check your network");
}

/**
 * Primary export – full proxy flow
 */
export async function getUV(input) {
  try {
    await registerSW();
    rAlert("Service Worker ✓");
  } catch (err) {
    rAlert(`SW error:<br>${err.message}`);
    throw err;
  }

  const targetUrl = search(input);

  try {
    await configureTransport();
  } catch (err) {
    rAlert(`No backend:<br>${err.message}`);
    throw err;
  }

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
