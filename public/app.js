const newsList = document.getElementById('newsList');
const status = document.getElementById('status');
const meta = document.getElementById('meta');
const refreshBtn = document.getElementById('refreshBtn');
const template = document.getElementById('newsItemTemplate');

const regionLabel = {
  US: '美国来源',
  CN: '中国来源'
};

const formatDate = (value) => {
  if (!value) return '时间未知';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

function renderNews(items) {
  newsList.innerHTML = '';

  if (!items.length) {
    status.textContent = '暂无新闻。';
    return;
  }

  status.textContent = '';

  items.forEach((item) => {
    const node = template.content.cloneNode(true);
    const badge = node.querySelector('.badge');
    const link = node.querySelector('.news-link');
    const publishedTime = node.querySelector('.published-time');

    badge.textContent = regionLabel[item.region] ?? item.region;
    link.textContent = item.title;
    link.href = item.link;
    publishedTime.textContent = `发布时间：${formatDate(item.publishedAt)}`;

    newsList.appendChild(node);
  });
}

async function loadNews() {
  status.textContent = '正在加载最新 AI 新闻...';
  refreshBtn.disabled = true;

  try {
    const response = await fetch('/api/news');
    if (!response.ok) throw new Error('Failed to fetch');

    const payload = await response.json();
    renderNews(payload.items);
    meta.textContent = `更新时间：${formatDate(payload.updatedAt)}｜共 ${payload.count} 条`;
  } catch (error) {
    status.textContent = '加载失败，请稍后刷新重试。';
    meta.textContent = '';
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener('click', loadNews);
loadNews();
