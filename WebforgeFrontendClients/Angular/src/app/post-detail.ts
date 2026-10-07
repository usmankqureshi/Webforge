import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, switchMap, tap } from 'rxjs';
import { bodyHtml } from './body-html';

interface PostDetailData {
  id: string;
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
      <div class="mb-4"><a routerLink="/posts" class="link-success">← All posts</a></div>
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
          <div class="d-flex gap-2 mt-4">
            <a class="btn btn-outline-success btn-sm" [routerLink]="['/posts', post.id, 'edit']" [attr.aria-label]="'Edit ' + post.title">Edit</a>
            <button class="btn btn-outline-danger btn-sm" type="button" [disabled]="busy() || deleting()" (click)="deleting.set(true)" [attr.aria-label]="'Delete ' + post.title">Delete</button>
          </div>
          @if (deleteError()) { <div class="alert alert-danger mt-3" role="alert">{{ deleteError() }}</div> }
          @if (deleting()) {
            <section class="alert alert-warning mt-3" aria-labelledby="delete-heading">
              <h2 id="delete-heading" class="h5">Delete “{{ post.title }}”?</h2>
              <p>This permanently deletes the post.</p>
              <button class="btn btn-danger me-2" type="button" [disabled]="busy()" (click)="deletePost()">Confirm delete</button>
              <button class="btn btn-outline-secondary" type="button" [disabled]="busy()" (click)="deleting.set(false)">Cancel</button>
            </section>
          }
        </article>
      }
    </main>
  `,
})
export class PostDetail implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  readonly post = signal<PostDetailData | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly bodyHtml = bodyHtml;
  readonly busy = signal(false);
  readonly deleting = signal(false);
  readonly deleteError = signal('');

  deletePost(): void {
    const post = this.post();
    if (!post || !this.deleting() || this.busy()) return;
    this.busy.set(true);
    this.deleteError.set('');
    this.http.delete<void>(`/api/posts/${encodeURIComponent(post.id)}`).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => { void this.router.navigate(['/posts']); },
      error: () => {
        this.busy.set(false);
        this.deleteError.set('Could not delete the post. Please try again.');
      },
    });
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(
      tap(() => { this.loading.set(true); this.error.set(''); this.post.set(null); this.deleting.set(false); this.deleteError.set(''); this.busy.set(false); }),
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
