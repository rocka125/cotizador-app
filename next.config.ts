/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // Mantén true solo si hay errores temporales
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig