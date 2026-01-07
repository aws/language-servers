# ATX Transform Server Integration Tests

Integration tests for the ATX .NET Transform Language Server.

## Prerequisites

- Node.js 18+
- Built LSP binary (`aws-lsp-codewhisperer-token-binary.js`)
- Valid SSO token with ATX access

## Environment Variables

| Variable | Description |
|----------|-------------|
| `TEST_SSO_TOKEN` | SSO access token |
| `TEST_RUNTIME_FILE` | Path to LSP binary |
| `TEST_SSO_START_URL` | SSO start URL (e.g., `https://d-90663aa166.awsapps.com/start`) |

## Setup

```bash
# Install dependencies
npm install

# Clone test fixture
mkdir -p out/tests/testFixture
git clone https://github.com/aws-samples/bobs-used-bookstore-classic.git out/tests/testFixture/bobs-used-bookstore-classic
```

## Run Tests

```bash
npm run test-integ
```

## Tests

| Test | Command | Description |
|------|---------|-------------|
| TEST 1 | ListOrCreateWorkspace | Creates/retrieves ATX workspace |
| TEST 2 | StartTransform | Starts transform job |
| TEST 3 | GetTransform | Polls until AWAITING_HUMAN_INPUT |
| TEST 4 | UploadPlan | Uploads plan and polls until complete |
| TEST 5 | StopJob | Starts and stops a transform job |

## Timeouts

- TEST 3: 1 hour (reaching AWAITING_HUMAN_INPUT)
- TEST 4: 3 hours (full transform completion)
- TEST 5: 1 minute

## Notes

- Tests 2, 3, 4 share a single transform job
- Test 5 creates a separate job for stop validation
- Only `Bookstore.Web` project is transformed (not full solution)
