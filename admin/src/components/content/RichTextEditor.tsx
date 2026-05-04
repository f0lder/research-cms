'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Enter text...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    editable: !disabled,
    immediatelyRender: false,
  });

  if (!editor) return null;

  return (
    <div className="richtext-editor-wrapper">
      <div className="richtext-toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('bold') ? 'active' : ''}`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('italic') ? 'active' : ''}`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('strike') ? 'active' : ''}`}
          title="Strikethrough"
        >
          <s>S</s>
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
          title="Heading 1"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
          title="Heading 2"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
          title="Heading 3"
        >
          H3
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('bulletList') ? 'active' : ''}`}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('orderedList') ? 'active' : ''}`}
          title="Ordered List"
        >
          1. List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('codeBlock') ? 'active' : ''}`}
          title="Code Block"
        >
          &lt;&gt;
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          className={`toolbar-btn ${editor.isActive('blockquote') ? 'active' : ''}`}
          title="Blockquote"
        >
          &quot;
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          className="toolbar-btn"
          title="Horizontal Rule"
        >
          ―
        </button>
        <div className="toolbar-divider" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={disabled}
          className="toolbar-btn"
          title="Undo"
        >
          ↶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={disabled}
          className="toolbar-btn"
          title="Redo"
        >
          ↷
        </button>
      </div>
      <EditorContent
        editor={editor}
        className={`richtext-content ${disabled ? 'disabled' : ''}`}
      />
    </div>
  );
}
