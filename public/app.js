// AI 성경 노트 - 핵심 로직 (정상 작동 버전)

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
        `[추천 1] ${topic}에 담긴 하나님의 은혜`,
        `[추천 2] ${topic}를 통한 믿음의 회복`,
        `[추천 3] 고난 속에서도 붙잡아야 할 ${topic}`
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
    currentSermonStep = 3;
    showSermonStep(3);
    updateSermonNavText();
}

function selectSermonTime(min) {
    currentSermonStep = 4;
    showSermonStep(4);
    updateSermonNavText();
    generateOutlinePreview();
}

function generateOutlinePreview() {
    const topic = document.getElementById('sermon-topic-input').value;
    const outline = `
        <div class="outline-item"><strong>1. 서론:</strong> ${topic}의 의미와 현대적 적용</div>
        <div class="outline-item"><strong>2. 본론:</strong> 믿음으로 승리하는 성도의 삶</div>
        <div class="outline-item"><strong>3. 결론:</strong> 기도로 나아가는 성도</div>
    `;
    document.getElementById('sermon-outline-display').innerHTML = outline;
    document.getElementById('sermon-outline').value = `1. 서론\n2. 본론\n3. 결론`;
}

function regenerateOutline() {
    generateOutlinePreview();
}

function proceedToStep5() {
    currentSermonStep = 5;
    showSermonStep(5);
    updateSermonNavText();
    
    const hymns = ['405장 나 같은 죄인 살리신', '213장 나의 생명 드리니'];
    document.getElementById('recommended-hymns').innerHTML = hymns.map(h => `<div class="tag">${h}</div>`).join('');
}

function proceedToFinalEdit() {
    showSermonStep('final');
    document.getElementById('sermon-nav').style.display = 'none';
}

function updateSermonNavText() {
    document.getElementById('current-step-text').innerText = `${currentSermonStep} / 5 단계`;
}

// 설교 저장 로직
function saveSermon() {
    const title = document.getElementById('sermon-title').value;
    if (!title) return alert('제목을 입력해 주세요.');
    
    const sermons = JSON.parse(localStorage.getItem('mySermons') || '[]');
    sermons.unshift({
        id: Date.now(),
        title: title,
        date: new Date().toLocaleDateString('ko-KR')
    });
    localStorage.setItem('mySermons', JSON.stringify(sermons));
    alert('설교가 저장되었습니다.');
    navigateTo('my-sermons');
}

// 내 설교 목록 불러오기 (정상 작동)
function loadMySermons() {
    const list = document.getElementById('my-sermons-list');
    if (!list) return;
    const sermons = JSON.parse(localStorage.getItem('mySermons') || '[]');
    if (sermons.length === 0) {
        list.innerHTML = '<div class="card" style="text-align:center;"><p>저장된 설교가 없습니다. 설교 작성을 시작해 보세요!</p></div>';
        return;
    }
    list.innerHTML = sermons.map(s => `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <h3>${s.title}</h3>
                <span style="color:#888; font-size:0.8rem;">${s.date}</span>
            </div>
            <button class="btn btn-sm" style="margin-top:10px;">상세보기</button>
        </div>
    `).join('');
}

// 게시판 로직
function loadBoardPosts() {
    const list = document.getElementById('board-posts-list');
    if (!list) return;
    const posts = [
        { category: '주일설교', title: '참된 소망의 근거', author: '관리자', date: '2026-02-21' },
        { category: '수요설교', title: '기도의 능력', author: '박전도사', date: '2026-02-20' }
    ];
    list.innerHTML = posts.map(p => `
        <div class="result-item" style="background:white; border-radius:10px; margin-bottom:10px; padding:15px; border-left:4px solid var(--primary-color);">
            <div style="font-size:0.8rem; color:var(--primary-color); font-weight:bold;">${p.category}</div>
            <h4 style="margin:5px 0;">${p.title}</h4>
            <div style="font-size:0.8rem; color:#888;">작성자: ${p.author} | ${p.date}</div>
        </div>
    `).join('');
}

// 오늘의 말씀
async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    container.innerHTML = '<p class="loading-text">말씀을 묵상하는 중...</p>';
    const recommended = ['psalms', 'proverbs', 'matthew', 'john', 'romans'];
    const randomKey = recommended[Math.floor(Math.random() * recommended.length)];

    try {
        const data = await loadBibleBook(randomKey);
        const chapters = Object.keys(data);
        const randChap = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(data[randChap]);
        const randVerse = verses[Math.floor(Math.random() * verses.length)];
        container.innerHTML = `
            <h3>${window.BIBLE_BOOKS[randomKey]} ${randChap}:${randVerse}</h3>
            <p style="font-size: 1.4rem; margin-top: 20px; line-height:1.6; color:var(--primary-color);">"${data[randChap][randVerse]}"</p>
        `;
    } catch (e) {
        container.innerHTML = '<p>말씀을 불러오지 못했습니다.</p>';
    }
}

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
    if (bookSelect && typeof bibleBooks !== 'undefined') {
        bibleBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
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
window.clearSermon = () => { if(confirm('초기화하시겠습니까?')) location.reload(); };
window.printSermon = () => window.print();
