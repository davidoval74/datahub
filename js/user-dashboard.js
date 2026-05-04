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
const cryptoPricesFeedback = document.getElementById("cryptoPricesFeedback");
const cryptoPricesResult = document.getElementById("cryptoPricesResult");
let btcChart = null;
const appBaseFromUser = window.location.pathname.replace(/\/usuario(?:\/index\.html)?\/?$/, "");
const appOrigin = `${window.location.origin}${appBaseFromUser}`;
const meEndpoint = `${appOrigin}/api/auth/me.php`;
const logoutEndpoint = `${appOrigin}/api/auth/logout.php`;
const cryptoPricesEndpoint = `${appOrigin}/api/crypto/prices.php`;
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

const setCryptoFeedback = (message, type) => {
    if (!cryptoPricesFeedback) {
        return;
    }

    cryptoPricesFeedback.textContent = message;
    cryptoPricesFeedback.className = "tool-feedback";
    if (type) {
        cryptoPricesFeedback.classList.add(type);
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

const adjustCryptoTableViewport = (rowsCount) => {
    if (!cryptoPricesResult) {
        return;
    }

    const headerEl = cryptoPricesResult.querySelector("thead");
    const firstRowEl = cryptoPricesResult.querySelector("tbody tr");

    if (!headerEl || !firstRowEl) {
        cryptoPricesResult.style.maxHeight = "none";
        cryptoPricesResult.style.overflowY = "hidden";
        return;
    }

    const headerHeight = headerEl.getBoundingClientRect().height;
    const rowHeight = firstRowEl.getBoundingClientRect().height;
    const maxVisibleRows = 8;
    const visibleRows = Math.min(rowsCount, maxVisibleRows);
    const contentHeight = Math.ceil(headerHeight + (rowHeight * visibleRows) + 2);

    cryptoPricesResult.style.maxHeight = `${contentHeight}px`;
    cryptoPricesResult.style.overflowY = rowsCount > maxVisibleRows ? "auto" : "hidden";
};

const renderCryptoRows = (rows) => {
    if (!cryptoPricesResult) {
        return;
    }

    if (!rows.length) {
        cryptoPricesResult.hidden = false;
        cryptoPricesResult.innerHTML = '<p class="crypto-empty">A consulta retornou 0 registros.</p>';
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

    cryptoPricesResult.hidden = false;
    cryptoPricesResult.innerHTML = `
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

    adjustCryptoTableViewport(sortedRows.length);
};

const renderBtcKpis = (rows) => {
    const kpiRow = document.getElementById("btcKpiRow");
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

    document.getElementById("btcCurrentPrice").textContent = formatCryptoPrice(last);
    document.getElementById("btcHighPrice").textContent    = formatCryptoPrice(max);
    document.getElementById("btcLowPrice").textContent     = formatCryptoPrice(min);

    const changeEl = document.getElementById("btcPriceChange");
    changeEl.textContent = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
    changeEl.className = `btc-kpi-value ${changePct >= 0 ? "btc-kpi-positive" : "btc-kpi-negative"}`;

    kpiRow.hidden = false;
};

const renderBtcChart = (rows) => {
    const wrapper = document.getElementById("btcChartWrapper");
    const canvas  = document.getElementById("btcPriceChart");
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

    if (btcChart) { btcChart.destroy(); btcChart = null; }

    btcChart = new Chart(canvas, {
        type: "line",
        data: {
            labels,
            datasets: [
                {
                    label: "BTC/USD",
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

    wrapper.hidden = false;
};

const loadCryptoPrices = async () => {
    if (!loadCryptoPricesBtn) {
        return;
    }

    loadCryptoPricesBtn.disabled = true;
    const loadingToast = showToast("Executando pipeline ETL — Extract + Load...", "loading", 0);

    try {
        const response = await fetch(cryptoPricesEndpoint, {
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
            const fallbackMessage = `Erro ${response.status} ao consultar crypto_prices.`;
            const details = result && result.details ? ` Detalhes: ${result.details}` : "";
            if (loadingToast) loadingToast.querySelector(".toast__close").click();
            setCryptoFeedback(((result && result.message) || fallbackMessage) + details, "error");
            showToast(((result && result.message) || fallbackMessage) + details, "error", 7000);
            return;
        }

        if (!result || !Array.isArray(result.data)) {
            if (loadingToast) loadingToast.querySelector(".toast__close").click();
            setCryptoFeedback("Resposta inesperada da API para crypto_prices.", "error");
            showToast("Resposta inesperada da API para crypto_prices.", "error", 7000);
            return;
        }

        renderCryptoRows(result.data);
        renderBtcKpis(result.data);
        renderBtcChart(result.data);
        if (loadingToast) loadingToast.querySelector(".toast__close").click();
        setCryptoFeedback(`Atualização concluída: ${result.data.length} registros retornados.`, "success");
        showToast(`${result.data.length} registros carregados com sucesso.`, "success");
    } catch (_error) {
        if (loadingToast) loadingToast.querySelector(".toast__close").click();
        setCryptoFeedback("Não foi possível executar o fluxo Extract + Load para crypto_prices.", "error");
        showToast("Falha na conexão com a API. Tente novamente.", "error", 7000);
    } finally {
        loadCryptoPricesBtn.disabled = false;
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

if (loadCryptoPricesBtn) {
    loadCryptoPricesBtn.addEventListener("click", loadCryptoPrices);
}

window.addEventListener("resize", hydrateSidebarState);

hydrateSidebarState();
setActiveTool("dashboard");
loadSession();
