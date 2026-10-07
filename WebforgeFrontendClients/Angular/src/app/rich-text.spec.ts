import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { EditorComponent } from '@tinymce/tinymce-angular';
import { RichText, bodyHtml } from './rich-text';

// Exercise our Angular binding without loading an iframe editor in jsdom.
@Component({ selector: 'editor', template: '' })
class EditorStub {
  @Input() licenseKey = '';
  @Input() init: unknown;
  @Input() disabled = false;
  @Input() ngModel = '';
  @Input() ngModelOptions: unknown;
  @Output() ngModelChange = new EventEmitter<string>();
}

describe('TinyMCE body integration', () => {
  beforeEach(() => {
    TestBed.overrideComponent(RichText, {
      remove: { imports: [EditorComponent, FormsModule] },
      add: { imports: [EditorStub] },
    });
  });

  function setup(value = '') {
    const fixture = TestBed.createComponent(RichText);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    const editor = () => fixture.debugElement.query(By.directive(EditorStub)).componentInstance as EditorStub;
    return { fixture, component: fixture.componentInstance, editor };
  }

  it('loads formatted content and preserves literal plain text', () => {
    const { fixture, editor } = setup('First <idea> & thought\nSecond line');
    expect(editor().ngModel).toBe('<p>First &lt;idea&gt; &amp; thought</p><p>Second line</p>');
    fixture.componentRef.setInput('value', '<p><strong>Bold</strong></p>');
    fixture.detectChanges();
    expect(editor().ngModel).toBe('<p><strong>Bold</strong></p>');
    expect(bodyHtml('1 < 2')).toBe('<p>1 &lt; 2</p>');
  });

  it('passes editor HTML and cleared content to the post form', () => {
    const { component, editor } = setup();
    const changes: string[] = [];
    component.valueChange.subscribe(value => changes.push(value));
    editor().ngModelChange.emit('<p><strong>Hello world</strong></p>');
    editor().ngModelChange.emit('');
    expect(changes).toEqual(['<p><strong>Hello world</strong></p>', '']);
  });

  it('recreates the editor when switching posts and respects disabled state', () => {
    const { fixture, editor } = setup('First');
    fixture.componentRef.setInput('documentKey', 'first');
    fixture.detectChanges();
    const first = editor();
    fixture.componentRef.setInput('value', '<p>Second</p>');
    fixture.componentRef.setInput('documentKey', 'second');
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(editor()).not.toBe(first);
    expect(editor().ngModel).toBe('<p>Second</p>');
    expect(editor().disabled).toBe(true);
  });
});
