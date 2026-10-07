import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { Posts } from './posts';
import { PostEditor } from './post-editor';
import { routes } from './app.routes';

const post = { id: 'post-1', title: 'First story', body: '<p>Hello <strong>world</strong></p>', createdAt: '2026-09-19T12:00:00Z', thumbnail: 'data:image/png;base64,example' };

describe('Post pages', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter(routes)],
  }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lists excerpts and links to separate pages, with confirmed deletion', async () => {
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/posts', Posts);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts').flush([post]);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    expect(page.querySelector('form')).toBeNull();
    expect(page.querySelector('a[href="/posts/new"]')).not.toBeNull();
    expect(page.querySelector('a[href="/posts/post-1/edit"]')).not.toBeNull();
    expect(page.querySelector('time')!.getAttribute('datetime')).toBe(post.createdAt);
    expect(page.querySelector('img')!.getAttribute('src')).toBe(post.thumbnail);
    expect(page.textContent).toContain('Hello world');
    expect(app.excerpt('<p>' + 'a'.repeat(250) + '</p>')).toBe('a'.repeat(200) + '…');
    expect(app.excerpt('<p>First</p><p>Second &amp; third</p>')).toBe('First Second & third');
    expect(app.excerpt('<p>Hello</p><script>alert(1)</script>')).toBe('Hello');
    page.querySelector<HTMLButtonElement>('[aria-label="Delete First story"]')!.click();
    http.expectNone('/api/posts/post-1');
    harness.detectChanges();
    page.querySelector<HTMLButtonElement>('.btn-danger')!.click();
    const request = http.expectOne('/api/posts/post-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    expect(app.posts()).toEqual([]);
  });

  it('creates a post and returns to the list', async () => {
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/posts/new', PostEditor);
    const http = TestBed.inject(HttpTestingController);
    app.title = ' First story ';
    app.body = post.body;
    app.save();
    const request = http.expectOne('/api/posts');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ title: post.title, body: post.body, thumbnail: null });
    request.flush(post);
    await harness.fixture.whenStable();
    http.expectOne('/api/posts').flush([post]);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Your posts');
  });

  it('loads an edit page directly and saves thumbnail removal', async () => {
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/posts/post-1/edit', PostEditor);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts/post-1').flush(post);
    harness.detectChanges();
    await harness.fixture.whenStable();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#title')!.value).toBe(post.title);
    expect(app.body).toBe(post.body);
    expect(app.thumbnail()).toBe(post.thumbnail);
    app.thumbnail.set(null);
    app.title = 'Updated';
    app.save();
    const request = http.expectOne('/api/posts/post-1');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ title: 'Updated', body: post.body, thumbnail: null });
    request.flush(post);
    await harness.fixture.whenStable();
    http.expectOne('/api/posts').flush([]);
  });

  it('preserves failed saves and rejects blank titles', async () => {
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/posts/new', PostEditor);
    const http = TestBed.inject(HttpTestingController);
    app.title = ' ';
    app.save();
    http.expectNone('/api/posts');
    app.title = 'Keep me';
    app.body = 'Unsaved';
    app.save();
    http.expectOne('/api/posts').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(app.body).toBe('Unsaved');
    expect(app.busy()).toBe(false);
    expect(app.error()).toContain('Could not save');
  });

  it('prevents editing a missing post', async () => {
    const harness = await RouterTestingHarness.create();
    const app = await harness.navigateByUrl('/posts/missing/edit', PostEditor);
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts/missing').flush(null, { status: 404, statusText: 'Not Found' });
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Post not found');
    expect(harness.routeNativeElement!.querySelector('form')).toBeNull();
    app.save();
    http.expectNone('/api/posts/missing');
  });
});
