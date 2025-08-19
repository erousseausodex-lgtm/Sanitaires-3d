
/ 💬 Conversation initiale
// -----------------------------
let conversation = [
  {
    role: "system",
    content:  "Tu es un formateur en nettoyage. Réponds toujours en français, même si tu parles à un stagiaire qui parle une autre langue. Donne des conseils simples, clairs, adaptés au terrain et en langage profesionel"
  },
  {
    role: "assistant",
    content: "Tu es en situation de nettoyage. As-tu rencontré une difficulté ?"
  }
];

// 🔧 Utilitaire pour lire les paramètres URL
function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId: params.get("sessionId"),
    langue: params.get("langue")
  };
}

const { sessionId, userName, langue } = getURLParams();
console.log("🔍 Paramètres URL :", sessionId, userName, langue);


// 📥 Récupération dynamique des données AppSheet

// let session = getParam("sessionId") || "Session inconnue";
// let langue = getParam("langue") || "fr";

let lastBotMessage = ""; // 🔁 Mémorise le dernier message assistant

// -----------------------------
// 🚀 Lancement de l'exercice
// -----------------------------
function lancerExerciceDialogue(phrase) {
  // const phrase = conversation[1].content;

    const message = `tu as decrit le contecte ${phrase} . Quelle est ta question ?`;
  //afficherDansBulle(phrase);
  lastBotMessage = message;

  const synth = new SpeechSynthesisUtterance(message);
  synth.lang = "fr-FR";
  synth.onend = () => attendreRéponseVocale(phrase); // Attente après la voix
  speechSynthesis.speak(synth);
}

function reformulerProblemeEnFrancais(input, callback) {
  const messages = [
    {
      role: "system",
      content: "Tu es un formateur professionnel. Quand tu reçois une phrase, reformule-la en français clair, correct et professionnel, comme si elle devait être notée dans un rapport. Réponds uniquement par la phrase reformulée, sans explication."
    },
    { role: "user", content: input }
  ];

  fetch("https://gpt-backend-vercel.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages })
  })
    .then(res => res.json())
    .then(data => {
      const reformulation = data.reply || input;
      callback(reformulation);
    })
    .catch(err => {
      console.error("❌ Erreur reformulation :", err);
      callback(input);
    });
}



// -----------------------------
// 🎤 Attente de la réponse orale
// -----------------------------
function attendreRéponseVocale(etape) {
  const reco = new webkitSpeechRecognition();
  reco.lang = "fr-FR";
  reco.interimResults = false;

  reco.onresult = event => {
    const reponseUtilisateur = event.results[0][0].transcript;
    console.log("🎤 Réponse utilisateur :", reponseUtilisateur);

    const contexte =  `L'utilisateur parle de l'étape ${etape} dans une scène de nettoyage.`;
    const reformulerAvecContexte = `${contexte} Voici ce qu’il dit : "${reponseUtilisateur}"`;
    
  // reformuler en français avant de lancer GPT
reformulerProblemeEnFrancais(reformulerAvecContexte, (problemeFormate) => {
  conversation.push({ role: "user", content: problemeFormate });
  envoyerAChatGPT(problemeFormate);
});

};

  reco.onerror = e => {
    alert("Erreur reconnaissance vocale : " + e.error);
    console.error("❌ Reco vocale :", e.error);
  };

  reco.start();
}

// -----------------------------
// 🤖 Envoi à ChatGPT via backend
// -----------------------------
function envoyerAChatGPT(texteUtilisateur) {
  fetch("https://gpt-backend-vercel.vercel.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: conversation })
  })
    .then(res => res.json())
    .then(data => {
      const reponse = data.reply || "Je n’ai pas compris.";
      conversation.push({ role: "assistant", content: reponse });

      afficherDansBulle(reponse);
      lastBotMessage = reponse;

      enregistrerInteraction(texteUtilisateur, reponse,lastBotMessage); // LOG GSheet
      // Remove markdown asterisks, underscores, etc.
      const texteNettoye = reponse.replace(/[*_`#~]/g, "");
      const synth = new SpeechSynthesisUtterance(texteNettoye);
      synth.lang = langue;// ← vocal dans la langue choisie
      synth.onend = () => {
        // Optionnel : afficher un bouton "Autre difficulté"
        console.log("🟢 Fin réponse GPT");
      };
      speechSynthesis.speak(synth);
    })
    .catch(err => {
      console.error("❌ Erreur GPT :", err);
    });
}

// -----------------------------
// 🗂️ Enregistrement dans GSheet
// -----------------------------
function enregistrerInteraction(probleme, conseil,etape) {
  fetch("https://script.google.com/macros/s/AKfycbz-6CZyLfbH9L0um7CaIIzUqStGCs9HQkVA7aRg6PcGH5Kh1jLk49EfULicX5OKj4Y/exec", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      sessionId,
      langue,
      date: new Date().toISOString(),
      etape,
      probleme,
      conseil
    })
  })
    .then(r => r.text())
    .then(txt => console.log("✅ Log AppSheet :", txt))
    .catch(e => console.error("❌ Erreur log AppSheet :", e));
}

// // 💬 Conversation initiale programme visuel 3D sanitaire
// // -----------------------------
// let conversation = [
//   {
//     role: "system",
//     content:  "Tu es un formateur en nettoyage. Réponds toujours en français, même si tu parles à un stagiaire qui parle une autre langue. Donne des conseils simples, clairs, adaptés au terrain."
//   },
//   {
//     role: "assistant",
//     content: "Tu es en situation de nettoyage. As-tu rencontré une difficulté ?"
//   }
// ];

// // 🔧 Utilitaire pour lire les paramètres URL
// function getURLParams() {
//   const params = new URLSearchParams(window.location.search);
//   return {
//     sessionId: params.get("sessionId"),
//     langue: params.get("langue")
//   };
// }

// const { sessionId, userName, langue } = getURLParams();
// console.log("🔍 Paramètres URL :", sessionId, userName, langue);


// // 📥 Récupération dynamique des données AppSheet

// // let session = getParam("sessionId") || "Session inconnue";
// // let langue = getParam("langue") || "fr";

// let lastBotMessage = ""; // 🔁 Mémorise le dernier message assistant

// // -----------------------------
// // 🚀 Lancement de l'exercice
// // -----------------------------
// function lancerExerciceDialogue(phrase) {
//   // const phrase = conversation[1].content;

//     const message = `Tu as cliqué sur le ${phrase} . Quelle est ta question ?`;
//   afficherDansBulle(phrase);
//   lastBotMessage = message;

//   const synth = new SpeechSynthesisUtterance(message);
//   synth.lang = "fr-FR";
//   synth.onend = () => attendreRéponseVocale(phrase); // Attente après la voix
//   speechSynthesis.speak(synth);
// }

// function reformulerProblemeEnFrancais(input, callback) {
//   const messages = [
//     {
//       role: "system",
//       content: "Tu es un formateur professionnel. Quand tu reçois une phrase, reformule-la en français clair, correct et professionnel, comme si elle devait être notée dans un rapport. Réponds uniquement par la phrase reformulée, sans explication."
//     },
//     { role: "user", content: input }
//   ];

//   fetch("https://gpt-backend-vercel.vercel.app/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ messages })
//   })
//     .then(res => res.json())
//     .then(data => {
//       const reformulation = data.reply || input;
//       callback(reformulation);
//     })
//     .catch(err => {
//       console.error("❌ Erreur reformulation :", err);
//       callback(input);
//     });
// }



// // -----------------------------
// // 🎤 Attente de la réponse orale
// // -----------------------------
// function attendreRéponseVocale(etape) {
//   const reco = new webkitSpeechRecognition();
//   reco.lang = "fr-FR";
//   reco.interimResults = false;

//   reco.onresult = event => {
//     const reponseUtilisateur = event.results[0][0].transcript;
//     console.log("🎤 Réponse utilisateur :", reponseUtilisateur);

//     const contexte =  `L'utilisateur parle de l'étape ${etape} dans une scène de nettoyage.`;
//     const reformulerAvecContexte = `${contexte} Voici ce qu’il dit : "${reponseUtilisateur}"`;
    
//   // reformuler en français avant de lancer GPT
// reformulerProblemeEnFrancais(reformulerAvecContexte, (problemeFormate) => {
//   conversation.push({ role: "user", content: problemeFormate });
//   envoyerAChatGPT(problemeFormate);
// });

// };

//   reco.onerror = e => {
//     alert("Erreur reconnaissance vocale : " + e.error);
//     console.error("❌ Reco vocale :", e.error);
//   };

//   reco.start();
// }

// // -----------------------------
// // 🤖 Envoi à ChatGPT via backend
// // -----------------------------
// function envoyerAChatGPT(texteUtilisateur) {
//   fetch("https://gpt-backend-vercel.vercel.app/api/chat", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ messages: conversation })
//   })
//     .then(res => res.json())
//     .then(data => {
//       const reponse = data.reply || "Je n’ai pas compris.";
//       conversation.push({ role: "assistant", content: reponse });

//       afficherDansBulle(reponse);
//       lastBotMessage = reponse;

//       enregistrerInteraction(texteUtilisateur, reponse,lastBotMessage); // LOG GSheet
//       // Remove markdown asterisks, underscores, etc.
//       const texteNettoye = reponse.replace(/[*_`#~]/g, "");
//       const synth = new SpeechSynthesisUtterance(texteNettoye);
//       synth.lang = langue;// ← vocal dans la langue choisie
//       synth.onend = () => {
//         // Optionnel : afficher un bouton "Autre difficulté"
//         console.log("🟢 Fin réponse GPT");
//       };
//       speechSynthesis.speak(synth);
//     })
//     .catch(err => {
//       console.error("❌ Erreur GPT :", err);
//     });
// }

// // -----------------------------
// // 🗂️ Enregistrement dans GSheet
// // -----------------------------
// function enregistrerInteraction(probleme, conseil,etape) {
//   fetch("https://script.google.com/macros/s/AKfycbz-6CZyLfbH9L0um7CaIIzUqStGCs9HQkVA7aRg6PcGH5Kh1jLk49EfULicX5OKj4Y/exec", {
//     method: "POST",
//     headers: { "Content-Type": "text/plain;charset=utf-8" },
//     body: JSON.stringify({
//       sessionId,
//       langue,
//       date: new Date().toISOString(),
//       etape,
//       probleme,
//       conseil
//     })
//   })
//     .then(r => r.text())
//     .then(txt => console.log("✅ Log AppSheet :", txt))
//     .catch(e => console.error("❌ Erreur log AppSheet :", e));
// }

// // -----------------------------
// // 💬 Affiche une bulle texte 3D
// // -----------------------------
// function afficherDansBulle(texte) {
//   const canvas = document.createElement('canvas');
//   const ctx = canvas.getContext('2d');
//   canvas.width = 512;
//   canvas.height = 256;
//   ctx.fillStyle = 'white';
//   ctx.fillRect(0, 0, canvas.width, canvas.height);
//   ctx.fillStyle = 'black';
//   ctx.font = '20px sans-serif';
//   ctx.fillText(texte, 10, 50);
//   const texture = new THREE.CanvasTexture(canvas);
//   const material = new THREE.SpriteMaterial({ map: texture });
//   const sprite = new THREE.Sprite(material);
//   sprite.scale.set(3, 1.5, 1);
//   sprite.position.copy(camera.position).add(new THREE.Vector3(0, -1, -5));
//   scene.add(sprite);
//   setTimeout(() => scene.remove(sprite), 10000);
// }



