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
  thumbnail?: string | null;
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
  readonly thumbnail = signal<string | null>(null);
  readonly readingImage = signal(false);
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
    this.thumbnail.set(post.thumbnail ?? null);
    this.message.set('');
    this.error.set('');
  }

  reset(): void {
    this.editingId.set(null);
    this.title = '';
    this.body = '';
    this.thumbnail.set(null);
  }

  selectThumbnail(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 1024 * 1024) {
      this.error.set('Choose a PNG, JPEG, or WebP image up to 1 MB.');
      return;
    }
    this.error.set('');
    this.readingImage.set(true);
    const reader = new FileReader();
    reader.onload = () => {
      this.thumbnail.set(reader.result as string);
      this.readingImage.set(false);
    };
    reader.onerror = () => {
      this.error.set('Could not read the image. Please try again.');
      this.readingImage.set(false);
    };
    reader.readAsDataURL(file);
  }

  save(): void {
    if (this.busy() || this.readingImage() || !this.title.trim() || this.title.trim().length > 200) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    const id = this.editingId();
    const payload = { title: this.title.trim(), body: this.body, thumbnail: this.thumbnail() };
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
