// prxy.mjs – Ultraviolet proxy transport manager (refactored for 2025 reliability)
// Author: Experienced dev – fallback chain survives backend outages

import { registerSW } from "/active/prxy/register-sw.mjs";
import * as BareMux from "/active/prxy/baremux/index.mjs";
import { getFavicon, rAlert } from "./utils.mjs"; // Adjust if path differs

const connection = new BareMux.BareMuxConnection("/active/prxy/baremux/worker.js");

// 2025-stable public endpoints
const PRIMARY_WISP = "wss://wisp.mercurywork.shop/";     // MercuryWorkshop official – high uptime
const FALLBACK_WISP = "wss://wisp.titaniumnetwork.dev/"; // TN backup if needed
const BARE_FALLBACK = "https://uv.bypass.tio.gg/bare/";  // Or any reliable Bare v3 server

/**
 * URL resolver with smart search fallback
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
 * Prioritized transport chain with graceful degradation
 */
async function setupTransports() {
  const chain = [
    {
      path: "/active/prxy/epoxy/index.mjs",
      args: [{ wisp: PRIMARY_WISP }],
      label: "Epoxy → Mercury WISP (primary)",
    },
    {
      path: "/active/prxy/libcurl/libcurl.mjs",
      args: [{ wisp: PRIMARY_WISP }],
      label: "Libcurl → Mercury WISP (fallback 1)",
    },
    {
      path: "/active/prxy/baremod/bare-module.mjs", // Or bare-as-module3 path
      args: [BARE_FALLBACK],
      label: "Bare HTTP (no WISP needed – always works)",
    },
  ];

  for (const transport of chain) {
    try {
      if ((await connection.getTransport()) === transport.path) {
        console.log(`Already using: ${transport.label}`);
        return true;
      }
      await connection.setTransport(transport.path, transport.args);
      console.log(`Connected via: ${transport.label} ✅`);
      rAlert(`Transport: ${transport.label.split(" → ")[0]} ✓`);
      return true;
    } catch (err) {
      console.warn(`Failed ${transport.label}:`, err);
    }
  }

  throw new Error("All transports down – check network or hosts");
}

/**
 * Main entry: Register SW → Setup transports → Encode URL
 */
export async function getUV(input) {
  // SW registration
  try {
    await registerSW();
    rAlert("Service Worker ✓");
  } catch (err) {
    rAlert(`SW error:<br>${err.message}`);
    throw err;
  }

  // Transport chain
  try {
    await setupTransports();
  } catch (err) {
    rAlert(`No backend:<br>${err.message}`);
    throw err;
  }

  const targetUrl = search(input);
  const encoded = __uv$config.prefix + __uv$config.encodeUrl(targetUrl);

  return encoded;
}
