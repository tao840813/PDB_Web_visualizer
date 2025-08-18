const PDB_PATTERN = /\b([1-9][A-Za-z0-9]{3})\b/g;

const ALLOWED_HOSTS = [
  "rcsb.org",
  "nature.com",
  "sciencedirect.com",
  "pnas.org",
  "biorxiv.org",
  "researchsquare.com",
  "elifesciences.org",
  "ncbi.nlm.nih.gov",
  "journals.plos.org"
];

let currentFrame = null;

function isAllowedSite() {
  const host = window.location.hostname;
  return ALLOWED_HOSTS.some(pattern => host.includes(pattern));
}

function pageContainsPDB() {
  return PDB_PATTERN.test(document.body.innerText);
}

function createPreviewWindow(url) {
  if (currentFrame) {
    currentFrame.remove();
    currentFrame = null;
    return;
  }

  const frame = document.createElement('div');
  frame.id = 'pdb-preview-frame';
  frame.style.position = 'fixed';
  frame.style.bottom = '20px';
  frame.style.right = '20px';
  frame.style.width = '800px';
  frame.style.height = '800px';
  frame.style.background = 'white';
  frame.style.border = '2px solid black';
  frame.style.zIndex = '9999';
  frame.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
  frame.style.borderRadius = '10px';
  frame.style.display = 'flex';
  frame.style.flexDirection = 'column';
  frame.style.resize = 'both';
  frame.style.overflow = 'auto';

  const titleBar = document.createElement('div');
  titleBar.style.background = '#f0f0f0';
  titleBar.style.padding = '5px';
  titleBar.style.cursor = 'move';
  titleBar.style.display = 'flex';
  titleBar.style.justifyContent = 'space-between';
  titleBar.style.alignItems = 'center';

  const titleText = document.createElement('div');
  titleText.innerText = 'PDB Preview';
  
  /*const closeButton = document.createElement('button');
  closeButton.innerText = 'X';
  closeButton.style.background = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.fontSize = '16px';

  closeButton.addEventListener('click', () => {
    frame.remove();
    currentFrame = null;
  });*/

  titleBar.appendChild(titleText);
  //titleBar.appendChild(closeButton);

  const iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  iframe.style.flexGrow = '1';

  frame.appendChild(titleBar);
  frame.appendChild(iframe);
  document.body.appendChild(frame);

  currentFrame = frame;

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (currentFrame && !currentFrame.contains(e.target)) {
        currentFrame.remove();
        currentFrame = null;
        document.removeEventListener('click', handler);
      }
    });
  }, 100);

  let isDragging = false;
  let offsetX, offsetY;

  titleBar.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - frame.getBoundingClientRect().left;
    offsetY = e.clientY - frame.getBoundingClientRect().top;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      frame.style.left = `${e.clientX - offsetX}px`;
      frame.style.top = `${e.clientY - offsetY}px`;
      frame.style.bottom = 'auto';
      frame.style.right = 'auto';
    }
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = 'auto';
    }
  });
}
//滑鼠滑過去顯示解析度和論文標題
function fetchPDBInfo(pdbId, linkElement) {
  //用fetch從API抓資料
  fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`)
    .then(response => response.json())
    .then(data => {
      //data為json格式
      //console.log(data);
      const title = data.struct?.title || 'Unknown Title';
      const resolution = data.rcsb_entry_info?.resolution_combined?.[0]
        ? `${data.rcsb_entry_info.resolution_combined[0]} Å`
        : 'No resolution data';
      const classification = data.struct_keywords?.pdbx_keywords || 'Unknown';
      linkElement.title = `解析度: ${resolution}\n 分類 ${classification}\n 標題: ${title}`;
    })
    .catch(error => {
      console.error('PDB資料抓取失敗:', error);
      linkElement.title = '無法取得PDB資訊';
    });
    //console.log(data);
}

function linkifyPDB(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentNode && node.parentNode.nodeName === 'A') {
      return;
    }
    const replacedHTML = node.textContent.replace(PDB_PATTERN, (match) => {
      // 排除4個數字(年份)
      if (/^\d{4}$/.test(match)) {
        return match;
      }
      return `<a href="https://www.rcsb.org/structure/${match}" target="_blank" style="color:blue; text-decoration:underline;" data-pdb="${match}">${match}</a>`;
    });
    if (replacedHTML !== node.textContent) {
      const span = document.createElement('span');
      span.innerHTML = replacedHTML;
      node.replaceWith(span);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE && node.childNodes) {
    Array.from(node.childNodes).forEach(linkifyPDB);
  }
}

window.addEventListener('load', function() {
  setTimeout(() => {
    if (isAllowedSite() && pageContainsPDB()) {
      const candidates = [
        document.querySelector('main'),
        document.querySelector('article'),
        document.querySelector('#content'),
        document.body
      ];
      const target = candidates.find(el => el !== null);

      if (target) {
        linkifyPDB(target);
      }
      //管理click事件
      document.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.dataset.pdb) {
          if (e.button === 0){
              e.preventDefault();
              const pdbId = e.target.dataset.pdb;
              createPreviewWindow(`https://www.rcsb.org/structure/${pdbId}`);
            }
          //click事件只要開啟PDB頁面就好
          /*
          if (e.button === 1) {
            e.preventDefault();
            const pdbId = e.target.dataset.pdb;
            createPreviewWindow(`https://www.rcsb.org/3d-view/${pdbId}`);
          } else if (e.button === 0) {
            e.preventDefault();
            const pdbId = e.target.dataset.pdb;
            createPreviewWindow(`https://www.rcsb.org/structure/${pdbId}`);
          }
          */
        }
      });
      //管理hover操作
      document.addEventListener('mouseover', function (e) {
        //滑到<a>的時候抓取PDB的資訊 顯示成tooltip
        //e是事件物鍵, 抓取e滑到的A的物件資訊
        if (e.target.tagName === 'A' && e.target.dataset.pdb && !e.target.dataset.tooltipLoaded) {
          //e.target.tagName === 'A' herf物件
          //e.target.dataset.pdb 有個data-pdb屬性
          //!e.target.dataset.tooltipLoaded 還沒加入過tooltip
          const pdbId = e.target.dataset.pdb;
          fetchPDBInfo(pdbId, e.target); //抓屬性 & 設到 title 屬性上。
          e.target.dataset.tooltipLoaded = 'true';
          //標記這個 <a> 已經載入過 tooltip。之後就不會再重複發送 fetch。
        }
      });

      //管理background.js的msg
      chrome.runtime.onMessage.addListener((msg)=>{
        if(msg.type === "CREATE_IFRAME" && msg.pdb){
          createPreviewWindow(`https://www.rcsb.org/3d-view/${msg.pdb}`);
        }
      });
    }
  }, 1000); // 延遲1秒，確保頁面內容載入
});
