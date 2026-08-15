import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./joygo-supabase-config.js";

const $ = (id) => document.getElementById(id);
const notice = $("notice");
const content = $("content");
const rows = $("rows");
const empty = $("empty");
let profiles = [];
let currentUserId = "";

function say(text, type = "") {
  notice.textContent = text;
  notice.className = `notice ${type}`;
}

function dateValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function displayDate(value) {
  return value ? new Date(value).toLocaleDateString("zh-TW") : "永久";
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
}

function updateStats() {
  $("total").textContent = profiles.length;
  $("members").textContent = profiles.filter((p) => p.role === "member").length;
  $("trials").textContent = profiles.filter((p) => p.role === "trial").length;
  $("suspended").textContent = profiles.filter((p) => p.status === "suspended").length;
}

function render() {
  const term = $("search").value.trim().toLowerCase();
  const filtered = profiles.filter((p) => `${p.display_name} ${p.email}`.toLowerCase().includes(term));
  empty.hidden = filtered.length > 0;
  rows.innerHTML = filtered.map((p) => {
    const isMe = p.id === currentUserId;
    const isAdmin = p.role === "admin";
    const disabled = isMe || isAdmin ? "disabled" : "";
    return `<tr data-id="${p.id}">
      <td><span class="member-name">${escapeHtml(p.display_name || "Joy Go 棋友")}</span>${isMe ? '<span class="me">目前帳號</span>' : ""}<br><span class="email">${escapeHtml(p.email || "")}</span></td>
      <td>${isAdmin ? '<span class="pill admin">管理員</span>' : `<select class="role" ${disabled}><option value="trial" ${p.role === "trial" ? "selected" : ""}>試用會員</option><option value="member" ${p.role === "member" ? "selected" : ""}>正式會員</option></select>`}</td>
      <td>${isAdmin ? '<span class="pill active">正常</span>' : `<select class="status" ${disabled}><option value="active" ${p.status === "active" ? "selected" : ""}>正常</option><option value="suspended" ${p.status === "suspended" ? "selected" : ""}>停權</option></select>`}</td>
      <td>${isAdmin ? "永久" : `<input class="date" type="date" value="${dateValue(p.expires_at)}" ${disabled}>`}</td>
      <td>${displayDate(p.created_at)}</td>
      <td><button class="save" type="button" ${disabled}>儲存</button></td>
    </tr>`;
  }).join("");
}

if (!isSupabaseConfigured()) {
  say("Supabase 尚未設定，無法開啟會員管理。", "error");
} else {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async function loadMembers() {
    say("正在讀取會員資料…");
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      say("尚未登入。請先到會員中心用朱老師帳號登入。", "error");
      content.hidden = true;
      return;
    }
    currentUserId = user.id;
    const { data: me, error: meError } = await supabase.from("profiles").select("id,role,status").eq("id", user.id).single();
    if (meError || me?.role !== "admin" || me?.status !== "active") {
      say("此頁只有啟用中的管理員可以使用。", "error");
      content.hidden = true;
      return;
    }
    const { data, error } = await supabase.from("profiles").select("id,email,display_name,role,status,expires_at,created_at").order("created_at", { ascending: true });
    if (error) {
      say(`無法讀取會員：${error.message}`, "error");
      content.hidden = true;
      return;
    }
    profiles = data || [];
    updateStats();
    render();
    content.hidden = false;
    say(`管理員驗證成功，共 ${profiles.length} 位會員。`, "success");
  }

  rows.addEventListener("click", async (event) => {
    const button = event.target.closest(".save");
    if (!button) return;
    const row = button.closest("tr");
    const id = row.dataset.id;
    const role = row.querySelector(".role")?.value;
    const status = row.querySelector(".status")?.value;
    const expires = row.querySelector(".date")?.value;
    if (!id || id === currentUserId || !role || !status) return;
    button.disabled = true;
    button.textContent = "儲存中…";
    const changes = { role, status, expires_at: expires ? new Date(`${expires}T23:59:59`).toISOString() : null, updated_at: new Date().toISOString() };
    const { error } = await supabase.from("profiles").update(changes).eq("id", id);
    if (error) {
      say(`儲存失敗：${error.message}`, "error");
      button.disabled = false;
      button.textContent = "儲存";
      return;
    }
    say("會員資料已更新。", "success");
    await loadMembers();
  });

  $("search").addEventListener("input", render);
  $("clearSearch").addEventListener("click", () => { $("search").value = ""; render(); });
  $("refresh").addEventListener("click", loadMembers);
  supabase.auth.onAuthStateChange((_event, session) => { if (!session) loadMembers(); });
  await loadMembers();
}
