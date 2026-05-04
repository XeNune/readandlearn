// Global state
let currentText = null;
let currentLanguage = 'ru';
let currentMode = 'highlight';
let selectedWord = null;
let selectedSentence = null;
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

    // Header with gradient
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

    // Body
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
    
    // Update language select — only translation languages, no Russian
    const languageSelect = document.getElementById('languageSelect');
    languageSelect.innerHTML = '';

    currentText.languages.forEach(lang => {
        const code = getLanguageCode(lang);
        const option = document.createElement('option');
        option.value = code;
        option.textContent = lang;
        languageSelect.appendChild(option);
    });

    // Default to first available language
    if (currentText.languages.length > 0) {
        currentLanguage = getLanguageCode(currentText.languages[0]);
        languageSelect.value = currentLanguage;
    }
    
    // Reset mode select
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
            
            // Separate punctuation
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
                // In sentence mode, prevent word popup — sentence handles the click
                span.onclick = (e) => { e.stopPropagation(); showSentencePopup(sentenceSpan, sentence); };
                sentenceSpan.appendChild(span);
            }

            if (punctuation) {
                sentenceSpan.appendChild(document.createTextNode(punctuation));
            } else if (index < words.length - 1) {
                sentenceSpan.appendChild(document.createTextNode(' '));
            }
        });

        // Highlight whole sentence on hover
        sentenceSpan.addEventListener('mouseenter', () => {
            sentenceSpan.querySelectorAll('.word').forEach(w => {
                w.style.backgroundColor = '#34c759';
                w.style.color = '#ffffff';
            });
        });
        sentenceSpan.addEventListener('mouseleave', () => {
            sentenceSpan.querySelectorAll('.word').forEach(w => {
                w.style.backgroundColor = 'transparent';
                w.style.color = '#1d1d1d';
            });
        });

        // Click anywhere in sentence (including words) shows sentence translation
        sentenceSpan.addEventListener('click', (e) => {
            e.stopPropagation();
            showSentencePopup(sentenceSpan, sentence);
        });

        textContent.appendChild(sentenceSpan);
        textContent.appendChild(document.createTextNode(' '));
    });
}

function showSentencePopup(sentenceElement, sentence) {
    selectedSentence = sentence;
    selectedWord = null;

    const popup = document.getElementById('wordPopup');
    const overlay = document.getElementById('overlay');

    document.getElementById('popupWord').textContent = sentence;
    document.getElementById('popupTranslation').textContent = getFullTranslation(sentence);

    const rect = sentenceElement.getBoundingClientRect();
    popup.style.position = 'fixed';
    popup.style.top = Math.max(10, rect.bottom + 8) + 'px';
    popup.style.left = Math.max(10, rect.left) + 'px';

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
        this.style.backgroundColor = '#34c759';
        this.style.color = '#ffffff';
    });
    
    span.addEventListener('mouseleave', function() {
        this.style.backgroundColor = 'transparent';
        this.style.color = '#1d1d1d';
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
    selectedSentence = null;
    
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
    popup.style.position = 'fixed';
    popup.style.top = Math.max(10, rect.top - 150) + 'px';
    popup.style.left = Math.max(10, rect.left - 100) + 'px';
    
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function closeWordPopup() {
    document.getElementById('wordPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function showGrammar() {
    closeWordPopup();

    const popup = document.getElementById('grammarPopup');
    const overlay = document.getElementById('overlay');

    if (selectedSentence) {
        // Sentence mode — show grammar for each word in sentence
        document.getElementById('grammarWord').textContent = selectedSentence;
        const grammarContent = document.getElementById('grammarContent');
        grammarContent.innerHTML = '';

        const words = selectedSentence.match(/[a-zA-Zа-яА-ЯёЁ]+/g) || [];
        const uniqueWords = [...new Set(words)];

        if (uniqueWords.length === 0) {
            grammarContent.textContent = 'Нет данных.';
        } else {
            uniqueWords.forEach(word => {
                const info = getGrammarInfo(word, currentTextId);
                if (info && info !== 'Нет информации') {
                    const block = document.createElement('div');
                    block.style.marginBottom = '0.8rem';
                    block.innerHTML = `<strong style="color:#34c759">${word}:</strong> ${info}`;
                    grammarContent.appendChild(block);
                }
            });
            if (grammarContent.innerHTML === '') {
                grammarContent.textContent = 'Грамматическая информация недоступна.';
            }
        }
    } else {
        // Word mode
        document.getElementById('grammarWord').textContent = selectedWord;
        const grammarText = getGrammarInfo(selectedWord, currentTextId);
        document.getElementById('grammarContent').textContent = grammarText;
    }

    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function closeGrammarPopup() {
    document.getElementById('grammarPopup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

function closeAllPopups() {
    closeWordPopup();
    closeGrammarPopup();
}

function getFullTranslation(sentence) {
    const words = sentence.match(/\S+/g) || [];
    const translated = words.map(word => {
        // Strip punctuation for lookup, then re-attach
        const match = word.match(/^(.*?)([.!?,;:]*)$/);
        const cleanWord = match ? match[1] : word;
        const punct = match ? match[2] : '';
        return getWordTranslation(cleanWord, currentLanguage, currentTextId) + punct;
    }).join(' ');
    
    return translated || 'Перевод недоступен';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllPopups();
    }
});

if (document.getElementById('wordPopup')) {
    document.getElementById('wordPopup').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

if (document.getElementById('grammarPopup')) {
    document.getElementById('grammarPopup').addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

window.addEventListener('load', async () => {
    await loadAllData();
    showPage('homePage');
});
