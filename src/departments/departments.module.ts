import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsModule } from '../products/products.module';
import { DepartmentRepository } from './department.repository';
import { DepartmentService } from './department.service';
import { DepartmentResolver } from './resolvers';
import { I18nDepartmentService } from './i18n';

/**
 * Departments Module
 *
 * Self-contained subdomain module for departments:
 * - Repository layer with DataLoader pattern for N+1 prevention
 * - Service layer with business logic (by id for admin, by slug for web,
 *   plus combined department + products queries)
 * - GraphQL resolver with field-level resolution
 * - Subdomain-scoped I18N service
 */
@Module({
  imports: [PrismaModule, ProductsModule],
  providers: [
    I18nDepartmentService,
    DepartmentRepository,
    DepartmentService,
    DepartmentResolver,
  ],
  exports: [I18nDepartmentService, DepartmentRepository, DepartmentService],
})
export class DepartmentsModule {}
