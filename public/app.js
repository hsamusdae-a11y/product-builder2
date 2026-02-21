// ===== 전역 변수 =====
let currentPage = 'home';
let currentSermonStep = 1;
let selectedSermonTitle = '';
let selectedSermonTime = 0;
let generatedOutline = '';
let editingSermonId = null;

// 성경 데이터 로딩 상태
const loadedBooks = {};
window.BIBLE_DATA = window.BIBLE_DATA || {};

// 성경 데이터 로딩 함수
function loadBibleBook(bookKey) {
    return new Promise((resolve, reject) => {
        if (loadedBooks[bookKey]) {
            return resolve();
        }
        const timeout = setTimeout(() => {
            reject(new Error(`${bookKey}.js 로딩 시간 초과`));
        }, 5000);
        const script = document.createElement('script');
        script.src = `./bible/${bookKey}.js`;
        script.onload = () => {
            clearTimeout(timeout); 
            loadedBooks[bookKey] = true;
            resolve();
        };
        script.onerror = () => {
            clearTimeout(timeout); 
            reject(new Error(`${bookKey}.js 를 불러올 수 없습니다.`));
        };
        document.head.appendChild(script);
    });
}

// ===== 페이지 네비게이션 =====
function navigateTo(pageName) {
    // 모든 페이지 숨기기
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 모든 네비게이션 버튼 비활성화
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 선택한 페이지 보이기
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        
        // 해당 버튼 활성화
        const targetBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
        
        // 페이지별 초기화 로직
        if (pageName === 'daily') {
            loadDailyVerse();
        } else if (pageName === 'my-sermons') {
            loadMySermons();
        } else if (pageName === 'board') {
            loadBoardPosts();
        } else if (pageName === 'praise') {
            loadPopularHymns();
        } else if (pageName === 'guide') {
            loadBibleGuide();
        } else if (pageName === 'admin') {
            loadAdminData();
        } else if (pageName === 'sermon') {
            if (currentSermonStep === 1) goToSermonFirstStep();
        }
    }
}

// ===== 설교 작성용 성경 검색 (복구된 기능) =====
let lastSearchedVerseText = "";

async function searchVerseForSermon() {
    const query = document.getElementById('sermon-verse-search').value.trim();
    const resultDiv = document.getElementById('sermon-verse-result');
    const addBtn = document.getElementById('add-verse-to-sermon');
    
    if (!query) return;

    // "창 1:1" 형식 파싱
    const regex = /^(\d?\s*[가-힣]+|[a-zA-Z]+)\s*(\d+):(\d+)$/;
    const match = query.match(regex);

    if (!match) {
        resultDiv.textContent = "형식 오류 (예: 창 1:1)";
        addBtn.style.display = "none";
        return;
    }

    const bookInput = match[1].trim();
    const chapter = match[2];
    const verse = match[3];
    const bookKey = window.BIBLE_ABBREVIATIONS[bookInput];

    if (!bookKey) {
        resultDiv.textContent = "성경을 찾을 수 없습니다.";
        addBtn.style.display = "none";
        return;
    }

    resultDiv.textContent = "검색 중...";
    
    try {
        await loadBibleBook(bookKey);
        const bookName = window.BIBLE_BOOKS[bookKey];
        const bookData = window.BIBLE_DATA[bookKey];
        const verseText = bookData?.[chapter]?.[verse];

        if (verseText) {
            lastSearchedVerseText = `[${bookName} ${chapter}:${verse}] ${verseText}`;
            resultDiv.textContent = lastSearchedVerseText;
            addBtn.style.display = "block";
        } else {
            resultDiv.textContent = "해당 구절을 찾을 수 없습니다.";
            addBtn.style.display = "none";
        }
    } catch (e) {
        resultDiv.textContent = "오류 발생";
        console.error(e);
    }
}

function addVerseToSermonContent() {
    const contentArea = document.getElementById('sermon-content');
    if (lastSearchedVerseText && contentArea) {
        const currentContent = contentArea.value;
        contentArea.value = currentContent ? `${currentContent}\n\n${lastSearchedVerseText}` : lastSearchedVerseText;
        alert("본문에 추가되었습니다.");
    }
}

// ===== 관리자 기능 =====
function loadAdminData() {
    const currentUser = getAppCurrentUser();
    if (!currentUser || (typeof isAdmin === 'function' && !isAdmin(currentUser))) {
        alert('관리자 권한이 없습니다.');
        navigateTo('home');
        return;
    }

    // 회원 목록 로드
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userListContainer = document.getElementById('admin-user-list');
    
    if (users.length === 0) {
        userListContainer.innerHTML = '<p class="loading-text">등록된 회원이 없습니다.</p>';
    } else {
        userListContainer.innerHTML = users.map(user => `
            <div class="result-item" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${user.name}</strong> (${user.email})<br>
                    <small>${user.church || '소속 없음'} | ${user.position || '직분 없음'} | 레벨: ${user.level || 1}</small>
                </div>
                <div class="board-item-actions" style="margin-top: 0;">
                    <button class="btn btn-sm" onclick="changeUserLevel('${user.email}', ${(user.level || 1) + 1})">레벨UP</button>
                    <button class="btn btn-sm" onclick="changeUserLevel('${user.email}', ${(user.level || 1) - 1})">레벨DOWN</button>
                    ${user.isBanned ? 
                        `<button class="btn btn-sm" style="background: var(--success-color);" onclick="unbanUser('${user.email}')">밴 해제</button>` :
                        `<button class="btn btn-sm" style="background: var(--accent-color);" onclick="banUser('${user.email}')">🚫 강퇴</button>`
                    }
                </div>
            </div>
        `).join('');
    }

    // 통계 로드
    const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    document.getElementById('stat-sermons').textContent = sermons.length;
    document.getElementById('stat-posts').textContent = posts.length;
}

function changeUserLevel(email, newLevel) {
    if (newLevel < 1) newLevel = 1;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => {
        if (u.email === email) u.level = newLevel;
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminData();
    alert(`${email} 회원의 레벨이 ${newLevel}로 변경되었습니다.`);
}

function banUser(email) {
    if (email === 'hsamusdae@gmail.com') {
        alert('최고 관리자 계정은 강퇴할 수 없습니다.');
        return;
    }
    if (!confirm(`${email} 회원을 강제 퇴거(BAN)시키겠습니까? 해당 사용자는 재가입 및 로그인이 차단됩니다.`)) return;
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => {
        if (u.email === email) u.isBanned = true;
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminData();
    alert('정상적으로 차단되었습니다.');
}

function unbanUser(email) {
    if (!confirm(`${email} 회원의 차단을 해제하시겠습니까?`)) return;
    
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => {
        if (u.email === email) u.isBanned = false;
        return u;
    });
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminData();
    alert('차단이 해제되었습니다.');
}

// ===== DOM 로드 후 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    // 네비게이션 버튼 이벤트
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateTo(btn.dataset.page);
        });
    });
    
    // 빠른 링크 카드 이벤트
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.addEventListener('click', () => {
            const page = card.dataset.navigate;
            if (page) {
                navigateTo(page);
            }
        });
    });
    
    // 성경 책 선택 드롭다운 생성
    const bookSelect = document.getElementById('book-select');
    if (bookSelect && typeof bibleBooks !== 'undefined') {
        bibleBooks.forEach(book => {
            const option = document.createElement('option');
            option.value = book.id; // book.id 사용 (예: genesis)
            option.textContent = book.name;
            bookSelect.appendChild(option);
        });
    }
    
    // 로그인 상태 확인
    checkAuthStatus();

    // 성경 가이드 초기화
    loadBibleGuide();
});

// ===== 오늘의 말씀 =====
async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    
    container.innerHTML = '<p class="loading-text">말씀을 불러오는 중...</p>';

    // 모든 성경 책 목록에서 무작위로 하나를 선택합니다.
    const allBookKeys = Object.keys(window.BIBLE_BOOKS); 
    const randomBookKey = allBookKeys[Math.floor(Math.random() * allBookKeys.length)];

    try {
        await loadBibleBook(randomBookKey);
        const bookName = window.BIBLE_BOOKS[randomBookKey];
        const bookData = window.BIBLE_DATA[randomBookKey];

        if (!bookData) {
             throw new Error(`'${bookName}' 데이터 로드 실패`);
        }

        const chapterKeys = Object.keys(bookData);
        const randomChapterKey = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
        const chapterData = bookData[randomChapterKey];

        const verseKeys = Object.keys(chapterData);
        const randomVerseKey = verseKeys[Math.floor(Math.random() * verseKeys.length)];
        const verseText = chapterData[randomVerseKey];

        container.innerHTML = `
            <h3>${bookName} ${randomChapterKey}:${randomVerseKey}</h3>
            <p style="font-size: 1.2rem; line-height: 1.8; margin-top: 20px;">${verseText}</p>
        `;
    } catch (error) {
        console.error('오늘의 말씀 기능 오류:', error);
        container.innerHTML = `<p class="loading-text">오류: ${error.message}</p>`;
    }
}

// ===== 성구 검색 =====
async function searchVerse() {
    const bookKey = document.getElementById('book-select').value;
    const chapter = document.getElementById('chapter-input').value;
    const verse = document.getElementById('verse-input').value;
    const results = document.getElementById('search-results');
    
    if (!bookKey || !chapter || !verse) {
        results.innerHTML = '<p class="loading-text">성경 책, 장, 절을 모두 입력해주세요.</p>';
        return;
    }
    
    results.innerHTML = '<p class="loading-text">검색 중...</p>';

    try {
        await loadBibleBook(bookKey);
        const bookName = window.BIBLE_BOOKS[bookKey];
        const bookData = window.BIBLE_DATA[bookKey];
        const verseText = bookData?.[chapter]?.[verse];

        if (verseText) {
            results.innerHTML = `
                <div class="result-item">
                    <h4>${bookName} ${chapter}:${verse}</h4>
                    <p>${verseText}</p>
                </div>
            `;
        } else {
            results.innerHTML = '<p class="loading-text">해당 구절을 찾을 수 없습니다.</p>';
        }
    } catch (error) {
        console.error(error);
        results.innerHTML = `<p class="loading-text">오류: ${error.message}</p>`;
    }
}

// ===== 키워드 검색 (성구사전) =====
async function searchByKeyword() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const results = document.getElementById('search-results');
    
    if (!keyword || keyword.length < 2) {
        results.innerHTML = '<p class="loading-text">두 글자 이상의 단어를 입력해주세요.</p>';
        return;
    }
    
    results.innerHTML = '<p class="loading-text"><i class="fas fa-spinner fa-spin"></i> 성경 전체에서 검색 중입니다. 잠시만 기다려주세요...</p>';

    let foundVerses = [];
    const bookKeys = Object.keys(window.BIBLE_BOOKS);
    
    try {
        await Promise.all(bookKeys.map(key => loadBibleBook(key)));
        
        for (const key of bookKeys) {
            const bookName = window.BIBLE_BOOKS[key];
            const bookData = window.BIBLE_DATA[key];
            if (!bookData) continue;

            for (const chapterNum in bookData) {
                for (const verseNum in bookData[chapterNum]) {
                    const verseText = bookData[chapterNum][verseNum];
                    if (verseText.includes(keyword)) {
                        foundVerses.push({
                            book: bookName,
                            chapter: chapterNum,
                            verse: verseNum,
                            text: verseText
                        });
                    }
                }
            }
        }
        
        if (foundVerses.length === 0) {
            results.innerHTML = '<p class="loading-text">검색 결과가 없습니다.</p>';
            return;
        }

        const regex = new RegExp(keyword, 'g');
        results.innerHTML = `<h3>'${keyword}'에 대한 ${foundVerses.length}개의 검색 결과</h3>` + foundVerses.map(v => `
            <div class="result-item">
                <h4>${v.book} ${v.chapter}:${v.verse}</h4>
                <p>${v.text.replace(regex, `<span class="highlight" style="background-color: yellow; font-weight: bold;">${keyword}</span>`)}</p>
            </div>
        `).join('');
    } catch (error) {
        console.error('키워드 검색 중 오류:', error);
        results.innerHTML = `<p class="loading-text">오류: ${error.message}</p>`;
    }
}

// ===== 찬양 검색 =====
function searchHymn() {
    const query = document.getElementById('hymn-search-input').value.trim();
    const results = document.getElementById('hymn-results');
    
    if (!query) {
        results.innerHTML = '<p class="loading-text">찬송가 번호 또는 제목을 입력해주세요.</p>';
        return;
    }
    
    // 샘플 데이터
    const hymns = [
        { number: 405, title: '주의 친절한 팔에 안기세', category: '위로' },
        { number: 31, title: '찬양하라 복되신 구세주 예수', category: '찬양' },
        { number: 88, title: '내 주를 가까이', category: '기도' }
    ];
    
    const filtered = hymns.filter(h => 
        h.number.toString().includes(query) || h.title.includes(query)
    );
    
    if (filtered.length > 0) {
        results.innerHTML = filtered.map(h => `
            <div class="hymn-item">
                <div>
                    <strong>${h.number}장</strong> - ${h.title}
                    <span class="tag">${h.category}</span>
                </div>
                <button class="btn btn-sm" onclick="playHymn(${h.number})">재생</button>
            </div>
        `).join('');
    } else {
        results.innerHTML = '<p class="loading-text">검색 결과가 없습니다.</p>';
    }
}

function searchHymnByCategory(category) {
    const results = document.getElementById('hymn-results');
    results.innerHTML = `<p class="loading-text">"${category}" 카테고리의 찬송가를 검색하는 중...</p>`;
}

function loadPopularHymns() {
    const results = document.getElementById('hymn-results');
    const hymns = [
        { number: 405, title: '주의 친절한 팔에 안기세', category: '위로' },
        { number: 31, title: '찬양하라 복되신 구세주 예수', category: '찬양' },
        { number: 88, title: '내 주를 가까이', category: '기도' },
        { number: 369, title: '죄짐 맡은 우리 구주', category: '은혜' },
        { number: 488, title: '이 땅 위에 근심 있는 사람들아', category: '위로' }
    ];
    
    results.innerHTML = hymns.map(h => `
        <div class="hymn-item">
            <div>
                <strong>${h.number}장</strong> - ${h.title}
                <span class="tag">${h.category}</span>
            </div>
            <button class="btn btn-sm" onclick="playHymn(${h.number})">재생</button>
        </div>
    `).join('');
}

function playHymn(number) {
    alert(`찬송가 ${number}장을 재생합니다. (실제 운영 시 YouTube Music API 또는 찬송가 음원 API 연동)`);
}

// ===== 단어 사전 =====
function searchWord() {
    const word = document.getElementById('word-search').value.trim();
    if (!word) return;
    searchWordDirect(word);
}

async function searchWordDirect(word) {
    const results = document.getElementById('word-results');
    
    if (!word || word.length < 2) {
        results.innerHTML = '<p class="loading-text">두 글자 이상의 단어를 입력해주세요.</p>';
        return;
    }
    
    results.innerHTML = '<p class="loading-text">성경 전체에서 검색 중...</p>';

    let foundVerses = [];
    const bookKeys = Object.keys(window.BIBLE_BOOKS);
    
    try {
        await Promise.all(bookKeys.map(key => loadBibleBook(key)));
        
        for (const key of bookKeys) {
            const bookName = window.BIBLE_BOOKS[key];
            const bookData = window.BIBLE_DATA[key];
            if (!bookData) continue;

            for (const chapterNum in bookData) {
                for (const verseNum in bookData[chapterNum]) {
                    const verseText = bookData[chapterNum][verseNum];
                    if (verseText.includes(word)) {
                        foundVerses.push({
                            book: bookName,
                            chapter: chapterNum,
                            verse: verseNum,
                            text: verseText
                        });
                    }
                }
            }
        }
        
        if (foundVerses.length === 0) {
            results.innerHTML = `<p class="loading-text">"${word}"에 대한 검색 결과가 없습니다.</p>`;
            return;
        }

        const regex = new RegExp(word, 'g');
        results.innerHTML = `<h3>"${word}" 관련 성경 구절 (${foundVerses.length}건)</h3>` + foundVerses.slice(0, 100).map(v => `
            <div class="result-item">
                <h4>${v.book} ${v.chapter}:${v.verse}</h4>
                <p>${v.text.replace(regex, `<span class="highlight" style="background-color: yellow; font-weight: bold;">${word}</span>`)}</p>
            </div>
        `).join('') + (foundVerses.length > 100 ? '<p class="loading-text">결과가 많아 상위 100건만 표시합니다.</p>' : '');
    } catch (error) {
        console.error('단어 검색 중 오류:', error);
        results.innerHTML = `<p class="loading-text">오류: ${error.message}</p>`;
    }
}

// ===== 원어 성경 =====
function switchLanguage(lang) {
    // 탭 버튼 활성화
    document.querySelectorAll('#page-original .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const results = document.getElementById('original-results');
    if (lang === 'hebrew') {
        results.innerHTML = `
            <h3>히브리어 예시</h3>
            <div class="result-item">
                <h4>אֱלֹהִים (Elohim) - 하나님</h4>
                <p>창세기 1:1에 등장하는 하나님을 나타내는 히브리어</p>
            </div>
            <div class="result-item">
                <h4>שָׁלוֹם (Shalom) - 평화</h4>
                <p>평화, 안녕, 온전함을 의미하는 히브리어</p>
            </div>
        `;
    } else {
        results.innerHTML = `
            <h3>헬라어 예시</h3>
            <div class="result-item">
                <h4>Ἀγάπη (Agape) - 사랑</h4>
                <p>조건 없는 신성한 사랑을 의미하는 헬라어</p>
            </div>
            <div class="result-item">
                <h4>Πίστις (Pistis) - 믿음</h4>
                <p>신뢰와 확신을 의미하는 헬라어</p>
            </div>
        `;
    }
}

function searchOriginalWord() {
    const word = document.getElementById('original-word-search').value.trim();
    const results = document.getElementById('original-results');
    
    if (!word) {
        results.innerHTML = '<p class="loading-text">원어 단어를 입력해주세요.</p>';
        return;
    }
    
    results.innerHTML = `<p class="loading-text">"${word}"를 검색하는 중... (실제 운영 시 Strong's Concordance API 연동)</p>`;
}

// ===== 성경 지도 =====
function loadBibleGuide() {
    if (typeof bibleBooks === 'undefined') return;
    
    const oldBooks = bibleBooks.filter(b => b.testament === 'old');
    const newBooks = bibleBooks.filter(b => b.testament === 'new');
    
    const oldContainer = document.getElementById('old-testament-books');
    const newContainer = document.getElementById('new-testament-books');
    
    if (oldContainer) {
        oldContainer.innerHTML = oldBooks.map(b => `
            <div class="category-card" onclick="quickSearch('${b.id}', 1, 1)">
                <h4>${b.name}</h4>
                <p>${b.chapters} 장</p>
            </div>
        `).join('');
    }
    
    if (newContainer) {
        newContainer.innerHTML = newBooks.map(b => `
            <div class="category-card" onclick="quickSearch('${b.id}', 1, 1)">
                <h4>${b.name}</h4>
                <p>${b.chapters} 장</p>
            </div>
        `).join('');
    }
}

// 가이드에서 책 클릭 시 바로 검색해주는 유틸리티
function quickSearch(bookId, chapter, verse) {
    navigateTo('search');
    document.getElementById('book-select').value = bookId;
    document.getElementById('chapter-input').value = chapter;
    document.getElementById('verse-input').value = verse;
    searchVerse();
}

function showTestament(testament) {
    // 탭 버튼 활성화
    document.querySelectorAll('#page-guide .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // 구약/신약 전환
    if (testament === 'old') {
        document.getElementById('testament-old').style.display = 'block';
        document.getElementById('testament-new').style.display = 'none';
    } else {
        document.getElementById('testament-old').style.display = 'none';
        document.getElementById('testament-new').style.display = 'block';
    }
}

// ===== 설교 작성 - 단계별 네비게이션 =====
function showSermonStep(step) {
    document.querySelectorAll('.sermon-step').forEach(s => s.classList.remove('active'));
    const targetStep = document.getElementById(`sermon-step-${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentSermonStep = step;
        
        // 네비게이션 표시
        const nav = document.getElementById('sermon-nav');
        const stepText = document.getElementById('current-step-text');
        if (step > 1) {
            nav.style.display = 'flex';
            stepText.textContent = `현재 단계: ${step}/5`;
        } else {
            nav.style.display = 'none';
        }
    }
}

function goToSermonFirstStep() {
    showSermonStep(1);
    clearSermonData();
}

function goToSermonPreviousStep() {
    if (currentSermonStep > 1) {
        showSermonStep(currentSermonStep - 1);
    }
}

function clearSermonData() {
    document.getElementById('sermon-topic-input').value = '';
    selectedSermonTitle = '';
    selectedSermonTime = 0;
    generatedOutline = '';
}

// ===== 설교 작성 - 1단계: 제목 추천 =====
function generateSermonTitles() {
    const topic = document.getElementById('sermon-topic-input').value.trim();
    if (!topic) {
        alert('주제 또는 성경 구절을 입력해주세요.');
        return;
    }
    
    // AI 생성 시뮬레이션
    const titles = [
        `${topic}을 통해 본 하나님의 사랑`,
        `${topic}의 의미와 우리 삶의 적용`,
        `${topic}으로 인도하시는 주님`
    ];
    
    const container = document.getElementById('title-options');
    container.innerHTML = titles.map((title, idx) => `
        <div class="title-option" onclick="selectSermonTitle('${title}')">
            <strong>제목 ${idx + 1}:</strong> ${title}
        </div>
    `).join('');
    
    showSermonStep(2);
}

function selectSermonTitle(title) {
    selectedSermonTitle = title;
    document.querySelectorAll('.title-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    // 자동으로 다음 단계로
    setTimeout(() => showSermonStep(3), 500);
}

// ===== 설교 작성 - 3단계: 시간 선택 =====
function selectSermonTime(minutes) {
    selectedSermonTime = minutes;
    generateSermonOutline();
    showSermonStep(4);
}

// ===== 설교 작성 - 4단계: 3대지 생성 =====
function generateSermonOutline() {
    const outlines = {
        5: `서론: ${selectedSermonTitle}의 배경
본론 1: 첫 번째 핵심
본론 2: 두 번째 핵심
본론 3: 세 번째 핵심
결론: 적용과 다짐`,
        10: `서론: ${selectedSermonTitle}의 배경과 중요성
본론 1: 성경적 근거
본론 2: 역사적/문화적 맥락
본론 3: 현대적 적용
결론: 실천과 기도 제목`,
        30: `서론: ${selectedSermonTitle}의 배경과 중요성 (5분)
본론 1: 성경적 근거와 원어 분석 (8분)
본론 2: 역사적/문화적 맥락과 신학적 해석 (8분)
본론 3: 현대적 적용과 실천 방안 (8분)
결론: 종합, 실천 다짐, 기도 제목 (3분)`
    };
    
    generatedOutline = outlines[selectedSermonTime] || outlines[10];
    const display = document.getElementById('sermon-outline-display');
    display.textContent = generatedOutline;
}

function regenerateOutline() {
    generateSermonOutline();
}

function proceedToStep5() {
    loadRecommendedHymns();
    showSermonStep(5);
}

// ===== 설교 작성 - 5단계: 찬송가 추천 =====
function loadRecommendedHymns() {
    const hymns = [
        { number: 31, title: '찬양하라 복되신 구세주 예수' },
        { number: 88, title: '내 주를 가까이' },
        { number: 405, title: '주의 친절한 팔에 안기세' },
        { number: 369, title: '죄짐 맡은 우리 구주' },
        { number: 488, title: '이 땅 위에 근심 있는 사람들아' }
    ];
    
    const container = document.getElementById('recommended-hymns');
    container.innerHTML = hymns.map(h => `
        <div class="hymn-item">
            <div>
                <strong>${h.number}장</strong> - ${h.title}
            </div>
            <button class="btn btn-sm" onclick="playHymn(${h.number})">재생</button>
        </div>
    `).join('');
}

function proceedToFinalEdit() {
    // 최종 편집 폼에 데이터 채우기
    document.getElementById('sermon-title').value = selectedSermonTitle;
    document.getElementById('sermon-outline').value = generatedOutline;
    
    document.getElementById('sermon-final-edit').classList.add('active');
    document.querySelectorAll('.sermon-step').forEach(s => {
        if (s.id !== 'sermon-final-edit') {
            s.classList.remove('active');
        }
    });
    
    document.getElementById('sermon-nav').style.display = 'none';
}

// ===== 설교 저장 =====
function saveSermon() {
    const currentUser = getAppCurrentUser();
    if (!currentUser) {
        alert('로그인이 필요한 기능입니다.');
        const authPage = document.getElementById('auth-page');
        if (authPage) authPage.style.display = 'flex';
        return;
    }
    
    const title = document.getElementById('sermon-title').value.trim();
    const scripture = document.getElementById('sermon-scripture').value.trim();
    const outline = document.getElementById('sermon-outline').value.trim();
    const content = document.getElementById('sermon-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    const sermon = {
        id: editingSermonId || Date.now(),
        userId: currentUser.email,
        title,
        scripture,
        outline,
        content,
        date: new Date().toLocaleString('ko-KR'),
        lastModified: Date.now()
    };
    
    // localStorage에 저장
    let sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    
    if (editingSermonId) {
        // 수정
        sermons = sermons.map(s => s.id === editingSermonId ? sermon : s);
        alert('설교가 수정되었습니다!');
        editingSermonId = null;
    } else {
        // 새로 저장
        sermons.push(sermon);
        alert('설교가 저장되었습니다!');
    }
    
    localStorage.setItem('sermons', JSON.stringify(sermons));
    
    // 내 설교 페이지로 이동
    navigateTo('my-sermons');
}

// ===== 설교 인쇄 =====
function printSermon() {
    const title = document.getElementById('sermon-title').value.trim();
    const scripture = document.getElementById('sermon-scripture').value.trim();
    const outline = document.getElementById('sermon-outline').value.trim();
    const content = document.getElementById('sermon-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; }
                h1 { color: #6B46C1; border-bottom: 3px solid #6B46C1; padding-bottom: 10px; }
                h2 { color: #4A90E2; margin-top: 30px; }
                pre { white-space: pre-wrap; line-height: 1.8; }
            </style>
        </head>
        <body>
            <h1>${title}</h1>
            <p><strong>본문 말씀:</strong> ${scripture}</p>
            <h2>설교 개요</h2>
            <pre>${outline}</pre>
            <h2>설교 내용</h2>
            <pre>${content}</pre>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 100);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ===== 설교 다운로드 (TXT) =====
function downloadSermonTXT() {
    const title = document.getElementById('sermon-title').value.trim();
    const scripture = document.getElementById('sermon-scripture').value.trim();
    const outline = document.getElementById('sermon-outline').value.trim();
    const content = document.getElementById('sermon-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    const text = `
[설교 제목] ${title}

[본문 말씀] ${scripture}

[설교 개요]
${outline}

[설교 내용]
${content}

--
생성일: ${new Date().toLocaleString('ko-KR')}
    `;
    
    downloadFile(`${title}.txt`, text, 'text/plain');
}

// ===== 설교 다운로드 (JSON) =====
function downloadSermonJSON() {
    const title = document.getElementById('sermon-title').value.trim();
    const scripture = document.getElementById('sermon-scripture').value.trim();
    const outline = document.getElementById('sermon-outline').value.trim();
    const content = document.getElementById('sermon-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    const sermon = {
        title,
        scripture,
        outline,
        content,
        date: new Date().toISOString()
    };
    
    downloadFile(`${title}.json`, JSON.stringify(sermon, null, 2), 'application/json');
}

function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

// ===== 설교 초기화 =====
function clearSermon() {
    if (confirm('작성 중인 설교를 초기화하시겠습니까?')) {
        document.getElementById('sermon-title').value = '';
        document.getElementById('sermon-scripture').value = '';
        document.getElementById('sermon-outline').value = '';
        document.getElementById('sermon-content').value = '';
        editingSermonId = null;
        goToSermonFirstStep();
    }
}

// ===== 내 설교 관리 =====
function loadMySermons() {
    const currentUser = getAppCurrentUser();
    const container = document.getElementById('my-sermons-list');
    
    if (!currentUser) {
        if (container) {
            container.innerHTML = `
                <div class="loading-text">
                    <p>로그인하시면 작성하신 설교를 저장하고 관리하실 수 있습니다.</p>
                    <button class="btn btn-sm" style="margin-top:10px" onclick="document.getElementById('auth-page').style.display='flex'">로그인하기</button>
                </div>`;
        }
        return;
    }

    const allSermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const mySermons = allSermons.filter(s => s.userId === currentUser.email);
    
    if (mySermons.length === 0) {
        container.innerHTML = '<p class="loading-text">저장된 설교가 없습니다.</p>';
        return;
    }
    
    container.innerHTML = mySermons.map(sermon => `
        <div class="sermon-item">
            <h4>${sermon.title}</h4>
            <p><strong>본문:</strong> ${sermon.scripture || '없음'}</p>
            <p><small>${sermon.date}</small></p>
            <div class="sermon-item-actions">
                <button class="btn btn-sm" onclick="loadSermonToEdit(${sermon.id})">수정</button>
                <button class="btn btn-sm" onclick="viewSermon(${sermon.id})">보기</button>
                <button class="btn btn-sm" onclick="deleteMySermon(${sermon.id})">삭제</button>
                <button class="btn btn-sm" onclick="printSermonById(${sermon.id})">인쇄</button>
            </div>
        </div>
    `).join('');
}

function loadSermonToEdit(id) {
    const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const sermon = sermons.find(s => s.id === id);
    
    if (!sermon) return;
    
    // 폼에 데이터 채우기
    document.getElementById('sermon-title').value = sermon.title;
    document.getElementById('sermon-scripture').value = sermon.scripture || '';
    document.getElementById('sermon-outline').value = sermon.outline || '';
    document.getElementById('sermon-content').value = sermon.content || '';
    
    editingSermonId = id;
    
    // 최종 편집 화면으로 이동
    navigateTo('sermon');
    proceedToFinalEdit();
}

function viewSermon(id) {
    const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const sermon = sermons.find(s => s.id === id);
    
    if (!sermon) return;
    
    alert(`[${sermon.title}]\n\n본문: ${sermon.scripture}\n\n개요:\n${sermon.outline}\n\n내용:\n${sermon.content}`);
}

function deleteMySermon(id) {
    if (!confirm('이 설교를 삭제하시겠습니까?')) return;
    
    let sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    sermons = sermons.filter(s => s.id !== id);
    localStorage.setItem('sermons', JSON.stringify(sermons));
    
    loadMySermons();
}

function printSermonById(id) {
    const sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const sermon = sermons.find(s => s.id === id);
    
    if (!sermon) return;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${sermon.title}</title>
            <style>
                body { font-family: 'Malgun Gothic', sans-serif; padding: 40px; }
                h1 { color: #6B46C1; border-bottom: 3px solid #6B46C1; padding-bottom: 10px; }
                h2 { color: #4A90E2; margin-top: 30px; }
                pre { white-space: pre-wrap; line-height: 1.8; }
            </style>
        </head>
        <body>
            <h1>${sermon.title}</h1>
            <p><strong>본문 말씀:</strong> ${sermon.scripture}</p>
            <h2>설교 개요</h2>
            <pre>${sermon.outline}</pre>
            <h2>설교 내용</h2>
            <pre>${sermon.content}</pre>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 100);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// ===== 설교 게시판 =====
function loadBoardPosts() {
    const posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    displayBoardPosts(posts);
}

function displayBoardPosts(posts) {
    const container = document.getElementById('board-posts-list');
    
    if (posts.length === 0) {
        container.innerHTML = '<p class="loading-text">게시글이 없습니다.</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div class="board-item">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <span class="tag">${post.category}</span>
                    <h4>${post.title}</h4>
                    <p><strong>본문:</strong> ${post.scripture}</p>
                    <p style="color: var(--text-secondary); font-size: 0.9rem;">
                        작성자: ${post.author} | ${post.date} | 추천: ${post.recommendations || 0}
                    </p>
                </div>
            </div>
            <div class="board-item-actions">
                <button class="btn btn-sm" onclick="viewBoardPost(${post.id})">보기</button>
                <button class="btn btn-sm" onclick="recommendPost(${post.id})">👍 추천</button>
                ${canEditPost(post) ? `<button class="btn btn-sm" onclick="editBoardPost(${post.id})">수정</button>` : ''}
                ${canAdminDeletePost(post) ? `<button class="btn btn-sm" style="background: var(--accent-color);" onclick="deletePost(${post.id})">삭제</button>` : ''}
            </div>
        </div>
    `).join('');
}

// 수정 권한 확인 (본인만 가능)
function canEditPost(post) {
    const currentUser = getAppCurrentUser();
    if (!currentUser) return false;
    return post.userId === currentUser.email;
}

// 삭제 권한 확인 (관리자만 가능)
function canAdminDeletePost(post) {
    const currentUser = getAppCurrentUser();
    if (!currentUser) return false;
    if (typeof isAdmin === 'function' && isAdmin(currentUser)) return true;
    return false; // 일반 사용자는 본인 글이라도 삭제는 관리자에게 요청 (또는 원하시면 본인 삭제 허용 가능)
}

function filterBoardPosts() {
    const category = document.getElementById('board-category-filter').value;
    const allPosts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    
    if (category === 'all') {
        displayBoardPosts(allPosts);
    } else {
        const filtered = allPosts.filter(p => p.category === category);
        displayBoardPosts(filtered);
    }
}

function showBoardPostForm() {
    // 이미 수정 중인 상태에서 버튼(수정 취소)을 누르면 수정을 취소함
    if (editingPostId) {
        cancelBoardPost();
        return;
    }

    const currentUser = getAppCurrentUser();
    if (!currentUser) {
        alert('로그인이 필요한 기능입니다.');
        const authPage = document.getElementById('auth-page');
        if (authPage) authPage.style.display = 'flex';
        return;
    }
    
    if (!canPostToBoard(currentUser)) {
        alert('게시판 작성 권한이 없습니다. (추천 5개 이상 또는 레벨 2 이상 필요)');
        return;
    }
    
    // 폼 토글 (열려있으면 닫고, 닫혀있으면 엶)
    const form = document.getElementById('board-post-form');
    if (form.style.display === 'block') {
        cancelBoardPost();
    } else {
        form.style.display = 'block';
    }
}

function editBoardPost(id) {
    const posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    const post = posts.find(p => p.id === id);
    if (!post) return;

    // 폼에 기존 데이터 채우기
    document.getElementById('post-category').value = post.category;
    document.getElementById('post-title').value = post.title;
    document.getElementById('post-scripture').value = post.scripture;
    document.getElementById('post-content').value = post.content;
    
    editingPostId = id; // 수정 중인 ID 저장
    
    // 폼 보이기
    document.getElementById('board-post-form').style.display = 'block';
    document.getElementById('create-post-btn').textContent = '수정 취소';
    window.scrollTo(0, document.getElementById('board-post-form').offsetTop - 100);
}

function submitBoardPost() {
    const currentUser = getAppCurrentUser();
    if (!currentUser) return;
    
    const category = document.getElementById('post-category').value;
    const title = document.getElementById('post-title').value.trim();
    const scripture = document.getElementById('post-scripture').value.trim();
    const content = document.getElementById('post-content').value.trim();
    
    if (!title || !content) {
        alert('제목과 내용을 입력해주세요.');
        return;
    }
    
    let posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');

    if (editingPostId) {
        // 기존 글 수정
        posts = posts.map(p => {
            if (p.id === editingPostId) {
                return { ...p, category, title, scripture, content, lastModified: new Date().toLocaleString('ko-KR') };
            }
            return p;
        });
        alert('게시글이 수정되었습니다!');
        editingPostId = null;
    } else {
        // 새 글 등록
        const post = {
            id: Date.now(),
            userId: currentUser.email,
            author: currentUser.name,
            category,
            title,
            scripture,
            content,
            date: new Date().toLocaleString('ko-KR'),
            recommendations: 0
        };
        posts.unshift(post);
        alert('게시글이 등록되었습니다!');
    }
    
    localStorage.setItem('boardPosts', JSON.stringify(posts));
    cancelBoardPost();
    loadBoardPosts();
}

function cancelBoardPost() {
    document.getElementById('board-post-form').style.display = 'none';
    document.getElementById('post-title').value = '';
    document.getElementById('post-scripture').value = '';
    document.getElementById('post-content').value = '';
    document.getElementById('create-post-btn').textContent = '글쓰기';
    editingPostId = null;
}

function viewBoardPost(id) {
    const posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    const post = posts.find(p => p.id === id);
    
    if (!post) return;
    
    alert(`[${post.title}]\n\n카테고리: ${post.category}\n본문: ${post.scripture}\n작성자: ${post.author}\n작성일: ${post.date}\n\n내용:\n${post.content}`);
}

function recommendPost(id) {
    let posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    posts = posts.map(p => {
        if (p.id === id) {
            p.recommendations = (p.recommendations || 0) + 1;
        }
        return p;
    });
    localStorage.setItem('boardPosts', JSON.stringify(posts));
    loadBoardPosts();
}

function deletePost(id) {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    
    let posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem('boardPosts', JSON.stringify(posts));
    loadBoardPosts();
}

// ===== 음성 명령 =====
function startVoiceCommand() {
    const btn = document.getElementById('voice-btn');
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome이나 Edge를 사용해주세요.');
        return;
    }
    
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'ko-KR';
    recognition.continuous = false;
    
    btn.classList.add('listening');
    
    recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        btn.classList.remove('listening');
        processVoiceCommand(command);
    };
    
    recognition.onerror = () => {
        btn.classList.remove('listening');
        alert('음성 인식에 실패했습니다. 다시 시도해주세요.');
    };
    
    recognition.onend = () => {
        btn.classList.remove('listening');
    };
    
    recognition.start();
}

function processVoiceCommand(command) {
    if (command.includes('찬양') || command.includes('찬송가')) {
        navigateTo('praise');
        if (command.match(/\d+/)) {
            const number = command.match(/\d+/)[0];
            document.getElementById('hymn-search-input').value = number;
            searchHymn();
        }
    } else if (command.includes('성구') || command.includes('말씀')) {
        navigateTo('search');
    } else if (command.includes('뜻') || command.includes('의미')) {
        navigateTo('notes');
    } else if (command.includes('원어')) {
        navigateTo('original');
    } else if (command.includes('설교')) {
        navigateTo('sermon');
    } else if (command.includes('오늘')) {
        navigateTo('daily');
    } else {
        alert(`"${command}" 명령을 인식하지 못했습니다.`);
    }
}

// ===== 유틸리티 함수 =====
function getAppCurrentUser() {
    // 1. 전역 변수 확인 (가장 빠르고 확실함)
    if (window.currentUser) {
        return window.currentUser;
    }
    
    // 2. auth.js의 getter 함수 확인
    if (typeof getCurrentUser === 'function') {
        const user = getCurrentUser();
        if (user) {
            window.currentUser = user; // 동기화
            return user;
        }
    }
    
    // 3. localStorage 직접 확인 (마지막 수단)
    const userSession = localStorage.getItem('currentUser');
    if (userSession) {
        try {
            if (userSession.startsWith('{')) {
                const user = JSON.parse(userSession);
                window.currentUser = user;
                return user;
            } else {
                // 단순 이메일 문자열인 경우
                const user = { email: userSession, name: '사용자', position: '성도' };
                window.currentUser = user;
                return user;
            }
        } catch (e) {
            console.error("Session parse error", e);
        }
    }
    
    return null;
}
