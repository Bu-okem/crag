# Crag - API Client Generator

A CLI tool that generates TypeScript API clients and React Query hooks from OpenAPI specifications or Postman collections.

## Features

- Generate TypeScript clients from OpenAPI specs or Postman collections
- Create React Query hooks for all API endpoints
- Type-safe API calls with TypeScript support
- Simple configuration and easy setup

## Installation

```bash
# Using npm
npm install -g crag

# Using yarn
yarn global add crag

# Using pnpm
pnpm add -g crag
```

## Usage

### Basic Usage

```bash
# Generate from an OpenAPI spec
crag generate api --path ./api-spec.yaml

# Generate from a Postman collection
crag generate api --path ./collection.json

# Specify output directory
crag generate api --path ./api-spec.yaml --destination ./src/api
```

### Options

- `--path`: Path to the API specification file (required)
- `--destination`: Output directory (default: current directory)
- `--client-only`: Generate only the TypeScript client
- `--hooks-only`: Generate only React Query hooks

## Development

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Build the project:
   ```bash
   pnpm build
   ```
4. Run in development mode:
   ```bash
   pnpm dev
   ```

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Configuration

Create a `crag.config.ts` file:

```typescript
export default {
  input: [
    { path: './api-spec.json', type: 'postman' }
  ],
  output: './src/api'
}
```

## Using the hooks

#### 1. Query Options (for GET endpoints)

These are used with ```useQuery```:

```javascript
// Example: Get learners

export const getAccessGetLearnersOptions = (options?: Options<GetAccessGetLearnersData>) => {
  return queryOptions({
    queryFn: async ({ queryKey, signal }) => {
      const { data } = await getAccessGetLearners({
        ...options,
        ...queryKey[0],
        signal,
        throwOnError: true
      });
      return data;
    },
    queryKey: getAccessGetLearnersQueryKey(options)
  });
};
```

#### 2. Mutation Options (for POST/PATCH/DELETE endpoints)

These are used with ```useMutation```:

```typescript
// Example: Create user mutation

export const postAccessRegisterLearnerMutation = (options?: Partial<Options<PostAccessRegisterLearnerData>>): UseMutationOptions<...> => {
  const mutationOptions: UseMutationOptions<...> = {
    mutationFn: async (localOptions) => {
      const { data } = await postAccessRegisterLearner({
        ...options,
        ...localOptions,
        throwOnError: true
      });
      return data;
    }
  };
  return mutationOptions;
};
```

#### 3. Infinite Query Options (for paginated data)

```typescript
export const getSearchPhotosInfiniteOptions = (options?: Options<GetSearchPhotosData>) => {
  return infiniteQueryOptions<...>({
    queryFn: async ({ pageParam, queryKey, signal }) => {
      // Handle pagination
    },
    queryKey: getSearchPhotosInfiniteQueryKey(options)
  });
};
```

### How to Use These in React Components:

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  getAccessGetLearnersOptions, 
  postAccessRegisterLearnerMutation 
} from './react-query.gen';

function LearnersComponent() {
  // Query hook - automatically fetches data
  const { data: learners, isLoading, error } = useQuery(
    getAccessGetLearnersOptions()
  );

  // Mutation hook - for creating/updating
  const registerLearnerMutation = useMutation(
    postAccessRegisterLearnerMutation()
  );

  const handleRegister = (learnerData: any) => {
    registerLearnerMutation.mutate({
      body: learnerData
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {/* Your component JSX */}
      <button onClick={() => handleRegister({ name: 'John', email: 'john@example.com' })}>
        Register Learner
      </button>
    </div>
  );
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run in dev mode
pnpm dev
```

## License

ISC