import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { MaterialImpactEstimateEntity } from './material-impact-estimate.entity';
import { ProductCategoryEntity } from './product-category.entity';

/**
 * GraphQL ProductCategoryMaterial Entity
 *
 * Represents the materials composition of a product category.
 * Links product categories to their material types with quantity information.
 */
@ObjectType('ProductCategoryMaterial')
export class ProductCategoryMaterialEntity {
  @Field(() => Int, { description: 'Unique identifier' })
  id: number;

  @Field(() => Int, { description: 'Reference to product category' })
  productCategoryId: number;

  @Field(() => Int, { description: 'Reference to material type' })
  materialTypeId: number;

  @Field(() => Float, { description: 'Quantity of this material' })
  quantity: number;

  @Field(() => String, {
    description: 'Unit of measurement (e.g., percentage, kg)',
  })
  unit: string;

  @Field(() => Boolean, { description: 'Whether this is the primary material' })
  isPrimary: boolean;

  @Field(() => Date, { description: 'Creation timestamp' })
  createdAt: Date;

  @Field(() => Date, { description: 'Last update timestamp' })
  updatedAt: Date;

  // Relations
  @Field(() => MaterialImpactEstimateEntity, {
    nullable: true,
    description: 'Material impact data',
  })
  material?: MaterialImpactEstimateEntity;

  @Field(() => ProductCategoryEntity, {
    nullable: true,
    description: 'Product category this material belongs to',
  })
  productCategory?: ProductCategoryEntity;
}
