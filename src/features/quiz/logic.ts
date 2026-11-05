export interface QuizState {
  index: number;
  score: number;
  picked: number | null;
  total: number;
}

export function startQuiz(total: number): QuizState {
  return { index: 0, score: 0, picked: null, total };
}

export function answerQuiz(state: QuizState, choice: number, answer: number): { state: QuizState; correct: boolean } {
  if (state.picked !== null) return { state, correct: state.picked === answer };
  const correct = choice === answer;
  return { state: { ...state, picked: choice, score: state.score + (correct ? 1 : 0) }, correct };
}

export function nextQuestion(state: QuizState): QuizState {
  return { ...state, index: state.index + 1, picked: null };
}

export function isFinished(state: QuizState): boolean {
  return state.index >= state.total;
}
