// Armazenamento de visitantes e visitas
let visitors = JSON.parse(localStorage.getItem("visitors")) || [];
let visits = JSON.parse(localStorage.getItem("visits")) || [];

// Inicializa o formulário e tabelas
document.addEventListener("DOMContentLoaded", function () {
  // Carrega prisioneiros no select
  loadPrisonersSelect();

  // Preview da foto do visitante
  const photoInput = document.getElementById("visitorPhoto");
  const photoPreview = document.getElementById("visitorPhotoPreview");

  if (photoInput && photoPreview) {
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
  }

  // Formulário de cadastro de visitante
  const visitorForm = document.getElementById("visitorForm");
  if (visitorForm) {
    visitorForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Coleta os dados do formulário
      const formData = new FormData(this);
      const visitorData = {
        id: Date.now().toString(),
        fullName: formData.get("visitorName"),
        document: formData.get("visitorDocument"),
        relation: formData.get("visitorRelation"),
        prisonerId: formData.get("prisonerSelect"),
        photo: photoPreview.src,
        createdAt: new Date().toISOString(),
        active: true,
      };

      // Verifica se o documento já está cadastrado
      if (visitors.some((v) => v.document === visitorData.document)) {
        Swal.fire({
          icon: "error",
          title: "Documento já cadastrado",
          text: "Já existe um visitante com este documento no sistema.",
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }

      // Adiciona ao array e salva no localStorage
      visitors.push(visitorData);
      localStorage.setItem("visitors", JSON.stringify(visitors));

      // Feedback ao usuário
      Swal.fire({
        icon: "success",
        title: "Visitante cadastrado!",
        text: "O visitante foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        this.reset();
        photoPreview.src = "https://via.placeholder.com/150";
        loadVisitorsTable(); // Atualiza a tabela
      });
    });
  }

  // Listagem de visitantes
  if (document.getElementById("visitorsTable")) {
    loadVisitorsTable();
    setupVisitorSearch();
  }

  // Histórico de visitas
  if (document.getElementById("visitsHistoryTable")) {
    loadVisitsHistory();
  }

  // Configura os modais
  setupVisitModal();
  setupVisitorDetailModal();
});

// Carrega prisioneiros no select
function loadPrisonersSelect() {
  const select = document.getElementById("prisonerSelect");
  if (!select) return;

  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

  // Limpa opções existentes (mantendo a primeira opção vazia)
  select.innerHTML = '<option value="">Selecione um prisioneiro</option>';

  prisoners.forEach((prisoner) => {
    const option = document.createElement("option");
    option.value = prisoner.id;
    option.textContent = `${prisoner.fullName} (${prisoner.processNumber})`;
    select.appendChild(option);
  });
}

// Carrega a tabela de visitantes
function loadVisitorsTable(filteredVisitors = null) {
  const tableBody = document.getElementById("visitorsTable");
  const data = filteredVisitors || visitors;
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    Nenhum visitante encontrado
                </td>
            </tr>
        `;
    return;
  }

  data.forEach((visitor) => {
    const prisoner = prisoners.find((p) => p.id === visitor.prisonerId) || {};

    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition duration-150";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${visitor.photo}" alt="${
      visitor.fullName
    }" class="h-10 w-10 rounded-full object-cover">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  visitor.fullName
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${visitor.document}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.fullName || "N/A"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${visitor.relation}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="detail-btn text-blue-600 hover:text-blue-900 mr-3" data-id="${
                  visitor.id
                }">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="visit-btn text-green-600 hover:text-green-900 mr-3" data-id="${
                  visitor.id
                }">
                    <i class="fas fa-calendar-plus"></i>
                </button>
                <button class="${
                  visitor.active
                    ? "deactivate-btn text-yellow-600 hover:text-yellow-900"
                    : "activate-btn text-green-600 hover:text-green-900"
                } mr-3" data-id="${visitor.id}">
                    <i class="fas ${
                      visitor.active ? "fa-user-slash" : "fa-user-check"
                    }"></i>
                </button>
                <button class="delete-btn text-red-600 hover:text-red-900" data-id="${
                  visitor.id
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  // Configura botões de ação
  setupDetailButtons();
  setupVisitButtons();
  setupActivateButtons();
  setupDeleteButtons();
}

// Configura a busca de visitantes
function setupVisitorSearch() {
  const searchInput = document.getElementById("visitorSearch");
  if (!searchInput) return;

  searchInput.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase();

    const filtered = visitors.filter((visitor) => {
      return (
        visitor.fullName.toLowerCase().includes(searchTerm) ||
        visitor.document.toLowerCase().includes(searchTerm) ||
        visitor.relation.toLowerCase().includes(searchTerm)
      );
    });

    loadVisitorsTable(filtered);
  });
}

// Carrega o histórico de visitas
function loadVisitsHistory(filteredVisits = null) {
  const tableBody = document.getElementById("visitsHistoryTable");
  const data = filteredVisits || visits;
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhuma visita registrada
                </td>
            </tr>
        `;
    return;
  }

  // Ordena por data (mais recente primeiro)
  data.sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate));

  data.forEach((visit) => {
    const visitor = visitors.find((v) => v.id === visit.visitorId) || {};
    const prisoner = prisoners.find((p) => p.id === visit.prisonerId) || {};

    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition duration-150";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDateTime(visit.visitDate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  visitor.fullName || "N/A"
                }</div>
                <div class="text-sm text-gray-500">${
                  visitor.document || ""
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.fullName || "N/A"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getVisitTypeBadgeClass(
                  visit.visitType
                )}">
                    ${visit.visitType}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${visit.notes || "-"}
            </td>
        `;
    tableBody.appendChild(row);
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
  visitForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const visitData = {
      id: Date.now().toString(),
      visitorId: document.getElementById("visitorId").value,
      prisonerId:
        visitors.find(
          (v) => v.id === document.getElementById("visitorId").value
        )?.prisonerId || "",
      visitDate: document.getElementById("visitDate").value,
      visitType: document.getElementById("visitType").value,
      notes: document.getElementById("visitNotes").value,
      registeredAt: new Date().toISOString(),
      registeredBy: "current_user_id", // Você deve substituir pelo ID do usuário logado
    };

    // Adiciona ao array e salva no localStorage
    visits.push(visitData);
    localStorage.setItem("visits", JSON.stringify(visits));

    // Feedback ao usuário
    Swal.fire({
      icon: "success",
      title: "Visita registrada!",
      text: "A visita foi registrada com sucesso no sistema.",
      timer: 2000,
      showConfirmButton: false,
    }).then(() => {
      closeModal();
      loadVisitsHistory(); // Atualiza o histórico
    });
  });
}

// Configura o modal de detalhes do visitante
function setupVisitorDetailModal() {
  const modal = document.getElementById("visitorDetailModal");
  const closeBtn = document.getElementById("closeVisitorDetailModal");

  if (!modal) return;

  // Fecha o modal
  closeBtn.addEventListener("click", function () {
    modal.classList.add("hidden");
  });
}

// Configura botões de detalhes
function setupDetailButtons() {
  document.querySelectorAll(".detail-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const visitor = visitors.find((v) => v.id === id);
      const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];
      const prisoner = prisoners.find((p) => p.id === visitor?.prisonerId);

      if (visitor) {
        // Preenche os detalhes
        document.getElementById("detailVisitorTitle").textContent =
          visitor.fullName;
        document.getElementById("detailVisitorName").textContent =
          visitor.fullName;
        document.getElementById("detailVisitorDocument").textContent =
          visitor.document;
        document.getElementById("detailVisitorRelation").textContent =
          visitor.relation;
        document.getElementById("detailPrisonerName").textContent =
          prisoner?.fullName || "N/A";
        document.getElementById("detailVisitorCreatedAt").textContent =
          formatDateTime(visitor.createdAt);
        document.getElementById("detailVisitorPhoto").src = visitor.photo;

        // Carrega as últimas visitas
        const visitorVisits = visits
          .filter((v) => v.visitorId === visitor.id)
          .sort((a, b) => new Date(b.visitDate) - new Date(a.visitDate))
          .slice(0, 5);

        const visitsContainer = document.getElementById("visitorLastVisits");
        visitsContainer.innerHTML = "";

        if (visitorVisits.length === 0) {
          visitsContainer.innerHTML =
            '<p class="text-sm text-gray-500">Nenhuma visita registrada</p>';
        } else {
          visitorVisits.forEach((visit) => {
            const visitElement = document.createElement("div");
            visitElement.className = "text-sm";
            visitElement.innerHTML = `
                            <p class="font-medium">${formatDateTime(
                              visit.visitDate
                            )}</p>
                            <p class="text-gray-600">${visit.visitType} • ${
              visit.notes || "Sem observações"
            }</p>
                        `;
            visitsContainer.appendChild(visitElement);
          });
        }

        // Mostra o modal
        modal.classList.remove("hidden");
      }
    });
  });
}

// Configura botões de registro de visita
function setupVisitButtons() {
  document.querySelectorAll(".visit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const visitor = visitors.find((v) => v.id === id);

      if (visitor) {
        // Preenche o ID do visitante
        document.getElementById("visitorId").value = visitor.id;

        // Define a data/hora atual como padrão
        const now = new Date();
        const localDateTime = new Date(
          now.getTime() - now.getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16);
        document.getElementById("visitDate").value = localDateTime;

        // Mostra o modal
        document.getElementById("visitModal").classList.remove("hidden");
      }
    });
  });
}

// Configura botões de ativação/desativação
function setupActivateButtons() {
  document.querySelectorAll(".activate-btn, .deactivate-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const visitorIndex = visitors.findIndex((v) => v.id === id);

      if (visitorIndex !== -1) {
        const action = visitors[visitorIndex].active ? "desativar" : "ativar";

        Swal.fire({
          title: `Confirmar ${action} visitante`,
          text: `Tem certeza que deseja ${action} este visitante?`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: `Sim, ${action}`,
          cancelButtonText: "Cancelar",
        }).then((result) => {
          if (result.isConfirmed) {
            visitors[visitorIndex].active = !visitors[visitorIndex].active;
            localStorage.setItem("visitors", JSON.stringify(visitors));
            loadVisitorsTable();

            Swal.fire({
              icon: "success",
              title: "Sucesso!",
              text: `Visitante ${action}do com sucesso.`,
              timer: 1500,
              showConfirmButton: false,
            });
          }
        });
      }
    });
  });
}

// Configura botões de exclusão
function setupDeleteButtons() {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");

      Swal.fire({
        title: "Confirmar exclusão",
        text: "Tem certeza que deseja excluir permanentemente este visitante?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          visitors = visitors.filter((v) => v.id !== id);
          localStorage.setItem("visitors", JSON.stringify(visitors));
          loadVisitorsTable();

          Swal.fire(
            "Excluído!",
            "O visitante foi removido do sistema.",
            "success"
          );
        }
      });
    });
  });
}

// Funções auxiliares
function formatDateTime(dateTimeString) {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateTimeString).toLocaleDateString("pt-BR", options);
}

function getVisitTypeBadgeClass(type) {
  switch (type) {
    case "Social":
      return "bg-blue-100 text-blue-800";
    case "Familiar":
      return "bg-green-100 text-green-800";
    case "Advogado":
      return "bg-purple-100 text-purple-800";
    case "Médico":
      return "bg-red-100 text-red-800";
    case "Religioso":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
