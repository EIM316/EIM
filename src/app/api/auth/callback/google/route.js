import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const redirect = url.searchParams.get("redirect") || "/admin/report";

  if (!code)
    return NextResponse.redirect(`${redirect}?error=missing_code`);

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/callback/google`
  );

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    if (tokens.refresh_token) {
      console.log("✅ Gmail authorized. Refresh token:", tokens.refresh_token);
    }

    return NextResponse.redirect(`${redirect}?verified=true`);
  } catch (error) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${redirect}?error=oauth_failed`);
  }
}
