import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { bodyHtml } from './body-html';
import { Post } from './post';

@Component({
  selector: 'app-posts',
  imports: [DatePipe, RouterLink],
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
  readonly deleting = signal<Post | null>(null);
  private readonly document = inject(DOCUMENT);

  excerpt(body: string): string {
    const template = this.document.createElement('template');
    template.innerHTML = bodyHtml(body);
    template.content.querySelectorAll('script, style').forEach(node => node.remove());
    template.content.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, br, blockquote, pre')
      .forEach(node => node.append(this.document.createTextNode(' ')));
    const text = (template.content.textContent ?? '').replace(/\s+/g, ' ').trim();
    return text.length > 200 ? text.slice(0, 200).trimEnd() + '…' : text || 'No body yet.';
  }

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

  deletePost(): void {
    const post = this.deleting();
    if (!post || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.http.delete<void>(`/api/posts/${post.id}`).subscribe({
      next: () => {
        this.posts.update(posts => posts.filter(p => p.id !== post.id));
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
