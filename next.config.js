/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // build autocontenuta per VPS/PC (docker o node .next/standalone)
  env: {
    APP_NAME: process.env.APP_NAME || 'Preventivi Smart'
  }
};
module.exports = nextConfig;
