import { registerEnumType } from '@nestjs/graphql';
import {
  Language,
  Badge,
  ProductCondition,
  ProductSize,
  WeightUnit,
} from '@prisma/client';

// Local enums not present in Prisma schema
export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ProductSortField {
  CREATED_AT = 'CREATED_AT',
  PRICE = 'PRICE',
  NAME = 'NAME',
}

/**
 * Single source of truth for all enum registrations.
 * All enums are imported from @prisma/client to ensure the exact same
 * enum objects are registered and used in @Field() decorators.
 */
registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages for multi-language content',
});

registerEnumType(Badge, {
  name: 'Badge',
  description: 'Product badge types for special designations',
});

registerEnumType(ProductCondition, {
  name: 'ProductCondition',
  description: 'Condition of the product',
});

registerEnumType(ProductSize, {
  name: 'ProductSize',
  description: 'Product size categories',
});

registerEnumType(WeightUnit, {
  name: 'WeightUnit',
  description: 'Weight measurement units',
});

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction',
});

registerEnumType(ProductSortField, {
  name: 'ProductSortField',
  description: 'Product sort field options',
});

export { Language, Badge, ProductCondition, ProductSize, WeightUnit };
