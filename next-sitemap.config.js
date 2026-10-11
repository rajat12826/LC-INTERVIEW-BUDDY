/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lc-interview-buddy.vercel.app',
  generateRobotsTxt: true, // (optional) Generates a robots.txt too
  // You can add more options here, like `exclude` or `transform` for dynamic routes
};