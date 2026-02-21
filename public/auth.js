// 인증 관리
let currentUser = null;

// 페이지 로드 시 세션 확인
document.addEventListener('DOMContentLoaded', () => {
    checkSession();
    
    // 폼 전환 이벤트 리스너 추가
    document.getElementById('show-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });
    
    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });
});

// 세션 확인
function checkSession() {
    const userSession = localStorage.getItem('currentUser');
    if (userSession) {
        try {
            currentUser = JSON.parse(userSession);
            showMainApp();
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
}

// 로그인 폼 제출
document.getElementById('login-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
    } else {
        alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
});

// 회원가입 폼 제출
document.getElementById('signup-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const position = document.getElementById('signup-position').value;
    const church = document.getElementById('signup-church').value;
    const denomination = document.getElementById('signup-denomination').value;
    const address = document.getElementById('signup-address').value;
    const phone = document.getElementById('signup-phone').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        alert('이미 등록된 이메일입니다.');
        return;
    }
    
    const newUser = {
        id: Date.now(),
        name, position, church, denomination, address, phone, email, password,
        level: 1,
        recommendCount: 0,
        joinDate: new Date().toLocaleDateString('ko-KR')
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    alert('회원가입이 완료되었습니다! 로그인해주세요.');
    showLoginForm();
});

function showLoginForm() {
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('signup-form-container').style.display = 'none';
}

function showRegisterForm() {
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('signup-form-container').style.display = 'block';
}

function showMainApp() {
    const authPage = document.getElementById('auth-page');
    const appContainer = document.getElementById('app-container');
    
    if (authPage) authPage.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    document.body.classList.remove('login-page');
    
    const userGreeting = document.getElementById('user-greeting');
    if (userGreeting && currentUser) {
        userGreeting.textContent = `${currentUser.name} ${currentUser.position}님 환영합니다!`;
    }
}

function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    
    localStorage.removeItem('currentUser');
    currentUser = null;
    location.reload();
}

function getCurrentUser() {
    return currentUser;
}

// app.js에서 호출하는 함수명 호환성 유지
function checkAuthStatus() {
    checkSession();
}
