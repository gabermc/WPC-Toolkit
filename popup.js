/* ═══════════════════════════════════════════════════════
   WPC Toolkit — popup.js
   Unified logic for all 5 modules:
     1. Report   → Google Sheets via Apps Script
     2. Checklist→ XLSX download from models/
     3. QuickText→ clipboard templates
     4. CountryScan → page language/country analysis
     5. ShopApp  → CMS helper scripts
   ═════════════════════════════════════════════════════ */

// ── Tab navigation ──────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// ════════════════════════════════════════════════════════
// MODULE 1 — REPORT
// ════════════════════════════════════════════════════════

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxjlwng2BoBO596y-BrhgVhHyrdq51WVv8rh0sVv3Rf71-LAT8y2omQYmqKQ7gGEEWD/exec';

(() => {
  const qaInput = document.getElementById('r-qa');

  chrome.storage.local.get(['qaName'], res => {
    if (res.qaName) qaInput.value = res.qaName;
  });

  document.getElementById('r-save').addEventListener('click', () => {
    const name = qaInput.value.trim();
    if (!name) return alert('Please enter a username.');
    chrome.storage.local.set({ qaName: name }, () => {
      const btn = document.getElementById('r-save');
      btn.style.color = 'var(--green)';
      setTimeout(() => (btn.style.color = ''), 1000);
    });
  });

  document.getElementById('r-clear').addEventListener('click', () => {
    qaInput.value = '';
    chrome.storage.local.remove('qaName');
  });

  document.getElementById('r-cancel').addEventListener('click', () => window.close());

  document.getElementById('r-report').addEventListener('click', async () => {
    const category = document.getElementById('r-category').value;
    const sub      = document.getElementById('r-sub').value;
    const status   = document.getElementById('r-status').value;
    const qa       = qaInput.value.trim();

    if (!category || !sub || !status || !qa) {
      return alert('Please fill all mandatory fields (*)');
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const rawUrl = tab.url;

    if (!rawUrl.startsWith('https://jira.secext.samsung.net/browse/WSC')) {
      return alert('Invalid URL. This extension can only be used on WSC Jira tickets.');
    }

    const ticketUrl = rawUrl.split(/[?#]/)[0];
    const formattedDate = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    const data = {
      ticketUrl, category, sub, status,
      publisherError:  document.getElementById('r-publisherError').value,
      pendingCustomer: document.getElementById('r-pendingCustomer').value,
      reason:          document.getElementById('r-reason').value,
      date:            formattedDate,
      qa,
      comments:        document.getElementById('r-comments').value,
    };

    const btn = document.getElementById('r-report');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      alert('Report sent successfully!');
      window.close();
    } catch (err) {
      console.error(err);
      alert('Error sending report. Check console.');
      btn.disabled = false;
      btn.textContent = 'Send Report';
    }
  });
})();

// ════════════════════════════════════════════════════════
// MODULE 2 — CHECKLIST
// ════════════════════════════════════════════════════════

(() => {
  let fileBlob = null;
  let fileName = null;

  const usernameInput = document.getElementById('c-username');

  chrome.storage.local.get(['checklistUsername'], res => {
    if (res.checklistUsername) usernameInput.value = res.checklistUsername;
  });

  document.getElementById('c-save').addEventListener('click', () => {
    const v = usernameInput.value.trim();
    if (!v) return alert('Enter a username');
    chrome.storage.local.set({ checklistUsername: v });
    const btn = document.getElementById('c-save');
    btn.style.color = 'var(--green)';
    setTimeout(() => (btn.style.color = ''), 1000);
  });

  document.getElementById('c-clear').addEventListener('click', () => {
    usernameInput.value = '';
    chrome.storage.local.remove('checklistUsername');
  });

  // Single-select checkboxes
  document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(o => {
        if (o !== cb) o.checked = false;
      });
    });
  });

  function extractTicket(url) {
    const match = url ? url.match(/WSC\d{8}-\d{5}/) : null;
    return match ? match[0] : null;
  }

  function getDateYYMMDD() {
    const d = new Date();
    return String(d.getFullYear()).slice(2) +
      String(d.getMonth() + 1).padStart(2, '0') +
      String(d.getDate()).padStart(2, '0');
  }

  function sanitizeFilename(filename) {
    return filename
      .replace(/[\\/:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')
      .substring(0, 200);
  }

  // Criar checklist
  document.getElementById('c-generate').addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    if (!username) return alert('Enter a username');

    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const jiraUrl = tabs[0].url;
      const ticket  = extractTicket(jiraUrl);
      if (!ticket) return alert('Could not extract ticket from URL.\nMake sure you are on a WSC Jira ticket.');

      const selected = [...document.querySelectorAll('#tab-checklist input[type="checkbox"]')].find(cb => cb.checked);
      if (!selected) return alert('Select a template');

      const modelName = selected.dataset.model;
      const modelPath = `models/QA_Prod_${modelName}_userName_DATE.xlsx`;
      fileName = `QA_Prod_${ticket}_${username}_${getDateYYMMDD()}.xlsx`;

      try {
        const response = await fetch(chrome.runtime.getURL(modelPath));
        if (!response.ok) throw new Error('Model not found');
        fileBlob = await response.blob();
        document.getElementById('c-download').style.display = 'flex';
      } catch (err) {
        alert('Error loading template');
        console.error(err);
      }
    });
  });

  // Download — método original: blob URL + <a> click, sem fechar o popup na hora
  document.getElementById('c-download').addEventListener('click', async () => {
    if (!fileBlob || !fileName) return alert('Error: file not prepared');

    const btn = document.getElementById('c-download');
    const originalText = btn.textContent;
    btn.textContent = 'Downloading…';
    btn.disabled = true;

    try {
      const sanitizedFileName = sanitizeFilename(fileName);
      const blobUrl = URL.createObjectURL(fileBlob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = sanitizedFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Aguarda o browser iniciar o download antes de qualquer coisa
      setTimeout(() => {
        btn.textContent = 'Downloaded ✓';
        btn.style.background = 'var(--green)';
        btn.style.color = '#0a0a0f';

        document.querySelectorAll('#tab-checklist input[type="checkbox"]').forEach(cb => cb.checked = false);

        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          fileBlob = null;
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
          btn.style.display = 'none';
          btn.disabled = false;
        }, 2000);
      }, 500);

    } catch (err) {
      alert('Error: ' + err.message);
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
})();

// ════════════════════════════════════════════════════════
// MODULE 3 — QUICKTEXT
// ════════════════════════════════════════════════════════

(() => {
  const TEMPLATES = {
    approved: [
      { id: 'approved', label: 'Approved', template: '#0 - QA Checklist: passed\n#1 - Athena report: passed\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
      { id: 'athena_na', label: 'Athena N/A', template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
      { id: 'eol', label: 'EOL', template: '#0 - QA Checklist: passed\n#1 - Athena report: EOL/Redirection\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA approved, please take a look:\n\n#Comments:\n#4 - Screenshot:\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    ],
    rejected: [
      { id: 'rejected', label: 'Rejected', template: '#0 - QA Checklist: rejected\n#1 - Athena report: passed\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA rejected, please fix these issues:\n\n#Comments:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
      { id: 'athena_fail', label: 'Athena Fail', template: '#0 - QA Checklist: rejected\n#1 - Athena report: rejected\n#2 - URL issue: passed\n#3 - Description: passed\n\nDear @\nQA rejected, please fix these issues:\n\n#Comments:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    ],
    shopapp: [
      { id: 'published', label: 'Published', template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA approved, please proceed. Updates have been published\n#4 - Screenshot:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
      { id: 'non_published', label: 'Non Published', template: '#0 - QA Checklist: passed\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA approved, please proceed. No updates have been published.\n#4 - Screenshot:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
      { id: 'shop_rejected', label: 'Rejected', template: '#0 - QA Checklist: rejected\n#1 - Athena report: Non-AEM Authoring\n#2 - Description: passed\n#Comments:\n\nDear @\nQA rejected, please fix these issues:\n\nThanks in advance,\n{user_name}\nWPC QAer | Web Production Center' },
    ],
  };

  const SECTION_LABELS = { approved: 'Approved', rejected: 'Rejected', shopapp: 'ShopApp' };

  const usernameInput  = document.getElementById('q-username');
  const container      = document.getElementById('q-templates');

  chrome.storage.sync.get('quicktextUsername', data => {
    if (data.quicktextUsername) usernameInput.value = data.quicktextUsername;
  });

  document.getElementById('q-save').addEventListener('click', () => {
    chrome.storage.sync.set({ quicktextUsername: usernameInput.value });
    const btn = document.getElementById('q-save');
    btn.style.color = 'var(--green)';
    setTimeout(() => (btn.style.color = ''), 1000);
  });

  document.getElementById('q-clear').addEventListener('click', () => {
    usernameInput.value = '';
    chrome.storage.sync.remove('quicktextUsername');
  });

  // Render templates
  Object.entries(TEMPLATES).forEach(([section, items]) => {
    const titleEl = document.createElement('div');
    titleEl.className = 'qt-section-title';
    titleEl.textContent = SECTION_LABELS[section] || section;
    container.appendChild(titleEl);

    items.forEach(item => {
      const isRejected = item.id.includes('rejected') || item.id.includes('fail');
      const btn = document.createElement('div');
      btn.className = `qt-btn ${section}${isRejected ? ' rejected' : ''}`;
      btn.innerHTML = `
        ${item.label}
        <span class="qt-copy-icon">
          <svg viewBox="0 0 24 24" width="13" height="13">
            <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v16h13c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 18H8V7h11v16z"/>
          </svg>
        </span>
        <span class="qt-check">✔</span>
      `;
      btn.addEventListener('click', () => copyTemplate(btn, item.template));
      container.appendChild(btn);
    });
  });

  function copyTemplate(btn, template) {
    chrome.storage.sync.get('quicktextUsername', data => {
      const text = template.replace(/{user_name}/g, data.quicktextUsername || 'QAer');
      navigator.clipboard.writeText(text);
      const check = btn.querySelector('.qt-check');
      const icon  = btn.querySelector('.qt-copy-icon');
      check.style.display = 'block';
      icon.style.display  = 'none';
      setTimeout(() => window.close(), 1000);
    });
  }
})();

// ════════════════════════════════════════════════════════
// MODULE 4 — COUNTRYSCAN
// ════════════════════════════════════════════════════════

(() => {
  const COUNTRY_MAP = { co:'Colombia', cl:'Chile', latin:'Panamá', latin_en:'Guatemala', py:'Paraguay', br:'Brasil', uy:'Uruguay', pe:'Peru', ar:'Argentina', mx:'México' };
  const COUNTRY_CODES = ['latin_en','latin','co','cl','py','br','uy','pe','ar','mx'];
  const LANG_MAP = {
    'pt':'Português','pt-br':'Português (BR)','en':'English','en-us':'English (US)',
    'es':'Español','fr':'Français','de':'Deutsch','it':'Italiano','nl':'Nederlands',
    'pl':'Polski','ru':'Русский','uk':'Українська','ar':'العربية','zh':'中文',
    'ja':'日本語','ko':'한국어','hi':'हिन्दी','th':'ภาษาไทย','tr':'Türkçe',
    'sv':'Svenska','da':'Dansk','fi':'Suomi','el':'Ελληνικά','he':'עברית',
  };
  const SCRIPT_COLORS = { latin:'#7B6EF6',cyrillic:'#FF5E5E',arabic:'#FFB547',cjk:'#3FFFA2',hangul:'#5EC4FF',hebrew:'#FF8C69',devanagari:'#FF6B9D',thai:'#A8E6CF',greek:'#DDA0DD' };
  const SCRIPT_LABELS = { latin:'Latino',cyrillic:'Cyrillic',arabic:'Arabic',cjk:'CJK',hangul:'Hangul',hebrew:'Hebrew',devanagari:'Devanagari',thai:'Thai',greek:'Greek' };

  let lastTabId = null;
  let imgHighlightsActive = false;
  let ctaHighlightsActive = false;

  function detectCountryFromUrl(url) {
    try {
      const u = new URL(url);
      for (const code of COUNTRY_CODES) {
        if (new RegExp('/' + code + '(?:/|$)', 'i').test(u.pathname)) return code;
      }
      const sub = u.hostname.match(/^([a-z]{2,})\./i);
      if (sub && COUNTRY_MAP[sub[1].toLowerCase()]) return sub[1].toLowerCase();
    } catch(_) {}
    return null;
  }

  function countryLabel(code) {
    if (!code) return null;
    return COUNTRY_MAP[code.toLowerCase()] || code.toUpperCase();
  }

  function resolveLanguage(data, selectedLang) {
    if (selectedLang && selectedLang !== 'auto') {
      return { name: LANG_MAP[selectedLang] || selectedLang.toUpperCase(), code: selectedLang, confidence: 95, sources: [{ source: 'selected', confidence: 95 }] };
    }
    const candidates = [];
    const declared = [data.htmlLang, data.metaLang, data.ogLocale].filter(Boolean).map(l => l.toLowerCase().replace('_','-').trim());
    for (const lang of declared) {
      const base = lang.split('-')[0];
      if (LANG_MAP[lang] || LANG_MAP[base]) candidates.push({ lang, source: 'html/meta', confidence: 88 });
    }
    const scriptMap = { cyrillic:'ru', arabic:'ar', hebrew:'he', devanagari:'hi', thai:'th', greek:'el', cjk:'zh', hangul:'ko' };
    if (scriptMap[data.detectedScript] && !candidates.some(c => c.lang.startsWith(scriptMap[data.detectedScript]))) {
      candidates.push({ lang: scriptMap[data.detectedScript], source: 'script', confidence: 72 });
    }
    if (!candidates.length) candidates.push({ lang:'en', source:'default', confidence: 40 });
    const best = candidates[0];
    const shortLang = best.lang.split('-')[0];
    const name = LANG_MAP[best.lang] || LANG_MAP[shortLang] || best.lang.toUpperCase();
    let conf = best.confidence;
    if (data.htmlLang && data.detectedScript) conf = Math.min(conf + 5, 97);
    return { name, code: shortLang, confidence: conf, sources: candidates };
  }

  function showCsState(state) {
    document.getElementById('cs-loadingState').style.display = state === 'loading' ? 'block' : 'none';
    document.getElementById('cs-errorState').style.display   = state === 'error'   ? 'block' : 'none';
    const res = document.getElementById('cs-resultState');
    state === 'result' ? res.classList.add('show') : res.classList.remove('show');
  }

  function renderPageInfo(data) {
    document.getElementById('cs-pageTitle').textContent = data.pageTitle || '(no title)';
    const rowDesc = document.getElementById('cs-rowDesc');
    if (data.metaDescription) { rowDesc.style.display = 'flex'; document.getElementById('cs-pageDesc').textContent = data.metaDescription; }
    else { rowDesc.style.display = 'none'; }
    const urlEl = document.getElementById('cs-pageUrl');
    urlEl.innerHTML = '';
    if (data.pageUrl) { const a = document.createElement('a'); a.href = data.pageUrl; a.textContent = data.pageUrl; a.target = '_blank'; a.rel = 'noopener'; urlEl.appendChild(a); }
    else { urlEl.textContent = '—'; }
    const rowCan = document.getElementById('cs-rowCan');
    const canEl  = document.getElementById('cs-pageCanonical');
    if (data.canonical) { rowCan.style.display = 'flex'; canEl.innerHTML = ''; const a = document.createElement('a'); a.href = data.canonical; a.textContent = data.canonical; a.target = '_blank'; a.rel = 'noopener'; canEl.appendChild(a); }
    else { rowCan.style.display = 'none'; }
    const countryEl = document.getElementById('cs-pageCountry');
    const code = detectCountryFromUrl(data.pageUrl);
    if (code) { countryEl.innerHTML = `<span class="country-pill">/${code}/ — ${countryLabel(code)}</span>`; }
    else { countryEl.textContent = 'Not detected'; countryEl.style.color = 'var(--muted)'; }
  }

  function renderScripts(stats) {
    const container = document.getElementById('cs-scriptBars');
    container.innerHTML = '';
    const entries = Object.entries(stats).filter(([,v]) => v > 0).sort((a,b) => b[1]-a[1]);
    if (!entries.length) { container.innerHTML = '<p style="font-size:11px;color:var(--muted)">No data.</p>'; return; }
    for (const [key, pct] of entries) {
      const row = document.createElement('div');
      row.className = 'cs-script-row';
      row.innerHTML = `<span class="cs-script-name">${SCRIPT_LABELS[key]||key}</span><div class="cs-script-bar-wrap"><div class="cs-script-bar" data-pct="${pct}" style="background:${SCRIPT_COLORS[key]||'#7B6EF6'}"></div></div><span class="cs-script-pct">${pct}%</span>`;
      container.appendChild(row);
    }
    requestAnimationFrame(() => {
      document.querySelectorAll('.cs-script-bar').forEach(b => { b.style.width = b.dataset.pct + '%'; });
    });
  }

  // ── Page scan function (injected) ──────────────────────
  function pageScanFn() {
    function pct(n,t){ return Math.round((n/t)*100); }
    function analyzeChars(text){ const s=text.slice(0,2000); let la=0,cy=0,ar=0,cj=0,ha=0,he=0,de=0,th=0,gr=0,ot=0; for(const ch of s){ const cp=ch.codePointAt(0); if((cp>=0x41&&cp<=0x7A)||(cp>=0xC0&&cp<=0x24F))la++; else if(cp>=0x400&&cp<=0x4FF)cy++; else if(cp>=0x600&&cp<=0x6FF)ar++; else if((cp>=0x4E00&&cp<=0x9FFF)||(cp>=0x3040&&cp<=0x30FF))cj++; else if(cp>=0xAC00&&cp<=0xD7AF)ha++; else if(cp>=0x590&&cp<=0x5FF)he++; else if(cp>=0x900&&cp<=0x97F)de++; else if(cp>=0xE00&&cp<=0xE7F)th++; else if(cp>=0x370&&cp<=0x3FF)gr++; else if(ch.trim().length>0)ot++; } const t=la+cy+ar+cj+ha+he+de+th+gr+ot||1; return{latin:pct(la,t),cyrillic:pct(cy,t),arabic:pct(ar,t),cjk:pct(cj,t),hangul:pct(ha,t),hebrew:pct(he,t),devanagari:pct(de,t),thai:pct(th,t),greek:pct(gr,t)}; }
    function extractText(){ const skip=new Set(['script','style','noscript','svg','head','nav','footer','iframe']); const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT,{acceptNode(node){let el=node.parentElement;while(el){if(skip.has(el.tagName.toLowerCase()))return NodeFilter.FILTER_REJECT;el=el.parentElement;}return node.textContent.trim().length>3?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_SKIP;}}); let text='',node; while((node=walker.nextNode())&&text.length<5000)text+=' '+node.textContent.trim(); return text.trim(); }
    const bodyText=extractText(); const charStats=analyzeChars(bodyText); const sorted=Object.entries(charStats).sort((a,b)=>b[1]-a[1]); const detectedScript=sorted[0][1]>5?sorted[0][0]:'latin';
    return{ htmlLang:document.documentElement.lang||null, metaLang:document.querySelector('meta[http-equiv="content-language"]')?.content||null, ogLocale:document.querySelector('meta[property="og:locale"]')?.content||null, detectedScript, charStats, wordCount:bodyText.trim().split(/\s+/).filter(w=>w.length>0).length, charCount:bodyText.replace(/\s/g,'').length, pageTitle:document.title, pageUrl:window.location.href, metaDescription:document.querySelector('meta[name="description"]')?.content||document.querySelector('meta[property="og:description"]')?.content||null, canonical:document.querySelector('link[rel="canonical"]')?.href||null };
  }

  async function scan() {
    const btn = document.getElementById('cs-scanBtn');
    btn.disabled = true; btn.textContent = '…';
    showCsState('loading');
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('Tab not accessible.');
      lastTabId = tab.id;
      const results = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: pageScanFn });
      const data = results?.[0]?.result;
      if (!data) throw new Error('Could not scan this page.');
      const lang = resolveLanguage(data, document.getElementById('cs-langSelect').value);
      renderPageInfo(data);
      document.getElementById('cs-langName').textContent = lang.name;
      document.getElementById('cs-langCode').textContent = lang.code;
      const confBar = document.getElementById('cs-confBar');
      confBar.style.width = '0%';
      document.getElementById('cs-confPct').textContent = lang.confidence + '%';
      setTimeout(() => { confBar.style.width = lang.confidence + '%'; }, 80);
      const sourcesRow = document.getElementById('cs-sourcesRow');
      sourcesRow.innerHTML = '';
      const seen = new Set();
      for (const s of lang.sources) {
        if (seen.has(s.source)) continue; seen.add(s.source);
        const tag = document.createElement('span');
        tag.className = 'source-tag ' + (s.confidence >= 80 ? 'match' : 'neutral');
        tag.textContent = s.source;
        sourcesRow.appendChild(tag);
      }
      document.getElementById('cs-wordCount').textContent = (data.wordCount || 0).toLocaleString();
      document.getElementById('cs-charCount').textContent = (data.charCount || 0).toLocaleString();
      renderScripts(data.charStats);
      showCsState('result');
    } catch(err) {
      let msg = err.message || 'Unknown error.';
      if (msg.includes('Cannot access') || msg.includes('chrome://')) msg = 'This page cannot be accessed.\nTry on a normal website.';
      document.getElementById('cs-errorMsg').textContent = msg;
      showCsState('error');
    } finally {
      btn.disabled = false; btn.textContent = 'Scan';
    }
  }

  // Image audit injected functions
  function scanImageAssetsFn() {
    const CODES=['latin_en','latin','co','cl','py','br','uy','pe','ar','mx'];
    function getRealSrc(img){return img.currentSrc||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('data-lazy-src')||img.src||'';}
    function extractCountryFromPath(src){let p=src;try{p=new URL(src).pathname;}catch(_){}const segs=p.split('/');for(const seg of segs){const l=seg.toLowerCase();if(CODES.includes(l))return l;}return null;}
    const imgs=Array.from(document.querySelectorAll('img'));const results=[];
    for(const img of imgs){const src=getRealSrc(img);if(!src||src.includes('blank.gif')||src.startsWith('data:')||!src.trim())continue;const imgCountry=extractCountryFromPath(src);const short=src.length>60?'…'+src.slice(-57):src;results.push({src,short,imgCountry,hasCountry:!!imgCountry});}
    return{images:results,pageUrl:window.location.href,total:results.length};
  }
  function highlightImgsFn(srcs){document.querySelectorAll('[data-cs-img]').forEach(el=>{el.style.outline='';el.style.animation='';el.removeAttribute('data-cs-img');if(el._csClick){el.removeEventListener('click',el._csClick);delete el._csClick;}});document.querySelectorAll('[data-cs-badge]').forEach(el=>el.remove());document.querySelectorAll('[data-cs-pos]').forEach(el=>{el.style.position='';el.removeAttribute('data-cs-pos');});document.getElementById('cs-img-style')?.remove();const st=document.createElement('style');st.id='cs-img-style';st.textContent=`@keyframes cs-pulse{0%{box-shadow:0 0 0 3px rgba(255,94,94,.9)}50%{box-shadow:0 0 0 8px rgba(255,94,94,.2)}100%{box-shadow:0 0 0 3px rgba(255,94,94,.9)}}[data-cs-img]{outline:4px solid #FF5E5E!important;animation:cs-pulse 1.6s ease-in-out infinite!important;cursor:pointer!important;}[data-cs-badge]{position:absolute!important;top:6px!important;left:6px!important;background:#FF5E5E!important;color:#fff!important;font:700 10px/1 monospace!important;padding:3px 6px!important;border-radius:4px!important;z-index:99999!important;pointer-events:none!important;}`;document.head.appendChild(st);function getRealSrc(img){return img.currentSrc||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('data-lazy-src')||img.src||'';}document.querySelectorAll('img').forEach(img=>{const src=getRealSrc(img);if(!srcs.includes(src))return;img.setAttribute('data-cs-img','1');const par=img.parentElement;if(par&&getComputedStyle(par).position==='static'){par.style.position='relative';par.setAttribute('data-cs-pos','1');}const badge=document.createElement('span');badge.setAttribute('data-cs-badge','1');badge.textContent='⚠ Wrong country';(par||img).appendChild(badge);const h=(e)=>{e.preventDefault();e.stopPropagation();window.open(src,'_blank','noopener');};img._csClick=h;img.addEventListener('click',h);});}
  function clearImgsFn(){document.querySelectorAll('[data-cs-img]').forEach(el=>{el.style.outline='';el.style.animation='';el.removeAttribute('data-cs-img');if(el._csClick){el.removeEventListener('click',el._csClick);delete el._csClick;}});document.querySelectorAll('[data-cs-badge]').forEach(el=>el.remove());document.querySelectorAll('[data-cs-pos]').forEach(el=>{el.style.position='';el.removeAttribute('data-cs-pos');});document.getElementById('cs-img-style')?.remove();}
  function scrollToImgFn(src){function getRealSrc(img){return img.currentSrc||img.getAttribute('data-src')||img.getAttribute('data-original')||img.getAttribute('data-lazy-src')||img.src||'';}const img=Array.from(document.querySelectorAll('img')).find(i=>getRealSrc(i)===src);if(img)img.scrollIntoView({behavior:'smooth',block:'center'});}

  // CTA audit injected functions
  function scanCtasFn(){const CODES=['latin_en','latin','co','cl','py','br','uy','pe','ar','mx'];function getCountry(url){try{const u=new URL(url);for(const code of CODES){if(new RegExp('/'+code+'(?:/|$)','i').test(u.pathname))return code;}const sub=u.hostname.match(/^([a-z]{2,})\./i);if(sub&&CODES.includes(sub[1].toLowerCase()))return sub[1].toLowerCase();}catch(_){}return null;}const pageUrl=window.location.href;const pageCountry=getCountry(pageUrl);const links=Array.from(document.querySelectorAll('a[href]'));const results=[];for(const a of links){const href=a.getAttribute('href')||'';if(!href||href.startsWith('#')||href.startsWith('javascript:')||href.startsWith('mailto:')||href.startsWith('tel:'))continue;const text=(a.textContent||'').trim().replace(/\s+/g,' ');const label=text||a.getAttribute('aria-label')||'';if(!label||label.length<2||label.length>100)continue;let full=href;try{full=new URL(href,pageUrl).href;}catch(_){}let isExternal=false;try{isExternal=new URL(full).hostname!==new URL(pageUrl).hostname;}catch(_){}const linkCountry=getCountry(full);const short=full.length>60?'…'+full.slice(-57):full;results.push({label,href:full,short,linkCountry,isExternal,wrong:!isExternal&&pageCountry&&linkCountry&&linkCountry!==pageCountry});}return{links:results,pageCountry,total:results.length};}
  function highlightCtasFn(hrefs){document.querySelectorAll('[data-cs-cta]').forEach(el=>{el.style.outline='';el.removeAttribute('data-cs-cta');});document.getElementById('cs-cta-style')?.remove();const st=document.createElement('style');st.id='cs-cta-style';st.textContent=`@keyframes cs-cta-pulse{0%{box-shadow:0 0 0 2px rgba(255,94,94,.9)}50%{box-shadow:0 0 0 5px rgba(255,94,94,.2)}100%{box-shadow:0 0 0 2px rgba(255,94,94,.9)}}[data-cs-cta]{outline:3px solid #FF5E5E!important;animation:cs-cta-pulse 1.8s ease-in-out infinite!important;}`;document.head.appendChild(st);document.querySelectorAll('a[href]').forEach(a=>{let full=a.getAttribute('href')||'';try{full=new URL(full,window.location.href).href;}catch(_){}if(hrefs.includes(full))a.setAttribute('data-cs-cta','1');});}
  function clearCtasFn(){document.querySelectorAll('[data-cs-cta]').forEach(el=>{el.style.outline='';el.removeAttribute('data-cs-cta');});document.getElementById('cs-cta-style')?.remove();}
  function scrollToCtaFn(href){const a=Array.from(document.querySelectorAll('a[href]')).find(el=>{try{return new URL(el.getAttribute('href')||'',window.location.href).href===href;}catch(_){return false;}});if(a)a.scrollIntoView({behavior:'smooth',block:'center'});}

  async function runImageAudit() {
    const btn = document.getElementById('cs-imgAuditBtn');
    const resultEl = document.getElementById('cs-imgAuditResult');
    btn.textContent = '…'; btn.disabled = true;
    resultEl.style.display = 'none'; resultEl.innerHTML = '';
    imgHighlightsActive = false;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      lastTabId = tab.id;
      const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scanImageAssetsFn });
      const data = res?.[0]?.result;
      resultEl.style.display = 'flex'; resultEl.style.flexDirection = 'column'; resultEl.style.gap = '5px';
      const pageCountry = detectCountryFromUrl(data.pageUrl);
      const withCountry = data.images.filter(i => i.hasCountry);
      const divergent   = pageCountry ? withCountry.filter(i => i.imgCountry !== pageCountry) : [];
      const sumEl = document.createElement('div'); sumEl.className = 'cs-summary-row';
      if (!pageCountry) { sumEl.innerHTML = `<span style="color:var(--amber)">⚠</span><span style="color:var(--amber)">Country not detected in URL.</span>`; }
      else if (!divergent.length) { sumEl.innerHTML = `<span style="color:var(--green)">✓</span><span><strong style="color:var(--green)">All assets</strong> <span style="color:var(--muted)">are in the correct country <strong style="color:var(--accent2)">/${pageCountry}/</strong></span></span>`; }
      else { sumEl.innerHTML = `<span style="color:var(--red)">⚠</span><span><strong style="color:var(--red)">${divergent.length} divergent asset${divergent.length>1?'s':''}</strong> <span style="color:var(--muted)">· expected: <strong style="color:var(--accent2)">/${pageCountry}/</strong></span></span>`; }
      resultEl.appendChild(sumEl);
      if (divergent.length > 0) {
        const hlBtn = document.createElement('button'); hlBtn.className = 'btn-xs'; hlBtn.style.cssText = 'border-color:rgba(255,94,94,0.4);color:var(--red);width:100%;margin-top:2px;'; hlBtn.textContent = '⬤ Highlight divergent';
        hlBtn.addEventListener('click', async () => { if (imgHighlightsActive) { await chrome.scripting.executeScript({ target:{tabId:lastTabId}, func:clearImgsFn }); hlBtn.textContent='⬤ Highlight divergent'; imgHighlightsActive=false; } else { await chrome.scripting.executeScript({ target:{tabId:lastTabId}, func:highlightImgsFn, args:[divergent.map(i=>i.src)] }); hlBtn.textContent='✕ Remove highlights'; imgHighlightsActive=true; } });
        resultEl.appendChild(hlBtn);
        const listEl = document.createElement('div'); listEl.className = 'cs-scroll-list';
        divergent.forEach(img => { const item=document.createElement('div'); item.className='cs-item bad'; item.innerHTML=`<div class="cs-item-dot" style="background:var(--red)"></div><div class="cs-item-body"><strong style="color:var(--red)">/${img.imgCountry}/</strong> → ${countryLabel(img.imgCountry)||'?'}<br><span class="dim">${img.short}</span></div>`; const gb=document.createElement('button'); gb.className='cs-item-goto'; gb.title='Scroll to'; gb.textContent='↗'; gb.addEventListener('click',()=>chrome.scripting.executeScript({target:{tabId:lastTabId},func:scrollToImgFn,args:[img.src]})); item.appendChild(gb); listEl.appendChild(item); });
        resultEl.appendChild(listEl);
      }
    } catch(err) { resultEl.style.display='flex'; resultEl.innerHTML=`<div class="cs-summary-row"><span style="color:var(--red)">Error: ${err.message}</span></div>`; }
    finally { btn.textContent='Scan'; btn.disabled=false; }
  }

  async function runCtaAudit() {
    const btn = document.getElementById('cs-ctaAuditBtn');
    const resultEl = document.getElementById('cs-ctaAuditResult');
    btn.textContent = '…'; btn.disabled = true;
    resultEl.style.display = 'none'; resultEl.innerHTML = '';
    ctaHighlightsActive = false;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      lastTabId = tab.id;
      const res = await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: scanCtasFn });
      const data = res?.[0]?.result;
      resultEl.style.display = 'flex'; resultEl.style.flexDirection = 'column'; resultEl.style.gap = '5px';
      const { links, pageCountry } = data;
      if (!pageCountry) { resultEl.innerHTML = `<div class="cs-summary-row"><span style="color:var(--amber)">⚠ Country not detected in URL.</span></div>`; return; }
      const wrong = links.filter(l => l.wrong);
      const sumEl = document.createElement('div'); sumEl.className = 'cs-summary-row';
      if (!wrong.length) { sumEl.innerHTML = `<span style="color:var(--green)">✓</span><span><strong style="color:var(--green)">All CTAs</strong> <span style="color:var(--muted)">point to correct country <strong style="color:var(--accent2)">/${pageCountry}/</strong></span></span>`; }
      else { sumEl.innerHTML = `<span style="color:var(--red)">⚠</span><span><strong style="color:var(--red)">${wrong.length} CTA${wrong.length>1?'s':''} with wrong country</strong></span>`; }
      resultEl.appendChild(sumEl);
      if (wrong.length > 0) {
        const hlBtn = document.createElement('button'); hlBtn.className = 'btn-xs'; hlBtn.style.cssText = 'border-color:rgba(255,94,94,0.4);color:var(--red);width:100%;margin-top:2px;'; hlBtn.textContent = '⬤ Highlight wrong CTAs';
        hlBtn.addEventListener('click', async () => { if (ctaHighlightsActive) { await chrome.scripting.executeScript({ target:{tabId:lastTabId}, func:clearCtasFn }); hlBtn.textContent='⬤ Highlight wrong CTAs'; ctaHighlightsActive=false; } else { await chrome.scripting.executeScript({ target:{tabId:lastTabId}, func:highlightCtasFn, args:[wrong.map(l=>l.href)] }); hlBtn.textContent='✕ Remove highlights'; ctaHighlightsActive=true; } });
        resultEl.appendChild(hlBtn);
        const listEl = document.createElement('div'); listEl.className = 'cs-scroll-list';
        wrong.forEach(link => { const item=document.createElement('div'); item.className='cs-item bad'; item.innerHTML=`<div class="cs-item-dot" style="background:var(--red)"></div><div class="cs-item-body"><strong>${link.label.slice(0,40)}${link.label.length>40?'…':''}</strong> <span style="color:var(--red)">→ /${link.linkCountry}/</span><br><span class="dim">${link.short}</span></div>`; const gb=document.createElement('button'); gb.className='cs-item-goto'; gb.title='Scroll to'; gb.textContent='↗'; gb.addEventListener('click',()=>chrome.scripting.executeScript({target:{tabId:lastTabId},func:scrollToCtaFn,args:[link.href]})); item.appendChild(gb); listEl.appendChild(item); });
        resultEl.appendChild(listEl);
      }
    } catch(err) { resultEl.style.display='flex'; resultEl.innerHTML=`<div class="cs-summary-row"><span style="color:var(--red)">Error: ${err.message}</span></div>`; }
    finally { btn.textContent='Scan'; btn.disabled=false; }
  }

  document.getElementById('cs-scanBtn').addEventListener('click', scan);
  document.getElementById('cs-accordionHeader').addEventListener('click', () => {
    document.getElementById('cs-accordion').classList.toggle('open');
  });
  document.getElementById('cs-imgAuditBtn').addEventListener('click', runImageAudit);
  document.getElementById('cs-ctaAuditBtn').addEventListener('click', runCtaAudit);
})();

// ════════════════════════════════════════════════════════
// MODULE 5 — SHOPAPP
// ════════════════════════════════════════════════════════

(() => {
  async function injectScript(file) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [file] });
  }

  document.getElementById('sa-addBorder').addEventListener('click',   () => injectScript('scripts/shopapp-addRedBorder.js'));
  document.getElementById('sa-hideBorder').addEventListener('click',  () => injectScript('scripts/shopapp-removeRedBorder.js'));
  document.getElementById('sa-showTitles').addEventListener('click',  () => injectScript('scripts/shopapp-addTitles.js'));
  document.getElementById('sa-hideTitles').addEventListener('click',  () => injectScript('scripts/shopapp-removeTitles.js'));
  document.getElementById('sa-showExpired').addEventListener('click', () => injectScript('scripts/shopapp-showExpired.js'));
  document.getElementById('sa-hideExpired').addEventListener('click', () => injectScript('scripts/shopapp-hideExpired.js'));
})();
