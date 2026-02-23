import { API_BASE_URL } from './client';

export const fetchDiscoverPosts = async ({ category, city, q } = {}) => {
  const params = new URLSearchParams();
  if (category && category !== '推荐') {
    params.append('category', category);
  }
  if (city) {
    params.append('city', city);
  }
  if (q) {
    params.append('q', q);
  }

  const response = await fetch(`${API_BASE_URL}/api/discover?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch discover posts');
  }
  return response.json();
};

export const createDiscoverPost = async (postData) => {
  const response = await fetch(`${API_BASE_URL}/api/discover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to create post');
  }

  return response.json();
};
