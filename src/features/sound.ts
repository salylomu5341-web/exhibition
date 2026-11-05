type AudioContextCtor = typeof AudioContext;

/** Phát âm thanh ngắn (chiêng, đúng/sai) không trễ bằng Web Audio. */
export class SoundPlayer {
  private ctx: AudioContext | null = null;
  private loading = new Map<string, Promise<AudioBuffer | null>>();
  private pending = new Set<string>();

  /** Gọi trong sự kiện chạm/bấm của người dùng (chính sách tự phát của trình duyệt). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      // iPhone: phát tiếng kể cả khi gạt công tắc im lặng.
      if ('audioSession' in navigator) (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
      this.pending.forEach((url) => void this.load(url));
      this.pending.clear();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  preload(urls: string[]): void {
    urls.forEach((url) => {
      if (this.ctx) void this.load(url);
      else this.pending.add(url);
    });
  }

  async play(url: string): Promise<boolean> {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return false;
    const buffer = await this.load(url);
    if (!buffer) return false;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return true;
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    let promise = this.loading.get(url);
    if (!promise) {
      promise = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .catch((err: unknown) => {
          console.warn(`Không tải được âm thanh ${url}`, err);
          this.loading.delete(url);
          return null;
        });
      this.loading.set(url, promise);
    }
    return promise;
  }
}
