// AI 성경 노트 - 핵심 로직 (AI 설교 개요 기능 추가 버전)

// ===== 전역 변수 =====
let currentPage = 'home';
let currentSermonStep = 1;
window.BIBLE_DATA = window.BIBLE_DATA || {};
const loadedBooks = {};

/**
 * 성경 데이터 로딩 함수
 */
async function loadBibleBook(bookKey) {
    if (loadedBooks[bookKey]) return window.BIBLE_DATA[bookKey];

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./bible/${bookKey}.js?v=${Date.now()}`;
        script.onload = () => {
            loadedBooks[bookKey] = true;
            resolve(window.BIBLE_DATA[bookKey]);
        };
        script.onerror = () => reject(new Error(`${bookKey} 로드 실패`));
        document.head.appendChild(script);
    });
}

// ===== 페이지 네비게이션 =====
function navigateTo(pageName) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        const targetBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        // 페이지별 초기화
        if (pageName === 'daily') loadDailyVerse();
        if (pageName === 'my-sermons') loadMySermons();
        if (pageName === 'board') loadBoardPosts();
        if (pageName === 'sermon') resetSermonFlow();
        
        window.scrollTo(0, 0);
    }
}

// ===== 설교 작성 플로우 로직 (1~5단계 전환) =====
function resetSermonFlow() {
    currentSermonStep = 1;
    showSermonStep(1);
    document.getElementById('sermon-nav').style.display = 'none';
    // Clear previous inputs
    document.getElementById('sermon-topic-input').value = '';
    document.getElementById('sermon-title').value = '';
    document.getElementById('sermon-outline-display').innerHTML = '';
    document.getElementById('sermon-outline').value = '';
}

function showSermonStep(step) {
    document.querySelectorAll('.sermon-step').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(`sermon-step-${step}`);
    if (target) target.classList.add('active');
    
    const finalEdit = document.getElementById('sermon-final-edit');
    if (step === 'final') {
        document.querySelectorAll('.sermon-step').forEach(s => s.classList.remove('active'));
        finalEdit.classList.add('active');
    }
}

// 1단계: 제목 추천
function generateSermonTitles() {
    const topic = document.getElementById('sermon-topic-input').value.trim();
    if (!topic) return alert('주제 또는 성구를 입력해 주세요.');
    
    const titles = [
        `[AI 추천 1] "${topic}"에 담긴 하나님의 은혜와 사랑`,
        `[AI 추천 2] "${topic}"를 통해 배우는 믿음의 길`,
        `[AI 추천 3] 절망 속에서 "${topic}"(을)를 붙잡는 법`
    ];
    
    const container = document.getElementById('title-options');
    container.innerHTML = titles.map(t => `
        <button class="title-btn" onclick="selectSermonTitle('${t}')">${t}</button>
    `).join('');
    
    currentSermonStep = 2;
    showSermonStep(2);
    document.getElementById('sermon-nav').style.display = 'flex';
    updateSermonNavText();
}

function selectSermonTitle(title) {
    document.getElementById('sermon-title').value = title;
    // 주제(본문) 필드도 채워주면 최종 편집 단계에서 편리합니다.
    const scripture = document.getElementById('sermon-topic-input').value.trim();
    document.getElementById('sermon-scripture').value = scripture;

    currentSermonStep = 3;
    showSermonStep(3);
    updateSermonNavText();
}

function selectSermonTime(min) {
    // 설교 시간은 나중에 분량 조절에 사용될 수 있으므로 저장해둡니다.
    // window.sermonTime = min; 
    currentSermonStep = 4;
    showSermonStep(4);
    updateSermonNavText();
    generateOutlinePreview(); // AI 개요 생성 호출
}

// --- AI 설교 개요 생성 기능 ---
/**
 * (시뮬레이션) AI가 설교 주제에 맞춰 개요를 생성합니다.
 * @param {string} topic 사용자가 입력한 설교 주제 또는 성경 구절
 * @returns {{htmlOutline: string, textOutline: string}} 표시용 HTML과 편집용 텍스트 개요
 */
function generateAIOuline(topic) {
    // 실제 AI라면 외부 API를 호출하겠지만, 여기서는 다양한 템플릿으로 시뮬레이션합니다.
    const templates = [
        {
            intro: `"${topic}"의 중요성과 현대 그리스도인에게 주는 의미`,
            body1: `첫째, 성경에서 말하는 "${topic}"의 본질 (관련 성구 탐색)`,
            body2: `둘째, 우리 삶에서 "${topic}"을 실천하는 구체적인 방법`,
            conclusion: `결론적으로, "${topic}"의 삶을 통해 하나님께 영광 돌리기`
        },
        {
            intro: `오늘날 우리가 "${topic}"(을)를 다시 붙잡아야 하는 이유`,
            body1: `첫째, "${topic}"(이)란 무엇인가? (정의와 개념 탐구)`,
            body2: `둘째, "${topic}"을 잃어버렸을 때 나타나는 영적 위기들`,
            conclusion: `다시 한번 "${topic}"의 은혜를 구하며 나아갑시다`
        },
        {
            intro: `본문 말씀을 통해 "${topic}"에 대한 새로운 시각을 발견합니다`,
            body1: `첫째, 본문이 말하는 "${topic}"의 배경과 문맥적 이해`,
            body2: `둘째, "${topic}"을 통해 우리에게 주시는 하나님의 약속`,
            conclusion: `약속의 말씀을 붙들고 "${topic}"을 이루는 삶을 삽시다`
        }
    ];

    // 템플릿 중 하나를 무작위로 선택하여 AI의 가변성을 흉내 냅니다.
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    const htmlOutline = `
        <div class="outline-item"><strong>서론:</strong> ${selectedTemplate.intro}</div>
        <div class="outline-item"><strong>본론 1:</strong> ${selectedTemplate.body1}</div>
        <div class="outline-item"><strong>본론 2:</strong> ${selectedTemplate.body2}</div>
        <div class="outline-item"><strong>결론:</strong> ${selectedTemplate.conclusion}</div>
    `;

    const textOutline = `서론: ${selectedTemplate.intro}

본론 1: ${selectedTemplate.body1}

본론 2: ${selectedTemplate.body2}

결론: ${selectedTemplate.conclusion}`;

    return { htmlOutline, textOutline };
}


function generateOutlinePreview() {
    const topic = document.getElementById('sermon-topic-input').value.trim();
    if (!topic) {
        alert("먼저 설교 주제를 입력해주세요.");
        resetSermonFlow(); // 주제가 없으면 1단계로 돌아갑니다.
        return;
    }
    
    document.getElementById('sermon-outline-display').innerHTML = '<p class="loading-text">AI가 설교 개요를 생성 중입니다...</p>';

    // AI 생성 시뮬레이션을 위해 약간의 딜레이를 줍니다.
    setTimeout(() => {
        const { htmlOutline, textOutline } = generateAIOuline(topic);
        
        document.getElementById('sermon-outline-display').innerHTML = htmlOutline;
        // 최종 편집기의 개요(textarea)에도 내용을 채워줍니다.
        document.getElementById('sermon-outline').value = textOutline;
    }, 1000); // 1초 딜레이
}


function regenerateOutline() {
    // "다시 생성" 버튼을 누르면 새로운 AI 개요를 즉시 생성합니다.
    generateOutlinePreview(); 
}

// --- AI 기능 종료 ---

function proceedToStep5() {
    currentSermonStep = 5;
    showSermonStep(5);
    updateSermonNavText();
    
    const hymns = [
        { title: '나 같은 죄인 살리신', code: '405장' },
        { title: '주 안에 있는 나에게', code: '370장' },
        { title: '내 영혼이 은총 입어', code: '438장' }
    ];
    document.getElementById('recommended-hymns').innerHTML = hymns.map(h => `<div class="tag">${h.code} ${h.title}</div>`).join('');
}

function proceedToFinalEdit() {
    showSermonStep('final');
    document.getElementById('sermon-nav').style.display = 'none';
}

function updateSermonNavText() {
    document.getElementById('current-step-text').innerText = `${currentSermonStep} / 5 단계`;
}

// (기존 나머지 코드는 동일)

// 설교 저장 로직
function saveSermon() {
    const title = document.getElementById('sermon-title').value;
    if (!title) return alert('제목을 입력해 주세요.');
    
    const sermons = JSON.parse(localStorage.getItem('mySermons') || '[]');
    sermons.unshift({
        id: Date.now(),
        title: title,
        scripture: document.getElementById('sermon-scripture').value,
        outline: document.getElementById('sermon-outline').value,
        content: document.getElementById('sermon-content').value,
        date: new Date().toLocaleDateString('ko-KR')
    });
    localStorage.setItem('mySermons', JSON.stringify(sermons));
    alert('설교가 저장되었습니다.');
    navigateTo('my-sermons');
}

// 내 설교 목록 불러오기
function loadMySermons() {
    const list = document.getElementById('my-sermons-list');
    if (!list) return;
    const sermons = JSON.parse(localStorage.getItem('mySermons') || '[]');
    if (sermons.length === 0) {
        list.innerHTML = '<div class="card" style="text-align:center;"><p>저장된 설교가 없습니다. 설교 작성을 시작해 보세요!</p></div>';
        return;
    }
    list.innerHTML = sermons.map(s => `
        <div class="card sermon-card" data-sermon-id="${s.id}">
            <div class="sermon-card-header">
                <h3>${s.title}</h3>
                <span class="sermon-date">${s.date}</span>
            </div>
            <p class="sermon-scripture">${s.scripture || '본문 없음'}</p>
            <div class="sermon-actions">
                <button class="btn btn-sm" onclick="viewSermon(${s.id})">상세보기</button>
                <button class="btn btn-sm btn-danger" onclick="deleteSermon(${s.id}, event)">삭제</button>
            </div>
        </div>
    `).join('');
}

// (기존 나머지 코드는 동일)
// 게시판 로직, 오늘의 말씀, 초기화 로직 등은 변경하지 않았습니다.
// ... 기존 코드 계속 ...


// 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 내비게이션
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => navigateTo(btn.dataset.page);
    });

    // 홈 화면 퀵 링크
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.onclick = () => navigateTo(card.getAttribute('data-navigate'));
    });
    
    // 성경 선택 드롭다운
    const bookSelect = document.getElementById('book-select');
    if (bookSelect && typeof window.BIBLE_BOOKS !== 'undefined') {
        // BIBLE_BOOKS가 정의되어 있는지 확인
    }


    // 엔터키 지원 (성구 사전)
    const keywordInput = document.getElementById('keyword-input');
    if (keywordInput) {
        keywordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (window.ExternalBibleTools) window.ExternalBibleTools.concordanceSearch();
            }
        });
    }

    if (typeof checkAuthStatus === 'function') checkAuthStatus();
});

// 전역 함수 노출
window.navigateTo = navigateTo;
window.generateSermonTitles = generateSermonTitles;
window.selectSermonTitle = selectSermonTitle;
window.selectSermonTime = selectSermonTime;
window.regenerateOutline = regenerateOutline;
window.proceedToStep5 = proceedToStep5;
window.proceedToFinalEdit = proceedToFinalEdit;
window.saveSermon = saveSermon;
window.loadDailyVerse = loadDailyVerse;
window.clearSermon = () => { if(confirm('작성 중인 내용을 모두 지우고 처음으로 돌아가시겠습니까?')) resetSermonFlow(); };
window.printSermon = () => window.print();

// bible-data.js 로딩 스크립트를 동적으로 추가하여 캐시 문제 방지
const bibleDataScript = document.createElement('script');
bibleDataScript.src = `bible-data.js?v=${Date.now()}`;
document.head.appendChild(bibleDataScript);

bibleDataScript.onload = () => {
    const bookSelect = document.getElementById('book-select');
    if (bookSelect && window.BIBLE_BOOKS) {
        window.BIBLE_BOOKS.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }
};

async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    container.innerHTML = '<p class="loading-text">말씀을 묵상하는 중...</p>';
    const recommended = ['psalms', 'proverbs', 'matthew', 'john', 'romans', 'ephesians', 'philippians'];
    const randomKey = recommended[Math.floor(Math.random() * recommended.length)];

    try {
        const data = await loadBibleBook(randomKey);
        const chapters = Object.keys(data);
        const randChap = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(data[randChap]);
        const randVerse = verses[Math.floor(Math.random() * verses.length)];
        
        // BIBLE_BOOKS가 로드되었는지 확인
        const bookName = window.BIBLE_BOOKS ? (window.BIBLE_BOOKS.find(b => b.id === randomKey)?.name || randomKey) : randomKey;

        container.innerHTML = `
            <h3>${bookName} ${randChap}:${randVerse}</h3>
            <p style="font-size: 1.4rem; margin-top: 20px; line-height:1.6; color:var(--primary-color);">"${data[randChap][randVerse]}"</p>
        `;
    } catch (e) {
        console.error(e);
        container.innerHTML = '<p>말씀을 불러오지 못했습니다. 다시 시도해 주세요.</p>';
    }
}
