import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { bodyHtml } from './body-html';

interface PostDetailData {
  title: string;
  body: string;
  createdAt: string;
  thumbnail?: string | null;
}

@Component({
  selector: 'app-post-detail',
  imports: [DatePipe, RouterLink],
  styleUrl: './app.scss',
  template: `
    <main class="container py-5">
      <a routerLink="/" class="brand d-inline-block text-decoration-none mb-4" aria-label="Webforge home">WEBFORGE</a>
      <div class="mb-4"><a routerLink="/" class="link-success">← All posts</a></div>
      @if (loading()) {
        <p role="status">Loading post…</p>
      } @else if (error()) {
        <div class="alert alert-danger" role="alert">{{ error() }}</div>
      } @else if (post(); as post) {
        <article class="card p-4 p-md-5">
          <h1 class="display-5 fw-bold text-break">{{ post.title }}</h1>
          <time class="text-secondary mb-4" [attr.datetime]="post.createdAt">{{ post.createdAt | date:'longDate' }}</time>
          @if (post.thumbnail) { <img [src]="post.thumbnail" alt="" class="thumbnail mb-4"> }
          <div class="post-body post-detail-body" [innerHTML]="bodyHtml(post.body || 'No body yet.')"></div>
        </article>
      }
    </main>
  `,
})
export class PostDetail implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly post = signal<PostDetailData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly bodyHtml = bodyHtml;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => { this.loading.set(true); this.error.set(''); this.post.set(null); }),
      switchMap(params => this.http.get<PostDetailData>(`/api/posts/${encodeURIComponent(params.get('id') ?? '')}`).pipe(
        catchError((error: HttpErrorResponse) => {
          this.error.set(error.status === 404 ? 'Post not found.' : 'Could not load this post. Please try again later.');
          return of(null);
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(post => { this.post.set(post); this.loading.set(false); });
  }
}
