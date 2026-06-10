# Solar Shield: Microsserviços de Clima Espacial

## Integrantes
* Carlos : responsável por (preencher área)
* Jules : responsável por testes
* (Nome 3) : responsável por (preencher área)

## Visão geral
Sistema construído para consumir dados de clima espacial da NASA, classificar a severidade e disparar alertas operacionais.

## Arquitetura
<img width="6478" height="1179" alt="Untitled diagram-2026-06-10-022229" src="https://github.com/user-attachments/assets/9def9eb8-69a8-486d-8a9e-53ddaa96121f" />


## Regras de negócio
* RN1: classificação por Kp
* RN2: NEO hazardous na janela de 48h
* RN3: idempotencia por event_id (consumidor)

## Justificativa do TTL do cache
TTL configurado em 60s no endpoint GET /current pois a base DONKI atualiza em minutos e o índice Kp abrange janelas de 3h, absorvendo picos sem perda de frescor e evitando estourar o limite de requisições da NASA.

## Como rodar
```bash
cp .env.example .env
docker compose up --build
