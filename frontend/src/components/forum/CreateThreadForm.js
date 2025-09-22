import React, { memo, useState } from 'react';
import { useForm } from 'react-hook-form';

const CreateThreadForm = memo(({ categories, onSubmit, onCancel, currentUser, t }) => {
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      category: 'general'
    }
  });

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const onFormSubmit = async (data) => {
    const threadData = {
      ...data,
      tags: tags.join(',')
    };

    const result = await onSubmit(threadData);
    if (result?.success) {
      reset();
      setTags([]);
      setTagInput('');
    }
  };

  return (
    <div className="create-thread-form">
      <div className="form-header">
        <h2>{t('forum.createThread')}</h2>
        <button onClick={onCancel} className="close-btn">×</button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)} className="thread-form">
        <div className="form-group">
          <label htmlFor="title">{t('forum.threadTitle')}</label>
          <input
            type="text"
            id="title"
            {...register('title', {
              required: t('forum.threadTitle') + ' is required',
              minLength: {
                value: 5,
                message: 'Title must be at least 5 characters'
              },
              maxLength: {
                value: 200,
                message: 'Title cannot exceed 200 characters'
              }
            })}
            placeholder={t('forum.threadTitle')}
            className={errors.title ? 'error' : ''}
          />
          {errors.title && (
            <span className="error-message">{errors.title.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="category">{t('forum.selectCategory')}</label>
          <select
            id="category"
            {...register('category', {
              required: t('forum.selectCategory')
            })}
            className={errors.category ? 'error' : ''}
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="error-message">{errors.category.message}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="content">{t('forum.threadContent')}</label>
          <textarea
            id="content"
            {...register('content', {
              required: t('forum.threadContent') + ' is required',
              minLength: {
                value: 10,
                message: 'Content must be at least 10 characters'
              },
              maxLength: {
                value: 10000,
                message: 'Content cannot exceed 10000 characters'
              }
            })}
            placeholder={t('forum.threadContent')}
            rows={8}
            className={errors.content ? 'error' : ''}
          />
          {errors.content && (
            <span className="error-message">{errors.content.message}</span>
          )}
        </div>

        <div className="form-group">
          <label>{t('forum.tags')}</label>
          <div className="tags-input-group">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder={t('forum.addTags')}
            />
            <button type="button" onClick={handleAddTag} className="add-tag-btn">
              +
            </button>
          </div>
          <div className="tags-list">
            {tags.map(tag => (
              <span key={tag} className="tag">
                #{tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
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
            {isSubmitting ? t('forum.loading') : t('forum.postThread')}
          </button>
        </div>
      </form>
    </div>
  );
});

CreateThreadForm.displayName = 'CreateThreadForm';

export default CreateThreadForm;