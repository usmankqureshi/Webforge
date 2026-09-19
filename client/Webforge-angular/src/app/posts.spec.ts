import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Posts } from './posts';
import { provideRouter } from '@angular/router';

const post = { id: 'post-1', title: 'First story', body: 'Hello', status: 'Draft', createdAt: '2026-09-19T12:00:00Z' };

describe('Post workspace', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Posts],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  function setup(posts = [post]) {
    const fixture = TestBed.createComponent(Posts);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts').flush(posts);
    fixture.detectChanges();
    return { fixture, app: fixture.componentInstance, http };
  }

  it('lists posts and loads an existing post into the editor', async () => {
    const { fixture, app } = setup();
    expect(fixture.nativeElement.textContent).toContain('First story');
    fixture.nativeElement.querySelector('[aria-label="Edit First story"]').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(app.editingId()).toBe(post.id);
    expect(fixture.nativeElement.querySelector('#title').value).toBe(post.title);
  });

  it('creates and updates a post', () => {
    const { app, http } = setup([]);
    app.title = ' First story ';
    app.body = 'Hello';
    app.save();
    const create = http.expectOne('/api/posts');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ title: 'First story', body: 'Hello' });
    create.flush(post);
    expect(app.posts()).toEqual([post]);
    expect(app.title).toBe('');
    app.edit(post);
    app.title = 'Updated';
    app.save();
    const update = http.expectOne('/api/posts/post-1');
    expect(update.request.method).toBe('PUT');
    update.flush({ ...post, title: 'Updated' });
    expect(app.posts()[0].title).toBe('Updated');
  });

  it('requires confirmation before deleting', () => {
    const { fixture, app, http } = setup();
    fixture.nativeElement.querySelector('[aria-label="Delete First story"]').click();
    http.expectNone('/api/posts/post-1');
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.btn-danger').click();
    const request = http.expectOne('/api/posts/post-1');
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
    expect(app.posts()).toEqual([]);
  });

  it('preserves unsaved content after an API error and rejects blank titles', () => {
    const { app, http } = setup([]);
    app.title = '   ';
    app.save();
    http.expectNone('/api/posts');
    app.title = 'Keep me';
    app.body = 'Unsaved content';
    app.save();
    http.expectOne('/api/posts').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(app.body).toBe('Unsaved content');
    expect(app.busy()).toBe(false);
    expect(app.error()).toContain('Could not save');
  });

  it('allows retrying a failed list request', () => {
    const fixture = TestBed.createComponent(Posts);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/posts').flush(null, { status: 503, statusText: 'Unavailable' });
    expect(fixture.componentInstance.error()).toContain('Could not load');
    fixture.componentInstance.load();
    http.expectOne('/api/posts').flush([]);
    expect(fixture.componentInstance.error()).toBe('');
  });
});
