import { ObjectType, Field, Float, Directive } from '@nestjs/graphql';

@ObjectType()
@Directive('@shareable')
export class MaterialImpactBreakdown {
  @Field()
  materialType: string;

  @Field(() => Float)
  percentage: number;

  @Field(() => Float)
  weightKG: number;

  @Field(() => Float)
  co2SavingsKG: number;

  @Field(() => Float)
  waterSavingsLT: number;
}

@ObjectType()
@Directive('@shareable')
export class EnvironmentalImpact {
  @Field(() => Float)
  totalCo2SavingsKG: number;

  @Field(() => Float)
  totalWaterSavingsLT: number;

  @Field(() => [MaterialImpactBreakdown])
  materialBreakdown: MaterialImpactBreakdown[];
}
