/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    env: {
        API_URL: process.env.API_URL,
        VOICE_URL: process.env.VOICE_URL,
    }
};

export default nextConfig;
