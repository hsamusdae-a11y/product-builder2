/**
 * AI 성경 노트 - 외부 리소스 연동 및 고성능 검색 모듈
 */

const ExternalBibleTools = {
    // 1. 외부 리소스 열기
    openExternal: function(url) {
        window.open(url, '_blank');
    },

    // 2. 전문 사전 연동
    openKoreanDictionary: function(word, type = 'godpia') {
        const encoded = encodeURIComponent(word);
        const urls = {
            godpia: `http://bible.godpia.com/search/result.asp?pk_id=8&search_word=${encoded}`,
            goodtv: `https://bible.goodtv.co.kr/bible/dictionary/search.do?search_text=${encoded}`,
            jw: `https://www.jw.org/ko/library/%EC%84%B1%EA%B2%BD-%EC%9A%A9%EC%96%B4-%EC%82%AC%EC%A0%84/search/?q=${encoded}`
        };
        window.open(urls[type], '_blank');
    },

    // 3. 원어 및 심화 연구 (BLB, StepBible)
    openDeepStudy: function(bookId, chapter, verse, type = 'blb') {
        const bookName = bookId.charAt(0).toUpperCase() + bookId.slice(1);
        const url = type === 'blb' 
            ? `https://www.blueletterbible.org/kjv/${bookName}/${chapter}/${verse}/t_conc_1001`
            : `https://www.stepbible.org/?q=reference=KJV.${bookId}.${chapter}.${verse}`;
        window.open(url, '_blank');
    },

    // 4. 성구 사전(Concordance) 핵심 엔진
    concordanceSearch: async function() {
        const input = document.getElementById('keyword-input');
        const keyword = input ? input.value.trim() : '';
        const results = document.getElementById('search-results');
        
        if (!keyword) return alert('검색어를 입력해 주세요.');
        
        results.innerHTML = `
            <div style="text-align:center; padding:50px; background:white; border-radius:15px; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
                <h3 style="color:var(--primary-color); margin-bottom:15px;">📖 성경 전체에서 '${keyword}' 검색 중...</h3>
                <div style="width:100%; background:#eee; border-radius:10px; height:10px; overflow:hidden; margin-bottom:10px;">
                    <div id="search-bar" style="width:0%; height:100%; background:var(--primary-color); transition:0.3s;"></div>
                </div>
                <p id="search-info" style="font-size:0.9rem; color:#888;">데이터를 불러오는 중입니다...</p>
            </div>`;

        let foundVerses = [];
        const bookKeys = Object.keys(window.BIBLE_BOOKS);
        const bar = document.getElementById('search-bar');
        const info = document.getElementById('search-info');
        
        try {
            for (let i = 0; i < bookKeys.length; i++) {
                const key = bookKeys[i];
                if (bar) bar.style.width = `${Math.floor((i / bookKeys.length) * 100)}%`;
                if (info) info.innerText = `${window.BIBLE_BOOKS[key]} 분석 중...`;
                
                // 데이터 로드 대기
                const bookData = await window.loadBibleBook(key);
                
                if (bookData) {
                    for (const ch in bookData) {
                        for (const vs in bookData[ch]) {
                            const text = bookData[ch][vs];
                            if (text && text.includes(keyword)) {
                                foundVerses.push({ id: key, name: window.BIBLE_BOOKS[key], ch, vs, text });
                            }
                        }
                    }
                }
            }
            
            this.renderResults(keyword, foundVerses);
        } catch (e) {
            console.error(e);
            results.innerHTML = `<div class="card">검색 중 오류가 발생했습니다. (${e.message})</div>`;
        }
    },

    // 5. 검색 결과 렌더링
    renderResults: function(keyword, verses) {
        const results = document.getElementById('search-results');
        if (verses.length === 0) {
            results.innerHTML = `
                <div class="card" style="text-align:center; padding:40px;">
                    <h3 style="margin-bottom:20px;">'${keyword}'에 대한 내부 검색 결과가 없습니다.</h3>
                    <p style="color:#666; margin-bottom:30px;">더 자세한 정보나 고고학적 자료는 아래 전문 사전을 이용해 보세요.</p>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button class="btn btn-outline" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'godpia')">갓피아(GODpia) 사전</button>
                        <button class="btn btn-outline" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'goodtv')">GOODTV 성경사전</button>
                    </div>
                </div>`;
            return;
        }

        const regex = new RegExp(keyword, 'g');
        results.innerHTML = `
            <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <h3>'${keyword}' 검색 결과 (${verses.length}건)</h3>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-sm" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'godpia')">갓피아</button>
                    <button class="btn btn-sm" onclick="ExternalBibleTools.openKoreanDictionary('${keyword}', 'goodtv')">GOODTV</button>
                </div>
            </div>
            ${verses.slice(0, 300).map(v => `
                <div class="result-item" style="border-left:5px solid var(--primary-color); padding:20px; background:white; border-radius:10px; margin-bottom:15px; box-shadow:0 3px 6px rgba(0,0,0,0.05);">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:10px;">
                        <strong style="font-size:1.1rem; color:var(--primary-color);">${v.name} ${v.ch}:${v.vs}</strong>
                        <div style="display:flex; gap:5px;">
                            <button class="btn btn-sm" style="background:#4a5568;" onclick="ExternalBibleTools.openDeepStudy('${v.id}', ${v.ch}, ${v.vs}, 'blb')">원어</button>
                            <button class="btn btn-sm" style="background:#718096;" onclick="ExternalBibleTools.openDeepStudy('${v.id}', ${v.ch}, ${v.vs}, 'step')">분석</button>
                        </div>
                    </div>
                    <p style="line-height:1.7; color:#333;">${v.text.replace(regex, `<mark style="background:#fff3cd; color:#856404; font-weight:bold; padding:2px 4px; border-radius:3px;">${keyword}</mark>`)}</p>
                </div>
            `).join('')}
        `;
    },

    // 6. 원어 성경 페이지 검색용 핸들러
    handleOriginalSearch: function() {
        const word = document.getElementById('original-word-search').value.trim();
        const results = document.getElementById('original-results');
        if (!word) return alert('검색할 단어를 입력하세요.');

        results.innerHTML = `
            <div class="card" style="background:#f9f9ff; border-top:4px solid var(--primary-color);">
                <h4 style="margin-bottom:15px;">🔍 '${word}' 심화 연구 링크</h4>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <button class="btn" onclick="ExternalBibleTools.openExternal('https://www.blueletterbible.org/search/preSearch.cfm?Criteria=${encodeURIComponent(word)}')">BLB 원어 검색</button>
                    <button class="btn" onclick="ExternalBibleTools.openExternal('https://www.stepbible.org/?q=search=${encodeURIComponent(word)}')">StepBible 어휘분석</button>
                    <button class="btn" style="background:#2d3748;" onclick="ExternalBibleTools.openKoreanDictionary('${word}', 'godpia')">갓피아 성경사전</button>
                    <button class="btn" style="background:#2d3748;" onclick="ExternalBibleTools.openKoreanDictionary('${word}', 'goodtv')">GOODTV 사전</button>
                </div>
            </div>`;
    }
};

window.ExternalBibleTools = ExternalBibleTools;
