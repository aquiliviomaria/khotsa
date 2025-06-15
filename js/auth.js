// auth.js - Sistema completo de autenticação e controle de acesso

// Enum de tipos de usuário
const USER_ROLES = {
  ADMIN: "admin",
  AGENT: "agent",
  DIRECTOR: "director",
};

// Cores para cada tipo de usuário
const ROLE_COLORS = {
  [USER_ROLES.ADMIN]: "bg-purple-600",
  [USER_ROLES.AGENT]: "bg-blue-600",
  [USER_ROLES.DIRECTOR]: "bg-green-600",
};

// Mensagens de boas-vindas personalizadas
const WELCOME_MESSAGES = {
  [USER_ROLES.ADMIN]: "Bem-vindo(a), Administrador(a)",
  [USER_ROLES.AGENT]: "Boa jornada, Agente",
  [USER_ROLES.DIRECTOR]: "Bom trabalho, Diretor(a)",
};

// Nomes formatados para cada cargo
const ROLE_NAMES = {
  [USER_ROLES.ADMIN]: "Administrador",
  [USER_ROLES.AGENT]: "Agente Penitenciário",
  [USER_ROLES.DIRECTOR]: "Diretor",
};

// Inicializa usuários padrão
function initializeDefaultUsers() {
  let users = JSON.parse(localStorage.getItem("users")) || [];

  // Admin padrão
  if (!users.some((u) => u.email === "admin@gmail.com")) {
    users.push({
      id: "admin-1",
      fullName: "Administrador Principal",
      email: "admin@gmail.com",
      password: "1234",
      role: USER_ROLES.ADMIN,
      createdAt: new Date().toISOString(),
      active: true,
    });
  }

  // Director padrão
  if (!users.some((u) => u.email === "director@gmail.com")) {
    users.push({
      id: "director-1",
      fullName: "Diretor Principal",
      email: "director@gmail.com",
      password: "1234",
      role: USER_ROLES.DIRECTOR,
      createdAt: new Date().toISOString(),
      active: true,
    });
  }

  // Corrige papéis inválidos (ex.: "direct" para "director")
  users = users.map(user => {
    if (user.role === "direct") {
      console.warn(`Corrigindo papel inválido 'direct' para 'director' para o usuário ${user.email}`);
      user.role = USER_ROLES.DIRECTOR;
    }
    return user;
  });

  localStorage.setItem("users", JSON.stringify(users));
}

// Função de login completa
function login(email, password) {
  const users = JSON.parse(localStorage.getItem("users")) || [];
  const user = users.find((u) => u.email === email && u.active === true);

  if (!user) return { success: false, message: "Usuário ou Senha incorreta" };
  if (user.password !== password)
    return { success: false, message: "Usuário ou Senha incorreta" };

  // Valida o papel do usuário
  if (!Object.values(USER_ROLES).includes(user.role)) {
    console.error(`Papel inválido encontrado: ${user.role}`);
    return { success: false, message: "Papel de usuário inválido" };
  }

  // Prepara dados do usuário para exibição
  const userData = {
    id: user.id,
    fullName: user.fullName,
    email:

 user.email,
    role: user.role,
    initials: getInitials(user.fullName),
    roleColor: ROLE_COLORS[user.role],
    roleName: ROLE_NAMES[user.role],
    welcomeMessage: WELCOME_MESSAGES[user.role],
    lastLogin: new Date().toISOString(),
  };

  // Armazena dados na session e local storage
  sessionStorage.setItem("currentUser", JSON.stringify(userData));
  localStorage.setItem("tipoUsuario", user.role);

  return { success: true, user: userData };
}

// Obtém iniciais do nome (2 primeiras letras)
function getInitials(fullName) {
  return fullName
    .split(" ")
    .filter((name) => name.length > 0)
    .map((name) => name[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

// Verifica autenticação e redireciona se necessário
function checkAuth(requiredRoles = []) {
  const user =
    JSON.parse(sessionStorage.getItem("currentUser")) ||
    JSON.parse(localStorage.getItem("lastLoggedUser"));

  if (!user) {
    console.warn("Nenhum usuário autenticado encontrado, redirecionando para index.html");
    window.location.href = "index.html";
    return null;
  }

  if (!Object.values(USER_ROLES).includes(user.role)) {
    console.error(`Papel inválido no usuário autenticado: ${user.role}`);
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("tipoUsuario");
    window.location.href = "index.html";
    return null;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    console.warn(`Acesso não autorizado para o papel ${user.role}, redirecionando para dashboard.html`);
    window.location.href = "dashboard.html";
    return null;
  }

  return user;
}

// Atualiza a UI com informações do usuário
function updateUserUI() {
  const user = checkAuth();
  if (!user) return;

  // Atualiza elementos de boas-vindas
  document.querySelectorAll(".user-info-container").forEach((container) => {
    container.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="h-10 w-10 ${user.roleColor} rounded-full flex items-center justify-center text-white font-bold text-sm">
          ${user.initials}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">${user.fullName}</p>
          <p class="text-xs text-gray-500">${user.roleName}</p>
        </div>
      </div>
    `;
  });

  // Atualiza mensagem de boas-vindas
  document.querySelectorAll(".welcome-message").forEach((el) => {
    el.textContent = user.welcomeMessage;
  });
}

// Configuração inicial
document.addEventListener("DOMContentLoaded", function () {
  initializeDefaultUsers();

  // Configura formulário de login
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      const result = login(email, password);
      if (result.success) {
        window.location.href = "dashboard.html";
      } else {
        Swal.fire({
          icon: "error",
          title: "Erro no login",
          text: result.message,
        });
      }
    });
  }

  // Configura botão de logout
  document.getElementById("logoutBtn")?.addEventListener("click", function () {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("tipoUsuario");
    window.location.href = "index.html";
  });

  // Atualiza UI do usuário se estiver em página autenticada
  if (!window.location.pathname.includes("index.html")) {
    updateUserUI();
  }
});

// Exporta funções
window.auth = {
  USER_ROLES,
  checkAuth,
  login,
  logout: function () {
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("tipoUsuario");
    window.location.href = "index.html";
  },
};