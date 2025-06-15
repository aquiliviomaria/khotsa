// Armazenamento de usuários
let users = JSON.parse(localStorage.getItem("users")) || [];

// Inicializa o formulário de cadastro e tabela
document.addEventListener("DOMContentLoaded", function () {
  // Formulário de cadastro
  const userForm = document.getElementById("userForm");
  if (userForm) {
    userForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Coleta os dados do formulário
      const formData = new FormData(this);
      const userData = {
        id: Date.now().toString(),
        fullName: formData.get("userName"),
        email: formData.get("userEmail"),
        password: formData.get("userPassword"), // Na prática, isso deveria ser hashed
        role: formData.get("userRole"),
        createdAt: new Date().toISOString(),
        active: true,
      };

      // Verifica se o email já está cadastrado
      if (users.some((user) => user.email === userData.email)) {
        Swal.fire({
          icon: "error",
          title: "Email já cadastrado",
          text: "Já existe um usuário com este email no sistema.",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      // Adiciona ao array e salva no localStorage
      users.push(userData);
      localStorage.setItem("users", JSON.stringify(users));

      // Feedback ao usuário
      Swal.fire({
        icon: "success",
        title: "Usuário cadastrado!",
        text: "O usuário foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        this.reset();
        loadUsersTable(); // Atualiza a tabela
      });
    });
  }

  // Listagem de usuários
  if (document.getElementById("usersTable")) {
    loadUsersTable();
  }

  // Configura o modal de confirmação
  setupConfirmModal();
});

// Carrega a tabela de usuários
function loadUsersTable(filteredUsers = null) {
  const tableBody = document.getElementById("usersTable");
  const data = filteredUsers || users;

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhum usuário encontrado
                </td>
            </tr>
        `;
    return;
  }

  data.forEach((user) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition duration-150";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  user.fullName
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${user.email}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
                  user.role
                )}">
                    ${formatRole(user.role)}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(user.createdAt)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3" data-id="${
                  user.id
                }">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="${
                  user.active
                    ? "deactivate-btn text-yellow-600 hover:text-yellow-900"
                    : "activate-btn text-green-600 hover:text-green-900"
                } mr-3" data-id="${user.id}">
                    <i class="fas ${
                      user.active ? "fa-user-slash" : "fa-user-check"
                    }"></i>
                </button>
                <button class="delete-btn text-red-600 hover:text-red-900" data-id="${
                  user.id
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  // Configura botões de ação
  setupEditButtons();
  setupActivateButtons();
  setupDeleteButtons();
}

// Configura o modal de confirmação
function setupConfirmModal() {
  const modal = document.getElementById("confirmModal");
  const closeBtn = document.getElementById("closeConfirmModal");
  const cancelBtn = document.getElementById("cancelConfirm");
  const confirmBtn = document.getElementById("confirmAction");

  if (!modal) return;

  // Fecha o modal
  function closeModal() {
    modal.classList.add("hidden");
  }

  // Event listeners
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Variáveis para armazenar a ação a ser confirmada
  let confirmAction = null;
  let actionParams = null;

  // Configura o botão de confirmação
  confirmBtn.addEventListener("click", function () {
    if (confirmAction) {
      confirmAction(...actionParams);
    }
    closeModal();
  });

  // Função para mostrar o modal com uma ação específica
  window.showConfirmModal = function (title, message, action, ...params) {
    document.getElementById("confirmModalTitle").textContent = title;
    document.getElementById("confirmModalMessage").textContent = message;
    confirmAction = action;
    actionParams = params;
    modal.classList.remove("hidden");
  };
}

// Configura botões de edição
function setupEditButtons() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const user = users.find((u) => u.id === id);

      if (user) {
        // Preenche o formulário (você pode criar um modal de edição similar ao de prisioneiros)
        Swal.fire({
          title: "Editar Usuário",
          html: `
                        <form id="editUserForm" class="space-y-4">
                            <input type="hidden" id="editUserId" value="${
                              user.id
                            }">
                            <div class="space-y-2">
                                <label for="editUserName" class="block text-sm font-medium text-gray-700">Nome Completo</label>
                                <input type="text" id="editUserName" value="${
                                  user.fullName
                                }" required class="w-full px-4 py-2 border border-gray-300 rounded-md">
                            </div>
                            <div class="space-y-2">
                                <label for="editUserEmail" class="block text-sm font-medium text-gray-700">Email</label>
                                <input type="email" id="editUserEmail" value="${
                                  user.email
                                }" required class="w-full px-4 py-2 border border-gray-300 rounded-md">
                            </div>
                            <div class="space-y-2">
                                <label for="editUserRole" class="block text-sm font-medium text-gray-700">Tipo de Usuário</label>
                                <select id="editUserRole" required class="w-full px-4 py-2 border border-gray-300 rounded-md">
                                    <option value="admin" ${
                                      user.role === "admin" ? "selected" : ""
                                    }>Administrador</option>
                                    <option value="agent" ${
                                      user.role === "agent" ? "selected" : ""
                                    }>Agente Penitenciário</option>
                                    <option value="direct" ${
                                      user.role === "direct" ? "selected" : ""
                                    }>Diretor da Penitenciária</option>
                                </select>
                            </div>
                        </form>
                    `,
          showCancelButton: true,
          confirmButtonText: "Salvar",
          cancelButtonText: "Cancelar",
          focusConfirm: false,
          preConfirm: () => {
            const userId = document.getElementById("editUserId").value;
            const fullName = document.getElementById("editUserName").value;
            const email = document.getElementById("editUserEmail").value;
            const role = document.getElementById("editUserRole").value;

            // Validação básica
            if (!fullName || !email || !role) {
              Swal.showValidationMessage("Preencha todos os campos");
              return false;
            }

            // Verifica se o email já está em uso por outro usuário
            const emailInUse = users.some(
              (u) => u.id !== userId && u.email === email
            );
            if (emailInUse) {
              Swal.showValidationMessage(
                "Este email já está em uso por outro usuário"
              );
              return false;
            }

            return { userId, fullName, email, role };
          },
        }).then((result) => {
          if (result.isConfirmed) {
            const { userId, fullName, email, role } = result.value;
            const userIndex = users.findIndex((u) => u.id === userId);

            if (userIndex !== -1) {
              // Atualiza os dados do usuário
              users[userIndex] = {
                ...users[userIndex],
                fullName,
                email,
                role,
              };

              // Salva no localStorage
              localStorage.setItem("users", JSON.stringify(users));

              // Feedback e atualização
              Swal.fire({
                icon: "success",
                title: "Atualizado!",
                text: "Os dados do usuário foram atualizados.",
                timer: 1500,
                showConfirmButton: false,
              }).then(() => {
                loadUsersTable();
              });
            }
          }
        });
      }
    });
  });
}

// Configura botões de ativação/desativação
function setupActivateButtons() {
  document.querySelectorAll(".activate-btn, .deactivate-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const userIndex = users.findIndex((u) => u.id === id);

      if (userIndex !== -1) {
        const action = users[userIndex].active ? "desativar" : "ativar";

        showConfirmModal(
          `Confirmar ${action} usuário`,
          `Tem certeza que deseja ${action} este usuário?`,
          (userId) => {
            const userIdx = users.findIndex((u) => u.id === userId);
            if (userIdx !== -1) {
              users[userIdx].active = !users[userIdx].active;
              localStorage.setItem("users", JSON.stringify(users));
              loadUsersTable();

              Swal.fire({
                icon: "success",
                title: "Sucesso!",
                text: `Usuário ${action}do com sucesso.`,
                timer: 1500,
                showConfirmButton: false,
              });
            }
          },
          id
        );
      }
    });
  });
}

// Configura botões de exclusão
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");

      showConfirmModal(
        "Confirmar exclusão",
        "Tem certeza que deseja excluir permanentemente este usuário?",
        (userId) => {
          users = users.filter((u) => u.id !== userId);
          localStorage.setItem("users", JSON.stringify(users));
          loadUsersTable();

          Swal.fire({
            icon: "success",
            title: "Excluído!",
            text: "O usuário foi removido do sistema.",
            timer: 1500,
            showConfirmButton: false,
          });
        },
        id
      );
    });
  });
}

// Funções auxiliares
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}

function formatRole(role) {
  switch (role) {
    case "admin":
      return "Administrador";
    case "agent":
      return "Agente Penitenciário";
    case "direct":
      return "Diretor";
    default:
      return role;
  }
}

function getRoleBadgeClass(role) {
  switch (role) {
    case "admin":
      return "bg-purple-100 text-purple-800";
    case "agent":
      return "bg-blue-100 text-blue-800";
    case "direct":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
