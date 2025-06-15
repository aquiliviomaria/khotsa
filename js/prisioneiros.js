let prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

document.addEventListener("DOMContentLoaded", function () {
  // Formulário de cadastro de prisioneiros
  const prisonerForm = document.getElementById("prisonerForm");
  if (prisonerForm) {
    const photoInput = document.getElementById("prisonerPhoto");
    const photoPreview = document.getElementById("photoPreview");
    const crimeSelect = document.getElementById("crime");
    const otherCrimeContainer = document.getElementById("otherCrimeContainer");
    const otherCrimeInput = document.getElementById("otherCrime");

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

    if (crimeSelect && otherCrimeContainer) {
      crimeSelect.addEventListener("change", function () {
        if (this.value === "Outro") {
          otherCrimeContainer.classList.remove("hidden");
          otherCrimeInput.required = true;
        } else {
          otherCrimeContainer.classList.add("hidden");
          otherCrimeInput.required = false;
          otherCrimeInput.value = "";
        }
      });
    }

    prisonerForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const birthDateInput = document.getElementById("birthDate");
      const entryDateInput = document.getElementById("entryDate");
      const sentenceInput = document.getElementById("sentence");
      const genderInput = document.getElementById("gender");
      const crimeInput = document.getElementById("crime");
      const otherCrimeInput = document.getElementById("otherCrime");

      [
        birthDateInput,
        entryDateInput,
        sentenceInput,
        genderInput,
        crimeInput,
        otherCrimeInput,
      ].forEach((input) => {
        if (input) {
          input.classList.remove("error-field");
          input.previousElementSibling?.classList.remove("error-label");
        }
      });

      let hasError = false;
      let errorMessages = [];

      const birthDate = new Date(birthDateInput.value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();
      const adjustedAge =
        monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (isNaN(birthDate) || adjustedAge < 18) {
        birthDateInput.classList.add("error-field");
        birthDateInput.previousElementSibling.classList.add("error-label");
        errorMessages.push("O prisioneiro deve ter pelo menos 18 anos.");
        hasError = true;
      }

      const entryDate = new Date(entryDateInput.value);
      if (isNaN(entryDate) || entryDate > today) {
        entryDateInput.classList.add("error-field");
        entryDateInput.previousElementSibling.classList.add("error-label");
        errorMessages.push("A data de entrada não pode ser futura.");
        hasError = true;
      }

      const eighteenthBirthday = new Date(birthDate);
      eighteenthBirthday.setFullYear(eighteenthBirthday.getFullYear() + 18);
      if (!isNaN(entryDate) && entryDate < eighteenthBirthday) {
        entryDateInput.classList.add("error-field");
        entryDateInput.previousElementSibling.classList.add("error-label");
        errorMessages.push(
          "A data de entrada deve ser após o prisioneiro completar 18 anos."
        );
        hasError = true;
      }

      const sentence = parseInt(sentenceInput.value);
      if (isNaN(sentence) || sentence < 1 || sentence > 100) {
        sentenceInput.classList.add("error-field");
        sentenceInput.previousElementSibling.classList.add("error-label");
        errorMessages.push("A pena deve ser entre 1 e 100 anos.");
        hasError = true;
      }

      if (!genderInput.value) {
        genderInput.classList.add("error-field");
        genderInput.previousElementSibling.classList.add("error-label");
        errorMessages.push("O campo sexo é obrigatório.");
        hasError = true;
      }

      if (crimeInput.value === "Outro" && !otherCrimeInput.value.trim()) {
        otherCrimeInput.classList.add("error-field");
        otherCrimeInput.previousElementSibling.classList.add("error-label");
        errorMessages.push(
          "Especifique o crime quando 'Outro' for selecionado."
        );
        hasError = true;
      }

      if (hasError) {
        Swal.fire({
          icon: "error",
          title: "Erro de Validação",
          html: errorMessages.join("<br>"),
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const formData = new FormData(this);
      const prisonerData = {
        id: Date.now().toString(),
        fullName: formData.get("fullName"),
        birthDate: formData.get("birthDate"),
        gender: formData.get("gender"),
        processNumber: formData.get("processNumber"),
        crime: formData.get("crime"),
        otherCrime:
          formData.get("crime") === "Outro" ? formData.get("otherCrime") : "",
        entryDate: formData.get("entryDate"),
        sentence: parseInt(formData.get("sentence")),
        status: formData.get("status"),
        photo: photoPreview.src,
        createdAt: new Date().toISOString(),
        history: [],
      };

      prisoners.push(prisonerData);
      localStorage.setItem("prisoners", JSON.stringify(prisoners));

      Swal.fire({
        icon: "success",
        title: "Prisioneiro registrado!",
        text: "O prisioneiro foi registrado com sucesso no sistema.",
        timer: 2000,
        showConfirmButton: false,
      }).then(() => {
        this.reset();
        photoPreview.src = "https://via.placeholder.com/150";
        otherCrimeContainer.classList.add("hidden");
        otherCrimeInput.required = false;
      });
    });
  }

  // Página de lista de prisioneiros
  if (document.getElementById("prisonersTable")) {
    loadPrisonersTable();
    setupSearchAndFilters();

    const downloadStatsBtn = document.getElementById("downloadStats");
    if (downloadStatsBtn) {
      downloadStatsBtn.addEventListener("click", downloadStatistics);
    }
  }

  // Página de dashboard
  if (document.getElementById("dashboard-stats")) {
    updateDashboardStats();
    loadRecentPrisoners();
    loadEndingSoon();
  }

  setupEditModal();
});

function loadPrisonersTable(filteredPrisoners = null) {
  const tableBody = document.getElementById("prisonersTable");
  const data = filteredPrisoners || prisoners;

  tableBody.innerHTML = "";

  if (data.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" class="px-4 py-2 sm:px-6 sm:py-4 text-center text-gray-500 text-xs sm:text-sm">
          Nenhum prisioneiro encontrado
        </td>
      </tr>
    `;
    return;
  }

  data.forEach((prisoner) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50 transition duration-150";
    const displayCrime =
      prisoner.crime === "Outro" && prisoner.otherCrime
        ? prisoner.otherCrime
        : prisoner.crime;
    row.innerHTML = `
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <img src="${prisoner.photo}" alt="${
      prisoner.fullName
    }" class="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover">
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <div class="text-xs sm:text-sm font-medium text-gray-900">${
          prisoner.fullName
        }</div>
        <div class="text-xs text-gray-500">${calculateAge(
          prisoner.birthDate
        )} anos</div>
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${prisoner.processNumber}
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <span class="px-1 sm:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getCrimeBadgeClass(
          prisoner.crime
        )}">
          ${displayCrime}
        </span>
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${formatDate(prisoner.entryDate)}
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${prisoner.sentence} anos
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <span class="px-1 sm:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
          prisoner.status
        )}">
          ${prisoner.status}
        </span>
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-right text-xs sm:text-sm font-medium">
        <button class="view-photo-btn text-blue-600 hover:text-blue-900 mr-2 sm:mr-3" data-id="${
          prisoner.id
        }">
          <i class="fas fa-eye"></i>
        </button>
        <button class="edit-btn text-indigo-600 hover:text-indigo-900 mr-2 sm:mr-3" data-id="${
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

  updatePrisonersCount(data);
  setupEditButtons();
  setupDeleteButtons();
  setupViewPhotoButtons();
}

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
        prisoner.crime.toLowerCase().includes(searchTerm) ||
        (prisoner.otherCrime &&
          prisoner.otherCrime.toLowerCase().includes(searchTerm));

      const matchesStatus = statusValue
        ? prisoner.status === statusValue
        : true;
      const matchesCrime = crimeValue
        ? prisoner.crime === crimeValue ||
          (crimeValue === "Outro" && prisoner.otherCrime)
        : true;

      return matchesSearch && matchesStatus && matchesCrime;
    });

    loadPrisonersTable(filtered);
  }

  searchInput.addEventListener("input", applyFilters);
  statusFilter.addEventListener("change", applyFilters);
  crimeFilter.addEventListener("change", applyFilters);
}

function setupEditModal() {
  const modal = document.getElementById("editModal");
  const closeBtn = document.getElementById("closeEditModal");
  const cancelBtn = document.getElementById("cancelEdit");
  const editForm = document.getElementById("editForm");
  const photoInput = document.getElementById("editPhoto");
  const photoPreview = document.getElementById("editPhotoPreview");
  const crimeSelect = document.getElementById("editCrime");
  const otherCrimeContainer = document.getElementById("otherCrimeContainer");
  const otherCrimeInput = document.getElementById("editOtherCrime");

  if (!modal) return;

  // Atualiza a prévia da foto ao selecionar uma nova
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

  // Controla a visibilidade do campo "Outro Crime"
  if (crimeSelect && otherCrimeContainer) {
    crimeSelect.addEventListener("change", function () {
      if (this.value === "Outro") {
        otherCrimeContainer.classList.remove("hidden");
        otherCrimeInput.required = true;
      } else {
        otherCrimeContainer.classList.add("hidden");
        otherCrimeInput.required = false;
        otherCrimeInput.value = "";
      }
    });
  }

  function closeModal() {
    modal.classList.add("hidden");
    otherCrimeContainer.classList.add("hidden");
    otherCrimeInput.required = false;
    otherCrimeInput.value = "";
  }

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  editForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const id = document.getElementById("editId").value;
    const prisonerIndex = prisoners.findIndex((p) => p.id === id);

    if (prisonerIndex !== -1) {
      const crimeValue = document.getElementById("editCrime").value;
      const otherCrimeValue =
        crimeValue === "Outro"
          ? document.getElementById("editOtherCrime").value.trim()
          : "";

      if (crimeValue === "Outro" && !otherCrimeValue) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "Por favor, especifique o crime quando 'Outro' for selecionado.",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      const updatedPrisoner = {
        ...prisoners[prisonerIndex],
        fullName: document.getElementById("editFullName").value,
        gender: document.getElementById("editGender").value,
        processNumber: document.getElementById("editProcessNumber").value,
        crime: crimeValue,
        otherCrime: otherCrimeValue,
        status: document.getElementById("editStatus").value,
        entryDate: document.getElementById("editEntryDate").value,
        sentence: parseInt(document.getElementById("editSentence").value),
        photo: photoPreview.src,
      };

      if (
        prisoners[prisonerIndex].history[
          prisoners[prisonerIndex].history.length - 1
        ]?.status !== updatedPrisoner.status
      ) {
        updatedPrisoner.history.push({
          date: new Date().toISOString(),
          status: updatedPrisoner.status,
          details: `Situação alterada para ${updatedPrisoner.status}`,
        });
      }

      prisoners[prisonerIndex] = updatedPrisoner;
      localStorage.setItem("prisoners", JSON.stringify(prisoners));

      Swal.fire({
        icon: "success",
        title: "Atualizado!",
        text: "Os dados do prisioneiro foram atualizados.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        closeModal();
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

function setupEditButtons() {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const prisoner = prisoners.find((p) => p.id === id);

      if (prisoner) {
        document.getElementById("editId").value = prisoner.id;
        document.getElementById("editFullName").value = prisoner.fullName;
        document.getElementById("editGender").value =
          prisoner.gender || "Outro";
        document.getElementById("editProcessNumber").value =
          prisoner.processNumber;
        document.getElementById("editCrime").value = prisoner.crime;
        document.getElementById("editStatus").value = prisoner.status;
        document.getElementById("editEntryDate").value = prisoner.entryDate;
        document.getElementById("editSentence").value = prisoner.sentence;
        document.getElementById("editPhotoPreview").src = prisoner.photo;

        const otherCrimeContainer = document.getElementById(
          "otherCrimeContainer"
        );
        const otherCrimeInput = document.getElementById("editOtherCrime");
        if (prisoner.crime === "Outro" && prisoner.otherCrime) {
          otherCrimeContainer.classList.remove("hidden");
          otherCrimeInput.required = true;
          otherCrimeInput.value = prisoner.otherCrime;
        } else {
          otherCrimeContainer.classList.add("hidden");
          otherCrimeInput.required = false;
          otherCrimeInput.value = "";
        }

        document.getElementById("editModal").classList.remove("hidden");
      }
    });
  });
}

function setupViewPhotoButtons() {
  document.querySelectorAll(".view-photo-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const id = this.getAttribute("data-id");
      const prisoner = prisoners.find((p) => p.id === id);

      if (prisoner && prisoner.photo) {
        const displayCrime =
          prisoner.crime === "Outro" && prisoner.otherCrime
            ? prisoner.otherCrime
            : prisoner.crime;
        Swal.fire({
          title: `Detalhes de ${prisoner.fullName}`,
          html: `
            <div class="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-6 p-3 xs:p-4 sm:p-6 text-xs xs:text-sm sm:text-base">
              <img src="${prisoner.photo}" alt="Foto de ${
            prisoner.fullName
          }" class="w-56 h-56 xs:w-64 xs:h-64 rounded-lg object-cover">
              <div class="text-left w-full sm:w-auto max-w-xs sm:max-w-md">
                <p><strong>Nome:</strong> ${prisoner.fullName}</p>
                <p><strong>Idade:</strong> ${calculateAge(
                  prisoner.birthDate
                )} anos</p>
                <p><strong>Nº Processo:</strong> ${prisoner.processNumber}</p>
                <p><strong>Crime:</strong> <span class="px-1 xs:px-2 inline-flex text-xs xs:text-sm leading-5 font-semibold rounded-full ${getCrimeBadgeClass(
                  prisoner.crime
                )}">${displayCrime}</span></p>
                <p><strong>Data de Entrada:</strong> ${formatDate(
                  prisoner.entryDate
                )}</p>
                <p><strong>Pena:</strong> ${prisoner.sentence} anos</p>
                <p><strong>Situação:</strong> <span class="px-1 xs:px-2 inline-flex text-xs xs:text-sm leading-5 font-semibold rounded-full ${getStatusBadgeClass(
                  prisoner.status
                )}">${prisoner.status}</span></p>
              </div>
            </div>
          `,
          showConfirmButton: false,
          showCloseButton: true,
          width: "100%",
          customClass: {
            popup: "w-full max-w-md xs:max-w-lg sm:max-w-xl p-2 xs:p-4",
          },
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Sem Foto",
          text: "Nenhuma foto disponível para este prisioneiro.",
          confirmButtonColor: "#3085d6",
        });
      }
    });
  });
}

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
          prisoners = prisoners.filter((p) => p.id !== id);
          localStorage.setItem("prisoners", JSON.stringify(prisoners));

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

function updatePrisonersCount(data) {
  const showingFrom = document.getElementById("showingFrom");
  const showingTo = document.getElementById("showingTo");
  const totalPrisoners = document.getElementById("totalPrisoners");

  if (showingFrom && showingTo && totalPrisoners) {
    showingFrom.textContent = data.length > 0 ? "1" : "0";
    showingTo.textContent = data.length;
    totalPrisoners.textContent = prisoners.length;
  }
}

function updateDashboardStats() {
  const totalElement = document.getElementById("totalPrisoners");
  const inPrisonElement = document.getElementById("inPrison");
  const onParoleElement = document.getElementById("onParole");
  const transferredElement = document.getElementById("transferred");

  if (
    totalElement &&
    inPrisonElement &&
    onParoleElement &&
    transferredElement
  ) {
    totalElement.textContent = prisoners.length;
    inPrisonElement.textContent = prisoners.filter(
      (p) => p.status === "Preso"
    ).length;
    onParoleElement.textContent = prisoners.filter(
      (p) => p.status === "Liberdade Condicional"
    ).length;
    transferredElement.textContent = prisoners.filter(
      (p) => p.status === "Transferido"
    ).length;
  }
}

function loadRecentPrisoners() {
  const recentTable = document.getElementById("recentPrisoners");

  if (!recentTable) return;

  const recent = [...prisoners]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  recentTable.innerHTML = "";

  if (recent.length === 0) {
    recentTable.innerHTML = `
      <tr>
        <td colspan="5" class="px-4 py-2 sm:px-6 sm:py-4 text-center text-gray-500 text-xs sm:text-sm">
          Nenhum prisioneiro cadastrado recentemente
        </td>
      </tr>
    `;
    return;
  }

  recent.forEach((prisoner) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    const displayCrime =
      prisoner.crime === "Outro" && prisoner.otherCrime
        ? prisoner.otherCrime
        : prisoner.crime;
    row.innerHTML = `
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <div class="text-xs sm:text-sm font-medium text-gray-900">${
          prisoner.fullName
        }</div>
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${prisoner.processNumber}
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${displayCrime}
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
        ${formatDate(prisoner.entryDate)}
      </td>
      <td class="px-4 py-2 sm:px-6 sm:py-4 whitespace-nowrap">
        <span class="px-1 sm:px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(
          prisoner.status
        )}">
          ${prisoner.status}
        </span>
      </td>
    `;
    recentTable.appendChild(row);
  });
}

function loadEndingSoon() {
  const endingSoonContainer = document.getElementById("endingSoon");

  if (!endingSoonContainer) return;

  endingSoonContainer.innerHTML = "";

  const soon = prisoners.filter((prisoner) => {
    if (prisoner.status !== "Preso") return false;

    const entryDate = new Date(prisoner.entryDate);
    if (isNaN(entryDate)) return false;

    const endDate = new Date(entryDate);
    endDate.setFullYear(endDate.getFullYear() + (prisoner.sentence || 0));

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);

    return endDate <= sixMonthsFromNow && !isNaN(endDate);
  });

  if (soon.length === 0) {
    endingSoonContainer.innerHTML = `
      <div class="text-center py-4 text-gray-500 text-xs sm:text-sm">
        Nenhuma pena terminando nos próximos 6 meses
      </div>
    `;
    return;
  }

  soon.sort((a, b) => {
    const aEntry = new Date(a.entryDate);
    const aEnd = new Date(aEntry);
    aEnd.setFullYear(aEnd.getFullYear() + (a.sentence || 0));

    const bEntry = new Date(b.entryDate);
    const bEnd = new Date(bEntry);
    bEnd.setFullYear(bEnd.getFullYear() + (b.sentence || 0));

    return aEnd - bEnd;
  });

  soon.forEach((prisoner) => {
    const entryDate = new Date(prisoner.entryDate);
    const endDate = new Date(entryDate);
    endDate.setFullYear(endDate.getFullYear() + prisoner.sentence);

    const daysLeft = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));

    const item = document.createElement("div");
    item.className =
      "flex items-center justify-between p-3 bg-gray-50 rounded-md";
    item.innerHTML = `
      <div>
        <h4 class="font-medium text-gray-800 text-xs sm:text-sm">${
          prisoner.fullName
        }</h4>
        <p class="text-xs text-gray-500">${prisoner.crime} • ${
      prisoner.sentence
    } anos</p>
      </div>
      <div class="text-right">
        <p class="font-medium ${
          daysLeft < 30 ? "text-red-600" : "text-indigo-600"
        } text-xs sm:text-sm">${formatDate(endDate)}</p>
        <p class="text-xs text-gray-500">${daysLeft} dias restantes</p>
      </div>
    `;
    endingSoonContainer.appendChild(item);
  });
}

function downloadStatistics() {
  try {
    if (typeof jsPDF === "undefined" || typeof Swal === "undefined") {
      console.error("Bibliotecas necessárias não carregadas");
      Swal.fire({
        icon: "error",
        title: "Bibliotecas não carregadas",
        text: "As bibliotecas jsPDF e/ou SweetAlert não foram carregadas corretamente.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const validPrisoners = prisoners.filter((p) => {
      const age = calculateAge(p.birthDate);
      const sentence = parseInt(p.sentence);
      const validGender =
        p.gender && ["Masculino", "Feminino", "Outro"].includes(p.gender);
      return (
        !isNaN(new Date(p.birthDate)) &&
        age >= 18 &&
        !isNaN(sentence) &&
        sentence >= 1 &&
        sentence <= 100 &&
        validGender
      );
    });

    if (validPrisoners.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Sem Dados Válidos",
        text: "Não há prisioneiros com dados válidos para gerar o relatório.",
        confirmButtonColor: "#ef4444",
      });
      return;
    }

    const totalPrisoners = validPrisoners.length;
    const byStatus = {
      Preso: validPrisoners.filter((p) => p.status === "Preso").length,
      "Liberdade Condicional": validPrisoners.filter(
        (p) => p.status === "Liberdade Condicional"
      ).length,
      Transferido: validPrisoners.filter((p) => p.status === "Transferido")
        .length,
      Solto: validPrisoners.filter((p) => p.status === "Solto").length,
    };

    const byCrime = {};
    validPrisoners.forEach((p) => {
      const crime =
        p.crime === "Outro" && p.otherCrime ? p.otherCrime : p.crime;
      byCrime[crime] = (byCrime[crime] || 0) + 1;
    });

    const byGender = {
      Masculino: validPrisoners.filter((p) => p.gender === "Masculino").length,
      Feminino: validPrisoners.filter((p) => p.gender === "Feminino").length,
      Outro: validPrisoners.filter((p) => p.gender === "Outro").length,
    };

    const averageSentence = validPrisoners.length
      ? (
          validPrisoners.reduce((sum, p) => sum + parseInt(p.sentence), 0) /
          validPrisoners.length
        ).toFixed(1)
      : 0;

    const averageAge = validPrisoners.length
      ? (
          validPrisoners.reduce(
            (sum, p) => sum + calculateAge(p.birthDate),
            0
          ) / validPrisoners.length
        ).toFixed(1)
      : 0;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const logoUrl = "assets/img/logo.png";
    doc.addImage(logoUrl, "PNG", 40, 20, 50, 50);

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Estatísticas", 105, 50);
    doc.setFontSize(14);
    doc.setFont("helvetica", "normal");
    doc.text(`Khosta - ${formatDate(new Date())}`, 105, 70);

    doc.setDrawColor(75, 94, 158);
    doc.setLineWidth(1);
    doc.line(40, 80, 555, 80);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Resumo Geral", 40, 110);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Total de Prisioneiros: ${totalPrisoners}`, 40, 130);
    doc.text(`Pena Média: ${averageSentence} anos`, 40, 150);
    doc.text(`Idade Média: ${averageAge} anos`, 40, 170);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Status", 40, 210);

    const statusData = [
      ["Status", "Quantidade", "Percentual"],
      ...Object.entries(byStatus).map(([status, count]) => [
        status,
        count,
        `${((count / totalPrisoners) * 100).toFixed(1)}%`,
      ]),
    ];

    doc.autoTable({
      startY: 220,
      head: [statusData[0]],
      body: statusData.slice(1),
      theme: "grid",
      headStyles: { fillColor: [75, 94, 158] },
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Crime", 40, doc.lastAutoTable.finalY + 30);

    const crimeData = [
      ["Crime", "Quantidade", "Percentual"],
      ...Object.entries(byCrime).map(([crime, count]) => [
        crime,
        count,
        `${((count / totalPrisoners) * 100).toFixed(1)}%`,
      ]),
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 40,
      head: [crimeData[0]],
      body: crimeData.slice(1),
      theme: "grid",
      headStyles: { fillColor: [75, 94, 158] },
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Distribuição por Sexo", 40, doc.lastAutoTable.finalY + 30);

    const genderData = [
      ["Sexo", "Quantidade", "Percentual"],
      ...Object.entries(byGender).map(([gender, count]) => [
        gender,
        count,
        `${((count / totalPrisoners) * 100).toFixed(1)}%`,
      ]),
    ];

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 40,
      head: [genderData[0]],
      body: genderData.slice(1),
      theme: "grid",
      headStyles: { fillColor: [75, 94, 158] },
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150);
    doc.text(
      "Relatório gerado automaticamente pelo Sistema Khosta",
      40,
      doc.lastAutoTable.finalY + 30
    );

    doc.save(
      `relatorio_prisioneiros_${formatDate(new Date()).replace(/\//g, "-")}.pdf`
    );

    Swal.fire({
      icon: "success",
      title: "Relatório Gerado",
      text: "O relatório em PDF foi baixado com sucesso!",
      timer: 2000,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Erro ao gerar PDF:", error);
    Swal.fire({
      icon: "error",
      title: "Erro ao Gerar PDF",
      text: "Ocorreu um erro ao tentar gerar o relatório. Por favor, tente novamente.",
      confirmButtonColor: "#ef4444",
    });
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return "Data Inválida";
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return date.toLocaleDateString("pt-BR", options);
}

function calculateAge(birthDateString) {
  const birthDate = new Date(birthDateString);
  if (isNaN(birthDate)) return 0;
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
