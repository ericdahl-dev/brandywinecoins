import type { NextConfig } from 'next';
import { withPayload } from '@payloadcms/next/withPayload';

const nextConfig: NextConfig = {
  // Pin the workspace root; unrelated lockfiles above this directory otherwise
  // make Next infer the wrong one. withPayload spreads this config first and
  // re-emits `turbopack`, so the pin survives -- checked against the shipped
  // 3.87.0 source before adopting it. See #41.
  //
  // import.meta.dirname, not __dirname: the package is ESM now, because Payload
  // loads payload.config.ts through an ESM graph and `require` cannot cross it.
  turbopack: { root: import.meta.dirname },
};

export default withPayload(nextConfig);
