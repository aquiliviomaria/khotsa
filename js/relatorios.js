// relatorios.js - Atualização para exportação
import { db, collection, getDocs, query, where, orderBy } from "./firebase.js";

document.addEventListener("DOMContentLoaded", function () {
  // Carrega os dados dos prisioneiros
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];

  // Configura os gráficos
  setupCharts(prisoners);

  // Carrega a tabela de penas que terminam em breve
  loadEndingSoonTable(prisoners);

  // Carrega o histórico de movimentações
  loadHistoryTable(prisoners);

  // Configura botões de exportação
  setupExportButtons(prisoners);
});

// Configura os gráficos de relatórios
function setupCharts(prisoners) {
  // Gráfico por situação
  const situationCtx = document.getElementById("situationChart");
  if (situationCtx) {
    // Agrupa por situação
    const situationCounts = prisoners.reduce((acc, prisoner) => {
      acc[prisoner.status] = (acc[prisoner.status] || 0) + 1;
      return acc;
    }, {});

    const situationLabels = Object.keys(situationCounts);
    const situationData = Object.values(situationCounts);

    // Cores baseadas no status
    const backgroundColors = situationLabels.map((label) => {
      switch (label) {
        case "Preso":
          return "rgba(239, 68, 68, 0.7)";
        case "Liberdade Condicional":
          return "rgba(234, 179, 8, 0.7)";
        case "Transferido":
          return "rgba(59, 130, 246, 0.7)";
        case "Solto":
          return "rgba(16, 185, 129, 0.7)";
        default:
          return "rgba(156, 163, 175, 0.7)";
      }
    });

    new Chart(situationCtx, {
      type: "doughnut",
      data: {
        labels: situationLabels,
        datasets: [
          {
            data: situationData,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
          },
        },
      },
    });
  }

  // Gráfico por crime
  const crimeCtx = document.getElementById("crimeChart");
  if (crimeCtx) {
    // Agrupa por crime
    const crimeCounts = prisoners.reduce((acc, prisoner) => {
      acc[prisoner.crime] = (acc[prisoner.crime] || 0) + 1;
      return acc;
    }, {});

    // Ordena por quantidade (maior primeiro)
    const sortedCrimes = Object.entries(crimeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6); // Limita a 6 crimes mais comuns

    const crimeLabels = sortedCrimes.map((item) => item[0]);
    const crimeData = sortedCrimes.map((item) => item[1]);

    // Cores baseadas no crime
    const backgroundColors = crimeLabels.map((label) => {
      switch (label) {
        case "Homicídio":
          return "rgba(239, 68, 68, 0.7)";
        case "Roubo":
          return "rgba(249, 115, 22, 0.7)";
        case "Furto":
          return "rgba(234, 179, 8, 0.7)";
        case "Tráfico de Drogas":
          return "rgba(168, 85, 247, 0.7)";
        case "Estupro":
          return "rgba(236, 72, 153, 0.7)";
        case "Sequestro":
          return "rgba(99, 102, 241, 0.7)";
        case "Corrupção":
          return "rgba(59, 130, 246, 0.7)";
        default:
          return "rgba(156, 163, 175, 0.7)";
      }
    });

    new Chart(crimeCtx, {
      type: "bar",
      data: {
        labels: crimeLabels,
        datasets: [
          {
            label: "Prisioneiros",
            data: crimeData,
            backgroundColor: backgroundColors,
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  }
}

// Carrega a tabela de penas que terminam em breve
function loadEndingSoonTable(prisoners) {
  const tableBody = document.getElementById("endingSoonTable");

  if (!tableBody) return;

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

  tableBody.innerHTML = "";

  if (soon.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-4 text-center text-gray-500">
                    Nenhuma pena terminando nos próximos 6 meses
                </td>
            </tr>
        `;
    return;
  }

  soon.forEach((prisoner) => {
    const entryDate = new Date(prisoner.entryDate);
    const endDate = new Date(entryDate);
    endDate.setFullYear(endDate.getFullYear() + prisoner.sentence);

    const daysLeft = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));

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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${prisoner.sentence}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium ${
                  daysLeft < 30 ? "text-red-600" : "text-indigo-600"
                }">
                    ${formatDate(endDate)}
                </div>
                <div class="text-xs text-gray-500">${daysLeft} dias restantes</div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Carrega o histórico de movimentações
function loadHistoryTable(prisoners) {
  const tableBody = document.getElementById("historyTable");

  if (!tableBody) return;

  // Coleta todos os eventos de histórico
  let allHistory = [];

  prisoners.forEach((prisoner) => {
    prisoner.history.forEach((event) => {
      allHistory.push({
        date: event.date,
        name: prisoner.fullName,
        process: prisoner.processNumber,
        type: "Alteração de Status",
        details: event.details,
      });
    });
  });

  // Ordena por data (mais recente primeiro)
  allHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

  tableBody.innerHTML = "";

  if (allHistory.length === 0) {
    tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Nenhuma movimentação registrada
                </td>
            </tr>
        `;
    return;
  }

  // Limita a 10 eventos mais recentes
  allHistory.slice(0, 10).forEach((event) => {
    const row = document.createElement("tr");
    row.className = "hover:bg-gray-50";
    row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDateTime(event.date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${
                  event.name
                }</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${event.process}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${event.type}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${event.details}
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// Configura botões de exportação
function setupExportButtons(prisoners) {
  // Exportar por situação
  const exportSituation = document.getElementById("exportSituation");
  if (exportSituation) {
    exportSituation.addEventListener("click", () => {
      // Implementar lógica de exportação (CSV, PDF, etc.)
      Swal.fire(
        "Exportar",
        "Funcionalidade de exportação será implementada na próxima versão.",
        "info"
      );
    });
  }

  // Exportar por crime
  const exportCrime = document.getElementById("exportCrime");
  if (exportCrime) {
    exportCrime.addEventListener("click", () => {
      // Implementar lógica de exportação (CSV, PDF, etc.)
      Swal.fire(
        "Exportar",
        "Funcionalidade de exportação será implementada na próxima versão.",
        "info"
      );
    });
  }

  // Exportar penas que terminam em breve
  const exportEndingSoon = document.getElementById("exportEndingSoon");
  if (exportEndingSoon) {
    exportEndingSoon.addEventListener("click", () => {
      // Implementar lógica de exportação (CSV, PDF, etc.)
      Swal.fire(
        "Exportar",
        "Funcionalidade de exportação será implementada na próxima versão.",
        "info"
      );
    });
  }

  // Exportar histórico
  const exportHistory = document.getElementById("exportHistory");
  if (exportHistory) {
    exportHistory.addEventListener("click", () => {
      // Implementar lógica de exportação (CSV, PDF, etc.)
      Swal.fire(
        "Exportar",
        "Funcionalidade de exportação será implementada na próxima versão.",
        "info"
      );
    });
  }
}

// Funções auxiliares
function formatDate(dateString) {
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}

function formatDateTime(dateString) {
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  };
  return new Date(dateString).toLocaleDateString("pt-BR", options);
}
