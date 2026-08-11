import { Field, Float, Int, ObjectType } from '@nestjs/graphql';
import { ImpactKind, ImpactRole } from '@prisma/client';

@ObjectType('ImpactCategoryBreakdown')
export class ImpactCategoryBreakdown {
  @Field(() => Int, { nullable: true })
  productCategoryId?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Category name as it stood when the deal completed',
  })
  categoryName?: string;

  @Field(() => Int)
  itemCount!: number;

  @Field(() => Float)
  co2SavingsKG!: number;

  @Field(() => Float)
  waterSavingsLT!: number;
}

@ObjectType('ImpactHighlight')
export class ImpactHighlight {
  @Field(() => Int, { nullable: true })
  productId?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Product name as it stood when the deal completed',
  })
  productName?: string;

  @Field(() => ImpactKind)
  kind!: ImpactKind;

  @Field(() => ImpactRole, {
    description: 'Whether the user received this item or parted with it',
  })
  role!: ImpactRole;

  @Field(() => Float)
  co2SavingsKG!: number;

  @Field(() => Float)
  waterSavingsLT!: number;

  @Field()
  occurredAt!: Date;
}

/**
 * A seller's environmental savings for one year — the data behind a
 * year-in-review screen.
 */
@ObjectType('SellerImpactYear')
export class SellerImpactYear {
  @Field(() => Int)
  year!: number;

  @Field(() => Float)
  totalCo2SavingsKG!: number;

  @Field(() => Float)
  totalWaterSavingsLT!: number;

  @Field(() => Int, { description: 'Items bought, sold or exchanged' })
  totalItems!: number;

  @Field(() => Int)
  salesCount!: number;

  @Field(() => Int)
  exchangesCount!: number;

  @Field(() => [ImpactCategoryBreakdown], {
    description: 'Highest-saving categories first',
  })
  byCategory!: ImpactCategoryBreakdown[];

  @Field(() => [ImpactHighlight], {
    description: 'The single biggest-saving items, highest first',
  })
  topItems!: ImpactHighlight[];

  @Field(() => [String], {
    description:
      'Admin-curated "your saving is equivalent to…" lines for the CO2 total, ' +
      'from the Co2ImpactMessage bucket the total falls into. Empty when no ' +
      'bucket covers it.',
  })
  co2Messages!: string[];

  @Field(() => [String], {
    description: 'The same, for the water total.',
  })
  waterMessages!: string[];
}
