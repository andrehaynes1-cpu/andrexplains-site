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
          content: 'Blog post for AndreExplains.com. Topic: "' + topic + '". Write as Andre, casual real voice, contractions, no AI phrases. SEO: primaryKeyword=exact Google phrase, in seoTitle+first paragraph+one H2+last paragraph. Include 2026 in title. Mention free toolkit https://andines.pythonanywhere.com/ once. Mention YouTube Academy https://youtube-mastery-academy.netlify.app/ once. JSON only, no markdown:\n{"seoTitle":"under 60ch","metaDescription":"under 155ch","primaryKeyword":"search phrase","category":"Growth","readTime":6,"slug":"3-5-words","heroSvg":"<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 480\' width=\'1200\' height=\'480\'><rect width=\'1200\' height=\'480\' fill=\'#080808\'/><rect x=\'0\' y=\'440\' width=\'1200\' height=\'8\' fill=\'#e8ff00\'/><text x=\'600\' y=\'220\' font-family=\'Arial Black,sans-serif\' font-size=\'80\' font-weight=\'900\' fill=\'#fff\' text-anchor=\'middle\'>TOPIC</text><text x=\'600\' y=\'320\' font-family=\'Arial,sans-serif\' font-size=\'28\' fill=\'#e8ff00\' text-anchor=\'middle\'>sub</text></svg>","midSvg":"<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 900 400\' width=\'900\' height=\'400\'><rect width=\'900\' height=\'400\' fill=\'#0f0f0f\'/><text x=\'450\' y=\'200\' font-family=\'Arial Black,sans-serif\' font-size=\'60\' font-weight=\'900\' fill=\'#fff\' text-anchor=\'middle\'>STAT</text></svg>","intro":"1-2 paragraphs keyword in first sentence","sections":[{"heading":"H2","content":"2 paragraphs"},{"heading":"H2","content":"2 paragraphs"},{"heading":"H2","content":"2 paragraphs"}],"keyTakeaways":["1","2","3"],"faq":[{"q":"q","a":"a"},{"q":"q","a":"a"}]}\nTopic-relevant SVG text. Real PAA questions.'
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
        if (i === Math.floor(sections.length / 2)) html += midHTML;
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
          read_time: post.readTime || 6,
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
