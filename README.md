# DataHub - Site Institucional

Site institucional da DataHub, desenvolvido com HTML, CSS e JavaScript puro.

## Visao Geral

O projeto apresenta:
- Proposta de valor da empresa
- Servicos e segmentos de atuacao
- Cases e indicadores
- Bloco de contato com e-mail e WhatsApp
- Hero com video corporativo

## Estrutura do Projeto

```text
c:\Datahub\
├── index.html
├── css/
│   └── styles.css
├── js/
│   └── script.js
├── png/
│   ├── datahub-logo.png
│   └── favicon.ico
├── Video/
│   └── DataHub_Consulting_corporate_202604141558.mp4
├── .gitignore
└── README.md
```

## Stack

- HTML5
- CSS3 (Flexbox, Grid, media queries)
- JavaScript vanilla
- Font Awesome
- Google Fonts

## Como Rodar Localmente

### Opcao 1: abrir direto
1. Abra o arquivo `index.html` no navegador.

### Opcao 2: servidor local (recomendado)

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

Acesse `http://localhost:8000`.

## Fluxo de Deploy

### 1) Fluxo Git (local -> GitHub)

```bash
git status
git add .
git commit -m "chore: atualiza site institucional"
git push origin main
```

### 2) Publicacao no GitHub Pages

1. Abra o repositorio no GitHub.
2. Va em `Settings` -> `Pages`.
3. Em `Build and deployment`:
	- `Source`: `Deploy from a branch`
	- `Branch`: `main`
	- `Folder`: `/ (root)`
4. Salve e aguarde o deploy.
5. A URL publica sera exibida na mesma tela do Pages.

### 3) Dominio proprio (opcional)

1. No mesmo menu `Pages`, configure `Custom domain`.
2. Crie os registros DNS no seu provedor (A/CNAME) apontando para o GitHub Pages.
3. Ative `Enforce HTTPS` quando disponivel.

## Checklist Pre-Deploy

- Validar contatos no HTML
- Confirmar caminho do video do hero
- Testar navegacao mobile
- Rodar revisao visual em desktop e mobile
- Confirmar que nao ha arquivos temporarios desnecessarios no commit

## Rollback Rapido

Se precisar voltar a versao anterior:

```bash
git log --oneline
git revert <hash_do_commit>
git push origin main
```

## Contato Oficial

- Email: contato@datahubconsuilting.com.br
- WhatsApp: +55 11 92562-1121
- Localizacao: Sao Paulo, SP

## Licenca

Projeto proprietario da DataHub. Todos os direitos reservados.