// content.js - v8.1 (Clean Data Pass-through)

(function() {
  const CONFIG = {
    BUTTON_ID: "notebooklm-to-anki-btn", 
    ANCHOR_SELECTORS: [
      'button[aria-label="Good content rating"]',
      'button[aria-label="Copy"]',
      'button[aria-label="Download"]'
    ]
  };

  function initDataMiner() {
    const appRoot = document.querySelector('[data-app-data]');
    if (appRoot) {
      console.log("[Anki Bridge] ⛏️ Miner Ready");
      window.top.postMessage({ action: "ANKI_MINER_READY" }, "*");
      window.addEventListener("message", (event) => {
        if (event.data.action === "ANKI_TRIGGER_EXTRACT") {
          const jsonString = appRoot.getAttribute('data-app-data');
          const customTitle = event.data.notebookTitle; 
          processBatch(jsonString, customTitle);
        }
      });
    }
  }

  function unescapeHtml(str) {
    if (!str) return "";
    return str.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
  }

  function processBatch(jsonString, customNotebookTitle) {
    try {
      const cleanJson = unescapeHtml(jsonString);
      const data = JSON.parse(cleanJson);
      
      const quizData = data.quiz || (data.mostRecentQuery && data.mostRecentQuery.quiz);
      
      if (!quizData || !Array.isArray(quizData) || quizData.length === 0) {
        window.top.postMessage({ action: "ANKI_REAL_FAIL", error: "0 Questions Found." }, "*");
        return;
      }

      let finalTitle = customNotebookTitle;
      if (!finalTitle || finalTitle === "NotebookLM") { finalTitle = data.title; }
      if (!finalTitle) finalTitle = "Unknown Notebook"; 
      finalTitle = finalTitle.replace(/::/g, " - ").trim();

      const cards = quizData.map(q => {
        return {
          question: q.question,
          hint: q.hint || "",
          
          // Capture raw values
          option1: q.answerOptions[0]?.text || "",
          flag1: q.answerOptions[0]?.isCorrect ? "True" : "False",
          rationale1: q.answerOptions[0]?.rationale || "", 

          option2: q.answerOptions[1]?.text || "",
          flag2: q.answerOptions[1]?.isCorrect ? "True" : "False",
          rationale2: q.answerOptions[1]?.rationale || "",

          option3: q.answerOptions[2]?.text || "",
          flag3: q.answerOptions[2]?.isCorrect ? "True" : "False",
          rationale3: q.answerOptions[2]?.rationale || "",

          option4: q.answerOptions[3]?.text || "",
          flag4: q.answerOptions[3]?.isCorrect ? "True" : "False",
          rationale4: q.answerOptions[3]?.rationale || "",
        };
      });

      chrome.runtime.sendMessage({ 
        action: "sendBatchToAnki", 
        batchData: cards, 
        deckTitle: finalTitle 
      }, (res) => {
        if (res && res.success) {
          window.top.postMessage({ action: "ANKI_REAL_SUCCESS", count: cards.length, deck: finalTitle }, "*");
        } else {
          window.top.postMessage({ action: "ANKI_REAL_FAIL", error: res ? res.error : "Unknown Error" }, "*");
        }
      });

    } catch (e) {
      console.error(e);
      window.top.postMessage({ action: "ANKI_REAL_FAIL", error: "JSON Parse Error: " + e.message }, "*");
    }
  }

  // UI INJECTOR (Standard)
  let isMinerConnected = false;
  function initUiInjector() {
    window.addEventListener("message", (event) => {
      if (event.data.action === "ANKI_MINER_READY") { isMinerConnected = true; updateButtonState("ready"); }
      else if (event.data.action === "ANKI_REAL_SUCCESS") { updateButtonState("success", event.data.count, event.data.deck); }
      else if (event.data.action === "ANKI_REAL_FAIL") { alert("⚠️ Export Failed: " + event.data.error); updateButtonState("error"); }
    });
    const observer = new MutationObserver(() => {
      if (document.getElementById(CONFIG.BUTTON_ID)) return;
      let anchorBtn = null;
      for (const selector of CONFIG.ANCHOR_SELECTORS) {
        const found = document.querySelector(selector);
        if (found) { anchorBtn = found; break; }
      }
      if (anchorBtn) {
        const container = anchorBtn.closest('div.flex') || anchorBtn.parentElement;
        if (container) { container.insertBefore(createAngularCloneButton(), container.firstChild); }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  function getNotebookTitle() {
    const input = document.querySelector('input[placeholder="Notebook title"]');
    if (input && input.value) return input.value.trim();
    const label = document.querySelector('.title-label');
    if (label && label.textContent) return label.textContent.trim();
    if (document.title && document.title.includes("- NotebookLM")) { return document.title.replace("- NotebookLM", "").trim(); }
    return null;
  }

  function createAngularCloneButton() {
    const btn = document.createElement("button");
    btn.id = CONFIG.BUTTON_ID;
    btn.className = "mdc-button mat-mdc-button mat-mdc-outlined-button mat-unthemed mat-mdc-button-base";
    btn.style.cssText = `border: 1px solid rgb(55, 56, 59); border-radius: 18px; padding: 0 20px; margin-right: 10px; color: #e3e3e3; height: 40px; display: inline-flex; align-items: center; justify-content: center; cursor: not-allowed; opacity: 0.5;`;
    const downloadIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 -960 960 960" width="18" fill="currentColor"><path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/></svg>`;
    btn.innerHTML = `<span class="mat-mdc-button-persistent-ripple mdc-button__ripple"></span><span class="mat-mdc-button-touch-target"></span><span class="mdc-button__label" style="display: flex; align-items: center; gap: 8px;">${downloadIconSvg}<span>Anki Export</span></span>`;
    btn.disabled = true;
    btn.onclick = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!isMinerConnected) { alert("Wait for page to fully load..."); return; }
      const labelText = btn.querySelector(".mdc-button__label span:last-child");
      if(labelText) labelText.innerText = "Extracting...";
      btn.style.borderColor = "#a8c7fa"; btn.style.color = "#a8c7fa";
      const deckName = getNotebookTitle();
      if (!deckName) { const manualName = prompt("Enter Notebook Name:"); if (!manualName) { updateButtonState("ready"); return; } }
      const iframes = document.querySelectorAll('iframe');
      iframes.forEach(iframe => { iframe.contentWindow.postMessage({ action: "ANKI_TRIGGER_EXTRACT", notebookTitle: deckName || manualName }, "*"); });
    };
    return btn;
  }

  function updateButtonState(state, count = 0, deckName = "") {
    const btn = document.getElementById(CONFIG.BUTTON_ID);
    if (!btn) return;
    const labelText = btn.querySelector(".mdc-button__label span:last-child");
    if (state === "ready") { if(labelText) labelText.innerText = "Anki Export"; btn.style.opacity = "1"; btn.style.cursor = "pointer"; btn.style.borderColor = "rgb(55, 56, 59)"; btn.style.color = "#e3e3e3"; btn.disabled = false; } 
    else if (state === "success") { if(labelText) labelText.innerText = `Saved ${count}!`; btn.style.borderColor = "#6dd58c"; btn.style.color = "#6dd58c"; setTimeout(() => updateButtonState("ready"), 3000); }
    else if (state === "error") { if(labelText) labelText.innerText = "Error"; btn.style.borderColor = "#ffb4ab"; btn.style.color = "#ffb4ab"; setTimeout(() => updateButtonState("ready"), 3000); }
  }

  initDataMiner();
  initUiInjector();
})();