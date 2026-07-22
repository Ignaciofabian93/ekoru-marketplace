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
  Context,
} from '@nestjs/graphql';
import { Logger } from '@nestjs/common';
import { CurrentSeller, CurrentAdmin } from '../common/decorators';
import type { GraphQLContext } from '../types';
import { ProductCategoryEntity } from '../productCategories/entities';
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
  private readonly logger = new Logger(ProductsResolver.name);

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
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProducts({
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
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
    return this.productsService.getProductsBySeller({
      sellerId,
      page,
      pageSize,
      filter,
      sort,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getProductsByCategory',
  })
  async getProductsByCategory(
    @Args('productCategoryId', { type: () => ID }) productCategoryId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByCategory({
      productCategoryId: Number(productCategoryId),
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
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
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByDepartmentCategory({
      departmentCategoryId: Number(departmentCategoryId),
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
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
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getProductsByDepartment({
      departmentId: Number(departmentId),
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getExchangeableProducts',
  })
  async getExchangeableProducts(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 10 }) pageSize: number,
    @CurrentSeller() currentSellerId?: string,
    @Args('filter', { type: () => ProductFilterInput, nullable: true })
    filter?: ProductFilterInput,
    @Args('sort', { type: () => ProductSortInput, nullable: true })
    sort?: ProductSortInput,
  ) {
    return this.productsService.getExchangeableProducts({
      page,
      pageSize,
      filter,
      sort,
      excludeSellerId: currentSellerId,
    });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'addProduct' })
  async addProduct(
    @Args('input') input: AddProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.addProduct({ input, sellerId });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'updateProduct' })
  async updateProduct(
    @Args('input') input: UpdateProductInput,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.updateProduct({ input, sellerId, adminId });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'deleteProduct' })
  async deleteProduct(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.deleteProduct({
      id: Number(id),
      sellerId,
      adminId,
    });
  }

  @Mutation(() => ProductEntity, {
    nullable: true,
    name: 'toggleProductActive',
  })
  async toggleProductActive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
    @CurrentAdmin() adminId?: string,
  ) {
    return this.productsService.toggleProductActive({
      id: Number(id),
      sellerId,
      adminId,
    });
  }

  @Query(() => ProductConnectionEntity, {
    nullable: true,
    name: 'getMyFavorites',
    description: "The current seller's favorited products (paginated).",
  })
  async getMyFavorites(
    @CurrentSeller() sellerId: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('pageSize', { type: () => Int, defaultValue: 12 }) pageSize: number,
  ) {
    return this.productsService.getMyFavorites({ sellerId, page, pageSize });
  }

  @Mutation(() => ProductEntity, { nullable: true, name: 'toggleProductLike' })
  async toggleProductLike(
    @Args('productId', { type: () => ID }) productId: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.toggleProductLike({
      productId: Number(productId),
      sellerId,
    });
  }

  /**
   * Federation entity resolver: hydrates a Product that another subgraph
   * referenced by key alone (e.g. a hit from ekoru-search). Without it the
   * gateway can only hand back the id and every other field resolves to null.
   */
  @ResolveReference()
  async resolveReference(reference: { __typename: string; id: number }) {
    return this.productsService.getProductById(Number(reference.id));
  }

  // Field resolvers
  @ResolveField(() => Boolean, {
    description: 'Whether the current seller has favorited this product',
  })
  async isLiked(
    @Parent() product: ProductEntity,
    @Context() ctx: GraphQLContext,
  ): Promise<boolean> {
    return ctx.loaders.productLikedByMe.load(product.id);
  }

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
  async environmentalImpact(
    @Parent() product: ProductEntity,
    @Context() ctx: GraphQLContext,
  ) {
    try {
      return await this.impactService.calculateCategoryImpact(
        product.productCategoryId,
        ctx.language,
      );
    } catch (error) {
      this.logger.error('Error calculating environmental impact:', error);
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
