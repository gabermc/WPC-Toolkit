WPC Toolkit — Extensão Chrome

Suite QA completa para o time do Web Production Center.
Une 6 ferramentas em uma única extensão Chrome — uma instalação, zero alternância.


📦 Módulos
AbaO que fazReportEnvia relatórios de QA diretamente para o Google Sheets via Apps ScriptChecklistGera um checklist .xlsx nomeado a partir da URL do ticket JiraQuickTextCopia templates de comentários QA para o clipboard com um cliqueCountryScanDetecta idioma, país, assets errados e links CTA incorretos na páginaShopAppAuxiliar de CMS — bordas, títulos e visibilidade de widgets expirados(auto) Widget OrganizerNumeração de widgets + botão 📅 de cópia de data nas páginas do CMS

🚀 Instalação

A extensão não está publicada na Chrome Web Store. Instale manualmente em modo desenvolvedor.


Baixe o ZIP mais recente em Releases e extraia
Abra o Chrome e acesse chrome://extensions/
Ative o Modo do desenvolvedor (botão no canto superior direito)
Clique em Carregar sem compactação
Selecione a pasta wpc-toolkit extraída
O ícone da extensão aparecerá na barra de ferramentas do Chrome


🗂 Detalhes dos Módulos
📋 Report
Captura a URL do ticket Jira ativo e envia um relatório estruturado de QA para o Google Sheets.

Requisito: A aba ativa deve ser um ticket jira.secext.samsung.net/browse/WSC
Campos: Category, Sub, Status, Publisher Error, Pending Customer, Reason, QA username, Comments
O username é salvo localmente e preenchido automaticamente na próxima vez


✅ Checklist
Gera um checklist .xlsx de QA a partir do ticket Jira ativo.

Requisito: A aba ativa deve ser um ticket Jira no formato WSC########-#####
Selecione um template (Standard, FOOTER, GNB, HOME, OFFER, PCD, PDP, PF, PFS, Redirect)
O arquivo é nomeado automaticamente: QA_Prod_WSC########-#####_username_YYMMDD.xlsx
Versão do checklist: QA_Checklist_20250903_v4.0.3


⚡ QuickText
Copia templates de comentários QA pré-escritos para o clipboard com um único clique.
Templates disponíveis:
SeçãoTemplatesApprovedApproved, Athena N/A, EOLRejectedRejected, Athena FailShopAppPublished, Non Published, Rejected

O seu username ({user_name}) é injetado automaticamente em todos os templates
O popup fecha 1 segundo após a cópia


🌍 CountryScan
Escaneia a página ativa e detecta idioma, país e problemas de QA.
Scan principal:

Idioma detectado com índice de confiança
País detectado pelo caminho da URL (BR, CO, CL, MX, PE, AR, UY, PY, LATIN, LATIN_EN)
Metadados da página: título, descrição, canonical URL
Análise de composição de escrita (Latino, Cirílico, Árabe, CJK, etc.)

QA Tools (accordion):

Verificação de País dos Assets — escaneia todas as fontes de <img> em busca de países incorretos, com destaque na página
Verificação de País dos CTAs — escaneia todos os links <a href> em busca de códigos de país errados, com destaque na página


🛒 ShopApp Helper
Injeta auxiliares visuais no ShopApp CMS (opstools-p1-*.ecom-qa.samsung.com).
BotãoAçãoAdd BorderDestaca imagens de widgets expirados com borda vermelhaHide BorderRemove as bordas vermelhasShow TitlesExibe etiquetas com o nome da imagem abaixo de cada assetHide TitlesOculta as etiquetas de nomeShow ExpiredTorna os widgets expirados visíveisHide ExpiredOculta os widgets expirados

🔢 Widget Organizer (executa automaticamente)
Injeta diretamente nas páginas do ShopApp CMS — sem necessidade de interação com o popup.

Badges numerados — badges vermelhos sequenciais em cada widget ativo para acompanhar a ordem de um relance
Botão de toggle — botão flutuante 🟢 Orders ON / 🔴 Orders OFF na página para exibir/ocultar os badges
Botão 📅 de data — aparece ao lado dos campos analyticsTitle; copia a data de hoje no formato _YYYYMMDD para o clipboard


🌐 Países Suportados
CódigoPaísbrBrasilcoColômbiaclChilemxMéxicopePeruarArgentinauyUruguaipyParaguailatinPanamálatin_enGuatemala

🗃 Estrutura do Projeto
wpc-toolkit/
├── manifest.json               # Configuração da extensão (Manifest V3)
├── popup.html                  # Interface principal — shell com abas
├── popup.css                   # Sistema de design (tema escuro)
├── popup.js                    # Toda a lógica das abas (6 módulos)
├── icons/
│   ├── icon16.png
│   ├── icon64.png
│   └── icon128.png
├── models/                     # Templates de checklist XLSX
│   ├── QA_Prod_Standard_userName_DATE.xlsx
│   ├── QA_Prod_FOOTER_userName_DATE.xlsx
│   ├── QA_Prod_GNB_userName_DATE.xlsx
│   ├── QA_Prod_HOME_userName_DATE.xlsx
│   ├── QA_Prod_OFFER_userName_DATE.xlsx
│   ├── QA_Prod_PCD_userName_DATE.xlsx
│   ├── QA_Prod_PDP_userName_DATE.xlsx
│   ├── QA_Prod_PF_userName_DATE.xlsx
│   ├── QA_Prod_PFShomeapliences_userName_DATE.xlsx
│   ├── QA_Prod_PFSmobile_userName_DATE.xlsx
│   └── QA_Prod_Redirect_userName_DATE.xlsx
└── scripts/
    ├── background.js               # Service worker — navegação SPA do ShopApp
    ├── countryscan-content.js      # Injetado em todas as páginas para o CountryScan
    ├── widget-organizer.js         # Numeração de widgets + botão de data (auto)
    ├── shopapp-content.js          # Injetado automaticamente nas páginas Offerv2 do CMS
    ├── shopapp-content.css         # Estilos para injeção no CMS
    ├── shopapp-addTitles.js
    ├── shopapp-removeTitles.js
    ├── shopapp-addRedBorder.js
    ├── shopapp-removeRedBorder.js
    ├── shopapp-hideExpired.js
    └── shopapp-showExpired.js

🔒 Permissões
PermissãoPor quêactiveTabLer a URL da aba ativa para o Report e o ChecklistscriptingInjetar scripts do CountryScan e ShopApp nas páginasstorageSalvar o username localmente entre sessõestabsConsultar a URL da aba ativaclipboardWriteCopiar templates do QuickText para o clipboardwebNavigationDetectar navegação SPA no ShopApp CMS

🔧 Configuração
O módulo Report envia os dados para um endpoint do Google Apps Script. Caso precise apontar para uma planilha diferente, atualize a constante SCRIPT_URL no topo do popup.js:
jsconst SCRIPT_URL = 'https://script.google.com/macros/s/SEU_SCRIPT_ID/exec';

📄 Changelog
v2.1.0

Adicionado módulo Widget Organizer (numeração de widgets + botão de data)

v2.0.0

Unificação de 5 extensões em uma única interface com abas
Novo sistema de design escuro
Ferramentas de auditoria de assets e CTAs no CountryScan
ShopApp Helper com controles no popup

PRA CIMA LINCÃO <3


👥 Time
Desenvolvido para o time de QA do WPC — Web Production Center.
