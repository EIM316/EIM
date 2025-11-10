import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const redirect = url.searchParams.get("redirect") || "/admin/report";

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google?redirect=${encodeURIComponent(redirect)}`
  );

  const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
  ];

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });

  return NextResponse.redirect(authUrl);
}
