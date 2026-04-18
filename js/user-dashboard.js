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

const renderCryptoRows = (rows) => {
    if (!cryptoPricesResult) {
        return;
    }

    if (!rows.length) {
        cryptoPricesResult.hidden = false;
        cryptoPricesResult.innerHTML = '<p class="crypto-empty">A consulta retornou 0 registros.</p>';
        return;
    }

    const lines = rows.map((row) => {
        const timestamp = escapeHtml(row.timestamp);
        const price = escapeHtml(row.price);
        return `<tr><td>${timestamp}</td><td>${price}</td></tr>`;
    });

    cryptoPricesResult.hidden = false;
    cryptoPricesResult.innerHTML = `
        <table class="crypto-prices-table">
            <thead>
                <tr>
                    <th>timestamp</th>
                    <th>price</th>
                </tr>
            </thead>
            <tbody>
                ${lines.join("")}
            </tbody>
        </table>
    `;
};

const loadCryptoPrices = async () => {
    if (!loadCryptoPricesBtn) {
        return;
    }

    loadCryptoPricesBtn.disabled = true;
    setCryptoFeedback("Consultando banco de dados...", "");

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
            setCryptoFeedback((result && result.message) || fallbackMessage, "error");
            return;
        }

        if (!result || !Array.isArray(result.data)) {
            setCryptoFeedback("Resposta inesperada da API para crypto_prices.", "error");
            return;
        }

        renderCryptoRows(result.data);
        setCryptoFeedback(`Consulta concluida: ${result.data.length} registros retornados.`, "success");
    } catch (_error) {
        setCryptoFeedback("Nao foi possivel conectar ao endpoint de crypto_prices.", "error");
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
