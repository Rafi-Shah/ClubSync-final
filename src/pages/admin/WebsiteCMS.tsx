import { useEffect, useState } from 'react';
import {
  PageTitle,
  Input,
  TextArea,
  Badge,
  Table,
  TableRow,
  TableCell,
  formatDate,
  formatDateTime,
  usePagination,
  Pagination,
} from '../../components/admin/AdminUI';
import { LoadingState, ErrorState, EmptyState } from '../../components/States';
import FileUpload from '../../components/FileUpload';
import {
  getSiteSettings,
  updateSiteSettings,
  getAboutBlocks,
  updateAboutBlock,
  getContactMessages,
  markContactMessageRead,
  getDevelopers,
  createDeveloper,
  updateDeveloper,
  deleteDeveloper,
} from '../../lib/adminApi';

interface SiteSettings {
  id: string;
  club_name: string | null;
  tagline: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  social_links: any;
}

interface AboutBlock {
  id: string;
  title: string | null;
  body: string | null;
  image_url: string | null;
  sort_order: number | null;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

type Tab = 'settings' | 'about' | 'messages' | 'developers';

export default function WebsiteCMS() {
  const [tab, setTab] = useState<Tab>('settings');

  // ---- Developers ----
  const [developers, setDevelopers] = useState<any[]>([]);
  const [developersLoading, setDevelopersLoading] = useState(true);
  const [developersError, setDevelopersError] = useState<string | null>(null);
  const [developerForm, setDeveloperForm] = useState<any | null>(null);
  const [savingDeveloper, setSavingDeveloper] = useState(false);

  // ---- Site Settings ----
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [settingsForm, setSettingsForm] = useState<SiteSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // ---- About Blocks ----
  const [aboutBlocks, setAboutBlocks] = useState<AboutBlock[]>([]);
  const [aboutLoading, setAboutLoading] = useState(true);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [editingAbout, setEditingAbout] = useState<Record<string, AboutBlock>>({});
  const [savingAboutId, setSavingAboutId] = useState<string | null>(null);

  // ---- Contact Messages ----
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  async function refreshSettings() {
    setSettingsLoading(true);
    setSettingsError(null);
    try {
      const data = await getSiteSettings();
      setSettings(data as SiteSettings);
      setSettingsForm(data as SiteSettings);
    } catch (e: any) {
      setSettingsError(e.message ?? 'Failed to load site settings.');
    } finally {
      setSettingsLoading(false);
    }
  }

  async function refreshAbout() {
    setAboutLoading(true);
    setAboutError(null);
    try {
      const data = await getAboutBlocks();
      setAboutBlocks(data as AboutBlock[]);
    } catch (e: any) {
      setAboutError(e.message ?? 'Failed to load about content.');
    } finally {
      setAboutLoading(false);
    }
  }

  async function refreshMessages() {
    setMessagesLoading(true);
    setMessagesError(null);
    try {
      const data = await getContactMessages();
      setMessages(data as ContactMessage[]);
    } catch (e: any) {
      setMessagesError(e.message ?? 'Failed to load messages.');
    } finally {
      setMessagesLoading(false);
    }
  }

  async function refreshDevelopers() {
    setDevelopersLoading(true);
    setDevelopersError(null);
    try {
      const data = await getDevelopers();
      setDevelopers(data);
    } catch (e: any) {
      setDevelopersError(e.message ?? 'Failed to load developers.');
    } finally {
      setDevelopersLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([refreshSettings(), refreshAbout(), refreshMessages(), refreshDevelopers()]);
    })();
  }, []);

  async function handleSaveSettings() {
    if (!settingsForm || !settingsForm.id) return;
    setSavingSettings(true);
    setSettingsSaved(false);
    try {
      await updateSiteSettings(settingsForm.id, {
        club_name: settingsForm.club_name,
        tagline: settingsForm.tagline,
        description: settingsForm.description,
        contact_email: settingsForm.contact_email,
        contact_phone: settingsForm.contact_phone,
        address: settingsForm.address,
        social_links: settingsForm.social_links,
      });
      setSettings(settingsForm);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (e: any) {
      setSettingsError(e.message ?? 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  }

  function startEditAbout(block: AboutBlock) {
    setEditingAbout({ ...editingAbout, [block.id]: { ...block } });
  }

  function updateAboutField(id: string, field: keyof AboutBlock, value: string | number) {
    setEditingAbout({
      ...editingAbout,
      [id]: { ...editingAbout[id], [field]: value },
    });
  }

  async function saveAboutBlock(id: string) {
    const block = editingAbout[id];
    if (!block) return;
    setSavingAboutId(id);
    try {
      await updateAboutBlock(id, {
        title: block.title,
        body: block.body,
        image_url: block.image_url,
        sort_order: block.sort_order,
      });
      setAboutBlocks(aboutBlocks.map((b) => (b.id === id ? block : b)));
      const { [id]: _, ...rest } = editingAbout;
      setEditingAbout(rest);
    } catch (e: any) {
      setAboutError(e.message ?? 'Failed to save about block.');
    } finally {
      setSavingAboutId(null);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markContactMessageRead(id);
      setMessages(messages.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    } catch (e: any) {
      setMessagesError(e.message ?? 'Failed to mark message as read.');
    }
  }

  async function handleSaveDeveloper() {
    setSavingDeveloper(true);
    try {
      if (developerForm.id) {
        await updateDeveloper(developerForm.id, developerForm);
      } else {
        await createDeveloper(developerForm);
      }
      setDeveloperForm(null);
      await refreshDevelopers();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSavingDeveloper(false);
    }
  }

  async function handleDeleteDeveloper(id: string) {
    if (!confirm('Are you sure you want to delete this developer?')) return;
    try {
      await deleteDeveloper(id);
      await refreshDevelopers();
    } catch (e: any) {
      alert(e.message);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'settings', label: 'Site Settings' },
    { key: 'about', label: 'About Content' },
    { key: 'messages', label: 'Messages' },
    { key: 'developers', label: 'Developer Team' },
  ];

  const messagesPagination = usePagination(messages, 15);

  return (
    <div>
      <PageTitle title="Website CMS" subtitle="Manage public website content and settings" />

      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ---- Site Settings Tab ---- */}
      {tab === 'settings' && (
        <div>
          {settingsLoading && <LoadingState message="Loading settings..." />}
          {settingsError && <ErrorState message={settingsError} onRetry={refreshSettings} />}
          {!settingsLoading && !settingsError && settingsForm && (
            <div className="card p-6 max-w-2xl">
              <div className="space-y-4">
                <Input
                  label="Club Name"
                  value={settingsForm.club_name ?? ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, club_name: e.target.value })}
                />
                <Input
                  label="Tagline"
                  value={settingsForm.tagline ?? ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                />
                <TextArea
                  label="Description"
                  value={settingsForm.description ?? ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                  rows={4}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contact Email"
                    type="email"
                    value={settingsForm.contact_email ?? ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
                  />
                  <Input
                    label="Contact Phone"
                    value={settingsForm.contact_phone ?? ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contact_phone: e.target.value })}
                  />
                </div>
                <Input
                  label="Address"
                  value={settingsForm.address ?? ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                />
                <TextArea
                  label="Social Links (JSON)"
                  value={typeof settingsForm.social_links === 'string' ? settingsForm.social_links : JSON.stringify(settingsForm.social_links ?? {}, null, 2)}
                  onChange={(e) => setSettingsForm({ ...settingsForm, social_links: e.target.value })}
                  rows={5}
                  placeholder='{"twitter": "...", "instagram": "...", "linkedin": "..."}'
                />
                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSaveSettings} disabled={savingSettings} className="btn btn-primary">
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                  {settingsSaved && (
                    <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Saved!
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- About Content Tab ---- */}
      {tab === 'about' && (
        <div>
          {aboutLoading && <LoadingState message="Loading about content..." />}
          {aboutError && <ErrorState message={aboutError} onRetry={refreshAbout} />}
          {!aboutLoading && !aboutError && aboutBlocks.length === 0 && (
            <EmptyState title="No about blocks" message="About content blocks will appear here." />
          )}
          {!aboutLoading && !aboutError && aboutBlocks.length > 0 && (
            <div className="space-y-4">
              {aboutBlocks.map((block) => {
                const isEditing = !!editingAbout[block.id];
                const current = isEditing ? editingAbout[block.id] : block;
                return (
                  <div key={block.id} className="card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-slate-900 dark:text-white">
                        Block #{current.sort_order ?? 0}
                      </h3>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const { [block.id]: _, ...rest } = editingAbout;
                              setEditingAbout(rest);
                            }}
                            className="btn-outline text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveAboutBlock(block.id)}
                            disabled={savingAboutId === block.id}
                            className="btn btn-primary text-sm"
                          >
                            {savingAboutId === block.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditAbout(block)} className="btn-outline text-sm">
                          Edit
                        </button>
                      )}
                    </div>
                    <div className="space-y-4">
                      <Input
                        label="Title"
                        value={current.title ?? ''}
                        onChange={(e) => updateAboutField(block.id, 'title', e.target.value)}
                        disabled={!isEditing}
                      />
                      <TextArea
                        label="Body"
                        value={current.body ?? ''}
                        onChange={(e) => updateAboutField(block.id, 'body', e.target.value)}
                        rows={4}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Image URL"
                        value={current.image_url ?? ''}
                        onChange={(e) => updateAboutField(block.id, 'image_url', e.target.value)}
                        disabled={!isEditing}
                      />
                      <Input
                        label="Sort Order"
                        type="number"
                        value={current.sort_order ?? 0}
                        onChange={(e) => updateAboutField(block.id, 'sort_order', parseInt(e.target.value) || 0)}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ---- Messages Tab ---- */}
      {tab === 'messages' && (
        <div>
          {messagesLoading && <LoadingState message="Loading messages..." />}
          {messagesError && <ErrorState message={messagesError} onRetry={refreshMessages} />}
          {!messagesLoading && !messagesError && messages.length === 0 && (
            <EmptyState title="No messages" message="Contact form submissions will appear here." />
          )}
          {!messagesLoading && !messagesError && messages.length > 0 && (
            <>
            <Table headers={['Name', 'Email', 'Subject', 'Message', 'Date', 'Status', 'Action']}>
              {messagesPagination.paged.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-white">{msg.name}</TableCell>
                  <TableCell>{msg.email}</TableCell>
                  <TableCell>{msg.subject ?? '—'}</TableCell>
                  <TableCell>
                    <span className="line-clamp-1 max-w-xs">{msg.message}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{formatDate(msg.created_at)}</TableCell>
                  <TableCell>
                    {msg.is_read ? (
                      <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">read</span>
                    ) : (
                      <Badge status="pending" />
                    )}
                  </TableCell>
                  <TableCell>
                    {!msg.is_read && (
                      <button
                        onClick={() => handleMarkRead(msg.id)}
                        className="btn btn-outline text-sm"
                      >
                        Mark Read
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </Table>
            <Pagination
              page={messagesPagination.page}
              totalPages={messagesPagination.totalPages}
              onPageChange={messagesPagination.setPage}
              totalItems={messagesPagination.totalItems}
              pageSize={messagesPagination.pageSize}
            />
            </>
          )}
        </div>
      )}

      {/* ---- Developers Tab ---- */}
      {tab === 'developers' && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() =>
                setDeveloperForm({
                  name: '',
                  role: '',
                  photo: '',
                  facebook: '',
                  github: '',
                  gmail: '',
                  linkedin: '',
                  sort_order: 0,
                  is_active: true,
                })
              }
              className="btn btn-primary"
            >
              Add Developer
            </button>
          </div>

          {developerForm && (
            <div className="card p-6 mb-6">
              <h3 className="font-medium text-lg mb-4">{developerForm.id ? 'Edit Developer' : 'New Developer'}</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Name" value={developerForm.name} onChange={(e) => setDeveloperForm({ ...developerForm, name: e.target.value })} />
                  <Input label="Role" value={developerForm.role} onChange={(e) => setDeveloperForm({ ...developerForm, role: e.target.value })} />
                </div>
                <FileUpload
                  bucket="gallery"
                  folder="developers"
                  value={developerForm.photo}
                  onChange={(url) => setDeveloperForm({ ...developerForm, photo: url })}
                  label="Profile Picture"
                  helpText="Upload a square image. Max size 3MB."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Facebook URL" value={developerForm.facebook} onChange={(e) => setDeveloperForm({ ...developerForm, facebook: e.target.value })} />
                  <Input label="GitHub URL" value={developerForm.github} onChange={(e) => setDeveloperForm({ ...developerForm, github: e.target.value })} />
                  <Input label="Gmail URL" value={developerForm.gmail} onChange={(e) => setDeveloperForm({ ...developerForm, gmail: e.target.value })} />
                  <Input label="LinkedIn URL" value={developerForm.linkedin} onChange={(e) => setDeveloperForm({ ...developerForm, linkedin: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input type="number" label="Sort Order" value={developerForm.sort_order} onChange={(e) => setDeveloperForm({ ...developerForm, sort_order: parseInt(e.target.value) || 0 })} />
                  <label className="flex items-center gap-2 mt-8">
                    <input type="checkbox" checked={developerForm.is_active} onChange={(e) => setDeveloperForm({ ...developerForm, is_active: e.target.checked })} className="rounded border-slate-300" />
                    <span className="text-sm font-medium">Active</span>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setDeveloperForm(null)} className="btn btn-outline">Cancel</button>
                  <button onClick={handleSaveDeveloper} disabled={savingDeveloper} className="btn btn-primary">{savingDeveloper ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          )}

          {developersLoading && <LoadingState message="Loading developers..." />}
          {developersError && <ErrorState message={developersError} onRetry={refreshDevelopers} />}
          {!developersLoading && !developersError && developers.length === 0 && (
            <EmptyState title="No developers" message="Add developers to show them on the contact page." />
          )}
          {!developersLoading && !developersError && developers.length > 0 && (
            <Table headers={['Photo', 'Name', 'Role', 'Order', 'Active', 'Actions']}>
              {developers.map((dev) => (
                <TableRow key={dev.id}>
                  <TableCell>
                    {dev.photo ? (
                      <img src={dev.photo} alt={dev.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 dark:text-white">{dev.name}</TableCell>
                  <TableCell>{dev.role}</TableCell>
                  <TableCell>{dev.sort_order}</TableCell>
                  <TableCell>
                    {dev.is_active ? (
                      <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>
                    ) : (
                      <span className="badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <button onClick={() => setDeveloperForm({ ...dev })} className="text-primary-600 hover:text-primary-800">Edit</button>
                      <button onClick={() => handleDeleteDeveloper(dev.id)} className="text-red-600 hover:text-red-800">Delete</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          )}
        </div>
      )}
    </div>
  );
}