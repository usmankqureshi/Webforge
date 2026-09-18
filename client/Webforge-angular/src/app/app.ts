import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly http = inject(HttpClient);
  readonly status = signal('Connecting to the API…');
  readonly connected = signal(false);

  ngOnInit(): void {
    this.http.get<{ name: string; status: string }>('/api/info').subscribe({
      next: (info) => {
        this.connected.set(true);
        this.status.set(info.status);
      },
      error: () => this.status.set('API unavailable. Start the backend on port 5080.'),
    });
  }
}
