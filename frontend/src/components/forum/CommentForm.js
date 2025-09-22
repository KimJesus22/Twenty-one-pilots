import React, { memo } from 'react';
import { useForm } from 'react-hook-form';

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
    reset
  } = useForm({
    defaultValues: {
      content: initialContent
    }
  });

  const onFormSubmit = async (data) => {
    const result = await onSubmit(data);
    if (result?.success) {
      reset();
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <div className="comment-form">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="form-group">
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
            placeholder={placeholder}
            rows={4}
            className={errors.content ? 'error' : ''}
          />
          {errors.content && (
            <span className="error-message">{errors.content.message}</span>
          )}
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