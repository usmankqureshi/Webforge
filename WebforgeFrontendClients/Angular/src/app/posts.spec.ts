import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Posts } from './posts';
import { provideRouter } from '@angular/router';
import { By } from '@angular/platform-browser';
import { RichText } from './rich-text';

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
    expect(create.request.body).toEqual({ title: 'First story', body: 'Hello', thumbnail: null });
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
  it('loads an existing thumbnail and sends its removal on update', () => {
    const { app, http } = setup();
    app.edit({ ...post, thumbnail: 'data:image/png;base64,example' });
    expect(app.thumbnail()).toBe('data:image/png;base64,example');
    app.thumbnail.set(null);
    app.save();
    const request = http.expectOne('/api/posts/post-1');
    expect(request.request.body.thumbnail).toBeNull();
    request.flush({ ...post, thumbnail: null });
    expect(app.thumbnail()).toBeNull();
  });

  it('rejects unsupported files without discarding the current thumbnail', () => {
    const { app } = setup();
    app.thumbnail.set('existing-image');
    const input = { files: [new File(['<svg/>'], 'image.svg', { type: 'image/svg+xml' })], value: 'image.svg' };
    app.selectThumbnail({ target: input } as unknown as Event);
    expect(app.error()).toContain('PNG, JPEG, or WebP');
    expect(app.thumbnail()).toBe('existing-image');
    expect(app.readingImage()).toBe(false);
  });
  it('renders formatted bodies while sanitizing untrusted HTML', () => {
    const { fixture } = setup([{ ...post, body: '<p><strong>Bold story</strong><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">Bad link</a></p>' }]);
    const body = fixture.nativeElement.querySelector('.post-body');
    expect(body.querySelector('strong').textContent).toBe('Bold story');
    expect(body.innerHTML).not.toContain('onerror');
    expect(body.querySelector('a').getAttribute('href')).not.toBe('javascript:alert(1)');
  });

  it('saves editor HTML, resets after saving, and reloads formatting for editing', () => {
    const { fixture, app, http } = setup([]);
    const editor = fixture.debugElement.query(By.directive(RichText)).componentInstance as RichText;
    app.title = 'Formatted story';
    editor.editor!.chain().toggleBold().insertContent('Rich content').run();
    fixture.detectChanges();
    expect(editor.canUndo()).toBe(true);
    app.save();
    const request = http.expectOne('/api/posts');
    expect(request.request.body.body).toBe('<p><strong>Rich content</strong></p>');
    const saved = { ...post, title: app.title, body: request.request.body.body };
    request.flush(saved);
    fixture.detectChanges();
    expect(editor.editor!.isEmpty).toBe(true);
    app.edit(saved);
    fixture.detectChanges();
    expect(editor.editor!.getHTML()).toBe(saved.body);
    expect(editor.canUndo()).toBe(false);
  });

});
