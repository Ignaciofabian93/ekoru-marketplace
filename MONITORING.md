# Grafana Monitoring Setup

## Quick Start

1. **Start monitoring stack:**

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

2. **Access dashboards:**

- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

3. **Install Prometheus client in your app:**

```bash
npm install prom-client
```

## Application Metrics Setup

Add this to your NestJS application:

### 1. Create metrics module

```typescript
// src/metrics/metrics.module.ts
import { Module } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  controllers: [MetricsController],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}
```

### 2. Create metrics service

```typescript
// src/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  public readonly httpRequestsTotal: Counter;
  public readonly httpRequestDuration: Histogram;
  public readonly activeConnections: Gauge;

  constructor() {
    this.registry = new Registry();

    // HTTP requests counter
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registry],
    });

    // Request duration histogram
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    // Active connections gauge
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      registers: [this.registry],
    });
  }

  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
```

### 3. Create metrics controller

```typescript
// src/metrics/metrics.controller.ts
import { Controller, Get } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getMetrics();
  }
}
```

### 4. Add to AppModule

```typescript
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    // ... other imports
    MetricsModule,
  ],
})
export class AppModule {}
```

## Custom Dashboards

Create custom dashboards in Grafana for:

- GraphQL query performance
- Database query metrics
- Error rates
- API response times
- Business metrics (products created, orders, etc.)

## Alerts Setup

Add alert rules in `monitoring/prometheus/alerts/rules.yml`:

```yaml
groups:
  - name: ekoru_marketplace
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: SlowResponseTime
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: Slow response times detected
```

## Stop Monitoring

```bash
docker-compose -f docker-compose.monitoring.yml down
```

## Resources

- [Grafana Documentation](https://grafana.com/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
