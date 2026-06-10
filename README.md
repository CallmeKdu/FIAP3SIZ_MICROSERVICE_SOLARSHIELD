# Solar Shield: Microsserviços de Clima Espacial



## Visão geral
Sistema construído para consumir dados de clima espacial da NASA, classificar a severidade e disparar alertas operacionais.

## Arquitetura

```mermaid
flowchart LR
Cliente["Cliente HTTP"] --> Nginx["Nginx API Gateway"]
Nginx --> Ingestor["ingestor-service"]
Ingestor --> NASA["NASA DONKI + NEO"]
Ingestor --> Redis[("Redis")]
Ingestor ==publish==> Rabbit[["RabbitMQ space.events"]]
Rabbit ==consume==> Notifier["notifier-service"]
Notifier --> Redis
Notifier --> Email["Canal de alerta"]
````

## Regras de negócio
* RN1: classificação por Kp
* RN2: NEO hazardous na janela de 48h
* RN3: idempotencia por event_id (consumidor)

## Justificativa do TTL do cache
TTL configurado em 60s no endpoint GET /current pois a base DONKI atualiza em minutos e o índice Kp abrange janelas de 3h, absorvendo picos sem perda de frescor e evitando estourar o limite de requisições da NASA.

Nome do Grupo:
Rm:553135 Nome: Bruna Oliveira Gomes
Rm:552611 Nome: Carlos Eduardo Martins freire
Rm:553574 Nome: Mauro Froelich Taniguchi 


## Como rodar
Como rodar o projeto

Passo 1: Faça o clone do repositório rodando git clone [url-do-seu-repositorio] e depois entre na pasta com cd [nome-da-pasta].

Passo 2: Crie o arquivo de configuração de ambiente rodando o comando cp .env.example .env (adicione a sua chave da API da NASA nesse arquivo para não cair no limite de requisições).

Passo 3: Suba todos os serviços de uma vez rodando docker compose up --build.

Passo 4: Abra um novo terminal e dispare a ingestão inicial de dados rodando o comando curl -X POST http://localhost:8080/api/space-weather/ingest.

Passo 5: Para verificar o status do clima espacial, rode curl -i http://localhost:8080/api/space-weather/current (se você rodar isso várias vezes seguidas, vai conseguir provar para o professor que o Cache HIT e o Rate Limit 429 estão funcionando).

Como rodar os testes

Testes Unitários: Para validar as regras obrigatórias RN1 e RN3, rode o comando npm test.

Teste de Carga k6: Para simular as 10 conexões simultâneas, rode o comando docker run --rm --network host -i grafana/k6 run < k6/smoke.js.
