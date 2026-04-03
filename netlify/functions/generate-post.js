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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: `You are Andre from AndreExplains.com. You write for new YouTube creators (0-100 subs). Honest, real, no guru energy.

Topic: "${topic}"

WRITING STYLE — CRITICAL (must read like a real person, NOT AI):
- Use contractions (I'm, don't, won't, here's, that's, it's, you'll, can't).
- Vary sentence length. Mix 4-word punchy sentences with longer 20-word ones.
- Start some sentences with "And", "But", "So", or "Look,".
- Use fragments occasionally. Like this.
- Include personal experience: "I made this mistake on my third video" or "Took me months to figure this out."
- Use casual words: "messed up", "figured out", "the thing is", "honestly", "turns out", "straight up".
- BANNED phrases (never use): "in this article", "it's important to note", "let's dive in", "in today's digital landscape", "comprehensive guide", "leverage", "utilize", "it's worth noting", "in conclusion", "navigate", "delve", "tapestry", "landscape", "realm", "robust", "game-changer", "unlock", "master", "journey", "when it comes to", "at the end of the day", "key takeaway is".
- End some paragraphs with a short punchy line.
- Occasional self-deprecating humor.

GOOGLE SEO RULES — CRITICAL (this post MUST rank on Google):
- primaryKeyword must be the EXACT phrase people type into Google for this topic in 2026.
- seoTitle: primary keyword near the front, under 60 chars, must make someone click from Google results.
- metaDescription: primary keyword + compelling reason to click, under 155 chars.
- Primary keyword placement: seoTitle, first sentence of intro, at least one H2 heading, last paragraph.
- Use primary keyword 3-5 times total across the post — always natural, never stuffed.
- Each H2 heading must target a DIFFERENT related long-tail keyword people search on Google.
- FAQ questions must be REAL "People Also Ask" questions from Google for this topic.
- Include the current year (2026) in the seoTitle if it fits naturally.
- Slug must be 3-6 words matching the primary keyword.

CONTENT DEPTH:
- 4 sections minimum, each with 2-3 substantial paragraphs.
- Include specific numbers, real steps, or actionable advice — not vague tips.
- Total word count target: 1200-1800 words.

PRODUCT INTEGRATION (weave these naturally — NOT salesy):
- Mention the FREE YouTube Starter Toolkit (https://andines.pythonanywhere.com/) once in the intro or first section as a helpful resource for beginners.
- Mention the YouTube Mastery Academy (https://youtube-mastery-academy.netlify.app/) once in a later section as the next step for creators who want to go deeper.
- Mention the FREE YouTube Channel Report (https://youtubereports.pythonanywhere.com/) once if the topic relates to analytics or channel performance.
- These should feel like genuine recommendations, not ads. One sentence each, max.

Respond with ONLY valid JSON. No markdown. No backticks.

{
  "seoTitle": "Under 60 chars, primary keyword near front, 2026 if fits",
  "metaDescription": "Under 155 chars, primary keyword + reason to click",
  "primaryKeyword": "exact Google search phrase people type in 2026",
  "category": "Growth or Analytics or Strategy or Monetization or Shorts",
  "readTime": 7,
  "slug": "3-to-6-word-slug-matching-keyword",
  "heroSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 480' width='1200' height='480'><rect width='1200' height='480' fill='#080808'/><rect x='0' y='440' width='1200' height='8' fill='#e8ff00'/><rect x='0' y='0' width='8' height='480' fill='#e8ff00'/><text x='600' y='200' font-family='Arial Black,sans-serif' font-size='90' font-weight='900' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>TOPIC</text><text x='600' y='310' font-family='Arial,sans-serif' font-size='32' fill='#e8ff00' text-anchor='middle'>PHRASE</text><text x='600' y='390' font-family='Arial,sans-serif' font-size='20' fill='#888888' text-anchor='middle'>andreexplains.com</text></svg>",
  "midSvg": "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 900 400' width='900' height='400'><rect width='900' height='400' fill='#0f0f0f'/><rect x='0' y='360' width='900' height='6' fill='#00d4ff'/><text x='450' y='180' font-family='Arial Black,sans-serif' font-size='72' font-weight='900' fill='#ffffff' text-anchor='middle' dominant-baseline='middle'>STAT</text><text x='450' y='270' font-family='Arial,sans-serif' font-size='26' fill='#00d4ff' text-anchor='middle'>context</text></svg>",
  "intro": "Two paragraphs. First sentence has primary keyword naturally. Mention free toolkit if relevant.",
  "sections": [
    {"heading": "H2 with related long-tail keyword", "content": "2-3 paragraphs real advice"},
    {"heading": "H2 different related keyword", "content": "2-3 paragraphs"},
    {"heading": "H2 another search angle", "content": "2-3 paragraphs. Mention Academy if relevant."},
    {"heading": "H2 actionable keyword", "content": "2-3 paragraphs with primary keyword"}
  ],
  "keyTakeaways": ["Specific point 1", "Point 2", "Point 3", "Point 4"],
  "faq": [
    {"q": "Real People Also Ask question from Google", "a": "2-3 sentence honest answer"},
    {"q": "Second real Google PAA question", "a": "2-3 sentences"},
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

    const heroHTML = post.heroSvg
      ? `<figure class="post-image post-image-hero"><div class="svg-wrapper">${post.heroSvg}</div><figcaption>${post.seoTitle}</figcaption></figure>`
      : '';

    const midHTML = post.midSvg
      ? `<figure class="post-image post-image-mid"><div class="svg-wrapper">${post.midSvg}</div><figcaption>${post.primaryKeyword || topic}</figcaption></figure>`
      : '';

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
          read_time: post.readTime || 7,
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
