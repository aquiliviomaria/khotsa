// auth.js
import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "./firebase.js";

// Verifica o estado de autenticação
onAuthStateChanged(auth, (user) => {
  if (!user && !window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
  }
});

// Configura o botão de logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Swal.fire("Erro", "Não foi possível fazer logout.", "error");
    }
  });
}

// Configura o formulário de login
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      Swal.fire({
        icon: "success",
        title: "Login realizado!",
        text: "Redirecionando para o painel...",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        window.location.href = "dashboard.html";
      });
    } catch (error) {
      let errorMessage = "Erro ao fazer login";
      if (error.code === "auth/wrong-password") {
        errorMessage = "Senha incorreta";
      } else if (error.code === "auth/user-not-found") {
        errorMessage = "Usuário não encontrado";
      }

      Swal.fire({
        icon: "error",
        title: "Erro no login",
        text: errorMessage,
      });
    }
  });
}
