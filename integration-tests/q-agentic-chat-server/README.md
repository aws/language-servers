# Q Agentic Chat Server Integration Tests

Integration tests for the AWS Q Agentic Chat Language Server.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set required environment variables:
   ```bash
   export TEST_SSO_TOKEN="your-sso-token"
   export TEST_SSO_START_URL="your-sso-start-url"
   export TEST_PROFILE_ARN="your-profile-arn"
   export TEST_RUNTIME_FILE="/path/to/aws-lsp-codewhisperer.js"
   ```

3. Optional - Enable debug output:
   ```bash
   export DEBUG = true
   ```

## Running Tests

```bash
npm test
```

## Test Structure

- `src/tests/agenticChatInteg.test.ts` - Main integration test suite
- `src/tests/testUtils.ts` - Utility functions for test setup
- `src/tests/testFixture/` - Test fixture files (excluded from compilation)
