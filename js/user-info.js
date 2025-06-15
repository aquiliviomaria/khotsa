// user-info.js - Atualiza a área do usuário

document.addEventListener("DOMContentLoaded", function () {
  const user = JSON.parse(sessionStorage.getItem("currentUser"));
  if (!user) {
    console.warn("Nenhum usuário encontrado no sessionStorage.");
    return;
  }

  // Valida o papel do usuário
  if (!Object.values(window.auth.USER_ROLES).includes(user.role)) {
    console.error(`Papel inválido no usuário: ${user.role}. Redirecionando para index.html`);
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
    return;
  }

  // Atualiza a área do usuário no header
  const userInfoContainers = document.querySelectorAll(".user-info-container");

  userInfoContainers.forEach((container) => {
    // Cria ou atualiza o conteúdo
    container.innerHTML = `
      <div class="flex items-center space-x-2">
        <div class="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold ${getRoleColorClass(user.role)}">
          ${user.initials}
        </div>
        <div>
          <p class="text-sm font-medium text-gray-700">${user.fullName}</p>
          <p class="text-xs text-gray-500">${user.roleName}</p>
        </div>
      </div>
    `;
  });

  // Adiciona mensagem de boas-vindas (opcional)
  const welcomeContainer = document.getElementById("welcome-message");
  if (welcomeContainer) {
    welcomeContainer.textContent = user.welcomeMessage;
  }
});

function getRoleColorClass(role) {
  const colors = {
    [window.auth.USER_ROLES.ADMIN]: "bg-purple-600",
    [window.auth.USER_ROLES.AGENT]: "bg-blue-600",
    [window.auth.USER_ROLES.DIRECTOR]: "bg-green-600",
  };
  return colors[role] || "bg-indigo-600";
}