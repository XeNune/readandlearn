// Global state
let currentText = null;
let currentLanguage = 'ru';
let currentMode = 'highlight';
let selectedWord = null;
let currentWordElement = null;
let currentTextId = null;

// Page Navigation
function showPage(pageName) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageName).classList.add('active');
}

function goHome() {
    showPage('homePage');
    currentText = null;
    currentLanguage = '';
    currentMode = 'highlight';
}

function goToTexts() {
    showPage('textsPage');
    loadTextsList();
}

function loadTextsList() {
    const textsContainer = document.getElementById('textsContainer');
    textsContainer.innerHTML = '';
    const texts = getAllTexts();
    texts.forEach(text => {
        const card = createTextCard(text);
        textsContainer.appendChild(card);
    });
}

function createTextCard(text) {
    const icons = ['📖', '📚', '📝', '🗒️', '📄'];
    const icon = icons[(text.id - 1) % icons.length];

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

function openText(textId) {
    currentTextId = textId;
    currentText = getTextById(textId);
    currentLanguage = '';
    currentMode = 'highlight';

    if (!currentText) {
        console.error('Text not found');
        return;
    }

    document.getElementById('textTitle').textContent = currentText.title;

    const languageSelect = document.getElementById('languageSelect');
    languageSelect.innerHTML = '';

    currentText.languages.forEach(lang => {
        const code = getLanguageCode(lang);
        const option = document.createElement('option');
        option.value = code;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });

    if (currentText.languages.length > 0) {
        currentLanguage = getLanguageCode(currentText.languages[0]);
        languageSelect.value = currentLanguage;
    }

    document.getElementById('modeSelect').value = 'highlight';

    updateTextDisplay();
    showPage('readerPage');
}

function getLanguageCode(language) {
    const codes = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de'
    };
    return codes[language] || language.toLowerCase();
}

function updateTextDisplay() {
    if (!currentText) return;
    currentLanguage = document.getElementById('languageSelect').value;
    currentMode = document.getElementById('modeSelect').value;
    const textContent = document.getElementById('textContent');
    textContent.innerHTML = '';
    if (currentMode === 'full') {
        displayFullText();
    } else if (currentMode === 'sentences') {
        displayBySentences();
    } else {
        displayWordByWord();
    }
}

function displayWordByWord() {
    const textContent = document.getElementById('textContent');
    const originalText = currentText.originalText;
    const sentences = originalText.split(/(?<=[.!?])\s+/);

    sentences.forEach(sentence => {
        const p = document.createElement('p');
        const words = sentence.match(/\S+/g) || [];

        words.forEach((word, idx) => {
            let cleanWord = word;
            let punctuation = '';
            const match = word.match(/^(.*?)([.!?,;:]*"?\s*)$/);
            if (match) {
                cleanWord = match[1];
                punctuation = match[2];
            }
            if (cleanWord) {
                const span = createWordSpan(cleanWord);
                p.appendChild(span);
            }
            if (punctuation) {
                p.appendChild(document.createTextNode(punctuation));
            } else if (idx < words.length - 1) {
                p.appendChild(document.createTextNode(' '));
            }
        });

        textContent.appendChild(p);
    });
}

function displayBySentences() {
    const textContent = document.getElementById('textContent');
    const originalText = currentText.originalText;
    const sentences = originalText.match(/[^.!?]+[.!?]+/g) || [originalText];

    sentences.forEach(sentence => {
        sentence = sentence.trim();
        if (!sentence) return;

        const sentenceSpan = document.createElement('span');
        sentenceSpan.className = 'sentence';
        sentenceSpan.style.cursor = 'pointer';
        sentenceSpan.style.borderRadius = '4px';
        sentenceSpan.style.padding = '2px 0';
        sentenceSpan.style.transition = 'background-color 0.15s';

        const words = sentence.match(/\S+/g) || [];
        words.forEach((word, index) => {
            let cleanWord = word;
            let punctuation = '';
            const match = word.match(/^(.*?)([.!?,;:]*)$/);
            if (match) {
                cleanWord = match[1];
                punctuation = match[2];
            }
            if (cleanWord) {
                const span = createWordSpan(cleanWord);
                sentenceSpan.appendChild(span);
            }
            if (punctuation) {
                sentenceSpan.appendChild(document.createTextNode(punctuation));
            } else if (index < words.length - 1) {
                sentenceSpan.appendChild(document.createTextNode(' '));
            }
        });

        sentenceSpan.addEventListener('mouseenter', () => {
            sentenceSpan.querySelectorAll('.word').forEach(w => {
                w.style.backgroundColor = '#b5863a';
                w.style.color = '#ffffff';
            });
        });
        sentenceSpan.addEventListener('mouseleave', () => {
            sentenceSpan.querySelectorAll('.word').forEach(w => {
                w.style.backgroundColor = 'transparent';
                w.style.color = '';
            });
        });
        sentenceSpan.addEventListener('click', (e) => {
            if (!e.target.classList.contains('word')) {
                showSentencePopup(sentenceSpan, sentence);
            }
        });

        textContent.appendChild(sentenceSpan);
        textContent.appendChild(document.createTextNode(' '));
    });
}

function showSentencePopup(sentenceElement, sentence) {
    const popup = document.getElementById('wordPopup');
    const overlay = document.getElementById('overlay');

    document.getElementById('popupWord').textContent = sentence;
    document.getElementById('popupTranslation').textContent = getFullTranslation(sentence);

    const rect = sentenceElement.getBoundingClientRect();
    const popupW = 360;
    const popupH = 200;
    const margin = 10;

    let top = rect.bottom + 8;
    if (top + popupH > window.innerHeight - margin) top = rect.top - popupH - 8;
    top = Math.max(margin, top);
    let left = rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - popupW - margin));

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function displayFullText() {
    const textContent = document.getElementById('textContent');
    let text = '';
    if (currentLanguage === 'ru') {
        text = currentText.originalText;
    } else {
        text = currentText.translations[currentLanguage] || 'Перевод недоступен';
    }
    const p = document.createElement('p');
    p.textContent = text;
    textContent.appendChild(p);
}

function createWordSpan(word) {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word;

    span.addEventListener('mouseenter', function() {
        this.style.backgroundColor = '#b5863a';
        this.style.color = '#ffffff';
    });
    span.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
        this.style.color = '';
    });
    span.onclick = (e) => {
        e.stopPropagation();
        showWordPopup(span, word);
    };
    return span;
}

function showWordPopup(wordElement, word) {
    currentWordElement = wordElement;
    selectedWord = word;

    const popup = document.getElementById('wordPopup');
    const overlay = document.getElementById('overlay');

    document.getElementById('popupWord').textContent = word;

    let translation;
    if (currentLanguage === 'ru') {
        translation = 'Выберите другой язык';
    } else {
        translation = getWordTranslation(word, currentLanguage, currentTextId);
    }

    document.getElementById('popupTranslation').textContent = translation;

    const rect = wordElement.getBoundingClientRect();
    const popupW = 360;
    const popupH = 220;
    const margin = 10;

    let top = rect.top - popupH - 8;
    if (top < margin) top = rect.bottom + 8;
    top = Math.min(top, window.innerHeight - popupH - margin);
    let left = rect.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - popupW - margin));

    popup.style.top = top + 'px';
    popup.style.left = left + 'px';
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function closeWordPopup() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function showGrammar() {
    // First close the word popup and overlay
    document.getElementById('wordPopup').style.display = 'none';
    // Do NOT hide overlay — grammar popup needs it

    const wrapper = document.getElementById('grammarWrapper');
    const overlay = document.getElementById('overlay');

    document.getElementById('grammarWord').textContent = selectedWord;

    const grammarText = getGrammarInfo(selectedWord, currentTextId);
    document.getElementById('grammarContent').textContent = grammarText;

    wrapper.classList.add('visible');
    overlay.style.display = 'block';
}

function closeGrammarPopup() {
    document.getElementById('grammarWrapper').classList.remove('visible');
    document.getElementById('overlay').style.display = 'none';
}

function closeAllPopups() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('grammarWrapper').classList.remove('visible');
    document.getElementById('overlay').style.display = 'none';
}

function getFullTranslation(sentence) {
    const words = sentence.match(/\S+/g) || [];
    const translated = words.map(word => {
        const match = word.match(/^(.*?)([.!?,;:]*)$/);
        const cleanWord = match ? match[1] : word;
        const punct = match ? match[2] : '';
        return getWordTranslation(cleanWord, currentLanguage, currentTextId) + punct;
    }).join(' ');
    return translated || 'Перевод недоступен';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllPopups();
});

const wordPopupEl = document.getElementById('wordPopup');
if (wordPopupEl) wordPopupEl.addEventListener('click', e => e.stopPropagation());
const grammarPopupEl = document.getElementById('grammarPopup');
if (grammarPopupEl) grammarPopupEl.addEventListener('click', e => e.stopPropagation());

window.addEventListener('load', async () => {
    await loadAllData();
    showPage('homePage');
});
