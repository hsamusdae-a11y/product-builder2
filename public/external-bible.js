/**
 * AI 성경 노트 - 외부 리소스 연동 모듈 (원어 성경 및 사전)
 * 이 파일은 기존 로직과 분리되어 독립적으로 작동합니다.
 */

const ExternalBibleTools = {
    // 1. Blue Letter Bible 연동 (원어 주석 및 Interlinear)
    openBLB: function(bookId, chapter, verse) {
        const encodedBook = bookId.charAt(0).toUpperCase() + bookId.slice(1);
        const url = `https://www.blueletterbible.org/kjv/${encodedBook}/${chapter}/${verse}/t_conc_1001`;
        window.open(url, '_blank');
    },

    // 2. Step Bible 연동 (원어 문법 및 어휘 분석)
    openStepBible: function(bookId, chapter, verse) {
        const url = `https://www.stepbible.org/?q=reference=KJV.${bookId}.${chapter}.${verse}`;
        window.open(url, '_blank');
    },

    // 3. 전문 성경 사전 연동 (갓피아, GOODTV)
    openKoreanDictionary: function(word, type = 'godpia') {
        let url = '';
        const encoded = encodeURIComponent(word);
        if (type === 'godpia') {
            url = `http://bible.godpia.com/search/result.asp?pk_id=8&search_word=${encoded}`;
        } else if (type === 'goodtv') {
            url = `https://bible.goodtv.co.kr/bible/dictionary/search.do?search_text=${encoded}`;
        }
        window.open(url, '_blank');
    },

    // 4. StudyLight 원어 사전 검색 (스트롱 코드 또는 단어)
    searchStudyLight: function(word, isHebrew = true) {
        const type = isHebrew ? 'hebrew' : 'greek';
        const url = `https://www.studylight.org/lexicons/eng/${type}/${encodeURIComponent(word)}.html`;
        window.open(url, '_blank');
    },

    // 5. 원어 성경 페이지 전용 검색 핸들러
    handleOriginalSearch: function() {
        const wordInput = document.getElementById('original-word-search');
        const word = wordInput ? wordInput.value.trim() : '';
        const results = document.getElementById('original-results');
        
        if (!word) return alert('검색할 원어나 단어를 입력하세요.');

        results.innerHTML = `
            <div class="result-item" style="border-top: 3px solid var(--primary-color); padding-top: 20px; background: #f9f9ff; padding: 20px; border-radius: 10px;">
                <h4 style="margin-bottom: 10px;">🔍 '${word}'에 대한 전문 원어 연구 자료</h4>
                <p style="margin-bottom: 20px; font-size: 0.9rem; color: #666;">가장 권위 있는 글로벌 원어 연구 사이트로 연결하여 상세 정보를 확인합니다.</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button class="btn btn-sm" onclick="ExternalBibleTools.searchStudyLight('${word}', true)">히브리어 사전 (StudyLight)</button>
                    <button class="btn btn-sm" onclick="ExternalBibleTools.searchStudyLight('${word}', false)">헬라어 사전 (StudyLight)</button>
                    <button class="btn btn-sm" style="background: #2d3748" onclick="window.open('https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${encodeURIComponent(word)}', '_blank')">원어 콘코던스 (BLB)</button>
                    <button class="btn btn-sm" style="background: #4a5568" onclick="window.open('https://www.stepbible.org/?q=version=KJV|version=OHB|version=LXX|search=${encodeURIComponent(word)}', '_blank')">어휘 및 문법 분석 (StepBible)</button>
                </div>
            </div>
        `;
    },

    // 6. 단어 사전 검색 결과 하단에 외부 링크 추가하는 유틸리티
    appendExternalDictLinks: function(word) {
        const results = document.getElementById('word-results');
        if (!results) return;

        const linkBox = document.createElement('div');
        linkBox.className = 'result-item';
        linkBox.style.marginTop = '30px';
        linkBox.style.borderTop = '2px dashed var(--primary-color)';
        linkBox.style.paddingTop = '20px';
        linkBox.style.textAlign = 'center';
        
        linkBox.innerHTML = `
            <h4 style="margin-bottom: 15px;">📚 '${word}'에 대한 전문 사전 더보기</h4>
            <div style="display: flex; gap: 10px; justify-content: center;">
                <button class="btn btn-sm" style="background: #3182ce" onclick="ExternalBibleTools.openKoreanDictionary('${word}', 'godpia')">갓피아(GODpia) 사전</button>
                <button class="btn btn-sm" style="background: #2b6cb0" onclick="ExternalBibleTools.openKoreanDictionary('${word}', 'goodtv')">GOODTV 성경사전</button>
            </div>
        `;
        results.appendChild(linkBox);
    },

    // 7. 성구 사전(Concordance) 검색 엔진
    concordanceSearch: async function() {
        const keywordInput = document.getElementById('keyword-input');
        const keyword = keywordInput ? keywordInput.value.trim() : '';
        const results = document.getElementById('search-results');
        
        if (!keyword) {
            return alert('검색어를 입력하세요.');
        }
        
        results.innerHTML = `<div class="loading-text" style="text-align:center; padding: 40px;">
            <p style="font-size: 1.2rem; margin-bottom: 10px;">📖 성경 전체에서 '${keyword}'(을)를 찾는 중...</p>
            <progress value="0" max="100" id="search-progress" style="width:100%; height: 20px;"></progress>
            <p id="search-status" style="margin-top: 10px; font-size: 0.9rem; color: #666;">데이터 로딩 중...</p>
        </div>`;

        let foundVerses = [];
        const bookKeys = Object.keys(window.BIBLE_BOOKS);
        const progress = document.getElementById('search-progress');
        const status = document.getElementById('search-status');
        
        try {
            for (let i = 0; i < bookKeys.length; i++) {
                const key = bookKeys[i];
                const bookName = window.BIBLE_BOOKS[key];
                
                if (status) status.innerText = `${bookName} 분석 중...`;
                if (progress) progress.value = Math.floor((i / bookKeys.length) * 100);
                
                // 데이터 로드 (캐시 확인 및 비동기 대기)
                const bookData = await window.loadBibleBook(key);
                
                if (bookData) {
                    for (const chapterNum in bookData) {
                        for (const verseNum in bookData[chapterNum]) {
                            const verseText = bookData[chapterNum][verseNum];
                            if (verseText && verseText.includes(keyword)) {
                                foundVerses.push({
                                    bookId: key,
                                    book: bookName,
                                    chapter: chapterNum,
                                    verse: verseNum,
                                    text: verseText
                                });
                            }
                        }
                    }
                }
            }
            
            if (foundVerses.length === 0) {
                results.innerHTML = `
                    <div class="card" style="text-align:center; padding: 50px;">
                        <p style="font-size: 1.2rem; color: #666;">'${keyword}'에 대한 검색 결과가 없습니다.</p>
                        <p style="margin-top: 15px; font-size: 0.9rem; color: #999;">데이터 로딩 오류일 수 있습니다. 잠시 후 다시 시도해 주세요.</p>
                        <div style="margin-top: 25px;">
                            <button class="btn" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'godpia')">외부 사전에서 '${keyword}' 검색</button>
                        </div>
                    </div>`;
                return;
            }

            const regex = new RegExp(keyword, 'g');
            results.innerHTML = `
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; background: white; padding: 15px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                    <h3 style="margin:0;">'${keyword}' 검색 결과 (${foundVerses.length}건)</h3>
                    <div style="display:flex; gap:8px;">
                        <button class="btn btn-sm" style="background:#3182ce" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'godpia')">갓피아</button>
                        <button class="btn btn-sm" style="background:#2b6cb0" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'goodtv')">GOODTV</button>
                    </div>
                </div>
                ${foundVerses.slice(0, 300).map(v => `
                    <div class="result-item" style="border-left: 5px solid var(--primary-color); margin-bottom: 15px; padding: 20px; background: white; border-radius: 10px; box-shadow: 0 3px 6px rgba(0,0,0,0.08);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px;">
                            <strong style="color: var(--primary-color); font-size: 1.15rem;">${v.book} ${v.chapter}:${v.verse}</strong>
                            <div style="display: flex; gap: 8px;">
                                <button class="btn btn-sm" style="font-size: 0.75rem; background: #4a5568;" onclick="ExternalBibleTools.openBLB('${v.bookId}', ${v.chapter}, ${v.verse})">원어</button>
                                <button class="btn btn-sm" style="font-size: 0.75rem; background: #718096;" onclick="ExternalBibleTools.openStepBible('${v.bookId}', ${v.chapter}, ${v.verse})">분석</button>
                            </div>
                        </div>
                        <p style="line-height: 1.7; color: #2d3748;">${v.text.replace(regex, `<span style="background-color: #fff3cd; color: #856404; font-weight: bold; padding: 0 3px;">${keyword}</span>`)}</p>
                    </div>
                `).join('')}
            `;
        } catch (error) {
            console.error('검색 오류:', error);
            results.innerHTML = `<div class="card" style="color:red; text-align:center; padding: 30px;"><p>오류 발생: ${error.message}</p></div>`;
        }
    }
};

window.ExternalBibleTools = ExternalBibleTools;
