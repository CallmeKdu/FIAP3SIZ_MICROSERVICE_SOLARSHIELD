# Solar Shield: Microsserviços de Clima Espacial

## Integrantes
* Carlos : responsável por (preencher área)
* Jules : responsável por testes
* (Nome 3) : responsável por (preencher área)

## Visão geral
Sistema construído para consumir dados de clima espacial da NASA, classificar a severidade e disparar alertas operacionais.

## Arquitetura
flowchart LR
    Cliente["Cliente HTTP"] --> Nginx["Nginx API Gateway"]
    Nginx --> Ingestor["ingestor-service"]
    Ingestor --> NASA["NASA DONKI + NEO"]
    Ingestor --> Redis[("Redis")]
    Ingestor ==publish==> Rabbit[["RabbitMQ space.events"]]
    Rabbit ==consume==> Notifier["notifier-service"]
    Notifier --> Redis
    Notifier --> Email["Canal de alerta"]
    

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
