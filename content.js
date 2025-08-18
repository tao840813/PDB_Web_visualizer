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

function fetchPDBInfo(pdbId, linkElement) {
  fetch(`https://data.rcsb.org/rest/v1/core/entry/${pdbId}`)
    .then(response => response.json())
    .then(data => {
      const title = data.struct?.title || 'Unknown Title';
      const resolution = data.rcsb_entry_info?.resolution_combined?.[0]
        ? `${data.rcsb_entry_info.resolution_combined[0]} Å`
        : 'No resolution data';
      linkElement.title = `解析度: ${resolution}\n標題: ${title}`;
    })
    .catch(error => {
      console.error('PDB資料抓取失敗:', error);
      linkElement.title = '無法取得PDB資訊';
    });
}

function linkifyPDB(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.parentNode && node.parentNode.nodeName === 'A') {
      return;
    }
    const replacedHTML = node.textContent.replace(PDB_PATTERN, (match) => {
      // 加這一段排除4個數字
      if (/^\d{4}$/.test(match)) {
        return match; // 是年份（4個數字），直接跳過，不改成連結
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

      document.addEventListener('click', function (e) {
        if (e.target.tagName === 'A' && e.target.dataset.pdb) {
          if (e.button === 1) {
            e.preventDefault();
            const pdbId = e.target.dataset.pdb;
            createPreviewWindow(`https://www.rcsb.org/3d-view/${pdbId}`);
          } else if (e.button === 0) {
            e.preventDefault();
            const pdbId = e.target.dataset.pdb;
            createPreviewWindow(`https://www.rcsb.org/structure/${pdbId}`);
          }
        }
      });

      document.addEventListener('mouseover', function (e) {
        if (e.target.tagName === 'A' && e.target.dataset.pdb && !e.target.dataset.tooltipLoaded) {
          const pdbId = e.target.dataset.pdb;
          fetchPDBInfo(pdbId, e.target);
          e.target.dataset.tooltipLoaded = 'true';
        }
      });
    }
  }, 1000); // 延遲1秒，確保頁面內容載入
});
