chrome.runtime.onInstalled.addListener(() => {
  /*
  chrome.contextMenus.create({
    id: "helloMenu",
    title: "打招呼",
    contexts: ["link"]
  });
  */
  chrome.contextMenus.create({
    id: "open3DTab",
    title: "新分頁開啟 3D viewer",
    contexts: ["link"]
  });
  chrome.contextMenus.create({
    id: "open3DFrame",
    title: "iframe開啟 3D viewer",
    contexts: ["link"]
  })
  chrome.contextMenus.create({
    id: "openPDBFrame",
    title: "iframe開啟 PDB 主頁(防止PDB不能直接點)",
    contexts: ["link"]
  })
});

// 處理點擊
chrome.contextMenus.onClicked.addListener((info, tab) => {
  /*
  if (info.menuItemId === "helloMenu") {
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (linkUrl) => {
        alert("你剛剛右鍵點的連結是：\n" + linkUrl);
      },
      args: [info.linkUrl]
    });
  }
  */
  if (info.menuItemId === "open3DTab") {
    //console.log("原始連結:", info.linkUrl);
    const pdb = extractPDBId(info.linkUrl);
    //console.log("抓到的 PDB ID:", id);
    if (pdb) {
      chrome.tabs.create({ url: `https://www.rcsb.org/3d-view/${pdb}` });
    }
  }

  if (info.menuItemId === "open3DFrame") {
    //console.log("原始連結:", info.linkUrl);
    const pdb = extractPDBId(info.linkUrl);
    //console.log("抓到的 PDB ID:", pdb);
    chrome.tabs.sendMessage(tab.id,{
      type : "CREATE_IFRAME",
      pdb : pdb
    })
  }

  if (info.menuItemId === "openPDBFrame") {
    //console.log("原始連結:", info.linkUrl);
    const pdb = extractPDBId(info.linkUrl);
    //console.log("抓到的 PDB ID:", pdb);
    chrome.tabs.sendMessage(tab.id,{
      type : "CREATE_PDBFRAME",
      pdb : pdb
    })
  }
});

function extractPDBId(url) {
  let m = url.match(/(?:structure|3d-view)\/([0-9a-z]{4})(?:[/?#]|$)/i);
  if (m) return m[1].toUpperCase();
  return null;
}
