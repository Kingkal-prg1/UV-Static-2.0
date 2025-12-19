// active/scripts/tabs.mjs
// UV-Static tab manager – final production version (Dec 2025)
// Direct SW registration to uv.sw.js (your actual file), no external dependencies

import { getFavicon, rAlert } from "./utils.mjs";
import { getUV, search } from "./prxy.mjs";

const { span, iframe, button, img } = van.tags;
const { tags: { "ion-icon": ionIcon } } = van;

// Register the actual Ultraviolet service worker (uv.sw.js exists in your repo)
async function registerUVServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  try {
    const reg = await navigator.serviceWorker.register("/UV-Static-2.0/active/uv/uv.sw.js", {
      scope: "/UV-Static-2.0/active/uv/"
    });
    console.log("UV Service Worker registered ✅", reg);
    rAlert("Service Worker ✓");
  } catch (err) {
    console.error("SW registration failed:", err);
    rAlert(`SW error:<br>${err.message}`);
  }
}

// Register immediately on load
registerUVServiceWorker();

// Your original tab logic (unchanged + minor polish)
var tabs = [];
var selectedTab = null;

const sideBar = document.querySelector("header");
const pageBack = document.getElementById("page-back");
const pageForward = document.getElementById("page-forward");
const pageRefresh = document.getElementById("page-refresh");
const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("url-input");
const newTabButton = document.getElementById("new-tab");
const tabList = document.getElementById("tab-list");
const tabView = document.getElementById("tab-view");

window.onmousemove = (e) => {
  sideBar.classList.toggle("hovered", e.clientX < 50);
};

pageBack.onclick = () => selectedTab?.view.contentWindow.history.back();
pageForward.onclick = () => selectedTab?.view.contentWindow.history.forward();
pageRefresh.onclick = () => selectedTab?.view.contentWindow.location.reload();

newTabButton.onclick = () => addTab("uvsearch.rhw.one");

const devtoolsOption = document.getElementById("devtools-option");
const abcOption = document.getElementById("abc-option");
const gitOption = document.getElementById("git-option");

devtoolsOption.onclick = () => {
  try {
    selectedTab.view.contentWindow.eval(eruda);
    rAlert("Eruda injected ✓");
  } catch { rAlert("Inject failed"); }
};

abcOption.onclick = () => {
  abCloak(selectedTab.view.src);
  rAlert("Opened in about:blank");
};

gitOption.onclick = () => window.open("https://github.com/rhenryw/UV-Static-2.0", "_blank");

urlForm.onsubmit = async (e) => {
  e.preventDefault();
  if (selectedTab) selectedTab.view.src = await getUV(urlInput.value);
};

let eruda = `fetch("https://cdn.jsdelivr.net/npm/eruda")
  .then(r => r.text())
  .then(d => {
    eval(d);
    if (!window.erudaLoaded) {
      eruda.init({ defaults: { displaySize: 45, theme: "AMOLED" } });
      window.erudaLoaded = true;
    }
  });`;

function abCloak(url) {
  const win = window.open();
  const frame = win.document.createElement("iframe");
  Object.assign(frame.style, { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", border: "none" });
  frame.src = url;
  win.document.body.appendChild(frame);
}

const tabItem = (tab) => button(
  { onclick: (e) => {!e.target.closest(".close") && focusTab(tab)}, class: "tab-item hover-focus1" },
  img({ src: getFavicon(tab.url) }),
  span(tab.title),
  button({ onclick: () => closeTab(tab), class: "close" }, ionIcon({ name: "close", class: "close-icon" }))
);

const tabFrame = (tab) => iframe({
  class: "tab-frame",
  src: tab.proxiedUrl,
  sandbox: "allow-scripts allow-forms allow-same-origin allow-modals allow-popups",
  onload: () => updateTabInfo(tab)
});

function updateTabInfo(tab) {
  try {
    const path = tab.view.contentWindow.location.pathname.slice(1);
    const encoded = path.split("/").pop();
    const decoded = decodeURIComponent(__uv$config.decodeUrl(encoded));
    tab.url = decoded;
    tab.title = tab.view.contentWindow.document.title || "New Tab";

    const item = tabList.children[tabs.indexOf(tab)];
    item.children[0].src = getFavicon(decoded);
    item.children[1].textContent = tab.title;

    if (tab === selectedTab) urlInput.value = decoded;

    localStorage.setItem("tabs", JSON.stringify(tabs.map(t => t.url)));
  } catch (e) {}
}

function closeTab(tab) {
  const i = tabs.indexOf(tab);
  tabs.splice(i, 1);
  tabView.removeChild(tab.view);
  tabList.removeChild(tab.item);

  if (tab === selectedTab) {
    selectedTab = tabs[i - 1] || tabs[0] || null;
    if (selectedTab) focusTab(selectedTab);
    else setTimeout(() => addTab("uvsearch.rhw.one"), 100);
  }
}

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
  const proxied = await getUV(link);
  const tab = {
    title: "Loading...",
    url: search(link),
    proxiedUrl: proxied,
    view: null,
    item: null
  };

  tab.view = tabFrame(tab);
  tab.item = tabItem(tab);

  tabs.push(tab);
  tabList.appendChild(tab.item);
  tabView.appendChild(tab.view);
  focusTab(tab);
}

// Start
addTab("uvsearch.rhw.one");

const params = new URLSearchParams(location.search);
if (params.has("inject")) {
  setTimeout(() => addTab(params.get("inject")), 500);
}
