// check.js – Robust backend status checker (2025 edition)
// Replaces dead RHW ping with WISP connectivity + fallback Bare test

async function checkServiceStatus() {
  const statusElement = document.getElementById('status'); // Adjust selector if needed
  const PRIMARY_WISP = "wss://wisp.mercurywork.shop/"; // Official MercuryWorkshop – rock solid in 2025

  try {
    // Step 1: Test WISP connectivity (opens WS, sends ping frame)
    const ws = new WebSocket(PRIMARY_WISP);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error("WISP connection failed"));
      ws.onclose = () => reject(new Error("WISP closed early"));
      setTimeout(() => reject(new Error("WISP timeout")), 5000);
    });
    ws.close();
    updateStatus("online", "WISP ✓ (MercuryWorkshop)");
    console.log("Backend status: WISP online");
    return true;
  } catch (err) {
    console.warn("WISP unreachable:", err.message);
  }

  try {
    // Step 2: Fallback – test a public Bare server (no CORS needed if same-origin proxy works)
    const bareTest = await fetch("https://uv.bypass.tio.gg/bare/v1/", { method: "HEAD" });
    if (bareTest.ok) {
      updateStatus("online", "Bare fallback ✓");
      return true;
    }
  } catch (_) {}

  // All failed
  updateStatus("offline", "No backend reachable");
  console.error("All backends down");
  return false;
}

function updateStatus(state, message) {
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.className = state; // e.g., 'online' or 'offline' for CSS
  }
}

// Run on load
document.addEventListener("DOMContentLoaded", checkServiceStatus);
