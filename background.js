// background.js - v9.1 (Generic Public Release)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendBatchToAnki") {
    
    // 1. GENERIC DECK CONFIGURATION
    const PARENT_DECK = "NotebookLM"; 
    const SUB_DECK_NAME = request.deckTitle || "Default Notebook";
    
    // Final Deck: "NotebookLM::Calculus 101"
    const TARGET_DECK = `${PARENT_DECK}::${SUB_DECK_NAME}`; 
    const NOTE_TYPE = "NotebookLM Markdown"; 

    // 2. FIELD MAPPING (Your verified 15-field map)
    const notes = request.batchData.map(card => {
      return {
        "deckName": TARGET_DECK,
        "modelName": NOTE_TYPE,
        "fields": {
          // --- HEADER FIELDS ---
          "Question":     card.question,
          "Hint":         card.hint,
          "ArchDiagram":  "", 
          
          // --- OPTION 1 (Rationale First) ---
          "Option1":      card.option1, 
          "Rationale1":   card.rationale1,
          "Flag1":        card.flag1,
          
          // --- OPTION 2 (Flag First) ---
          "Option2":      card.option2, 
          "Flag2":        card.flag2,
          "Rationale2":   card.rationale2,
          
          // --- OPTION 3 (Flag First) ---
          "Option3":      card.option3, 
          "Flag3":        card.flag3,
          "Rationale3":   card.rationale3,
          
          // --- OPTION 4 (Flag First) ---
          "Option4":      card.option4, 
          "Flag4":        card.flag4,
          "Rationale4":   card.rationale4
        },
        "tags": ["notebooklm_export"]
      };
    });

    // 3. SEND TO ANKI
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
         const successCount = data.result.filter(id => id !== null).length;
         if (successCount === 0 && notes.length > 0) {
             sendResponse({ success: false, error: "0 Cards Added. Check if 'NotebookLM Markdown' Note Type exists!" });
         } else {
             sendResponse({ success: true, count: successCount });
         }
      }
    })
    .catch(err => {
        sendResponse({ success: false, error: "Connection Failed: Is Anki open?" });
    });

    return true; 
  }
});