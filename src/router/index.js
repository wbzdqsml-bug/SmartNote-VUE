import { createRouter, createWebHistory } from 'vue-router';

const NotesView = () => import('../views/NotesView.vue');
const TagsView = () => import('../views/TagsView.vue');
const SettingsView = () => import('../views/SettingsView.vue');

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'Notes' } },
    { path: '/notes', name: 'Notes', component: NotesView },
    { path: '/notes/:id', name: 'NoteDetails', component: NotesView, props: true },
    { path: '/tags', name: 'Tags', component: TagsView },
    { path: '/settings', name: 'Settings', component: SettingsView }
  ]
});

export default router;
