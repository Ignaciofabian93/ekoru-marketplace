import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsService } from './products.service';
import { ProductsResolver, SellerReferenceResolver } from './products.resolver';
import { ImpactService } from '../services/impact.service';
import { ImpactRepository } from '../repositories/impact.repository';

/**
 * Products Module
 *
 * This module handles all product-related functionality including:
 * - Product CRUD operations
 * - Product queries by seller, category, department
 * - Product filtering and sorting
 * - Exchangeable products
 */
@Module({
  imports: [PrismaModule],
  providers: [
    ProductsService,
    ProductsResolver,
    SellerReferenceResolver,
    ImpactService,
    ImpactRepository,
  ],
  exports: [ProductsService, ImpactService],
})
export class ProductsModule {}
