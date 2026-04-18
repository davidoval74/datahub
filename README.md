# DataHub

Site institucional da DataHub com autenticacao em PHP/MySQL para hospedagem cPanel.

## Visao geral

O projeto contem duas frentes principais:

- site institucional estatico em HTML, CSS e JavaScript
- area autenticada com cadastro, login, sessao PHP e dashboard inicial do usuario

## Arquitetura atual

- home institucional em `index.html`
- rotas por pasta com `index.html` para compatibilidade com cPanel
- API em PHP na pasta `api/`
- banco MySQL com tabela `users`
- sessao autenticada mantida com `$_SESSION['auth_user']`

## Estrutura do projeto

```text
c:\Datahub\
├── index.html
├── login.html                  # redireciona para /login/
├── login/
│   └── index.html
├── cadastro/
│   └── index.html
├── usuario/
│   └── index.html
├── api/
│   ├── bootstrap.php
│   ├── config.example.php
│   ├── db.php
│   ├── health.php
│   └── auth/
│       ├── login.php
│       ├── logout.php
│       ├── me.php
│       └── register.php
├── css/
│   ├── auth.css
│   ├── styles.css
│   └── user.css
├── js/
│   ├── auth-login.js
│   ├── auth-register.js
│   ├── script.js
│   └── user-dashboard.js
├── db/
│   └── schema.sql
├── png/
├── Video/
└── .gitignore
```

## Rotas

- `/` -> home institucional
- `/login/` -> tela de login
- `/cadastro/` -> tela de cadastro
- `/usuario/` -> area autenticada inicial
- `/api/auth/login.php` -> autentica usuario
- `/api/auth/register.php` -> cria usuario
- `/api/auth/me.php` -> retorna a sessao atual
- `/api/auth/logout.php` -> encerra a sessao
- `/api/health.php` -> diagnostico de ambiente

## Fluxo de autenticacao

### Cadastro

1. Usuario acessa `/cadastro/`.
2. O front valida nome, email, senha e confirmacao.
3. A API grava o usuario na tabela `users`.
4. A sessao `auth_user` e aberta no backend.
5. O front redireciona para `/login/`.

### Login

1. Usuario acessa `/login/`.
2. O front envia `email` e `password` para `/api/auth/login.php`.
3. A API valida email, senha, status e hash.
4. A sessao `auth_user` e criada.
5. O front redireciona para `https://datahubconsulting.com.br/usuario/`.

### Dashboard do usuario

1. A pagina `/usuario/` chama `/api/auth/me.php`.
2. Se a sessao existir, os dados do usuario sao exibidos.
3. O menu lateral permite encolher/expandir no desktop e salva o estado no navegador.
4. Ao selecionar uma ferramenta no menu, apenas o card correspondente fica visivel.
5. Se a sessao falhar, a pagina mostra aviso de autenticacao.
6. O logout chama `/api/auth/logout.php`.

## Banco de dados

Importe `db/schema.sql` no MySQL do cPanel. Estrutura atual:

- `users`
	- `id`
	- `name`
	- `email` com indice unico
	- `password_hash`
	- `status`
	- `created_at`
	- `updated_at`

## Configuracao no cPanel

1. Crie o banco MySQL.
2. Crie um usuario MySQL com permissao total no banco.
3. Importe `db/schema.sql` no phpMyAdmin.
4. Copie `api/config.example.php` para `api/config.php`.
5. Preencha:
	 - `db_host`
	 - `db_name`
	 - `db_user`
	 - `db_pass`
	 - `db_port`
	 - `session_name`

## Execucao local

Use um servidor PHP na raiz do projeto:

```bash
php -S localhost:8000
```

Depois acesse `http://localhost:8000`.

## Observacoes importantes

- `api/config.php` nao vai para o Git e deve ser criado manualmente em cada ambiente.
- `js/auth-login.js` esta com redirecionamento final hardcoded para `https://datahubconsulting.com.br/usuario/`.
- Isso resolve o deploy atual em producao, mas nao e ideal para homologacao ou teste local.
- `api/health.php` deve ser removido ou protegido apos a estabilizacao do ambiente.
- o menu lateral encolhido da area do usuario e um estado local (localStorage), por navegador.

## Cache e deploy

- login e dashboard usam query string de versao nos scripts para reduzir problema de cache.
- se o navegador mantiver comportamento antigo apos deploy, faca refresh forcado
- em hospedagens com cache intermediario, limpe o cache no painel

## Troubleshooting

### Erro de configuracao

Se a API retornar erro de configuracao:

- confirme que `api/config.php` existe no servidor
- confirme que o arquivo nao ficou com placeholders
- confirme usuario, senha e nome do banco

### Erro de conexao com banco

- valide se a extensao `mysqli` esta habilitada
- confirme host, usuario, senha e nome do banco
- confirme se a tabela `users` foi importada

### Login funciona mas dashboard nao abre

- valide se o deploy incluiu a pasta `usuario/`
- valide se `https://datahubconsulting.com.br/usuario/` responde corretamente
- valide se a versao nova de `js/auth-login.js` foi carregada

### Sessao nao autenticada na dashboard

- confirme se login e dashboard estao no mesmo dominio
- teste `/api/auth/me.php` imediatamente apos o login
- confirme se cookies de sessao nao estao sendo bloqueados

### Menu nao alterna ou nao filtra cards

- confirme se a versao nova de `js/user-dashboard.js` foi publicada
- valide se `css/user.css` foi atualizado no deploy
- limpe cache do navegador e recarregue a pagina

## Melhorias recomendadas

- remover o redirect hardcoded e parametrizar a URL base por ambiente
- proteger ou remover `api/health.php` em producao
- substituir links placeholder `#` da home por destinos reais
- criar paginas reais para cada ferramenta da area do usuario
- adicionar logs de erro do lado servidor

## Tecnologias

- HTML5
- CSS3
- JavaScript vanilla
- PHP
- MySQL
- Font Awesome
- Google Fonts

## Seguranca

- senhas sao persistidas com `password_hash`
- existe validacao no front e no backend
- `api/config.php` esta ignorado no Git

## Licenca

Projeto privado da DataHub.