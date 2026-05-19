'use client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import {
  LuBold,
  LuItalic,
  LuStrikethrough,
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuList,
  LuListOrdered,
  LuCode,
  LuTextQuote,
  LuSeparatorHorizontal,
  LuUndo2,
  LuRedo2,
} from 'react-icons/lu';

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

  const btn = (title: string, active: boolean, onClick: () => void, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`toolbar-btn ${active ? 'active' : ''}`}
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className="richtext-editor-wrapper">
      <div className="richtext-toolbar">
        {btn('Bold', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <LuBold size={16} />)}
        {btn('Italic', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <LuItalic size={16} />)}
        {btn('Strikethrough', editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), <LuStrikethrough size={16} />)}
        <div className="toolbar-divider" />
        {btn('Heading 1', editor.isActive('heading', { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), <LuHeading1 size={16} />)}
        {btn('Heading 2', editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <LuHeading2 size={16} />)}
        {btn('Heading 3', editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <LuHeading3 size={16} />)}
        <div className="toolbar-divider" />
        {btn('Bullet List', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <LuList size={16} />)}
        {btn('Ordered List', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <LuListOrdered size={16} />)}
        {btn('Code Block', editor.isActive('codeBlock'), () => editor.chain().focus().toggleCodeBlock().run(), <LuCode size={16} />)}
        <div className="toolbar-divider" />
        {btn('Blockquote', editor.isActive('blockquote'), () => editor.chain().focus().toggleBlockquote().run(), <LuTextQuote size={16} />)}
        {btn('Horizontal Rule', false, () => editor.chain().focus().setHorizontalRule().run(), <LuSeparatorHorizontal size={16} />)}
        <div className="toolbar-divider" />
        {btn('Undo', false, () => editor.chain().focus().undo().run(), <LuUndo2 size={16} />)}
        {btn('Redo', false, () => editor.chain().focus().redo().run(), <LuRedo2 size={16} />)}
      </div>
      <EditorContent
        editor={editor}
        className={`richtext-content ${disabled ? 'disabled' : ''}`}
      />
    </div>
  );
}
