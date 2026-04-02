(() => {
  const isShopAppToolDomain = location.href.startsWith("https://opstools-p1");
  if (!isShopAppToolDomain) {
    
    return; 
  }

let numeracaoAtiva = localStorage.getItem('numeracaoWidgets') !== "false";

function criarBotaoControle() {

    if (document.getElementById('toggleNumeracaoWidgets')) return;

    const botao = document.createElement('button');
    botao.id = 'toggleNumeracaoWidgets';

    botao.style.position = 'fixed';
    botao.style.bottom = '80px';
    botao.style.right = '20px';
    botao.style.zIndex = '999999';
    botao.style.padding = '8px 14px';
    botao.style.borderRadius = '6px';
    botao.style.border = '1px solid #ccc';
    botao.style.cursor = 'pointer';
    botao.style.fontWeight = 'bold';
    botao.style.fontSize = '12px';
    botao.style.color = '#353535';

    atualizarBotao(botao);

    botao.onclick = () => {

        numeracaoAtiva = !numeracaoAtiva;

        localStorage.setItem('numeracaoWidgets', numeracaoAtiva);

        atualizarBotao(botao);

        if (!numeracaoAtiva) {
            document.querySelectorAll('.badge-numerador-final')
                .forEach(el => el.remove());
        }
    };

    document.body.appendChild(botao);
}

function atualizarBotao(botao) {

    if (numeracaoAtiva) {
        botao.innerText = "🟢 Orders ON";
        botao.style.background = "#d4ffd4";
    } else {
        botao.innerText = "🔴 Orders OFF";
        botao.style.background = "#ffd4d4";
    }
}

function aplicarNumeracao() {

  if (!numeracaoAtiva) return;

  if (!document.getElementById('estilo-numerador-div')) {
      const style = document.createElement('style');
      style.id = 'estilo-numerador-div';
      style.innerHTML = `
          .badge-numerador-final {
              background-color: #ff0000 !important; 
              color: #ffffff !important;
              font-weight: bold !important;
              padding: 2px 8px !important;
              border-radius: 4px !important;
              display: inline-flex !important;
              align-items: center !important;
              justify-content: center !important;
              font-family: Arial, sans-serif !important;
              font-size: 15px !important;
              height: 24px !important;
              min-width: 24px !important;
              border: 1px solid #ffffff !important;
              box-shadow: 1px 1px 3px rgba(0,0,0,0.2) !important;
              flex-shrink: 0 !important;
          }

          .widget-option-container {
              display: flex !important;
              align-items: center !important;
              justify-content: flex-end !important;
          }
      `;
      document.head.appendChild(style);
  }

  const widgets = document.querySelectorAll('.widget-categories-list');
  if (!widgets.length) return;

  document.querySelectorAll('.badge-numerador-final')
      .forEach(el => el.remove());

  const existeDrag = Array.from(widgets)
      .some(item => item.hasAttribute('data-rbd-draggable-id'));

  let contador = 1;

  widgets.forEach(item => {

      const divOpcoes = item.querySelector('.widget-c-l-edit-option.widget-option-container');
      if (!divOpcoes) return;

      const temSvgBloqueado = item.querySelector('img[src*="394453f37b3a0990c8de.svg"]');
      if (temSvgBloqueado) return;

      const temExpired = Array.from(item.querySelectorAll('span'))
          .some(span => span.textContent.trim().toUpperCase() === "EXPIRED");
      if (temExpired) return;

      if (existeDrag && !item.hasAttribute('data-rbd-draggable-id')) {
          return;
      }

      const span = document.createElement('span');
      span.className = 'badge-numerador-final';
      span.innerText = contador;

      divOpcoes.prepend(span);

      contador++;
  });
}

setInterval(aplicarNumeracao, 1000);

function adicionarBotaoCalendario() {

    const inputs = [
        document.getElementById('_marketingData[0].analyticsTitle'),
        document.getElementById('_marketingMetadata[0].analyticsTitle')
    ];

    inputs.forEach((input, index) => {

        if (!input) return;

        const botaoId = 'btnCalendarioData_' + index;

        if (document.getElementById(botaoId)) return;

        const botao = document.createElement('button');
        botao.id = botaoId;
        botao.type = 'button';
        botao.innerHTML = '📅';
        botao.title = 'Copiar data de hoje';

        botao.style.marginLeft = '6px';
        botao.style.cursor = 'pointer';
        botao.style.padding = '4px 8px';
        botao.style.border = '1px solid #ccc';
        botao.style.background = '#fff';
        botao.style.borderRadius = '4px';

        botao.addEventListener('click', function () {

            const hoje = new Date();
            const ano = hoje.getFullYear();
            const mes = String(hoje.getMonth() + 1).padStart(2, '0');
            const dia = String(hoje.getDate()).padStart(2, '0');

            const dataFormatada = `_${ano}${mes}${dia}`;

            navigator.clipboard.writeText(dataFormatada).then(() => {

                botao.innerHTML = '✅';

                setTimeout(() => {
                    botao.innerHTML = '📅';
                }, 1000);

            }).catch(() => {
                console.error('Erro ao copiar para o clipboard');
            });
        });

        input.parentNode.insertBefore(botao, input.nextSibling);

    });
}

setInterval(adicionarBotaoCalendario, 1000);

window.addEventListener('load', criarBotaoControle);

})();