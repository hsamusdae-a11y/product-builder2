document.addEventListener('DOMContentLoaded', () => {
    // --- 기본 UI 요소 --- 
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');

    // --- 시작하기 섹션 ---
    const introContent = document.getElementById('introContent');
    const editIntroBtn = document.getElementById('editIntroBtn');

    // --- 설교 노트 섹션 ---
    const verseSearchInput = document.getElementById('verseSearchInput');
    const verseSearchBtn = document.getElementById('verseSearchBtn');
    const verseSearchResult = document.getElementById('verseSearchResult');
    const verseResultText = document.getElementById('verseResultText');
    const addVerseBtn = document.getElementById('addVerseBtn');
    const sermonVerseText = document.getElementById('sermonVerseText');

    // --- 오늘의 말씀 섹션 ---
    const getDailyVerseBtn = document.getElementById('getDailyVerseBtn');
    const dailyVerseResult = document.getElementById('dailyVerseResult');
    const dailyVerseText = document.getElementById('dailyVerseText');

    // --- 성구 사전 섹션 ---
    const concordanceSearchInput = document.getElementById('concordanceSearchInput');
    const concordanceSearchBtn = document.getElementById('concordanceSearchBtn');
    const concordanceResults = document.getElementById('concordanceResults');

    // 성경 데이터 네임스페이스 및 로딩 상태
    window.BIBLE_DATA = window.BIBLE_DATA || {};
    const loadedBooks = {};

    //=================================================================
    // 네비게이션 및 섹션 표시 기능
    //=================================================================
    window.showSection = (sectionId, clickedLink) => {
        if (clickedLink && clickedLink.target === '_blank') return;

        sections.forEach(section => section.classList.remove('active'));
        navLinks.forEach(link => {
            if (!link.target) link.classList.remove('active-nav');
        });

        const targetSection = document.getElementById(sectionId);
        if (targetSection) targetSection.classList.add('active');

        if (clickedLink && !clickedLink.target) {
            clickedLink.classList.add('active-nav');
        }
    };
    
    //=================================================================
    // 시작하기 섹션 편집 기능
    //=================================================================
    editIntroBtn.addEventListener('click', () => {
        if (editIntroBtn.textContent.includes('내용 수정')) {
            const currentHTML = introContent.innerHTML;
            const textForEditing = currentHTML.replace(/<p>/g, '').replace(/<\/p>/g, '\n').trim();
            
            introContent.innerHTML = `<textarea id="introTextArea" rows="6" style="width: 100%;">${textForEditing}</textarea>`;
            editIntroBtn.innerHTML = '<i class="fas fa-save"></i> 저장';
        } else {
            const newText = document.getElementById('introTextArea').value;
            const newHTML = newText.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');

            introContent.innerHTML = newHTML.trim() === '' ? '<p>내용을 입력해주세요.</p>' : newHTML;
            editIntroBtn.innerHTML = '<i class="fas fa-edit"></i> 내용 수정';
        }
    });

    //=================================================================
    // 성경 데이터 로딩 기능
    //=================================================================
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

    //=================================================================
    // 설교 노트의 구절 검색 기능
    //=================================================================
    async function searchVerse() {
        const query = verseSearchInput.value.trim();
        if (!query) return;

        verseResultText.textContent = '검색 중...';
        verseSearchResult.style.display = 'block';
        addVerseBtn.style.display = 'none';

        const regex = /^(\d?\s*[가-힣]+|[a-zA-Z]+)\s*(\d+):(\d+)$/;
        const match = query.match(regex);

        if (!match) {
            verseResultText.textContent = '형식 오류 (예: 창 1:1)';
            return;
        }

        const bookInput = match[1].trim().toLowerCase();
        const chapter = match[2];
        const verse = match[3];

        const bookKey = window.BIBLE_ABBREVIATIONS[bookInput];

        if (!bookKey) {
            verseResultText.textContent = '성경을 찾을 수 없습니다.';
            return;
        }

        try {
            await loadBibleBook(bookKey);
            const bookName = window.BIBLE_BOOKS[bookKey];
            const bookData = window.BIBLE_DATA[bookKey];
            const verseText = bookData?.[chapter]?.[verse];

            if (verseText) {
                const fullVerseRef = `${bookName} ${chapter}:${verse}`;
                verseResultText.textContent = `${fullVerseRef} - ${verseText}`;
                addVerseBtn.style.display = 'inline-block';
            } else {
                verseResultText.textContent = '해당 구절을 찾을 수 없습니다.';
            }
        } catch (error) {
            console.error(error);
            verseResultText.textContent = `오류: ${error.message}`;
        }
    }

    addVerseBtn.addEventListener('click', () => {
        const currentText = sermonVerseText.value;
        const newVerse = verseResultText.textContent;
        sermonVerseText.value = currentText ? `${currentText}\n${newVerse}` : newVerse;
    });
    
    verseSearchInput.addEventListener('keypress', e => e.key === 'Enter' && searchVerse());
    verseSearchBtn.addEventListener('click', searchVerse);

    //=================================================================
    // 성구 사전 (단어 검색) 기능
    //=================================================================
    async function searchConcordance() {
        const keyword = concordanceSearchInput.value.trim();
        if (!keyword || keyword.length < 2) {
            concordanceResults.innerHTML = '<p>두 글자 이상의 단어를 입력하세요.</p>';
            return;
        }

        concordanceResults.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 성경 전체에서 검색 중입니다. 잠시만 기다려주세요...</p>';

        let results = [];
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
                            results.push({
                                book: bookName,
                                chapter: chapterNum,
                                verse: verseNum,
                                text: verseText
                            });
                        }
                    }
                }
            }
            displayConcordanceResults(results, keyword);
        } catch (error) {
            console.error('Error during concordance search:', error);
            concordanceResults.innerHTML = `<p style="color: var(--danger-color);">검색 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    function displayConcordanceResults(results, keyword) {
        if (results.length === 0) {
            concordanceResults.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        const regex = new RegExp(keyword, 'g');
        const highlightedResults = results.map(r => {
            const highlightedText = r.text.replace(regex, `<span class="highlight">${keyword}</span>`);
            return `<div class="result-item">
                        <p><strong>${r.book} ${r.chapter}:${r.verse}</strong></p>
                        <p>${highlightedText}</p>
                    </div>`;
        }).join('');

        concordanceResults.innerHTML = `<h3>'${keyword}'에 대한 ${results.length}개의 검색 결과</h3>${highlightedResults}`;
    }
    
    concordanceSearchInput.addEventListener('keypress', e => e.key === 'Enter' && searchConcordance());
    concordanceSearchBtn.addEventListener('click', searchConcordance);

    //=================================================================
    // AI 설교 개요 생성 (개발 예정)
    //=================================================================
    window.generateSermon = () => alert('AI 설교 개요 생성 기능은 현재 개발 중입니다.');

    //=================================================================
    // 오늘의 말씀 기능
    //=================================================================
    async function getDailyVerse() {
        dailyVerseText.textContent = '말씀을 가져오는 중...';
        dailyVerseResult.style.display = 'block';

        // 모든 성경 책 목록에서 무작위로 하나를 선택합니다.
        const allBookKeys = Object.keys(window.BIBLE_BOOKS); 
        const randomBookKey = allBookKeys[Math.floor(Math.random() * allBookKeys.length)];

        try {
            await loadBibleBook(randomBookKey);
            const bookName = window.BIBLE_BOOKS[randomBookKey];
            const bookData = window.BIBLE_DATA[randomBookKey];

            if (!bookData) {
                 throw new Error(`'${bookName}' 데이터 로드 실패. 파일 확인 필요.`);
            }

            const chapterKeys = Object.keys(bookData);
            if (chapterKeys.length === 0) throw new Error(`'${bookName}'에 챕터 없음`);
            
            const randomChapterKey = chapterKeys[Math.floor(Math.random() * chapterKeys.length)];
            const chapterData = bookData[randomChapterKey];

            const verseKeys = Object.keys(chapterData);
            if (verseKeys.length === 0) throw new Error(`'${bookName} ${randomChapterKey}장'에 구절 없음`);

            const randomVerseKey = verseKeys[Math.floor(Math.random() * verseKeys.length)];
            const verseText = chapterData[randomVerseKey];

            dailyVerseText.textContent = `${bookName} ${randomChapterKey}:${randomVerseKey} - ${verseText}`;
        } catch (error) {
            console.error('오늘의 말씀 기능 오류:', error);
            dailyVerseText.textContent = `오류: ${error.message}`;
        }
    }
    
    getDailyVerseBtn.addEventListener('click', getDailyVerse);

    // 초기화
    showSection('intro', document.querySelector('.nav-link'));
});