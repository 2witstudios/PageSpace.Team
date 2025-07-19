import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@pagespace/db", "@pagespace/lib", "@pagespace/richline-editor"],
  experimental: {
    esmExternals: "loose",
  },
  webpack: (config, { isServer }) => {
    // Add WASM support
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Add .wasm to resolve extensions
    config.resolve.extensions.push('.wasm');
    
    if (!isServer) {
      // Don't bundle server-only packages in client build
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        dns: false,
        net: false,
        tls: false,
        'pg-native': false,
      };
    }
    return config;
  },
};

export default nextConfig;
