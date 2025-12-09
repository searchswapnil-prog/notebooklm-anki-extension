// background.js - v8.1 (Fixed Field Mapping)

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "sendBatchToAnki") {
    
    // 1. CONFIGURATION
    const PARENT_DECK = "AWS SAA NotebookLM";
    const SUB_DECK_NAME = request.deckTitle || "Unknown Notebook";
    const TARGET_DECK = `${PARENT_DECK}::${SUB_DECK_NAME}`; 
    const NOTE_TYPE = "NotebookLM Markdown"; // Targets your new Note Type

    // 2. FIELD MAPPING (Based on image_86ad51.png)
    const notes = request.batchData.map(card => {
      return {
        "deckName": TARGET_DECK,
        "modelName": NOTE_TYPE,
        "fields": {
          // --- HEADER FIELDS ---
          "Question":     card.question,
          "Hint":         card.hint,
          "ArchDiagram":  "", // Field 3: Empty for manual diagrams
          
          // --- OPTION 1 (The "Rationale-First" Group) ---
          "Option1":      card.option1,     // Field 4
          "Rationale1":   card.rationale1,  // Field 5
          "Flag1":        card.flag1,       // Field 6
          
          // --- OPTION 2 (The "Flag-First" Group) ---
          "Option2":      card.option2,     // Field 7
          "Flag2":        card.flag2,       // Field 8
          "Rationale2":   card.rationale2,  // Field 9
          
          // --- OPTION 3 ---
          "Option3":      card.option3,     // Field 10
          "Flag3":        card.flag3,       // Field 11
          "Rationale3":   card.rationale3,  // Field 12
          
          // --- OPTION 4 ---
          "Option4":      card.option4,     // Field 13
          "Flag4":        card.flag4,       // Field 14
          "Rationale4":   card.rationale4   // Field 15
        },
        "tags": ["notebooklm", "markdown"]
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