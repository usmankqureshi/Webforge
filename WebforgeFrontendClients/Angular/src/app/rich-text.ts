import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EditorComponent, TINYMCE_SCRIPT_SRC } from '@tinymce/tinymce-angular';
import { bodyHtml } from './body-html';
export { bodyHtml } from './body-html';

@Component({
  selector: 'app-rich-text',
  imports: [FormsModule, EditorComponent],
  providers: [{ provide: TINYMCE_SCRIPT_SRC, useValue: '/tinymce/tinymce.min.js' }],
  template: `
    <div class="mb-4">
      @for (key of editorKeys; track key) {
        <editor licenseKey="gpl" [init]="init" [disabled]="disabled"
          [ngModel]="html" (ngModelChange)="updateValue($event)"
          [ngModelOptions]="{standalone: true}" />
      }
    </div>
  `,
})
export class RichText implements OnChanges {
  @Input() value = '';
  @Input() disabled = false;
  @Input() documentKey: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  html = '';
  editorKeys = [0];
  readonly init: EditorComponent['init'] = {
    base_url: '/tinymce',
    suffix: '.min',
    height: 440,
    menubar: false,
    plugins: 'lists link table code wordcount',
    toolbar: 'undo redo | blocks | bold italic underline strikethrough | bullist numlist blockquote | link table | removeformat code',
    block_formats: 'Paragraph=p; Heading 2=h2; Heading 3=h3; Preformatted=pre',
    browser_spellcheck: true,
    convert_urls: false,
    iframe_aria_text: 'Post body',
    content_style: 'body { font-family: system-ui, sans-serif; font-size: 16px; color: #182c24; }',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) this.html = bodyHtml(this.value);
    // A new editor instance prevents undo from restoring another post's content.
    if (changes['documentKey'] && !changes['documentKey'].firstChange) {
      this.editorKeys = [this.editorKeys[0] + 1];
    }
  }

  updateValue(html: string): void {
    this.html = html;
    this.valueChange.emit(html);
  }
}
