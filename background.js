chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "open-pdb-3d",
      title: "打開3D結構預覽",
      contexts: ["link"]
    });
  });
  
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "open-pdb-3d" && info.linkUrl) {
      const match = info.linkUrl.match(/structure\/([1-9][A-Za-z0-9]{3})/);
      if (match) {
        const pdbId = match[1];
        chrome.tabs.sendMessage(tab.id, { action: "openPDB3D", pdbId: pdbId });
      }
    }
  });
  