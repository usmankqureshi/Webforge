import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { Landing } from './landing';
import { PostDetail } from './post-detail';

const post = { id: 'post-1', title: 'A new story', body: '<p><strong>Hello</strong></p>', createdAt: '2026-09-21T12:00:00Z' };

describe('Home post links', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
  }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists every title with its creation date and links to the full post', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Landing);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/info').flush({ status: 'Ready' });
    http.expectOne('/api/posts').flush([post, { ...post, id: 'post-2', title: 'Another story' }]);
    harness.detectChanges();
    const entries = harness.routeNativeElement!.querySelectorAll('li');
    expect(entries.length).toBe(2);
    expect(entries[0].querySelector('a')!.textContent).toBe(post.title);
    expect(entries[0].querySelector('a')!.getAttribute('href')).toBe('/posts/post-1');
    expect(entries[0].querySelector('time')!.textContent).toContain('September 21, 2026');
    expect(entries[0].querySelector('time')!.getAttribute('datetime')).toBe(post.createdAt);
    await harness.navigateByUrl('/posts/post-1', PostDetail);
    http.expectOne('/api/posts/post-1').flush(post);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toBe(post.title);
    expect(harness.routeNativeElement!.querySelector('strong')!.textContent).toBe('Hello');
  });

  it('offers retry after a list failure and shows the empty state', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/', Landing);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/info').flush({ status: 'Ready' });
    http.expectOne('/api/posts').flush(null, { status: 503, statusText: 'Unavailable' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Could not load posts');
    harness.routeNativeElement!.querySelector('button')!.click();
    http.expectOne('/api/posts').flush([]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('No posts yet.');
  });

  it('handles missing posts and navigation to another post', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/posts/missing', PostDetail);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts/missing').flush(null, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Post not found.');
    await harness.navigateByUrl('/posts/post-1', PostDetail);
    http.expectOne('/api/posts/post-1').flush(post);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toBe(post.title);
  });
});
