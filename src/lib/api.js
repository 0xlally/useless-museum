const DONE = ['succeeded', 'success', 'completed'];
const FAILED = ['failed', 'error', 'cancelled'];

export const isDone = j => DONE.includes(j.status);
export const isFailed = j => FAILED.includes(j.status);
export const isActive = j => !isDone(j) && !isFailed(j);

export const STATUS_LABEL = { queued: '排队中', pending: '排队中', processing: '生成中', succeeded: '已入藏', success: '已入藏', completed: '已入藏', failed: '未完成', error: '未完成', cancelled: '已取消' };

export async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(path, { signal: AbortSignal.timeout(20000), ...options });
  } catch (e) {
    throw Error(e.name === 'TimeoutError' ? '服务响应超时' : '无法连接生成服务');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(body.error?.message || body.error || body.message || '服务暂时不可用');
  return body;
}

export function normalizeJob(j) {
  return { ...j, status: String(j.status || 'pending').toLowerCase(), modelUrl: j.modelUrl || j.result?.modelUrl };
}

export function formatElapsed(since) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(since).getTime()) / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
