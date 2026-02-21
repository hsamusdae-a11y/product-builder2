// AI 성경 노트 - 핵심 로직 (2026.02.21)

// ===== [1] 페이지 전환 및 네비게이션 =====
window.navigateTo = function(pageName) {
    console.log('[Nav] 페이지 이동:', pageName);
    
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    
    const target = document.getElementById(`page-${pageName}`);
    if (target) {
        target.classList.add('active');
        
        // 버튼 활성화 표시
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('onclick')?.includes(`'${pageName}'`)) {
                btn.classList.add('active');
            }
        });
        
        // 페이지별 초기화 로직
        if (pageName === 'daily') window.loadDailyVerse();
        
        window.scrollTo(0, 0);
    }
};

// ===== [2] 성경 데이터 동적 로드 엔진 =====
window.loadBibleBook = async function(bookId) {
    if (window.BIBLE_DATA && window.BIBLE_DATA[bookId]) return window.BIBLE_DATA[bookId];
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `bible/${bookId}.js`;
        script.onload = () => resolve(window.BIBLE_DATA[bookId]);
        script.onerror = () => reject(new Error(`${bookId} 데이터를 불러올 수 없습니다.`));
        document.head.appendChild(script);
    });
};

// ===== [3] 오늘의 말씀 (랜덤 추출) =====
window.loadDailyVerse = async function() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    
    container.innerHTML = '<h2>📖 오늘의 말씀</h2><p class="loading-text">말씀을 묵상하는 중...</p>';
    
    try {
        // 추천 도서 목록 (시편, 잠언, 복음서 등)
        const recommended = ['psalms', 'proverbs', 'matthew', 'mark', 'luke', 'john', 'romans'];
        const randomBookId = recommended[Math.floor(Math.random() * recommended.length)];
        
        const bookData = await window.loadBibleBook(randomBookId);
        const bookName = window.BIBLE_BOOKS[randomBookId];
        
        // 랜덤 장/절 선택
        const chapters = Object.keys(bookData);
        const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(bookData[randomChapter]);
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        const content = bookData[randomChapter][randomVerse];
        
        container.innerHTML = `
            <h2>📖 오늘의 말씀</h2>
            <div style="margin: 30px 0;">
                <p style="font-size: 1.4rem; font-weight: 500; color: var(--primary); margin-bottom: 20px;">
                    "${content}"
                </p>
                <p style="font-size: 1.1rem; color: #666;">
                    - ${bookName} ${randomChapter}장 ${randomVerse}절 -
                </p>
            </div>
            <button class="btn" onclick="window.loadDailyVerse()">다른 말씀 보기</button>
        `;
    } catch (e) {
        container.innerHTML = '<h2>📖 오늘의 말씀</h2><p>데이터를 불러오는 중 오류가 발생했습니다.</p>';
    }
};

// ===== [4] 용어사전 (외부 링크 통합) =====
window.searchWord = function() {
    const wordInput = document.getElementById('word-search');
    const word = wordInput?.value.trim();
    if (!word) return alert('검색할 용어를 입력하세요.');
    
    const results = document.getElementById('word-results');
    const encoded = encodeURIComponent(word);
    
    results.innerHTML = `
        <div class="card" style="border-left: 5px solid var(--primary); background: #fdfbff; margin-top: 20px;">
            <h4 style="margin-bottom: 15px;">🔍 '${word}'에 대한 전문 자료 검색</h4>
            <p style="font-size: 0.9rem; color: #666; margin-bottom: 20px;">
                정확한 신학적 의미 확인을 위해 공신력 있는 외부 사전으로 연결합니다.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <button class="btn" style="background: #4A5568;" onclick="window.open('https://www.bskorea.or.kr/prog/popup_term.php?s_word=${encoded}', 'KbsPop', 'width=750,height=850')">
                    대한성서공회
                </button>
                <button class="btn" style="background: #2D3748;" onclick="window.open('https://bible.goodtv.co.kr/bible/dictionary/search.do?search_text=${encoded}', '_blank')">
                    GoodTV 사전
                </button>
            </div>
        </div>
    `;
};

// ===== [5] 성구 검색 (기본 구현) =====
window.searchByKeyword = async function() {
    const query = document.getElementById('bible-search-input').value.trim();
    const results = document.getElementById('search-results');
    if (!query) return alert('검색어나 구절(예: 창 1:1)을 입력하세요.');
    
    results.innerHTML = '<p class="loading-text">검색 중...</p>';
    
    // 단순 구절 검색 (예: 창 1:1) 처리
    const match = query.match(/^([가-힣a-zA-Z]+)\s*(\d+)[:\s](\d+)$/);
    if (match) {
        const [_, bookName, chapter, verse] = match;
        const bookId = window.BIBLE_ABBREVIATIONS[bookName];
        
        if (bookId) {
            try {
                const bookData = await window.loadBibleBook(bookId);
                const content = bookData[chapter]?.[verse];
                if (content) {
                    results.innerHTML = `
                        <div class="card" style="margin-top:20px; border-left: 4px solid var(--primary);">
                            <strong>${window.BIBLE_BOOKS[bookId]} ${chapter}:${verse}</strong>
                            <p style="margin-top:10px;">${content}</p>
                        </div>
                    `;
                    return;
                }
            } catch (e) {}
        }
    }
    
    results.innerHTML = '<p>구절 형식이 아니거나 데이터를 찾을 수 없습니다. (예: "창 1:1" 형식으로 입력해 보세요)</p>';
};

// ===== [6] 설교 작성 및 기타 =====
window.generateSermonTitles = () => {
    const topic = document.getElementById('sermon-topic').value;
    if(!topic) return alert('주제를 입력하세요.');
    alert(`'${topic}' 주제로 설교 작성을 시작합니다. (AI 엔진 연결 중)`);
};

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('[System] 앱 초기화 완료');
    // 초기 페이지 설정
    if (window.location.hash) {
        const page = window.location.hash.substring(1);
        window.navigateTo(page);
    }
});
