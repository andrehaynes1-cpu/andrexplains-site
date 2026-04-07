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
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: 'Write a blog post for AndreExplains.com. Topic: "' + topic + '".\n\nYou are Andre — casual, real, use contractions, personal stories. BANNED phrases: "dive in", "landscape", "leverage", "utilize", "comprehensive guide", "it\'s important to note", "in conclusion", "game-changer", "unlock", "journey", "at the end of the day", "navigate", "delve", "realm", "robust".\n\nON-PAGE SEO RULES (critical for Google ranking):\n- primaryKeyword = the EXACT phrase someone types into Google in 2026\n- Put primaryKeyword in: seoTitle (near front), first sentence of intro, one H2, last paragraph\n- Use primaryKeyword 4-6 times total, naturally spread across the content\n- Each H2 must target a DIFFERENT related long-tail keyword that people also search\n- Include 2026 in seoTitle\n- seoTitle under 60 chars, keyword near front\n- metaDescription under 155 chars with keyword + compelling reason to click\n- Write 4 H2 sections with 2-3 paragraphs each\n- Include specific numbers, steps, or data points — not vague advice\n- FAQ must use REAL Google "People Also Ask" questions for this topic\n\nPRODUCT LINKS — CRITICAL FORMAT:\n- NEVER write a raw URL in the text. Always use HTML anchor tags with descriptive text.\n- Mention free toolkit once early like this: <a href="https://andines.pythonanywhere.com/" target="_blank">free YouTube Starter Toolkit</a>\n- Mention YouTube Academy once later like this: <a href="https://youtube-mastery-academy.netlify.app/" target="_blank">YouTube Mastery Academy</a>\n- If topic relates to analytics, mention report once like this: <a href="https://youtubereports.pythonanywhere.com/" target="_blank">free YouTube channel report</a>\n- The link text should read naturally in a sentence. Example: "I put together a <a href="https://andines.pythonanywhere.com/" target="_blank">free YouTube Starter Toolkit</a> that covers all of this."\n- NEVER write the URL as visible text. Only use descriptive words as the clickable link.\n\nUse this EXACT XML format (no JSON):\n\n<seoTitle>Keyword Near Front — Under 60 Chars 2026</seoTitle>\n<metaDescription>Under 155 chars with keyword and click reason</metaDescription>\n<primaryKeyword>exact google search phrase 2026</primaryKeyword>\n<category>Growth or Analytics or Strategy or Monetization or Shorts or SEO</category>\n<readTime>7</readTime>\n<slug>3-to-5-word-slug</slug>\n<content>\n<p>First sentence MUST contain primaryKeyword naturally. Then hook the reader with a problem or question.</p>\n<p>Second paragraph — personal experience or relatable situation. Include free toolkit anchor link naturally.</p>\n<h2>H2 With Long-Tail Related Keyword</h2>\n<p>Paragraph with specific advice, numbers, or steps...</p>\n<p>Paragraph with example or personal experience...</p>\n<p>Third paragraph if needed...</p>\n<h2>H2 Different Related Search Term</h2>\n<p>Paragraph...</p>\n<p>Paragraph...</p>\n<h2>H2 Another Angle People Search For</h2>\n<p>Paragraph... Include YouTube Academy anchor link naturally here.</p>\n<p>Paragraph...</p>\n<h2>H2 Actionable Keyword — What To Do Next</h2>\n<p>Paragraph with primaryKeyword again...</p>\n<p>Final paragraph — strong closing with primaryKeyword, call to action.</p>\n<div class="key-takeaways"><h3>Key Takeaways</h3><ul><li>Specific actionable point 1</li><li>Specific point 2</li><li>Specific point 3</li><li>Specific point 4</li></ul></div>\n<h2>Frequently Asked Questions</h2>\n<div class="faq-item"><h3 class="faq-question">Real Google People Also Ask question?</h3><p class="faq-answer">Direct 2-3 sentence answer.</p></div>\n<div class="faq-item"><h3 class="faq-question">Second real PAA question?</h3><p class="faq-answer">Direct answer.</p></div>\n<div class="faq-item"><h3 class="faq-question">Third real PAA question?</h3><p class="faq-answer">Direct answer.</p></div>\n</content>'
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
    const readTime = parseInt(getTag(rawText, 'readTime')) || 7;
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
