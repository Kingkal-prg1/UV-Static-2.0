// active/uv/uv.sw.js
// Modern Ultraviolet Service Worker with full BareMux integration (2025 standard)
// Compatible with public Bare servers and local transports

importScripts("uv.bundle.js");
importScripts("uv.config.js"); // If separate; adjust if bundled
import { BareMux } from "@mercuryworkshop/bare-mux"; // Assumes bundled or global

const uv = new UVServiceWorker();
const baremux = new BareMux();

self.addEventListener("fetch", (event) => {
  event.respondWith(
    (async () => {
      if (baremux.shouldRoute(event.request)) {
        return await baremux.route(event.request);
      }
      if (uv.route(event.request)) {
        return await uv.fetch(event);
      }
      return fetch(event.request);
    })()
  );
});
