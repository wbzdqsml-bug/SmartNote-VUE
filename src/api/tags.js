import client from './client';

export const createTag = (payload) => client.post('/tags/', payload);

export const updateTag = (name, payload) => client.put(`/tags/${encodeURIComponent(name)}/`, payload);

export const deleteTag = (name) => client.delete(`/tags/${encodeURIComponent(name)}/`);
