import FormField from '../../components/FormField.jsx';

function rowKey() {
  return crypto.randomUUID();
}

function newWeight() {
  return { key: rowKey(), interestAreaId: '', points: 1 };
}

function newOption() {
  return { key: rowKey(), text: '', weights: [newWeight()] };
}

export function questionOptions(item) {
  if (!item) return [newOption(), newOption()];
  return item.options.map(({ id, text, weights }) => ({
    key: id,
    id,
    text,
    weights: weights.map(({ id: key, interestAreaId, points }) => ({
      key,
      interestAreaId,
      points,
    })),
  }));
}

export default function QuestionOptions({
  options,
  areas,
  onChange,
  errors = {},
}) {
  function updateOption(index, fields) {
    onChange(
      options.map((option, current) =>
        current === index ? { ...option, ...fields } : option,
      ),
    );
  }

  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="mb-3 text-lg font-semibold">Answer options</legend>
      {errors.options && <p className="text-sm text-error">{errors.options}</p>}
      {options.map((option, index) => (
        <section key={option.key} className="space-y-4 border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Option {index + 1}</h3>
            <button
              type="button"
              className="catalog-button"
              disabled={options.length <= 2}
              onClick={() =>
                onChange(options.filter((_, current) => current !== index))
              }
            >
              Remove option
            </button>
          </div>
          <FormField
            label={`Option ${index + 1} text`}
            value={option.text}
            onChange={(text) => updateOption(index, { text })}
            error={errors[`options.${index}.text`]}
          />
          {errors[`options.${index}.id`] && (
            <p className="text-sm text-error">
              {errors[`options.${index}.id`]}
            </p>
          )}
          {errors[`options.${index}.weights`] && (
            <p className="text-sm text-error">
              {errors[`options.${index}.weights`]}
            </p>
          )}
          {option.weights.map((weight, weightIndex) => {
            const prefix = `options.${index}.weights.${weightIndex}`;
            function updateWeight(fields) {
              updateOption(index, {
                weights: option.weights.map((entry, current) =>
                  current === weightIndex ? { ...entry, ...fields } : entry,
                ),
              });
            }
            return (
              <div
                key={weight.key}
                className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_5rem_auto]"
              >
                <FormField
                  label="Interest area"
                  options={areas}
                  value={weight.interestAreaId}
                  onChange={(interestAreaId) =>
                    updateWeight({ interestAreaId })
                  }
                  error={errors[`${prefix}.interestAreaId`]}
                />
                <FormField
                  label="Points"
                  type="number"
                  min={1}
                  max={5}
                  value={weight.points}
                  onChange={(points) => updateWeight({ points })}
                  error={errors[`${prefix}.points`]}
                />
                <button
                  type="button"
                  className="catalog-button justify-self-start"
                  disabled={option.weights.length <= 1}
                  onClick={() =>
                    updateOption(index, {
                      weights: option.weights.filter(
                        (_, current) => current !== weightIndex,
                      ),
                    })
                  }
                >
                  Remove weight
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="catalog-button"
            disabled={option.weights.length >= 20}
            onClick={() =>
              updateOption(index, { weights: [...option.weights, newWeight()] })
            }
          >
            Add weight
          </button>
        </section>
      ))}
      <button
        type="button"
        className="catalog-button"
        disabled={options.length >= 12}
        onClick={() => onChange([...options, newOption()])}
      >
        Add option
      </button>
    </fieldset>
  );
}
