import client from './client';

export const fetchNotes = () => client.get('/notes/');

export const fetchNoteById = (id) => client.get(`/notes/${id}/`);

export const createNote = (payload) => client.post('/notes/', payload);

export const updateNote = (id, payload) => client.put(`/notes/${id}/`, payload);

export const deleteNote = (id) => client.delete(`/notes/${id}/`);

export const fetchTags = () => client.get('/tags/');
