/** @type {import('next').NextConfig} */
const nextConfig = {

  // REMOVE output: 'export' completely
  // We DEFAULT to Node server mode (required for your app)

  experimental: {
    missingSuspenseWithCSRBailout: false,
  },

  images: {
    unoptimized: true,
  },

  // Force all app routes to be dynamic so build will NEVER try static export
  dynamic: 'force-dynamic',
};

module.exports = nextConfig;
