// background.js - v8.0 (NotebookLM Markdown Support)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendBatchToAnki") {
    
    // 1. CONFIGURATION
    const PARENT_DECK = "AWS SAA NotebookLM";
    const SUB_DECK_NAME = request.deckTitle || "Unknown Notebook";
    const TARGET_DECK = `${PARENT_DECK}::${SUB_DECK_NAME}`; 
    // THIS IS THE CRITICAL FIX:
    const NOTE_TYPE = "NotebookLM Markdown"; 

    // 2. FIELD MAPPING
    const notes = request.batchData.map(card => {
      return {
        "deckName": TARGET_DECK,
        "modelName": NOTE_TYPE,
        "fields": {
          // --- HEADER FIELDS ---
          "Question":     card.question,
          "Hint":         card.hint,
          "ArchDiagram":  "", // Field 3 (Empty by default)
          
          // --- OPTION 1 (Rationale comes BEFORE Flag) ---
          "Option1":      card.option1, 
          "Rationale1":   card.rationale1,
          "Flag1":        card.flag1,
          
          // --- OPTION 2 (Flag comes BEFORE Rationale) ---
          "Option2":      card.option2, 
          "Flag2":        card.flag2,
          "Rationale2":   card.rationale2,
          
          // --- OPTION 3 (Flag comes BEFORE Rationale) ---
          "Option3":      card.option3, 
          "Flag3":        card.flag3,
          "Rationale3":   card.rationale3,
          
          // --- OPTION 4 (Flag comes BEFORE Rationale) ---
          "Option4":      card.option4, 
          "Flag4":        card.flag4,
          "Rationale4":   card.rationale4
        },
        "tags": ["notebooklm", "markdown-export"]
      };
    });

    // 3. ANKICONNECT PAYLOAD
    fetch('http://127.0.0.1:8765', {
      method: 'POST',
      body: JSON.stringify({ "action": "createDeck", "version": 6, "params": { "deck": TARGET_DECK } })
    })
    .then(() => {
      return fetch('http://127.0.0.1:8765', {
        method: 'POST',
        body: JSON.stringify({ "action": "addNotes", "version": 6, "params": { "notes": notes } })
      });
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
         console.error("AnkiConnect Error", data.error);
         sendResponse({ success: false, error: "Anki Error: " + data.error });
      } else {
         // Count successful adds (result array contains IDs for success, null for fail)
         const successCount = data.result.filter(id => id !== null).length;
         
         if (successCount === 0 && notes.length > 0) {
             sendResponse({ success: false, error: "0 Cards Added. Check if Note Type 'NotebookLM Markdown' exists!" });
         } else {
             sendResponse({ success: true, count: successCount });
         }
      }
    })
    .catch(err => {
        console.error(err);
        sendResponse({ success: false, error: "Connection Failed: Ensure Anki is open with AnkiConnect." });
    });

    return true; 
  }
});