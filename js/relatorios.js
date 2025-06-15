// relatorios.js
document.addEventListener("DOMContentLoaded", function () {
  const prisoners = JSON.parse(localStorage.getItem("prisoners")) || [];
  const visitors = JSON.parse(localStorage.getItem("visitors")) || [];
  const visits = JSON.parse(localStorage.getItem("visits")) || [];

  // Atualiza os cartões de estatísticas
  updateStatsCards();

  // Carrega as tabelas iniciais
  loadEndingSoonTable();
  loadHistoryTable();
  loadVisitorsTable();

  // Configura os filtros
  setupFilters();

  // Configura os botões de exportação
  setupExportButtons();

  // Função para atualizar os cartões de estatísticas
  function updateStatsCards() {
    const totalPrisoners = document.getElementById("totalPrisoners");
    const totalVisitors = document.getElementById("totalVisitors");
    const recentVisits = document.getElementById("recentVisits");
    const endingSoon = document.getElementById("endingSoon");

    if (totalPrisoners) totalPrisoners.textContent = prisoners.length;
    if (totalVisitors)
      totalVisitors.textContent = visitors.filter((v) => v.active).length;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    if (recentVisits) {
      recentVisits.textContent = visits.filter(
        (v) => new Date(v.visitDate) >= thirtyDaysAgo
      ).length;
    }

    if (endingSoon) {
      endingSoon.textContent = prisoners.filter((p) => {
        if (p.status !== "Preso") return false;
        const entryDate = new Date(p.entryDate);
        const endDate = new Date(entryDate);
        endDate.setFullYear(endDate.getFullYear() + (p.sentence || 0));
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return endDate <= sixMonthsFromNow && !isNaN(endDate.getTime());
      }).length;
    }
  }

  // Função para carregar a tabela de penas próximas do término
  function loadEndingSoonTable(filteredPrisoners = null) {
    const tableBody = document.getElementById("endingSoonTable");
    const data =
      filteredPrisoners ||
      prisoners.filter((p) => {
        if (p.status !== "Preso") return false;
        const entryDate = new Date(p.entryDate);
        const endDate = new Date(entryDate);
        endDate.setFullYear(endDate.getFullYear() + (p.sentence || 0));
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
        return endDate <= sixMonthsFromNow && !isNaN(endDate.getTime());
      });

    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-4 text-center text-gray-500 text-sm">Nenhuma pena terminando nos próximos 6 meses</td>
        </tr>
      `;
      return;
    }

    data.sort((a, b) => {
      const aEnd = new Date(a.entryDate);
      aEnd.setFullYear(aEnd.getFullYear() + (a.sentence || 0));
      const bEnd = new Date(b.entryDate);
      bEnd.setFullYear(bEnd.getFullYear() + (b.sentence || 0));
      return aEnd - bEnd;
    });

    data.forEach((prisoner) => {
      const entryDate = new Date(prisoner.entryDate);
      const endDate = new Date(entryDate);
      endDate.setFullYear(endDate.getFullYear() + (prisoner.sentence || 0));
      const daysLeft = Math.floor(
        (endDate - new Date()) / (1000 * 60 * 60 * 24)
      );
      const displayCrime =
        prisoner.crime === "Outro" && prisoner.otherCrime
          ? prisoner.otherCrime
          : prisoner.crime;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          prisoner.fullName || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          displayCrime || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          formatDate(endDate) || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm ${
          daysLeft < 30 ? "text-red-600" : "text-indigo-600"
        }">${daysLeft} dias</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Função para carregar a tabela de histórico de movimentações
  function loadHistoryTable(filteredHistory = null) {
    const tableBody = document.getElementById("historyTable");
    let history = [];
    prisoners.forEach((p) => {
      p.history.forEach((h) => {
        history.push({ prisoner: p, history: h });
      });
    });

    const data =
      filteredHistory ||
      history.sort(
        (a, b) => new Date(b.history.date) - new Date(a.history.date)
      );

    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-4 text-center text-gray-500 text-sm">Nenhuma movimentação registrada</td>
        </tr>
      `;
      return;
    }

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          formatDate(item.history.date) || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          item.history.status || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          item.history.details || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          item.prisoner.fullName || "N/A"
        }</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Função para carregar a tabela de visitantes
  function loadVisitorsTable(filteredVisitors = null) {
    const tableBody = document.getElementById("visitorsTable");
    const visitorFilter = document.getElementById("visitorFilter");
    const searchInput = document.getElementById("searchVisitors");
    const data = filteredVisitors || visitors;

    tableBody.innerHTML = "";

    if (data.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="px-6 py-4 text-center text-gray-500 text-sm">Nenhum visitante encontrado</td>
        </tr>
      `;
      return;
    }

    data.forEach((visitor) => {
      const prisoner = prisoners.find((p) => p.id === visitor.prisonerId) || {};
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          visitor.fullName || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          visitor.document || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${
          visitor.relation || "N/A"
        }</td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            visitor.active
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }">
            ${visitor.active ? "Ativo" : "Inativo"}
          </span>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Configura a busca e filtro de visitantes
    if (searchInput && visitorFilter) {
      const applyFilters = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = visitorFilter.value;

        const filtered = visitors.filter((visitor) => {
          const matchesSearch =
            (visitor.fullName &&
              visitor.fullName.toLowerCase().includes(searchTerm)) ||
            (visitor.document &&
              visitor.document.toLowerCase().includes(searchTerm)) ||
            (visitor.relation &&
              visitor.relation.toLowerCase().includes(searchTerm));

          const matchesFilter =
            filterValue === "all"
              ? true
              : filterValue === "active"
              ? visitor.active
              : !visitor.active;

          return matchesSearch && matchesFilter;
        });

        loadVisitorsTable(filtered);
      };

      searchInput.addEventListener("input", applyFilters);
      visitorFilter.addEventListener("change", applyFilters);
    }
  }

  // Função para configurar os filtros
  function setupFilters() {
    const applyFiltersBtn = document.getElementById("applyFilters");
    if (!applyFiltersBtn) return;

    applyFiltersBtn.addEventListener("click", function () {
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;
      const reportType = document.getElementById("reportType").value;

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        Swal.fire({
          icon: "error",
          title: "Erro",
          text: "A data inicial não pode ser posterior à data final.",
          confirmButtonColor: "#ef4444",
        });
        return;
      }

      if (reportType === "all" || reportType === "prisoners") {
        const filteredPrisoners = prisoners.filter((p) => {
          if (!startDate || !endDate) return true;
          const entryDate = new Date(p.entryDate);
          return (
            entryDate >= new Date(startDate) && entryDate <= new Date(endDate)
          );
        });
        loadEndingSoonTable(
          filteredPrisoners.filter((p) => {
            if (p.status !== "Preso") return false;
            const endDate = new Date(p.entryDate);
            endDate.setFullYear(endDate.getFullYear() + (p.sentence || 0));
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            return endDate <= sixMonthsFromNow;
          })
        );
      }

      if (reportType === "all" || reportType === "movements") {
        let history = [];
        prisoners.forEach((p) => {
          p.history.forEach((h) => {
            history.push({ prisoner: p, history: h });
          });
        });
        const filteredHistory = history.filter((item) => {
          if (!startDate || !endDate) return true;
          const historyDate = new Date(item.history.date);
          return (
            historyDate >= new Date(startDate) &&
            historyDate <= new Date(endDate)
          );
        });
        loadHistoryTable(filteredHistory);
      }

      if (reportType === "all" || reportType === "visitors") {
        const filteredVisitors = visitors.filter((v) => {
          if (!startDate || !endDate) return true;
          const createdAt = new Date(v.createdAt);
          return (
            createdAt >= new Date(startDate) && createdAt <= new Date(endDate)
          );
        });
        loadVisitorsTable(filteredVisitors);
      }

      Swal.fire({
        icon: "success",
        title: "Filtros Aplicados",
        text: "Os relatórios foram filtrados com sucesso!",
        timer: 1500,
        showConfirmButton: false,
      });
    });
  }

  // Função para configurar os botões de exportação
  function setupExportButtons() {
    const exportEndingSoon = document.getElementById("exportEndingSoon");
    const exportHistory = document.getElementById("exportHistory");
    const exportVisitorsList = document.getElementById("exportVisitorsList");

    if (exportEndingSoon) {
      exportEndingSoon.addEventListener("click", () =>
        exportToPDF("endingSoon")
      );
    }
    if (exportHistory) {
      exportHistory.addEventListener("click", () => exportToPDF("history"));
    }
    if (exportVisitorsList) {
      exportVisitorsList.addEventListener("click", () =>
        exportToPDF("visitors")
      );
    }
  }

  // Função para exportar relatórios em PDF
  function exportToPDF(reportType) {
    try {
      // Verifica se jsPDF e autoTable estão disponíveis
      if (
        typeof jsPDF === "undefined" ||
        typeof jsPDF.prototype.autoTable !== "function"
      ) {
        throw new Error(
          "A biblioteca jsPDF ou o plugin autoTable não foi carregado corretamente."
        );
      }

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4",
      });

      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório Khosta", 40, 50);
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${formatDate(new Date())}`, 40, 70);

      let data, headers, title;

      if (reportType === "endingSoon") {
        title = "Penas Próximas do Término";
        headers = ["Prisioneiro", "Crime", "Término", "Dias Restantes"];
        data = prisoners
          .filter((p) => {
            if (p.status !== "Preso") return false;
            const entryDate = new Date(p.entryDate);
            const endDate = new Date(entryDate);
            endDate.setFullYear(endDate.getFullYear() + (p.sentence || 0));
            const sixMonthsFromNow = new Date();
            sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
            return endDate <= sixMonthsFromNow && !isNaN(endDate.getTime());
          })
          .map((p) => {
            const endDate = new Date(p.entryDate);
            endDate.setFullYear(endDate.getFullYear() + (p.sentence || 0));
            const daysLeft = Math.floor(
              (endDate - new Date()) / (1000 * 60 * 60 * 24)
            );
            const displayCrime =
              p.crime === "Outro" && p.otherCrime ? p.otherCrime : p.crime;
            return [
              p.fullName || "N/A",
              displayCrime || "N/A",
              formatDate(endDate) || "N/A",
              `${daysLeft} dias`,
            ];
          });
      } else if (reportType === "history") {
        title = "Histórico de Movimentações";
        headers = ["Data", "Tipo", "Detalhes", "Prisioneiro"];
        data = [];
        prisoners.forEach((p) => {
          p.history.forEach((h) => {
            data.push([
              formatDate(h.date) || "N/A",
              h.status || "N/A",
              h.details || "N/A",
              p.fullName || "N/A",
            ]);
          });
        });
        data.sort((a, b) => new Date(b[0]) - new Date(a[0]));
      } else if (reportType === "visitors") {
        title = "Visitantes Cadastrados";
        headers = ["Visitante", "Documento", "Relação", "Status"];
        data = visitors.map((v) => [
          v.fullName || "N/A",
          v.document || "N/A",
          v.relation || "N/A",
          v.active ? "Ativo" : "Inativo",
        ]);
      }

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, 40, 100);

      if (!data || data.length === 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Nenhum dado disponível para este relatório.", 40, 130);
      } else {
        doc.autoTable({
          startY: 110,
          head: [headers],
          body: data,
          theme: "grid",
          headStyles: { fillColor: [75, 94, 158] },
          bodyStyles: { fontSize: 10 },
          didDrawCell: function (data) {
            if (data.section === "body" && data.cell.raw.includes("N/A")) {
              console.warn(`Valor N/A encontrado em: ${data.cell.raw}`);
            }
          },
        });
      }

      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(150);
      doc.text(
        "Relatório gerado automaticamente pelo Sistema Khosta",
        40,
        doc.lastAutoTable ? doc.lastAutoTable.finalY + 30 : 130
      );

      const fileName = `relatorio_${reportType}_${formatDate(
        new Date()
      ).replace(/\//g, "-")}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: "success",
        title: "Relatório Exportado",
        text: "O relatório foi gerado e baixado com sucesso!",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Swal.fire({
        icon: "error",
        title: "Erro ao Gerar PDF",
        text: `Ocorreu um erro ao tentar gerar o relatório. Por favor, tente novamente. Detalhes: ${error.message}`,
        confirmButtonColor: "#ef4444",
      });
    }
  }

  // Função para alternar visibilidade das tabelas
  window.toggleTableVisibility = function (tableId) {
    const table = document.getElementById(tableId);
    table.classList.toggle("hidden");
    const button = document.querySelector(
      `button[onclick="toggleTableVisibility('${tableId}')"] i`
    );
    button.classList.toggle("fa-eye-slash");
    button.classList.toggle("fa-eye");
  };

  // Funções auxiliares
  function formatDate(dateString) {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Data Inválida";
    const options = { day: "2-digit", month: "2-digit", year: "numeric" };
    return date.toLocaleDateString("pt-BR", options);
  }
});
