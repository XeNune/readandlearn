// Global state for loaded data
let textsMetadata = {};
let wordTranslations = {};
let grammarInfo = {};
let textContents = {};
let explainTexts = {};

// Load all data from files
async function loadAllData() {
    try {
        // Load metadata
        const metadataRes = await fetch('translations/metadata.json');
        if (!metadataRes.ok) throw new Error('metadata.json not found');
        textsMetadata = await metadataRes.json();

        // Load data for each text based on metadata keys — no hardcoding
        const textIds = Object.keys(textsMetadata);
        for (const id of textIds) {
            const i = parseInt(id);

            const txtRes = await fetch(`texts/text-${i}.txt`);
            if (!txtRes.ok) throw new Error(`texts/text-${i}.txt not found`);
            textContents[i] = await txtRes.text();

            const jsonRes = await fetch(`translations/text-${i}.json`);
            if (!jsonRes.ok) throw new Error(`translations/text-${i}.json not found`);
            wordTranslations[i] = await jsonRes.json();

            const grammarRes = await fetch(`grammar/text-${i}.json`);
            if (!grammarRes.ok) throw new Error(`grammar/text-${i}.json not found`);
            grammarInfo[i] = await grammarRes.json();

            const explainRes = await fetch(`explain/text-${i}.txt`);
            if (!explainRes.ok) throw new Error(`explain/text-${i}.txt not found`);
            explainTexts[i] = await explainRes.text();
        }

        console.log('All data loaded successfully');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Get all texts formatted
function getAllTexts() {
    return Object.entries(textsMetadata).map(([id, data]) => ({
        id: parseInt(id),
        title: data.title,
        wordCount: data.wordCount,
        languages: data.languages,
        originalText: textContents[parseInt(id)] || ''
    }));
}

// Get text by ID
function getTextById(id) {
    const metadata = textsMetadata[id];
    if (!metadata) return null;

    // Read full translations directly from the text's translation file
    const translationFile = wordTranslations[parseInt(id)] || {};

    // Build translations object dynamically from available languages
    const translations = {};
    (metadata.languages || []).forEach(lang => {
        const code = getLanguageCode(lang);
        translations[code] = translationFile[code] || '';
    });

    return {
        id: id,
        title: metadata.title,
        wordCount: metadata.wordCount,
        languages: metadata.languages,
        originalText: textContents[parseInt(id)] || '',
        translations
    };
}

// Get translation for a word
function getWordTranslation(word, language, textId) {
    if (!wordTranslations[textId]) return 'Перевод недоступен';
    const translations = wordTranslations[textId][word] || {};
    return translations[language] || 'Перевод недоступен';
}

// Get grammar information
function getGrammarInfo(word, textId) {
    if (!grammarInfo[textId]) return 'Нет информации';
    const info = grammarInfo[textId][word];
    if (!info) return 'Нет информации';
    // If grammar info is an object with language keys, return for currentLanguage
    if (typeof info === 'object' && !Array.isArray(info)) {
        return info[currentLanguage] || info['en'] || Object.values(info)[0] || 'Нет информации';
    }
    return info;
}

// Helper — must mirror getLanguageCode in script.js
function getLanguageCode(language) {
    const codes = {
        'English': 'en',
        'Spanish': 'es',
        'French': 'fr',
        'German': 'de'
    };
    return codes[language] || language.toLowerCase();
}

function getExplainText(textId) {
    return explainTexts[textId] || 'Объяснение недоступно';
}