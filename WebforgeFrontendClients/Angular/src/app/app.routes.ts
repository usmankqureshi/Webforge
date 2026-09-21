import { Routes } from '@angular/router';
import { Landing } from './landing';

export const routes: Routes = [
  { path: '', component: Landing, pathMatch: 'full' },
  { path: 'posts', loadComponent: () => import('./posts').then(m => m.Posts) },
  { path: 'posts/:id', loadComponent: () => import('./post-detail').then(m => m.PostDetail) },
  { path: '**', redirectTo: '' },
];
