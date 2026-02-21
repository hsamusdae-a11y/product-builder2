/**
 * AI 성경 노트 - 외부 리소스 연동 모듈 (원어 성경 및 사전)
 * 이 파일은 기존 로직과 분리되어 독립적으로 작동합니다.
 */

const ExternalBibleTools = {
    // 1. Blue Letter Bible 연동 (원어 주석 및 Interlinear)
    openBLB: function(bookId, chapter, verse) {
        // BLB는 첫 글자 대문자를 사용합니다.
        const encodedBook = bookId.charAt(0).toUpperCase() + bookId.slice(1);
        const url = `https://www.blueletterbible.org/kjv/${encodedBook}/${chapter}/${verse}/t_conc_1001`;
        window.open(url, '_blank');
    },

    // 2. Step Bible 연동 (원어 문법 및 어휘 분석)
    openStepBible: function(bookId, chapter, verse) {
        // Step Bible 형식 예시: reference=KJV.Gen.1.1
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
        const keyword = document.getElementById('keyword-input').value.trim();
        const results = document.getElementById('search-results');
        
        if (!keyword || keyword.length < 2) {
            return alert('두 글자 이상의 검색어를 입력하세요.');
        }
        
        results.innerHTML = `<div class="loading-text" style="text-align:center;">
            <p>📖 성경 전체에서 '${keyword}'(을)를 검색하여 불러오는 중...</p>
            <progress value="0" max="100" id="search-progress" style="width:100%;"></progress>
        </div>`;

        let foundVerses = [];
        const bookKeys = Object.keys(window.BIBLE_BOOKS);
        const progress = document.getElementById('search-progress');
        
        try {
            for (let i = 0; i < bookKeys.length; i++) {
                const key = bookKeys[i];
                const bookName = window.BIBLE_BOOKS[key];
                
                // 진행률 표시
                if (progress) progress.value = Math.floor((i / bookKeys.length) * 100);
                
                // 데이터 로드 및 검색
                const bookData = await window.loadBibleBook(key);
                if (!bookData) continue;

                for (const chapterNum in bookData) {
                    for (const verseNum in bookData[chapterNum]) {
                        const verseText = bookData[chapterNum][verseNum];
                        if (verseText.includes(keyword)) {
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
            
            if (foundVerses.length === 0) {
                results.innerHTML = `<div class="card" style="text-align:center;"><p>'${keyword}'에 대한 검색 결과가 없습니다.</p></div>`;
                return;
            }

            const regex = new RegExp(keyword, 'g');
            results.innerHTML = `
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h3>'${keyword}' 검색 결과 (${foundVerses.length}건)</h3>
                    <div style="display:flex; gap:5px;">
                        <button class="btn btn-sm" style="background:#3182ce" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'godpia')">갓피아 사전</button>
                        <button class="btn btn-sm" style="background:#2b6cb0" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'goodtv')">GOODTV 사전</button>
                    </div>
                </div>
                ${foundVerses.slice(0, 200).map(v => `
                    <div class="result-item" style="border-left: 4px solid var(--primary-color); margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <strong style="color: var(--primary-color); font-size: 1.1rem;">${v.book} ${v.chapter}:${v.verse}</strong>
                            <div style="display: flex; gap: 5px;">
                                <button class="btn btn-sm" style="font-size: 0.7rem; padding: 2px 8px; background: #4a5568;" onclick="ExternalBibleTools.openBLB('${v.bookId}', ${v.chapter}, ${v.verse})">원어(BLB)</button>
                                <button class="btn btn-sm" style="font-size: 0.7rem; padding: 2px 8px; background: #718096;" onclick="ExternalBibleTools.openStepBible('${v.bookId}', ${v.chapter}, ${v.verse})">분석(Step)</button>
                            </div>
                        </div>
                        <p style="line-height: 1.6; color: #333;">${v.text.replace(regex, `<span style="background-color: yellow; font-weight: bold; padding: 0 2px;">${keyword}</span>`)}</p>
                    </div>
                `).join('')}
                ${foundVerses.length > 200 ? `<p class="loading-text" style="text-align:center;">결과가 너무 많아 상위 200건만 표시합니다.</p>` : ''}
            `;
        } catch (error) {
            console.error('성구 사전 검색 중 오류:', error);
            results.innerHTML = `<div class="card" style="color:red;"><p>오류가 발생했습니다: ${error.message}</p></div>`;
        }
    }
};

// 전역에서 접근 가능하도록 설정
window.ExternalBibleTools = ExternalBibleTools;
