import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import {
  ApolloFederationDriver,
  ApolloFederationDriverConfig,
} from '@nestjs/apollo';
import { ModuleRef } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogV2Module } from './catalog-v2';
import { ProductsModule } from './products/products.module';
import { JSONScalar } from './graphql/scalars';
import { HealthController } from './health/health.controller';
import configuration from './config/configuration';
import { createContextFactory } from './graphql';

// Import to register enums
import './graphql/enums';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    // Metrics
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),

    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting: 100 requests per minute per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    // GraphQL Federation
    GraphQLModule.forRootAsync<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      useFactory: (moduleRef: ModuleRef) => ({
        autoSchemaFile: {
          federation: 2,
        },
        sortSchema: true,
        playground: process.env.NODE_ENV !== 'production',
        context: createContextFactory(moduleRef),
        formatError: (error) => {
          if (process.env.NODE_ENV === 'production') {
            delete error.extensions?.exception;
          }
          return error;
        },
      }),
      inject: [ModuleRef],
    }),

    // Database
    PrismaModule,

    // DataLoader-based catalog with multi-language support
    CatalogV2Module,

    // Products management
    ProductsModule,
  ],
  providers: [JSONScalar, { provide: APP_GUARD, useClass: ThrottlerGuard }],
  controllers: [HealthController],
})
export class AppModule {}
