// --- 전역 변수 및 초기화 ---
const navLinks = document.querySelectorAll('.nav-link');
const timeButtons = document.querySelectorAll('.time-btn');
let selectedTime = 10; // 기본값 10분

// --- 네비게이션 로직 ---
function showSection(sectionId, element) {
    event.preventDefault();
    const sections = document.querySelectorAll('section');
    sections.forEach(sec => sec.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');

    navLinks.forEach(link => link.classList.remove('active-nav'));
    if (element && !element.hasAttribute('target')) {
        element.classList.add('active-nav');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const introLink = document.querySelector('a[onclick*="intro"]');
    if (introLink) {
        showSection('intro', introLink);
    }
});

// --- 시간 선택 로직 ---
timeButtons.forEach(button => {
    button.addEventListener('click', () => {
        timeButtons.forEach(btn => btn.classList.remove('active-time'));
        button.classList.add('active-time');
        selectedTime = button.dataset.time;
    });
});

// --- 성경 구절 검색 로직 (Fetch API + CORS Proxy) ---
const verseSearchInput = document.getElementById('verseSearchInput');
const verseSearchBtn = document.getElementById('verseSearchBtn');
const verseSearchResult = document.getElementById('verseSearchResult');
const verseResultText = document.getElementById('verseResultText');
const addVerseBtn = document.getElementById('addVerseBtn');
const sermonVerseText = document.getElementById('sermonVerseText');

const bibleBookMap = {
    // Full Names
    "창세기": "Genesis", "출애굽기": "Exodus", "레위기": "Leviticus", "민수기": "Numbers", "신명기": "Deuteronomy",
    "여호수아": "Joshua", "사사기": "Judges", "룻기": "Ruth", "사무엘상": "1 Samuel", "사무엘하": "2 Samuel",
    "열왕기상": "1 Kings", "열왕기하": "2 Kings", "역대상": "1 Chronicles", "역대하": "2 Chronicles", "에스라": "Ezra",
    "느헤미야": "Nehemiah", "에스더": "Esther", "욥기": "Job", "시편": "Psalms", "잠언": "Proverbs",
    "전도서": "Ecclesiastes", "아가": "Song of Solomon", "이사야": "Isaiah", "예레미야": "Jeremiah",
    "예레미야애가": "Lamentations", "에스겔": "Ezekiel", "다니엘": "Daniel", "호세아": "Hosea", "요엘": "Joel",
    "아모스": "Amos", "오바댜": "Obadiah", "요나": "Jonah", "미가": "Micah", "나훔": "Nahum", "하박국": "Habakkuk",
    "스바냐": "Zephaniah", "학개": "Haggai", "스가랴": "Zechariah", "말라기": "Malachi",
    "마태복음": "Matthew", "마가복음": "Mark", "누가복음": "Luke", "요한복음": "John", "사도행전": "Acts",
    "로마서": "Romans", "고린도전서": "1 Corinthians", "고린도후서": "2 Corinthians", "갈라디아서": "Galatians",
    "에베소서": "Ephesians", "빌립보서": "Philippians", "골로새서": "Colossians", "데살로니가전서": "1 Thessalonians",
    "데살로니가후서": "2 Thessalonians", "디모데전서": "1 Timothy", "디모데후서": "2 Timothy", "디도서": "Titus",
    "빌레몬서": "Philemon", "히브리서": "Hebrews", "야고보서": "James", "베드로전서": "1 Peter",
    "베드로후서": "2 Peter", "요한1서": "1 John", "요한2서": "2 John", "요한3서": "3 John", "유다서": "Jude", "요한계시록": "Revelation",
    // Abbreviations
    "창": "Genesis", "출": "Exodus", "레": "Leviticus", "민": "Numbers", "신": "Deuteronomy",
    "수": "Joshua", "삿": "Judges", "룻": "Ruth", "삼상": "1 Samuel", "삼하": "2 Samuel", "왕상": "1 Kings", "왕하": "2 Kings",
    "대상": "1 Chronicles", "대하": "2 Chronicles", "스": "Ezra", "느": "Nehemiah", "에": "Esther",
    "욥": "Job", "시": "Psalms", "잠": "Proverbs", "전": "Ecclesiastes", "아": "Song of Solomon",
    "사": "Isaiah", "렘": "Jeremiah", "애": "Lamentations", "겔": "Ezekiel", "단": "Daniel",
    "호": "Hosea", "욜": "Joel", "암": "Amos", "옵": "Obadiah", "욘": "Jonah", "미": "Micah",
    "나": "Nahum", "합": "Habakkuk", "습": "Zephaniah", "학": "Haggai", "슥": "Zechariah", "말": "Malachi",
    "마": "Matthew", "막": "Mark", "눅": "Luke", "요": "John", "행": "Acts",
    "롬": "Romans", "고전": "1 Corinthians", "고후": "2 Corinthians", "갈": "Galatians",
    "엡": "Ephesians", "빌": "Philippians", "골": "Colossians", "살전": "1 Thessalonians", "살후": "2 Thessalonians",
    "딤전": "1 Timothy", "딤후": "2 Timothy", "딛": "Titus", "몬": "Philemon",
    "히": "Hebrews", "약": "James", "벧전": "1 Peter", "벧후": "2 Peter",
    "요일": "1 John", "요이": "2 John", "요삼": "3 John", "유": "Jude", "계": "Revelation"
};

async function searchVerse() {
    let originalQuery = verseSearchInput.value.trim();
    if (!originalQuery) {
        verseResultText.textContent = "검색할 구절을 입력하세요.";
        verseSearchResult.style.display = 'block';
        addVerseBtn.style.display = 'none';
        return;
    }

    let queryForApi = originalQuery;
    const sortedKoreanBooks = Object.keys(bibleBookMap).sort((a, b) => b.length - a.length);

    for (const koreanBook of sortedKoreanBooks) {
        if (originalQuery.startsWith(koreanBook)) {
            queryForApi = `${bibleBookMap[koreanBook]} ${originalQuery.substring(koreanBook.length).trim()}`;
            break;
        }
    }

    verseResultText.textContent = "검색 중...";
    verseSearchResult.style.display = 'block';
    addVerseBtn.style.display = 'none';

    const apiUrl = `https://bible-api.com/${encodeURIComponent(queryForApi)}?translation=ko-gae`;
    // Using a CORS proxy to bypass browser security restrictions
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${apiUrl}`;

    try {
        const response = await fetch(proxyUrl, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await response.json();

        if (response.ok) {
            if (data && data.text) {
                verseResultText.innerHTML = `<b>${data.reference} (개역개정)</b><br>${data.text.trim()}`;
                addVerseBtn.style.display = 'block';
            } else {
                throw new Error(data.error || 'API에서 유효한 구절 텍스트를 받지 못했습니다.');
            }
        } else {
            throw new Error(data.error || `서버 오류: ${response.status}`);
        }
    } catch (error) {
        console.error("성경 구절 검색 오류:", error);
        verseResultText.textContent = `오류: ${error.message}. 구절 형식을 확인하거나 잠시 후 다시 시도해주세요.`;
        addVerseBtn.style.display = 'none';
    }
}

verseSearchBtn.addEventListener('click', searchVerse);
verseSearchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVerse();
});

addVerseBtn.addEventListener('click', () => {
    const currentText = sermonVerseText.value.trim();
    const newVerseText = verseResultText.innerText.replace(' (개역개정)\n', '\n');
    const newVerse = `[${newVerseText.split('\n')[0]}]\n${newVerseText.substring(newVerseText.indexOf('\n') + 1)}`;

    sermonVerseText.value = currentText ? `${currentText}\n\n${newVerse}` : newVerse;
    sermonVerseText.scrollTop = sermonVerseText.scrollHeight;
});


// --- AI 설교 개요 생성 로직 ---
function generateSermon() {
    const topic = document.getElementById('sermonTopic').value;
    const verses = document.getElementById('sermonVerseText').value;

    if (!topic.trim() || !verses.trim()) {
        alert("설교 주제와 성경 구절을 모두 입력해 주세요.");
        return;
    }
    
    const firstVerse = verses.split('\n')[0];
    const title = `'${topic}'에 대한 설교 (${firstVerse})`;
    let intro, body, conclusion;

    if (selectedTime == 5) {
        intro = `오늘 본문 말씀(${firstVerse})을 중심으로 '${topic}'이라는 주제에 대해 잠시 은혜를 나누고자 합니다. 이 짧은 시간을 통해 말씀이 주는 핵심 교훈을 살펴보겠습니다.`;
        body = `본문은 우리에게 '${topic}'의 중요성을 강력하게 시사합니다. 기록된 구절들을 통해 우리는 하나님의 뜻을 더 깊이 이해할 수 있습니다. 핵심은...`;
        conclusion = `결론적으로, 오늘 말씀을 통해 우리는 '${topic}'의 의미를 되새겼습니다. 이 가르침을 마음판에 새기고 한 주간 승리하는 삶을 사시기를 축복합니다.`;
    } else if (selectedTime == 30) {
        intro = `오늘 우리가 함께 나눌 말씀은 ${firstVerse}이며, 이를 통해 '${topic}'이라는 주제를 심도있게 다루고자 합니다. 이 시간, 성령의 조명하심으로 말씀의 깊은 곳으로 함께 들어가기를 소망합니다. 서론에서는 이 주제가 오늘날 우리에게 왜 중요한지 그 배경을 짚어보겠습니다.`;
        body = `본론에서는 세 가지 대지로 나누어 말씀을 증거하겠습니다. 첫째, 본문 말씀들에서 '${topic}'이 어떻게 나타나는지 구체적인 구절을 통해 살펴보겠습니다. 둘째, 이 가르침을 우리 삶에 어떻게 적용할 수 있을지 실제적인 예시와 함께 나누겠습니다. 셋째, 이를 통해 우리가 얻게 되는 영적인 유익과 하나님의 약속은 무엇인지 확인하겠습니다.`;
        conclusion = `말씀을 맺겠습니다. 오늘 우리는 '${topic}'이라는 주제 아래 하나님의 귀한 말씀을 상고했습니다. 서론, 본론, 결론을 통해 살펴본 바와 같이, 이 말씀은 단순한 지식이 아니라 우리의 삶을 변화시키는 능력이 있습니다. 이 말씀을 붙잡고 세상으로 나아가 빛과 소금의 역할을 감당하는 저와 여러분 되시기를 주님의 이름으로 축원합니다.`;
    } else { // 10분 (기본)
        intro = `오늘 '${topic}'이라는 주제로, ${firstVerse} 말씀을 중심으로 하나님의 은혜를 나누겠습니다. 이 주제는 우리의 신앙 여정에서 매우 중요한 의미를 지닙니다.`;
        body = `본문은 '${topic}'에 대해 명확하게 교훈합니다. 성경 구절들을 연결하여 살펴보면, 우리는 하나님의 일관된 메시지를 발견할 수 있습니다. 이 메시지는 바로...`;
        conclusion = `이제 말씀을 정리합니다. '${topic}'은 우리에게 주시는 하나님의 귀한 선물입니다. 이 진리를 기억하며, 삶의 모든 영역에서 하나님께 영광 돌리는 복된 성도님들이 되시기를 바랍니다.`;
    }

    const resultArea = document.getElementById('resultArea');
    resultArea.style.display = 'block';
    document.getElementById('generatedTitle').innerText = title;
    document.getElementById('p1').innerText = intro;
    document.getElementById('p2').innerText = body;
    document.getElementById('p3').innerText = conclusion;
    
    resultArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// --- 설교문 복사 로직 ---
document.getElementById('copySermonBtn').addEventListener('click', () => {
    const title = document.getElementById('generatedTitle').innerText;
    const intro = document.getElementById('p1').innerText;
    const body = document.getElementById('p2').innerText;
    const conclusion = document.getElementById('p3').innerText;
    
    const fullSermon = `[설교 제목: ${title}]\n\n--- 서론 ---\n${intro}\n\n--- 본론 ---\n${body}\n\n--- 결론 ---\n${conclusion}`;

    navigator.clipboard.writeText(fullSermon).then(() => {
        alert('설교 개요가 클립보드에 복사되었습니다.');
    }).catch(err => {
        alert('복사에 실패했습니다.');
        console.error('Could not copy text: ', err);
    });
});
