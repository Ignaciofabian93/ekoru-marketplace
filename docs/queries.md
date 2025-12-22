# GraphQL API Documentation - Ekoru Marketplace

This document provides comprehensive documentation for all GraphQL queries and mutations available in the Ekoru Marketplace service, along with examples of how to use them in a web application.

## Table of Contents

1. [Setup](#setup)
2. [Catalog Queries](#catalog-queries)
3. [Marketplace Queries](#marketplace-queries)
4. [Product Queries](#product-queries)
5. [Product Mutations](#product-mutations)
6. [Impact Queries](#impact-queries)
7. [Error Handling](#error-handling)

---

## Setup

### Installing Apollo Client (React/Next.js)

```bash
npm install @apollo/client graphql
```

### Client Configuration

```typescript
// lib/apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

// Add authentication token if needed
const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Provider Setup (React/Next.js)

```typescript
// pages/_app.tsx
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from '../lib/apollo-client';

function MyApp({ Component, pageProps }) {
  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  );
}

export default MyApp;
```

---

## Catalog Queries

### 1. marketplaceCatalog

Get the complete marketplace catalog with departments, categories, and subcategories in a hierarchical structure.

**GraphQL Query:**

```graphql
query GetMarketplaceCatalog {
  marketplaceCatalog {
    id
    name
    description
    categories {
      edges {
        node {
          id
          name
          description
          productCategories {
            edges {
              node {
                id
                name
                description
                averageWeight
              }
            }
          }
        }
      }
    }
  }
}
```

**React Hook Example:**

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_MARKETPLACE_CATALOG = gql`
  query GetMarketplaceCatalog {
    marketplaceCatalog {
      id
      name
      description
      categories {
        edges {
          node {
            id
            name
            description
          }
        }
      }
    }
  }
`;

function CatalogView() {
  const { data, loading, error } = useQuery(GET_MARKETPLACE_CATALOG);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.marketplaceCatalog.map((department) => (
        <div key={department.id}>
          <h2>{department.name}</h2>
          <p>{department.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Marketplace Queries

### 2. getDepartments

Get all departments, optionally filtered by seller.

**Arguments:**

- `sellerId` (optional): Filter departments by seller

**GraphQL Query:**

```graphql
query GetDepartments($sellerId: ID) {
  getDepartments(sellerId: $sellerId) {
    id
    name
    description
  }
}
```

**React Hook Example:**

```typescript
const GET_DEPARTMENTS = gql`
  query GetDepartments {
    getDepartments {
      id
      name
      description
    }
  }
`;

function DepartmentsList() {
  const { data, loading } = useQuery(GET_DEPARTMENTS);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {data?.getDepartments?.map((dept) => (
        <li key={dept.id}>{dept.name}</li>
      ))}
    </ul>
  );
}
```

### 3. getDepartment

Get a single department with paginated categories.

**Arguments:**

- `id` (required): Department ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page

**GraphQL Query:**

```graphql
query GetDepartment($id: ID!, $page: Int, $pageSize: Int) {
  getDepartment(id: $id, page: $page, pageSize: $pageSize) {
    id
    name
    description
    categories {
      edges {
        node {
          id
          name
          description
        }
      }
      pageInfo {
        currentPage
        pageSize
        totalPages
        totalItems
        hasNextPage
        hasPreviousPage
      }
    }
  }
}
```

**React Hook Example:**

```typescript
const GET_DEPARTMENT = gql`
  query GetDepartment($id: ID!, $page: Int) {
    getDepartment(id: $id, page: $page, pageSize: 10) {
      id
      name
      categories {
        edges {
          node {
            id
            name
          }
        }
        pageInfo {
          currentPage
          totalPages
          hasNextPage
        }
      }
    }
  }
`;

function DepartmentDetail({ departmentId }) {
  const [page, setPage] = useState(1);
  const { data, loading } = useQuery(GET_DEPARTMENT, {
    variables: { id: departmentId, page },
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{data.getDepartment.name}</h1>
      <div>
        {data.getDepartment.categories.edges.map(({ node }) => (
          <div key={node.id}>{node.name}</div>
        ))}
      </div>
      {data.getDepartment.categories.pageInfo.hasNextPage && (
        <button onClick={() => setPage(page + 1)}>Next Page</button>
      )}
    </div>
  );
}
```

### 4. getDepartmentCategories

Get paginated department categories for a specific department.

**Arguments:**

- `departmentId` (required): Department ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page

**GraphQL Query:**

```graphql
query GetDepartmentCategories($departmentId: ID!, $page: Int, $pageSize: Int) {
  getDepartmentCategories(
    departmentId: $departmentId
    page: $page
    pageSize: $pageSize
  ) {
    edges {
      node {
        id
        name
        description
      }
    }
    pageInfo {
      currentPage
      pageSize
      totalPages
      totalItems
      hasNextPage
      hasPreviousPage
    }
  }
}
```

### 5. getDepartmentCategoriesByDepartmentId

Get all department categories for a department (non-paginated).

**Arguments:**

- `departmentId` (required): Department ID
- `sellerId` (optional): Filter by seller

**GraphQL Query:**

```graphql
query GetDepartmentCategoriesByDepartmentId($departmentId: ID!) {
  getDepartmentCategoriesByDepartmentId(departmentId: $departmentId) {
    id
    name
    description
  }
}
```

### 6. getDepartmentCategory

Get a single department category with paginated product categories.

**Arguments:**

- `id` (required): Department Category ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page

**GraphQL Query:**

```graphql
query GetDepartmentCategory($id: ID!, $page: Int, $pageSize: Int) {
  getDepartmentCategory(id: $id, page: $page, pageSize: $pageSize) {
    id
    name
    description
    productCategories {
      edges {
        node {
          id
          name
          description
          averageWeight
        }
      }
      pageInfo {
        currentPage
        totalPages
        hasNextPage
      }
    }
  }
}
```

### 7. getProductCategories

Get paginated product categories for a specific department category.

**Arguments:**

- `departmentCategoryId` (required): Department Category ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page

**GraphQL Query:**

```graphql
query GetProductCategories(
  $departmentCategoryId: ID!
  $page: Int
  $pageSize: Int
) {
  getProductCategories(
    departmentCategoryId: $departmentCategoryId
    page: $page
    pageSize: $pageSize
  ) {
    edges {
      node {
        id
        name
        description
        averageWeight
      }
    }
    pageInfo {
      currentPage
      totalPages
      totalItems
      hasNextPage
    }
  }
}
```

### 8. getProductCategoriesByDepartmentCategoryId

Get all product categories for a department category (non-paginated).

**Arguments:**

- `departmentCategoryId` (required): Department Category ID
- `sellerId` (optional): Filter by seller

**GraphQL Query:**

```graphql
query GetProductCategoriesByDepartmentCategoryId($departmentCategoryId: ID!) {
  getProductCategoriesByDepartmentCategoryId(
    departmentCategoryId: $departmentCategoryId
  ) {
    id
    name
    description
    averageWeight
  }
}
```

### 9. getProductCategory

Get a single product category with optional pagination.

**Arguments:**

- `id` (required): Product Category ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page

**GraphQL Query:**

```graphql
query GetProductCategory($id: ID!) {
  getProductCategory(id: $id) {
    id
    name
    description
    averageWeight
    materials {
      id
      quantity
      unit
      isPrimary
      material {
        materialType
        estimatedCo2SavingsKG
        estimatedWaterSavingsLT
      }
    }
  }
}
```

---

## Product Queries

### 10. getProductById

Get a single product by ID.

**Arguments:**

- `id` (required): Product ID

**GraphQL Query:**

```graphql
query GetProductById($id: ID!) {
  getProductById(id: $id) {
    id
    sku
    barcode
    color
    brand
    name
    description
    price
    images
    hasOffer
    offerPrice
    stock
    isExchangeable
    interests
    isActive
    badges
    condition
    conditionDescription
    sellerId
    productCategoryId
    createdAt
    updatedAt
    seller {
      id
    }
    productCategory {
      id
      name
      description
    }
    environmentalImpact {
      totalCo2SavingsKG
      totalWaterSavingsLT
      materialBreakdown {
        materialType
        percentage
        weightKG
        co2SavingsKG
        waterSavingsLT
      }
    }
  }
}
```

**React Hook Example:**

```typescript
const GET_PRODUCT = gql`
  query GetProduct($id: ID!) {
    getProductById(id: $id) {
      id
      name
      brand
      description
      price
      images
      condition
      environmentalImpact {
        totalCo2SavingsKG
        totalWaterSavingsLT
      }
    }
  }
`;

function ProductDetail({ productId }) {
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id: productId },
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const product = data.getProductById;

  return (
    <div>
      <h1>{product.name}</h1>
      <p>{product.brand}</p>
      <p>{product.description}</p>
      <p>Price: ${product.price}</p>
      <img src={product.images[0]} alt={product.name} />
      {product.environmentalImpact && (
        <div>
          <p>CO2 Savings: {product.environmentalImpact.totalCo2SavingsKG} kg</p>
          <p>Water Savings: {product.environmentalImpact.totalWaterSavingsLT} L</p>
        </div>
      )}
    </div>
  );
}
```

### 11. getProducts

Get paginated products with optional filtering and sorting.

**Arguments:**

- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page
- `filter` (optional): ProductFilterInput object
- `sort` (optional): ProductSortInput object

**Filter Options:**

- `name`: String - Filter by product name
- `minPrice`: Int - Minimum price
- `maxPrice`: Int - Maximum price
- `isActive`: Boolean - Filter active/inactive products
- `isExchangeable`: Boolean - Filter exchangeable products
- `sellerId`: String - Filter by seller
- `productCategoryId`: Int - Filter by product category
- `departmentCategoryId`: Int - Filter by department category
- `departmentId`: Int - Filter by department
- `condition`: ProductCondition - Filter by condition (NEW, LIKE_NEW, GOOD, FAIR, POOR)
- `badges`: [Badge] - Filter by badges
- `brand`: String - Filter by brand
- `color`: String - Filter by color
- `interests`: [String] - Filter by interests

**Sort Options:**

- `field`: ProductSortField (CREATED_AT, UPDATED_AT, PRICE, NAME)
- `order`: SortOrder (ASC, DESC)

**GraphQL Query:**

```graphql
query GetProducts(
  $page: Int
  $pageSize: Int
  $filter: ProductFilterInput
  $sort: ProductSortInput
) {
  getProducts(page: $page, pageSize: $pageSize, filter: $filter, sort: $sort) {
    edges {
      node {
        id
        name
        brand
        price
        images
        isExchangeable
        condition
        badges
      }
    }
    pageInfo {
      currentPage
      pageSize
      totalPages
      totalItems
      hasNextPage
      hasPreviousPage
    }
  }
}
```

**React Hook Example with Filters:**

```typescript
const GET_PRODUCTS = gql`
  query GetProducts($page: Int, $filter: ProductFilterInput, $sort: ProductSortInput) {
    getProducts(page: $page, pageSize: 20, filter: $filter, sort: $sort) {
      edges {
        node {
          id
          name
          brand
          price
          images
          condition
        }
      }
      pageInfo {
        currentPage
        totalPages
        hasNextPage
      }
    }
  }
`;

function ProductsList() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 1000,
    isActive: true,
  });

  const { data, loading } = useQuery(GET_PRODUCTS, {
    variables: {
      page,
      filter: filters,
      sort: { field: 'PRICE', order: 'ASC' },
    },
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div>
        {data.getProducts.edges.map(({ node }) => (
          <ProductCard key={node.id} product={node} />
        ))}
      </div>
      <button
        onClick={() => setPage(page - 1)}
        disabled={page === 1}
      >
        Previous
      </button>
      <button
        onClick={() => setPage(page + 1)}
        disabled={!data.getProducts.pageInfo.hasNextPage}
      >
        Next
      </button>
    </div>
  );
}
```

### 12. getProductsBySeller

Get paginated products for a specific seller.

**Arguments:**

- `sellerId` (required): Seller ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page
- `filter` (optional): ProductFilterInput object
- `sort` (optional): ProductSortInput object

**GraphQL Query:**

```graphql
query GetProductsBySeller(
  $sellerId: ID!
  $page: Int
  $pageSize: Int
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
    edges {
      node {
        id
        name
        price
        images
        isActive
      }
    }
    pageInfo {
      currentPage
      totalPages
      totalItems
      hasNextPage
    }
  }
}
```

### 13. getProductsByCategory

Get paginated products for a specific product category.

**Arguments:**

- `productCategoryId` (required): Product Category ID
- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page
- `filter` (optional): ProductFilterInput object
- `sort` (optional): ProductSortInput object

**GraphQL Query:**

```graphql
query GetProductsByCategory(
  $productCategoryId: ID!
  $page: Int
  $filter: ProductFilterInput
) {
  getProductsByCategory(
    productCategoryId: $productCategoryId
    page: $page
    pageSize: 20
    filter: $filter
  ) {
    edges {
      node {
        id
        name
        brand
        price
        images
      }
    }
    pageInfo {
      currentPage
      totalPages
      hasNextPage
    }
  }
}
```

### 14. getExchangeableProducts

Get paginated exchangeable products (products available for exchange).

**Arguments:**

- `page` (optional, default: 1): Page number
- `pageSize` (optional, default: 10): Items per page
- `filter` (optional): ProductFilterInput object
- `sort` (optional): ProductSortInput object

**GraphQL Query:**

```graphql
query GetExchangeableProducts($page: Int, $filter: ProductFilterInput) {
  getExchangeableProducts(page: $page, pageSize: 20, filter: $filter) {
    edges {
      node {
        id
        name
        brand
        price
        images
        interests
        isExchangeable
      }
    }
    pageInfo {
      currentPage
      totalPages
      hasNextPage
    }
  }
}
```

---

## Product Mutations

### 15. addProduct

Add a new product to the marketplace.

**Arguments:**

- `input` (required): AddProductInput object

**Input Fields:**

- `name` (required): String
- `brand` (required): String
- `description` (required): String
- `price` (required): Int
- `images` (required): [String]
- `productCategoryId` (required): Int
- `sellerId` (required): String
- `color` (optional): String
- `isExchangeable` (optional): Boolean
- `interests` (optional): [String]
- `isActive` (optional): Boolean
- `badges` (optional): [Badge]
- `condition` (optional): ProductCondition
- `conditionDescription` (optional): String

**GraphQL Mutation:**

```graphql
mutation AddProduct($input: AddProductInput!) {
  addProduct(input: $input) {
    id
    name
    brand
    price
    images
    isActive
    createdAt
  }
}
```

**React Hook Example:**

```typescript
const ADD_PRODUCT = gql`
  mutation AddProduct($input: AddProductInput!) {
    addProduct(input: $input) {
      id
      name
      brand
      price
    }
  }
`;

function AddProductForm() {
  const [addProduct, { loading, error }] = useMutation(ADD_PRODUCT);

  const handleSubmit = async (formData) => {
    try {
      const { data } = await addProduct({
        variables: {
          input: {
            name: formData.name,
            brand: formData.brand,
            description: formData.description,
            price: parseInt(formData.price),
            images: formData.images,
            productCategoryId: parseInt(formData.categoryId),
            sellerId: formData.sellerId,
            condition: 'GOOD',
            isActive: true,
          },
        },
      });
      console.log('Product added:', data.addProduct);
    } catch (err) {
      console.error('Error adding product:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Adding...' : 'Add Product'}
      </button>
      {error && <p>Error: {error.message}</p>}
    </form>
  );
}
```

### 16. updateProduct

Update an existing product.

**Arguments:**

- `input` (required): UpdateProductInput object

**Input Fields (all optional except `id`):**

- `id` (required): ID
- `sku`: String
- `barcode`: String
- `color`: String
- `brand`: String
- `name`: String
- `description`: String
- `price`: Int
- `images`: [String]
- `hasOffer`: Boolean
- `offerPrice`: Int
- `stock`: Int
- `isExchangeable`: Boolean
- `interests`: [String]
- `isActive`: Boolean
- `badges`: [Badge]
- `productCategoryId`: Int
- `condition`: ProductCondition
- `conditionDescription`: String

**GraphQL Mutation:**

```graphql
mutation UpdateProduct($input: UpdateProductInput!) {
  updateProduct(input: $input) {
    id
    name
    price
    isActive
    updatedAt
  }
}
```

**React Hook Example:**

```typescript
const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      price
      updatedAt
    }
  }
`;

function EditProductForm({ productId }) {
  const [updateProduct, { loading }] = useMutation(UPDATE_PRODUCT);

  const handleUpdate = async (updates) => {
    try {
      await updateProduct({
        variables: {
          input: {
            id: productId,
            ...updates,
          },
        },
        refetchQueries: ['GetProduct'],
      });
    } catch (err) {
      console.error('Error updating product:', err);
    }
  };

  return (
    <button onClick={() => handleUpdate({ price: 2999 })}>
      Update Price
    </button>
  );
}
```

### 17. deleteProduct

Delete a product.

**Arguments:**

- `id` (required): Product ID

**GraphQL Mutation:**

```graphql
mutation DeleteProduct($id: ID!) {
  deleteProduct(id: $id) {
    id
    name
  }
}
```

**React Hook Example:**

```typescript
const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: ID!) {
    deleteProduct(id: $id) {
      id
    }
  }
`;

function DeleteProductButton({ productId }) {
  const [deleteProduct, { loading }] = useMutation(DELETE_PRODUCT, {
    refetchQueries: ['GetProducts'],
  });

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct({ variables: { id: productId } });
        alert('Product deleted successfully');
      } catch (err) {
        alert('Error deleting product');
      }
    }
  };

  return (
    <button onClick={handleDelete} disabled={loading}>
      {loading ? 'Deleting...' : 'Delete Product'}
    </button>
  );
}
```

### 18. toggleProductActive

Toggle a product's active status.

**Arguments:**

- `id` (required): Product ID

**GraphQL Mutation:**

```graphql
mutation ToggleProductActive($id: ID!) {
  toggleProductActive(id: $id) {
    id
    isActive
  }
}
```

**React Hook Example:**

```typescript
const TOGGLE_ACTIVE = gql`
  mutation ToggleProductActive($id: ID!) {
    toggleProductActive(id: $id) {
      id
      isActive
    }
  }
`;

function ToggleActiveButton({ productId, currentStatus }) {
  const [toggleActive] = useMutation(TOGGLE_ACTIVE);

  return (
    <button
      onClick={() =>
        toggleActive({
          variables: { id: productId },
          optimisticResponse: {
            toggleProductActive: {
              __typename: 'Product',
              id: productId,
              isActive: !currentStatus,
            },
          },
        })
      }
    >
      {currentStatus ? 'Deactivate' : 'Activate'}
    </button>
  );
}
```

---

## Impact Queries

### 19. getMaterialImpacts

Get environmental impact data for all materials.

**GraphQL Query:**

```graphql
query GetMaterialImpacts {
  getMaterialImpacts {
    id
    materialType
    estimatedCo2SavingsKG
    estimatedWaterSavingsLT
  }
}
```

**React Hook Example:**

```typescript
const GET_MATERIAL_IMPACTS = gql`
  query GetMaterialImpacts {
    getMaterialImpacts {
      id
      materialType
      estimatedCo2SavingsKG
      estimatedWaterSavingsLT
    }
  }
`;

function MaterialImpactList() {
  const { data, loading } = useQuery(GET_MATERIAL_IMPACTS);

  if (loading) return <div>Loading...</div>;

  return (
    <table>
      <thead>
        <tr>
          <th>Material</th>
          <th>CO2 Savings (kg)</th>
          <th>Water Savings (L)</th>
        </tr>
      </thead>
      <tbody>
        {data.getMaterialImpacts.map((material) => (
          <tr key={material.id}>
            <td>{material.materialType}</td>
            <td>{material.estimatedCo2SavingsKG}</td>
            <td>{material.estimatedWaterSavingsLT}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 20. getCo2ImpactMessages

Get CO2 impact messages for different impact ranges.

**GraphQL Query:**

```graphql
query GetCo2ImpactMessages {
  getCo2ImpactMessages {
    id
    min
    max
    message
  }
}
```

### 21. getWaterImpactMessages

Get water impact messages for different impact ranges.

**GraphQL Query:**

```graphql
query GetWaterImpactMessages {
  getWaterImpactMessages {
    id
    min
    max
    message
  }
}
```

### 22. calculateProductImpact

Calculate environmental impact for a specific product category.

**Arguments:**

- `productCategoryId` (required): Product Category ID

**GraphQL Query:**

```graphql
query CalculateProductImpact($productCategoryId: ID!) {
  calculateProductImpact(productCategoryId: $productCategoryId) {
    totalCo2SavingsKG
    totalWaterSavingsLT
    materialBreakdown {
      materialType
      percentage
      weightKG
      co2SavingsKG
      waterSavingsLT
    }
  }
}
```

**React Hook Example:**

```typescript
const CALCULATE_IMPACT = gql`
  query CalculateProductImpact($productCategoryId: ID!) {
    calculateProductImpact(productCategoryId: $productCategoryId) {
      totalCo2SavingsKG
      totalWaterSavingsLT
      materialBreakdown {
        materialType
        percentage
        co2SavingsKG
        waterSavingsLT
      }
    }
  }
`;

function EnvironmentalImpactDisplay({ categoryId }) {
  const { data, loading } = useQuery(CALCULATE_IMPACT, {
    variables: { productCategoryId: categoryId },
  });

  if (loading) return <div>Calculating impact...</div>;

  return (
    <div className="impact-card">
      <h3>Environmental Impact</h3>
      <div>
        <p>🌍 CO2 Saved: {data.calculateProductImpact.totalCo2SavingsKG} kg</p>
        <p>💧 Water Saved: {data.calculateProductImpact.totalWaterSavingsLT} L</p>
      </div>
      <h4>Material Breakdown:</h4>
      {data.calculateProductImpact.materialBreakdown.map((material) => (
        <div key={material.materialType}>
          <strong>{material.materialType}</strong> - {material.percentage}%
          <p>CO2: {material.co2SavingsKG} kg | Water: {material.waterSavingsLT} L</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Error Handling

### Custom Error Handling

```typescript
import { ApolloError } from '@apollo/client';

function MyComponent() {
  const { data, loading, error } = useQuery(SOME_QUERY);

  if (error) {
    // GraphQL errors
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(({ message, extensions }) => {
        console.error(
          `GraphQL error: ${message}`,
          `Code: ${extensions?.code}`
        );
      });
    }

    // Network errors
    if (error.networkError) {
      console.error('Network error:', error.networkError);
    }

    return <div>Error: {error.message}</div>;
  }

  // Rest of component
}
```

### Global Error Handler

```typescript
// lib/apollo-client.ts
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
      );

      // Handle specific error codes
      if (extensions?.code === 'NOT_FOUND') {
        // Handle not found errors
      } else if (extensions?.code === 'INTERNAL_SERVER_ERROR') {
        // Handle server errors
      }
    });
  }

  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

export const apolloClient = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
```

### Retry Logic

```typescript
import { RetryLink } from '@apollo/client/link/retry';

const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 3000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error) => !!error,
  },
});
```

---

## Additional Examples

### Infinite Scroll with Pagination

```typescript
function InfiniteProductList() {
  const [page, setPage] = useState(1);
  const { data, loading, fetchMore } = useQuery(GET_PRODUCTS, {
    variables: { page: 1, pageSize: 20 },
  });

  const loadMore = () => {
    fetchMore({
      variables: { page: page + 1 },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;
        return {
          getProducts: {
            ...fetchMoreResult.getProducts,
            edges: [
              ...prev.getProducts.edges,
              ...fetchMoreResult.getProducts.edges,
            ],
          },
        };
      },
    });
    setPage(page + 1);
  };

  return (
    <div>
      {data?.getProducts.edges.map(({ node }) => (
        <ProductCard key={node.id} product={node} />
      ))}
      {data?.getProducts.pageInfo.hasNextPage && (
        <button onClick={loadMore}>Load More</button>
      )}
    </div>
  );
}
```

### Optimistic Updates

```typescript
const [updateProduct] = useMutation(UPDATE_PRODUCT, {
  optimisticResponse: {
    updateProduct: {
      __typename: 'Product',
      id: productId,
      price: newPrice,
      updatedAt: new Date().toISOString(),
    },
  },
  update: (cache, { data }) => {
    cache.modify({
      id: cache.identify(data.updateProduct),
      fields: {
        price() {
          return data.updateProduct.price;
        },
      },
    });
  },
});
```

### Polling for Real-time Updates

```typescript
const { data, startPolling, stopPolling } = useQuery(GET_PRODUCTS, {
  pollInterval: 5000, // Poll every 5 seconds
});

// Or control manually
useEffect(() => {
  startPolling(5000);
  return () => stopPolling();
}, [startPolling, stopPolling]);
```

---

## Enums Reference

### ProductCondition

- `NEW`
- `LIKE_NEW`
- `GOOD`
- `FAIR`
- `POOR`

### ProductSortField

- `CREATED_AT`
- `UPDATED_AT`
- `PRICE`
- `NAME`

### SortOrder

- `ASC`
- `DESC`

### Badge

Check your enum definitions for available badge types.

---

## Best Practices

1. **Use fragments** for reusable field selections:

```graphql
fragment ProductFields on Product {
  id
  name
  brand
  price
  images
}

query GetProducts {
  getProducts {
    edges {
      node {
        ...ProductFields
      }
    }
  }
}
```

2. **Implement pagination** for large lists
3. **Use variables** instead of string interpolation
4. **Cache management** for better performance
5. **Error boundaries** for graceful error handling
6. **Loading states** for better UX
7. **Debounce** search inputs

---

For more information or issues, please refer to the main documentation or contact the development team.
