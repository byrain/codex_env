import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const NEWS_FEEDS = [
  {
    id: 'us-google-news-ai',
    region: 'US',
    language: 'en',
    url: 'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en'
  },
  {
    id: 'cn-google-news-ai',
    region: 'CN',
    language: 'zh',
    url: 'https://news.google.com/rss/search?q=人工智能&hl=zh-CN&gl=CN&ceid=CN:zh-Hans'
  }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const decodeXml = (str = '') =>
  str
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const readTag = (item, tag) => {
  const match = item.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return decodeXml(match?.[1] || '');
};

function parseRssItems(xml, source) {
  const itemBlocks = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];
  return itemBlocks
    .map((item) => ({
      title: readTag(item, 'title') || 'Untitled',
      link: readTag(item, 'link'),
      publishedAt: readTag(item, 'pubDate') || null,
      source: source.id,
      region: source.region
    }))
    .filter((item) => item.link);
}

async function fetchSource(source) {
  const response = await fetch(source.url);
  if (!response.ok) {
    throw new Error(`Fetch failed: ${source.id} (${response.status})`);
  }
  const xml = await response.text();
  return parseRssItems(xml, source);
}

async function buildNewsPayload() {
  const fetched = await Promise.all(NEWS_FEEDS.map((source) => fetchSource(source)));
  const merged = fetched
    .flat()
    .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    .slice(0, 10);

  return {
    updatedAt: new Date().toISOString(),
    count: merged.length,
    sources: NEWS_FEEDS.map(({ id, region, language }) => ({ id, region, language })),
    items: merged
  };
}

async function serveStatic(reqPath, res) {
  const requested = reqPath === '/' ? '/index.html' : reqPath;
  const filePath = path.join(publicDir, requested);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    const fallback = await fs.readFile(path.join(publicDir, 'index.html'));
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'] });
    res.end(fallback);
  }
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  if (requestUrl.pathname === '/api/news') {
    try {
      const payload = await buildNewsPayload();
      res.writeHead(200, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify(payload));
    } catch (error) {
      console.error('Failed to fetch news:', error);
      res.writeHead(500, { 'Content-Type': MIME_TYPES['.json'] });
      res.end(JSON.stringify({ message: 'Failed to fetch AI news at the moment. Please try again later.' }));
    }
    return;
  }

  await serveStatic(requestUrl.pathname, res);
});

server.listen(PORT, () => {
  console.log(`AI news app running at http://localhost:${PORT}`);
});
