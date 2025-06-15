document.addEventListener("DOMContentLoaded", function () {
  // Atualiza os dados do dashboard
  updateDashboardStats();
  loadRecentPrisoners();
  loadEndingSoon();
});

// Atualiza estatísticas no dashboard
function updateDashboardStats() {
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

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
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];
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
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];
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


// dashboard.js
document.addEventListener("DOMContentLoaded", function () {
  // Sample data (replace with actual data from prisioneiros.js or backend)
  const crimeData = {
    labels: ["Furto", "Roubo", "Homicídio", "Tráfico de Drogas", "Outro"],
    datasets: [
      {
        data: [20, 15, 10, 5, 10],
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        hoverOffset: 4,
      },
    ],
  };

  const penaltyData = {
    labels: ["Prisioneiro A", "Prisioneiro B", "Prisioneiro C"],
    datasets: [
      {
        label: "Dias Restantes",
        data: [15, 30, 5],
        backgroundColor: "#36A2EB",
        borderColor: "#36A2EB",
        borderWidth: 1,
      },
    ],
  };

  // Chart configurations
  const crimeChartConfig = {
    type: "pie",
    data: crimeData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Distribuição por Crime" },
      },
    },
  };

  const penaltyChartConfig = {
    type: "bar",
    data: penaltyData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: "top" },
        title: { display: true, text: "Penas que Terminam em Breve" },
      },
      scales: { y: { beginAtZero: true } },
    },
  };

  // Render charts
  const crimeDistributionChart = new Chart(
    document.getElementById("crimeDistributionChart").getContext("2d"),
    crimeChartConfig
  );

  const penaltiesEndingSoonChart = new Chart(
    document.getElementById("penaltiesEndingSoonChart").getContext("2d"),
    penaltyChartConfig
  );

  // Update welcome message with current time
  const welcomeMessage = document.querySelector(".welcome-message");
  const now = new Date();
  welcomeMessage.textContent = `Bem-vindo! Hoje é ${now.toLocaleDateString(
    "pt-BR",
    { weekday: "long", year: "numeric", month: "long", day: "numeric" }
  )} às ${now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })} CAT`;
});