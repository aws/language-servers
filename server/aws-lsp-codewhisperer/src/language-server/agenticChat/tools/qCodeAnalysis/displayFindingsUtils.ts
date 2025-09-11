import { Features } from '@aws/language-server-runtimes/server-interface/server'
import { DISPLAY_FINDINGS_METRICS_PARENT_NAME } from './displayFindingsConstants'
import { DisplayFindingsMetric } from './displayFindingsTypes'
/**
 * Utility functions for DisplayFindings
 */
export class DisplayFindingsUtils {
    /**
     * Emit a telemetry metric with standard formatting
     * @param metricSuffix Suffix for the metric name
     * @param metricData Additional metric data
     * @param toolName Tool name for the metric prefix
     * @param logging Logging interface
     * @param telemetry Telemetry interface
     * @param credentialStartUrl Optional credential start URL
     */
    public static emitMetric(
        metric: DisplayFindingsMetric,
        logging: Features['logging'],
        telemetry: Features['telemetry']
    ): void {
        const { metadata, ...metricDetails } = metric
        const metricPayload = {
            name: DISPLAY_FINDINGS_METRICS_PARENT_NAME,
            data: {
                // metadata is optional attribute
                ...(metadata || {}),
                ...metricDetails,
            },
        }
        logging.info(`Emitting telemetry metric: ${metric.reason} with data: ${JSON.stringify(metricPayload.data)}`)
        telemetry.emitMetric(metricPayload)
    }
}
