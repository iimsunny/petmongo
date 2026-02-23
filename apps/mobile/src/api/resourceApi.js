import { API_BASE_URL, buildUrl } from './client';

export const fetchResources = async ({ city, category } = {}) => {
  const url = buildUrl('/api/resources', { city, category });
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }
  return response.json();
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