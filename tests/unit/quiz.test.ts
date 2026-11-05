import { describe, expect, it } from 'vitest';
import { answerQuiz, isFinished, nextQuestion, startQuiz } from '../../src/features/quiz/logic';

describe('quiz logic', () => {
  it('bắt đầu ở câu 0, chưa chọn, 0 điểm', () => {
    expect(startQuiz(3)).toEqual({ index: 0, score: 0, picked: null, total: 3 });
  });

  it('chọn đúng cộng điểm, chọn sai không cộng', () => {
    const right = answerQuiz(startQuiz(2), 1, 1);
    expect(right.correct).toBe(true);
    expect(right.state.score).toBe(1);
    const wrong = answerQuiz(startQuiz(2), 0, 1);
    expect(wrong.correct).toBe(false);
    expect(wrong.state.score).toBe(0);
    expect(wrong.state.picked).toBe(0);
  });

  it('không cho chọn lại trong cùng một câu', () => {
    const first = answerQuiz(startQuiz(2), 0, 1);
    const again = answerQuiz(first.state, 1, 1);
    expect(again.state).toBe(first.state);
    expect(again.state.score).toBe(0);
  });

  it('qua câu tiếp và kết thúc sau câu cuối', () => {
    let s = startQuiz(2);
    s = nextQuestion(answerQuiz(s, 0, 0).state);
    expect(s).toEqual({ index: 1, score: 1, picked: null, total: 2 });
    expect(isFinished(s)).toBe(false);
    s = nextQuestion(answerQuiz(s, 2, 3).state);
    expect(isFinished(s)).toBe(true);
    expect(s.score).toBe(1);
  });
});
