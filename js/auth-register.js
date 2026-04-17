const registerForm = document.getElementById("registerForm");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const feedback = document.getElementById("feedback");
const registerEndpoint = new URL("../api/auth/register.php", window.location.href).href;

const setFeedback = (message, type) => {
    feedback.textContent = message;
    feedback.className = "feedback";
    if (type) {
        feedback.classList.add(type);
    }
};

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

const submitRegister = async (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (name.length < 3) {
        setFeedback("Nome deve ter pelo menos 3 caracteres.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        setFeedback("Informe um email valido.", "error");
        return;
    }

    if (password.length < 8) {
        setFeedback("Senha deve ter no minimo 8 caracteres.", "error");
        return;
    }

    if (password !== confirmPassword) {
        setFeedback("As senhas nao coincidem.", "error");
        return;
    }

    try {
        const response = await fetch(registerEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "same-origin",
            body: JSON.stringify({ name, email, password })
        });

        const rawBody = await response.text();
        let result = null;

        try {
            result = JSON.parse(rawBody);
        } catch (_parseError) {
            result = null;
        }

        if (!response.ok) {
            const fallbackMessage = `Erro ${response.status} no cadastro.`;
            setFeedback((result && result.message) || fallbackMessage, "error");
            return;
        }

        if (!result || !result.ok) {
            setFeedback("A API respondeu em formato inesperado.", "error");
            return;
        }

        setFeedback("Cadastro concluido. Voce sera redirecionado para login.", "success");
        setTimeout(() => {
            window.location.href = "../login/";
        }, 900);
    } catch (_error) {
        setFeedback(`Nao foi possivel conectar a API (${registerEndpoint}).`, "error");
    }
};

registerForm.addEventListener("submit", submitRegister);
