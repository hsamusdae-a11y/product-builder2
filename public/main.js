
// --- Navigation --- //
function showSection(sectionId, navElement) {
    document.querySelectorAll('.container section').forEach(section => {
        section.classList.remove('active');
    });
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active-nav');
    });
    document.getElementById(sectionId).classList.add('active');
    if (navElement) {
        navElement.classList.add('active-nav');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    showSection('intro', document.querySelector('a[onclick*="intro"]'));
    // Populate meditation verse from sermon notes if available
    document.querySelector('a[onclick*="meditation-helper"]').addEventListener('click', () => {
        const sermonVerse = document.getElementById('sermonVerseText').value;
        if(sermonVerse) {
            document.getElementById('meditationVerse').value = sermonVerse;
        }
    });
});


// --- Bible Data & Search --- //

window.BIBLE_DATA = window.BIBLE_DATA || {};
const BOOK_TO_FILENAME = {
    "창세기": "genesis", "출애굽기": "exodus", "레위기": "leviticus", "민수기": "numbers", "신명기": "deuteronomy",
    "여호수아": "joshua", "사사기": "judges", "룻기": "ruth", "사무엘상": "samuel1", "사무엘하": "samuel2",
    "열왕기상": "kings1", "열왕기하": "kings2", "역대상": "chronicles1", "역대하": "chronicles2", "에스라": "ezra",
    "느헤미야": "nehemiah", "에스더": "esther", "욥기": "job", "시편": "psalms", "잠언": "proverbs",
    "전도서": "ecclesiastes", "아가": "songofsongs", "이사야": "isaiah", "예레미야": "jeremiah", 
    "예레미야애가": "lamentations", "에스겔": "ezekiel", "다니엘": "daniel", "호세아": "hosea", "요엘": "joel",
    "아모스": "amos", "오바댜": "obadiah", "요나": "jonah", "미가": "micah", "나훔": "nahum", "하박국": "habakkuk",
    "스바냐": "zephaniah", "학개": "haggai", "스가랴": "zechariah", "말라기": "malachi", "마태복음": "matthew",
    "마가복음": "mark", "누가복음": "luke", "요한복음": "john", "사도행전": "acts", "로마서": "romans",
    "고린도전서": "corinthians1", "고린도후서": "corinthians2", "갈라디아서": "galatians", "에베소서": "ephesians",
    "빌립보서": "philippians", "골로새서": "colossians", "데살로니가전서": "thessalonians1", 
    "데살로니가후서": "thessalonians2", "디모데전서": "timothy1", "디모데후서": "timothy2", "디도서": "titus",
    "빌레몬서": "philemon", "히브리서": "hebrews", "야고보서": "james", "베드로전서": "peter1", "베드로후서": "peter2",
    "요한1서": "john1", "요한2서": "john2", "요한3서": "john3", "유다서": "jude", "요한계시록": "revelation"
};
const ALL_BOOKS = Object.keys(BOOK_TO_FILENAME);

function loadBookScript(bookFileName) {
    return new Promise((resolve, reject) => {
        if (window.BIBLE_DATA[bookFileName]) return resolve();
        const script = document.createElement('script');
        script.src = `bible/${bookFileName}.js`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${bookFileName}.js`));
        document.head.appendChild(script);
    });
}

async function searchVerse(query) {
    const resultBox = document.getElementById('verseSearchResult');
    const resultText = document.getElementById('verseResultText');
    const addVerseBtn = document.getElementById('addVerseBtn');
    resultBox.style.display = 'block';
    addVerseBtn.style.display = 'none';

    const match = query.match(/^([\S^\d]+)\s*(\d+):(\d+)$/);
    if (!match) {
        resultText.textContent = '형식 오류: \'창1:1\'과 같이 입력해주세요.';
        return;
    }

    let [, bookAbbr, chapter, verse] = match;
    const fullBookName = window.BIBLE_ABBREVIATIONS[bookAbbr];
    if (!fullBookName) {
        resultText.textContent = `\'${bookAbbr}\'는 유효한 약어가 아닙니다.`;
        return;
    }

    const bookFileName = BOOK_TO_FILENAME[fullBookName];
    if (!bookFileName) {
        resultText.textContent = `\'${fullBookName}\'에 대한 데이터 파일이 아직 준비되지 않았습니다.`;
        return;
    }

    try {
        await loadBookScript(bookFileName);
        const verseText = window.BIBLE_DATA[bookFileName]?.[chapter]?.[verse];
        if (verseText) {
            const fullReference = `${fullBookName} ${chapter}:${verse}`;
            const verseContent = `${fullReference}: ${verseText}`;
            resultText.textContent = verseContent;
            resultText.dataset.fullVerse = verseContent;
            addVerseBtn.style.display = 'inline-block';
        } else {
            resultText.textContent = '구절을 찾을 수 없습니다.';
        }
    } catch (error) {
        resultText.textContent = `데이터 로딩 중 오류 발생.`;
    }
}

// --- Daily Verse --- //
async function getDailyVerse() {
    const resultDiv = document.getElementById('dailyVerseResult');
    const verseTextP = document.getElementById('dailyVerseText');
    resultDiv.style.display = 'block';
    verseTextP.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 말씀을 가져오는 중...';

    try {
        const randomBook = ALL_BOOKS[Math.floor(Math.random() * ALL_BOOKS.length)];
        const bookFileName = BOOK_TO_FILENAME[randomBook];
        await loadBookScript(bookFileName);
        
        const bookData = window.BIBLE_DATA[bookFileName];
        const chapters = Object.keys(bookData);
        const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(bookData[randomChapter]);
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        const verseText = bookData[randomChapter][randomVerse];
        
        verseTextP.innerHTML = `<strong>${randomBook} ${randomChapter}:${randomVerse}</strong><br>${verseText}`;

    } catch (error) {
        verseTextP.textContent = '말씀을 가져오는 데 실패했습니다.';
        console.error('Error getting daily verse:', error);
    }
}

// --- Meditation Helper --- //
function generateMeditationQuestions() {
    const verse = document.getElementById('meditationVerse').value;
    const questionsDiv = document.getElementById('meditationQuestions');

    if (!verse) {
        questionsDiv.innerHTML = '<p style="color: red;">먼저 묵상할 구절을 입력해주세요.</p>';
        return;
    }

    questionsDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> AI가 묵상 질문을 생성하는 중입니다...</p>';

    // This is a placeholder for a real AI API call.
    setTimeout(() => {
        const questions = [
            `이 구절의 핵심 단어나 메시지는 무엇이라고 생각하나요?`,
            `이 말씀은 하나님에 대해, 또는 예수님에 대해 무엇을 알려주나요?`,
            `나 자신의 삶, 생각, 태도에 대해 무엇을 돌아보게 하나요?`,
            `이 말씀을 통해 오늘 하루 실천하거나 적용할 수 있는 것은 무엇일까요?`,
            `이 구절을 읽고 마음에 드는 기도 제목이 있다면 무엇인가요?`
        ];
        questionsDiv.innerHTML = '<h3>묵상 질문</h3><ul>' + questions.map(q => `<li>${q}</li>`).join('') + '</ul>';
    }, 1500); 
}


// --- Concordance Search --- //
let allBooksLoaded = false;

async function loadAllBibleData() {
    if (allBooksLoaded) return Promise.resolve();
    const resultsDiv = document.getElementById('concordanceResults');
    resultsDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 모든 성경 데이터를 불러오는 중입니다. 잠시만 기다려주세요...</p>';

    const bookPromises = Object.values(BOOK_TO_FILENAME).map(loadBookScript);
    try {
        await Promise.all(bookPromises);
        allBooksLoaded = true;
         resultsDiv.innerHTML = '<p>데이터 로딩 완료! 검색어를 입력하세요.</p>';
    } catch (error) {
        resultsDiv.innerHTML = '<p style="color: red;">데이터 로딩에 실패했습니다. 페이지를 새로고침하고 다시 시도해주세요.</p>';
        console.error("Error loading all bible data:", error);
    }
}

async function searchConcordance(keyword) {
    const resultsDiv = document.getElementById('concordanceResults');
    if (!keyword) {
        resultsDiv.innerHTML = '<p>검색할 단어를 입력해주세요.</p>';
        return;
    }
    
    await loadAllBibleData();
    if (!allBooksLoaded) return; // Stop if loading failed

    resultsDiv.innerHTML = `<p><i class="fas fa-search"></i> \"${keyword}\" 검색 중...</p>`;
    let findings = [];
    
    for (const [fullBookName, bookFileName] of Object.entries(BOOK_TO_FILENAME)) {
        const bookData = window.BIBLE_DATA[bookFileName];
        for (const chapter in bookData) {
            for (const verse in bookData[chapter]) {
                const verseText = bookData[chapter][verse];
                if (verseText.includes(keyword)) {
                    const reference = `${fullBookName} ${chapter}:${verse}`;
                    findings.push({ reference, text: verseText });
                }
            }
        }
    }

    if (findings.length > 0) {
        resultsDiv.innerHTML = findings.map((finding, index) => `
            <div class="result-item">
                <p><strong>${finding.reference}</strong>: ${finding.text.replace(new RegExp(keyword, 'g'), `<span class="highlight">${keyword}</span>`)}</p>
                <button class="add-to-sermon-btn" data-verse="${finding.reference}: ${finding.text}"><i class="fas fa-plus"></i> 설교에 추가</button>
            </div>
        `).join('');
    } else {
        resultsDiv.innerHTML = `<p>\"${keyword}\" 단어를 포함한 구절을 찾을 수 없습니다.</p>`;
    }
}

function addVerseToSermon(verseContent) {
    const verseTextarea = document.getElementById('sermonVerseText');
    if (verseTextarea.value.length > 0) {
        verseTextarea.value += '\n\n' + verseContent;
    } else {
        verseTextarea.value = verseContent;
    }
    showSection('sermon-notes', document.querySelector('a[onclick*="sermon-notes"]'));
    alert('성공적으로 추가되었습니다.');
}


// --- Event Listeners --- //
document.getElementById('verseSearchBtn').addEventListener('click', () => {
    const query = document.getElementById('verseSearchInput').value;
    if (query) searchVerse(query);
});

document.getElementById('verseSearchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchVerse(e.target.value);
});

document.getElementById('addVerseBtn').addEventListener('click', () => {
    const verseToAdd = document.getElementById('verseResultText').dataset.fullVerse;
    addVerseToSermon(verseToAdd);
    document.getElementById('verseSearchResult').style.display = 'none';
});

// Daily Verse
document.getElementById('getDailyVerseBtn').addEventListener('click', getDailyVerse);

// Meditation Helper
document.getElementById('meditationVerse').addEventListener('focus', () => {
    const sermonVerse = document.getElementById('sermonVerseText').value;
    if (sermonVerse && document.getElementById('meditationVerse').value === '') {
        document.getElementById('meditationVerse').value = sermonVerse;
    }
});

document.getElementById('concordanceSearchBtn').addEventListener('click', () => {
    const keyword = document.getElementById('concordanceSearchInput').value;
    searchConcordance(keyword);
});

document.getElementById('concordanceSearchInput').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchConcordance(e.target.value);
});

// Use event delegation for dynamically added buttons
document.getElementById('concordanceResults').addEventListener('click', e => {
    if (e.target.classList.contains('add-to-sermon-btn') || e.target.closest('.add-to-sermon-btn')) {
        const button = e.target.closest('.add-to-sermon-btn');
        addVerseToSermon(button.dataset.verse);
    }
});


function generateSermon() {
    alert("AI 설교 개요 생성 기능은 현재 개발 중입니다.");
}
