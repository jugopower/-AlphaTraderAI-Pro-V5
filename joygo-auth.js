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
const forgotPasswordButton = $("forgotPassword");
const recoveryForm = $("recoveryForm");
const newPassword = $("newPassword");
const confirmPassword = $("confirmPassword");
const updatePasswordButton = $("updatePassword");
let mode = "login";
let recovering = new URLSearchParams(location.search).get("mode") === "recovery";

const say = (text, type = "") => {
  message.textContent = text;
  message.className = `message ${type}`;
};

if (!isSupabaseConfigured()) {
  say("會員後端尚未完成連線設定。目前頁面可預覽，但不能註冊或登入。", "notice");
  submitButton.disabled = true;
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const roleNames = { admin: "管理員", member: "正式會員", trial: "試用會員" };
  const formatDate = (value) => value ? new Intl.DateTimeFormat("zh-TW", { dateStyle: "long" }).format(new Date(value)) : "永久";
  const renderUser = async (user) => {
    if (recovering) {
      form.hidden = true;
      account.hidden = true;
      recoveryForm.hidden = false;
      return;
    }
    const loggedIn = Boolean(user);
    form.hidden = loggedIn;
    account.hidden = !loggedIn;
    $("adminLink").hidden = true;
    $("platformLink").classList.remove("disabled");
    $("platformLink").textContent = loggedIn ? "正在確認會員資格…" : "訪客直接試玩";
    if (user) {
      $("memberEmail").textContent = user.email || "會員";
      $("memberName").textContent = user.user_metadata?.display_name || "Joy Go 棋友";
      const { data: profile, error } = await supabase.from("profiles").select("display_name,role,status,expires_at").eq("id", user.id).single();
      if (error || !profile) {
        $("memberInfo").textContent = "無法讀取會員資格，請聯絡管理員。";
        $("memberInfo").classList.add("blocked");
        $("platformLink").textContent = "暫時無法進入會員平台";
        $("platformLink").classList.add("disabled");
        return;
      }
      $("memberName").textContent = profile.display_name || user.user_metadata?.display_name || "Joy Go 棋友";
      const expired = profile.role !== "admin" && profile.expires_at && new Date(profile.expires_at).getTime() < Date.now();
      const active = profile.status === "active" && !expired;
      $("memberInfo").classList.toggle("blocked", !active);
      $("memberInfo").innerHTML = active ? `身分：${roleNames[profile.role] || profile.role}<br>有效期限：${formatDate(profile.expires_at)}` : profile.status === "suspended" ? "帳號已停用，請聯絡管理員。" : "會員資格已到期，請聯絡管理員續期。";
      $("platformLink").textContent = active ? "進入會員平台" : "目前無法進入會員平台";
      $("platformLink").classList.toggle("disabled", !active);
      $("adminLink").hidden = !(active && profile.role === "admin");
    }
  };

  const { data } = await supabase.auth.getSession();
  await renderUser(data.session?.user);
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") recovering = true;
    setTimeout(() => renderUser(session?.user), 0);
  });

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

  forgotPasswordButton.addEventListener("click", async () => {
    const address = email.value.trim();
    if (!address) {
      say("請先輸入註冊時使用的 Email。", "error");
      email.focus();
      return;
    }
    forgotPasswordButton.disabled = true;
    say("正在寄送重設密碼信…", "notice");
    const redirectTo = new URL("joygo-auth.html?mode=recovery", window.location.href).href;
    const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
    forgotPasswordButton.disabled = false;
    say(error ? `寄送失敗：${error.message}` : "重設信已寄出，請查看收件匣或垃圾郵件。", error ? "error" : "success");
  });

  updatePasswordButton.addEventListener("click", async () => {
    const passwordValue = newPassword.value;
    if (passwordValue.length < 8) return say("新密碼至少需要 8 個字元。", "error");
    if (passwordValue !== confirmPassword.value) return say("兩次輸入的密碼不相同。", "error");
    updatePasswordButton.disabled = true;
    say("正在更新密碼…", "notice");
    const { error } = await supabase.auth.updateUser({ password: passwordValue });
    updatePasswordButton.disabled = false;
    if (error) return say(`更新失敗：${error.message}`, "error");
    recovering = false;
    recoveryForm.hidden = true;
    history.replaceState({}, "", "joygo-auth.html");
    say("密碼更新成功，您已安全登入。", "success");
    const { data: current } = await supabase.auth.getSession();
    await renderUser(current.session?.user);
  });
}

document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
  mode = button.dataset.mode;
  document.querySelectorAll("[data-mode]").forEach((item) => item.classList.toggle("active", item === button));
  name.closest("label").hidden = mode !== "register";
  submitButton.textContent = mode === "register" ? "建立會員帳號" : "登入";
  forgotPasswordButton.hidden = mode !== "login";
  password.autocomplete = mode === "register" ? "new-password" : "current-password";
  say("");
}));
