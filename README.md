# DOCS Clinic: landing page

Landing page mobile-first da DOCS Clinic (odontologia estética na Berrini, São Paulo), feita a partir do
briefing "Reestruturação da Landing Page DOCS Clinic Mobile" (nov/2026) e do manual de marca.

Página estática: `index.html` + `assets/`. Não precisa de build; publique a pasta como está
(GitHub Pages, Netlify, Vercel ou a hospedagem atual).

## Estrutura da página (ordem do briefing)

1. Hero: foto dos dois doutores, copy aprovada, CTA único e a faixa de confiança (5,0 no Google)
2. Tratamentos: Invisalign, lentes de porcelana, lentes híbridas, lentes em resina
3. Sobre os DOCS: Dra. Mariana e Dr. Daniel (a frase acende palavra por palavra ao rolar)
4. Experiência DOCS: as quatro etapas da jornada, presas na tela enquanto mudam, e o vídeo da clínica
5. Histórias de pacientes: reels do Instagram, tocam só ao toque
6. Casos reais: pronto, mas **desligado** (ver Compliance)
7. Avaliações Google: trechos reais, um por vez no celular (troca a cada 5,5 s, arrasta, botão de pausa)
8. Dúvidas frequentes: acordeão com as perguntas do briefing
9. Localização: endereço, horários e mapa (carrega ao toque), sem CTA final

Todos os botões dizem exatamente "Agendar avaliação" e abrem o WhatsApp (11) 97498-0207 com mensagem
pronta; nos cards de tratamento a mensagem já cita o tratamento.

## Rastreamento

O Google Tag Manager `GTM-5GS47JNJ` (o mesmo da página atual) está no `<head>`; ele dispara a tag do
Google Ads e o Pixel da Meta. Cada clique de CTA envia ao `dataLayer` o evento
`cta_agendar_avaliacao` com `cta_location` (header, hero, tratamento-*, faq, barra-mobile). Abrir vídeo
envia `video_open`; abrir o mapa envia `map_open`.

## Manutenção

- **Número de avaliações** (62 em 27/11/2026): está em `index.html`, no link "Ver as 62 avaliações no
  Google". Atualizar com a rotina definida pelo gestor.
- **Vídeos**: cada card usa `data-reel="<código do reel>"`; o pôster fica em `assets/img/reel-<código>-*.webp`.
- **Fontes**: Lato (OFL) em `assets/fonts`.

## Pendências antes de publicar

- CRO, nome completo e área de atuação validados de cada profissional (seção Sobre os DOCS).
- Responsável técnico e CRO no rodapé (exigência de publicidade do CFO para clínica).
- Nova foto vertical dos dois doutores (o briefing pede; hoje é a foto do site atual).
- Fotos dos tratamentos e da jornada são de banco licenciado (Freepik via Magnific), ilustrativas.
- Depoimentos em vídeo: substituir/ampliar para 3 a 5 relatos curtos com legenda embutida.
- `og:image` e `canonical` com URL absoluta quando o domínio final estiver definido.
- Política de privacidade/aviso de cookies (LGPD), já que a página usa GTM, Google Ads e Pixel.

## Compliance: Casos reais

A seção de antes/depois está no `<template id="casos-reais">` no fim do `<main>`, desligada. O briefing
(Resolução CFO 196/2019) pede validação formal do responsável técnico antes de publicar comparativos
clínicos em página de pessoa jurídica. Para ativar: mover o `<section>` do template para o lugar do
comentário "06 CASOS REAIS", adicionar as fotos `assets/img/caso-N-antes.webp` / `caso-N-depois.webp`
e preencher nome e CRO na linha `.cases__note`.

## Créditos

Sistema de layout e motion: kit design-taste-frontend (taste-skill). Fotos dos doutores, da clínica e dos
vídeos: acervo DOCS Clinic.
