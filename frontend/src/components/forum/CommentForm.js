import React, { memo, useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { ForumUtils } from '../../utils/forumUtils';
import forumAPI from '../../api/forum';

const CommentForm = memo(({
  initialContent = '',
  onSubmit,
  onCancel,
  placeholder,
  submitText,
  t
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      content: initialContent
    }
  });

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [currentWord, setCurrentWord] = useState(null);
  const textareaRef = useRef(null);
  const content = watch('content');

  const onFormSubmit = async (data) => {
    const result = await onSubmit(data);
    if (result?.success) {
      reset();
    }
  };

  const handleCancel = () => {
    reset();
    setSuggestions([]);
    setShowSuggestions(false);
    onCancel();
  };

  // Manejar cambios en el textarea
  const handleTextareaChange = async (e) => {
    const value = e.target.value;
    setValue('content', value);

    const wordInfo = ForumUtils.getCurrentWord(e.target);
    setCurrentWord(wordInfo);

    if (wordInfo.isMention || wordInfo.isTag) {
      const query = wordInfo.beforeCursor.substring(1); // Remover @ o #

      if (query.length >= 2) {
        try {
          let suggestionsData;
          if (wordInfo.isMention) {
            const response = await forumAPI.getMentionSuggestions(query);
            suggestionsData = response.data.suggestions;
          } else {
            const response = await forumAPI.getTagSuggestions(query);
            suggestionsData = response.data.suggestions;
          }

          setSuggestions(suggestionsData);
          setShowSuggestions(true);
          setSelectedSuggestionIndex(-1);
        } catch (error) {
          console.error('Error fetching suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Manejar selección de sugerencia
  const selectSuggestion = (suggestion) => {
    if (!textareaRef.current || !currentWord) return;

    const prefix = currentWord.isMention ? '@' : '#';
    const replacement = prefix + (currentWord.isMention ? suggestion.username : suggestion.tag);

    const before = content.substring(0, currentWord.start);
    const after = content.substring(currentWord.end);
    const newContent = before + replacement + ' ' + after;

    setValue('content', newContent);
    setSuggestions([]);
    setShowSuggestions(false);

    // Posicionar cursor después de la sugerencia
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = currentWord.start + replacement.length + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Manejar navegación por teclado
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      selectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Cerrar sugerencias al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="comment-form">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="form-group">
          <div className="textarea-container">
            <textarea
              {...register('content', {
                required: t('forum.commentContent') + ' is required',
                minLength: {
                  value: 1,
                  message: 'Comment must be at least 1 character'
                },
                maxLength: {
                  value: 2000,
                  message: 'Comment cannot exceed 2000 characters'
                }
              })}
              ref={textareaRef}
              placeholder={placeholder}
              rows={4}
              className={errors.content ? 'error' : ''}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              value={content}
            />

            {/* Dropdown de sugerencias */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={currentWord?.isMention ? suggestion.username : suggestion.tag}
                    className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    {currentWord?.isMention ? (
                      <>
                        <span className="suggestion-icon">@</span>
                        <span className="suggestion-text">{suggestion.username}</span>
                      </>
                    ) : (
                      <>
                        <span className="suggestion-icon">#</span>
                        <span className="suggestion-text">{suggestion.tag}</span>
                        {suggestion.count && (
                          <span className="suggestion-count">({suggestion.count})</span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {errors.content && (
            <span className="error-message">{errors.content.message}</span>
          )}

          {/* Ayuda para menciones y tags */}
          <div className="form-help">
            <small>
              Usa <code>@username</code> para mencionar usuarios y <code>#tag</code> para etiquetas.
              Las notificaciones se enviarán automáticamente.
            </small>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            {t('forum.cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? t('forum.loading') : submitText}
          </button>
        </div>
      </form>
    </div>
  );
});

CommentForm.displayName = 'CommentForm';

export default CommentForm;