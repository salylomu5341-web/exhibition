import { handleContent } from '../server/admin.js';

export function GET(): Promise<Response> {
  return handleContent(process.env);
}
