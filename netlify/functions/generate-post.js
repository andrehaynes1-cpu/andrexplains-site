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
    // ─── STEP 1: Web search for real facts ───────────────────
    let researchContext = '';
    try {
      const searchRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': CLAUDE_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `Search for current, factual information about this YouTube creator topic: "${topic}"

Find: key facts, real statistics with year, expert tips, common mistakes creators make. Keep under 500 words. Dense facts only, include source names.`
          }]
        })
      });
      const searchData = await searchRes.json();
      if (searchRes.ok && searchData.content) {
        researchContext = searchData.content
          .filter(b => b.type === 'text' && b.text)
          .map(b => b.text)
          .join('\n')
          .substring(0, 3000);
      }
    } catch(e) {
      // Research failed silently — continue without it
    }

    const researchBlock = researchContext
      ? `\n\nREAL FACTS FROM WEB RESEARCH (use these in the post — do NOT invent statistics or fake steps):\n${researchContext}\n`
      : '';

    // ─── STEP 2: Generate the blog post ───────────────────
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are Andre from AndreExplains.com. You write for new YouTube creators (0-100 subs). Honest, real, no guru energy.

Topic: "${topic}"
${researchBlock}
WRITING STYLE — CRITICAL (this must read like a real person wrote it):
- Use contractions naturally (I'm, don't, won't, here's, that's, it's, you'll, can't).
- Vary sentence length. Mix 4-word punchy sentences with longer 20-word ones.
- Start some sentences with "And", "But", "So", or "Look,".
- Use fragments occasionally. Like this.
- Include personal experience: "I made this mistake on my third video" or "Took me months to figure this out."
- Use casual words: "messed up", "figured out", "the thing is", "honestly", "turns out", "straight up".
- BANNED phrases (never use): "in this article", "it's important to note", "let's dive in", "in today's digital landscape", "comprehensive guide", "leverage", "utilize", "it's worth noting", "in conclusion", "navigate", "delve", "tapestry", "landscape", "realm", "robust", "game-changer", "unlock", "master", "journey", "when it comes to".
- End some paragraphs abruptly with a short punchy line. Not every paragraph needs a clean wrap-up.
- Throw in occasional self-deprecating humor.

SEO RULES:
- Primary keyword in: seoTitle (near front), first paragraph, one H2, last paragraph.
- Each H2 should target a related long-tail search phrase.
- Use primary keyword 3-5 times total, always natural.
- Meta description: primary keyword + reason to click, under 155 chars.
- FAQ questions should be real "People Also Ask" questions for this topic.
- 5 sections minimum, each with 3-4 real paragraphs.

Respond with ONLY valid JSON. No markdown. No backticks.

{
  "seoTitle": "Under 60 chars, keyword near front",
  "metaDescription": "Under 155 chars, keyword + click reason",
  "primaryKeyword": "exact Google search phrase",
  "category": "Growth or Analytics or Strategy or Monetization or Shorts",
  "readTime": 8,
  "slug": "3-to-6-word-slug",
  "heroSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 480' width='1200' height='480'><rect width='1200' height='480' fill='#080808'/><rect x='0' y='440' width='1200' height='8' fill='#e8ff00'/><rect x='0' y='0' width='8' height='480' fill='#e8ff00'/><text x='600' y='200' font-family='Arial Black,sans-serif' font-size='90' font-weight='900' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>TOPIC</text><text x='600' y='310' font-family='Arial,sans-serif' font-size='32' fill='#e8ff00' text-anchor='middle'>PHRASE</text><text x='600' y='390' font-family='Arial,sans-serif' font-size='20' fill='#888888' text-anchor='middle'>andreexplains.com</text></svg>",
  "midSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 400' width='900' height='400'><rect width='900' height='400' fill='#0f0f0f'/><rect x='0' y='360' width='900' height='6' fill='#00d4ff'/><text x='450' y='180' font-family='Arial Black,sans-serif' font-size='72' font-weight='900' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>STAT</text><text x='450' y='270' font-family='Arial,sans-serif' font-size='26' fill='#00d4ff' text-anchor='middle'>context</text></svg>",
  "intro": "Two paragraphs. First sentence has primary keyword. Personal, real tone.",
  "sections": [
    {"heading": "H2 with long-tail keyword", "content": "3-4 paragraphs real advice with examples"},
    {"heading": "H2 related keyword", "content": "3-4 paragraphs"},
    {"heading": "H2 another angle", "content": "3-4 paragraphs"},
    {"heading": "H2 actionable keyword", "content": "3-4 paragraphs"},
    {"heading": "H2 wrap-up", "content": "2-3 paragraphs with primary keyword"}
  ],
  "keyTakeaways": ["Specific point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "faq": [
    {"q": "Real People Also Ask question", "a": "2-3 sentence honest answer"},
    {"q": "Second real question", "a": "2-3 sentences"},
    {"q": "Third real question", "a": "2-3 sentences"}
  ]
}

heroSvg and midSvg must have topic-relevant text. No placeholders.`
        }]
      })
    });

    const apiData = await res.json();
    if (!res.ok) throw new Error('Claude API error: ' + (apiData.error?.message || res.status));

    const rawText = apiData.content?.map(c => c.text || '').join('') || '';

    let post;
    try {
      post = JSON.parse(rawText);
    } catch(e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Could not parse response as JSON');
      post = JSON.parse(match[0]);
    }

    if (!post || !post.seoTitle) throw new Error('Invalid post structure returned');

    // Build hero image HTML
    const heroHTML = post.heroSvg
      ? `<figure class="post-image post-image-hero"><div class="svg-wrapper">${post.heroSvg}</div><figcaption>${post.seoTitle}</figcaption></figure>`
      : '';

    // Build mid image HTML
    const midHTML = post.midSvg
      ? `<figure class="post-image post-image-mid"><div class="svg-wrapper">${post.midSvg}</div><figcaption>${post.primaryKeyword || topic}</figcaption></figure>`
      : '';

    // Build HTML content
    let html = heroHTML;
    html += `<p>${(post.intro || '').replace(/\n\n/g, '</p><p>')}</p>`;

    if (post.keyTakeaways?.length) {
      html += `<div class="key-takeaways"><h3>Key Takeaways</h3><ul>`;
      post.keyTakeaways.forEach(t => { html += `<li>${t}</li>`; });
      html += `</ul></div>`;
    }

    const sections = post.sections || [];
    sections.forEach((s, i) => {
      if (s.heading && s.content) {
        if (i === Math.floor(sections.length / 2)) {
          html += midHTML;
        }
        html += `<h2>${s.heading}</h2><p>${s.content.replace(/\n\n/g, '</p><p>')}</p>`;
      }
    });

    if (post.faq?.length) {
      html += `<h2>Frequently Asked Questions</h2>`;
      post.faq.forEach(f => {
        html += `<div class="faq-item"><h3 class="faq-question">${f.q}</h3><p class="faq-answer">${f.a}</p></div>`;
      });
    }

    const slug = (post.slug || post.seoTitle || topic)
      .toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim().substring(0, 80);

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        success: true,
        post: {
          seo_title: post.seoTitle,
          meta_description: post.metaDescription || '',
          category: post.category || 'Growth',
          read_time: post.readTime || 8,
          html_content: html,
          topic,
          slug,
          primary_keyword: post.primaryKeyword || topic,
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
