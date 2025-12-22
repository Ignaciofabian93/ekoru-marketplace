import { Resolver, Query, Args, ID, Int } from '@nestjs/graphql';
import { MarketplaceService } from './marketplace.service';
import { CurrentSeller } from '../common/decorators';
import {
  Department,
  DepartmentCategory,
  DepartmentCategoryConnection,
  ProductCategory,
  ProductCategoryConnection,
} from '../catalog/entities';

@Resolver()
export class MarketplaceResolver {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Query(() => [Department], { nullable: true, name: 'getDepartments' })
  async getDepartments(@CurrentSeller() sellerId?: string) {
    return this.marketplaceService.getDepartments(sellerId);
  }

  @Query(() => [DepartmentCategory], {
    nullable: true,
    name: 'getDepartmentCategoriesByDepartmentId',
  })
  async getDepartmentCategoriesByDepartmentId(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.marketplaceService.getDepartmentCategoriesByDepartmentId(
      Number(departmentId),
      sellerId,
    );
  }

  @Query(() => [ProductCategory], {
    nullable: true,
    name: 'getProductCategoriesByDepartmentCategoryId',
  })
  async getProductCategoriesByDepartmentCategoryId(
    @Args('departmentCategoryId', { type: () => ID })
    departmentCategoryId: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.marketplaceService.getProductCategoriesByDepartmentCategoryId(
      Number(departmentCategoryId),
      sellerId,
    );
  }

  @Query(() => Department, { nullable: true, name: 'getDepartment' })
  async getDepartment(
    @Args('id', { type: () => ID }) id: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.marketplaceService.getDepartment(Number(id), page, pageSize);
  }

  @Query(() => DepartmentCategoryConnection, {
    nullable: true,
    name: 'getDepartmentCategories',
  })
  async getDepartmentCategories(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.marketplaceService.getDepartmentCategories(
      Number(departmentId),
      page,
      pageSize,
    );
  }

  @Query(() => DepartmentCategory, {
    nullable: true,
    name: 'getDepartmentCategory',
  })
  async getDepartmentCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.marketplaceService.getDepartmentCategory(
      Number(id),
      page,
      pageSize,
    );
  }

  @Query(() => ProductCategoryConnection, {
    nullable: true,
    name: 'getProductCategories',
  })
  async getProductCategories(
    @Args('departmentCategoryId', { type: () => ID })
    departmentCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
  ) {
    return this.marketplaceService.getProductCategories(
      Number(departmentCategoryId),
      page,
      pageSize,
    );
  }

  @Query(() => ProductCategory, { nullable: true, name: 'getProductCategory' })
  async getProductCategory(
    @Args('id', { type: () => ID }) id: string,
    @Args('page', { type: () => Int, defaultValue: 1, nullable: true })
    page?: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10, nullable: true })
    pageSize?: number,
  ) {
    return this.marketplaceService.getProductCategory(
      Number(id),
      page,
      pageSize,
    );
  }
}
