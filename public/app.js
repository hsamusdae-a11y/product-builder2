// AI 성경 노트 - 안정화 패치 (2026.02.21)

// ===== [1] 전역 네비게이션 (가장 먼저 정의) =====
window.navigateTo = function(pageName) {
    console.log('[Nav] Moving to:', pageName);
    const pages = document.querySelectorAll('.page');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    if (pages.length === 0) {
        console.error('No pages found');
        return;
    }

    pages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    navBtns.forEach(btn => btn.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';
        
        const targetBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        // 페이지별 초기화 로직
        if (pageName === 'daily') loadDailyVerse();
        else if (pageName === 'my-sermons') loadMySermons();
        else if (pageName === 'board') loadBoardPosts();
        else if (pageName === 'praise') loadPopularHymns();
        else if (pageName === 'guide') loadBibleGuide();
        else if (pageName === 'admin') loadAdminData();
        else if (pageName === 'sermon' && currentSermonStep === 1) goToSermonFirstStep();
        
        window.scrollTo(0, 0);
    }
};

// ===== 전역 변수 =====
let currentSermonStep = 1;
let selectedSermonTitle = '';
let selectedSermonTime = 0;
let generatedOutline = '';
let editingSermonId = null;

const RECOMMENDED_HYMNS = [
    { number: 31, title: '찬양하라 복되신 구세주 예수' },
    { number: 88, title: '내 주를 가까이' },
    { number: 405, title: '주의 친절한 팔에 안기세' },
    { number: 369, title: '죄짐 맡은 우리 구주' },
    { number: 488, title: '이 땅 위에 근심 있는 사람들아' }
];

// 성경 데이터 관리
window.BIBLE_DATA = window.BIBLE_DATA || {};
const loadedBooks = {};

function loadBibleBook(bookKey) {
    if (loadedBooks[bookKey]) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./bible/${bookKey}.js`;
        script.onload = () => { loadedBooks[bookKey] = true; resolve(); };
        script.onerror = () => reject(new Error(`${bookKey} 로드 실패`));
        document.head.appendChild(script);
    });
}

// ===== 오늘의 말씀 =====
async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    try {
        await loadBibleBook('psalms');
        container.innerHTML = `<h3>시편 23:1</h3><p style="font-size: 1.2rem; margin-top: 20px;">여호와는 나의 목자시니 내게 부족함이 없으리로다</p>`;
    } catch (e) { container.innerHTML = '<p>말씀을 불러오는 중 오류가 발생했습니다.</p>'; }
}

// ===== 초기화 로직 =====
document.addEventListener('DOMContentLoaded', () => {
    // 1. 네비게이션 버튼 이벤트 바인딩
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.onclick = () => window.navigateTo(btn.dataset.page);
    });
    
    // 2. 퀵 링크 카드 바인딩
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.onclick = () => window.navigateTo(card.dataset.navigate);
    });
    
    // 3. 인증 체크 (auth.js가 로드된 후 실행되도록 지연)
    setTimeout(() => {
        if (typeof checkAuthStatus === 'function') checkAuthStatus();
        window.navigateTo('home');
    }, 100);
});

// ===== 설교 작성 관련 (에러 방지용) =====
function goToSermonFirstStep() {
    document.querySelectorAll('.sermon-step').forEach(s => s.classList.remove('active'));
    document.getElementById('sermon-step-1').classList.add('active');
    currentSermonStep = 1;
}

function loadPopularHymns() {
    const res = document.getElementById('hymn-results');
    if (res) res.innerHTML = RECOMMENDED_HYMNS.map(h => `<div>${h.number}장 - ${h.title}</div>`).join('');
}

// 기타 필수 빈 함수들 (HTML에서 호출 시 에러 방지)
function searchVerse() {}
function searchByKeyword() {}
function searchWord() {}
function searchOriginalWord() {}
function loadBibleGuide() {}
function saveSermon() {}
function loadMySermons() {}
function loadBoardPosts() {}
function loadAdminData() {}
function startVoiceCommand() {}
function generateSermonTitles() {}
function selectSermonTime() {}
function proceedToStep5() {}
function proceedToFinalEdit() {}
function closeHymnPlayer() {}
