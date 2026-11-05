import './admin.css';
import { loadLocalContent } from '../content/load';
import { rowsToContent, SITE_ROW } from '../content/remote';
import { RoomSchema, SiteSchema, type Room, type Site } from '../content/schema';
import { h } from '../ui/dom';
import { ApiError, checkLogin, loadRows, saveRows, type Login } from './api';
import { findQuiz, quizForm, roomForm, siteForm, uiForm } from './forms';

const LOGIN_KEY = 'mnong-admin';
const QUIZ = 'quiz';
const UI_SECTION = 'ui';

const app = document.getElementById('app')!;

let login: Login | null = readLogin();
let site: Site | null = null;
let rooms: Room[] = [];
/** Bản đã lưu của từng dòng (JSON), để biết dòng nào đã sửa. */
let saved = new Map<string, string>();
let current = SITE_ROW;
let issues: Array<{ path: string; message: string }> = [];

/** Tên và mật khẩu nhớ trong phiên (đóng tab là quên), để mỗi lần lưu gửi kèm. */
function readLogin(): Login | null {
  try {
    const raw = sessionStorage.getItem(LOGIN_KEY);
    return raw ? (JSON.parse(raw) as Login) : null;
  } catch {
    return null;
  }
}

function rememberLogin(value: Login | null): void {
  login = value;
  try {
    if (value) sessionStorage.setItem(LOGIN_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(LOGIN_KEY);
  } catch {
    // Trình duyệt chặn lưu: chỉ phải đăng nhập lại khi tải lại trang.
  }
}

const docs = (): Array<[string, unknown]> => (site ? [[SITE_ROW, site], ...rooms.map((r): [string, unknown] => [r.id, r])] : []);
const changedDocs = () => docs().filter(([id, data]) => saved.get(id) !== JSON.stringify(data));
const isDirty = () => changedDocs().length > 0;

window.addEventListener('beforeunload', (e) => {
  if (isDirty()) e.preventDefault();
});

function errorText(err: unknown): string {
  if (err instanceof ApiError && err.kind === 'network') return `Không kết nối được máy chủ, thử lại sau ít phút. (${err.message})`;
  return (err as Error).message;
}

// ---------- Đăng nhập ----------

function showLogin(after: () => void): void {
  const user = h('input', { type: 'text', autocomplete: 'username', required: '' });
  const pass = h('input', { type: 'password', autocomplete: 'current-password', required: '' });
  const message = h('p', { class: 'error', role: 'alert' });
  const submit = h('button', { type: 'submit', class: 'btn' }, 'Đăng nhập');
  const form = h('form', { class: 'login card' }, h('h1', {}, 'Quản trị nội dung'), h('label', {}, 'Tên đăng nhập', user), h('label', {}, 'Mật khẩu', pass), message, submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = { username: user.value.trim(), password: pass.value };
    submit.disabled = true;
    message.textContent = '';
    try {
      await checkLogin(value);
      rememberLogin(value);
      after();
    } catch (err) {
      message.textContent = err instanceof ApiError && err.kind === 'auth' ? 'Sai tên đăng nhập hoặc mật khẩu.' : errorText(err);
    } finally {
      submit.disabled = false;
    }
  });
  app.replaceChildren(form);
  user.focus();
}

/** Hết phiên hay đổi mật khẩu giữa chừng: đăng nhập lại, giữ nguyên phần đang sửa. */
function logout(): void {
  rememberLogin(null);
  showLogin(() => (site ? renderEditor() : void openEditor()));
}

// ---------- Tải nội dung ----------

async function openEditor(): Promise<void> {
  app.replaceChildren(h('p', { class: 'center' }, 'Đang tải nội dung…'));
  let rows;
  try {
    rows = await loadRows();
  } catch (err) {
    app.replaceChildren(h('p', { class: 'center error' }, errorText(err)));
    return;
  }
  if (rows.length === 0) return showSeed('Chưa có nội dung đã sửa trên Supabase. Đưa nội dung đang có trên web lên để bắt đầu sửa.');
  try {
    const content = rowsToContent(rows);
    site = content.site;
    rooms = content.rooms;
  } catch (err) {
    return showSeed(`Nội dung trên Supabase bị thiếu hoặc lỗi:\n${(err as Error).message}`);
  }
  markSaved();
  renderEditor();
}

function markSaved(): void {
  saved = new Map(docs().map(([id, data]) => [id, JSON.stringify(data)]));
}

function showSeed(reason: string): void {
  const run = h('button', { type: 'button', class: 'btn' }, 'Đưa nội dung hiện tại lên Supabase');
  const message = h('p', { class: 'error', role: 'alert' });
  run.addEventListener('click', async () => {
    run.disabled = true;
    try {
      const local = await loadLocalContent();
      await saveRows(login!, [{ id: SITE_ROW, data: local.site }, ...local.rooms.map((r) => ({ id: r.id, data: r }))]);
      await openEditor();
    } catch (err) {
      if (err instanceof ApiError && err.kind === 'auth') return void logout();
      message.textContent = errorText(err);
      run.disabled = false;
    }
  });
  app.replaceChildren(h('div', { class: 'login card' }, h('h1', {}, 'Bắt đầu'), h('p', { class: 'pre' }, reason), message, run));
}

// ---------- Trình sửa ----------

const status = h('p', { class: 'status', role: 'status' });
const saveBtn = h('button', { type: 'button', class: 'btn' }, 'Lưu thay đổi');
saveBtn.addEventListener('click', () => void save());
const main = h('main', { class: 'editor-main' });
const nav = h('nav', { class: 'editor-nav' });
// Gõ lại vào ô bị báo lỗi thì bỏ viền đỏ; lần bấm lưu sau sẽ kiểm tra lại.
main.addEventListener('input', (e) => (e.target as HTMLElement).classList.remove('invalid'));

/** Mục chứa một lỗi: "site", id gian, hoặc "quiz" nếu lỗi nằm trong câu hỏi. */
function sectionOf(path: string): string {
  const [doc, first, , , field] = path.split('/');
  if (doc === SITE_ROW && first === 'ui') return UI_SECTION;
  return field === 'questions' ? QUIZ : doc;
}

function onChange(): void {
  saveBtn.disabled = !isDirty();
  status.textContent = isDirty() ? 'Có thay đổi chưa lưu.' : '';
  status.className = 'status';
}

function renderNav(): void {
  const bad = new Set(issues.map((i) => sectionOf(i.path)));
  const item = (id: string, label: string) => {
    const b = h('button', { type: 'button', 'aria-current': String(id === current) }, label, bad.has(id) ? h('span', { class: 'dot', title: 'Có chỗ cần sửa' }) : null);
    b.addEventListener('click', () => {
      current = id;
      renderSection();
      main.scrollTo?.(0, 0);
      window.scrollTo(0, 0);
    });
    return b;
  };
  nav.replaceChildren(
    item(SITE_ROW, 'Thông tin chung'),
    ...rooms.map((r) => item(r.id, `Gian ${r.order}: ${r.name.vi}`)),
    ...(findQuiz(rooms) ? [item(QUIZ, 'Trắc nghiệm')] : []),
    item(UI_SECTION, 'Chữ trên nút bấm'),
  );
}

function renderSection(): void {
  renderNav();
  if (current === SITE_ROW) main.replaceChildren(siteForm(site!, onChange));
  else if (current === UI_SECTION) main.replaceChildren(uiForm(site!, onChange));
  else if (current === QUIZ) {
    const quiz = findQuiz(rooms)!;
    main.replaceChildren(quizForm(quiz.room, quiz.index, onChange, renderSection));
  } else main.replaceChildren(roomForm(rooms.find((r) => r.id === current)!, onChange));
  markIssues();
}

function markIssues(): void {
  main.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  for (const issue of issues) {
    const el = main.querySelector(`[data-path="${CSS.escape(issue.path)}"]`);
    if (!el) continue;
    el.classList.add('invalid');
    el.setAttribute('title', issue.message);
  }
}

function renderEditor(): void {
  const viewSite = h('a', { href: '/', target: '_blank', rel: 'noopener' }, 'Xem web');
  const out = h('button', { type: 'button', class: 'btn small secondary' }, 'Đăng xuất');
  out.addEventListener('click', () => {
    if (isDirty() && !confirm('Còn thay đổi chưa lưu. Vẫn đăng xuất?')) return;
    rememberLogin(null);
    location.reload();
  });
  app.replaceChildren(
    h('header', { class: 'editor-head' }, h('h1', {}, 'Quản trị nội dung'), viewSite, out),
    h('div', { class: 'editor' }, nav, main),
    h('footer', { class: 'save-bar' }, status, saveBtn),
  );
  renderSection();
  onChange();
}

function validate(): Array<{ path: string; message: string }> {
  const found: Array<{ path: string; message: string }> = [];
  const collect = (doc: string, result: ReturnType<typeof SiteSchema.safeParse> | ReturnType<typeof RoomSchema.safeParse>) => {
    if (!result.success) for (const i of result.error.issues) found.push({ path: [doc, ...i.path].join('/'), message: i.message });
  };
  collect(SITE_ROW, SiteSchema.safeParse(site));
  for (const room of rooms) collect(room.id, RoomSchema.safeParse(room));
  return found;
}

async function save(): Promise<void> {
  issues = validate();
  if (issues.length > 0) {
    current = sectionOf(issues[0].path);
    renderSection();
    status.textContent = `Còn ${issues.length} chỗ cần sửa (ô viền đỏ).`;
    status.className = 'status error';
    main.querySelector<HTMLElement>('.invalid')?.focus();
    return;
  }
  renderSection();
  const changes = changedDocs().map(([id, data]) => ({ id, data }));
  if (changes.length === 0) return;
  saveBtn.disabled = true;
  status.textContent = 'Đang lưu…';
  status.className = 'status';
  try {
    await saveRows(login!, changes);
    markSaved();
    status.textContent = 'Đã lưu. Mở lại web là thấy nội dung mới.';
    status.className = 'status ok';
  } catch (err) {
    if (err instanceof ApiError && err.kind === 'auth') {
      // Giữ nguyên phần đang sửa; đăng nhập lại rồi bấm lưu tiếp.
      logout();
      return;
    }
    status.textContent = `Không lưu được: ${errorText(err)}`;
    status.className = 'status error';
    saveBtn.disabled = false;
  }
}

if (login) void openEditor();
else showLogin(() => void openEditor());
