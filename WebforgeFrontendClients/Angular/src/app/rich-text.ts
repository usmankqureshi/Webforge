import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Editor, ChainedCommands } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

import { bodyHtml } from './body-html';
export { bodyHtml } from './body-html';

@Component({
  selector: 'app-rich-text',
  imports: [FormsModule],
  template: `
    <div class="rich-text mb-4" [class.editor-disabled]="disabled">
      <div class="editor-toolbar" role="group" aria-label="Body formatting">
        @for (tool of tools; track tool.label) {
          <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled"
            [attr.aria-label]="tool.label" [attr.title]="tool.label"
            [attr.aria-pressed]="tool.active ? active(tool.active, tool.attrs) : null"
            [class.active]="tool.active && active(tool.active, tool.attrs)"
            (mousedown)="$event.preventDefault()" (click)="run(tool.command)">{{ tool.label }}</button>
        }
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled" (click)="openLink()">Link</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled || !active('link')" (click)="unlink()">Unlink</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled || !canUndo()" (click)="undo()">Undo</button>
        <button type="button" class="btn btn-sm btn-outline-secondary" [disabled]="disabled || !canRedo()" (click)="redo()">Redo</button>
      </div>
      @if (showLink) {
        <div class="p-2 border-bottom">
          <label for="body-link" class="form-label small">Link URL (https://, http://, or mailto:)</label>
          <input id="body-link" type="url" class="form-control form-control-sm" [(ngModel)]="linkUrl" [ngModelOptions]="{standalone: true}" [disabled]="disabled" (keydown.enter)="$event.preventDefault(); applyLink()">
          @if (linkError) { <p class="text-danger small" role="alert">{{ linkError }}</p> }
          <button type="button" class="btn btn-sm btn-success mt-2" [disabled]="disabled" (click)="applyLink()">Apply link</button>
          <button type="button" class="btn btn-sm mt-2" (click)="showLink = false">Cancel</button>
        </div>
      }
      <div #surface></div>
      <div class="editor-footer text-secondary small">{{ words() }} words · {{ characters() }} characters</div>
    </div>
  `,
})
export class RichText implements AfterViewInit, OnChanges, OnDestroy {
  @Input() value = '';
  @Input() disabled = false;
  @Input() documentKey: string | null = null;
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('surface', { static: true }) surface!: ElementRef<HTMLElement>;
  editor?: Editor;
  readonly words = signal(0);
  readonly characters = signal(0);
  readonly revision = signal(0);
  showLink = false;
  linkUrl = '';
  linkError = '';
  readonly tools: { label: string; active?: string; attrs?: Record<string, unknown>; command: (chain: ChainedCommands) => ChainedCommands }[] = [
    { label: 'Paragraph', active: 'paragraph', command: c => c.setParagraph() },
    { label: 'H2', active: 'heading', attrs: { level: 2 }, command: c => c.toggleHeading({ level: 2 }) },
    { label: 'H3', active: 'heading', attrs: { level: 3 }, command: c => c.toggleHeading({ level: 3 }) },
    { label: 'Bold', active: 'bold', command: c => c.toggleBold() },
    { label: 'Italic', active: 'italic', command: c => c.toggleItalic() },
    { label: 'Underline', active: 'underline', command: c => c.toggleUnderline() },
    { label: 'Strike', active: 'strike', command: c => c.toggleStrike() },
    { label: 'Bullets', active: 'bulletList', command: c => c.toggleBulletList() },
    { label: 'Numbered list', active: 'orderedList', command: c => c.toggleOrderedList() },
    { label: 'Quote', active: 'blockquote', command: c => c.toggleBlockquote() },
    { label: 'Code', active: 'code', command: c => c.toggleCode() },
    { label: 'Code block', active: 'codeBlock', command: c => c.toggleCodeBlock() },
    { label: 'Divider', command: c => c.setHorizontalRule() },
    { label: 'Clear formatting', command: c => c.unsetAllMarks().clearNodes() },
  ];

  ngAfterViewInit(): void { this.createEditor(); }
  ngOnChanges(): void {
    if (!this.editor) return;
    // Recreate on external changes so undo cannot restore a different post.
    if (this.value !== (this.editor.isEmpty ? '' : this.editor.getHTML()) || this.loadedKey !== this.documentKey) {
      this.editor.destroy();
      this.createEditor();
    } else {
      this.editor.setEditable(!this.disabled);
    }
  }
  private loadedKey: string | null = null;
  private createEditor(): void {
    this.loadedKey = this.documentKey;
    this.showLink = false;
    this.editor = new Editor({
      element: this.surface.nativeElement,
      extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, protocols: ['http', 'https', 'mailto'] } })],
      content: bodyHtml(this.value),
      editable: !this.disabled,
      editorProps: { attributes: { id: 'body', role: 'textbox', 'aria-label': 'Body', 'aria-multiline': 'true', class: 'body-editor' } },
      onUpdate: ({ editor }) => this.valueChange.emit(editor.isEmpty ? '' : editor.getHTML()),
      onTransaction: () => this.refresh(),
    });
    this.refresh();
  }
  private refresh(): void {
    const text = this.editor?.getText() ?? '';
    this.characters.set(text.length);
    this.words.set(text.trim() ? text.trim().split(/\s+/).length : 0);
    this.revision.update(n => n + 1);
  }
  active(name: string, attrs?: Record<string, unknown>): boolean { this.revision(); return this.editor?.isActive(name, attrs) ?? false; }
  run(command: (chain: ChainedCommands) => ChainedCommands): void { if (!this.disabled && this.editor) command(this.editor.chain().focus()).run(); }
  canUndo(): boolean { this.revision(); return this.editor?.can().undo() ?? false; }
  canRedo(): boolean { this.revision(); return this.editor?.can().redo() ?? false; }
  undo(): void { this.run(c => c.undo()); }
  redo(): void { this.run(c => c.redo()); }
  unlink(): void { this.run(c => c.extendMarkRange('link').unsetLink()); }
  openLink(): void {
    this.linkUrl = this.editor?.getAttributes('link')['href'] ?? '';
    this.linkError = '';
    this.showLink = true;
  }
  applyLink(): void {
    const url = this.linkUrl.trim();
    if (!/^(https?:\/\/[^\s]+|mailto:[^\s@]+@[^\s@]+)$/i.test(url)) {
      this.linkError = 'Enter a valid web or email URL.';
      return;
    }
    this.run(c => c.extendMarkRange('link').setLink({ href: url }));
    this.showLink = false;
  }
  ngOnDestroy(): void { this.editor?.destroy(); }
}
