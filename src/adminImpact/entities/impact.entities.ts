import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { Language } from '@prisma/client';
import { PageInfoEntity } from '../../products/entities/page-info.entity';

/**
 * Raw, admin-only views of the marketplace impact tables (material impact
 * estimates and the water / CO2 impact-message ranges), each with every
 * translation attached so the admin panel can drive CRUD + XLSX directly.
 *
 * ObjectType names are `Raw*`-prefixed to stay unique in the federated
 * supergraph. The bulk-upsert result reuses `adminCatalog`'s shared
 * `BulkUpsertResult` type (re-exported by this module's resolver).
 */

// ─── Material impact estimates ────────────────────────────────────────────────

@ObjectType('RawMaterialImpactEstimateTranslation')
export class RawMaterialImpactEstimateTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  materialImpactEstimateId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  materialTypeTranslation: string;
}

@ObjectType('RawMaterialImpactEstimate')
export class RawMaterialImpactEstimateEntity {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  materialType: string;

  @Field(() => Float)
  estimatedCo2SavingsKG: number;

  @Field(() => Float)
  estimatedWaterSavingsLT: number;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [RawMaterialImpactEstimateTranslationEntity])
  translations: RawMaterialImpactEstimateTranslationEntity[];
}

// ─── Water impact messages ────────────────────────────────────────────────────

@ObjectType('RawWaterImpactMessageTranslation')
export class RawWaterImpactMessageTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  waterImpactMessageId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  message1: string;

  @Field(() => String)
  message2: string;

  @Field(() => String)
  message3: string;
}

@ObjectType('RawWaterImpactMessage')
export class RawWaterImpactMessageEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  min: number;

  @Field(() => Float)
  max: number;

  @Field(() => String)
  message1: string;

  @Field(() => String)
  message2: string;

  @Field(() => String)
  message3: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [RawWaterImpactMessageTranslationEntity])
  translations: RawWaterImpactMessageTranslationEntity[];
}

// ─── CO2 impact messages ──────────────────────────────────────────────────────

@ObjectType('RawCo2ImpactMessageTranslation')
export class RawCo2ImpactMessageTranslationEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  co2ImpactMessageId: number;

  @Field(() => Language)
  language: Language;

  @Field(() => String)
  message1: string;

  @Field(() => String)
  message2: string;

  @Field(() => String)
  message3: string;
}

@ObjectType('RawCo2ImpactMessage')
export class RawCo2ImpactMessageEntity {
  @Field(() => Int)
  id: number;

  @Field(() => Float)
  min: number;

  @Field(() => Float)
  max: number;

  @Field(() => String)
  message1: string;

  @Field(() => String)
  message2: string;

  @Field(() => String)
  message3: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;

  @Field(() => [RawCo2ImpactMessageTranslationEntity])
  translations: RawCo2ImpactMessageTranslationEntity[];
}

// ─── Connections ──────────────────────────────────────────────────────────────

@ObjectType('RawMaterialImpactEstimateConnection')
export class RawMaterialImpactEstimateConnectionEntity {
  @Field(() => [RawMaterialImpactEstimateEntity])
  nodes: RawMaterialImpactEstimateEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}

@ObjectType('RawWaterImpactMessageConnection')
export class RawWaterImpactMessageConnectionEntity {
  @Field(() => [RawWaterImpactMessageEntity])
  nodes: RawWaterImpactMessageEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}

@ObjectType('RawCo2ImpactMessageConnection')
export class RawCo2ImpactMessageConnectionEntity {
  @Field(() => [RawCo2ImpactMessageEntity])
  nodes: RawCo2ImpactMessageEntity[];

  @Field(() => PageInfoEntity)
  pageInfo: PageInfoEntity;
}
