
const bookSelect = document.getElementById('book-select');
const chapterSelect = document.getElementById('chapter-select');
const bibleText = document.getElementById('bible-text');

const books = {
    "창세기": "genesis",
    "출애굽기": "exodus",
    "레위기": "leviticus",
    "민수기": "numbers",
    "신명기": "deuteronomy",
    "여호수아": "joshua",
    "사사기": "judges",
    "룻기": "ruth",
    "사무엘상": "1_samuel",
    "사무엘하": "2_samuel",
    "열왕기상": "1_kings",
    "열왕기하": "2_kings",
    "역대상": "1_chronicles",
    "역대하": "2_chronicles",
    "에스라": "ezra",
    "느헤미야": "nehemiah",
    "에스더": "esther",
    "욥기": "job",
    "시편": "psalms",
    "잠언": "proverbs",
    "전도서": "ecclesiastes",
    "아가": "song_of_solomon",
    "이사야": "isaiah",
    "예레미야": "jeremiah",
    "예레미야애가": "lamentations",
    "에스겔": "ezekiel",
    "다니엘": "daniel",
    "호세아": "hosea",
    "요엘": "joel",
    "아모스": "amos",
    "오바댜": "obadiah",
    "요나": "jonah",
    "미가": "micah",
    "나훔": "nahum",
    "하박국": "habakkuk",
    "스바냐": "zephaniah",
    "학개": "haggai",
    "스가랴": "zechariah",
    "말라기": "malachi",
    "마태복음": "matthew",
    "마가복음": "mark",
    "누가복음": "luke",
    "요한복음": "john",
    "사도행전": "acts",
    "로마서": "romans",
    "고린도전서": "1_corinthians",
    "고린도후서": "2_corinthians",
    "갈라디아서": "galatians",
    "에베소서": "ephesians",
    "빌립보서": "philippians",
    "골로새서": "colossians",
    "데살로니가전서": "1_thessalonians",
    "데살로니가후서": "2_thessalonians",
    "디모데전서": "1_timothy",
    "디모데후서": "2_timothy",
    "디도서": "titus",
    "빌레몬서": "philemon",
    "히브리서": "hebrews",
    "야고보서": "james",
    "베드로전서": "1_peter",
    "베드로후서": "2_peter",
    "요한1서": "1_john",
    "요한2서": "2_john",
    "요한3서": "3_john",
    "유다서": "jude",
    "요한계시록": "revelation"
};

function populateBookSelect() {
    for (const book in books) {
        const option = document.createElement('option');
        option.value = books[book];
        option.textContent = book;
        bookSelect.appendChild(option);
    }
}

function populateChapterSelect(book) {
    chapterSelect.innerHTML = '';
    const chapters = Object.keys(window.BIBLE_DATA[book]);
    for (const chapter of chapters) {
        const option = document.createElement('option');
        option.value = chapter;
        option.textContent = `${chapter}장`;
        chapterSelect.appendChild(option);
    }
}

function showBibleText(book, chapter) {
    bibleText.innerHTML = '';
    const verses = window.BIBLE_DATA[book][chapter];
    for (const verse in verses) {
        const p = document.createElement('p');
        p.innerHTML = `<strong>${verse}</strong> ${verses[verse]}`;
        bibleText.appendChild(p);
    }
}

bookSelect.addEventListener('change', () => {
    const selectedBook = bookSelect.value;
    populateChapterSelect(selectedBook);
    const selectedChapter = chapterSelect.value;
    showBibleText(selectedBook, selectedChapter);
});

chapterSelect.addEventListener('change', () => {
    const selectedBook = bookSelect.value;
    const selectedChapter = chapterSelect.value;
    showBibleText(selectedBook, selectedChapter);
});

// Initial load
populateBookSelect();
const initialBook = bookSelect.value;
populateChapterSelect(initialBook);
const initialChapter = chapterSelect.value;
showBibleText(initialBook, initialChapter);
