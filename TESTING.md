# Testing

## Overview

This repository uses [Vitest](https://vitest.dev/) for testing. Tests help prevent regressions and document expected behavior.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (auto-reruns on file changes)
npm run test:watch
```

## Writing Tests

Tests should be colocated with the code they test:
- Script tests: `scripts/*.test.mjs`
- Component tests: `src/**/*.test.tsx`
- Utility tests: `src/**/*.test.ts`

Example:
```javascript
import { describe, it, expect } from 'vitest'

describe('myFunction', () => {
  it('returns expected value', () => {
    expect(myFunction(input)).toBe(expectedOutput)
  })
})
```

## Test Coverage

Current coverage focuses on:
- **scripts/stats.mjs** - Ensures stats output is valid JSON with correct schema

Future coverage should include:
- Wallet allowlist validation
- Link checking logic
- Corpus building
- API routes (x402 endpoints)
- UI components

## CI Integration

Tests run automatically on every push and pull request via GitHub Actions. The build will fail if any test fails.

See `.github/workflows/ci.yml` for the full CI pipeline.
