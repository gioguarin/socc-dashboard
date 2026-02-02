/** Server configuration with environment variable validation */

interface ServerConfig {
  port: number;
  nodeEnv: string;
  allowedOrigins: string[];
  refreshIntervalMs: number;
  authEnabled: boolean;
}

function validateEnv(): ServerConfig {
  const port = parseInt(process.env.PORT || '3141', 10);
  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '*').split(',').map((o) => o.trim());
  const refreshIntervalMs = parseInt(process.env.REFRESH_INTERVAL_MS || '300000', 10);
  const authEnabled = process.env.SOCC_AUTH_ENABLED === 'true';

  // Validate port range
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('❌ Invalid PORT: must be between 1 and 65535');
    process.exit(1);
  }

  // Validate refresh interval (minimum 5 minutes per hard rules)
  if (isNaN(refreshIntervalMs) || refreshIntervalMs < 300000) {
    console.error('❌ Invalid REFRESH_INTERVAL_MS: must be at least 300000 (5 minutes)');
    process.exit(1);
  }

  // Validate NODE_ENV
  const validEnvs = ['development', 'production', 'test'];
  if (!validEnvs.includes(nodeEnv)) {
    console.error(`❌ Invalid NODE_ENV: must be one of ${validEnvs.join(', ')}`);
    process.exit(1);
  }

  // Validate auth config — if auth is enabled, credentials must be set
  if (authEnabled) {
    if (!process.env.SOCC_ADMIN_USER || !process.env.SOCC_ADMIN_PASS) {
      console.error('❌ SOCC_ADMIN_USER and SOCC_ADMIN_PASS must be set when SOCC_AUTH_ENABLED=true');
      process.exit(1);
    }
    console.log('🔐 Authentication enabled');
  }

  console.log('✅ Environment validated');
  console.log(`   PORT=${port} | NODE_ENV=${nodeEnv} | REFRESH=${refreshIntervalMs}ms | AUTH=${authEnabled ? 'ON' : 'OFF'}`);

  return { port, nodeEnv, allowedOrigins, refreshIntervalMs, authEnabled };
}

export const config = validateEnv();
