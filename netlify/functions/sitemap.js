// v3 - updated 2026-03-08
exports.handler = async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xxjeekwjatqwousgfrcr.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_xrZPvhOJmmcbSlktvIXY2g_OV2WwDDS';
  const now = new Date().toISOString().split('T')[0];

  // Fetch posts
  let posts = [];
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/posts?select=slug,created_at&order=created_at.desc',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    if (res.ok) { posts = await res.json(); }
  } catch (e) { /* continue with empty posts */ }

  // Determine homepage lastmod
  const homeDate = (posts.length > 0 && posts[0].created_at)
    ? posts[0].created_at.split('T')[0]
    : now;

  // Build complete XML in one shot
  const urls = [
    '  <url>\n    <loc>https://andreexplains.com</loc>\n    <lastmod>' + homeDate + '</lastmod>\n    <priority>1.0</priority>\n    <changefreq>daily</changefreq>\n  </url>'
  ];

  for (let i = 0; i < posts.length; i++) {
    const p = posts[i];
    const d = p.created_at ? p.created_at.split('T')[0] : now;
    urls.push('  <url>\n    <loc>https://andreexplains.com/posts/' + p.slug + '</loc>\n    <lastmod>' + d + '</lastmod>\n    <priority>0.8</priority>\n    <changefreq>monthly</changefreq>\n  </url>');
  }

  const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join('\n') + '\n</urlset>';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'no-cache' },
    body: body
  };
};
