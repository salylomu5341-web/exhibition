import { z } from 'zod';

export const LANGS = ['vi', 'mnong'] as const;
export type Lang = (typeof LANGS)[number];
export const ROOM_COUNT = 7;

const id = z.string().regex(/^[a-z0-9-]+$/, 'chỉ dùng chữ thường không dấu, số và dấu gạch ngang');
// Chỉ ký tự an toàn: không "..", "\", "?", "#", "%", khoảng trắng; mỗi đoạn không bắt đầu bằng dấu chấm.
const mediaPath = z
  .string()
  .regex(
    /^\/media\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.[a-z0-9]+$/,
    'đường dẫn phải bắt đầu bằng /media/, chỉ dùng chữ, số, "-", "_", "." và có đuôi file viết thường',
  );

const youtubeId = z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtubeId phải có đúng 11 ký tự');

export const LText = z.object({ vi: z.string().min(1), mnong: z.string().min(1) });
const LAudio = z.object({ vi: mediaPath.optional(), mnong: mediaPath.optional() });
const Position = z.object({ wall: z.enum(['left', 'right']), slot: z.number().int().min(0).max(2) });
const base = { id, position: Position };

const Board = z.object({ ...base, type: z.literal('board'), title: LText, body: LText, narration: LAudio.optional() });
const Gallery = z.object({
  ...base,
  type: z.literal('gallery'),
  title: LText,
  images: z.array(z.object({ src: mediaPath, alt: LText, caption: LText.optional() })).min(1),
});
const Video = z.object({
  ...base,
  type: z.literal('video'),
  title: LText,
  youtubeId,
});
const Gongs = z.object({
  ...base,
  type: z.literal('gongs'),
  title: LText,
  gongs: z.array(z.object({ name: LText, image: mediaPath, sound: mediaPath })).length(6, 'bộ chiêng phải có đúng 6 chiếc'),
});
const Ar = z.object({
  ...base,
  type: z.literal('ar'),
  title: LText,
  body: LText,
  glb: mediaPath,
  usdz: mediaPath.optional(),
  poster: mediaPath.optional(),
});
const Costume = z.object({
  ...base,
  type: z.literal('costume'),
  title: LText,
  costumes: z
    .array(
      z.object({
        name: LText,
        overlay: mediaPath.refine((p) => p.endsWith('.png'), 'ảnh trang phục (overlay) phải là PNG nền trong suốt, đuôi .png'),
        thumb: mediaPath,
      }),
    )
    .min(1),
});
const Quiz = z.object({
  ...base,
  type: z.literal('quiz'),
  title: LText,
  questions: z
    .array(
      z.object({
        question: LText,
        options: z.array(LText).length(4, 'mỗi câu có đúng 4 đáp án'),
        answer: z.number().int().min(0).max(3),
        explain: LText,
      }),
    )
    .min(1),
});

export const ExhibitSchema = z.discriminatedUnion('type', [Board, Gallery, Video, Gongs, Ar, Costume, Quiz]);

const Seo = z.object({
  title: z.string().min(1).max(60, 'title SEO tối đa 60 ký tự'),
  description: z.string().min(1).max(159, 'description SEO phải dưới 160 ký tự'),
  image: z
    .string()
    .regex(
      /^\/media\/(?:[A-Za-z0-9_-][A-Za-z0-9._-]*\/)*[A-Za-z0-9_-][A-Za-z0-9._-]*\.jpe?g$/,
      'ảnh chia sẻ phải là file JPG trong /media/ (đuôi .jpg viết thường, đường dẫn an toàn)',
    ),
});

export const RoomSchema = z
  .object({
    id,
    slug: id,
    order: z.number().int().min(1).max(ROOM_COUNT),
    name: LText,
    intro: LText,
    seo: Seo,
    exhibits: z.array(ExhibitSchema).min(1),
  })
  .superRefine((room, ctx) => {
    const ids = new Set<string>();
    const slots = new Set<string>();
    room.exhibits.forEach((ex, i) => {
      if (ids.has(ex.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exhibits', i, 'id'], message: `trùng id hiện vật "${ex.id}"` });
      }
      ids.add(ex.id);
      const slot = `${ex.position.wall}-${ex.position.slot}`;
      if (slots.has(slot)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exhibits', i, 'position'], message: `hai hiện vật cùng vị trí ${slot}` });
      }
      slots.add(slot);
    });
  });

export const SiteSchema = z.object({
  name: LText,
  welcome: LText,
  /** Video YouTube phát toàn màn hình khi khách bấm "Vào nhà dài"; bỏ trống thì vào thẳng. */
  introVideo: youtubeId.optional(),
  /** Bản dịch M'Nông của chữ giao diện (nút bấm, hướng dẫn), theo khoá trong UI (src/i18n/ui-strings.ts); thiếu thì dùng tiếng Việt. */
  ui: z.record(z.string().regex(/^[a-zA-Z]+$/), z.string().max(1000)).optional(),
  seo: Seo,
  rooms: z.array(id).length(ROOM_COUNT, `site.json phải liệt kê đúng ${ROOM_COUNT} gian`),
});

/** Sách 3D: các trang dựng từ tờ in của từng gian; ở đây chỉ còn thông tin sách và bìa. */
export const BookSchema = z.object({
  title: LText,
  intro: LText,
  seo: Seo,
  /** Ảnh bìa (tỉ lệ A4 đứng). Bỏ trống thì dùng bìa chữ. */
  cover: mediaPath.optional(),
});

export type LText = z.infer<typeof LText>;
export type Book = z.infer<typeof BookSchema>;
export type Exhibit = z.infer<typeof ExhibitSchema>;
export type ExhibitOf<T extends Exhibit['type']> = Extract<Exhibit, { type: T }>;
export type Room = z.infer<typeof RoomSchema>;
export type Site = z.infer<typeof SiteSchema>;

export function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => `${file} › ${issue.path.join('.') || '(gốc)'}: ${issue.message}`);
}
