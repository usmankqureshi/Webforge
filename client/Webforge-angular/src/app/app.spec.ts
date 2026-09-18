import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('shows the API connection status', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/info')
      .flush({ name: 'Webforge', status: 'Foundation ready' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Foundation ready');
    expect(fixture.componentInstance.connected()).toBe(true);
  });

  it('explains how to recover when the API is unavailable', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/info')
      .flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Start the backend on port 5080');
    expect(fixture.componentInstance.connected()).toBe(false);
  });
});
