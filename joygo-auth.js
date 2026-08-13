import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./joygo-supabase-config.js";

const $ = (id) => document.getElementById(id);
const form = $("authForm");
const email = $("email");
const password = $("password");
const name = $("displayName");
const message = $("message");
const account = $("account");
const signOutButton = $("signOut");
const submitButton = $("submitButton");
let mode = "login";

const say = (text, type = "") => {
  message.textContent = text;
  message.className = `message ${type}`;
};

if (!isSupabaseConfigured()) {
  say("會員後端尚未完成連線設定。目前頁面可預覽，但不能註冊或登入。", "notice");
  submitButton.disabled = true;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const renderUser = (user) => {
    const loggedIn = Boolean(user);
    form.hidden = loggedIn;
    account.hidden = !loggedIn;
    $("platformLink").textContent = loggedIn ? "進入會員平台" : "訪客直接試玩";
    if (user) {
      $("memberEmail").textContent = user.email || "會員";
      $("memberName").textContent = user.user_metadata?.display_name || "Joy Go 棋友";
    }
  };

  const { data } = await supabase.auth.getSession();
  renderUser(data.session?.user);
  supabase.auth.onAuthStateChange((_event, session) => renderUser(session?.user));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    say("處理中…");
    submitButton.disabled = true;
    try {
      if (mode === "register") {
        const { data: result, error } = await supabase.auth.signUp({
          email: email.value.trim(),
          password: password.value,
          options: {
            data: { display_name: name.value.trim() || "Joy Go 棋友" },
            emailRedirectTo: new URL("joygo-auth.html", window.location.href).href
          }
        });
        if (error) throw error;
        say(result.session ? "註冊完成，已登入。" : "註冊完成，請到信箱點選驗證連結。", "success");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.value.trim(), password: password.value });
        if (error) throw error;
        say("登入成功。", "success");
      }
    } catch (error) {
      const known = { "Invalid login credentials": "Email 或密碼不正確。", "User already registered": "這個 Email 已經註冊。" };
      say(known[error.message] || `操作失敗：${error.message}`, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  signOutButton.addEventListener("click", async () => {
    await supabase.auth.signOut();
    say("已安全登出。", "success");
  });
}

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
  name.closest("label").hidden = mode !== "register";
  submitButton.textContent = mode === "register" ? "建立會員帳號" : "登入";
  say("");
}));
