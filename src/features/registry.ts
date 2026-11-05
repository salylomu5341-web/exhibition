import type { Exhibit } from '../content/schema';
import type { PanelContent } from '../ui/panel';
import { renderAr } from './ar';
import { renderBoard } from './board';
import { renderCostume } from './costume/booth';
import { renderGallery } from './gallery';
import { renderGongs } from './gongs';
import { renderQuiz } from './quiz/panel';
import type { PanelCtx } from './types';
import { renderVideo } from './video';

export function renderExhibit(ex: Exhibit, ctx: PanelCtx): PanelContent {
  switch (ex.type) {
    case 'board':
      return renderBoard(ex);
    case 'gallery':
      return renderGallery(ex);
    case 'video':
      return renderVideo(ex);
    case 'gongs':
      return renderGongs(ex, ctx);
    case 'ar':
      return renderAr(ex);
    case 'costume':
      return renderCostume(ex);
    case 'quiz':
      return renderQuiz(ex, ctx);
  }
}
