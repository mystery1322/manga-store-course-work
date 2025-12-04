document.addEventListener('DOMContentLoaded', function() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const formFields = document.getElementById('formFields');
    const captchaSection = document.getElementById('captchaSection');
    const submitBtn = document.getElementById('submitBtn');
    const form = document.getElementById('authForm');
    let isLoginMode = true;
    
    // Генерация капчи
    function generateCaptcha() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    document.getElementById('captchaCode').textContent = result;
    return result;
    }
    
    let currentCaptcha = generateCaptcha();
    
    // Переключение между входом и регистрацией
    loginBtn.addEventListener('click', function() {
    isLoginMode = true;
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
    submitBtn.textContent = 'Войти';
    
    formFields.innerHTML = `
        <div class="form-group">
        <input type="email" id="email" placeholder="Email" required>
        </div>
        <div class="form-group">
        <input type="password" id="password" placeholder="Пароль" required>
        </div>
    `;
    
    captchaSection.style.display = 'none';
    });
    
    registerBtn.addEventListener('click', function() {
    isLoginMode = false;
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
    submitBtn.textContent = 'Зарегистрироваться';
    
    formFields.innerHTML = `
        <div class="form-group">
        <input type="text" id="username" placeholder="Имя пользователя" required>
        </div>
        <div class="form-group">
        <input type="email" id="email" placeholder="Email" required>
        </div>
        <div class="form-group">
        <input type="password" id="password" placeholder="Пароль" required>
        </div>
        <div class="form-group">
        <input type="password" id="confirmPassword" placeholder="Повторите пароль" required>
        </div>
    `;
    
    captchaSection.style.display = 'block';
    currentCaptcha = generateCaptcha();
    });
    
    // Обработка отправки формы
    form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!isLoginMode) {
        const captchaInput = document.getElementById('captchaInput').value;
        if (captchaInput.toUpperCase() !== currentCaptcha.toUpperCase()) {
        alert('Неверный код подтверждения!');
        currentCaptcha = generateCaptcha();
        return;
        }
        
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
        alert('Пароли не совпадают!');
        return;
        }
        
        alert('Регистрация успешна! Добро пожаловать!');
    } else {
        alert('Вход выполнен!');
    }
    
    // Очистка формы
    form.reset();
    if (!isLoginMode) {
        currentCaptcha = generateCaptcha();
    }
    });
    
    updateCartBadge();
});
