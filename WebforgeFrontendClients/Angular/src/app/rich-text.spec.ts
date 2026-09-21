import { TestBed } from '@angular/core/testing';
import { RichText, bodyHtml } from './rich-text';

describe('Rich text body editor', () => {
  function setup(value = '') {
    const fixture = TestBed.createComponent(RichText);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('preserves literal plain text and newlines', () => {
    const { component } = setup('First <idea> & thought\nSecond line');
    expect(component.editor!.getHTML()).toBe('<p>First &lt;idea&gt; &amp; thought</p><p>Second line</p>');
    expect(bodyHtml('1 < 2')).toBe('<p>1 &lt; 2</p>');
  });

  it('emits formatted HTML and updates counts', () => {
    const { component } = setup();
    const changes: string[] = [];
    component.valueChange.subscribe(value => changes.push(value));
    component.editor!.chain().toggleBold().insertContent('Hello world').run();
    expect(changes.at(-1)).toBe('<p><strong>Hello world</strong></p>');
    expect(component.words()).toBe(2);
    expect(component.characters()).toBe(11);
  });

  it('clears history when switching posts and respects disabled state', () => {
    const { fixture, component } = setup('First');
    component.editor!.commands.insertContent('Changed');
    expect(component.canUndo()).toBe(true);
    fixture.componentRef.setInput('value', '<p>Second</p>');
    fixture.componentRef.setInput('documentKey', 'second');
    fixture.detectChanges();
    expect(component.editor!.getText()).toBe('Second');
    expect(component.canUndo()).toBe(false);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(component.editor!.isEditable).toBe(false);
  });

  it('rejects unsafe link URLs', () => {
    const { component } = setup('Link text');
    component.linkUrl = 'javascript:alert(1)';
    component.applyLink();
    expect(component.linkError).toContain('valid');
    expect(component.editor!.getHTML()).not.toContain('href');
  });
});
