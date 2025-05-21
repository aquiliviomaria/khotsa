import {
  db,
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "./firebase.js";

// Referências às coleções
const visitorsRef = collection(db, "visitors");
const visitsRef = collection(db, "visits");
const prisonersRef = collection(db, "prisoners");

// Carrega prisioneiros para o select
async function loadPrisonersForSelect() {
  const select = document.getElementById("prisonerSelect");
  if (!select) return;

  try {
    const q = query(prisonersRef, orderBy("fullName"));
    const querySnapshot = await getDocs(q);
    select.innerHTML = '<option value="">Selecione um prisioneiro</option>';

    querySnapshot.forEach((doc) => {
      const prisoner = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${prisoner.fullName} (${prisoner.processNumber})`;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar prisioneiros:", error);
    showError("Não foi possível carregar a lista de prisioneiros");
  }
}

// Carrega visitantes
async function loadVisitors(searchTerm = "") {
  const tableBody = document.getElementById("visitorsTable");
  if (!tableBody) return;

  try {
    let q;
    if (searchTerm) {
      q = query(
        visitorsRef,
        where("name", ">=", searchTerm),
        where("name", "<=", searchTerm + "\uf8ff")
      );
    } else {
      q = query(visitorsRef, orderBy("createdAt", "desc"));
    }

    const querySnapshot = await getDocs(q);
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-4 text-center text-gray-500">
            Nenhum visitante encontrado
          </td>
        </tr>
      `;
      return;
    }

    // Carrega os prisioneiros para mapear IDs para nomes
    const prisonersSnapshot = await getDocs(prisonersRef);
    const prisonersMap = {};
    prisonersSnapshot.forEach((doc) => {
      prisonersMap[doc.id] = doc.data().fullName;
    });

    querySnapshot.forEach((doc) => {
      const visitor = doc.data();
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50";
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap">
          <img src="${visitor.photo || "https://via.placeholder.com/150"}" 
               alt="${visitor.name}" 
               class="h-10 w-10 rounded-full object-cover">
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="text-sm font-medium text-gray-900">${visitor.name}</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${visitor.document}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${prisonersMap[visitor.prisonerId] || "N/A"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${visitor.relation}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="view-visitor-btn text-blue-600 hover:text-blue-900 mr-3" 
                  data-id="${doc.id}" title="Ver detalhes">
            <i class="fas fa-eye"></i>
          </button>
          <button class="register-visit-btn text-indigo-600 hover:text-indigo-900 mr-3" 
                  data-id="${doc.id}" title="Registrar visita">
            <i class="fas fa-calendar-check"></i>
          </button>
          <button class="delete-visitor-btn text-red-600 hover:text-red-900" 
                  data-id="${doc.id}" title="Excluir">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Configura botões
    setupViewVisitorButtons();
    setupVisitButtons();
    setupDeleteVisitorButtons();
  } catch (error) {
    console.error("Erro ao carregar visitantes:", error);
    showError("Não foi possível carregar a lista de visitantes");
  }
}

// Carrega histórico de visitas
async function loadVisitsHistory() {
  const tableBody = document.getElementById("visitsHistoryTable");
  if (!tableBody) return;

  try {
    const q = query(visitsRef, orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    tableBody.innerHTML = "";

    if (querySnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5" class="px-6 py-4 text-center text-gray-500">
            Nenhuma visita registrada
          </td>
        </tr>
      `;
      return;
    }

    // Carrega visitantes e prisioneiros para mapear IDs para nomes
    const [visitorsSnapshot, prisonersSnapshot] = await Promise.all([
      getDocs(visitorsRef),
      getDocs(prisonersRef),
    ]);

    const visitorsMap = {};
    visitorsSnapshot.forEach((doc) => {
      visitorsMap[doc.id] = doc.data().name;
    });

    const prisonersMap = {};
    prisonersSnapshot.forEach((doc) => {
      prisonersMap[doc.id] = doc.data().fullName;
    });

    querySnapshot.forEach((doc) => {
      const visit = doc.data();
      const row = document.createElement("tr");
      row.className = "hover:bg-gray-50";
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${formatDateTime(visit.date)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${visitorsMap[visit.visitorId] || "N/A"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          ${prisonersMap[visit.prisonerId] || "N/A"}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <span class="px-2 py-1 text-xs font-semibold rounded-full 
                      ${getVisitTypeBadgeClass(visit.type)}">
            ${visit.type}
          </span>
        </td>
        <td class="px-6 py-4 text-sm text-gray-500">
          ${visit.notes || "-"}
        </td>
      `;
      tableBody.appendChild(row);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico de visitas:", error);
    showError("Não foi possível carregar o histórico de visitas");
  }
}

// Configura o formulário de cadastro de visitante
function setupVisitorForm() {
  const form = document.getElementById("visitorForm");
  if (!form) return;

  // Preview da foto
  const photoInput = document.getElementById("visitorPhoto");
  const photoPreview = document.getElementById("visitorPhotoPreview");

  photoInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        photoPreview.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  // Submissão do formulário
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const visitorData = {
      name: formData.get("visitorName"),
      document: formData.get("visitorDocument"),
      relation: formData.get("visitorRelation"),
      prisonerId: formData.get("prisonerSelect"),
      photo: photoPreview.src,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(visitorsRef, visitorData);

      Swal.fire({
        icon: "success",
        title: "Visitante cadastrado!",
        text: "O visitante foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        form.reset();
        photoPreview.src = "https://via.placeholder.com/150";
        loadVisitors();
      });
    } catch (error) {
      console.error("Erro ao cadastrar visitante:", error);
      showError("Não foi possível cadastrar o visitante");
    }
  });
}

// Configura botões de visualização de detalhes
function setupViewVisitorButtons() {
  document.querySelectorAll(".view-visitor-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const visitorId = this.getAttribute("data-id");
      showVisitorDetails(visitorId);
    });
  });
}

// Mostra detalhes do visitante
async function showVisitorDetails(visitorId) {
  try {
    const [visitorDoc, visitsSnapshot] = await Promise.all([
      getDoc(doc(db, "visitors", visitorId)),
      getDocs(
        query(
          visitsRef,
          where("visitorId", "==", visitorId),
          orderBy("date", "desc"),
          limit(5)
        )
      ),
    ]);

    if (!visitorDoc.exists()) {
      showError("Visitante não encontrado");
      return;
    }

    const visitor = visitorDoc.data();
    const prisonerDoc = await getDoc(doc(db, "prisoners", visitor.prisonerId));
    const prisonerName = prisonerDoc.exists()
      ? prisonerDoc.data().fullName
      : "N/A";

    // Preenche os detalhes
    document.getElementById(
      "detailVisitorTitle"
    ).textContent = `Detalhes: ${visitor.name}`;
    document.getElementById("detailVisitorPhoto").src =
      visitor.photo || "https://via.placeholder.com/150";
    document.getElementById("detailVisitorName").textContent = visitor.name;
    document.getElementById("detailVisitorDocument").textContent =
      visitor.document;
    document.getElementById("detailVisitorRelation").textContent =
      visitor.relation;
    document.getElementById("detailPrisonerName").textContent = prisonerName;
    document.getElementById("detailVisitorCreatedAt").textContent =
      formatDateTime(visitor.createdAt?.toDate());

    // Preenche as últimas visitas
    const visitsContainer = document.getElementById("visitorLastVisits");
    visitsContainer.innerHTML = "";

    if (visitsSnapshot.empty) {
      visitsContainer.innerHTML =
        '<p class="text-sm text-gray-500">Nenhuma visita registrada</p>';
    } else {
      visitsSnapshot.forEach((doc) => {
        const visit = doc.data();
        const visitElement = document.createElement("div");
        visitElement.className = "text-sm";
        visitElement.innerHTML = `
          <p class="font-medium">${formatDate(visit.date)} - ${visit.type}</p>
          <p class="text-gray-500 truncate">${
            visit.notes || "Sem observações"
          }</p>
        `;
        visitsContainer.appendChild(visitElement);
      });
    }

    // Mostra o modal
    document.getElementById("visitorDetailModal").classList.remove("hidden");
  } catch (error) {
    console.error("Erro ao carregar detalhes do visitante:", error);
    showError("Não foi possível carregar os detalhes do visitante");
  }
}

// Configura botões de registro de visita
function setupVisitButtons() {
  document.querySelectorAll(".register-visit-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const visitorId = this.getAttribute("data-id");
      document.getElementById("visitorId").value = visitorId;

      // Define a data/hora atual como padrão
      const now = new Date();
      const formattedDateTime = now.toISOString().slice(0, 16);
      document.getElementById("visitDate").value = formattedDateTime;

      // Mostra o modal
      document.getElementById("visitModal").classList.remove("hidden");
    });
  });
}

// Configura botões de exclusão de visitante
function setupDeleteVisitorButtons() {
  document.querySelectorAll(".delete-visitor-btn").forEach((btn) => {
    btn.addEventListener("click", async function () {
      const visitorId = this.getAttribute("data-id");

      Swal.fire({
        title: "Tem certeza?",
        text: "Você não poderá reverter isso! Todas as visitas associadas também serão removidas.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            // Remove todas as visitas associadas primeiro
            const visitsQuery = query(
              visitsRef,
              where("visitorId", "==", visitorId)
            );
            const visitsSnapshot = await getDocs(visitsQuery);

            const deletePromises = visitsSnapshot.docs.map((doc) =>
              deleteDoc(doc.ref)
            );

            await Promise.all(deletePromises);

            // Remove o visitante
            await deleteDoc(doc(db, "visitors", visitorId));

            // Recarrega as listas
            await Promise.all([loadVisitors(), loadVisitsHistory()]);

            Swal.fire(
              "Excluído!",
              "O visitante e todas as suas visitas foram removidos do sistema.",
              "success"
            );
          } catch (error) {
            console.error("Erro ao excluir visitante:", error);
            showError("Não foi possível excluir o visitante");
          }
        }
      });
    });
  });
}

// Configura o modal de registro de visita
function setupVisitModal() {
  const modal = document.getElementById("visitModal");
  const closeBtn = document.getElementById("closeVisitModal");
  const cancelBtn = document.getElementById("cancelVisit");
  const visitForm = document.getElementById("visitForm");

  if (!modal) return;

  // Fecha o modal
  function closeModal() {
    modal.classList.add("hidden");
  }

  // Event listeners
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Submissão do formulário de visita
  visitForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const visitorId = document.getElementById("visitorId").value;
    const visitData = {
      visitorId: visitorId,
      date: document.getElementById("visitDate").value,
      type: document.getElementById("visitType").value,
      notes: document.getElementById("visitNotes").value,
      registeredAt: serverTimestamp(),
    };

    try {
      // Obtém o prisonerId associado ao visitante
      const visitorDoc = await getDoc(doc(db, "visitors", visitorId));
      if (visitorDoc.exists()) {
        visitData.prisonerId = visitorDoc.data().prisonerId;

        await addDoc(visitsRef, visitData);

        Swal.fire({
          icon: "success",
          title: "Visita registrada!",
          text: "A visita foi registrada com sucesso.",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          closeModal();
          loadVisitsHistory();

          // Atualiza a lista de visitantes se estiver na página
          if (document.getElementById("visitorsTable")) {
            loadVisitors();
          }
        });
      }
    } catch (error) {
      console.error("Erro ao registrar visita:", error);
      showError("Não foi possível registrar a visita");
    }
  });
}

// Configura o modal de detalhes do visitante
function setupVisitorDetailModal() {
  const modal = document.getElementById("visitorDetailModal");
  const closeBtn = document.getElementById("closeVisitorDetailModal");

  if (!modal) return;

  closeBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
  });
}

// Funções auxiliares
function formatDate(dateString) {
  if (!dateString) return "N/A";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}

function formatDateTime(dateString) {
  if (!dateString) return "N/A";
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}

function getVisitTypeBadgeClass(type) {
  switch (type) {
    case "Familiar":
      return "bg-blue-100 text-blue-800";
    case "Advogado":
      return "bg-purple-100 text-purple-800";
    case "Médico":
      return "bg-green-100 text-green-800";
    case "Religioso":
      return "bg-indigo-100 text-indigo-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function showError(message) {
  Swal.fire({
    icon: "error",
    title: "Erro",
    text: message,
    timer: 3000,
  });
}

// Inicialização
document.addEventListener("DOMContentLoaded", async function () {
  await loadPrisonersForSelect();
  await loadVisitors();
  await loadVisitsHistory();
  setupVisitorForm();
  setupVisitModal();
  setupVisitorDetailModal();

  // Configura busca de visitantes
  const searchInput = document.getElementById("visitorSearch");
  if (searchInput) {
    let searchTimeout;

    searchInput.addEventListener("input", function () {
      clearTimeout(searchTimeout);
      const searchTerm = this.value.trim();

      if (searchTerm.length === 0) {
        loadVisitors();
        return;
      }

      searchTimeout = setTimeout(() => {
        loadVisitors(searchTerm);
      }, 500);
    });
  }
});
