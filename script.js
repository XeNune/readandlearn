// Global state
let currentText     = null;
let currentLanguage = 'ru';
let currentMode     = 'highlight';
let selectedWord    = null;
let currentTextId   = null;

// ─── Page navigation ──────────────────────────────────────────────────────────
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageName).classList.add('active');
}

function goHome() {
    closeAllPopups();
    showPage('homePage');
    currentText = null;
    currentLanguage = '';
    currentMode = 'highlight';
}

function goToTexts() {
    closeAllPopups();
    showPage('textsPage');
    loadTextsList();
}

// ─── Texts list ───────────────────────────────────────────────────────────────
function loadTextsList() {
    const container = document.getElementById('textsContainer');
    container.innerHTML = '';
    getAllTexts().forEach(text => container.appendChild(createTextCard(text)));
}

function createTextCard(text) {
    const icons = ['📖', '📚', '📝', '🗒️', '📄'];
    const icon  = icons[(text.id - 1) % icons.length];

    const card = document.createElement('div');
    card.className = 'text-card';
    card.onclick = () => openText(text.id);

    const header = document.createElement('div');
    header.className = 'text-card-header';
    const iconEl = document.createElement('span');
    iconEl.className = 'text-card-icon';
    iconEl.textContent = icon;
    const title = document.createElement('div');
    title.className = 'text-card-title';
    title.textContent = text.title;
    header.appendChild(iconEl);
    header.appendChild(title);

    const body = document.createElement('div');
    body.className = 'text-card-body';
    const info = document.createElement('div');
    info.className = 'text-card-info';

    const wordCount = document.createElement('div');
    wordCount.className = 'text-card-row';
    wordCount.innerHTML = `<span class="text-card-label">Слов</span><span class="text-card-value">${text.wordCount}</span>`;

    const divider = document.createElement('div');
    divider.className = 'text-card-divider';

    const langRow = document.createElement('div');
    langRow.className = 'text-card-row';
    langRow.innerHTML = '<span class="text-card-label">Языки</span>';

    const languages = document.createElement('div');
    languages.className = 'text-card-languages';
    text.languages.forEach(lang => {
        const badge = document.createElement('span');
        badge.className = 'language-badge';
        badge.textContent = lang;
        languages.appendChild(badge);
    });

    info.appendChild(wordCount);
    info.appendChild(divider);
    info.appendChild(langRow);
    info.appendChild(languages);
    body.appendChild(info);
    card.appendChild(header);
    card.appendChild(body);
    return card;
}

// ─── Open text ────────────────────────────────────────────────────────────────
function openText(textId) {
    currentTextId = textId;
    currentText   = getTextById(textId);
    currentMode   = 'highlight';

    if (!currentText) { console.error('Text not found'); return; }

    document.getElementById('textTitle').textContent = currentText.title;

    const langSel = document.getElementById('languageSelect');
    langSel.innerHTML = '';
    currentText.languages.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = getLanguageCode(lang);
        opt.textContent = lang;
        langSel.appendChild(opt);
    });
    if (currentText.languages.length > 0) {
        currentLanguage = getLanguageCode(currentText.languages[0]);
        langSel.value = currentLanguage;
    }

    document.getElementById('modeSelect').value = 'highlight';
    updateTextDisplay();
    showPage('readerPage');
}

function getLanguageCode(language) {
    const codes = { 'English':'en', 'Spanish':'es', 'French':'fr', 'German':'de' };
    return codes[language] || language.toLowerCase();
}

// ─── Text display (rebuilds DOM on every call) ────────────────────────────────
function updateTextDisplay() {
    if (!currentText) return;
    closeAllPopups();

    currentLanguage = document.getElementById('languageSelect').value;
    currentMode     = document.getElementById('modeSelect').value;

    // Wipe everything — no stale listeners survive (elements are discarded)
    const textContent = document.getElementById('textContent');
    textContent.innerHTML = '';

    if      (currentMode === 'full')      displayFullText();
    else if (currentMode === 'sentences') displayBySentences();
    else                                  displayWordByWord();
}

// ─── Mode: word-by-word ───────────────────────────────────────────────────────
function displayWordByWord() {
    const container = document.getElementById('textContent');
    const sentences = currentText.originalText.split(/(?<=[.!?])\s+/);

    sentences.forEach(sentence => {
        const p = document.createElement('p');
        tokenise(sentence).forEach(({ word, punct, space }) => {
            if (word) p.appendChild(makeWordSpan_Word(word));
            if (punct) p.appendChild(txt(punct));
            if (space) p.appendChild(txt(' '));
        });
        container.appendChild(p);
    });
}

// Span for word-by-word mode: click → word popup
function makeWordSpan_Word(word) {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;

    span.addEventListener('mouseenter', () => {
        span.style.backgroundColor = 'var(--gold)';
        span.style.color = '#fff';
    });
    span.addEventListener('mouseleave', () => {
        span.style.backgroundColor = 'transparent';
        span.style.color = '';
    });
    span.addEventListener('click', e => {
        // Only fires in word-by-word mode — this element doesn't exist in other modes
        e.stopPropagation();
        showWordPopup(span, word);
    });
    return span;
}

// ─── Mode: sentences ──────────────────────────────────────────────────────────
function displayBySentences() {
    const container = document.getElementById('textContent');
    const sentences = currentText.originalText.match(/[^.!?]+[.!?]+/g)
                      || [currentText.originalText];

    sentences.forEach(sentence => {
        sentence = sentence.trim();
        if (!sentence) return;

        const wrap = document.createElement('span');
        wrap.className = 'sentence';

        tokenise(sentence).forEach(({ word, punct, space }) => {
            if (word) wrap.appendChild(makeWordSpan_Sentence(word));
            if (punct) wrap.appendChild(txt(punct));
            if (space) wrap.appendChild(txt(' '));
        });

        // Hover: highlight all words in this sentence
        wrap.addEventListener('mouseenter', () => {
            wrap.querySelectorAll('.word-sentence').forEach(w => {
                w.style.backgroundColor = 'var(--gold)';
                w.style.color = '#fff';
            });
        });
        wrap.addEventListener('mouseleave', () => {
            wrap.querySelectorAll('.word-sentence').forEach(w => {
                w.style.backgroundColor = 'transparent';
                w.style.color = '';
            });
        });

        // Click anywhere in the sentence → sentence popup
        wrap.addEventListener('click', () => showSentencePopup(wrap, sentence));

        container.appendChild(wrap);
        container.appendChild(txt(' '));
    });
}

// Span for sentence mode: purely visual, NO word popup, click bubbles up
function makeWordSpan_Sentence(word) {
    const span = document.createElement('span');
    // Different class from 'word' so word-mode listeners never match
    span.className = 'word word-sentence';
    span.textContent = word;
    // No click handler — event bubbles to parent sentence wrap
    return span;
}

// ─── Mode: full text ──────────────────────────────────────────────────────────
function displayFullText() {
    const container = document.getElementById('textContent');
    const text = currentLanguage === 'ru'
        ? currentText.originalText
        : (currentText.translations[currentLanguage] || 'Перевод недоступен');
    const p = document.createElement('p');
    p.textContent = text;
    container.appendChild(p);
}

// ─── Tokeniser helper ─────────────────────────────────────────────────────────
// Returns array of {word, punct, space} tokens for a sentence string
function tokenise(sentence) {
    const raw   = sentence.match(/\S+/g) || [];
    const tokens = [];
    raw.forEach((token, idx) => {
        const m     = token.match(/^(.*?)([.!?,;:\-—]*)$/);
        const word  = m ? m[1] : token;
        const punct = m ? m[2] : '';
        const space = idx < raw.length - 1;
        tokens.push({ word, punct, space });
    });
    return tokens;
}

function txt(str) { return document.createTextNode(str); }

// ─── Popups ───────────────────────────────────────────────────────────────────
function showWordPopup(wordElement, word) {
    selectedWord = word;

    const popup   = document.getElementById('wordPopup');
    const overlay = document.getElementById('overlay');

    document.getElementById('popupWord').textContent = word;
    document.getElementById('popupTranslation').textContent =
        currentLanguage === 'ru'
            ? 'Выберите другой язык'
            : getWordTranslation(word, currentLanguage, currentTextId);

    positionPopup(popup, wordElement.getBoundingClientRect(), 360, 220);
    popup.style.display  = 'block';
    overlay.style.display = 'block';
}

function showSentencePopup(sentenceEl, sentence) {
    selectedWord = sentence;

    const popup   = document.getElementById('wordPopup');
    const overlay = document.getElementById('overlay');

    document.getElementById('popupWord').textContent        = sentence;
    document.getElementById('popupTranslation').textContent = getFullTranslation(sentence);

    positionPopup(popup, sentenceEl.getBoundingClientRect(), 360, 200);
    popup.style.display   = 'block';
    overlay.style.display = 'block';
}

function positionPopup(popup, rect, popupW, popupH) {
    const m = 10;
    let top  = rect.bottom + 8;
    if (top + popupH > window.innerHeight - m) top = rect.top - popupH - 8;
    top  = Math.max(m, Math.min(top,  window.innerHeight - popupH - m));
    let left = rect.left;
    left = Math.max(m, Math.min(left, window.innerWidth  - popupW  - m));
    popup.style.top  = top  + 'px';
    popup.style.left = left + 'px';
}

function closeWordPopup() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('overlay').style.display   = 'none';
}

function showGrammar() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('grammarWord').textContent    = selectedWord;
    document.getElementById('grammarContent').textContent = getGrammarInfo(selectedWord, currentTextId);
    document.getElementById('grammarWrapper').classList.add('visible');
    document.getElementById('overlay').style.display = 'block';
}

function closeGrammarPopup() {
    document.getElementById('grammarWrapper').classList.remove('visible');
    document.getElementById('overlay').style.display = 'none';
}

function closeAllPopups() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('grammarWrapper').classList.remove('visible');
    document.getElementById('overlay').style.display   = 'none';
}

// ─── Translation helper ───────────────────────────────────────────────────────
function getFullTranslation(sentence) {
    return (sentence.match(/\S+/g) || []).map(token => {
        const m     = token.match(/^(.*?)([.!?,;:]*)$/);
        const word  = m ? m[1] : token;
        const punct = m ? m[2] : '';
        return getWordTranslation(word, currentLanguage, currentTextId) + punct;
    }).join(' ') || 'Перевод недоступен';
}

function openExplain() {
    if (!currentTextId) return;

    const modal = document.getElementById('explainModal');
    const content = document.getElementById('explainContent');

    content.textContent = getExplainText(currentTextId);

    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
}

function closeExplain() {
    document.getElementById('explainModal').classList.remove('visible');
    document.body.style.overflow = '';
}

// ─── Event guards ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeAllPopups();
        closeExplain();
    }
});

const _wp = document.getElementById('wordPopup');
if (_wp) _wp.addEventListener('click', e => e.stopPropagation());
const _gp = document.getElementById('grammarPopup');
if (_gp) _gp.addEventListener('click', e => e.stopPropagation());

// ─── Init ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', async () => {
    await loadAllData();
    showPage('homePage');
});
