import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownEditor.css';

const MarkdownEditor = ({ value, onChange, placeholder, className = '' }) => {
  const { t } = useTranslation();
  const [isPreview, setIsPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef(null);

  const insertText = (before, after = '', placeholder = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;

    const newText = value.substring(0, start) + before + textToInsert + after + value.substring(end);
    onChange(newText);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length + (selectedText ? 0 : after.length);
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarActions = {
    bold: () => insertText('**', '**', t('forum.markdown.editor.placeholders.linkText')),
    italic: () => insertText('*', '*', t('forum.markdown.editor.placeholders.linkText')),
    strikethrough: () => insertText('~~', '~~', t('forum.markdown.editor.placeholders.linkText')),
    code: () => insertText('`', '`', 'code'),
    codeBlock: () => insertText('```\n', '\n```', t('forum.markdown.editor.placeholders.codeLanguage')),
    blockquote: () => insertText('> ', '', t('forum.markdown.editor.placeholders.linkText')),
    link: () => insertText('[', `](${t('forum.markdown.editor.placeholders.linkUrl')})`, t('forum.markdown.editor.placeholders.linkText')),
    image: () => insertText('![', `](${t('forum.markdown.editor.placeholders.imageUrl')})`, t('forum.markdown.editor.placeholders.imageAlt')),
    unorderedList: () => insertText('- ', '', t('forum.markdown.editor.placeholders.linkText')),
    orderedList: () => insertText('1. ', '', t('forum.markdown.editor.placeholders.linkText')),
    header: () => insertText('## ', '', t('forum.markdown.editor.placeholders.linkText')),
    line: () => insertText('\n---\n', '', ''),
  };

  const toolbarButtons = [
    { key: 'bold', icon: 'B', title: t('forum.markdown.editor.toolbar.bold') },
    { key: 'italic', icon: 'I', title: t('forum.markdown.editor.toolbar.italic') },
    { key: 'strikethrough', icon: 'S', title: t('forum.markdown.editor.toolbar.strikethrough') },
    { key: 'code', icon: '</>', title: t('forum.markdown.editor.toolbar.code') },
    { key: 'codeBlock', icon: '{ }', title: t('forum.markdown.editor.toolbar.codeBlock') },
    { key: 'blockquote', icon: '"', title: t('forum.markdown.editor.toolbar.blockquote') },
    { key: 'link', icon: '🔗', title: t('forum.markdown.editor.toolbar.link') },
    { key: 'image', icon: '🖼️', title: t('forum.markdown.editor.toolbar.image') },
    { key: 'unorderedList', icon: '•', title: t('forum.markdown.editor.toolbar.unorderedList') },
    { key: 'orderedList', icon: '1.', title: t('forum.markdown.editor.toolbar.orderedList') },
    { key: 'header', icon: 'H', title: t('forum.markdown.editor.toolbar.header') },
    { key: 'line', icon: '━', title: t('forum.markdown.editor.toolbar.line') },
  ];

  return (
    <div className={`markdown-editor ${className}`}>
      <div className="markdown-editor-header">
        <div className="markdown-editor-tabs">
          <button
            type="button"
            className={`markdown-tab ${!isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(false)}
          >
            {t('forum.markdown.editor.write')}
          </button>
          <button
            type="button"
            className={`markdown-tab ${isPreview ? 'active' : ''}`}
            onClick={() => setIsPreview(true)}
          >
            {t('forum.markdown.editor.preview')}
          </button>
        </div>
        <button
          type="button"
          className="markdown-help-btn"
          onClick={() => setShowHelp(!showHelp)}
          title={t('forum.markdown.editor.help')}
        >
          ?
        </button>
      </div>

      {showHelp && (
        <div className="markdown-help">
          <h4>{t('forum.markdown.editor.helpText.title')}</h4>
          <div className="markdown-help-content">
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.bold')}:</strong> {t('forum.markdown.editor.helpText.bold')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.italic')}:</strong> {t('forum.markdown.editor.helpText.italic')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.strikethrough')}:</strong> {t('forum.markdown.editor.helpText.strikethrough')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.code')}:</strong> {t('forum.markdown.editor.helpText.code')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.codeBlock')}:</strong> {t('forum.markdown.editor.helpText.codeBlock')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.blockquote')}:</strong> {t('forum.markdown.editor.helpText.blockquote')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.link')}:</strong> {t('forum.markdown.editor.helpText.link')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.image')}:</strong> {t('forum.markdown.editor.helpText.image')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.unorderedList')} / {t('forum.markdown.editor.toolbar.orderedList')}:</strong> {t('forum.markdown.editor.helpText.list')}
            </div>
            <div className="help-item">
              <strong>{t('forum.markdown.editor.toolbar.header')}:</strong> {t('forum.markdown.editor.helpText.header')}
            </div>
          </div>
        </div>
      )}

      {!isPreview ? (
        <>
          <div className="markdown-toolbar">
            {toolbarButtons.map(button => (
              <button
                key={button.key}
                type="button"
                className="markdown-toolbar-btn"
                onClick={toolbarActions[button.key]}
                title={button.title}
              >
                {button.icon}
              </button>
            ))}
          </div>
          <textarea
            ref={textareaRef}
            className="markdown-textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={8}
          />
        </>
      ) : (
        <div className="markdown-preview">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom components for better styling
              h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
              h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
              h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
              p: ({ children }) => <p className="markdown-p">{children}</p>,
              blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
              code: ({ inline, children }) => inline ?
                <code className="markdown-inline-code">{children}</code> :
                <code className="markdown-code-block">{children}</code>,
              pre: ({ children }) => <pre className="markdown-pre">{children}</pre>,
              ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
              ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
              li: ({ children }) => <li className="markdown-li">{children}</li>,
              a: ({ href, children }) => <a href={href} className="markdown-link" target="_blank" rel="noopener noreferrer">{children}</a>,
              img: ({ src, alt }) => <img src={src} alt={alt} className="markdown-img" />,
              strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
              em: ({ children }) => <em className="markdown-em">{children}</em>,
              del: ({ children }) => <del className="markdown-del">{children}</del>,
            }}
          >
            {value || '*No content to preview*'}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export default MarkdownEditor;