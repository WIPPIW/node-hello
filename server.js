const http = require('http');
const fs = require('fs');
const path = require('path');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { ConsoleSpanExporter, SimpleSpanProcessor } = require('@opentelemetry/tracing');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');

const { CollectorTraceExporter } = require('@opentelemetry/exporter-collector-grpc');

const express = require('express');
const app = express();

const port = process.env.PORT || 3000;

// Create a tracer provider
const provider = new NodeTracerProvider();

// Create a console span exporter (for debugging purposes)
const consoleExporter = new ConsoleSpanExporter();

// Create a collector trace exporter (OTLP gRPC)
const collectorExporter = new CollectorTraceExporter({
  serviceName: 'hello-world',
  // Change this to your Splunk APM endpoint
  url: 'http://localhost:4317', 
});

// Configure span processor with the exporters
provider.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));
provider.addSpanProcessor(new SimpleSpanProcessor(collectorExporter));

// Register the tracer provider
provider.register();

// Enable instrumentations
registerInstrumentations({
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
  ],
});

app.get('/', (req, res) => {
  const filePath = path.join(__dirname, 'index.html');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Internal Server Error');
      return;
    }

    res.status(200).send(data);
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
