import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  ResolveReference,
  Parent,
} from '@nestjs/graphql';
import { CurrentSeller } from '../common/decorators';
import { ProductCategoryEntity } from '../catalog-v2/entities';
import { ProductEntity, SellerEntity } from './entities/product.entity';
import { ProductConnectionEntity } from './entities/product-connection.entity';
import { EnvironmentalImpactEntity } from './entities/environmental-impact.entity';
import { ProductsService } from './products.service';
import { ImpactService } from '../services/impact.service';
import {
  ProductFilterInput,
  ProductSortInput,
  AddProductInput,
  UpdateProductInput,
} from './dto/product.input';

@Resolver(() => ProductEntity)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly impactService: ImpactService,
  ) {}

  @Query(() => ProductEntity, { nullable: true, name: 'getProductById' })
  async getProductById(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.getProductById(Number(id));
  }

  @Query(() => ProductConnectionEntity, { nullable: true, name: 'getProducts' })
  async getProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProducts(page, pageSize, filter, sort);
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsBySeller',
  })
  async getProductsBySeller(
    @Args('sellerId', { type: () => ID }) sellerId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsBySeller(
      sellerId,
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsByCategory',
  })
  async getProductsByCategory(
    @Args('productCategoryId', { type: () => ID }) productCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByCategory(
      Number(productCategoryId),
      page,
      pageSize,
      filter,
      sort,
    );
  }

  /**
   * Get products by Department Category
   * Returns all products from all product categories under this department category
   * Example: "Audio" department category → speakers, microphones, cables, etc.
   */
  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsByDepartmentCategory',
  })
  async getProductsByDepartmentCategory(
    @Args('departmentCategoryId', { type: () => ID })
    departmentCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByDepartmentCategory(
      Number(departmentCategoryId),
      page,
      pageSize,
      filter,
      sort,
    );
  }

  /**
   * Get products by Department
   * Returns all products from all categories under this department
   * Example: "Technology" department → audio, TV, home tech devices, etc.
   */
  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsByDepartment',
  })
  async getProductsByDepartment(
    @Args('departmentId', { type: () => ID }) departmentId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByDepartment(
      Number(departmentId),
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getExchangeableProducts',
  })
  async getExchangeableProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getExchangeableProducts(
      page,
      pageSize,
      filter,
      sort,
    );
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'addProduct' })
  async addProduct(
    @Args('input') input: AddProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.addProduct(input, sellerId);
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'updateProduct' })
  async updateProduct(
    @Args('input') input: UpdateProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.updateProduct(input, sellerId);
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'deleteProduct' })
  async deleteProduct(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.deleteProduct(Number(id));
  }

  @Mutation(() => ProductEntity, {
    nullable: true,
    name: 'toggleProductActive',
  })
  async toggleProductActive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.toggleProductActive(Number(id), sellerId);
  }

  // Field resolvers
  @ResolveField(() => ProductCategoryEntity, { nullable: true })
  productCategory(@Parent() product: ProductEntity) {
    if (product.productCategory) {
      return product.productCategory;
    }
    return null;
  }

  @ResolveField(() => SellerEntity, { nullable: true })
  seller(@Parent() product: ProductEntity) {
    if (product.seller) {
      return product.seller;
    }
    // Return a reference for Apollo Federation
    return { __typename: 'Seller', id: product.sellerId };
  }

  @ResolveField(() => EnvironmentalImpactEntity, { nullable: true })
  async environmentalImpact(@Parent() product: ProductEntity) {
    try {
      return await this.impactService.calculateCategoryImpact(
        product.productCategoryId,
      );
    } catch (error) {
      console.error('Error calculating environmental impact:', error);
      return null;
    }
  }
}

/**
 * Seller Reference Resolver for Apollo Federation
 * This allows the gateway to resolve Seller entities from the users subgraph
 */
@Resolver(() => SellerEntity)
export class SellerReferenceResolver {
  @ResolveReference()
  resolveReference(reference: { __typename: string; id: string }) {
    // Return the reference as-is. The users subgraph will resolve the full entity
    return reference;
  }
}
