const BUCKET = 'files';
let currentUser = null;
let allFiles = [];

// ---------- Bảo vệ trang: bắt buộc đăng nhập ----------
(async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return;
  }
  currentUser = session.user;
  document.getElementById('user-email').textContent = currentUser.email;
  document.getElementById('account-email').textContent = currentUser.email;
  document.getElementById('avatar-initial').textContent = currentUser.email.charAt(0).toUpperCase();
  loadFiles();
})();

supabaseClient.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.href = 'index.html';
});

// ---------- Đăng xuất ----------
document.getElementById('logout-btn').addEventListener('click', async () => {
  await supabaseClient.auth.signOut();
});

// ---------- Tiện ích ----------
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showStatus(text, type) {
  const el = document.getElementById('upload-status');
  el.textContent = text;
  el.className = 'upload-status' + (type ? ' ' + type : '');
  el.classList.remove('hidden');
  if (type === 'success') {
    setTimeout(() => el.classList.add('hidden'), 3000);
  }
}

// ---------- Tải danh sách file ----------
async function loadFiles() {
  const { data, error } = await supabaseClient
    .from('files')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    showStatus('Không tải được danh sách file: ' + error.message, 'error');
    return;
  }
  allFiles = data;
  updateFileCount();
  renderFiles(allFiles);
}

function updateFileCount() {
  document.getElementById('file-count-num').textContent = allFiles.length;
  document.getElementById('file-count-num-2').textContent = allFiles.length;
}

function renderFiles(files) {
  const list = document.getElementById('file-list');
  const emptyState = document.getElementById('empty-state');

  list.innerHTML = '';

  if (files.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  files.forEach(file => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.innerHTML = `
      <div class="file-card-icon">▤</div>
      <div class="file-card-info">
        <div class="file-card-name">${escapeHtml(file.name)}</div>
        <div class="file-card-meta">${formatSize(file.size)} · ${formatDate(file.created_at)}</div>
      </div>
      <div class="file-card-actions">
        <button class="icon-btn" data-action="download" data-path="${file.storage_path}" data-name="${escapeHtml(file.name)}" title="Tải xuống">⬇</button>
        <button class="icon-btn danger" data-action="delete" data-id="${file.id}" data-path="${file.storage_path}" title="Xoá">✕</button>
      </div>
    `;
    list.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------- Tìm kiếm (lọc phía client) ----------
document.getElementById('search-input').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = q
    ? allFiles.filter(f => f.name.toLowerCase().includes(q))
    : allFiles;
  renderFiles(filtered);
});

// ---------- Tải file lên ----------
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const MAX_SIZE = 50 * 1024 * 1024;

document.getElementById('browse-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});
dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files.length) uploadFile(fileInput.files[0]);
  fileInput.value = '';
});

['dragover', 'dragenter'].forEach(evt =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag-over');
  })
);
['dragleave', 'drop'].forEach(evt =>
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
  })
);
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  if (file) uploadFile(file);
});

async function uploadFile(file) {
  if (file.size > MAX_SIZE) {
    showStatus('File vượt quá 50MB, vui lòng chọn file nhỏ hơn.', 'error');
    return;
  }

  showStatus(`Đang tải lên "${file.name}"…`);

  const storagePath = `${currentUser.id}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabaseClient.storage
    .from(BUCKET)
    .upload(storagePath, file);

  if (uploadError) {
    showStatus('Tải lên thất bại: ' + uploadError.message, 'error');
    return;
  }

  const { error: insertError } = await supabaseClient
    .from('files')
    .insert({
      user_id: currentUser.id,
      name: file.name,
      storage_path: storagePath,
      size: file.size,
    });

  if (insertError) {
    showStatus('Lưu thông tin file thất bại: ' + insertError.message, 'error');
    return;
  }

  showStatus(`Đã tải lên "${file.name}" thành công.`, 'success');
  loadFiles();
}

// ---------- Tải xuống / Xoá ----------
document.getElementById('file-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.action === 'download') {
    const { data, error } = await supabaseClient.storage
      .from(BUCKET)
      .createSignedUrl(btn.dataset.path, 60);
    if (error) {
      showStatus('Không thể tải file: ' + error.message, 'error');
      return;
    }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = btn.dataset.name;
    a.click();
  }

  if (btn.dataset.action === 'delete') {
    if (!confirm('Xoá file này? Không thể hoàn tác.')) return;

    await supabaseClient.storage.from(BUCKET).remove([btn.dataset.path]);
    const { error } = await supabaseClient.from('files').delete().eq('id', btn.dataset.id);

    if (error) {
      showStatus('Xoá thất bại: ' + error.message, 'error');
      return;
    }
    loadFiles();
  }
});

// ---------- Thanh điều hướng dưới cùng ----------
const navItems = document.querySelectorAll('.nav-item');
const accountPanel = document.getElementById('account-panel');

function setActiveNav(id) {
  navItems.forEach(n => n.classList.toggle('active', n.id === id));
}

document.getElementById('nav-home').addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  accountPanel.classList.remove('open');
  setActiveNav('nav-home');
});

document.getElementById('nav-upload').addEventListener('click', () => {
  document.getElementById('section-upload').scrollIntoView({ behavior: 'smooth', block: 'start' });
  accountPanel.classList.remove('open');
  setActiveNav('nav-upload');
});

document.getElementById('nav-search').addEventListener('click', () => {
  document.getElementById('section-search').scrollIntoView({ behavior: 'smooth', block: 'start' });
  document.getElementById('search-input').focus();
  accountPanel.classList.remove('open');
  setActiveNav('nav-search');
});

document.getElementById('nav-account').addEventListener('click', () => {
  accountPanel.classList.toggle('open');
  setActiveNav('nav-account');
});
