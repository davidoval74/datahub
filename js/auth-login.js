const LOGIN_STORAGE_KEY = "datahub.auth";
const REMEMBER_EMAIL_KEY = "datahub.rememberedEmail";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const rememberMeInput = document.getElementById("rememberMe");
const feedback = document.getElementById("feedback");
const appBaseFromLogin = window.location.pathname.replace(/\/login(?:\/index\.html)?\/?$/, "");
const appOrigin = `${window.location.origin}${appBaseFromLogin}`;
const loginEndpoint = `${appOrigin}/api/auth/login.php`;
const dashboardUrl = "https://datahubconsulting.com.br/usuario/";
let recaptchaToken = "";

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
    if (remembered && emailInput) {
        emailInput.value = remembered;
        if (rememberMeInput) {
            rememberMeInput.checked = true;
        }
    }
};

window.onLoginRecaptchaSuccess = (token) => {
    recaptchaToken = String(token || "").trim();
};

window.onLoginRecaptchaExpired = () => {
    recaptchaToken = "";
};

const getRecaptchaToken = () => {
    if (recaptchaToken) {
        return recaptchaToken;
    }

    const responseField = document.querySelector('[name="g-recaptcha-response"]');
    const fieldValue = responseField?.value?.trim();

    if (fieldValue) {
        return fieldValue;
    }

    if (window.grecaptcha && typeof window.grecaptcha.getResponse === "function") {
        return window.grecaptcha.getResponse();
    }

    return "";
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

    const recaptchaToken = getRecaptchaToken();
    if (!recaptchaToken) {
        setFeedback("Por favor, confirme que voce nao eh um robo.", "error");
        return;
    }

    try {
        const response = await fetch(loginEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ 
                email, 
                password,
                recaptcha_token: recaptchaToken
            })
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
            if (window.grecaptcha) {
                grecaptcha.reset();
            }
            recaptchaToken = "";
            return;
        }

        if (!result || !result.user) {
            setFeedback("A API respondeu em formato inesperado.", "error");
            return;
        }

        saveSession(result.user);

        if (rememberMeInput && rememberMeInput.checked) {
            localStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else if (rememberMeInput) {
            localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        setFeedback(`Login realizado com sucesso. Redirecionando para ${dashboardUrl}`, "success");
        setTimeout(() => {
            window.location.replace(dashboardUrl);
        }, 350);
    } catch (_error) {
        setFeedback(`Nao foi possivel conectar a API (${loginEndpoint}).`, "error");
        if (window.grecaptcha) {
            grecaptcha.reset();
        }
        recaptchaToken = "";
    }
};

hydrateRememberedEmail();
if (form) {
    form.addEventListener("submit", submitLogin);
}
