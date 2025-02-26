import config from '@config';

import { nodeProfilingIntegration } from '@sentry/profiling-node';
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: config.sentry.dns,
  environment: config.app.env,
  integrations: [nodeProfilingIntegration()],
  // Tracing
  tracesSampleRate: 1.0, //  Capture 100% of the transactions
});
// Manually call startProfiler and stopProfiler
// to profile the code in between
Sentry.profiler.startProfiler();
