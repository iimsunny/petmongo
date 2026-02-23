import { API_BASE_URL } from './client';

const parseError = async (response) => {
  try {
    const data = await response.json();
    if (data?.message) {
      return Array.isArray(data.message) ? data.message.join(', ') : data.message;
    }
  } catch {
    // ignore
  }
  return 'Request failed';
};

export const fetchPendingResourceReviews = async ({ reviewerId, limit = 50 }) => {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  if (reviewerId) {
    params.append('reviewerId', reviewerId);
  }
  const response = await fetch(
    `${API_BASE_URL}/api/resources/reviews/pending?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};

export const reviewResource = async ({ resourceId, action, reviewerId, reviewNote }) => {
  const response = await fetch(`${API_BASE_URL}/api/resources/reviews/${resourceId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewerId, reviewNote }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};

export const fetchPendingPostReviews = async ({ reviewerId, limit = 50 }) => {
  const params = new URLSearchParams();
  params.append('limit', String(limit));
  if (reviewerId) {
    params.append('reviewerId', reviewerId);
  }
  const response = await fetch(
    `${API_BASE_URL}/api/discover/reviews/pending?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};

export const reviewPost = async ({ postId, action, reviewerId, reviewNote }) => {
  const response = await fetch(`${API_BASE_URL}/api/discover/reviews/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, reviewerId, reviewNote }),
  });
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
};
