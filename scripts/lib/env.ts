/** Nạp `.env.local` (khoá Supabase, mật khẩu) cho các script chạy trên máy; không có file thì bỏ qua. */
export function loadLocalEnv(): void {
  try {
    process.loadEnvFile('.env.local');
  } catch {
    // Không có .env.local: dùng biến môi trường sẵn có.
  }
}
