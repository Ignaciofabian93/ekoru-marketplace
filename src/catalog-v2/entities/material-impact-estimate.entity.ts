import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

/**
 * GraphQL MaterialImpactEstimate Entity
 *
 * Represents environmental impact estimates for different material types.
 * Used to calculate CO2 and water savings when products are made from recycled materials.
 */
@ObjectType('MaterialImpactEstimate')
export class MaterialImpactEstimateEntity {
  @Field(() => Int, { description: 'Unique identifier' })
  id: number;

  @Field(() => String, {
    description: 'Type of material (e.g., plastic, metal, paper)',
  })
  materialType: string;

  @Field(() => Float, { description: 'Estimated CO2 savings in kilograms' })
  estimatedCo2SavingsKG: number;

  @Field(() => Float, { description: 'Estimated water savings in liters' })
  estimatedWaterSavingsLT: number;
}
