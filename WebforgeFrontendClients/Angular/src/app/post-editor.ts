import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RichText } from './rich-text';
import { Post } from './post';

@Component({
  selector: 'app-post-editor',
  imports: [FormsModule, RouterLink, RichText],
  templateUrl: './post-editor.html',
  styleUrl: './app.scss',
})
export class PostEditor implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly editingId = signal<string | null>(null);
  readonly thumbnail = signal<string | null>(null);
  readonly readingImage = signal(false);
  title = '';
  body = '';
  readonly loaded = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.editingId.set(id);
    if (!id) { this.loaded.set(true); return; }
    this.loading.set(true);
    this.http.get<Post>(`/api/posts/${encodeURIComponent(id)}`).subscribe({
      next: post => {
        this.title = post.title;
        this.body = post.body;
        this.thumbnail.set(post.thumbnail ?? null);
        this.loaded.set(true);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(error.status === 404 ? 'Post not found.' : 'Could not load this post. Please reload to try again.');
      },
    });
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
    if (!this.loaded() || this.busy() || this.readingImage() || !this.title.trim() || this.title.trim().length > 200) return;
    this.busy.set(true);
    this.error.set('');
    const id = this.editingId();
    const payload = { title: this.title.trim(), body: this.body, thumbnail: this.thumbnail() };
    const request = id
      ? this.http.put<Post>(`/api/posts/${id}`, payload)
      : this.http.post<Post>('/api/posts', payload);
    request.subscribe({
      next: () => {
        this.busy.set(false);
        void this.router.navigate(['/posts']);
      },
      error: () => {
        this.busy.set(false);
        this.error.set('Could not save the post. Your changes are still in the form. Please try again.');
      },
    });
  }

}
