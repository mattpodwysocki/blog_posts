/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mastra/core', '@modelcontextprotocol/sdk'],
};

module.exports = nextConfig;
