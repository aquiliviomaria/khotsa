import {
  auth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  db,
  doc,
  getDoc,
} from "./firebase.js";

// Verifica o estado de autenticação
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Verifica o tipo de usuário
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const userData = userDoc.data();

      // Redireciona se tentar acessar página não permitida
      if (!hasPermission(userData.role)) {
        window.location.href = "dashboard.html";
      }

      // Atualiza UI com informações do usuário
      updateUserUI(userData);
    } else {
      // Usuário não registrado no Firestore - faz logout
      await signOut(auth);
      window.location.href = "index.html";
    }
  } else if (!window.location.pathname.includes("index.html")) {
    window.location.href = "index.html";
  }
});

// Verifica permissões de acesso
function hasPermission(userRole) {
  const currentPage = window.location.pathname.split("/").pop();

  // Páginas permitidas para agentes
  const agentAllowedPages = ["dashboard.html", "lista.html", "cadastro.html"];

  if (userRole === "agent") {
    return agentAllowedPages.includes(currentPage);
  }

  // Admin tem acesso a tudo
  return true;
}

// Atualiza a UI com informações do usuário
function updateUserUI(userData) {
  const userElements = document.querySelectorAll(
    ".user-name, .user-initials, .user-role"
  );

  userElements.forEach((el) => {
    if (el.classList.contains("user-name")) {
      el.textContent = userData.name || userData.email;
    }
    if (el.classList.contains("user-initials")) {
      el.textContent = userData.name
        ? userData.name.charAt(0)
        : userData.email.charAt(0);
    }
    if (el.classList.contains("user-role")) {
      el.textContent = userData.role === "admin" ? "Admin" : "Agente";
    }
  });

  // Ajusta o menu lateral conforme permissões
  adjustSidebar(userData.role);
}

// Ajusta o menu lateral conforme o tipo de usuário
function adjustSidebar(userRole) {
  if (userRole === "agent") {
    // Esconde itens não permitidos para agentes
    document.querySelectorAll(".admin-only").forEach((el) => {
      el.style.display = "none";
    });
  }
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

      // Verifica se o usuário está registrado no Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        window.location.href = "dashboard.html";
      } else {
        await signOut(auth);
        Swal.fire(
          "Erro",
          "Você não tem permissão para acessar o sistema.",
          "error"
        );
      }
    } catch (error) {
      console.error("Erro no login:", error);
      Swal.fire("Erro", "Email ou senha incorretos.", "error");
    }
  });
}

// Configura o botão de logout
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async function () {
    try {
      await signOut(auth);
      window.location.href = "index.html";
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  });
}
