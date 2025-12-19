// active/scripts/prxy.mjs
// Ultraviolet proxy core – production-ready, relative paths (Dec 2025)
// Senior dev refactor: static imports, explicit named exports, resilient chain

import * as BareMux from "../prxy/baremux/index.mjs";
import { registerSW } from "../prxy/register-sw.mjs";

import { rAlert } from "./utils.mjs";

// BareMux worker path – root-relative (required by library for valid URL)
const connection = new BareMux.BareMuxConnection("/UV-Static-2.0/active/prxy/baremux/worker.js");

// Top-tier 2025 backends
const WISP_PRIMARY = "wss://wisp.mercurywork.shop/";     // MercuryWorkshop – maximum stealth & speed
const WISP_BACKUP  = "wss://wisp.titaniumnetwork.dev/";
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";

/**
 * Intelligent URL resolver with search fallback
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
 * Transport priority chain – Epoxy first, auto-fallback
 */
async function configureTransport() {
  const transports = [
    { path: "../prxy/epoxy/index.mjs",       args: [{ wisp: WISP_PRIMARY }], name: "Epoxy (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_PRIMARY }], name: "Libcurl (Mercury WISP)" },
    { path: "../prxy/libcurl/libcurl.mjs",   args: [{ wisp: WISP_BACKUP }],  name: "Libcurl (TN WISP)" },
    { path: "../prxy/baremod/bare-module.mjs", args: [BARE_FALLBACK],       name: "Bare HTTP (fallback)" },
  ];

  for (const t of transports) {
    try {
      if ((await connection.getTransport()) === t.path) {
        console.log(`Transport already active: ${t.name}`);
        return;
      }
      await connection.setTransport(t.path, t.args);
      console.log(`Transport connected: ${t.name} ✅`);
      rAlert(`Backend: ${t.name.split(' ')[0]} ✓`);
      return;
    } catch (err) {
      console.warn(`Failed ${t.name}:`, err.message);
    }
  }

  throw new Error("All backends unreachable");
}

/**
 * Core proxy function – SW registration + transport + encoding
 */
export async function getUV(input) {
  try {
    await registerSW();
    rAlert("Service Worker ✓");
  } catch (err) {
    rAlert(`SW failed:<br>${err.message}`);
    throw err;
  }

  const targetUrl = search(input);

  try {
    await configureTransport();
  } catch (err) {
    rAlert(`Backend failed:<br>${err.message}`);
    throw err;
  }

  return __uv$config.prefix + __uv$config.encodeUrl(targetUrl);
}
