exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: cors(), body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'API key not configured' }) };

  let topic;
  try {
    topic = JSON.parse(event.body).topic?.trim();
    if (!topic) throw new Error('No topic provided');
  } catch(e) {
    return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid request' }) };
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: 'Write a blog post for AndreExplains.com. Topic: "' + topic + '".\n\nWrite as Andre — casual, real, contractions, no AI phrases like "dive in" or "landscape".\nSEO: keyword in title, first paragraph, one H2, last paragraph. Include 2026 in title.\nMention free toolkit https://andines.pythonanywhere.com/ once.\nMention YouTube Academy https://youtube-mastery-academy.netlify.app/ once.\n\nUse this EXACT format with XML tags (no JSON):\n\n<seoTitle>Title under 60 chars with keyword and 2026</seoTitle>\n<metaDescription>Under 155 chars with keyword</metaDescription>\n<primaryKeyword>exact google search phrase</primaryKeyword>\n<category>Growth</category>\n<readTime>6</readTime>\n<slug>3-to-5-word-slug</slug>\n<content>\n<p>Intro paragraph with keyword in first sentence.</p>\n<p>Second intro paragraph.</p>\n<h2>First H2 With Related Keyword</h2>\n<p>Paragraph...</p>\n<p>Paragraph...</p>\n<h2>Second H2 Different Angle</h2>\n<p>Paragraph...</p>\n<p>Paragraph...</p>\n<h2>Third H2 Actionable</h2>\n<p>Paragraph...</p>\n<p>Paragraph with keyword again.</p>\n<div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>Point 1</li><li>Point 2</li><li>Point 3</li></ul></div>\n<h2>Frequently Asked Questions</h2>\n<div class="faq-item"><h3 class="faq-question">Real Google PAA question?</h3><p class="faq-answer">Answer.</p></div>\n<div class="faq-item"><h3 class="faq-question">Second question?</h3><p class="faq-answer">Answer.</p></div>\n</content>'
        }]
      })
    });

    const apiData = await res.json();
    if (!res.ok) throw new Error('Claude API error: ' + (apiData.error?.message || res.status));

    const rawText = apiData.content?.map(c => c.text || '').join('') || '';

    // Parse XML-style tags
    function getTag(text, tag) {
      const match = text.match(new RegExp('<' + tag + '>([\\s\\S]*?)</' + tag + '>'));
      return match ? match[1].trim() : '';
    }

    const seoTitle = getTag(rawText, 'seoTitle') || topic;
    const metaDescription = getTag(rawText, 'metaDescription') || '';
    const primaryKeyword = getTag(rawText, 'primaryKeyword') || topic;
    const category = getTag(rawText, 'category') || 'Growth';
    const readTime = parseInt(getTag(rawText, 'readTime')) || 6;
    const slugRaw = getTag(rawText, 'slug') || seoTitle;
    const htmlContent = getTag(rawText, 'content') || '';

    if (!htmlContent || htmlContent.length < 100) {
      throw new Error('Generated content too short or empty');
    }

    // Build hero SVG
    const mainWord = seoTitle.split(' ').slice(0, 3).join(' ').toUpperCase();
    const heroHTML = '<figure class="post-image post-image-hero"><div class="svg-wrapper"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 480" width="1200" height="480"><rect width="1200" height="480" fill="#080808"/><rect x="0" y="440" width="1200" height="8" fill="#e8ff00"/><rect x="0" y="0" width="8" height="480" fill="#e8ff00"/><text x="600" y="220" font-family="Arial Black,sans-serif" font-size="72" font-weight="900" fill="#ffffff" text-anchor="middle">' + mainWord + '</text><text x="600" y="310" font-family="Arial,sans-serif" font-size="28" fill="#e8ff00" text-anchor="middle">' + (primaryKeyword || topic) + '</text><text x="600" y="400" font-family="Arial,sans-serif" font-size="18" fill="#888888" text-anchor="middle">andreexplains.com</text></svg></div><figcaption>' + seoTitle + '</figcaption></figure>';

    const fullHTML = heroHTML + htmlContent;

    const slug = slugRaw
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().substring(0, 80);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        success: true,
        post: {
          seo_title: seoTitle,
          meta_description: metaDescription,
          category: category,
          read_time: readTime,
          html_content: fullHTML,
          topic,
          slug,
          primary_keyword: primaryKeyword,
          date_label: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
      })
    };

  } catch(e) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: e.message || 'Unknown error' }) };
  }
};

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };
}
