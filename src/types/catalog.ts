export type MarketplaceCatalog = {
  id: number;
  name: string;
  href: string;
  categories: {
    id: number;
    name: string;
    href: string;
    productCategories: {
      id: number;
      name: string;
      href: string;
    }[];
  }[];
}[];
