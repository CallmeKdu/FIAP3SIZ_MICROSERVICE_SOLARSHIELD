flowchart LR
    Cliente["Cliente HTTP"] --> Nginx["Nginx API Gateway"]
    Nginx --> Ingestor["ingestor-service"]
    Ingestor --> NASA["NASA DONKI + NEO"]
    Ingestor --> Redis[("Redis")]
    Ingestor ==publish==> Rabbit[["RabbitMQ space.events"]]
    Rabbit ==consume==> Notifier["notifier-service"]
    Notifier --> Redis
    Notifier --> Email["Canal de alerta"]
