import type { ExhibitOf } from '../../content/schema';
import { t } from '../../i18n/lang';
import { UI } from '../../i18n/ui-strings';
import { h } from '../../ui/dom';
import type { PanelContent } from '../../ui/panel';
import type { PanelCtx } from '../types';
import { answerQuiz, isFinished, nextQuestion, startQuiz } from './logic';

const SOUND_RIGHT = '/media/ui/dung.wav';
const SOUND_WRONG = '/media/ui/sai.wav';

export function renderQuiz(ex: ExhibitOf<'quiz'>, ctx: PanelCtx): PanelContent {
  ctx.player.preload([SOUND_RIGHT, SOUND_WRONG]);
  let state = startQuiz(ex.questions.length);
  // Vùng thông báo giữ nguyên trong DOM để trình đọc màn hình đọc được khi nội dung đổi.
  const feedback = h('p', { id: 'q-feedback', class: 'q-feedback', role: 'status' });
  const score = h('p', { class: 'q-score', role: 'status' });
  const main = h('div', {});
  const actions = h('div', {});
  const el = h('div', { class: 'p-quiz' }, main, feedback, score, actions);

  type Focus = 'option' | 'next' | 'retry';
  const focusTo = (what: Focus | undefined) => {
    if (!what) return;
    const target = what === 'option' ? main.querySelector('.q-options button') : actions.querySelector('button');
    if (target instanceof HTMLElement) target.focus();
  };

  const render = (focus?: Focus) => {
    if (isFinished(state)) {
      const retry = h('button', { type: 'button', class: 'btn' }, t(UI.quizRetry));
      retry.addEventListener('click', () => {
        state = startQuiz(ex.questions.length);
        render('option');
      });
      main.replaceChildren();
      feedback.className = 'q-feedback';
      feedback.textContent = '';
      score.textContent = t(UI.quizScore).replace('{score}', String(state.score)).replace('{total}', String(state.total));
      actions.replaceChildren(retry);
      focusTo(focus);
      return;
    }

    score.textContent = '';
    const q = ex.questions[state.index];
    const options = h('div', { class: 'q-options' });
    q.options.forEach((option, i) => {
      const button = h('button', { type: 'button' }, t(option));
      if (state.picked !== null) {
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === state.picked) button.classList.add('wrong');
      }
      button.addEventListener('click', () => {
        const result = answerQuiz(state, i, q.answer);
        state = result.state;
        void ctx.player.play(result.correct ? SOUND_RIGHT : SOUND_WRONG);
        render('next');
      });
      options.append(button);
    });
    main.replaceChildren(
      h('p', { class: 'q-progress' }, `${t(UI.quizQuestion)} ${state.index + 1}/${state.total}`),
      h('p', { class: 'q-question' }, t(q.question)),
      options,
    );

    if (state.picked !== null) {
      const correct = state.picked === q.answer;
      feedback.className = `q-feedback ${correct ? 'ok' : 'bad'}`;
      feedback.textContent = `${t(correct ? UI.quizCorrect : UI.quizWrong)} ${t(q.explain)}`;
      const next = h('button', { type: 'button', class: 'btn', 'aria-describedby': 'q-feedback' }, t(UI.quizNext));
      next.addEventListener('click', () => {
        state = nextQuestion(state);
        render(isFinished(state) ? 'retry' : 'option');
      });
      actions.replaceChildren(next);
    } else {
      feedback.className = 'q-feedback';
      feedback.textContent = '';
      actions.replaceChildren();
    }
    focusTo(focus);
  };

  render();
  return { el, update: () => render(), dispose: () => undefined };
}
