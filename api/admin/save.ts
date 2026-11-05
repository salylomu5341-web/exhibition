import { handleSave } from '../../server/admin.js';

export function POST(request: Request): Promise<Response> {
  return handleSave(request, process.env);
}
