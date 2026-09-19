import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

interface Post {
  id: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
}

@Component({
  selector: 'app-posts',
  imports: [FormsModule, DatePipe, RouterLink],
  templateUrl: './posts.html',
  styleUrl: './app.scss',
})
export class Posts implements OnInit {
  private readonly http = inject(HttpClient);
  readonly posts = signal<Post[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly editingId = signal<string | null>(null);
  readonly deleting = signal<Post | null>(null);
  title = '';
  body = '';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.http.get<Post[]>('/api/posts').subscribe({
      next: (posts) => { this.posts.set(posts); this.loading.set(false); },
      error: () => {
        this.loading.set(false);
        this.error.set('Could not load posts. Check that the API and database are running, then retry.');
      },
    });
  }

  edit(post: Post): void {
    this.editingId.set(post.id);
    this.title = post.title;
    this.body = post.body;
    this.message.set('');
    this.error.set('');
  }

  reset(): void {
    this.editingId.set(null);
    this.title = '';
    this.body = '';
  }

  save(): void {
    if (this.busy() || !this.title.trim() || this.title.trim().length > 200) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    const id = this.editingId();
    const payload = { title: this.title.trim(), body: this.body };
    const request = id
      ? this.http.put<Post>(`/api/posts/${id}`, payload)
      : this.http.post<Post>('/api/posts', payload);
    request.subscribe({
      next: (post) => {
        this.posts.update(posts => id ? posts.map(p => p.id === id ? post : p) : [post, ...posts]);
        this.busy.set(false);
        this.reset();
        this.message.set(id ? 'Post updated.' : 'Draft created.');
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Could not save the post. Your changes are still in the form. Please try again.');
      },
    });
  }

  deletePost(): void {
    const post = this.deleting();
    if (!post || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http.delete<void>(`/api/posts/${post.id}`).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p.id !== post.id));
        if (this.editingId() === post.id) this.reset();
        this.deleting.set(null);
        this.busy.set(false);
        this.message.set('Post deleted.');
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Could not delete the post. Please try again.');
      },
    });
  }
}
