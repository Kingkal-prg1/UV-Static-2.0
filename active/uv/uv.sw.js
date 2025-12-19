// active/uv/uv.sw.js
// Modern Ultraviolet Service Worker with BareMux support (2025)

import { BareMux } from "@mercuryworkshop/bare-mux"; // If bundled, or assume global

const baremux = new BareMux();

self.addEventListener("fetch", event => {
  event.respondWith(
    (async () => {
      if (await baremux.shouldRoute(event.request)) {
        return await baremux.route(event.request);
      }
      return await fetch(event.request);
    })()
  );
});

// Standard UV setup (your existing uv.sw.js logic here, or import uv bundle if separate)
importScripts("uv.bundle.js"); // If you have separate bundle
const uv = new UVServiceWorker();

self.addEventListener("fetch", event => {
  if (uv.route(event.request)) {
    event.respondWith(uv.fetch(event));
  }
});
