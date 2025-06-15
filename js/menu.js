// menu.js - Controle de visibilidade do menu com base nos papéis dos usuários

// Função para atualizar a visibilidade do menu
function updateMenuVisibility() {
  console.debug("Executando updateMenuVisibility em", window.location.pathname);

  // Verifica o usuário autenticado usando a função checkAuth do auth.js
  const user = window.auth ? window.auth.checkAuth() : null;
  if (!user) {
    console.warn(
      "Nenhum usuário autenticado ou auth.js não carregado. Redirecionando para index.html"
    );
    window.location.href = "index.html";
    return;
  }

  console.log("Usuário autenticado:", user);

  // Verifica se o papel do usuário é válido
  if (!Object.values(window.auth.USER_ROLES).includes(user.role)) {
    console.error(`Papel inválido: ${user.role}. Limpando sessão.`);
    sessionStorage.removeItem("currentUser");
    localStorage.removeItem("tipoUsuario");
    window.location.href = "index.html";
    return;
  }

  // Seleciona todos os itens do menu
  const menuItems = {
    dashboard: document.getElementById("menuDashboard"),
    cadastro: document.getElementById("menuCadastro"),
    lista: document.getElementById("menuLista"),
    usuarios: document.getElementById("menuUsuarios"),
    visitantes: document.getElementById("menuVisitantes"),
    relatorios: document.getElementById("menuRelatorios"),
  };

  // Verifica se os itens do menu foram encontrados
  let itemsFound = false;
  for (const [key, element] of Object.entries(menuItems)) {
    if (element) {
      itemsFound = true;
      console.debug(`Item de menu encontrado: ${key} (${element.id})`);
    } else {
      console.warn(`Item de menu não encontrado: ${key}`);
    }
  }
  if (!itemsFound) {
    console.error("Nenhum item de menu encontrado. Verifique os IDs no HTML.");
    return;
  }

  // Define permissões por papel
  const rolePermissions = {
    [window.auth.USER_ROLES.ADMIN]: {
      dashboard: true,
      cadastro: true,
      lista: true,
      usuarios: true,
      visitantes: true,
      relatorios: true,
    },
    [window.auth.USER_ROLES.AGENT]: {
      dashboard: true,
      cadastro: true,
      lista: true,
      usuarios: false,
      visitantes: true,
      relatorios: false,
    },
    [window.auth.USER_ROLES.DIRECTOR]: {
      dashboard: true,
      cadastro: false,
      lista: true,
      usuarios: false,
      visitantes: false,
      relatorios: true,
    },
  };

  // Aplica permissões com base no papel do usuário
  const permissions = rolePermissions[user.role] || {};
  for (const [key, element] of Object.entries(menuItems)) {
    if (element) {
      const isVisible = permissions[key] === true;
      element.style.display = isVisible ? "flex" : "none";
      console.debug(
        `Item ${key} (${element.id}): display=${element.style.display}`
      );
    }
  }

  // Destaca o item do menu ativo
  highlightActiveMenuItem();
}

// Função para destacar o item do menu correspondente à página atual
function highlightActiveMenuItem() {
  const menuItems = document.querySelectorAll(".menu-item");
  const currentPath = window.location.pathname;

  menuItems.forEach((item) => {
    const href = item.getAttribute("href");
    // Remove classes de destaque
    item.classList.remove("bg-indigo-700", "text-white");

    // Adiciona destaque se o href corresponder à página atual
    if (href && currentPath.includes(href)) {
      item.classList.add("bg-indigo-700", "text-white");
      console.debug(`Destacando item do menu: ${href}`);
    }
  });
}

// Configuração inicial
document.addEventListener("DOMContentLoaded", function () {
  console.debug(
    "Evento DOMContentLoaded disparado em",
    window.location.pathname
  );

  // Aplica a visibilidade do menu apenas em páginas autenticadas
  if (!window.location.pathname.includes("index.html")) {
    if (!window.auth) {
      console.error(
        "auth.js não está carregado. Redirecionando para index.html"
      );
      window.location.href = "index.html";
      return;
    }
    updateMenuVisibility();
  }
});

// Exporta funções para uso em outros scripts
window.menu = {
  updateMenuVisibility,
  highlightActiveMenuItem,
};

document.getElementById("logoutBtn").addEventListener("click", function (e) {
  const confirmLogout = confirm("Tem a certeza que deseja sair?");
  if (confirmLogout) {
    // Redirecione ou execute a lógica de logout aqui
    console.log("Usuário confirmou o logout");
    // Exemplo: window.location.href = '/logout';
  } else {
    // Cancela o evento de logout
    console.log("Logout cancelado");
  }
});
