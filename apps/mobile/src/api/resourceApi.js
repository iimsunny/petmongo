import { mockResources } from '../data/mockResources';
import { API_BASE_URL, buildUrl } from './client';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchResources = async ({ city, category } = {}) => {
  try {
    const url = buildUrl('/api/resources', { city, category });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch resources');
    }
    return await response.json();
  } catch (error) {
    // TODO: 接入真实 API 后移除 mock fallback
    await delay(200);
    return mockResources.filter((item) => {
      const cityOk = city ? item.city === city : true;
      const categoryOk = category ? item.category === category : true;
      return cityOk && categoryOk;
    });
  }
};

export const submitResource = async (payload) => {
  // TODO: 接入真实 API（提交资源进入审核）
  await delay(300);
  return { ok: true, id: `temp-${Date.now()}`, payload };
};

export const createResource = async (resourceData) => {
  const response = await fetch(`${API_BASE_URL}/api/resources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resourceData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create resource');
  }

  return response.json();
};


