import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase with the auto-generated config
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request read-only access to Gmail
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initFirebaseAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // Try to fetch token if user is signed in but we don't have token cached yet
        // In some cases we might need to prompt a sign-in or reuse credential.
        // For security across page refreshes, we can hold sign-in state, but if access token is inside pop-up, 
        // we'll instruct the user to sign in to retrieve their fresh access token.
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Initiate Google Sign-in to fetch Firebase user and Google Access Token
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Impossible de récupérer le jeton d'accès OAuth Google depuis Firebase Auth.");
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logoutGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// --- GMAIL API FUNCTIONS ---

export interface GmailEmailPreview {
  id: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
  body: string;
}

// helper to decode base64url standard used in Gmail API
function decodeBase64Url(str: string): string {
  try {
    let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    // Decode securely supporting UTF-8 decoding
    const r = atob(base64);
    return decodeURIComponent(
      r.split("").map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
  } catch (e) {
    try {
      // fallback decoding
      return atob(str.replace(/-/g, "+").replace(/_/g, "/"));
    } catch (err) {
      console.error("Base64 decode error:", err);
      return "";
    }
  }
}

// recursive helper to look for message body in payload parts
function getMessageBody(payload: any): string {
  if (!payload) return "";
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && payload.parts.length > 0) {
    // Prefer plain text parts if possible
    const textPart = payload.parts.find((p: any) => p.mimeType === "text/plain");
    if (textPart) {
      return getMessageBody(textPart);
    }
    // Fallback to html/other parts
    for (const part of payload.parts) {
      const body = getMessageBody(part);
      if (body) return body;
    }
  }
  return "";
}

// Fetch a list of recent messages
export const listRecentEmails = async (accessToken: string, maxResults = 10): Promise<GmailEmailPreview[]> => {
  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
    const response = await fetch(listUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Gmail API List Error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.messages || data.messages.length === 0) {
      return [];
    }

    // Load full details for each message in parallel (up to maxResults)
    const detailedEmails = await Promise.all(
      data.messages.map(async (msg: { id: string }) => {
        try {
          const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`;
          const msgRes = await fetch(msgUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (!msgRes.ok) return null;

          const msgData = await msgRes.json();
          const headers = msgData.payload?.headers || [];
          
          const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(Sans objet)";
          const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Inconnu";
          const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
          const body = getMessageBody(msgData.payload) || msgData.snippet || "";

          return {
            id: msg.id,
            snippet: msgData.snippet || "",
            subject,
            from,
            date,
            body,
          };
        } catch (err) {
          console.error(`Error loading message ${msg.id}:`, err);
          return null;
        }
      })
    );

    return detailedEmails.filter((email) => email !== null) as GmailEmailPreview[];
  } catch (err) {
    console.error("listRecentEmails error:", err);
    throw err;
  }
};
