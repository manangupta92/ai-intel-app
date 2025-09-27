/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
  webpack: (config) => {
    // Ignore all .d.ts files in node_modules to prevent SWC build errors on Linux
    config.module.rules.push({
      test: /\.d\.ts$/,
      loader: 'ignore-loader',
    });
    return config;
  },
};

export default nextConfig;
