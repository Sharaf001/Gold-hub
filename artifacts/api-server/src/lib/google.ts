import { OAuth2Client } from "google-auth-library";

let client: OAuth2Client | null = null;

function getClient(): OAuth2Client {
  const clientId = process.env["GOOGLE_CLIENT_ID"];
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not set.");
  }
  if (!client) {
    client = new OAuth2Client(clientId);
  }
  return client;
}

export type GoogleProfile = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
};

/**
 * Verifies an ID token issued by Google Identity Services (the "Sign in
 * with Google" button on the frontend). Throws if the token is invalid,
 * expired, or wasn't issued for our GOOGLE_CLIENT_ID.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const oauthClient = getClient();
  const clientId = process.env["GOOGLE_CLIENT_ID"]!;

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google token payload");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    emailVerified: payload.email_verified ?? false,
    name: payload.name ?? null,
  };
}