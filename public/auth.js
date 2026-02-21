// 인증 관리
// 전역 변수로 선언하여 app.js와 공유
window.currentUser = null;

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
            // JSON 파싱 시도
            if (userSession.startsWith('{')) {
                window.currentUser = JSON.parse(userSession);
            } else {
                // 단순 이메일 문자열인 경우 객체로 변환 (하위 호환성)
                window.currentUser = { email: userSession, name: '사용자', position: '성도' };
                localStorage.setItem('currentUser', JSON.stringify(window.currentUser));
            }
            showMainApp();
        } catch (e) {
            console.error("Session load error:", e);
            // 에러 발생 시 세션 초기화
            localStorage.removeItem('currentUser');
            window.currentUser = null;
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
        if (user.isBanned) {
            alert('귀하의 계정은 관리자에 의해 이용이 제한되었습니다. 접속할 수 없습니다.');
            return;
        }
        window.currentUser = user;
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
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
        if (existingUser.isBanned) {
            alert('이 이메일은 이용이 제한되어 다시 가입할 수 없습니다.');
        } else {
            alert('이미 등록된 이메일입니다.');
        }
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
    const authPage = document.getElementById('auth-page');
    if (authPage) authPage.style.display = 'flex';
    document.getElementById('login-form-container').style.display = 'block';
    document.getElementById('signup-form-container').style.display = 'none';
}

function showRegisterForm() {
    const authPage = document.getElementById('auth-page');
    if (authPage) authPage.style.display = 'flex';
    document.getElementById('login-form-container').style.display = 'none';
    document.getElementById('signup-form-container').style.display = 'block';
}

function showMainApp() {
    const authPage = document.getElementById('auth-page');
    const appContainer = document.getElementById('app-container');
    
    if (authPage) authPage.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    document.body.classList.remove('login-page');
    
    updateUserUI();
}

function updateUserUI() {
    const userGreeting = document.getElementById('user-greeting');
    const logoutBtn = document.getElementById('logout-btn');
    const adminBtn = document.querySelector('[data-page="admin"]');
    const user = window.currentUser;
    
    if (user) {
        if (userGreeting) userGreeting.textContent = `${user.name} ${user.position || '성도'}님 환영합니다!`;
        if (logoutBtn) {
            logoutBtn.textContent = '로그아웃';
            logoutBtn.onclick = logout;
        }
        // 관리자 메뉴 표시 여부
        if (adminBtn) {
            adminBtn.style.display = isAdmin(user) ? 'inline-block' : 'none';
        }
    } else {
        if (userGreeting) userGreeting.textContent = '로그인이 필요합니다 (구경 모드)';
        if (logoutBtn) {
            logoutBtn.textContent = '로그인';
            logoutBtn.onclick = () => {
                const authPage = document.getElementById('auth-page');
                if (authPage) authPage.style.display = 'flex';
            };
        }
    }
}

function hideAuthModal() {
    const authPage = document.getElementById('auth-page');
    if (authPage) {
        authPage.style.display = 'none';
        updateUserUI();
    }
}

function logout() {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    
    localStorage.removeItem('currentUser');
    window.currentUser = null;
    location.reload();
}

function getCurrentUser() {
    return window.currentUser;
}

function isAdmin(user) {
    const targetUser = user || window.currentUser;
    if (!targetUser) return false;
    // 이메일이 hsamusdae@gmail.com 이거나 role이 admin인 경우 관리자로 인정
    return targetUser.email === 'hsamusdae@gmail.com' || targetUser.role === 'admin' || targetUser.level >= 9;
}

function canPostToBoard(user) {
    const targetUser = user || window.currentUser;
    if (!targetUser) return false;
    // 관리자는 무조건 허용, 일반 사용자는 레벨 2 이상 또는 추천 5개 이상
    if (isAdmin(targetUser)) return true;
    return targetUser.level >= 2 || targetUser.recommendCount >= 5;
}

// app.js에서 호출하는 함수명 호환성 유지
function checkAuthStatus() {
    checkSession();
    updateUserUI();
}
