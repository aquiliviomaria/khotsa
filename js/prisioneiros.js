// Armazenamento de prisioneiros
let prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

// Inicializa o formulário de cadastro
document.addEventListener("DOMContentLoaded", function () {
  // Formulário de cadastro
  const prisonerForm = document.getElementById("prisonerForm");
  if (prisonerForm) {
    // Preview da foto
    const photoInput = document.getElementById("prisonerPhoto");
    const photoPreview = document.getElementById("photoPreview");

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
    prisonerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Coleta os dados do formulário
      const formData = new FormData(this);
      const prisonerData = {
        id: Date.now().toString(),
        fullName: formData.get("fullName"),
        birthDate: formData.get("birthDate"),
        processNumber: formData.get("processNumber"),
        crime: formData.get("crime"),
        entryDate: formData.get("entryDate"),
        sentence: parseInt(formData.get("sentence")),
        status: formData.get("status"),
        photo: photoPreview.src,
        createdAt: new Date().toISOString(),
        history: [],
      };

      // Adiciona ao array e salva no localStorage
      prisoners.push(prisonerData);
      localStorage.setItem("prisoners", JSON.stringify(prisoners));

      // Feedback ao usuário
      Swal.fire({
        icon: "success",
        title: "Prisioneiro cadastrado!",
        text: "O prisioneiro foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        this.reset();
        photoPreview.src = "https://via.placeholder.com/150";
      });
    });
  }

  // Listagem de prisioneiros
  if (document.getElementById("prisonersTable")) {
    loadPrisonersTable();
    setupSearchAndFilters();
  }

  // Dashboard stats
  if (document.getElementById("totalPrisoners")) {
    updateDashboardStats();
    loadRecentPrisoners();
    loadEndingSoon();
  }

  // Modal de edição
  setupEditModal();
});

// Carrega a tabela de prisioneiros
function loadPrisonersTable(filteredPrisoners = null) {
  const tableBody = document.getElementById("prisonersTable");
  const data = filteredPrisoners || prisoners;

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-4 text-center text-gray-500">
                    Nenhum prisioneiro encontrado
                </td>
            </tr>
        `;
    return;
  }

  data.forEach((prisoner) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition duration-150";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${prisoner.photo}" alt="${
      prisoner.fullName
    }" class="h-10 w-10 rounded-full object-cover">
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  prisoner.fullName
                }</div>
                <div class="text-sm text-gray-500">${calculateAge(
                  prisoner.birthDate
                )} anos</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.processNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCrimeBadgeClass(
                  prisoner.crime
                )}">
                    ${prisoner.crime}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(prisoner.entryDate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.sentence} anos
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  prisoner.status
                )}">
                    ${prisoner.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-3" data-id="${
                  prisoner.id
                }">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn text-red-600 hover:text-red-900" data-id="${
                  prisoner.id
                }">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  // Atualiza contadores
  updatePrisonersCount(data);

  // Configura botões de edição e exclusão
  setupEditButtons();
  setupDeleteButtons();
}

// Configura busca e filtros
function setupSearchAndFilters() {
  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const crimeFilter = document.getElementById("crimeFilter");

  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const statusValue = statusFilter.value;
    const crimeValue = crimeFilter.value;

    const filtered = prisoners.filter((prisoner) => {
      const matchesSearch =
        prisoner.fullName.toLowerCase().includes(searchTerm) ||
        prisoner.processNumber.toLowerCase().includes(searchTerm) ||
        prisoner.crime.toLowerCase().includes(searchTerm);

      const matchesStatus = statusValue
        ? prisoner.status === statusValue
        : true;
      const matchesCrime = crimeValue ? prisoner.crime === crimeValue : true;

      return matchesSearch && matchesStatus && matchesCrime;
    });

    loadPrisonersTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  crimeFilter.addEventListener("change", applyFilters);
}

// Configura o modal de edição
function setupEditModal() {
  const modal = document.getElementById("editModal");
  const closeBtn = document.getElementById("closeEditModal");
  const cancelBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editForm");

  if (!modal) return;

  // Fecha o modal
  function closeModal() {
    modal.classList.add("hidden");
  }

  // Event listeners
  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Submissão do formulário de edição
  editForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const prisonerIndex = prisoners.findIndex((p) => p.id === id);

    if (prisonerIndex !== -1) {
      // Atualiza os dados
      prisoners[prisonerIndex] = {
        ...prisoners[prisonerIndex],
        fullName: document.getElementById("editFullName").value,
        processNumber: document.getElementById("editProcessNumber").value,
        crime: document.getElementById("editCrime").value,
        status: document.getElementById("editStatus").value,
        entryDate: document.getElementById("editEntryDate").value,
        sentence: parseInt(document.getElementById("editSentence").value),
      };

      // Adiciona ao histórico se a situação mudou
      if (
        prisoners[prisonerIndex].history[
          prisoners[prisonerIndex].history.length - 1
        ]?.status !== prisoners[prisonerIndex].status
      ) {
        prisoners[prisonerIndex].history.push({
          date: new Date().toISOString(),
          status: prisoners[prisonerIndex].status,
          details: `Situação alterada para ${prisoners[prisonerIndex].status}`,
        });
      }

      // Salva no localStorage
      localStorage.setItem("prisoners", JSON.stringify(prisoners));

      // Feedback e atualização
      Swal.fire({
        icon: "success",
        title: "Atualizado!",
        text: "Os dados do prisioneiro foram atualizados.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        closeModal();

        // Atualiza a tabela ou dashboard conforme a página atual
        if (document.getElementById("prisonersTable")) {
          loadPrisonersTable();
        } else if (document.getElementById("totalPrisoners")) {
          updateDashboardStats();
          loadRecentPrisoners();
          loadEndingSoon();
        }
      });
    }
  });
}

// Configura botões de edição
function setupEditButtons() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const prisoner = prisoners.find((p) => p.id === id);

      if (prisoner) {
        // Preenche o formulário
        document.getElementById("editId").value = prisoner.id;
        document.getElementById("editFullName").value = prisoner.fullName;
        document.getElementById("editProcessNumber").value =
          prisoner.processNumber;
        document.getElementById("editCrime").value = prisoner.crime;
        document.getElementById("editStatus").value = prisoner.status;
        document.getElementById("editEntryDate").value = prisoner.entryDate;
        document.getElementById("editSentence").value = prisoner.sentence;

        // Mostra o modal
        document.getElementById("editModal").classList.remove("hidden");
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
        title: "Tem certeza?",
        text: "Você não poderá reverter isso!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, excluir!",
        cancelButtonText: "Cancelar",
      }).then((result) => {
        if (result.isConfirmed) {
          // Remove o prisioneiro
          prisoners = prisoners.filter((p) => p.id !== id);
          localStorage.setItem("prisoners", JSON.stringify(prisoners));

          // Atualiza a tabela
          loadPrisonersTable();

          Swal.fire(
            "Excluído!",
            "O prisioneiro foi removido do sistema.",
            "success"
          );
        }
      });
    });
  });
}

// Atualiza contadores na listagem
function updatePrisonersCount(data) {
  const showingFrom = document.getElementById("showingFrom");
  const showingTo = document.getElementById("showingTo");
  const totalPrisoners = document.getElementById("totalPrisoners");

  if (showingFrom && showingTo && totalPrisoners) {
    showingFrom.textContent = "1";
    showingTo.textContent = data.length;
    totalPrisoners.textContent = prisoners.length;
  }
}

// Atualiza estatísticas no dashboard
function updateDashboardStats() {
  document.getElementById("totalPrisoners").textContent = prisoners.length;
  document.getElementById("inPrison").textContent = prisoners.filter(
    (p) => p.status === "Preso"
  ).length;
  document.getElementById("onParole").textContent = prisoners.filter(
    (p) => p.status === "Liberdade Condicional"
  ).length;
  document.getElementById("transferred").textContent = prisoners.filter(
    (p) => p.status === "Transferido"
  ).length;
}

// Carrega prisioneiros recentes no dashboard
function loadRecentPrisoners() {
  const recentTable = document.getElementById("recentPrisoners");

  if (!recentTable) return;

  // Ordena por data de criação (mais recentes primeiro)
  const recent = [...prisoners]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  recentTable.innerHTML = "";

  if (recent.length === 0) {
    recentTable.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhum prisioneiro cadastrado recentemente
                </td>
            </tr>
        `;
    return;
  }

  recent.forEach((prisoner) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  prisoner.fullName
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.processNumber}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.crime}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(prisoner.entryDate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  prisoner.status
                )}">
                    ${prisoner.status}
                </span>
            </td>
        `;
    recentTable.appendChild(row);
  });
}

// Carrega penas que terminam em breve no dashboard
function loadEndingSoon() {
  const endingSoonContainer = document.getElementById("endingSoon");

  if (!endingSoonContainer) return;

  endingSoonContainer.innerHTML = "";

  // Filtra prisioneiros com penas terminando nos próximos 6 meses
  const soon = prisoners.filter((prisoner) => {
    if (prisoner.status !== "Preso") return false;

    const entryDate = new Date(prisoner.entryDate);
    const endDate = new Date(entryDate);
    endDate.setFullYear(endDate.getFullYear() + prisoner.sentence);

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return endDate <= sixMonthsFromNow;
  });

  if (soon.length === 0) {
    endingSoonContainer.innerHTML = `
            <div class="text-center py-4 text-gray-500">
                Nenhuma pena terminando nos próximos 6 meses
            </div>
        `;
    return;
  }

  // Ordena por data de término mais próxima
  soon.sort((a, b) => {
    const aEntry = new Date(a.entryDate);
    const aEnd = new Date(aEntry);
    aEnd.setFullYear(aEnd.getFullYear() + a.sentence);

    const bEntry = new Date(b.entryDate);
    const bEnd = new Date(bEntry);
    bEnd.setFullYear(bEnd.getFullYear() + b.sentence);

    return aEnd - bEnd;
  });

  // Limita a 5 resultados
  soon.slice(0, 5).forEach((prisoner) => {
    const entryDate = new Date(prisoner.entryDate);
    const endDate = new Date(entryDate);
    endDate.setFullYear(endDate.getFullYear() + prisoner.sentence);

    const daysLeft = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));

    const item = document.createElement("div");
    item.className =
      "flex items-center justify-between p-3 bg-gray-50 rounded-md";
    item.innerHTML = `
            <div>
                <h4 class="font-medium text-gray-800">${prisoner.fullName}</h4>
                <p class="text-sm text-gray-500">${prisoner.crime} • ${
      prisoner.sentence
    } anos</p>
            </div>
            <div class="text-right">
                <p class="font-medium ${
                  daysLeft < 30 ? "text-red-600" : "text-indigo-600"
                }">${formatDate(endDate)}</p>
                <p class="text-xs text-gray-500">${daysLeft} dias restantes</p>
            </div>
        `;
    endingSoonContainer.appendChild(item);
  });
}

// Funções auxiliares
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}

function calculateAge(birthDateString) {
  const birthDate = new Date(birthDateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "Preso":
      return "bg-red-100 text-red-800";
    case "Liberdade Condicional":
      return "bg-yellow-100 text-yellow-800";
    case "Transferido":
      return "bg-blue-100 text-blue-800";
    case "Solto":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getCrimeBadgeClass(crime) {
  switch (crime) {
    case "Homicídio":
      return "bg-red-100 text-red-800";
    case "Roubo":
      return "bg-orange-100 text-orange-800";
    case "Furto":
      return "bg-yellow-100 text-yellow-800";
    case "Tráfico de Drogas":
      return "bg-purple-100 text-purple-800";
    case "Estupro":
      return "bg-pink-100 text-pink-800";
    case "Sequestro":
      return "bg-indigo-100 text-indigo-800";
    case "Corrupção":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
