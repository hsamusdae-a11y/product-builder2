
document.addEventListener('DOMContentLoaded', () => {
    const sermonForm = document.getElementById('sermon-form');
    const bibleTextInput = document.getElementById('bible-text');
    const sermonTopicInput = document.getElementById('sermon-topic');
    const resultCard = document.getElementById('result-card');
    const outlineContent = document.getElementById('outline-content');
    const illustrationContent = document.getElementById('illustration-content');
    const spinner = document.getElementById('spinner');
    const resultSection = document.querySelector('.result-section');

    sermonForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const bibleText = bibleTextInput.value.trim();
        const sermonTopic = sermonTopicInput.value.trim();

        if (!bibleText || !sermonTopic) {
            alert('성경 본문과 설교 주제를 모두 입력해주세요.');
            return;
        }

        // 1. 로딩 시작
        spinner.style.display = 'block';
        resultSection.style.display = 'none'; // 이전 결과 숨기기
        resultCard.classList.remove('visible');

        // 2. 가짜 API 호출 (setTimeout으로 딜레이 흉내)
        setTimeout(() => {
            // 3. 미리 정의된 가짜 데이터 생성
            const dummyData = {
                outline: `
### 1. 서론: 사랑의 시작
- 하나님이 세상을 얼마나 사랑하셨는지에 대한 이야기로 설교를 시작합니다.
- 요한복음 3장 16절의 중요성과 보편성을 강조합니다.

### 2. 본론: 구원의 길
- **독생자**: 예수 그리스도가 왜 유일한 구원의 길인지 설명합니다.
- **믿음**: '믿는 자마다'라는 구절을 통해 믿음의 의미와 중요성을 탐구합니다.
- **영생**: '멸망하지 않고 영생을 얻게 하려 하심이라'의 의미를 현대적인 맥락에서 해석합니다.

### 3. 결론: 우리의 응답
- 이 놀라운 사랑에 우리가 어떻게 응답해야 할지 질문을 던집니다.
- 기도를 통해 결단의 시간을 갖습니다.
                `,
                illustration: `
한 작은 해안가 마을에 등대지기가 있었습니다. 그는 수십 년 동안 변함없이 밤마다 등대의 불을 밝혔습니다. 어느 폭풍우 치던 밤, 거대한 파도가 등대를 덮칠 듯이 몰아쳤지만 그는 끝까지 자리를 지켰습니다. 그의 희생 덕분에 수많은 배들이 안전하게 항구로 돌아올 수 있었습니다. 

이 등대지기의 변함없는 헌신처럼, 하나님의 사랑은 어떤 상황 속에서도 우리를 지키고 인도하는 불빛과 같습니다. 요한복음 3장 16절의 약속은 바로 그 영원히 꺼지지 않는 사랑의 불빛을 우리에게 보여주는 것입니다.
                `
            };

            // 4. 로딩 종료 및 결과 표시
            spinner.style.display = 'none';
            resultSection.style.display = 'block';

            // marked.js를 사용하여 마크다운을 HTML로 변환하여 삽입
            outlineContent.innerHTML = marked.parse(dummyData.outline);
            illustrationContent.innerHTML = marked.parse(dummyData.illustration);

            resultCard.classList.add('visible');

        }, 1500); // 1.5초 딜레이
    });
});
