/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  experimental: {
    serverActions: true,
    // Enable package imports optimization for better tree-shaking
    optimizePackageImports: ['recharts', 'lodash'],
  },
  // Combine all image configurations
  images: {
    domains: ['avatars.githubusercontent.com', 'res.cloudinary.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  webpack: (config: any, { isServer }: { isServer: boolean }) => {
    if (!isServer) {
      // Optimize Recharts by using ES6 modules for better tree-shaking
      config.resolve.alias = {
        ...config.resolve.alias,
        'recharts': 'recharts/es6',
      };

      // Split chunks more efficiently
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Separate recharts into its own chunk
            recharts: {
              name: 'recharts',
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate other chart libraries if you use them
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](d3|lodash)[\\/]/,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };

      // Enable tree shaking for recharts
      config.module.rules.push({
        test: /[\\/]node_modules[\\/]recharts[\\/]/,
        sideEffects: false,
      });
    }

    return config;
  },

  // Enable compression
  compress: true,
  
  // Enable SWC minification for better performance
  swcMinify: true,
};

module.exports = withBundleAnalyzer(nextConfig);