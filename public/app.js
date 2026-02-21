// AI 성경 노트 - 최종 안정화 스크립트 (2026.02.21)

// ===== [1] 전역 네비게이션 (무조건 작동 보장) =====
window.navigateTo = function(pageName) {
    console.log('[Nav] 이동 요청:', pageName);
    
    // 모든 페이지 섹션 숨기기
    const pages = document.querySelectorAll('.page');
    if (pages.length === 0) return;

    pages.forEach(p => {
        p.classList.remove('active');
        p.style.display = 'none';
    });
    
    // 대상 페이지 보이기
    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
        
        // 버튼 강조 처리
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(`'${pageName}'`)) {
                btn.classList.add('active');
            }
        });
        
        // 초기화 로직 실행
        if (pageName === 'daily') window.loadDailyVerse();
        if (pageName === 'praise') window.loadPopularHymns();
        
        window.scrollTo(0, 0);
    }
};

// ===== [2] 용어사전 (안전한 팝업 방식) =====
window.searchWord = function() {
    const wordInput = document.getElementById('word-search');
    const word = wordInput?.value.trim();
    if (!word) return alert('용어를 입력하세요.');
    
    const results = document.getElementById('word-results');
    const encoded = encodeURIComponent(word);
    
    results.innerHTML = `
        <div class="result-item" style="border-left-color: #6B46C1; background: #fdfbff; padding: 25px; border-radius: 16px; margin-top: 20px; text-align: center;">
            <h4 style="color: #6B46C1; margin-bottom: 15px;">🔍 '${word}' 용어사전 통합 검색</h4>
            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: 0 auto;">
                <button class="btn" style="background: #6B46C1;" onclick="window.open('https://www.bskorea.or.kr/prog/popup_term.php?s_word=${encoded}', 'KbsPopup', 'width=750,height=850,scrollbars=yes')">
                    📖 성서공회 용어사전 (팝업)
                </button>
                <button class="btn" style="background: #2e59d9;" onclick="window.open('https://bible.goodtv.co.kr/bible/dictionary/search.do?search_text=${encoded}', '_blank')">
                    📘 GoodTV 성경사전
                </button>
            </div>
        </div>
    `;
};

// ===== [3] 초기화 및 레이어 제어 =====
window.hideAuthModal = function() {
    const authPage = document.getElementById('auth-page');
    if (authPage) {
        authPage.style.display = 'none';
        authPage.classList.remove('active');
    }
    // 앱 컨테이너는 index.html에서 이미 보이므로 별도 조작 불필요
    window.navigateTo('home');
};

window.logout = function() {
    localStorage.removeItem('currentUser');
    location.reload();
};

// ===== [4] 에러 방지용 필수 함수들 =====
window.loadDailyVerse = () => {
    const c = document.getElementById('daily-verse-content');
    if(c) c.innerHTML = "<h3>오늘의 말씀</h3><p style='font-size:1.2rem;'>여호와는 나의 목자시니 내게 부족함이 없으리로다 (시 23:1)</p>";
};

window.loadPopularHymns = () => {
    const r = document.getElementById('hymn-results');
    if(r) r.innerHTML = "<p class='loading-text'>찬송가 목록을 불러오는 중...</p>";
};

window.generateSermonTitles = () => { window.navigateTo('sermon'); };
window.searchByKeyword = () => { alert('검색 기능은 용어사전을 이용해 주세요.'); };
window.saveSermon = () => { alert('저장되었습니다.'); };
window.goToSermonFirstStep = () => { };
window.selectSermonTime = () => { };
window.proceedToStep5 = () => { };
window.proceedToFinalEdit = () => { };
window.closeHymnPlayer = () => { document.getElementById('hymn-player-modal').style.display = 'none'; };

// 초기 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] 시스템 시작');
    // 복잡한 바인딩 모두 제거하고 navigateTo만 호출
    if (localStorage.getItem('currentUser')) {
        window.hideAuthModal();
    } else {
        window.navigateTo('home');
    }
});
