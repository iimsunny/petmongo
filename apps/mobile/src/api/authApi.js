import { API_BASE_URL } from './client';

const parseError = async (response) => {
  try {
    const data = await response.json();
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join('，') : data.message;
    }
  } catch {
    // ignore
  }
  return '请求失败，请稍后再试';
};

export const oneClickLogin = async ({ phone }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/one-click`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    return response.json();
  } catch (error) {
    if (error.message === 'Network request failed' || error.message.includes('fetch failed')) {
      throw new Error('无法连接到服务器，请检查网络连接或确认后端服务是否运行在 192.168.1.9:3000');
    }
    throw error;
  }
};
