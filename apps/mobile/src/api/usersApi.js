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

export const fetchUser = async (userId) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};

export const updateUser = async (userId, payload) => {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};
