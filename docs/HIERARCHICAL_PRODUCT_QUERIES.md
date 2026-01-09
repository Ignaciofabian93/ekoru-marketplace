# Hierarchical Product Queries

## Overview

The marketplace supports three levels of product filtering based on the catalog hierarchy:

1. **Department Level** → All products across all categories in that department
2. **Department Category Level** → All products from product categories under that category
3. **Product Category Level** → Only products in that specific category

## GraphQL Queries

### 1. Get Products by Department

Returns all products from all categories under a department (e.g., "Technology" → audio, TV, home tech devices, etc.)

```graphql
query GetProductsByDepartment($departmentId: ID!, $page: Int, $pageSize: Int) {
  getProductsByDepartment(
    departmentId: $departmentId
    page: $page
    pageSize: $pageSize
  ) {
    edges {
      id
      name
      description
      price
      images
      brand
      condition
      productCategory {
        id
        translation {
          name
        }
      }
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**Variables:**

```json
{
  "departmentId": "1",
  "page": 1,
  "pageSize": 20
}
```

### 2. Get Products by Department Category

Returns all products from product categories under this department category (e.g., "Audio" → speakers, microphones, cables, etc.)

```graphql
query GetProductsByDepartmentCategory(
  $departmentCategoryId: ID!
  $page: Int
  $pageSize: Int
) {
  getProductsByDepartmentCategory(
    departmentCategoryId: $departmentCategoryId
    page: $page
    pageSize: $pageSize
  ) {
    edges {
      id
      name
      description
      price
      images
      condition
      productCategory {
        id
        translation {
          name
        }
      }
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
    }
  }
}
```

**Variables:**

```json
{
  "departmentCategoryId": "10",
  "page": 1,
  "pageSize": 20
}
```

### 3. Get Products by Product Category

Returns only products in a specific category (e.g., "Speakers" → only speaker products)

```graphql
query GetProductsByProductCategory(
  $productCategoryId: ID!
  $page: Int
  $pageSize: Int
) {
  getProductsByCategory(
    productCategoryId: $productCategoryId
    page: $page
    pageSize: $pageSize
  ) {
    edges {
      id
      name
      description
      price
      images
      brand
      condition
      badges
    }
    pageInfo {
      currentPage
      totalPages
      totalCount
    }
  }
}
```

**Variables:**

```json
{
  "productCategoryId": "100",
  "page": 1,
  "pageSize": 20
}
```

## Filtering & Sorting

All three queries support additional filtering and sorting:

```graphql
query GetProductsWithFilters(
  $departmentId: ID!
  $page: Int
  $pageSize: Int
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
    edges {
      id
      name
      price
      condition
    }
    pageInfo {
      totalCount
    }
  }
}
```

**Filter Options:**

```json
{
  "filter": {
    "name": "laptop",
    "minPrice": 100,
    "maxPrice": 1000,
    "condition": "NEW",
    "isExchangeable": true,
    "badges": ["SUSTAINABLE", "BEST_SELLER"]
  },
  "sort": {
    "field": "PRICE",
    "order": "ASC"
  }
}
```

## Implementation Details

### Database Query Strategy

**Department Level:**

1. Query all `departmentCategory` where `departmentId = X`
2. Query all `productCategory` where `departmentCategoryId IN [...]`
3. Query all `product` where `productCategoryId IN [...]`

**Department Category Level:**

1. Query all `productCategory` where `departmentCategoryId = X`
2. Query all `product` where `productCategoryId IN [...]`

**Product Category Level:**

1. Query all `product` where `productCategoryId = X`

### Performance Considerations

- All queries are paginated with default `pageSize: 10`
- Only active categories are included (`isActive: true`)
- Products are filtered by `isActive: true` and `deletedAt: null` by default
- Category lookups are batched into single queries using `IN` clauses

## Frontend Integration Example

```typescript
// React/Next.js example
const { data, loading } = useQuery(GET_PRODUCTS_BY_DEPARTMENT, {
  variables: {
    departmentId: router.query.departmentId,
    page: 1,
    pageSize: 20,
  },
});

// Display products
return (
  <div>
    <h1>Products in {departmentName}</h1>
    <ProductGrid products={data?.getProductsByDepartment?.edges} />
    <Pagination pageInfo={data?.getProductsByDepartment?.pageInfo} />
  </div>
);
```

## Navigation Flow

```
User Journey:
1. Browse departments → click "Technology"
   → getProductsByDepartment(departmentId: 1)

2. Click "Audio" category
   → getProductsByDepartmentCategory(departmentCategoryId: 10)

3. Click "Speakers" product category
   → getProductsByCategory(productCategoryId: 100)
```

Each level narrows down the product selection progressively.
