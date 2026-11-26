import { useCallback, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  catalogOptions,
  deleteCatalog,
  listCatalog,
  saveCareerSkills,
  saveCatalog,
} from '../../api/admin.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useRemoteData } from '../../hooks/useRemoteData.js';
import RemoteStatus from '../../components/RemoteStatus.jsx';
import CatalogEditor from './CatalogEditor.jsx';
import FormField from '../../components/FormField.jsx';
import CatalogTable from './CatalogTable.jsx';
import { catalogSections } from './catalogConfig.js';

export default function CatalogPage() {
  const { section } = useParams();
  if (!Object.hasOwn(catalogSections, section))
    return <Navigate to="/admin" replace />;
  return (
    <CatalogWorkspace
      key={section}
      section={section}
      config={catalogSections[section]}
    />
  );
}

function CatalogWorkspace({ section, config }) {
  const { token } = useAuth();
  const [page, setPage] = useState(1);
  const [skillId, setSkillId] = useState('');
  const [editor, setEditor] = useState(null);
  const [deletion, setDeletion] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [notice, setNotice] = useState('');

  const loadList = useCallback(
    (signal) => listCatalog(section, token, signal, { page, skillId }),
    [section, token, page, skillId],
  );
  const list = useRemoteData(loadList);
  const loadChoices = useCallback(
    async (signal) => {
      const sources = [];
      if (['careers', 'resources'].includes(section)) sources.push('skills');
      if (['careers', 'interest-questions'].includes(section))
        sources.push('interest-areas');
      const entries = await Promise.all(
        sources.map(async (source) => [
          source,
          await catalogOptions(source, token, signal),
        ]),
      );
      return Object.fromEntries(entries);
    },
    [section, token],
  );
  const choices = useRemoteData(loadChoices);

  function openEditor(mode, item = null) {
    setDeletion(null);
    setNotice('');
    setEditor({ mode, item });
  }

  async function save(body) {
    if (editor.mode === 'requirements')
      await saveCareerSkills(token, editor.item.id, body);
    else await saveCatalog(section, token, body, editor.item?.id);
    setEditor(null);
    setNotice('Changes saved.');
    list.reload();
  }

  async function remove() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteCatalog(section, token, deletion.id);
      setDeletion(null);
      setNotice('Catalog entry deleted.');
      if (list.data?.items.length === 1 && page > 1) setPage(page - 1);
      list.reload();
    } catch (error) {
      setDeleteError(error);
    } finally {
      setDeleting(false);
    }
  }

  const deletionName = deletion ? config.describe(deletion)[0] : '';
  const catalogData = list.data;
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          {config.title}
        </h1>
        {!editor && (
          <button
            type="button"
            className="auth-button"
            onClick={() => openEditor('details')}
            disabled={deleting}
          >
            Add {config.singular}
          </button>
        )}
      </div>
      <div className="mt-7">
        {editor ? (
          <RemoteStatus {...choices}>
            <CatalogEditor
              config={config}
              editor={editor}
              choices={choices.data}
              onCancel={() => setEditor(null)}
              onSave={save}
            />
          </RemoteStatus>
        ) : (
          <>
            {notice && (
              <p
                role="status"
                className="mb-4 border-l-2 border-accent bg-accent/5 p-3 text-sm text-accent"
              >
                {notice}
              </p>
            )}
            {deletion && (
              <section
                aria-label="Confirm deletion"
                className="mb-5 space-y-3 border border-line p-4"
              >
                <h2 className="wrap-anywhere font-semibold">
                  Delete {deletionName}?
                </h2>
                {deleteError && (
                  <p role="alert" className="text-sm text-error">
                    {deleteError.status
                      ? deleteError.message
                      : 'The service could not be reached. Try again.'}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="catalog-button border-error text-error"
                    onClick={remove}
                    disabled={deleting}
                  >
                    {deleting ? 'Deleting…' : 'Confirm delete'}
                  </button>
                  <button
                    type="button"
                    className="catalog-button"
                    onClick={() => setDeletion(null)}
                    disabled={deleting}
                  >
                    Cancel
                  </button>
                </div>
              </section>
            )}
            {section === 'resources' && (
              <div className="mb-5 max-w-sm">
                <RemoteStatus {...choices}>
                  <FormField
                    label="Filter by skill"
                    options={choices.data?.skills}
                    value={skillId}
                    placeholder="All skills"
                    optional
                    onChange={(value) => {
                      setSkillId(value);
                      setPage(1);
                    }}
                  />
                </RemoteStatus>
              </div>
            )}
            <RemoteStatus {...list}>
              <CatalogTable
                config={config}
                items={catalogData?.items}
                onEdit={(item) => openEditor('details', item)}
                onRemove={(item) => {
                  if (!deleting) {
                    setDeletion(item);
                    setDeleteError(null);
                    setNotice('');
                  }
                }}
                onRequirements={
                  section === 'careers'
                    ? (item) => openEditor('requirements', item)
                    : undefined
                }
              />
              {catalogData?.total > 0 && (
                <nav
                  aria-label="Catalog pagination"
                  className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm"
                >
                  <p className="text-muted">
                    Page {page} of{' '}
                    {Math.ceil(catalogData.total / catalogData.limit)} ·{' '}
                    {catalogData.total}{' '}
                    {catalogData.total === 1 ? 'entry' : 'entries'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="catalog-button"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      className="catalog-button"
                      disabled={page * catalogData.limit >= catalogData.total}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              )}
            </RemoteStatus>
          </>
        )}
      </div>
    </>
  );
}
