// ---------- Chuyển tab đăng nhập / đăng ký ----------
const tabs = document.querySelectorAll('.tab');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    if (tab.dataset.tab === 'login') {
      loginForm.classList.remove('hidden');
      signupForm.classList.add('hidden');
    } else {
      signupForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
  });
});

// ---------- Nếu đã đăng nhập, chuyển thẳng vào app ----------
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (session) window.location.href = 'app.html';
})();

// ---------- Đăng nhập ----------
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('login-message');
  const btn = loginForm.querySelector('button[type="submit"]');
  message.textContent = '';
  message.classList.remove('success');
  btn.disabled = true;
  btn.textContent = 'Đang đăng nhập…';

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  btn.disabled = false;
  btn.textContent = 'Đăng nhập';

  if (error) {
    message.textContent = 'Sai email hoặc mật khẩu. Vui lòng thử lại.';
    return;
  }
  window.location.href = 'app.html';
});

// ---------- Đăng ký ----------
signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('signup-message');
  const btn = signupForm.querySelector('button[type="submit"]');
  message.textContent = '';
  message.classList.remove('success');
  btn.disabled = true;
  btn.textContent = 'Đang tạo tài khoản…';

  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;

  const { data, error } = await supabaseClient.auth.signUp({ email, password });

  btn.disabled = false;
  btn.textContent = 'Tạo tài khoản';

  if (error) {
    message.textContent = error.message.includes('already registered')
      ? 'Email này đã có tài khoản.'
      : 'Không thể tạo tài khoản: ' + error.message;
    return;
  }

  if (data.session) {
    window.location.href = 'app.html';
  } else {
    message.classList.add('success');
    message.textContent = 'Đã tạo tài khoản! Kiểm tra email để xác nhận, rồi đăng nhập.';
  }
});
