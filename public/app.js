// ===== 전역 변수 =====
let currentPage = 'home';
let currentSermonStep = 1;
let selectedSermonTitle = '';
let selectedSermonTime = 0;
let generatedOutline = '';
let editingSermonId = null;

// 추천 찬송가 데이터 (5단계 및 최종 전송용)
const RECOMMENDED_HYMNS = [
    { number: 31, title: '찬양하라 복되신 구세주 예수' },
    { number: 88, title: '내 주를 가까이' },
    { number: 405, title: '주의 친절한 팔에 안기세' },
    { number: 369, title: '죄짐 맡은 우리 구주' },
    { number: 488, title: '이 땅 위에 근심 있는 사람들아' }
];

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
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetPage = document.getElementById(`page-${pageName}`);
    if (targetPage) {
        targetPage.classList.add('active');
        currentPage = pageName;
        const targetBtn = document.querySelector(`[data-page="${pageName}"]`);
        if (targetBtn) targetBtn.classList.add('active');
        
        if (pageName === 'daily') loadDailyVerse();
        else if (pageName === 'my-sermons') loadMySermons();
        else if (pageName === 'board') loadBoardPosts();
        else if (pageName === 'praise') loadPopularHymns();
        else if (pageName === 'guide') loadBibleGuide();
        else if (pageName === 'admin') loadAdminData();
        else if (pageName === 'sermon' && currentSermonStep === 1) goToSermonFirstStep();
    }
}

// ===== 설교 작성용 성경 검색 =====
let lastSearchedVerseText = "";

async function searchVerseForSermon() {
    const query = document.getElementById('sermon-verse-search').value.trim();
    const resultDiv = document.getElementById('sermon-verse-result');
    const addBtn = document.getElementById('add-verse-to-sermon');
    
    if (!query) return;
    const regex = /^(\d?\s*[가-힣]+|[a-zA-Z]+)\s*(\d+):(\d+)$/;
    const match = query.match(regex);

    if (!match) {
        resultDiv.textContent = "형식 오류 (예: 창 1:1)";
        addBtn.style.display = "none";
        return;
    }

    const bookKey = window.BIBLE_ABBREVIATIONS[match[1].trim()];
    if (!bookKey) {
        resultDiv.textContent = "성경을 찾을 수 없습니다.";
        addBtn.style.display = "none";
        return;
    }

    resultDiv.textContent = "검색 중...";
    try {
        await loadBibleBook(bookKey);
        const bookName = window.BIBLE_BOOKS[bookKey];
        const verseText = window.BIBLE_DATA[bookKey]?.[match[2]]?.[match[3]];

        if (verseText) {
            lastSearchedVerseText = `[${bookName} ${match[2]}:${match[3]}] ${verseText}`;
            resultDiv.textContent = lastSearchedVerseText;
            addBtn.style.display = "block";
        } else {
            resultDiv.textContent = "해당 구절을 찾을 수 없습니다.";
            addBtn.style.display = "none";
        }
    } catch (e) {
        resultDiv.textContent = "오류 발생";
    }
}

function addVerseToSermonContent() {
    const contentArea = document.getElementById('sermon-content');
    if (lastSearchedVerseText && contentArea) {
        contentArea.value = contentArea.value ? `${contentArea.value}\n\n${lastSearchedVerseText}` : lastSearchedVerseText;
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
                <div class="board-item-actions">
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
    if (email === 'hsamusdae@gmail.com') return alert('최고 관리자 계정은 강퇴할 수 없습니다.');
    if (!confirm(`${email} 회원을 강제 퇴거(BAN)시키겠습니까?`)) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => { if (u.email === email) u.isBanned = true; return u; });
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminData();
}

function unbanUser(email) {
    if (!confirm(`${email} 회원의 차단을 해제하시겠습니까?`)) return;
    let users = JSON.parse(localStorage.getItem('users') || '[]');
    users = users.map(u => { if (u.email === email) u.isBanned = false; return u; });
    localStorage.setItem('users', JSON.stringify(users));
    loadAdminData();
}

// ===== DOM 로드 후 초기화 =====
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.page));
    });
    
    document.querySelectorAll('.quick-link-card').forEach(card => {
        card.addEventListener('click', () => {
            const page = card.dataset.navigate;
            if (page) navigateTo(page);
        });
    });
    
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
    loadBibleGuide();
});

// ===== 오늘의 말씀 =====
async function loadDailyVerse() {
    const container = document.getElementById('daily-verse-content');
    if (!container) return;
    container.innerHTML = '<p class="loading-text">말씀을 불러오는 중...</p>';

    const allBookKeys = Object.keys(window.BIBLE_BOOKS); 
    const randomBookKey = allBookKeys[Math.floor(Math.random() * allBookKeys.length)];

    try {
        await loadBibleBook(randomBookKey);
        const bookData = window.BIBLE_DATA[randomBookKey];
        const chapters = Object.keys(bookData);
        const ch = chapters[Math.floor(Math.random() * chapters.length)];
        const verses = Object.keys(bookData[ch]);
        const vs = verses[Math.floor(Math.random() * verses.length)];

        container.innerHTML = `
            <h3>${window.BIBLE_BOOKS[randomBookKey]} ${ch}:${vs}</h3>
            <p style="font-size: 1.2rem; line-height: 1.8; margin-top: 20px;">${bookData[ch][vs]}</p>
        `;
    } catch (e) {
        container.innerHTML = `<p class="loading-text">오류: ${e.message}</p>`;
    }
}

// ===== 성구 검색 =====
async function searchVerse() {
    const bookKey = document.getElementById('book-select').value;
    const chapter = document.getElementById('chapter-input').value;
    const verse = document.getElementById('verse-input').value;
    const results = document.getElementById('search-results');
    
    if (!bookKey || !chapter || !verse) return results.innerHTML = '<p class="loading-text">모두 입력해주세요.</p>';
    results.innerHTML = '<p class="loading-text">검색 중...</p>';

    try {
        await loadBibleBook(bookKey);
        const text = window.BIBLE_DATA[bookKey]?.[chapter]?.[verse];
        if (text) {
            results.innerHTML = `<div class="result-item"><h4>${window.BIBLE_BOOKS[bookKey]} ${chapter}:${verse}</h4><p>${text}</p></div>`;
        } else {
            results.innerHTML = '<p class="loading-text">찾을 수 없습니다.</p>';
        }
    } catch (e) {
        results.innerHTML = `<p class="loading-text">오류: ${e.message}</p>`;
    }
}

async function searchByKeyword() {
    const keyword = document.getElementById('keyword-input').value.trim();
    const results = document.getElementById('search-results');
    if (!keyword || keyword.length < 2) return alert('두 글자 이상 입력하세요.');
    
    results.innerHTML = '<p class="loading-text">성경 전체에서 검색 중...</p>';
    let found = [];
    const bookKeys = Object.keys(window.BIBLE_BOOKS);
    
    try {
        await Promise.all(bookKeys.map(key => loadBibleBook(key)));
        for (const key of bookKeys) {
            const data = window.BIBLE_DATA[key];
            for (const ch in data) {
                for (const vs in data[ch]) {
                    if (data[ch][vs].includes(keyword)) {
                        found.push({ book: window.BIBLE_BOOKS[key], ch, vs, text: data[ch][vs] });
                    }
                }
            }
        }
        
        if (found.length === 0) return results.innerHTML = '<p class="loading-text">결과가 없습니다.</p>';
        results.innerHTML = `<h3>'${keyword}' 검색 결과 (${found.length}건)</h3>` + found.map(v => `
            <div class="result-item"><h4>${v.book} ${v.ch}:${v.vs}</h4><p>${v.text.replace(new RegExp(keyword, 'g'), `<b>${keyword}</b>`)}</p></div>
        `).join('');
    } catch (e) {
        results.innerHTML = '<p class="loading-text">오류 발생</p>';
    }
}

// ===== 찬양 관리 =====

// 찬송가 목록 렌더링 (선택 버튼 포함)
function renderHymnItem(h) {
    return `
        <div class="hymn-item" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #ddd;">
            <div>
                <strong>${h.number}장</strong> - ${h.title}
                ${h.category ? `<span class="tag">${h.category}</span>` : ''}
            </div>
            <div class="hymn-item-actions">
                <button class="btn btn-sm" style="background: var(--secondary-color); margin-right: 5px;" onclick="selectHymnForSermon(${h.number}, '${h.title.replace(/'/g, "\\'")}')">선택</button>
                <button class="btn btn-sm" onclick="playHymn(${h.number})">재생</button>
            </div>
        </div>
    `;
}

function selectHymnForSermon(number, title) {
    const contentArea = document.getElementById('sermon-content');
    contentArea.value = `[찬송가 ${number}장 - ${title}]\n\n` + contentArea.value;
    alert("본문에 추가되었습니다.");
}

function searchHymn() {
    const query = document.getElementById('hymn-search-input').value.trim();
    const results = document.getElementById('hymn-results');
    if (!query) return;
    
    const hymns = [
        { number: 405, title: '주의 친절한 팔에 안기세', category: '위로' },
        { number: 31, title: '찬양하라 복되신 구세주 예수', category: '찬양' },
        { number: 88, title: '내 주를 가까이', category: '기도' },
        { number: 369, title: '죄짐 맡은 우리 구주', category: '은혜' },
        { number: 488, title: '이 땅 위에 근심 있는 사람들아', category: '위로' }
    ];
    
    const filtered = hymns.filter(h => h.number.toString().includes(query) || h.title.includes(query));
    results.innerHTML = filtered.length > 0 ? filtered.map(h => renderHymnItem(h)).join('') : '<p class="loading-text">결과 없음</p>';
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
    results.innerHTML = hymns.map(h => renderHymnItem(h)).join('');
}

function playHymn(number) {
    const modal = document.getElementById('hymn-player-modal');
    document.getElementById('player-hymn-title').textContent = `재생 중: 찬송가 ${number}장`;
    document.getElementById('youtube-player-container').innerHTML = `
        <iframe width="100%" height="100%" src="https://www.youtube.com/embed?listType=search&list=${encodeURIComponent('찬송가 ' + number + '장')}" 
        style="position: absolute; top: 0; left: 0;" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.style.display = 'block';
}

function closeHymnPlayer() {
    document.getElementById('youtube-player-container').innerHTML = '';
    document.getElementById('hymn-player-modal').style.display = 'none';
}

// ===== 설교 작성 단계 로직 =====

function generateSermonTitles() {
    const topic = document.getElementById('sermon-topic-input').value.trim();
    if (!topic) return alert('주제를 입력하세요.');
    
    const titles = [`${topic}을 통해 본 하나님의 사랑`, `${topic}의 의미와 적용`, `${topic}으로 인도하시는 주님`];
    document.getElementById('title-options').innerHTML = titles.map((t, i) => `
        <div class="title-option" onclick="selectSermonTitle('${t.replace(/'/g, "\\'")}')"><strong>제목 ${i+1}:</strong> ${t}</div>
    `).join('');
    showSermonStep(2);
}

function selectSermonTitle(title) {
    selectedSermonTitle = title;
    document.querySelectorAll('.title-option').forEach(opt => opt.classList.remove('selected'));
    if (event.target) event.target.classList.add('selected');
    setTimeout(() => showSermonStep(3), 500);
}

function selectSermonTime(minutes) {
    selectedSermonTime = minutes;
    generateSermonOutline();
    showSermonStep(4);
}

function generateSermonOutline() {
    generatedOutline = `서론: ${selectedSermonTitle}의 배경\n본론 1: 성경적 핵심\n본론 2: 실제적 적용\n본론 3: 기도와 결단\n결론: 종합 및 기도`;
    document.getElementById('sermon-outline-display').textContent = generatedOutline;
}

function proceedToStep5() {
    // 5단계: 추천 찬송가 목록만 보여줌 (체크박스 없이 단순 리스트)
    const container = document.getElementById('recommended-hymns');
    container.innerHTML = RECOMMENDED_HYMNS.map(h => `
        <div class="hymn-item" style="display: flex; justify-content: space-between; align-items: center; background: white; padding: 10px; border-radius: 8px; margin-bottom: 5px; border: 1px solid #eee;">
            <div><strong>${h.number}장</strong> - ${h.title}</div>
            <button class="btn btn-sm" onclick="playHymn(${h.number})">재생</button>
        </div>
    `).join('');
    showSermonStep(5);
}

function proceedToFinalEdit() {
    // 설교 작성하기 클릭 시 추천 찬송가 5곡 전체를 자동으로 본문에 삽입
    document.getElementById('sermon-title').value = selectedSermonTitle;
    document.getElementById('sermon-outline').value = generatedOutline;
    
    let hymnListText = "추천 찬송가 목록:\n" + RECOMMENDED_HYMNS.map(h => `[찬송가 ${h.number}장 - ${h.title}]`).join('\n') + "\n\n";
    const contentArea = document.getElementById('sermon-content');
    contentArea.value = hymnListText + contentArea.value;
    
    document.getElementById('sermon-final-edit').classList.add('active');
    document.querySelectorAll('.sermon-step').forEach(s => { if(s.id !== 'sermon-final-edit') s.classList.remove('active'); });
    document.getElementById('sermon-nav').style.display = 'none';
}

// ===== 설교 저장 및 관리 =====
function saveSermon() {
    const user = getAppCurrentUser();
    if (!user) return alert('로그인이 필요합니다.');
    const title = document.getElementById('sermon-title').value;
    const content = document.getElementById('sermon-content').value;
    if (!title || !content) return alert('제목과 내용을 입력하세요.');

    let sermons = JSON.parse(localStorage.getItem('sermons') || '[]');
    const newSermon = { id: editingSermonId || Date.now(), userId: user.email, title, scripture: document.getElementById('sermon-scripture').value, outline: document.getElementById('sermon-outline').value, content, date: new Date().toLocaleString('ko-KR') };
    
    if (editingSermonId) sermons = sermons.map(s => s.id === editingSermonId ? newSermon : s);
    else sermons.push(newSermon);
    
    localStorage.setItem('sermons', JSON.stringify(sermons));
    editingSermonId = null;
    alert('저장되었습니다.');
    navigateTo('my-sermons');
}

function loadMySermons() {
    const user = getAppCurrentUser();
    const container = document.getElementById('my-sermons-list');
    if (!user) return container.innerHTML = '<p class="loading-text">로그인하세요.</p>';
    
    const mySermons = JSON.parse(localStorage.getItem('sermons') || '[]').filter(s => s.userId === user.email);
    if (mySermons.length === 0) return container.innerHTML = '<p class="loading-text">저장된 설교가 없습니다.</p>';
    
    container.innerHTML = mySermons.map(s => `
        <div class="sermon-item">
            <h4>${s.title}</h4>
            <p><small>${s.date}</small></p>
            <div class="sermon-item-actions">
                <button class="btn btn-sm" onclick="loadSermonToEdit(${s.id})">수정</button>
                <button class="btn btn-sm" onclick="deleteMySermon(${s.id})">삭제</button>
            </div>
        </div>
    `).join('');
}

function loadSermonToEdit(id) {
    const s = JSON.parse(localStorage.getItem('sermons') || '[]').find(x => x.id === id);
    if (!s) return;
    document.getElementById('sermon-title').value = s.title;
    document.getElementById('sermon-scripture').value = s.scripture;
    document.getElementById('sermon-outline').value = s.outline;
    document.getElementById('sermon-content').value = s.content;
    editingSermonId = id;
    navigateTo('sermon');
    document.getElementById('sermon-final-edit').classList.add('active');
}

function deleteMySermon(id) {
    if (!confirm('삭제하시겠습니까?')) return;
    let s = JSON.parse(localStorage.getItem('sermons') || '[]').filter(x => x.id !== id);
    localStorage.setItem('sermons', JSON.stringify(s));
    loadMySermons();
}

function clearSermon() {
    if (confirm('초기화하시겠습니까?')) {
        document.getElementById('sermon-title').value = '';
        document.getElementById('sermon-content').value = '';
        editingSermonId = null;
        goToSermonFirstStep();
    }
}

// ===== 게시판 기능 =====
let editingPostId = null;
function loadBoardPosts() {
    const posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    const container = document.getElementById('board-posts-list');
    if (posts.length === 0) return container.innerHTML = '<p class="loading-text">글이 없습니다.</p>';
    
    container.innerHTML = posts.map(p => `
        <div class="board-item">
            <span class="tag">${p.category}</span>
            <h4>${p.title}</h4>
            <p><small>${p.author} | ${p.date} | 추천 ${p.recommendations || 0}</small></p>
            <div class="board-item-actions">
                <button class="btn btn-sm" onclick="alert(p.content)">보기</button>
                <button class="btn btn-sm" onclick="recommendPost(${p.id})">👍 추천</button>
            </div>
        </div>
    `).join('');
}

function recommendPost(id) {
    let posts = JSON.parse(localStorage.getItem('boardPosts') || '[]');
    posts = posts.map(p => { if (p.id === id) p.recommendations = (p.recommendations || 0) + 1; return p; });
    localStorage.setItem('boardPosts', JSON.stringify(posts));
    loadBoardPosts();
}

// ===== 유틸리티 =====
function getAppCurrentUser() {
    const session = localStorage.getItem('currentUser');
    if (!session) return null;
    try { return JSON.parse(session); } catch(e) { return { email: session }; }
}

function showSermonStep(step) {
    document.querySelectorAll('.sermon-step').forEach(s => s.classList.remove('active'));
    document.getElementById(`sermon-step-${step}`).classList.add('active');
    currentSermonStep = step;
    const nav = document.getElementById('sermon-nav');
    nav.style.display = step > 1 ? 'flex' : 'none';
    document.getElementById('current-step-text').textContent = `단계: ${step}/5`;
}

function goToSermonFirstStep() { showSermonStep(1); }
function goToSermonPreviousStep() { if (currentSermonStep > 1) showSermonStep(currentSermonStep - 1); }
