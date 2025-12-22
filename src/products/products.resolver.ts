import {
  Resolver,
  Query,
  Mutation,
  Args,
  ID,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { ImpactService } from '../impact/impact.service';
import { CurrentSeller } from '../common/decorators';
import {
  Product,
  ProductConnection,
  ProductCategory,
  Seller,
  EnvironmentalImpact,
} from '../catalog/entities';
import {
  AddProductInput,
  UpdateProductInput,
  ProductFilterInput,
  ProductSortInput,
} from './dto';

@Resolver(() => Product)
export class ProductsResolver {
  constructor(
    private readonly productsService: ProductsService,
    private readonly impactService: ImpactService,
  ) {}

  @Query(() => Product, { nullable: true, name: 'getProductById' })
  async getProductById(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.getProductById(Number(id));
  }

  @Query(() => ProductConnection, { nullable: true, name: 'getProducts' })
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

  @Query(() => ProductConnection, {
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

  @Query(() => ProductConnection, {
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

  @Query(() => ProductConnection, {
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

  @Mutation(() => Product, { nullable: true, name: 'addProduct' })
  async addProduct(
    @Args('input') input: AddProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.addProduct(input, sellerId);
  }

  @Mutation(() => Product, { nullable: true, name: 'updateProduct' })
  async updateProduct(
    @Args('input') input: UpdateProductInput,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.updateProduct(input, sellerId);
  }

  @Mutation(() => Product, { nullable: true, name: 'deleteProduct' })
  async deleteProduct(@Args('id', { type: () => ID }) id: string) {
    return this.productsService.deleteProduct(Number(id));
  }

  @Mutation(() => Product, { nullable: true, name: 'toggleProductActive' })
  async toggleProductActive(
    @Args('id', { type: () => ID }) id: string,
    @CurrentSeller() sellerId?: string,
  ) {
    return this.productsService.toggleProductActive(Number(id), sellerId);
  }

  // Field resolvers
  @ResolveField(() => ProductCategory, { nullable: true })
  productCategory(@Parent() product: Product) {
    if (product.productCategory) {
      return product.productCategory;
    }
    return null;
  }

  @ResolveField(() => Seller, { nullable: true })
  seller(@Parent() product: Product) {
    if (product.seller) {
      return product.seller;
    }
    // Return a reference for Apollo Federation
    return { __typename: 'Seller', id: product.sellerId };
  }

  @ResolveField(() => EnvironmentalImpact, { nullable: true })
  async environmentalImpact(@Parent() product: Product) {
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
