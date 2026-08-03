import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Pin the workspace root; unrelated lockfiles above this directory otherwise
  // make Next infer the wrong one.
  turbopack: { root: __dirname },
};

export default nextConfig;
