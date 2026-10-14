"use strict";

const SUPABASE_URL = "https://fdnifwjaqxhvtahpdalm.supabase.co";
const SUPABASE_KEY = "sb_publishable_sOOyh5xdnA1Yt2CdNW0tlg_5lFbGLuW";

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);

const authSection = $("auth-section");
const dashboard = $("dashboard-section");
const form = $("auth-form");
const emailInput = $("email");
const passwordInput = $("password");
const confirmPassword = $("confirm-password");
const confirmField = $("confirm-field");
const message = $("message");
const submitButton = $("submit-button");

let mode = "login";
let busy = false;

function showMessage(text, success = false) {
  message.textContent = text;
  message.className = success ? "success" : "";
}

function setMode(newMode) {
  mode = newMode;

  $("login-tab").classList.toggle("active", mode === "login");
  $("register-tab").classList.toggle("active", mode === "register");

  $("description").textContent =
    mode === "login"
      ? "Войдите в свой аккаунт"
      : "Создайте новый аккаунт";

  confirmField.classList.toggle("hidden", mode === "login");
  confirmPassword.required = mode === "register";

  submitButton.textContent =
    mode === "login" ? "Войти" : "Зарегистрироваться";

  showMessage("");
}

function showDashboard(user) {
  authSection.classList.add("hidden");
  dashboard.classList.remove("hidden");

  $("user-email").textContent = user.email || "Пользователь";
  $("avatar").textContent =
    (user.email || "U").charAt(0).toUpperCase();
}

function showAuth() {
  dashboard.classList.add("hidden");
  authSection.classList.remove("hidden");
}

$("login-tab").addEventListener("click", () => setMode("login"));
$("register-tab").addEventListener("click", () => setMode("register"));

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (busy) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (mode === "register") {
    if (password !== confirmPassword.value) {
      showMessage("Пароли не совпадают.");
      return;
    }

    if (password.length < 6) {
      showMessage("Пароль должен содержать минимум 6 символов.");
      return;
    }
  }

  busy = true;
  submitButton.disabled = true;
  submitButton.textContent = "Подождите...";

  try {
    if (mode === "login") {
      const { error } = await db.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } else {
      const { data, error } = await db.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      if (data.session) {
        showDashboard(data.user);
      } else {
        setMode("login");
        emailInput.value = email;
        passwordInput.value = "";
        showMessage(
          "Регистрация выполнена. Проверьте почту для подтверждения.",
          true
        );
      }
    }
  } catch (error) {
    console.error(error);

    const msg = error.message || "Неизвестная ошибка";

    if (msg.toLowerCase().includes("invalid login credentials")) {
      showMessage("Неверная почта или пароль.");
    } else if (msg.toLowerCase().includes("already registered")) {
      showMessage("Этот адрес уже зарегистрирован.");
    } else if (msg.toLowerCase().includes("email not confirmed")) {
      showMessage("Сначала подтвердите электронную почту.");
    } else {
      showMessage(msg);
    }
  } finally {
    busy = false;
    submitButton.disabled = false;
    submitButton.textContent =
      mode === "login" ? "Войти" : "Зарегистрироваться";
  }
});

$("logout-button").addEventListener("click", async () => {
  const button = $("logout-button");
  button.disabled = true;

  try {
    const { error } = await db.auth.signOut();
    if (error) throw error;

    showAuth();
    setMode("login");
    showMessage("Вы вышли из аккаунта.", true);
  } catch (error) {
    showMessage(error.message || "Не удалось выйти.");
  } finally {
    button.disabled = false;
  }
});

db.auth.onAuthStateChange((event, session) => {
  if (session?.user) {
    showDashboard(session.user);
  } else {
    showAuth();
  }
});

async function init() {
  try {
    const { data, error } = await db.auth.getSession();
    if (error) throw error;

    if (data.session?.user) {
      showDashboard(data.session.user);
    } else {
      showAuth();
    }
  } catch (error) {
    console.error("Ошибка сессии:", error);
    showMessage("Ошибка соединения с Supabase.");
  }
}

setMode("login");
init();
