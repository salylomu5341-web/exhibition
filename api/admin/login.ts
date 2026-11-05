import { handleLogin } from '../../server/admin.js';

export function POST(request: Request): Promise<Response> {
  return handleLogin(request, process.env);
}
