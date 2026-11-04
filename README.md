# Crono — versão simplificada (2026-11-04)

PWA de tela única, adaptado do protótipo visual v3 aprovado no ChatGPT.

## Funcionalidades
- Timeline de 00:00 a 24:00 com relógio atual e marcas horárias.
- Zoom em passos de 2 horas: 24h, 22h, 20h, 18h, 16h, 14h, 12h, 10h, 8h, 6h, 4h, 2h.
- Criar eventos: começar agora, já concluído ou planejar.
- Um toque seleciona; arraste o bloco ou suas alças; segundo toque mostra detalhes.
- Editar título e observação; fechar modais tocando fora.
- Eventos gravados automaticamente no armazenamento local do dispositivo, separados por dia.
- Instalável como PWA e disponível offline após carregar os recursos uma vez.

## Histórico preservado
- Branch imutável de referência: `arquivo/crono-original-2026-11-04`, baseada no commit `6bb32bdd699c2a40ee2a190af23bf2187418e970`.
- Pasta `arquivo/crono-original-v0.2.4/`: arquivos da versão anterior, incluindo beta e recursos originais.
- Como restaurar: criar nova branch a partir de `arquivo/crono-original-2026-11-04` ou usar arquivos históricos.

## Dados
O código novo usa a chave `crono-simples-v1` no localStorage, **sem apagar ou migrar** as chaves do aplicativo antigo. Os dados do navegador não ficam no GitHub, não sincronizam entre dispositivos e podem desaparecer se o Safari limpar dados do site. A versão inicial não possui exportação de backup.
Sem eventos fictícios ao iniciar: o calendário novo começa vazio para evitar confundir exemplos com registros reais.

## Desenvolvimento
Arquivos estáticos, sem dependências e sem backend. Publicação pelo GitHub Pages no branch `main`. Ícones antigos mantidos temporariamente até substituição pelo pacote escolhido pelo usuário.

## Atualização 3.1.0 (04/11/2026)
- Zoom: 24h, 18h, 12h, 8h, 6h, 4h e 2h.
- touch-action: manipulation nos botões para evitar zoom do navegador por duplo toque (sem retirar pinça de zoom).
- Bloqueio do overscroll elástico na timeline do iOS com glow superior/inferior progressivo.
- Persistência dos eventos inalterada.
- Safari do iPhone exige validação real dos gestos.

## Ajuste visual 3.1.1
- Glow vermelho mais saturado, concentrado nas bordas e com blur reduzido (3px).
- Intensidade responde mais rapidamente ao esforço de rolagem; topo e base com o mesmo vermelho.
- iPhone/Safari: confirmar sensação visual do ajuste com toque real.

## Ajuste 3.2.0 — rolagem sem borracha
- Rolagem da timeline controlada no toque: limite rígido inclusive após flick/inércia.
- Inércia leve implementada em JavaScript com interrupção no fim; sem reflexo elástico.
- Glow somente com o dedo pressionado, proporcional à distância restante até a borda oposta.
- Cor principal #e22400, mantendo desfoque localizado.
- Validar no Safari/iPhone; o comportamento de gestos depende do WebKit.

## Calibração do glow v3.3.0 (04/11/2026)
Configuração escolhida nos sliders do chat:
- `color: #e22400`
- `maxOpacity: 82%`
- `widthPercent: 210%`
- `heightPx: 44px`
- `blurPx: 5px`
- `resistance: 2.8`
- `retractionMs: 1500`

O movimento é suavizado por quadros de animação, com resistência não linear durante o puxão e retração progressiva em 1,5 s quando o dedo solta. A inércia da timeline e os limites rígidos de rolagem permanecem independentes e inalterados. Necessária validação real no Safari do iPhone.

## v3.3.1 — calibração de área e retração (04/11/2026)
- heightPx 24 (antes 44), blurPx 3 (antes 5).
- Retração 1050 ms (antes 1500 ms; redução de 30%).
- Escala vertical do glow: de 0.25 a 0.85 (antes 0.35 a 1).
- Cor #e22400, largura 210%, opacidade .82 e resistência 2.8 mantidas.
- Inércia e limite da rolagem não alterados.

## v3.4.0 — relógio glass e linha do agora luminosos (04/11/2026)
- Relógio central em cápsula translúcida com bordas totalmente arredondadas, fundo quente suave, blur interno e halo externo. Mantido clique para ir ao horário atual.
- Linha vermelha do horário atual com brilho suave e ponto de origem luminoso; marcador HH:MM do lado direito em cápsula vermelha saturada.
- Sem alterações de posicionamento dos eventos, zoom, rolagem/inércia, glow de limite ou armazenamento.
- Conferir aparência e toque no Safari do iPhone após publicação.
