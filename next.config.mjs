/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  // pdf-parse ships a test file that breaks bundling — alias it out on the server.
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({ canvas: "commonjs canvas" });
    }
    return config;
  },
};
export default nextConfig;
