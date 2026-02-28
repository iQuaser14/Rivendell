/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@rivendell/core', '@rivendell/supabase'],
  webpack: (config) => {
    // Handle ESM .js extension imports resolving to .ts source files
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;
