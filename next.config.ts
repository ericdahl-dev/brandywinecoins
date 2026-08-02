import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Playwright drives the dev server over 127.0.0.1 rather than localhost.
  allowedDevOrigins: ['127.0.0.1'],
  // Pin the workspace root; unrelated lockfiles above this directory otherwise
  // make Next infer the wrong one.
  turbopack: { root: __dirname },
};

export default nextConfig;
