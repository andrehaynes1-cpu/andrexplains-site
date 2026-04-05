exports.handler = async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xxjeekwjatqwousgfrcr.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_xrZPvhOJmmcbSlktvIXY2g_OV2WwDDS';
  const now = new Date().toUTCString();

  let items = '';
  try {
    const res = await fetch(
      SUPABASE_URL + '/rest/v1/posts?select=seo_title,meta_description,slug,category,created_at&order=created_at.desc&limit=50',
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY } }
    );
    if (res.ok) {
      const posts = await res.json();
      for (var i = 0; i < posts.length; i++) {
        var p = posts[i];
        var title = (p.seo_title || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var desc = (p.meta_description || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var link = 'https://andreexplains.com/posts/' + p.slug;
        var date = p.created_at ? new Date(p.created_at).toUTCString() : now;
        var cat = (p.category || 'Growth').replace(/&/g, '&amp;');
        items += '\n    <item>\n      <title>' + title + '</title>\n      <link>' + link + '</link>\n      <guid>' + link + '</guid>\n      <pubDate>' + date + '</pubDate>\n      <description>' + desc + '</description>\n      <category>' + cat + '</category>\n    </item>';
      }
    }
  } catch (e) {
    // Return feed with no items if Supabase fails
  }

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n    <title>Andre Explains — YouTube Tips for New Creators</title>\n    <link>https://andreexplains.com</link>\n    <description>Real talk for new YouTube creators. No gurus. Just facts. Learn how to grow your channel, beat the algorithm, and build an audience from scratch.</description>\n    <language>en-us</language>\n    <lastBuildDate>' + now + '</lastBuildDate>\n    <atom:link href="https://andreexplains.com/feed.xml" rel="self" type="application/rss+xml"/>' + items + '\n  </channel>\n</rss>';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/rss+xml', 'Cache-Control': 'public, max-age=3600' },
    body: xml
  };
};
