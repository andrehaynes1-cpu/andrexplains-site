const { createClient } = require('@supabase/supabase-js');

exports.handler = async () => {
  const db = createClient(
    process.env.SUPABASE_URL || 'https://xxjeekwjatqwousgfrcr.supabase.co',
    process.env.SUPABASE_KEY || 'sb_publishable_xrZPvhOJmmcbSlktvIXY2g_OV2WwDDS'
  );

  try {
    const { data: posts, error } = await db
      .from('posts')
      .select('slug, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Homepage lastmod = most recent post date or today
    const now = new Date().toISOString().split('T')[0];
    const homepageLastmod = posts?.length
      ? posts[0].created_at.split('T')[0]
      : now;

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://andreexplains.com</loc>
    <lastmod>${homepageLastmod}</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>`;

    if (posts?.length) {
      for (const p of posts) {
        const date = p.created_at ? p.created_at.split('T')[0] : now;
        xml += `
  <url>
    <loc>https://andreexplains.com/posts/${p.slug}</loc>
    <lastmod>${date}</lastmod>
    <priority>0.8</priority>
    <changefreq>monthly</changefreq>
  </url>`;
      }
    }

    xml += `
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
      body: xml,
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://andreexplains.com</loc><priority>1.0</priority><changefreq>daily</changefreq></url></urlset>`,
      headers: { 'Content-Type': 'application/xml' },
    };
  }
};
