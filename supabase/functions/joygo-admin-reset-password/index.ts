import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {

  "Access-Control-Allow-Origin": "*",

  "Access-Control-Allow-Headers":

    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods": "POST, OPTIONS",

};

Deno.serve(async (req) => {

  if (req.method === "OPTIONS") {

    return new Response("ok", { headers: corsHeaders });

  }

  const json = (

    status: number,

    body: Record<string, unknown>,

  ) =>

    new Response(JSON.stringify(body), {

      status,

      headers: {

        ...corsHeaders,

        "Content-Type": "application/json",

      },

    });

  try {

    if (req.method !== "POST") {

      return json(405, {

        ok: false,

        error: "Method not allowed",

      });

    }

    const supabaseUrl =

      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =

      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {

      return json(500, {

        ok: false,

        error: "Server environment is incomplete",

      });

    }

    const authHeader =

      req.headers.get("Authorization") || "";

    const token =

      authHeader

        .replace(/^Bearer\s+/i, "")

        .trim();

    if (!token) {

      return json(401, {

        ok: false,

        error: "請先登入主管理員",

      });

    }

    const admin = createClient(

      supabaseUrl,

      serviceRoleKey,

      {

        auth: {

          persistSession: false,

          autoRefreshToken: false,

        },

      },

    );

    const {

      data: userData,

      error: userError,

    } = await admin.auth.getUser(token);

    const requester = userData?.user;

    if (userError || !requester) {

      return json(401, {

        ok: false,

        error: "主管理員登入狀態無效",

      });

    }

    const {

      data: profile,

      error: profileError,

    } = await admin

      .from("profiles")

      .select("id,role")

      .eq("id", requester.id)

      .maybeSingle();

    if (

      profileError ||

      !profile ||

      String(profile.role).toLowerCase() !== "admin"

    ) {

      return json(403, {

        ok: false,

        error: "只有主管理員可以直接重設會員密碼",

      });

    }

    const body =

      await req.json().catch(() => null);

    const targetUserId =

      String(body?.target_user_id || "").trim();

    const newPassword =

      String(body?.new_password || "");

    if (!targetUserId) {

      return json(400, {

        ok: false,

        error: "缺少會員 ID",

      });

    }

    if (newPassword.length < 8) {

      return json(400, {

        ok: false,

        error: "新密碼至少需要 8 碼",

      });

    }

    if (targetUserId === requester.id) {

      return json(400, {

        ok: false,

        error:

          "主管理員自己的密碼請使用一般修改密碼流程",

      });

    }

    const { error: updateError } =

      await admin.auth.admin.updateUserById(

        targetUserId,

        {

          password: newPassword,

        },

      );

    if (updateError) {

      return json(400, {

        ok: false,

        error: updateError.message,

      });

    }

    return json(200, {

      ok: true,

    });

  } catch (e) {

    return json(500, {

      ok: false,

      error:

        e instanceof Error

          ? e.message

          : String(e),

    });

  }

});
