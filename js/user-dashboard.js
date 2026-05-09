const LOGIN_STORAGE_KEY = "datahub.auth";
const SIDEBAR_COLLAPSED_KEY = "datahub.sidebarCollapsed";
const shell = document.querySelector(".user-shell");
const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");
const menuToggleBtn = document.getElementById("menuToggleBtn");
const toolButtons = Array.from(document.querySelectorAll(".tool-item"));
const toolCards = Array.from(document.querySelectorAll(".tool-card"));
const contentRoot = document.querySelector(".user-content");
const loadCryptoPricesBtn = document.getElementById("loadCryptoPricesBtn");
const btcCharts = new Map();
const appBaseFromUser = window.location.pathname.replace(/\/usuario(?:\/index\.html)?\/?$/, "");
const appOrigin = `${window.location.origin}${appBaseFromUser}`;
const meEndpoint = `${appOrigin}/api/auth/me.php`;
const logoutEndpoint = `${appOrigin}/api/auth/logout.php`;
const cryptoPricesEndpoint = `${appOrigin}/api/crypto/prices.php`;
const goldPricesEndpoint = `${appOrigin}/api/gold/prices.php`;
const loginUrl = `${appOrigin}/login/`;

const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const setSidebarCollapsed = (collapsed) => {
    if (!shell) {
        return;
    }

    shell.classList.toggle("menu-collapsed", collapsed);
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "1" : "0");
};

const hydrateSidebarState = () => {
    if (!shell) {
        return;
    }

    if (window.innerWidth <= 920) {
        shell.classList.remove("menu-collapsed");
        return;
    }

    const collapsed = localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
    shell.classList.toggle("menu-collapsed", collapsed);
};

const setActiveTool = (tool) => {
    toolButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });

    const hasMatchingCard = toolCards.some((card) => card.dataset.panel === tool);

    toolCards.forEach((card) => {
        const shouldHighlight = card.dataset.panel === tool;
        card.classList.toggle("highlight", shouldHighlight);

        if (hasMatchingCard) {
            card.classList.toggle("is-hidden", !shouldHighlight);
        } else {
            card.classList.remove("is-hidden");
        }

        if (shouldHighlight) {
            card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    });
};

const renderError = (message) => {
    const banner = document.createElement("p");
    banner.className = "error-banner";
    banner.textContent = message;
    contentRoot.prepend(banner);
};

const renderAuthRequired = (message) => {
    const wrapper = document.createElement("div");
    wrapper.className = "error-banner";

    const text = document.createElement("p");
    text.textContent = message;

    const action = document.createElement("a");
    action.href = loginUrl;
    action.textContent = "Ir para login";
    action.className = "auth-action-link";

    wrapper.append(text, action);
    contentRoot.prepend(wrapper);
};

const getDashboardSuffix = (buttonOrSuffix) => {
    if (buttonOrSuffix === "Btc" || buttonOrSuffix === "") {
        return buttonOrSuffix;
    }

    const candidateId = buttonOrSuffix?.currentTarget?.id ?? buttonOrSuffix?.target?.id ?? buttonOrSuffix?.id;
    return candidateId === "loadCryptoPricesBtn" ? "" : "Btc";
};

const getScopedElement = (baseId, suffix) => {
    const scoped = document.getElementById(baseId + suffix);
    if (scoped) {
        return scoped;
    }

    return document.getElementById(baseId);
};

const setCryptoFeedback = (message, type, suffix = "Btc") => {
    const el = getScopedElement("cryptoPricesFeedback", suffix);
    if (!el) {
        return;
    }

    el.textContent = message;
    el.className = "tool-feedback";
    if (type) {
        el.classList.add(type);
    }
};

const showToast = (message, type = "info", durationMs = 4500) => {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const icons = { success: "fa-circle-check", error: "fa-circle-xmark", info: "fa-circle-info", loading: "fa-rotate" };
    const icon = icons[type] ?? icons.info;

    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.setAttribute("role", "status");
    toast.innerHTML = `
        <i class="fa-solid ${icon} toast__icon${type === "loading" ? " fa-spin" : ""}"></i>
        <span class="toast__msg">${escapeHtml(message)}</span>
        <button class="toast__close" aria-label="Fechar">&times;</button>
    `;

    const dismiss = () => {
        toast.classList.add("toast--out");
        toast.addEventListener("animationend", () => toast.remove(), { once: true });
    };

    toast.querySelector(".toast__close").addEventListener("click", dismiss);
    container.appendChild(toast);

    if (type !== "loading") {
        setTimeout(dismiss, durationMs);
    }

    return toast;
};

const formatCryptoTimestamp = (value) => {
    if (!value) {
        return "-";
    }

    const normalized = String(value).replace(" ", "T");
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    }).format(date);
};

const formatCryptoPrice = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return String(value ?? "-");
    }

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(numeric);
};

const parseTimestampMs = (value) => {
    const normalized = String(value ?? "").replace(" ", "T");
    const ts = new Date(normalized).getTime();
    return Number.isNaN(ts) ? null : ts;
};

const getLast30DaysWindow = (rows) => {
    const timestamps = rows
        .map((row) => parseTimestampMs(row.timestamp))
        .filter((ts) => ts !== null);

    if (!timestamps.length) {
        return null;
    }

    const endMs = Math.max(...timestamps);
    const startMs = endMs - (30 * 24 * 60 * 60 * 1000);
    return { startMs, endMs };
};

const filterRowsToLast30Days = (rows) => {
    const windowRange = getLast30DaysWindow(rows);
    if (!windowRange) {
        return { filteredRows: [], windowRange: null };
    }

    const filteredRows = rows.filter((row) => {
        const ts = parseTimestampMs(row.timestamp);
        return ts !== null && ts >= windowRange.startMs && ts <= windowRange.endMs;
    });

    return { filteredRows, windowRange };
};

const updateDateFilterLabel = (suffix, windowRange) => {
    const labelEl = getScopedElement("dateFilterLabel", suffix);
    const startEl = getScopedElement("dateFilterStart", suffix);
    const endEl = getScopedElement("dateFilterEnd", suffix);

    if (!labelEl || !startEl || !endEl) {
        return;
    }

    labelEl.textContent = "Ultimos 30 dias";

    if (!windowRange) {
        startEl.textContent = "--/--/----";
        endEl.textContent = "--/--/----";
        return;
    }

    startEl.textContent = formatCryptoTimestamp(new Date(windowRange.startMs).toISOString());
    endEl.textContent = formatCryptoTimestamp(new Date(windowRange.endMs).toISOString());
};

const adjustCryptoTableViewport = (rowsCount, suffix = "Btc") => {
    const el = getScopedElement("cryptoPricesResult", suffix);
    if (!el) {
        return;
    }

    const headerEl = el.querySelector("thead");
    const firstRowEl = el.querySelector("tbody tr");

    if (!headerEl || !firstRowEl) {
        el.style.maxHeight = "none";
        el.style.overflowY = "hidden";
        return;
    }

    const headerHeight = headerEl.getBoundingClientRect().height;
    const rowHeight = firstRowEl.getBoundingClientRect().height;
    const maxVisibleRows = 8;
    const visibleRows = Math.min(rowsCount, maxVisibleRows);
    const contentHeight = Math.ceil(headerHeight + (rowHeight * visibleRows) + 2);

    el.style.maxHeight = `${contentHeight}px`;
    el.style.overflowY = rowsCount > maxVisibleRows ? "auto" : "hidden";
};

const renderCryptoRows = (rows, suffix = "Btc") => {
    const el = getScopedElement("cryptoPricesResult", suffix);
    if (!el) {
        return;
    }

    if (!rows.length) {
        el.hidden = false;
        el.innerHTML = '<p class="crypto-empty">A consulta retornou 0 registros.</p>';
        return;
    }

    const sortedRows = [...rows].sort((a, b) => {
        const tsA = new Date(String(a.timestamp).replace(" ", "T")).getTime();
        const tsB = new Date(String(b.timestamp).replace(" ", "T")).getTime();
        return tsB - tsA; // mais recente primeiro
    });

    const lines = sortedRows.map((row) => {
        const timestamp = escapeHtml(formatCryptoTimestamp(row.timestamp));
        const price = escapeHtml(formatCryptoPrice(row.price));
        return `<tr><td class="timestamp-cell">${timestamp}</td><td class="price-cell">${price}</td></tr>`;
    });

    el.hidden = false;
    el.innerHTML = `
        <table class="crypto-prices-table">
            <thead>
                <tr>
                    <th scope="col">Data / Hora</th>
                    <th scope="col" class="price-col">Preço (USD)</th>
                </tr>
            </thead>
            <tbody>
                ${lines.join("")}
            </tbody>
        </table>
    `;

    adjustCryptoTableViewport(sortedRows.length, suffix);
};

const renderBtcKpis = (rows, suffix = "Btc") => {
    const kpiRow = getScopedElement("btcKpiRow", suffix);
    if (!kpiRow || !rows.length) return;

    const byTime = [...rows].sort((a, b) =>
        new Date(String(a.timestamp).replace(" ", "T")) - new Date(String(b.timestamp).replace(" ", "T"))
    );
    const prices = byTime.map((r) => Number(r.price));
    const last  = prices[prices.length - 1];
    const first = prices[0];
    const max   = Math.max(...prices);
    const min   = Math.min(...prices);
    const changePct = ((last - first) / first) * 100;

    const currentEl = getScopedElement("btcCurrentPrice", suffix);
    const highEl = getScopedElement("btcHighPrice", suffix);
    const lowEl = getScopedElement("btcLowPrice", suffix);
    const changeEl = getScopedElement("btcPriceChange", suffix);

    if (!currentEl || !highEl || !lowEl || !changeEl) {
        return;
    }

    currentEl.textContent = formatCryptoPrice(last);
    highEl.textContent    = formatCryptoPrice(max);
    lowEl.textContent     = formatCryptoPrice(min);

    changeEl.textContent = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
    changeEl.className = `btc-kpi-value ${changePct >= 0 ? "btc-kpi-positive" : "btc-kpi-negative"}`;

    kpiRow.hidden = false;
};

const renderBtcChart = (rows, suffix = "Btc") => {
    const wrapper = getScopedElement("btcChartWrapper", suffix);
    const canvas  = getScopedElement("btcPriceChart", suffix);
    if (!wrapper || !canvas || !rows.length) return;

    if (typeof Chart === "undefined") {
        wrapper.hidden = false;
        wrapper.innerHTML = '<p class="btc-chart-unavailable">Gráfico indisponível — Chart.js não carregou.</p>';
        return;
    }

    const byTime = [...rows].sort((a, b) =>
        new Date(String(a.timestamp).replace(" ", "T")) - new Date(String(b.timestamp).replace(" ", "T"))
    );

    const labels = byTime.map((r) => {
        const d = new Date(String(r.timestamp).replace(" ", "T"));
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit", month: "2-digit",
            hour: "2-digit", minute: "2-digit"
        }).format(d);
    });
    const data   = byTime.map((r) => Number(r.price));
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);

    const existingChart = btcCharts.get(suffix);
    if (existingChart) {
        existingChart.destroy();
        btcCharts.delete(suffix);
    }

    const seriesLabel = suffix === "" ? "OURO/USD" : "BTC/USD";

    const chart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: seriesLabel,
                    data,
                    borderColor: "#0c8bc5",
                    backgroundColor: "rgba(12,139,197,0.07)",
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: "Máxima",
                    data: data.map(() => maxVal),
                    borderColor: "rgba(11,122,95,0.55)",
                    borderWidth: 1,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                },
                {
                    label: "Mínima",
                    data: data.map(() => minVal),
                    borderColor: "rgba(195,90,0,0.55)",
                    borderWidth: 1,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    display: true,
                    position: "top",
                    labels: { boxWidth: 12, font: { size: 11 }, color: "#1a3857" }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ${formatCryptoPrice(ctx.parsed.y)}`
                    }
                }
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 8, maxRotation: 0, font: { size: 11 }, color: "#4a6786" },
                    grid:  { color: "rgba(213,229,243,0.5)" }
                },
                y: {
                    ticks: {
                        callback: (v) => `$${(v / 1000).toFixed(0)}k`,
                        font: { size: 11 },
                        color: "#4a6786"
                    },
                    grid: { color: "rgba(213,229,243,0.5)" }
                }
            }
        }
    });
    btcCharts.set(suffix, chart);

    wrapper.hidden = false;
};

const loadCryptoPrices = async (buttonOrEvent) => {
    const suffix = getDashboardSuffix(buttonOrEvent);
    const endpoint = suffix === "" ? goldPricesEndpoint : cryptoPricesEndpoint;
    const datasetName = suffix === "" ? "gold_prices" : "crypto_prices";
    const btn = getScopedElement("loadCryptoPricesBtn", suffix);
    if (!btn) {
        return;
    }

    btn.disabled = true;
    const loadingToast = showToast("Executando pipeline ETL — Extract + Load...", "loading", 0);

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            credentials: "same-origin"
        });

        const rawBody = await response.text();
        let result = null;

        try {
            result = JSON.parse(rawBody);
        } catch (_parseError) {
            result = null;
        }

        if (!response.ok) {
            const fallbackMessage = `Erro ${response.status} ao consultar ${datasetName}.`;
            const details = result && result.details ? ` Detalhes: ${result.details}` : "";
            if (loadingToast) loadingToast.querySelector(".toast__close").click();
            setCryptoFeedback(((result && result.message) || fallbackMessage) + details, "error", suffix);
            showToast(((result && result.message) || fallbackMessage) + details, "error", 7000);
            return;
        }

        if (!result || !Array.isArray(result.data)) {
            if (loadingToast) loadingToast.querySelector(".toast__close").click();
            setCryptoFeedback(`Resposta inesperada da API para ${datasetName}.`, "error", suffix);
            showToast(`Resposta inesperada da API para ${datasetName}.`, "error", 7000);
            return;
        }

        const { filteredRows, windowRange } = filterRowsToLast30Days(result.data);
        updateDateFilterLabel(suffix, windowRange);

        if (!filteredRows.length) {
            if (loadingToast) loadingToast.querySelector(".toast__close").click();
            renderCryptoRows([], suffix);
            setCryptoFeedback("Sem dados no filtro fixo de 30 dias.", "error", suffix);
            showToast("Sem dados para os ultimos 30 dias.", "info", 5000);
            return;
        }

        renderCryptoRows(filteredRows, suffix);
        renderBtcKpis(filteredRows, suffix);
        renderBtcChart(filteredRows, suffix);
        if (loadingToast) loadingToast.querySelector(".toast__close").click();
        setCryptoFeedback(`Atualizacao concluida: ${filteredRows.length} registros nos ultimos 30 dias.`, "success", suffix);
        showToast(`${filteredRows.length} registros carregados (30 dias).`, "success");
    } catch (_error) {
        if (loadingToast) loadingToast.querySelector(".toast__close").click();
        setCryptoFeedback("Não foi possível executar o fluxo Extract + Load para crypto_prices.", "error", suffix);
        showToast("Falha na conexão com a API. Tente novamente.", "error", 7000);
    } finally {
        btn.disabled = false;
    }
};

window.bindDashboardButtons = () => {
    const ouroBtn = document.getElementById("loadCryptoPricesBtn");
    const btcBtn  = document.getElementById("loadCryptoPricesBtnBtc");
    if (ouroBtn && ouroBtn.dataset.bound !== "1") {
        ouroBtn.addEventListener("click", () => loadCryptoPrices(""));
        ouroBtn.dataset.bound = "1";
    }
    if (btcBtn && btcBtn.dataset.bound !== "1") {
        btcBtn.addEventListener("click", () => loadCryptoPrices("Btc"));
        btcBtn.dataset.bound = "1";
    }
};

const loadSession = async () => {
    try {
        const response = await fetch(meEndpoint, {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            localStorage.removeItem(LOGIN_STORAGE_KEY);
            renderAuthRequired("Sua sessao nao esta ativa nesta pagina.");
            return;
        }

        const result = await response.json();
        if (!result || !result.user) {
            renderError("Sessao invalida. Atualize a pagina.");
            return;
        }

        welcomeText.textContent = `Bem-vindo, ${result.user.name}. Escolha uma ferramenta para continuar.`;

        const sessionPayload = {
            isAuthenticated: true,
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(sessionPayload));
    } catch (_error) {
        renderError("Nao foi possivel validar sua sessao com a API.");
    }
};

const performLogout = async () => {
    try {
        await fetch(logoutEndpoint, {
            method: "POST",
            credentials: "same-origin"
        });
    } finally {
        localStorage.removeItem(LOGIN_STORAGE_KEY);
        window.location.href = loginUrl;
    }
};

toolButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTool(button.dataset.tool));
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
}

if (menuToggleBtn) {
    menuToggleBtn.addEventListener("click", () => {
        if (window.innerWidth <= 920) {
            return;
        }

        const collapsed = !shell.classList.contains("menu-collapsed");
        setSidebarCollapsed(collapsed);
    });
}

bindDashboardButtons();

window.addEventListener("resize", hydrateSidebarState);

hydrateSidebarState();
setActiveTool("dashboard");
loadSession();
