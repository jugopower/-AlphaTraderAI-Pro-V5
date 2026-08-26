import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

// Required env vars
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const JOYGO_FROM_EMAIL = Deno.env.get("JOYGO_FROM_EMAIL");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

if (!SUPABASE_URL) throw new Error("SUPABASE_URL is required");
if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is required");
if (!JOYGO_FROM_EMAIL) throw new Error("JOYGO_FROM_EMAIL is required");

// CORS
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

function getBearerToken(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  if (!auth.toLowerCase().startsWith("bearer ")) return null;
  return auth.slice("Bearer ".length);
}

function getAnonKeyOrFallback(): string {
  const rawPublishable = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (rawPublishable) {
    try {
      const parsed = JSON.parse(rawPublishable) as Record<string, string>;
      const first = Object.values(parsed)[0];
      if (first) return first;
    } catch {
      // fall through
    }
  }

  const legacyAnon = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacyAnon) return legacyAnon;

  throw new Error(
    "No publishable (anon) key found in SUPABASE_PUBLISHABLE_KEYS/SUPABASE_ANON_KEY",
  );
}

function getServiceRoleKey(): string {
  const rawSecret = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (rawSecret) {
    try {
      const parsed = JSON.parse(rawSecret) as Record<string, string>;
      const serviceRoleEntry = Object.entries(parsed).find(([k]) =>
        k.toLowerCase().includes("service_role")
      );
      const chosen = serviceRoleEntry?.[1] ?? Object.values(parsed)[0];
      if (chosen) return chosen;
    } catch {
      // fall through
    }
  }

  const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacyServiceRole) return legacyServiceRole;

  throw new Error(
    "No service-role key found in SUPABASE_SECRET_KEYS/SUPABASE_SERVICE_ROLE_KEY",
  );
}

async function isJoyGoStaff(userClient: SupabaseClient) {
  const { data, error } = await userClient.rpc("is_joygo_staff");
  if (error) {
    console.error("is_joygo_staff error:", error.message);
    return false;
  }
  return data === true;
}

function adminClient(): SupabaseClient {
  const serviceRoleKey = getServiceRoleKey();
  return createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

function userClient(req: Request): SupabaseClient {
  const token = getBearerToken(req);
  const anonKey = getAnonKeyOrFallback();

  return createClient(SUPABASE_URL, anonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
    auth: { persistSession: false },
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value: unknown) {
  if (!value) return "";
  try {
    return new Date(String(value)).toLocaleString("zh-TW", {
      timeZone: "Asia/Taipei",
      hour12: false,
    });
  } catch {
    return String(value);
  }
}

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: JOYGO_FROM_EMAIL,
      to: [params.to],
      subject: params.subject,
      html: params.html,
      text: params.text,
    }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Resend error ${res.status}: ${msg}`);
  }

  return res.json().catch(() => ({}));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { headers: CORS });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  let body: { activity_id?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const activity_id = body?.activity_id;
  if (!activity_id) {
    return jsonResponse({ error: "Missing activity_id" }, 400);
  }

  // Authorization: caller must be Joy Go staff.
  const uClient = userClient(req);
  const allowed = await isJoyGoStaff(uClient);
  if (!allowed) {
    return jsonResponse({ error: "Unauthorized" }, 403);
  }

  const aClient = adminClient();

  // Current Joy Go activity schema.
  const { data: activity, error: activityErr } = await aClient
    .from("joygo_activities")
    .select("id, title, body, event_at, location, signup_url")
    .eq("id", activity_id)
    .maybeSingle();

  if (activityErr) {
    console.error("Activity query error:", activityErr.message);
    return jsonResponse({ error: activityErr.message }, 400);
  }

  if (!activity) {
    return jsonResponse({ error: "Activity not found" }, 404);
  }

  const { data: notifications, error: notifErr } = await aClient
    .from("joygo_member_notifications")
    .select("id, user_id, email_override")
    .eq("activity_id", activity_id);

  if (notifErr) {
    console.error("Notification query error:", notifErr.message);
    return jsonResponse({ error: notifErr.message }, 400);
  }

  let sent_count = 0;
  let failed_count = 0;
  let skipped_count = 0;

  const title = activity.title ?? "Joy Go 活動通知";
  const content = activity.body ?? "";
  const eventTime = formatDate(activity.event_at);
  const location = activity.location ?? "";
  const signupUrl = activity.signup_url ?? "";

  const subject = `Joy Go 活動通知｜${title}`;

  const textParts = [
    "Joy Go 會員您好：",
    "",
    `【${title}】`,
    "",
    content,
  ];

  if (eventTime) {
    textParts.push("", `活動時間：${eventTime}`);
  }
  if (location) {
    textParts.push(`活動地點／方式：${location}`);
  }
  if (signupUrl) {
    textParts.push("", `報名／活動連結：${signupUrl}`);
  }
  textParts.push("", "Joy Go Platform");

  const text = textParts.join("\n");

  const html = `
<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
</head>
<body style="margin:0;padding:0;background:#f3ebdd;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#2f261f">
  <div style="max-width:640px;margin:0 auto;padding:24px 16px">
    <div style="background:#2b2117;color:white;padding:20px;border-radius:16px 16px 0 0">
      <div style="font-size:24px;font-weight:700">🔔 Joy Go 會員活動通知</div>
    </div>

    <div style="background:#fffaf2;border:1px solid #ddcdb7;border-top:none;padding:24px;border-radius:0 0 16px 16px">
      <div style="font-size:24px;font-weight:700;margin-bottom:18px;color:#2b2117">
        ${escapeHtml(title)}
      </div>

      ${
        eventTime
          ? `<div style="margin-bottom:8px;font-size:16px"><strong>活動時間：</strong>${escapeHtml(eventTime)}</div>`
          : ""
      }

      ${
        location
          ? `<div style="margin-bottom:18px;font-size:16px"><strong>活動地點／方式：</strong>${escapeHtml(location)}</div>`
          : ""
      }

      <div style="white-space:pre-wrap;line-height:1.8;font-size:17px;margin-top:18px">
        ${escapeHtml(content)}
      </div>

      ${
        signupUrl
          ? `<div style="text-align:center;margin-top:26px">
               <a href="${escapeHtml(signupUrl)}"
                  style="display:inline-block;background:#287a50;color:white;text-decoration:none;padding:12px 24px;border-radius:10px;font-size:17px;font-weight:700">
                 查看活動／報名
               </a>
             </div>`
          : ""
      }

      <div style="border-top:1px solid #ddcdb7;margin-top:28px;padding-top:18px;color:#746454;font-size:14px;line-height:1.6">
        此信由 Joy Go Platform 會員活動通知中心自動寄出。
      </div>
    </div>
  </div>
</body>
</html>`;

  for (const n of notifications ?? []) {
    try {
      let to: string | null = n.email_override ?? null;

      if (!to) {
        if (!n.user_id) throw new Error("Missing user_id");

        const { data: userData, error: userErr } =
          await aClient.auth.admin.getUserById(n.user_id);

        if (userErr) throw new Error(userErr.message);

        to = userData?.user?.email ?? null;
      }

      if (!to) {
        skipped_count += 1;
        continue;
      }

      await sendResendEmail({ to, subject, html, text });
      sent_count += 1;
    } catch (error) {
      failed_count += 1;
      console.error("Email send failed:", error);
    }
  }

  return jsonResponse({
    sent_count,
    failed_count,
    skipped_count,
  });
});
