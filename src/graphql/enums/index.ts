import { registerEnumType } from '@nestjs/graphql';
import { Language } from '@prisma/client';

export enum Badge {
  POPULAR = 'POPULAR',
  DISCOUNTED = 'DISCOUNTED',
  WOMAN_OWNED = 'WOMAN_OWNED',
  BEST_SELLER = 'BEST_SELLER',
  TOP_RATED = 'TOP_RATED',
  COMMUNITY_FAVORITE = 'COMMUNITY_FAVORITE',
  LIMITED_TIME_OFFER = 'LIMITED_TIME_OFFER',
  FLASH_SALE = 'FLASH_SALE',
  BEST_VALUE = 'BEST_VALUE',
  HANDMADE = 'HANDMADE',
  SUSTAINABLE = 'SUSTAINABLE',
  SUPPORTS_CAUSE = 'SUPPORTS_CAUSE',
  FAMILY_BUSINESS = 'FAMILY_BUSINESS',
  CHARITY_SUPPORT = 'CHARITY_SUPPORT',
  LIMITED_STOCK = 'LIMITED_STOCK',
  SEASONAL = 'SEASONAL',
  FREE_SHIPPING = 'FREE_SHIPPING',
  FOR_REPAIR = 'FOR_REPAIR',
  REFURBISHED = 'REFURBISHED',
  EXCHANGEABLE = 'EXCHANGEABLE',
  LAST_PRICE = 'LAST_PRICE',
  FOR_GIFT = 'FOR_GIFT',
  OPEN_TO_OFFERS = 'OPEN_TO_OFFERS',
  OPEN_BOX = 'OPEN_BOX',
  CRUELTY_FREE = 'CRUELTY_FREE',
  DELIVERED_TO_HOME = 'DELIVERED_TO_HOME',
  IN_HOUSE_PICKUP = 'IN_HOUSE_PICKUP',
  IN_MID_POINT_PICKUP = 'IN_MID_POINT_PICKUP',
}

export enum ProductCondition {
  NEW = 'NEW',
  OPEN_BOX = 'OPEN_BOX',
  LIKE_NEW = 'LIKE_NEW',
  FAIR = 'FAIR',
  POOR = 'POOR',
  FOR_PARTS = 'FOR_PARTS',
  REFURBISHED = 'REFURBISHED',
}

export enum ProductSize {
  XS = 'XS',
  S = 'S',
  M = 'M',
  L = 'L',
  XL = 'XL',
}

export enum WeightUnit {
  KG = 'KG',
  LB = 'LB',
  OZ = 'OZ',
  G = 'G',
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum ProductSortField {
  CREATED_AT = 'CREATED_AT',
  PRICE = 'PRICE',
  NAME = 'NAME',
}

// Register enums with GraphQL
registerEnumType(Badge, {
  name: 'Badge',
  description: 'Product badge types',
});

registerEnumType(ProductCondition, {
  name: 'ProductCondition',
  description: 'Product condition types',
});

registerEnumType(ProductSize, {
  name: 'ProductSize',
  description: 'Product size types',
});

registerEnumType(WeightUnit, {
  name: 'WeightUnit',
  description: 'Weight unit types',
});

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order direction',
});

registerEnumType(ProductSortField, {
  name: 'ProductSortField',
  description: 'Product sort field options',
});

// Register Language enum from Prisma
registerEnumType(Language, {
  name: 'Language',
  description: 'Supported languages for multi-language content',
});

// Export Language for use in other files
export { Language };
