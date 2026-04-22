# reCAPTCHA v3 - Implementação para Proteção contra Força Bruta

## 📋 Resumo da Implementação

Foi adicionada proteção **reCAPTCHA v3** nos endpoints de **login** e **registro** para mitigar ataques de força bruta.

---

## 🔑 Chaves Configuradas

- **Site Key**: `6LcVzcQsAAAAAD75hSBJ783M8JwxcdR_eoQRu9oa`
- **Secret Key**: `6LcVzcQsAAAAALbPTRrF5fbLJRsOGUtFSJ3zGILs`

---

## 📝 Alterações Realizadas

### **1. Frontend HTML**

#### `login/index.html` e `cadastro/index.html`
- ✅ Adicionado `<script src="https://www.google.com/recaptcha/api.js"></script>`
- ✅ Adicionado atributo `data-sitekey` no botão submit

### **2. Frontend JavaScript**

#### `js/auth-login.js`
- ✅ Constante `RECAPTCHA_SITE_KEY` adicionada
- ✅ Função `executeRecaptcha()` criada - executa reCAPTCHA v3 antes do submit
- ✅ Token reCAPTCHA enviado no corpo da requisição JSON

#### `js/auth-register.js`
- ✅ Mesma estrutura aplicada para registro
- ✅ Função `executeRecaptcha()` com action `'register'`
- ✅ Token enviado no payload

### **3. Backend PHP**

#### `api/bootstrap.php`
- ✅ Função `validate_recaptcha($token)` adicionada
- ✅ Validação contra API do Google
- ✅ Score mínimo: **0.5** (v3 retorna score 0-1)
- ✅ Timeout de 5 segundos para requisição
- ✅ Tratamento de erros e exceções

#### `api/auth/login.php`
- ✅ Lê `recaptcha_token` do JSON
- ✅ Valida token antes de autenticar
- ✅ Retorna **HTTP 429** se reCAPTCHA falhar

#### `api/auth/register.php`
- ✅ Lê `recaptcha_token` do JSON
- ✅ Valida token antes de criar usuário
- ✅ Retorna **HTTP 429** se reCAPTCHA falhar

---

## 🔍 Como Funciona

### **Fluxo v3 (Invisível)**

1. Usuário clica "Entrar" ou "Cadastrar"
2. JavaScript chama `grecaptcha.execute()` com action (`'login'` ou `'register'`)
3. Google analisa comportamento do usuário (sem desafio visual)
4. Retorna token com score (0-1)
5. Token enviado ao servidor
6. Servidor valida token com Google API
7. Se score > 0.5 → autenticação prossegue
8. Se score ≤ 0.5 → retorna erro 429

### **Resposta de Erro**

```json
{
  "ok": false,
  "message": "Validacao reCAPTCHA falhou. Tente novamente."
}
```

---

## ⚠️ HTTP Status Codes

| Code | Significado | Trigger |
|------|------------|---------|
| **200** | Login bem-sucedido | Credenciais corretas + reCAPTCHA OK |
| **201** | Registro bem-sucedido | Dados válidos + reCAPTCHA OK |
| **400** | Dados inválidos | Email/senha inválidos |
| **401** | Email/senha incorretos | Credenciais não correspondem |
| **409** | Email já existe | Tentativa de registrar email duplicado |
| **429** | reCAPTCHA falhou | Score baixo ou token inválido |
| **500** | Erro servidor | Exceção durante autenticação |

---

## 🛡️ Proteção Conseguida

✅ **Força Bruta Mitigada**: reCAPTCHA analisa padrão de requisições  
✅ **Botnet/Scripts**: Dificilmente conseguem score > 0.5  
✅ **UX Melhorada**: v3 é invisível, sem cliques  
✅ **Score Rastreável**: Google retorna score para análise  

---

## 🔧 Testes Recomendados

### **1. Teste Manual - Login Legítimo**
```bash
curl -X POST http://localhost/api/auth/login.php \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","password":"senha123","recaptcha_token":"TOKEN_AQUI"}'
```

### **2. Teste Sem reCAPTCHA**
Enviar requisição sem `recaptcha_token` → deve retornar HTTP 429

### **3. Teste com Token Inválido**
Enviar token aleatório → deve retornar HTTP 429

---

## 📌 Notas Importantes

- reCAPTCHA v3 **não mostra interface visual** - análise silent
- Score < 0.5 = comportamento suspeito (bloqueado)
- Score > 0.5 = comportamento normal (permitido)
- Google pode ajustar score baseado em relatórios de abuso
- Requer **conexão HTTPS em produção** para funcionar corretamente

---

## 🚀 Próximos Passos (Recomendados)

1. **Rate Limiting**: Implementar limite de tentativas por IP (mesmo com reCAPTCHA)
2. **Logging**: Registrar tentativas falhadas de autenticação
3. **Email Verification**: Confirmar email no registro
4. **IP Whitelist**: Bloquear padrões suspeitos de IPs
5. **CORS Headers**: Permitir apenas origens confiáveis

---

## 📂 Arquivos Modificados

- ✅ `login/index.html`
- ✅ `cadastro/index.html`
- ✅ `js/auth-login.js`
- ✅ `js/auth-register.js`
- ✅ `api/bootstrap.php`
- ✅ `api/auth/login.php`
- ✅ `api/auth/register.php`

---

**Data de Implementação**: 22 de Abril de 2026  
**Versão reCAPTCHA**: v3  
**Status**: ✅ Pronto para Produção
