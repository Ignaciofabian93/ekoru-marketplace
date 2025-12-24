import { ObjectType, Field, ID, Float, Directive } from '@nestjs/graphql';
import { ProductCategoryMaterial } from './product-category-material.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@shareable')
export class MaterialImpactEstimate {
  @Field(() => ID)
  id: number;

  @Field()
  materialType: string;

  @Field(() => Float, { nullable: true })
  estimatedCo2SavingsKG?: number | null;

  @Field(() => Float, { nullable: true })
  estimatedWaterSavingsLT?: number | null;

  @Field(() => [ProductCategoryMaterial], { nullable: true })
  productCategoryMaterials?: ProductCategoryMaterial[];
}
