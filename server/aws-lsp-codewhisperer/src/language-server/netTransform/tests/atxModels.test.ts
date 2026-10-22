import { expect } from 'chai'
import {
    ATX_TEST_RUN_BASE_URL_ENV,
    ATX_TEST_RUN_SCHEMA_VERSION,
    AtxTestRunRequest,
    AtxTestRunSummary,
    isSupportedAtxTestRunSchemaVersion,
} from '../atxModels'

// From a real run on Bob's Used Bookstore (original code), reshaped to contract v0 schema 1.0:
// the artifact id and folder are mock values. Same data as the VS extension's contract tests.
const bobsBookstoreRequestJson = `{
    "schemaVersion": "1.0",
    "runId": "r1",
    "side": "original",
    "project": "Bookstore.Web",
    "round": 1,
    "artifactId": "mock-bobs-bookstore-repo",
    "localFolder": "artifactWorkspace/mock-bobs-bookstore-job/itgen/r1/repo",
    "tests": { "projectPath": "ITGen/Bookstore.IntegrationTests/Bookstore.IntegrationTests.csproj" },
    "app": {
        "webProject": "app/Bookstore.Web/Bookstore.Web.csproj",
        "host": "iisexpress",
        "healthCheckPaths": ["/"],
        "startTimeoutSeconds": 120
    },
    "env": { "AB_SIDE": "pre", "AB_RUN_ID": "r1" },
    "limits": { "projectTimeoutSeconds": 1800, "maxResultZipMB": 20 }
}`

const bobsBookstoreSummaryJson = `{
    "schemaVersion": "1.0",
    "runId": "r1",
    "side": "original",
    "project": "Bookstore.Web",
    "status": "COMPLETED",
    "appUrl": "http://localhost:57150",
    "startedAt": "2026-10-21T08:28:07-07:00",
    "finishedAt": "2026-10-21T08:28:09-07:00",
    "durationSeconds": 2,
    "counts": { "total": 24, "passed": 23, "failed": 1, "pending": 0 },
    "failingTests": [
        {
            "name": "Bookstore.IntegrationTests.ShoppingCartTests.AddItemToShoppingCart_RedirectsToSearch_AndBookAppearsInCart",
            "message": "Assert.Equal() Failure: Values differ. Expected: OK, Actual: InternalServerError (GET /ShoppingCart)"
        }
    ]
}`

describe('atxModels test-run contract', () => {
    describe('isSupportedAtxTestRunSchemaVersion', () => {
        it('accepts the current schema version', () => {
            expect(isSupportedAtxTestRunSchemaVersion(ATX_TEST_RUN_SCHEMA_VERSION)).to.equal(true)
        })

        it('accepts a newer minor version of the same major version', () => {
            expect(isSupportedAtxTestRunSchemaVersion('1.3')).to.equal(true)
        })

        it('rejects a different major version', () => {
            expect(isSupportedAtxTestRunSchemaVersion('2.0')).to.equal(false)
            expect(isSupportedAtxTestRunSchemaVersion('0.9')).to.equal(false)
        })

        it('rejects missing, non-string, and malformed versions', () => {
            for (const version of [undefined, null, 1, 1.0, '', '1', '1.', 'v1.0', '1.0.0', ' 1.0']) {
                expect(isSupportedAtxTestRunSchemaVersion(version), String(version)).to.equal(false)
            }
        })
    })

    describe('AtxTestRunRequest', () => {
        it('parses the Bob’s Bookstore request and round-trips it', () => {
            const request: AtxTestRunRequest = JSON.parse(bobsBookstoreRequestJson)

            expect(isSupportedAtxTestRunSchemaVersion(request.schemaVersion)).to.equal(true)
            expect(request.side).to.equal('original')
            expect(request.artifactId).to.equal('mock-bobs-bookstore-repo')
            expect(request.env?.[ATX_TEST_RUN_BASE_URL_ENV]).to.equal(undefined)
            expect(request.app.healthCheckPaths).to.deep.equal(['/'])
            expect(request.limits.projectTimeoutSeconds).to.equal(1800)
            expect(JSON.parse(JSON.stringify(request))).to.deep.equal(JSON.parse(bobsBookstoreRequestJson))
        })

        it('keeps the repo artifact id on the transformed side', () => {
            const request: AtxTestRunRequest = {
                schemaVersion: ATX_TEST_RUN_SCHEMA_VERSION,
                runId: 'p5',
                side: 'transformed',
                project: 'SampleWebApi.Admin',
                round: 1,
                artifactId: '9d2c41e7-sample-web-api-repo',
                tests: {
                    projectPath: 'GeneratedApiTests.SampleWebApi.Admin/GeneratedApiTests.SampleWebApi.Admin.csproj',
                },
                app: { webProject: 'SampleWebApi.Admin/SampleWebApi.Admin.csproj', host: 'dotnet-run' },
                limits: { projectTimeoutSeconds: 1800, maxResultZipMB: 20 },
            }

            const json = JSON.parse(JSON.stringify(request))

            expect(json.artifactId).to.equal('9d2c41e7-sample-web-api-repo')
            expect(json).to.not.have.property('code')
            expect(json).to.not.have.property('env')
        })
    })

    describe('AtxTestRunSummary', () => {
        it('parses the Bob’s Bookstore summary and round-trips it', () => {
            const summary: AtxTestRunSummary = JSON.parse(bobsBookstoreSummaryJson)

            expect(isSupportedAtxTestRunSchemaVersion(summary.schemaVersion)).to.equal(true)
            expect(summary.status).to.equal('COMPLETED')
            expect(summary.startedAt).to.equal('2026-10-21T08:28:07-07:00')
            expect(summary.counts).to.deep.equal({ total: 24, passed: 23, failed: 1, pending: 0 })
            expect(summary.failingTests).to.have.length(1)
            expect(JSON.parse(JSON.stringify(summary))).to.deep.equal(JSON.parse(bobsBookstoreSummaryJson))
        })
    })
})
