import { useState } from 'react';
import FormField from '../../components/FormField.jsx';
import QuestionOptions, { questionOptions } from './QuestionOptions.jsx';

export default function CatalogEditor({
  config,
  editor,
  choices,
  onCancel,
  onSave,
}) {
  const { item, mode } = editor;
  const isRequirements = mode === 'requirements';
  const isQuestion = config.singular === 'question';
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      config.fields.map(({ name, initial }) => [name, item?.[name] ?? initial]),
    ),
  );
  const [options, setOptions] = useState(() =>
    isQuestion ? questionOptions(item) : [],
  );
  const [requirements, setRequirements] = useState(() =>
    (item?.requiredSkills ?? []).map(
      ({ id: key, skillId, requiredLevel, weight }) => ({
        key,
        skillId,
        requiredLevel,
        weight,
      }),
    ),
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const errors = error?.fields;

  function changeRequirement(index, fields) {
    setRequirements((rows) =>
      rows.map((row, current) =>
        current === index ? { ...row, ...fields } : row,
      ),
    );
  }

  async function submit(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const body = { ...values };
      for (const { name, optional } of config.fields) {
        if (optional && body[name] === '') body[name] = null;
      }
      if (isQuestion) {
        body.options = options.map(({ id, text, weights }) => ({
          id,
          text,
          weights: weights.map(({ interestAreaId, points }) => ({
            interestAreaId,
            points,
          })),
        }));
      }
      const entries = requirements.map(
        ({ skillId, requiredLevel, weight }) => ({
          skillId,
          requiredLevel,
          weight,
        }),
      );
      await onSave(isRequirements ? entries : body);
    } catch (failure) {
      setError(failure);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="max-w-3xl space-y-6">
      <h2 className="font-display text-3xl">
        {isRequirements
          ? `Required skills for ${item.title}`
          : `${item ? 'Edit' : 'Add'} ${config.singular}`}
      </h2>
      {error && (
        <p
          role="alert"
          className="border-l-2 border-error bg-error/5 p-3 text-sm text-error"
        >
          {error.status
            ? error.message
            : 'The service could not be reached. Try saving again.'}
        </p>
      )}
      {isRequirements ? (
        <fieldset className="min-w-0 space-y-4">
          <legend className="sr-only">Required skills</legend>
          {!requirements.length && (
            <p className="text-sm text-muted">
              This career has no required skills.
            </p>
          )}
          {errors?.body && <p className="text-sm text-error">{errors.body}</p>}
          {requirements.map((row, index) => (
            <div
              key={row.key}
              className="grid min-w-0 items-end gap-3 border-b border-line pb-4 sm:grid-cols-[minmax(0,1fr)_7rem_7rem_auto]"
            >
              <FormField
                label={`Skill ${index + 1}`}
                value={row.skillId}
                options={choices.skills}
                onChange={(skillId) => changeRequirement(index, { skillId })}
                error={errors?.[`${index}.skillId`]}
              />
              <FormField
                label="Required level"
                type="number"
                min={1}
                max={5}
                value={row.requiredLevel}
                onChange={(requiredLevel) =>
                  changeRequirement(index, { requiredLevel })
                }
                error={errors?.[`${index}.requiredLevel`]}
              />
              <FormField
                label="Importance"
                type="number"
                min={1}
                max={5}
                value={row.weight}
                onChange={(weight) => changeRequirement(index, { weight })}
                error={errors?.[`${index}.weight`]}
              />
              <button
                type="button"
                className="catalog-button justify-self-start"
                onClick={() =>
                  setRequirements((rows) =>
                    rows.filter(({ key }) => key !== row.key),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="catalog-button"
            disabled={requirements.length >= 100}
            onClick={() =>
              setRequirements((rows) => [
                ...rows,
                {
                  key: crypto.randomUUID(),
                  skillId: '',
                  requiredLevel: 1,
                  weight: 1,
                },
              ])
            }
          >
            Add skill requirement
          </button>
        </fieldset>
      ) : (
        <>
          {config.fields.map(
            ({ name, source, options: fixedOptions, ...field }) => (
              <FormField
                key={name}
                {...field}
                value={values[name]}
                options={source ? choices[source] : fixedOptions}
                error={errors?.[name]}
                onChange={(value) =>
                  setValues((previous) => ({ ...previous, [name]: value }))
                }
              />
            ),
          )}
          {isQuestion && (
            <QuestionOptions
              options={options}
              areas={choices['interest-areas']}
              onChange={setOptions}
              errors={errors}
            />
          )}
        </>
      )}
      <div className="flex flex-wrap gap-3 border-t border-line pt-5">
        <button type="submit" className="auth-button" disabled={pending}>
          {pending ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          className="catalog-button"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
