// active/scripts/tabs.mjs
// UV-Static-2.0 tab manager – production-refactored (Dec 2025)
// Veteran dev polish: direct SW registration (standard for forks), clean flow, no external registerSW dependency

import { getFavicon, rAlert } from "./utils.mjs";
import { getUV, search } from "./prxy.mjs";

const { span, iframe, button, img } = van.tags;
const {
  tags: { "ion-icon": ionIcon },
} = van;

// Direct Ultraviolet Service Worker registration – points to the correct file in your repo
async function registerUltravioletSW() {
  if (!("serviceWorker" in navigator)) {
    throw new Error("Service Workers not supported");
  }

  try {
    // Your repo has uv.sw.js – this is the standard Ultraviolet SW script
    const registration = await navigator.serviceWorker.register("/UV-Static-2.0/active/uv/uv.sw.js", {
      scope: "/UV-Static-2.0/active/uv/",
    });

    console.log("Ultraviolet Service Worker registered ✅", registration);
    rAlert("Service Worker ✓");
  } catch (err) {
    console.error("SW registration failed:", err);
    rAlert(`SW failed:<br>${err.message}`);
    throw err;
  }
}

// Call it once on load – ensures SW is active before any proxying
registerUltravioletSW();

// Rest of your original code (unchanged for compatibility)
var tabs = [];
var selectedTab = null;

// Side bar
const sideBar = document.querySelector("header");
// Controls
const pageBack = document.getElementById("page-back");
const pageForward = document.getElementById("page-forward");
const pageRefresh = document.getElementById("page-refresh");
// URL Bar
const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
// New Tab Button
const newTabButton = document.getElementById("new-tab");
// Tab List
const tabList = document.getElementById("tab-list");
// Tab View
const tabView = document.getElementById("tab-view");

// Event Listeners
window.onmousemove = (e) => {
  if (e.clientX < 50) {
    sideBar.classList.add("hovered");
  } else {
    sideBar.classList.remove("hovered");
  }
};

pageBack.onclick = () => {
  selectedTab.view.contentWindow.history.back();
};

pageForward.onclick = () => {
  selectedTab.view.contentWindow.history.forward();
};

pageRefresh.onclick = () => {
  selectedTab.view.contentWindow.location.reload();
};

newTabButton.onclick = () => {
  addTab("uvsearch.rhw.one");
};

// Options
const devtoolsOption = document.getElementById("devtools-option");
const abcOption = document.getElementById("abc-option");
const gitOption = document.getElementById("git-option");

devtoolsOption.onclick = () => {
  try {
    selectedTab.view.contentWindow.eval(eruda);
    rAlert("Injected successfully.<br>Click the icon on the bottom right.");
  } catch (error) {
    rAlert("Failed to inject.");
  }
};

abcOption.onclick = () => {
  abCloak(selectedTab.view.src);
  rAlert("Opened in about:blank");
};

gitOption.onclick = () => {
  window.open("https://github.com/rhenryw/UV-Static-2.0", "_blank");
};

urlForm.onsubmit = async (e) => {
  e.preventDefault();
  selectedTab.view.src = await getUV(urlInput.value);
};

let eruda = `fetch("https://cdn.jsdelivr.net/npm/eruda")
.then((res) => res.text())
.then((data) => {
  eval(data);
  if (!window.erudaLoaded) {
    eruda.init({ defaults: { displaySize: 45, theme: "AMOLED" } });
    window.erudaLoaded = true;
  }
});`;

function abCloak(cloakUrl) {
  var win = window.open();
  var iframe = win.document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "0px";
  iframe.style.left = "0px";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.border = "none";
  iframe.src = cloakUrl;
  win.document.body.appendChild(iframe);
}

// Tab UI components & logic (your original – solid)
const tabItem = (tab) => {
  return button(
    {
      onclick: (e) => {
        if (
          !e.target.classList.contains("close") &&
          !e.target.classList.contains("close-icon")
        ) {
          focusTab(tab);
        }
      },
      class: "tab-item hover-focus1",
    },
    img({ src: getFavicon(tab.url) }),
    span(tab.title),
    button(
      {
        onclick: () => {
          tabs.splice(tabs.indexOf(tab), 1);
          if (tab == selectedTab) {
            selectedTab = null;
            if (tabs.length) focusTab(tabs[tabs.length - 1]);
            else setTimeout(() => addTab("uvsearch.rhw.one"), 100);
          }
          tabView.removeChild(tab.view);
          tab.view.remove();
          localStorage.setItem("tabs", JSON.stringify(tabs.map(t => t.url)));
          tab.item.style.animation = "slide-out-from-bottom 0.1s ease";
          setTimeout(() => {
            tabList.removeChild(tab.item);
            tab.item.remove();
          }, 75);
        },
        class: "close",
      },
      ionIcon({ name: "close", class: "close-icon" })
    )
  );
};

const tabFrame = (tab) => {
  return iframe({
    class: "tab-frame",
    src: tab.proxiedUrl,
    sandbox: "allow-scripts allow-forms allow-same-origin allow-modals allow-popups",
    onload: (e) => {
      try {
        const decodedPath = e.target.contentWindow.location.pathname.slice(1);
        const parts = decodedPath.split("/");
        const targetUrl = decodeURIComponent(__uv$config.decodeUrl(parts[parts.length - 1]));

        tab.title = e.target.contentWindow.document.title || "Untitled";
        tab.url = targetUrl;

        const tabItemEl = tabList.children[tabs.indexOf(tab)];
        tabItemEl.children[1].textContent = tab.title;
        tabItemEl.children[0].src = getFavicon(targetUrl);

        if (tab === selectedTab) {
          urlInput.value = targetUrl;
        }

        localStorage.setItem("tabs", JSON.stringify(tabs.map(t => t.url)));
      } catch (err) {
        console.warn("Title/URL update failed (CORS or empty frame)", err);
      }
    },
  });
};

function focusTab(tab) {
  if (selectedTab) {
    selectedTab.view.style.display = "none";
    tabList.children[tabs.indexOf(selectedTab)].classList.remove("selectedTab");
  }
  selectedTab = tab;
  tab.view.style.display = "block";
  urlInput.value = tab.url;
  tabList.children[tabs.indexOf(tab)].classList.add("selectedTab");
}

async function addTab(link) {
  const proxiedUrl = await getUV(link);

  const tab = {
    title: "Loading...",
    url: search(link),
    proxiedUrl,
    view: tabFrame({ proxiedUrl }), // Pass dummy to satisfy onload
    item: null,
  };

  tab.view = tabFrame(tab); // Reassign with real tab ref
  tab.item = tabItem(tab);

  tabs.push(tab);
  tabList.appendChild(tab.item);
  tabView.appendChild(tab.view);
  focusTab(tab);
}

// Initial tab
addTab("uvsearch.rhw.one");

// Optional ?inject= support
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("inject")) {
  setTimeout(() => addTab(urlParams.get("inject")), 500);
}
