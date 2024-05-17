// Environment loading
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
// Load .env file first
dotenv.config({ path: path.join(__dirname, '.env') });
// Load environment-specific .env file
const envFilePath = path.join(__dirname, `.env.${process.env.NODE_ENV || 'development'}`);
if (fs.existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
}
const environment = process.env.NODE_ENV || 'development';
const resourceAttributes = `service.name=${process.env.OTEL_EXPORTER_SERVICE_NAME},service.version=${process.env.OTEL_EXPORTER_SERVICE_VERSION},deployment.environment=${environment}`;
process.env.OTEL_RESOURCE_ATTRIBUTES = resourceAttributes;

// Require dependencies
const opentelemetry = require('@opentelemetry/sdk-node');
const {
  getNodeAutoInstrumentations,
} = require('@opentelemetry/auto-instrumentations-node');
const {
  OTLPTraceExporter,
} = require('@opentelemetry/exporter-trace-otlp-proto');
const {
  OTLPMetricExporter,
} = require('@opentelemetry/exporter-metrics-otlp-proto');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Configure the OpenTelemetry SDK
const sdk = new opentelemetry.NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: `${process.env.OTEL_EXPORTER_ENDPOINT}/v1/traces`,
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${process.env.OTEL_EXPORTER_ENDPOINT}/v1/metrics`,
      headers: {},
      concurrencyLimit: 1,
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start the SDK
sdk.start();

// Handle unhandled promise rejections and uncaught exceptions to capture errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Capture the error using OpenTelemetry
  sdk.tracerProvider.getTracer('default').startSpan('unhandled-rejection', {
    attributes: { 'error.message': reason.message, 'error.stack': reason.stack },
  }).end();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Capture the error using OpenTelemetry
  sdk.tracerProvider.getTracer('default').startSpan('uncaught-exception', {
    attributes: { 'error.message': error.message, 'error.stack': error.stack },
  }).end();
  process.exit(1); // Exit the process after handling the error
});
