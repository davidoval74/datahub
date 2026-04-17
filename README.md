# DataHub - Consultoria em Dados e Analytics

Bem-vindo ao repositório do site da DataHub, uma empresa especializada em consultoria de dados e analytics.

## Sobre o Projeto

Este projeto agora possui:
- Site institucional (HTML/CSS/JS)
- Ambiente de login e cadastro em rotas com `index.html`
- API em PHP
- Banco MySQL com estrutura compativel com cPanel

## Estrutura do Projeto

```
c:\Datahub\
├── index.html          # Página principal
├── login/              # Rota /login/
│   └── index.html
├── cadastro/           # Rota /cadastro/
│   └── index.html
├── api/
│   ├── config.php      # Config local do banco (cPanel)
│   ├── config.example.php
│   ├── db.php
│   ├── bootstrap.php
│   └── auth/
│       ├── register.php
│       ├── login.php
│       ├── logout.php
│       └── me.php
├── db/
│   └── schema.sql      # Estrutura SQL para MySQL/cPanel
├── css/
│   ├── styles.css      # Estilos da home
│   └── auth.css        # Estilos do login/cadastro
├── js/
│   ├── script.js       # Scripts da home
│   ├── auth-login.js   # Front-end de login
│   └── auth-register.js# Front-end de cadastro
├── README.md           # Documentação do projeto
└── .gitignore          # Arquivos ignorados pelo Git
```

## Principais Atualizações (2026)

- Rodapé atualizado para `© 2026`.
- Botão `Fale Conosco` com navegação interna para `#contato`.
- Botão `WhatsApp` adicionado na barra de navegação com link para `https://wa.me/5511925621121`.
- Estrutura da navegação aprimorada com `nav-actions` para melhor posição e espaçamento.
- CSS modularizado em `css/styles.css`.
- JS separado em `js/script.js` para comportamento da página (scroll suave, animação, header fixo).

## Como Visualizar

## Rotas (hospedagem)

As paginas de autenticacao seguem o padrao de rota em pasta com `index.html`:
- `/login/` -> `login/index.html`
- `/cadastro/` -> `cadastro/index.html`

Isso e ideal para hospedagem em cPanel.

## Banco de Dados no cPanel

1. Crie um banco MySQL no cPanel.
2. Crie um usuario MySQL e associe ao banco com privilegios.
3. Importe `db/schema.sql` no phpMyAdmin.
4. Preencha `api/config.php` com os dados reais do cPanel:
	- host (normalmente `localhost`)
	- db_name (padrao `usuariocpanel_nomedobanco`)
	- db_user (padrao `usuariocpanel_nomedeusuario`)
	- db_pass

## Como testar localmente

Use um servidor PHP local apontando para a pasta do projeto:

```bash
php -S localhost:8000
```

Depois acesse `http://localhost:8000`.

## Tecnologias Utilizadas

- **HTML5**: Estrutura semântica
- **CSS3**: Estilos modernos com variáveis CSS, Flexbox e Grid
- **JavaScript**: Interatividade no front-end
- **PHP**: Endpoints de autenticacao
- **MySQL**: Persistencia de usuarios (cPanel)
- **Font Awesome**: Ícones
- **Google Fonts**: Tipografia Inter

## Funcionalidades

- Design responsivo para desktop e mobile
- Navegação suave entre seções
- Animações de scroll
- Efeitos visuais modernos
- Barra de navegação fixa
- Botões de contato (Fale Conosco + WhatsApp)
- Cadastro de usuario (`/api/auth/register.php`)
- Login com sessao (`/api/auth/login.php`)

## Desenvolvimento

Para contribuir ou modificar o site:

1. Faça um fork do repositório
2. Crie uma branch para suas modificações
3. Faça commit das mudanças
4. Abra um Pull Request

## Contato

- Email: davidoval74@gmail.com
- Telefone: +55 11 9999-9999
- Localização: São Paulo, SP

## Licença

Este projeto é propriedade da DataHub Consultoria. Todos os direitos reservados.