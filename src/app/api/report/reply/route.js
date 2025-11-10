import { google } from "googleapis";
import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const TOKENS_PATH = path.join(process.cwd(), "tokens.json");

async function getGmailClient() {
  const tokensRaw = await fs.readFile(TOKENS_PATH, "utf8").catch(() => null);
  if (!tokensRaw)
    throw new Error("Missing tokens.json — please authorize Google first at /api/auth/google");

  const tokens = JSON.parse(tokensRaw);
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials({ refresh_token: tokens.refresh_token });
  return google.gmail({ version: "v1", auth: oAuth2Client });
}

export async function POST(req) {
  try {
    const { receiverEmail, replyMessage, threadId } = await req.json();

    if (!receiverEmail || !replyMessage) {
      return NextResponse.json(
        { success: false, error: "Missing receiverEmail or replyMessage" },
        { status: 400 }
      );
    }

    const gmail = await getGmailClient();
    const adminEmail = process.env.EMAIL_USER;

    let actualRecipient = receiverEmail;
    let inReplyTo = "";
    let references = "";
    let subject = "EIM Support Reply";

    // 🧠 Try to get the original email content to extract the student/prof's real email
    if (threadId) {
      try {
        const thread = await gmail.users.threads.get({ userId: "me", id: threadId });
        const lastMsg = thread.data.messages?.slice(-1)[0];
        const headers = lastMsg?.payload?.headers || [];

        const msgId = headers.find((h) => h.name === "Message-ID")?.value;
        const subj = headers.find((h) => h.name === "Subject")?.value;
        const snippet = lastMsg?.snippet || "";

        // 📩 Extract actual "Email:" field from the message text
        const emailMatch = snippet.match(
          /(?:Email|E-mail|Address)[:\s]+([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i
        );

        if (emailMatch) {
          actualRecipient = emailMatch[1].trim();
          console.log("📧 Extracted real recipient from message body:", actualRecipient);
        }

        if (msgId) {
          inReplyTo = msgId;
          references = msgId;
        }
        if (subj) subject = subj.startsWith("") ? subj : `${subj}`;
      } catch (err) {
        console.warn("⚠️ Could not extract email from thread:", err.message);
      }
    }

    const body = `
Hi there,

${replyMessage}

Best regards,
EIM Support Team
(EIM Reporting System)
    `.trim();

    const messageParts = [
      `From: "EIM Support" <${adminEmail}>`,
      `To: ${actualRecipient}`,
      `Reply-To: ${adminEmail}`,
      inReplyTo ? `In-Reply-To: ${inReplyTo}` : "",
      references ? `References: ${references}` : "",
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      body,
    ].filter(Boolean);

    const encodedMessage = Buffer.from(messageParts.join("\n"))
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: threadId || undefined,
      },
    });

    console.log(`✅ Reply sent to ${actualRecipient} (thread: ${threadId || "new"})`);

    return NextResponse.json({
      success: true,
      message: `Reply sent successfully to ${actualRecipient}`,
      response,
    });
  } catch (err) {
    console.error("❌ Failed to send reply:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send email." },
      { status: 500 }
    );
  }
}
