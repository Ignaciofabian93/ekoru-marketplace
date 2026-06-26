import { ObjectType, Field, Float, Directive } from '@nestjs/graphql';

/**
 * GraphQL EnvironmentalImpact Entity
 *
 * Represents the environmental impact calculation for a product category.
 * Aggregates CO2 and water savings based on material composition.
 */
@ObjectType('EnvironmentalImpact')
@Directive('@shareable')
export class EnvironmentalImpactEntity {
  @Field(() => Float, {
    description: 'Total estimated CO2 savings in kilograms',
  })
  totalCo2SavingsKG!: number;

  @Field(() => Float, {
    description: 'Total estimated water savings in liters',
  })
  totalWaterSavingsLT!: number;

  @Field(() => [MaterialBreakdown], {
    description: 'Breakdown of impact by material type',
  })
  materialBreakdown!: MaterialBreakdown[];
}

/**
 * Material-level breakdown of environmental impact
 */
@ObjectType('MaterialBreakdown')
@Directive('@shareable')
export class MaterialBreakdown {
  @Field(() => String, {
    description:
      'Raw material type key (e.g. "PLASTIC", "ELECTRONIC_COMPONENTS"). ' +
      'Stable identifier — use it for icons/logic, render `materialTypeLabel`.',
  })
  materialType!: string;

  @Field(() => String, {
    description:
      'Localized, render-ready material name for the request language ' +
      '(falls back to a humanized form of materialType when no translation exists).',
  })
  materialTypeLabel!: string;

  @Field(() => Float, { description: 'Quantity of this material' })
  quantity!: number;

  @Field(() => String, { description: 'Unit of measurement' })
  unit!: string;

  @Field(() => Float, { description: 'CO2 savings for this material in kg' })
  co2SavingsKG!: number;

  @Field(() => Float, {
    description: 'Water savings for this material in liters',
  })
  waterSavingsLT!: number;
}
