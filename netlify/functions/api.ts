import serverless from "serverless-http";
import { app } from "../../server";

// Adaptateur Serverless pour Netlify
export const handler = serverless(app);
