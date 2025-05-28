import {
  db,
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
  serverTimestamp,
} from "./firebase.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

const auth = getAuth();
const usersRef = collection(db, "users");

// Inicialização
document.addEventListener("DOMContentLoaded", async function () {
  await loadUsersTable();
  setupUserForm();
  setupConfirmModal();
});

// Carrega a tabela de usuários
async function loadUsersTable() {
  const tableBody = document.getElementById("usersTable");
  if (!tableBody) return;

  try {
    const q = query(usersRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-4 text-center text-gray-500">
              Nenhum usuário cadastrado
            </td>
          </tr>
        `;
      return;
    }

    querySnapshot.forEach((doc) => {
      const user = doc.data();
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50";
      row.innerHTML = `
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm font-medium text-gray-900">${user.name}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${user.email}
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(
              user.role
            )}">
              ${
                user.role === "admin" ? "Administrador" : "Agente Penitenciário"
              }
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            ${formatDate(user.createdAt?.toDate())}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="delete-user-btn text-red-600 hover:text-red-900" data-id="${
              doc.id
            }" data-email="${user.email}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `;
      tableBody.appendChild(row);
    });

    setupDeleteButtons();
  } catch (error) {
    console.error("Erro ao carregar usuários:", error);
    showError("Não foi possível carregar a lista de usuários");
  }
}

// Configura o formulário de cadastro
function setupUserForm() {
  const form = document.getElementById("userForm");
  if (!form) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("userName").value;
    const email = document.getElementById("userEmail").value;
    const password = document.getElementById("userPassword").value;
    const role = document.getElementById("userRole").value;

    try {
      // Cria o usuário no Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Salva os dados adicionais no Firestore
      await addDoc(usersRef, {
        id: user.uid,
        name: name,
        email: email,
        role: role,
        createdAt: serverTimestamp(),
      });

      Swal.fire({
        icon: "success",
        title: "Usuário cadastrado!",
        text: "O usuário foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        form.reset();
        loadUsersTable();
      });
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);

      let errorMessage = "Erro ao cadastrar usuário";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Este email já está em uso";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      }

      showError(errorMessage);
    }
  });
}

// Configura os botões de exclusão
function setupDeleteButtons() {
  document.querySelectorAll(".delete-user-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const userId = this.getAttribute("data-id");
      const userEmail = this.getAttribute("data-email");

      showConfirmModal(
        "Excluir Usuário",
        `Tem certeza que deseja excluir o usuário ${userEmail}? Esta ação não pode ser desfeita.`,
        () => deleteUser(userId, userEmail)
      );
    });
  });
}

// Exclui um usuário
async function deleteUser(userId, userEmail) {
  try {
    // ATENÇÃO: Em produção, você deve implementar também a exclusão do usuário no Authentication
    // await deleteUser(auth, userId);

    await deleteDoc(doc(db, "users", userId));

    Swal.fire(
      "Sucesso!",
      `O usuário ${userEmail} foi excluído do sistema.`,
      "success"
    ).then(() => {
      loadUsersTable();
    });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    showError("Não foi possível excluir o usuário");
  }
}

// Configura o modal de confirmação
function setupConfirmModal() {
  const modal = document.getElementById("confirmModal");
  const closeBtn = document.getElementById("closeConfirmModal");
  const cancelBtn = document.getElementById("cancelConfirm");
  const confirmBtn = document.getElementById("confirmAction");

  let confirmCallback = null;

  // Fecha o modal
  function closeModal() {
    modal.classList.add("hidden");
  }

  // Event listeners
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Configura o botão de confirmação
  confirmBtn.addEventListener("click", () => {
    if (confirmCallback) {
      confirmCallback();
    }
    closeModal();
  });

  // Função para mostrar o modal
  window.showConfirmModal = function (title, message, callback) {
    document.getElementById("confirmModalTitle").textContent = title;
    document.getElementById("confirmModalMessage").textContent = message;
    confirmCallback = callback;
    modal.classList.remove("hidden");
  };
}

// Funções auxiliares
function formatDate(date) {
  if (!date) return "N/A";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return date.toLocaleDateString("pt-BR", options);
}

function getRoleBadgeClass(role) {
  return role === "admin"
    ? "bg-purple-100 text-purple-800"
    : "bg-blue-100 text-blue-800";
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Erro",
    text: message,
    timer: 3000,
  });
}
