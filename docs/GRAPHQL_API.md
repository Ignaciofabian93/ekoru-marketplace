# ekoru-marketplace — GraphQL API Reference

> **Subgraph**: Marketplace catalog — departments, categories, product categories, and marketplace products.

---

## Headers

| Header | Required | Description |
|---|---|---|
| `Authorization` | Mutations | `Bearer <jwt_token>` |
| `x-seller-id` | Mutations | Seller UUID from auth |
| `Accept-Language` | Optional | `es` · `en` · `fr` — defaults to `es` |

---

## Enums

```graphql
enum Language { ES  EN  FR }

enum Badge {
  POPULAR  DISCOUNTED  WOMAN_OWNED  BEST_SELLER  TOP_RATED
  COMMUNITY_FAVORITE  LIMITED_TIME_OFFER  FLASH_SALE  BEST_VALUE
  HANDMADE  SUSTAINABLE  SUPPORTS_CAUSE  FAMILY_BUSINESS
  CHARITY_SUPPORT  LIMITED_STOCK  SEASONAL  FREE_SHIPPING
  FOR_REPAIR  REFURBISHED  EXCHANGEABLE  LAST_PRICE  FOR_GIFT
  OPEN_TO_OFFERS  OPEN_BOX  CRUELTY_FREE  DELIVERED_TO_HOME
  IN_HOUSE_PICKUP  IN_MID_POINT_PICKUP
}

enum ProductCondition { NEW  USED  REFURBISHED }

enum ProductSize { XS  S  M  L  XL }

enum WeightUnit { KG  LB  OZ  G }

enum SortOrder { ASC  DESC }

enum ProductSortField { CREATED_AT  PRICE  NAME }
```

---

## Fragments

```graphql
fragment TranslationFields on DepartmentTranslation {
  id
  name
  slug
  href
}

fragment CategoryTranslationFields on DepartmentCategoryTranslation {
  id
  name
  slug
  href
}

fragment ProductCategoryTranslationFields on ProductCategoryTranslation {
  id
  name
  slug
  href
}

fragment ProductCategoryFields on ProductCategory {
  id
  translation {
    ...ProductCategoryTranslationFields
  }
}

fragment DepartmentCategoryFields on DepartmentCategory {
  id
  translation {
    ...CategoryTranslationFields
  }
  productCategory {
    ...ProductCategoryFields
  }
}

fragment DepartmentFields on Department {
  id
  translation {
    ...TranslationFields
  }
  departmentCategory {
    ...DepartmentCategoryFields
  }
}

fragment CatalogItemFields on MarketplaceCatalogItem {
  id
  name
  slug
  href
  categories {
    id
    name
    slug
    href
    productCategories {
      id
      name
      slug
      href
    }
  }
}

fragment ProductFields on Product {
  id
  name
  description
  color
  brand
  price
  images
  badges
  interests
  condition
  conditionDescription
  isActive
  isExchangeable
  sellerId
  viewCount
  createdAt
  updatedAt
}

fragment EnvironmentalImpactFields on EnvironmentalImpact {
  carbonFootprint
  waterUsage
  recyclabilityScore
}
```

---

## Queries

### getMarketplaceCatalog

Returns the complete catalog tree (departments → categories → product categories) flattened into a simple menu structure. Ideal for navigation menus.

```graphql
query GetMarketplaceCatalog($language: Language = ES) {
  getMarketplaceCatalog(language: $language) {
    ...CatalogItemFields
  }
}
```

**Variables**
```json
{ "language": "ES" }
```

---

### getDepartments

```graphql
query GetDepartments(
  $limit: Int = 20
  $offset: Int = 0
  $language: Language = ES
) {
  getDepartments(limit: $limit, offset: $offset, language: $language) {
    ...DepartmentFields
  }
}
```

**Variables**
```json
{ "limit": 20, "offset": 0, "language": "ES" }
```

---

### getDepartmentBySlug

```graphql
query GetDepartmentBySlug($slug: String!, $language: Language!) {
  getDepartmentBySlug(slug: $slug, language: $language) {
    ...DepartmentFields
  }
}
```

**Variables**
```json
{ "slug": "tecnologia", "language": "ES" }
```

---

### getDepartmentCategories

```graphql
query GetDepartmentCategories(
  $limit: Int = 20
  $offset: Int = 0
  $language: Language = ES
) {
  getDepartmentCategories(limit: $limit, offset: $offset, language: $language) {
    id
    translation {
      ...CategoryTranslationFields
    }
    productCategory {
      ...ProductCategoryFields
    }
  }
}
```

---

### getDepartmentCategoryBySlug

```graphql
query GetDepartmentCategoryBySlug($slug: String!, $language: Language!) {
  getDepartmentCategoryBySlug(slug: $slug, language: $language) {
    id
    translation {
      ...CategoryTranslationFields
    }
    productCategory {
      ...ProductCategoryFields
    }
  }
}
```

**Variables**
```json
{ "slug": "smartphones", "language": "ES" }
```

---

### getProductCategories

```graphql
query GetProductCategories(
  $limit: Int = 10
  $offset: Int = 0
  $language: Language = ES
) {
  getProductCategories(limit: $limit, offset: $offset, language: $language) {
    ...ProductCategoryFields
  }
}
```

---

### getProductCategoryBySlug

```graphql
query GetProductCategoryBySlug($slug: String!, $language: Language = ES) {
  getProductCategoryBySlug(slug: $slug, language: $language) {
    ...ProductCategoryFields
  }
}
```

**Variables**
```json
{ "slug": "iphones", "language": "ES" }
```

---

### getProducts

```graphql
query GetProducts(
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProducts(page: $page, pageSize: $pageSize, filter: $filter, sort: $sort) {
    nodes {
      ...ProductFields
      productCategory {
        id
        translation { name slug href }
      }
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables**
```json
{
  "page": 1,
  "pageSize": 10,
  "filter": {
    "minPrice": 0,
    "maxPrice": 100000,
    "condition": "NEW",
    "isExchangeable": false
  },
  "sort": { "field": "CREATED_AT", "order": "DESC" }
}
```

---

### getProductsBySeller

```graphql
query GetProductsBySeller(
  $sellerId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProductsBySeller(
    sellerId: $sellerId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...ProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables**
```json
{ "sellerId": "seller-uuid-here", "page": 1, "pageSize": 10 }
```

---

### getProductsByCategory

```graphql
query GetProductsByCategory(
  $productCategoryId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProductsByCategory(
    productCategoryId: $productCategoryId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...ProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### getProductsByDepartmentCategory

```graphql
query GetProductsByDepartmentCategory(
  $departmentCategoryId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProductsByDepartmentCategory(
    departmentCategoryId: $departmentCategoryId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...ProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### getProductsByDepartment

```graphql
query GetProductsByDepartment(
  $departmentId: ID!
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProductsByDepartment(
    departmentId: $departmentId
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...ProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

### getExchangeableProducts

```graphql
query GetExchangeableProducts(
  $page: Int = 1
  $pageSize: Int = 10
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getExchangeableProducts(
    page: $page
    pageSize: $pageSize
    filter: $filter
    sort: $sort
  ) {
    nodes {
      ...ProductFields
    }
    pageInfo {
      totalCount
      totalPages
      currentPage
      pageSize
      hasNextPage
      hasPreviousPage
    }
  }
}
```

---

## Mutations

> All mutations require `Authorization: Bearer <token>` and `x-seller-id` headers.

### addProduct

```graphql
mutation AddProduct($input: AddProductInput!) {
  addProduct(input: $input) {
    ...ProductFields
    productCategory {
      id
      translation { name slug href }
    }
  }
}
```

**Variables**
```json
{
  "input": {
    "name": "iPhone 15",
    "description": "Smartphone Apple en excelente estado",
    "color": "Negro",
    "brand": "Apple",
    "price": 850000,
    "productCategoryId": 3,
    "images": ["https://cdn.example.com/img1.jpg"],
    "badges": ["POPULAR"],
    "interests": ["tecnologia"],
    "condition": "USED",
    "conditionDescription": "Rayones mínimos en la pantalla",
    "isExchangeable": true
  }
}
```

---

### updateProduct

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(input: $input) {
    ...ProductFields
  }
}
```

**Variables**
```json
{
  "input": {
    "id": "42",
    "price": 799000,
    "isExchangeable": false
  }
}
```

---

### deleteProduct

```graphql
mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id) {
    id
    isActive
    deletedAt
  }
}
```

**Variables**
```json
{ "id": "42" }
```

---

### toggleProductActive

```graphql
mutation ToggleProductActive($id: ID!) {
  toggleProductActive(id: $id) {
    id
    isActive
  }
}
```

**Variables**
```json
{ "id": "42" }
```

---

## Input Types

### ProductFilterInput

```graphql
input ProductFilterInput {
  name: String
  minPrice: Float
  maxPrice: Float
  condition: ProductCondition
  isExchangeable: Boolean
  badges: [Badge!]
}
```

### ProductSortInput

```graphql
input ProductSortInput {
  field: ProductSortField!   # CREATED_AT | PRICE | NAME
  order: SortOrder!          # ASC | DESC
}
```

### AddProductInput

```graphql
input AddProductInput {
  name: String!
  description: String!
  color: String
  brand: String!
  price: Int!
  productCategoryId: Int!
  images: [String!]!
  badges: [Badge!]
  interests: [String!]
  condition: ProductCondition!
  conditionDescription: String
  isExchangeable: Boolean
}
```

### UpdateProductInput

```graphql
input UpdateProductInput {
  id: ID!
  name: String
  description: String
  color: String
  brand: String
  price: Int
  productCategoryId: Int
  images: [String!]
  badges: [Badge!]
  interests: [String!]
  condition: ProductCondition
  conditionDescription: String
  isExchangeable: Boolean
}
```
