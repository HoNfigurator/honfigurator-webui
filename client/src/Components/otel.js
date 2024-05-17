import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { ConsoleSpanExporter, SimpleSpanProcessor, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import {
    SEMRESATTRS_SERVICE_NAME,
    SEMRESATTRS_SERVICE_VERSION,
    SEMRESATTRS_DEPLOYMENT_ENVIRONMENT
} from '@opentelemetry/semantic-conventions';

const environment = process.env.NODE_ENV || 'development';

const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.REACT_APP_APM_SERVICE_NAME || 'my-service',
    [SEMRESATTRS_SERVICE_VERSION]: process.env.REACT_APP_APM_SERVICE_VERSION || '1.0.0',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: environment,
});

export const initializeRUM = () => {
    if (!process.env.REACT_APP_APM_SERVICE_NAME) {
        console.warn("APM service name not set, RUM not initialized.")
        return;
    }
    console.log("Initializing RUM");
    // Create a Web Tracer Provider with resource attributes
    const provider = new WebTracerProvider({
        resource: resource,
    });

    // Set up the exporter
    const exporter = new OTLPTraceExporter({
        url: `${process.env.REACT_APP_APM_ENDPOINT}/v1/traces`, // Replace with your OTEL collector endpoint
    });

    // Add the span processor
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));
    // Optionally add a console span exporter for debugging
    // provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));

    // Register the provider
    provider.register();

    // Register instrumentations
    registerInstrumentations({
        instrumentations: [
            new DocumentLoadInstrumentation(),
            new FetchInstrumentation(),
            new XMLHttpRequestInstrumentation(),
        ],
    });
    console.log("RUM initialized");
};
