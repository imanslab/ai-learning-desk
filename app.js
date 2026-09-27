"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const storageKey = 'learning-desk-progress-v1';
  const knownIds = new Set(CARDS.map(card => card.id));
  let learned = new Set();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(saved)) learned = new Set(saved.filter(id => knownIds.has(id)));
  } catch { $('storage-note').hidden = false; }
  let activeTopic = 'All topics';
  let order = [...CARDS];
  const flipped = new Set();
  const categories = [...new Set(CARDS.map(card => card.category))];
  const topicLabels = {
    'ML foundations': 'Machine learning (ML) foundations',
    'CNN & detection': 'Convolutional neural networks (CNN) & detection',
    'RNN & transformers': 'Recurrent neural networks (RNN) & transformers',
    'LLMs & systems': 'Large language models (LLM) & systems',
    'Production & governance': 'Production & governance',
    'Quant risk & simulation': 'Quant risk & simulation',
    'Explainability & fairness': 'Explainability & fairness',
    'Trading & energy applications': 'Trading & energy applications',
    'Coding agents': 'Coding agents'
  };
  const topicLabel = topic => topicLabels[topic] || topic;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  function updateProgress() {
    $('total').innerHTML = `${CARDS.length}<span>learning cards</span>`;
    $('progress').max = CARDS.length;
    $('progress').value = learned.size;
    $('progress').setAttribute('aria-label', `${learned.size} of ${CARDS.length} cards learned`);
    $('progress-label').textContent = `${learned.size} / ${CARDS.length} learned`;
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify([...learned])); }
    catch { $('storage-note').hidden = false; }
    updateProgress();
  }
  function face(card) {
    const back = flipped.has(card.id);
    const meta = `<span class="card-meta"><span>${escape(card.category)}</span><span class="card-number">${card.id.slice(5)}</span></span>`;
    const title = `<span class="card-title">${escape(card.title)}</span>`;
    const fullName = card.fullName ? `<span class="card-full-name" id="${card.id}-full-name">${escape(card.fullName)}</span>` : '';
    const fields = [['The idea', card.definition], ['The technique', card.technique], ['Connect it', card.example], ['Watch for', card.pitfall]];
    if (card.sayIt) fields.push(['Say it in one breath', card.sayIt]);
    const content = back ? fields.map(([label, text]) => `<span class="answer-block"><span class="answer-label">${label}</span>${escape(text)}</span>`).join('') : `<span class="card-prompt">${escape(card.prompt)}</span>`;
    return `${meta}${title}${fullName}<span id="${card.id}-content">${content}</span><span class="flip-hint">${back ? 'Back to the question' : 'Turn to understand'}<span class="flip-icon" aria-hidden="true">↻</span></span>`;
  }
  function renderTopics() {
    $('topics').innerHTML = ['All topics', ...categories].map(topic => `<button type="button" class="topic" aria-pressed="${topic === activeTopic}" data-topic="${escape(topic)}">${escape(topicLabel(topic))} <span>${topic === 'All topics' ? CARDS.length : CARDS.filter(card => card.category === topic).length}</span></button>`).join('');
  }
  function visibleCards() {
    const query = $('search').value.trim().toLocaleLowerCase();
    return order.filter(card => (activeTopic === 'All topics' || card.category === activeTopic)
      && ($('status').value !== 'learned' || learned.has(card.id))
      && ($('status').value !== 'review' || !learned.has(card.id))
      && (!query || [card.title, card.fullName || '', topicLabel(card.category), card.prompt, card.definition, card.technique, card.example, card.pitfall, card.sayIt || '', card.category].join(' ').toLocaleLowerCase().includes(query)));
  }
  function render() {
    const visible = visibleCards();
    $('results').textContent = `${visible.length} ${visible.length === 1 ? 'card' : 'cards'} · ${topicLabel(activeTopic)}`;
    $('empty').hidden = visible.length > 0;
    $('shuffle').disabled = visible.length < 2;
    $('cards').innerHTML = visible.map(card => `<article class="learning-card" data-id="${card.id}" data-tone="${categories.indexOf(card.category) % 4}" aria-label="${escape(card.title)}">
      <button type="button" class="card-flip" aria-describedby="${card.fullName ? card.id + '-full-name ' : ''}${card.id}-content" aria-label="${flipped.has(card.id) ? 'Show question' : 'Show explanation'}: ${escape(card.title)}" aria-expanded="${flipped.has(card.id)}">${face(card)}</button>
      <div class="card-bottom"><button type="button" class="learn-button" aria-label="Mark ${escape(card.title)} as ${learned.has(card.id) ? 'still learning' : 'learned'}" aria-pressed="${learned.has(card.id)}">${learned.has(card.id) ? 'Learned' : 'Mark learned'}</button>${card.url ? `<a class="source-link" href="${escape(card.url)}"${card.url.startsWith('https:') ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escape(card.source)}</a>` : `<span class="source-link">${escape(card.source)}</span>`}</div>
      </article>`).join('');
  }
  $('topics').addEventListener('click', event => {
    const button = event.target.closest('button[data-topic]');
    if (!button) return;
    activeTopic = button.dataset.topic;
    for (const topic of $('topics').querySelectorAll('button')) topic.setAttribute('aria-pressed', String(topic === button));
    render();
  });
  $('cards').addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const article = button.closest('[data-id]');
    const card = CARDS.find(item => item.id === article.dataset.id);
    if (button.classList.contains('card-flip')) {
      if (flipped.has(card.id)) flipped.delete(card.id); else flipped.add(card.id);
      button.innerHTML = face(card);
      button.setAttribute('aria-expanded', String(flipped.has(card.id)));
      button.setAttribute('aria-label', `${flipped.has(card.id) ? 'Show question' : 'Show explanation'}: ${card.title}`);
      button.classList.remove('turning');
      void button.offsetWidth;
      button.classList.add('turning');
    } else {
      const previouslyVisible = visibleCards();
      const position = previouslyVisible.findIndex(item => item.id === card.id);
      if (learned.has(card.id)) learned.delete(card.id); else learned.add(card.id);
      save();
      if ($('status').value === 'all') {
        button.textContent = learned.has(card.id) ? 'Learned' : 'Mark learned';
        button.setAttribute('aria-pressed', String(learned.has(card.id)));
        button.setAttribute('aria-label', `Mark ${card.title} as ${learned.has(card.id) ? 'still learning' : 'learned'}`);
      } else {
        render();
        const remaining = $('cards').querySelectorAll('.learn-button');
        (remaining[Math.min(position, remaining.length - 1)] || $('status')).focus();
      }
    }
  });
  $('search').addEventListener('input', render);
  $('status').addEventListener('change', render);
  $('text-size').addEventListener('change', () => { document.documentElement.dataset.size = $('text-size').value; });
  $('shuffle').addEventListener('click', () => {
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    render();
    $('results').textContent += ' · Shuffled';
  });
  $('clear').addEventListener('click', () => {
    activeTopic = 'All topics';
    $('search').value = '';
    $('status').value = 'all';
    renderTopics(); render(); $('search').focus();
  });
  renderTopics(); updateProgress(); render();
})();
