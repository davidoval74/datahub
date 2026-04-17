const LOGIN_STORAGE_KEY = "datahub.auth";
const REMEMBER_EMAIL_KEY = "datahub.rememberedEmail";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");
const feedback = document.getElementById("feedback");
const loginEndpoint = new URL("../api/auth/login.php", window.location.href).href;

const setFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = "feedback";
    if (type) {
        feedback.classList.add(type);
    }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const saveSession = (user) => {
    const payload = {
        isAuthenticated: true,
        id: user.id,
        name: user.name,
        email: user.email,
        loginAt: new Date().toISOString()
    };
    localStorage.setItem(LOGIN_STORAGE_KEY, JSON.stringify(payload));
};

const hydrateRememberedEmail = () => {
    const remembered = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (remembered) {
        emailInput.value = remembered;
        rememberMeInput.checked = true;
    }
};

const submitLogin = async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!isValidEmail(email)) {
        setFeedback("Informe um email valido.", "error");
        return;
    }

    if (!password) {
        setFeedback("Informe sua senha.", "error");
        return;
    }

    try {
        const response = await fetch(loginEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ email, password })
        });

        const rawBody = await response.text();
        let result = null;

        try {
            result = JSON.parse(rawBody);
        } catch (_parseError) {
            result = null;
        }

        if (!response.ok) {
            const fallbackMessage = `Erro ${response.status} ao autenticar.`;
            setFeedback((result && result.message) || fallbackMessage, "error");
            return;
        }

        if (!result || !result.user) {
            setFeedback("A API respondeu em formato inesperado.", "error");
            return;
        }

        saveSession(result.user);

        if (rememberMeInput.checked) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        setFeedback("Login realizado com sucesso. Redirecionando...", "success");
        setTimeout(() => {
            window.location.href = "../usuario/";
        }, 700);
    } catch (_error) {
        setFeedback(`Nao foi possivel conectar a API (${loginEndpoint}).`, "error");
    }
};

hydrateRememberedEmail();
form.addEventListener("submit", submitLogin);
