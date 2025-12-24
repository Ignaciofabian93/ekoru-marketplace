import { ObjectType, Field, ID, Int, Float, Directive } from '@nestjs/graphql';
import { MaterialImpactEstimate } from './material-impact-estimate.entity';

@ObjectType()
@Directive('@key(fields: "id")')
@Directive('@shareable')
export class ProductCategoryMaterial {
  @Field(() => ID)
  id: number;

  @Field(() => Int)
  productCategoryId: number;

  @Field(() => Int)
  materialTypeId: number;

  @Field(() => Float)
  quantity: number;

  @Field()
  unit: string;

  @Field()
  isPrimary: boolean;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date;

  @Field(() => MaterialImpactEstimate, { nullable: true })
  material?: MaterialImpactEstimate;
}
