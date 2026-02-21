// AI 성경 노트 - 핵심 로직 (안정화 버전)

// ===== 전역 변수 =====
let currentPage = 'home';
let currentSermonStep = 1;
window.BIBLE_DATA = window.BIBLE_DATA || {};
const loadedBooks = {};

/**
 * 성경 데이터 로딩 함수 (캐시 무력화 및 비동기 처리 개선)
 */
async function loadBibleBook(bookKey) {
    if (loadedBooks[bookKey]) return window.BIBLE_DATA[bookKey];

    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        // 캐시 방지를 위해 타임스탬프 추가
        script.src = `./bible/${bookKey}.js?v=${Date.now()}`;
        script.onload = () => {
            loadedBooks[bookKey] = true;
            console.log(`[Data] ${bookKey} 로드 완료`);
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
        
        // 페이지별 데이터 로드
        if (pageName === 'daily') loadDailyVerse();
        if (pageName === 'my-sermons') loadMySermons();
        if (pageName === 'board') loadBoardPosts();
        if (pageName === 'guide') loadBibleGuide();
        window.scrollTo(0, 0);
    }
}

// ===== 성구 사전 검색 (구형 함수를 신형으로 리다이렉트) =====
async function searchByKeyword() {
    if (window.ExternalBibleTools && window.ExternalBibleTools.concordanceSearch) {
        return window.ExternalBibleTools.concordanceSearch();
    }
    alert('검색 엔진을 로드 중입니다. 잠시 후 다시 시도해 주세요.');
}

// ===== 오늘의 말씀 =====
async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    container.innerHTML = '<p class="loading-text">말씀을 묵상하는 중...</p>';

    const recommended = ['psalms', 'proverbs', 'matthew', 'mark', 'luke', 'john', 'romans', 'acts'];
    const randomKey = recommended[Math.floor(Math.random() * recommended.length)];

    try {
        const data = await loadBibleBook(randomKey);
        const chapters = Object.keys(data);
        const randChap = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(data[randChap]);
        const randVerse = verses[Math.floor(Math.random() * verses.length)];
        
        container.innerHTML = `
            <h3>${window.BIBLE_BOOKS[randomKey]} ${randChap}:${randVerse}</h3>
            <p style="font-size: 1.3rem; margin-top: 20px;">"${data[randChap][randVerse]}"</p>
        `;
    } catch (e) {
        container.innerHTML = '<p>말씀을 불러오지 못했습니다.</p>';
    }
}

// (기타 보조 함수들 유지...)
function checkAuthStatus() { if(typeof checkSession === 'function') checkSession(); }
function getAppCurrentUser() { return window.currentUser; }

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => navigateTo(btn.dataset.page);
    });
    
    // 성경 책 선택 드롭다운 생성
    const bookSelect = document.getElementById('book-select');
    if (bookSelect && typeof bibleBooks !== 'undefined') {
        bibleBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id;
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }
    
    checkAuthStatus();
});

// 기존 호환성 유지용 (index.html에서 직접 호출하는 경우)
window.loadDailyVerse = loadDailyVerse;
window.navigateTo = navigateTo;
window.searchByKeyword = searchByKeyword;
