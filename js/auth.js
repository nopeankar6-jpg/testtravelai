import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


//  ⚠️  Config api

const firebaseConfig = {
  apiKey: "AIzaSyAgF4Le5kfzuk8KKeod8HOOIWVOKEuuDtE",
  authDomain: "travel-ai-cd422.firebaseapp.com",
  projectId: "travel-ai-cd422",
  storageBucket: "travel-ai-cd422.firebasestorage.app",
  messagingSenderId: "88888788030",
  appId: "1:88888788030:web:e5f4172867f724bc6bfd6f",
  measurementId: "G-DPP0KL1FQH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

//  DOM Elements
const authModal      = document.getElementById("authModal");
const tabLogin       = document.getElementById("tab-login");
const tabRegister    = document.getElementById("tab-register");
const formLogin      = document.getElementById("form-login");
const formRegister   = document.getElementById("form-register");
const btnOpenLogin   = document.getElementById("openLogin");
const btnCloseAuth   = document.getElementById("closeAuth");
const userMenu       = document.getElementById("user-menu");
const userAvatar     = document.getElementById("user-avatar");
const userDisplayName = document.getElementById("user-display-name");
const btnLogout      = document.getElementById("btn-logout");

function openModal(tab = "login") {
  authModal.classList.add("open");
  document.body.style.overflow = "hidden";
  switchTab(tab);
}

function closeModal() {
  authModal.classList.remove("open");
  document.body.style.overflow = "";
  clearErrors();
}

btnOpenLogin?.addEventListener("click", () => openModal("login"));
btnCloseAuth?.addEventListener("click", closeModal);
authModal?.addEventListener("click", (e) => {
  if (e.target === authModal) closeModal();
});

function switchTab(tab) {
  const isLogin = tab === "login";
  tabLogin.classList.toggle("active", isLogin);
  tabRegister.classList.toggle("active", !isLogin);
  formLogin.classList.toggle("hidden", !isLogin);
  formRegister.classList.toggle("hidden", isLogin);
  clearErrors();
}

tabLogin?.addEventListener("click", () => switchTab("login"));
tabRegister?.addEventListener("click", () => switchTab("register"));

document.getElementById("link-to-register")?.addEventListener("click", (e) => {
  e.preventDefault();
  switchTab("register");
});
document.getElementById("link-to-login")?.addEventListener("click", (e) => {
  e.preventDefault();
  switchTab("login");
});
function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) { el.textContent = message; el.style.display = "block"; }
}
function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => {
    el.textContent = "";
    el.style.display = "none";
  });
}
function translateFirebaseError(code) {
  const map = {
    "auth/email-already-in-use":    "Email này đã được đăng ký.",
    "auth/invalid-email":           "Email không hợp lệ.",
    "auth/weak-password":           "Mật khẩu phải có ít nhất 6 ký tự.",
    "auth/user-not-found":          "Không tìm thấy tài khoản với email này.",
    "auth/wrong-password":          "Mật khẩu không đúng.",
    "auth/invalid-credential":      "Email hoặc mật khẩu không đúng.",
    "auth/too-many-requests":       "Quá nhiều lần thử. Vui lòng thử lại sau.",
    "auth/network-request-failed":  "Lỗi kết nối mạng.",
  };
  return map[code] || "Đã xảy ra lỗi. Vui lòng thử lại.";
}
formRegister?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const name     = document.getElementById("reg-name").value.trim();
  const email    = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const confirm  = document.getElementById("reg-confirm").value;
  let hasError = false;
  if (!name) { showError("err-reg-name", "Vui lòng nhập họ tên."); hasError = true; }
  if (!email) { showError("err-reg-email", "Vui lòng nhập email."); hasError = true; }
  if (password.length < 6) { showError("err-reg-password", "Mật khẩu phải có ít nhất 6 ký tự."); hasError = true; }
  if (password !== confirm) { showError("err-reg-confirm", "Mật khẩu xác nhận không khớp."); hasError = true; }
  if (hasError) return;

  const btn = formRegister.querySelector(".btn-auth-submit");
  setLoading(btn, true);

  try {
    // Tạo tài khoản Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    // Cập nhật displayName
    await updateProfile(user, { displayName: name });

    // Lưu thông tin vào Firestore (collection "users")
    await setDoc(doc(db, "users", user.uid), {
      uid:       user.uid,
      name:      name,
      email:     email,
      createdAt: serverTimestamp(),
      trips:     [],
      saved:     [],
    });

    closeModal();
    showToast(`Chào mừng ${name} đến với TravelAI! 🎉`);
  } catch (err) {
    showError("err-reg-email", translateFirebaseError(err.code));
  } finally {
    setLoading(btn, false);
  }
});
formLogin?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const email    = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;

  if (!email)    { showError("err-login-email", "Vui lòng nhập email."); return; }
  if (!password) { showError("err-login-password", "Vui lòng nhập mật khẩu."); return; }

  const btn = formLogin.querySelector(".btn-auth-submit");
  setLoading(btn, true);

  try {
    await signInWithEmailAndPassword(auth, email, password);
if (window._redirectAfterLogin) {
  const redirect = window._redirectAfterLogin;
  window._redirectAfterLogin = null;
  window.location.href = redirect;
  return;
}
    closeModal();
    showToast("Đăng nhập thành công! Chào mừng trở lại 👋");
  } catch (err) {
    showError("err-login-password", translateFirebaseError(err.code));
  } finally {
    setLoading(btn, false);
  }
});
//  Đăng xuất
btnLogout?.addEventListener("click", async () => {
  await signOut(auth);
  showToast("Đã đăng xuất.");
});
//  Theo dõi trạng thái auth → cập nhật UI navbar
onAuthStateChanged(auth, async (user) => {
  if (user) {
    window._isLoggedIn = true;
    btnOpenLogin && (btnOpenLogin.style.display = "none");
    if (userMenu) userMenu.style.display = "flex";
 
    // Lấy tên từ Firestore (fallback về displayName)
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      const name = snap.exists() ? snap.data().name : user.displayName;
      const initial = (name || "U")[0].toUpperCase();
 
      if (userDisplayName) userDisplayName.textContent = name || "Bạn";
      if (userAvatar) userAvatar.textContent = initial;
 
      // Cập nhật dropdown
      const dropdownAvatar = document.getElementById("dropdown-avatar");
      const dropdownEmail  = document.getElementById("user-display-email");
      if (dropdownAvatar) dropdownAvatar.textContent = initial;
      if (dropdownEmail)  dropdownEmail.textContent  = user.email || "";
    } catch {
      if (userDisplayName) userDisplayName.textContent = user.displayName || "Bạn";
    }
  } else {
    window._isLoggedIn = false;
    btnOpenLogin && (btnOpenLogin.style.display = "");
    if (userMenu) userMenu.style.display = "none";
  }
});
function setLoading(btn, loading) {
  if (!btn) return;
  btn.disabled = loading;
  btn.dataset.original = btn.dataset.original || btn.textContent;
  btn.textContent = loading ? "Đang xử lý..." : btn.dataset.original;
}

function showToast(message) {
  let toast = document.getElementById("auth-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "auth-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3500);
}

// Export để dùng ở file khác nếu cần
export { auth, db, openModal };
