const LOGIN_STORAGE_KEY = "datahub.auth";
const SIDEBAR_STATE_KEY = "datahub.userSidebarCollapsed";

const body = document.body;
const shell = document.querySelector(".user-shell");
const welcomeText = document.getElementById("welcomeText");
const logoutBtn = document.getElementById("logoutBtn");
const pageTitle = document.getElementById("pageTitle");
const pageDescription = document.getElementById("pageDescription");
const contentRoot = document.querySelector(".user-content");
const toolButtons = Array.from(document.querySelectorAll(".tool-item"));
const toolCards = Array.from(document.querySelectorAll(".tool-card"));
const routeLinks = Array.from(document.querySelectorAll("[data-route]"));
const toggleButtons = Array.from(document.querySelectorAll("[data-action='toggle-sidebar']"));
const closeButtons = Array.from(document.querySelectorAll("[data-action='close-sidebar']"));

const appBaseFromUser = window.location.pathname.replace(/\/usuario(?:\/(?:relatorios|documentos|tarefas|suporte))?(?:\/index\.html)?\/?$/, "");
const appOrigin = `${window.location.origin}${appBaseFromUser}`;
const meEndpoint = `${appOrigin}/api/auth/me.php`;
const logoutEndpoint = `${appOrigin}/api/auth/logout.php`;
const loginUrl = `${appOrigin}/login/`;

const routeMap = {
    dashboard: `${appOrigin}/usuario/`,
    relatorios: `${appOrigin}/usuario/relatorios/`,
    documentos: `${appOrigin}/usuario/documentos/`,
    tarefas: `${appOrigin}/usuario/tarefas/`,
    suporte: `${appOrigin}/usuario/suporte/`
};

const currentTool = body.dataset.activeTool || "dashboard";

const setActiveTool = (tool) => {
    toolButtons.forEach((button) => {
        button.classList.toggle("active", button.dataset.tool === tool);
    });

    toolCards.forEach((card) => {
        card.classList.toggle("highlight", card.dataset.panel === tool);
    });
};

const hydrateRouteLinks = () => {
    routeLinks.forEach((element) => {
        const route = element.dataset.route;
        if (routeMap[route]) {
            element.setAttribute("href", routeMap[route]);
        }
    });
};

const applyPageMeta = () => {
    if (pageTitle && body.dataset.pageTitle) {
        pageTitle.textContent = body.dataset.pageTitle;
    }

    if (pageDescription && body.dataset.pageDescription) {
        pageDescription.textContent = body.dataset.pageDescription;
    }
};

const applyDesktopSidebarState = (collapsed) => {
    shell.classList.toggle("sidebar-collapsed", collapsed);
    localStorage.setItem(SIDEBAR_STATE_KEY, collapsed ? "1" : "0");
};

const toggleSidebar = () => {
    if (window.innerWidth <= 920) {
        shell.classList.toggle("sidebar-open");
        return;
    }

    const collapsed = !shell.classList.contains("sidebar-collapsed");
    applyDesktopSidebarState(collapsed);
};

const syncSidebarState = () => {
    if (window.innerWidth <= 920) {
        shell.classList.remove("sidebar-collapsed");
        return;
    }

    shell.classList.remove("sidebar-open");
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY) === "1";
    applyDesktopSidebarState(saved);
};

const renderError = (message) => {
    const existing = contentRoot.querySelector(".error-banner");
    if (existing) {
        existing.remove();
    }

    const banner = document.createElement("p");
    banner.className = "error-banner";
    banner.textContent = message;
    contentRoot.prepend(banner);
};

const redirectToLogin = () => {
    localStorage.removeItem(LOGIN_STORAGE_KEY);
    window.location.replace(loginUrl);
};

const loadSession = async () => {
    try {
        const response = await fetch(meEndpoint, {
            method: "GET",
            credentials: "same-origin"
        });

        if (!response.ok) {
            redirectToLogin();
            return;
        }

        const result = await response.json();
        if (!result || !result.user) {
            redirectToLogin();
            return;
        }

        if (welcomeText) {
            welcomeText.textContent = `Bem-vindo, ${result.user.name}. Acesso liberado para a rota ${currentTool}.`;
        }

        const sessionPayload = {
            isAuthenticated: true,
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            loginAt: new Date().toISOString()
        };
        localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(sessionPayload));
        body.classList.remove("auth-pending");
    } catch (_error) {
        renderError("Nao foi possivel validar sua sessao. Redirecionando para login...");
        setTimeout(redirectToLogin, 250);
    }
};

const performLogout = async () => {
    try {
        await fetch(logoutEndpoint, {
            method: "POST",
            credentials: "same-origin"
        });
    } finally {
        redirectToLogin();
    }
};

toggleButtons.forEach((button) => {
    button.addEventListener("click", toggleSidebar);
});

closeButtons.forEach((button) => {
    button.addEventListener("click", () => shell.classList.remove("sidebar-open"));
});

window.addEventListener("resize", syncSidebarState);

if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
}

hydrateRouteLinks();
applyPageMeta();
setActiveTool(currentTool);
syncSidebarState();
loadSession();
