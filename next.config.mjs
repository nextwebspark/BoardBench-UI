/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/.playwright-mcp/**',
          '**/screen-short/**',
          '**/.next/**',
          '**/node_modules/**',
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
