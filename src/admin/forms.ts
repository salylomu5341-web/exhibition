import type { ExhibitOf, LText, Room, Site } from '../content/schema';
import { UI, type UiKey } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import { parseYoutubeId, youtubeThumb } from './youtube';

type Change = () => void;

const TYPE_LABEL: Record<string, string> = {
  board: 'Bảng chữ',
  gallery: 'Khung ảnh',
  video: 'Video',
  gongs: 'Bộ chiêng',
  ar: 'Mô hình 3D (AR)',
  costume: 'Góc chụp ảnh trang phục',
  quiz: 'Trắc nghiệm',
};
const LETTERS = ['A', 'B', 'C', 'D'];
const BODY_HINT = 'Dòng trống để tách đoạn. Dòng bắt đầu bằng "## " là tiêu đề nhỏ.';

function autosize(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  el.style.height = `${el.scrollHeight + 2}px`;
}

function textBox(value: string, long: boolean, path: string, onInput: (v: string) => void): HTMLElement {
  if (!long) {
    const input = h('input', { type: 'text', 'data-path': path });
    input.value = value;
    input.addEventListener('input', () => onInput(input.value));
    return input;
  }
  const area = h('textarea', { rows: '3', 'data-path': path });
  area.value = value;
  area.addEventListener('input', () => {
    onInput(area.value);
    autosize(area);
  });
  // Đo chiều cao sau khi ô đã nằm trong trang.
  requestAnimationFrame(() => autosize(area));
  return area;
}

/** Ô chữ song ngữ: sửa thẳng vào `target`. */
/** `hint`: ghi chú cách viết bài (tách đoạn, tiêu đề nhỏ) cho các ô bài dài. */
export function ltext(label: string, target: LText, path: string, change: Change, long = false, hint = false): HTMLElement {
  const col = (lang: 'vi' | 'mnong', name: string) =>
    h(
      'label',
      { class: 'lt-col' },
      h('span', { class: 'lt-lang' }, name),
      textBox(target[lang], long, `${path}/${lang}`, (v) => {
        target[lang] = v;
        change();
      }),
    );
  return h(
    'div',
    { class: 'field' },
    h('div', { class: 'field-label' }, label),
    h('div', { class: 'lt' }, col('vi', 'Tiếng Việt'), col('mnong', "Tiếng M'Nông")),
    hint ? h('p', { class: 'hint' }, BODY_HINT) : null,
  );
}

/** Ô link YouTube kèm ảnh xem trước. `optional`: để trống được (gọi `set(undefined)`). */
function youtubeField(label: string, value: string | undefined, path: string, set: (id: string | undefined) => void, change: Change, optional = false): HTMLElement {
  const input = h('input', { type: 'text', 'data-path': path, placeholder: 'Dán link YouTube, ví dụ https://youtu.be/…' });
  input.value = value ? `https://youtu.be/${value}` : '';
  const thumb = h('img', { class: 'yt-thumb', alt: 'Ảnh xem trước video' });
  const error = h('p', { class: 'field-error' });
  const show = (id: string | null) => {
    thumb.hidden = !id;
    if (id) thumb.src = youtubeThumb(id);
  };
  show(value ?? null);
  input.addEventListener('input', () => {
    const text = input.value.trim();
    const id = parseYoutubeId(text);
    show(id);
    error.textContent = text && !id ? 'Không đọc được link YouTube này.' : '';
    // Link sai vẫn ghi vào bản nháp để bước kiểm tra trước khi lưu tô đỏ ô này.
    set(id ?? (text || (optional ? undefined : '')));
    change();
  });
  return h('div', { class: 'field' }, h('div', { class: 'field-label' }, label), h('div', { class: 'yt' }, input, thumb), error);
}

const card = (title: string, ...children: Array<HTMLElement | null>) => h('section', { class: 'card' }, h('h3', {}, title), ...children);

export function siteForm(site: Site, change: Change): HTMLElement {
  return h(
    'div',
    {},
    h('h2', {}, 'Thông tin chung'),
    ltext('Tên triển lãm', site.name, 'site/name', change),
    ltext('Lời chào (trang chủ và bảng ở sảnh)', site.welcome, 'site/welcome', change, true, true),
    youtubeField(
      'Video mở đầu (phát khi khách bấm "Vào nhà dài"; để trống thì vào thẳng)',
      site.introVideo,
      'site/introVideo',
      (id) => {
        if (id === undefined) delete site.introVideo;
        else site.introVideo = id;
      },
      change,
      true,
    ),
  );
}

export function roomForm(room: Room, change: Change): HTMLElement {
  const cards = room.exhibits.map((ex, i) => {
    const p = `${room.id}/exhibits/${i}`;
    const where = `vách ${ex.position.wall === 'left' ? 'trái' : 'phải'}, chỗ ${ex.position.slot + 1}`;
    const parts: Array<HTMLElement | null> = [ltext('Tiêu đề', ex.title, `${p}/title`, change)];
    switch (ex.type) {
      case 'board':
      case 'ar':
        parts.push(ltext('Nội dung', ex.body, `${p}/body`, change, true, true));
        break;
      case 'video':
        parts.push(youtubeField('Link YouTube', ex.youtubeId, `${p}/youtubeId`, (id) => (ex.youtubeId = id ?? ''), change));
        break;
      case 'gongs':
        ex.gongs.forEach((g, j) => parts.push(ltext(`Tên chiêng ${j + 1}`, g.name, `${p}/gongs/${j}/name`, change)));
        break;
      case 'costume':
        ex.costumes.forEach((c, j) => parts.push(ltext(`Tên bộ trang phục ${j + 1}`, c.name, `${p}/costumes/${j}/name`, change)));
        break;
      case 'quiz':
        parts.push(h('p', { class: 'hint' }, 'Câu hỏi sửa ở mục "Trắc nghiệm".'));
        break;
      case 'gallery':
        parts.push(h('p', { class: 'hint' }, 'Ảnh chưa sửa được ở đây.'));
        break;
    }
    return card(`${TYPE_LABEL[ex.type]} · ${where}`, ...parts);
  });
  return h(
    'div',
    {},
    h('h2', {}, `Gian ${room.order}`),
    ltext('Tên gian', room.name, `${room.id}/name`, change),
    ltext('Giới thiệu ngắn', room.intro, `${room.id}/intro`, change, true),
    ...cards,
  );
}

/** Vị trí hiện vật trắc nghiệm (gian và số thứ tự), nếu có. */
export function findQuiz(rooms: Room[]): { room: Room; index: number } | null {
  for (const room of rooms) {
    const index = room.exhibits.findIndex((e) => e.type === 'quiz');
    if (index >= 0) return { room, index };
  }
  return null;
}

const blankText = (): LText => ({ vi: '', mnong: '' });

/** `rerender`: dựng lại sau khi thêm, xoá hay đổi thứ tự câu. */
export function quizForm(room: Room, index: number, change: Change, rerender: () => void): HTMLElement {
  const ex = room.exhibits[index] as ExhibitOf<'quiz'>;
  const qs = ex.questions;
  const p = `${room.id}/exhibits/${index}`;
  const act = (label: string, disabled: boolean, run: () => void) => {
    const b = h('button', { type: 'button', class: 'btn small secondary' }, label);
    b.disabled = disabled;
    b.addEventListener('click', () => {
      run();
      change();
      rerender();
    });
    return b;
  };
  const swap = (a: number, b: number) => {
    [qs[a], qs[b]] = [qs[b], qs[a]];
  };

  const list = qs.map((q, k) => {
    const qp = `${p}/questions/${k}`;
    const options = q.options.map((option, n) => {
      const radio = h('input', { type: 'radio', name: `dap-an-${k}` });
      radio.checked = q.answer === n;
      radio.addEventListener('change', () => {
        q.answer = n;
        change();
      });
      return h(
        'div',
        { class: 'q-option' },
        ltext(`Đáp án ${LETTERS[n]}`, option, `${qp}/options/${n}`, change),
        h('label', { class: 'q-correct' }, radio, ` Đáp án ${LETTERS[n]} là đáp án đúng`),
      );
    });
    const tools = h(
      'div',
      { class: 'q-tools' },
      act('Lên', k === 0, () => swap(k, k - 1)),
      act('Xuống', k === qs.length - 1, () => swap(k, k + 1)),
      act('Xoá câu', qs.length === 1, () => {
        if (confirm(`Xoá câu ${k + 1}?`)) qs.splice(k, 1);
      }),
    );
    return card(
      `Câu ${k + 1}`,
      ltext('Câu hỏi', q.question, `${qp}/question`, change, true),
      ...options,
      ltext('Giải thích (hiện sau khi khách chọn)', q.explain, `${qp}/explain`, change, true),
      tools,
    );
  });

  const add = h('button', { type: 'button', class: 'btn secondary' }, 'Thêm câu hỏi');
  add.addEventListener('click', () => {
    qs.push({ question: blankText(), options: [blankText(), blankText(), blankText(), blankText()], answer: 0, explain: blankText() });
    change();
    rerender();
  });

  return h('div', {}, h('h2', {}, `Trắc nghiệm (${qs.length} câu)`), ltext('Tiêu đề', ex.title, `${p}/title`, change), ...list, add);
}

/** Chữ trên nút bấm, hướng dẫn: tiếng Việt cố định, ô bên cạnh nhập tiếng M'Nông (để trống thì web dùng tiếng Việt). */
export function uiForm(site: Site, change: Change): HTMLElement {
  const rows = (Object.entries(UI) as Array<[UiKey, LText]>).map(([key, text]) => {
    const long = text.vi.includes('\n') || text.vi.length > 70;
    const input = long ? h('textarea', { rows: '3', 'data-path': `site/ui/${key}` }) : h('input', { type: 'text', 'data-path': `site/ui/${key}` });
    input.value = site.ui?.[key] ?? '';
    input.setAttribute('placeholder', 'Tiếng M\'Nông (để trống: dùng tiếng Việt)');
    input.addEventListener('input', () => {
      const ui = { ...(site.ui ?? {}) };
      if (input.value.trim()) ui[key] = input.value;
      else delete ui[key];
      if (Object.keys(ui).length) site.ui = ui;
      else delete site.ui;
      change();
    });
    return h('label', { class: 'ui-row' }, h('span', { class: 'ui-vi pre' }, text.vi), input);
  });
  return h(
    'div',
    {},
    h('h2', {}, 'Chữ trên nút bấm'),
    h(
      'p',
      { class: 'hint' },
      'Bản dịch tiếng M\'Nông cho nút bấm và hướng dẫn trên web, sách, tờ in. Ô để trống thì web dùng chữ tiếng Việt. Giữ nguyên các chỗ trong ngoặc nhọn như {n}, {score}, {total}, {p}: web tự điền số vào đó. Ô nhiều dòng: mỗi dòng là một bước.',
    ),
    h('div', { class: 'card ui-list' }, ...rows),
  );
}
