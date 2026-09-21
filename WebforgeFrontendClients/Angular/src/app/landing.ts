import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink, DatePipe],
  templateUrl: './landing.html',
  styleUrl: './app.scss',
})
export class Landing implements OnInit {
  private readonly http = inject(HttpClient);
  readonly status = signal('Connecting to the API…');
  readonly connected = signal(false);

  readonly posts = signal<{ id: string; title: string; createdAt: string }[]>([]);
  readonly loadingPosts = signal(true);
  readonly postsError = signal('');

  loadPosts(): void {
    this.loadingPosts.set(true);
    this.postsError.set('');
    this.http.get<{ id: string; title: string; createdAt: string }[]>('/api/posts').subscribe({
      next: posts => { this.posts.set(posts); this.loadingPosts.set(false); },
      error: () => {
        this.postsError.set('Could not load posts. Please try again.');
        this.loadingPosts.set(false);
      },
    });
  }

  ngOnInit(): void {
    this.loadPosts();
    this.http.get<{ name: string; status: string }>('/api/info').subscribe({
      next: (info) => {
        this.connected.set(true);
        this.status.set(info.status);
      },
      error: () => this.status.set('API unavailable. Start the backend on port 5080.'),
    });
  }
}
