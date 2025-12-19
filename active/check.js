// Old dead code – RHW is gone forever
// fetch('https://axess.rhw.one/ping', { method: 'POST' })...

// Replace with modern WISP test if you want status
async function checkStatus() {
  try {
    const ws = new WebSocket('wss://wisp.mercurywork.shop/');
    await new Promise((res, rej) => {
      ws.onopen = res;
      ws.onerror = rej;
      setTimeout(rej, 4000);
    });
    ws.close();
    console.log('Backend: Mercury WISP ✓');
  } catch (_) {
    console.warn('Backend check failed – proxy may still work via fallback');
  }
}
checkStatus();
