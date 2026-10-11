/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lc-interview-buddy.vercel.app',
  generateRobotsTxt: true,
  generateIndexSitemap: false, // Generates a single, direct sitemap.xml (fixes 0 discovered pages in GSC)
};