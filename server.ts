import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

export const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with User-Agent telemetry
const apiKey = process.env.GEMINI_API_KEY;
let geminiBaseUrl: string | undefined = process.env.GEMINI_BASE_URL || undefined;

if (geminiBaseUrl) {
  if (!geminiBaseUrl.startsWith("http://") && !geminiBaseUrl.startsWith("https://")) {
    console.warn(`[Gemini SDK] Attention : GEMINI_BASE_URL "${geminiBaseUrl}" est invalide (doit commencer par http:// ou https://). Elle sera ignorée.`);
    geminiBaseUrl = undefined;
  } else {
    console.log(`[Gemini SDK] Utilisation de l'adresse de contournement/proxy pour l'API : ${geminiBaseUrl}`);
  }
}

const ai = apiKey
  ? new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        baseUrl: geminiBaseUrl,
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

// Helper function to call Gemini with a stable fallback mechanism in case of high demand (e.g. 503 ERROR)
async function generateContentWithFallback(
  aiClient: any,
  options: {
    contents: any;
    systemInstruction?: string;
    temperature?: number;
    responseMimeType?: string;
  }
) {
  const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
  let lastError: any = null;

  for (const model of models) {
    try {
      console.log(`[Gemini Helper] Tentative de génération avec le modèle : ${model}`);
      const response = await aiClient.models.generateContent({
        model: model,
        contents: options.contents,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature,
          ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {}),
        },
      });
      console.log(`[Gemini Helper] Succès avec le modèle : ${model}`);
      return response;
    } catch (err: any) {
      console.warn(`[Gemini Helper] Échec avec le modèle ${model} :`, err.message || err);
      lastError = err;
      
      // If it's a 503 (temporary spike in demand) or service unavailable, try the next fallback model immediately
      const errStr = String(err.message || err).toUpperCase();
      if (
        err.status === 503 ||
        errStr.includes("503") ||
        errStr.includes("DEMAND") ||
        errStr.includes("UNAVAILABLE") ||
        errStr.includes("OVERLOADED")
      ) {
        // Wait briefly (200ms) and continue to the next model
        await new Promise((resolve) => setTimeout(resolve, 200));
        continue;
      }
      
      // For any other errors, wait a bit and continue to the next model as a safety fallback
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  
  throw lastError || new Error("Impossible de générer une réponse de l'IA (tous les modèles ont échoué).");
}

// API endpoint for chatbot communication with rich context
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, financialProfile, transactions } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: "Le serveur n'est pas correctement configuré. La clé d'API GEMINI_API_KEY est manquante dans les configurations.",
      });
    }

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Le paramètre messages est requis et doit être un tableau." });
    }

    // Prepare profile context summary for the system instruction
    const profileSummary = financialProfile
      ? `
=== PROFIL FINANCIER DE L'UTILISATEUR ===
Nom : ${financialProfile.name || "Utilisateur"}
Revenu Mensuel : ${financialProfile.revenu_mensuel || 0} USD
Dépenses Prévues :
- Loyer : ${financialProfile.loyer || 0} USD
- Transport : ${financialProfile.transport || 0} USD
- Alimentation : ${financialProfile.alimentation || 0} USD
- Factures : ${financialProfile.factures || 0} USD
- Loisirs : ${financialProfile.loisirs || 0} USD
Épargne Actuelle : ${financialProfile.epargne || 0} USD
Objectif Spécifique : ${financialProfile.objectif_nom || "Non défini"}
Montant de l'Objectif : ${financialProfile.objectif_montant || 0} USD
`
      : "Aucun profil financier renseigné pour le moment.";

    // Prepare transaction history context
    const transactionsSummary =
      transactions && transactions.length > 0
        ? `
=== DIX DERNIÈRES TRANSACTIONS ===
${transactions
  .slice(-10)
  .map(
    (t: any) =>
      `- [${t.date_transaction || t.date || ""}] ${t.type === "Revenu" ? "REV" : "DEP"} | ${t.categorie} : ${t.montant} USD (${t.description || "Sans description"})`
  )
  .join("\n")}
`
        : "Aucune transaction enregistrée pour le moment.";

    // Combine into structured system instruction
    const systemInstruction = `Vous êtes un assistant financier personnel intelligent, rigoureux mais bienveillant, et expert en microfinance, gestion budgétaire personnelle et projection d'épargne.
Vos réponses doivent être rédigées entièrement en français, claires, structurées avec du Markdown (listes à puces, éléments en gras) pour être faciles à lire.

RÈGLE ABSOLUE DE PÉRIMÈTRE - LIMITATION STRICTE AUX FINANCES :
Vous ne devez répondre QU'AUX questions qui concernent directement les finances, le budget personnel, l'économie, l'épargne ou l'investissement.
Si l'utilisateur pose une question hors-sujet qui ne concerne pas le domaine financier (comme de la cuisine, de la programmation générale, des conseils de voyage, de la politique non économique, de la culture générale divertissante, etc.), vous devez impérativement et de manière polie refuser de répondre avec un message ciblé :
"Désolé, en tant qu'assistant de gestion financière, je ne peux répondre qu'aux questions en lien direct avec les finances, le budget, l'investissement et l'économie."
 
RÈGLE DE RÉFÉRENCE AUX OUVRAGES FINANCIERS :
Lorsque vous formulez des conseils, suggérez des améliorations de budget, ou commentez une projection financière, faites obligatoirement des clins d'œil et intégrez des leçons des célèbres livres de référence de la finance personnelle :
1. "The Intelligent Investor" (L'Investisseur Intelligent) de Benjamin Graham (pour évoquer la marge de sécurité, l'investissement à long terme ou l'attitude face aux fluctuations).
2. "Rich Dad Poor Dad" (Père Riche, Père Pauvre) de Robert Kiyosaki (pour parler de l'acquisition d'actifs plutôt que de passifs, de l'augmentation du cashflow ou de la discipline économique).
3. "The Psychology of Money" (La Psychologie de l'Argent) de Morgan Housel (pour souligner l'importance du comportement par rapport à la théorie pure, de l'humilité, et du pouvoir de l'épargne indépendamment de la taille des profits).

Voici les données financières réelles de l'utilisateur qui vous parle aujourd'hui :
${profileSummary}
${transactionsSummary}

Consignes :
1. Utilisez ces chiffres réels pour donner des conseils ultra-personnalisés. Ne donnez pas de conseils génériques. S'il dépasse ses budgets de loisirs ou d'alimentation par rapport aux transactions que vous voyez, signalez-le avec tact.
2. Calculez les temps d'attente réels ou l'épargne résiduelle de façon mathématique si l'utilisateur pose une question de projection (par exemple : estimer combien de mois il lui faudra pour atteindre son objectif en fonction de son revenu d'épargne résiduelle).
3. Soyez encourageant mais réaliste. Proposez des astuces concrètes (par exemple: réduire les loisirs de 10%, planifier ses repas).
4. Gardez des réponses concises, percutantes et bien mises en page.
`;

    // Process messaging content format expected by GoogleGenAI SDK
    // Convert message array to string queries or handle multiple turns
    // The google-genai library supports content. We can model the last message as user query
    // and provide the history or just feed the conversation directly!
    // Since we want the chat history to be represented in contents, let's assemble them.
    // The SDK contents can be a single prompt string, or a Content array: { role: 'user' | 'model', parts: [{ text: '...' }] }
    const formattedContents = messages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Use the robust fallback helper to handle temporary high demand on specific models
    const response = await generateContentWithFallback(ai, {
      contents: formattedContents,
      systemInstruction,
      temperature: 0.7,
    });

    const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
    res.json({ text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Une erreur est survenue lors du traitement de votre demande par l'assistant IA.",
      details: error.message,
    });
  }
});

// Endpoint to parse financial emails with Gemini
app.post("/api/parse-email", async (req, res) => {
  try {
    const { subject, from, date, body } = req.body;

    if (!ai) {
      return res.status(500).json({
        error: "Le serveur n'est pas configuré. GEMINI_API_KEY est manquante.",
      });
    }

    const systemInstruction = "Tu es un parseur JSON de courriels d'achats, reçus et factures bancaires. Tu dois extraire les informations requises dans le format JSON demandé.";
    
    const prompt = `Analyse le courriel suivant :
Sujet : ${subject || ""}
De : ${from || ""}
Date : ${date || ""}
Contenu : ${body || ""}

Règles de parsing :
1. Détermine si ce message est relatif à une transaction financière réelle (achat, reçu de paiement, virement bancaire, facture payée, salaire reçu).
2. Si ce n'est PAS une transaction financière (ex: pub, spam, confirmation d'inscription sans prix, discussion générale), retourne :
   {"is_transaction": false}
3. Si c'est une transaction :
   - Extrais le type : "Dépense" (achat, débit, facture payée) ou "Revenu" (virement reçu, salaire, remboursement).
   - Sélectionne la catégorie la plus adaptée parmi : "Salaire", "Loyer", "Transport", "Alimentation", "Factures", "Loisirs", "Épargne", ou "Autre".
   - Extrais le montant numérique net exact en nombre décimal/entier (sans devise).
   - Saisis une description lisible décrivant le marchand ou l'opération (ex: "Facture EDF", "Abonnement Spotify", "Courses Carrefour").
   - Extrais ou convertis la date de la transaction au format YYYY-MM-DD.

Format JSON requis :
{
  "is_transaction": true,
  "type": "Dépense",
  "categorie": "Alimentation",
  "montant": 45.50,
  "description": "Courses de semaine",
  "date_transaction": "2026-06-03"
}`;

    const response = await generateContentWithFallback(ai, {
      contents: prompt,
      systemInstruction,
      temperature: 0.1,
      responseMimeType: "application/json",
    });

    const resultText = response.text || "{}";
    const resultJson = JSON.parse(resultText);
    res.json(resultJson);
  } catch (error: any) {
    console.error("Parse Email Error:", error);
    res.status(500).json({
      error: "Erreur pendant le parsing du courriel.",
      details: error.message
    });
  }
});

// Serve frontend assets in production / dev setup middleware
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // We use Vite middleware in development
    try {
      const viteModule = await import("vite");
      const vite = await viteModule.createServer({
        server: { middlewareMode: true },
        appType: "custom",
      });
      app.use(vite.middlewares);

      // Explicitly serve index.html in development to prevent 404/Page not found errors
      app.get("*", async (req, res, next) => {
        if (req.path.startsWith("/api")) {
          return next();
        }
        try {
          const url = req.originalUrl;
          const fs = await import("fs");
          let template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ "Content-Type": "text/html" }).end(template);
        } catch (e) {
          next(e);
        }
      });
    } catch (err) {
      console.error("Failed to initialize Vite development server middleware:", err);
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Serveur démarré avec succès !`);
    console.log(`👉 Pour accéder à votre application localement, utilisez : http://localhost:${PORT}`);
    console.log(`👉 Adresse réseau générique : http://127.0.0.1:${PORT}\n`);
  });
};

if (!process.env.NETLIFY && !process.env.LAMBDA_TASK_ROOT) {
  startServer();
}
