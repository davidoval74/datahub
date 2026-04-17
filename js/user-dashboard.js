const LOGIN_STORAGE_KEY = "datahub.auth";
const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");
const toolButtons = Array.from(document.querySelectorAll(".tool-item"));
const toolCards = Array.from(document.querySelectorAll(".tool-card"));
const contentRoot = document.querySelector(".user-content");
const appBaseFromUser = window.location.pathname.replace(/\/usuario(?:\/index\.html)?\/?$/, "");
const appOrigin = `${window.location.origin}${appBaseFromUser}`;
const meEndpoint = `${appOrigin}/api/auth/me.php`;
const logoutEndpoint = `${appOrigin}/api/auth/logout.php`;
const loginUrl = `${appOrigin}/login/`;

const setActiveTool = (tool) => {
    toolButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });

    toolCards.forEach((card) => {
        const shouldHighlight = card.dataset.panel === tool;
        card.classList.toggle("highlight", shouldHighlight);
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

logoutBtn.addEventListener("click", performLogout);
setActiveTool("dashboard");
loadSession();
