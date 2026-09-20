import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './app.scss',
})
export class Landing implements OnInit {
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
