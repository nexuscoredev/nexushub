import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createPersonalVaultEntry,
  deletePersonalVaultEntry,
  fetchPersonalVaultConfig,
  fetchPersonalVaultEntries,
  PERSONAL_VAULT_CATEGORIAS,
  savePersonalVaultConfig,
  updatePersonalVaultEntry,
  type PersonalVaultCategoria,
  type PersonalVaultConfig,
  type PersonalVaultEntry,
  type PersonalVaultEntryInput,
} from '../../lib/personalPasswordVault';
import {
  createVaultVerifier,
  decryptText,
  encryptText,
  generateSalt,
  unlockVaultKey,
} from '../../lib/vaultCrypto';
import vaultStyles from '../../pages/VaultPage.module.css';
import styles from './PersonalPasswordVault.module.css';

interface EntryFormState {
  titulo: string;
  usuario_login: string;
  url: string;
  categoria: PersonalVaultCategoria;
  password: string;
  notas: string;
}

const emptyForm = (): EntryFormState => ({
  titulo: '',
  usuario_login: '',
  url: '',
  categoria: 'outro',
  password: '',
  notas: '',
});

type PersonalPasswordVaultProps = {
  userId: string | undefined;
};

export function PersonalPasswordVault({ userId }: PersonalPasswordVaultProps) {
  const [config, setConfig] = useState<PersonalVaultConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const unlocked = cryptoKey != null;

  const [masterPassword, setMasterPassword] = useState('');
  const [masterConfirm, setMasterConfirm] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState<PersonalVaultEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<PersonalVaultCategoria | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, { password: string; notas: string }>>({});

  const refreshConfig = useCallback(async () => {
    if (!userId) {
      setConfig(null);
      setConfigLoading(false);
      return;
    }
    setConfigLoading(true);
    try {
      const row = await fetchPersonalVaultConfig(userId);
      setConfig(row);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Erro ao carregar cofre.');
      setConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  const loadEntries = useCallback(async () => {
    if (!unlocked || !userId) return;
    setLoadingEntries(true);
    setListError(null);
    try {
      const rows = await fetchPersonalVaultEntries(userId);
      setEntries(rows);
      setRevealed({});
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Erro ao carregar credenciais.');
    } finally {
      setLoadingEntries(false);
    }
  }, [unlocked, userId]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  const lock = () => {
    setCryptoKey(null);
    setMasterPassword('');
    setMasterConfirm('');
    setRevealed({});
    setEntries([]);
  };

  const handleSetup = async () => {
    if (!userId) return;
    setUnlockError(null);
    if (masterPassword.length < 8) {
      setUnlockError('Use pelo menos 8 caracteres na senha mestra.');
      return;
    }
    if (masterPassword !== masterConfirm) {
      setUnlockError('As senhas não coincidem.');
      return;
    }
    setBusy(true);
    try {
      const salt = generateSalt();
      const { cryptoKey: key, verifier } = await createVaultVerifier(masterPassword, salt);
      await savePersonalVaultConfig(userId, {
        kdf_salt: salt,
        verifier_iv: verifier.iv,
        verifier_ciphertext: verifier.ciphertext,
      });
      setCryptoKey(key);
      setMasterPassword('');
      setMasterConfirm('');
      await refreshConfig();
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Erro ao criar cofre.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    if (!config || !masterPassword) return;
    setUnlockError(null);
    setBusy(true);
    try {
      const key = await unlockVaultKey(masterPassword, config.kdf_salt, {
        iv: config.verifier_iv,
        ciphertext: config.verifier_ciphertext,
      });
      if (!key) {
        setUnlockError('Senha mestra incorreta.');
        return;
      }
      setCryptoKey(key);
      setMasterPassword('');
    } catch {
      setUnlockError('Senha mestra incorreta.');
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterCategoria && e.categoria !== filterCategoria) return false;
      if (!q) return true;
      const hay = `${e.titulo} ${e.usuario_login ?? ''} ${e.url ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, search, filterCategoria]);

  const categoriaLabel = (value: PersonalVaultCategoria) =>
    PERSONAL_VAULT_CATEGORIAS.find((c) => c.value === value)?.label ?? value;

  const copyText = async (text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (entry: PersonalVaultEntry) => {
    if (!cryptoKey) return;
    setEditingId(entry.id);
    setFormError(null);
    let password = '';
    let notas = '';
    try {
      if (entry.password_iv && entry.password_ciphertext) {
        password = await decryptText(
          { iv: entry.password_iv, ciphertext: entry.password_ciphertext },
          cryptoKey,
        );
      }
      if (entry.notas_iv && entry.notas_ciphertext) {
        notas = await decryptText(
          { iv: entry.notas_iv, ciphertext: entry.notas_ciphertext },
          cryptoKey,
        );
      }
    } catch {
      setFormError('Não foi possível descriptografar esta entrada.');
      return;
    }
    setForm({
      titulo: entry.titulo,
      usuario_login: entry.usuario_login ?? '',
      url: entry.url ?? '',
      categoria: entry.categoria,
      password,
      notas,
    });
    setModalOpen(true);
  };

  const toggleReveal = async (entry: PersonalVaultEntry) => {
    if (!cryptoKey) return;
    if (revealed[entry.id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
      return;
    }
    try {
      let password = '';
      let notas = '';
      if (entry.password_iv && entry.password_ciphertext) {
        password = await decryptText(
          { iv: entry.password_iv, ciphertext: entry.password_ciphertext },
          cryptoKey,
        );
      }
      if (entry.notas_iv && entry.notas_ciphertext) {
        notas = await decryptText(
          { iv: entry.notas_iv, ciphertext: entry.notas_ciphertext },
          cryptoKey,
        );
      }
      setRevealed((prev) => ({ ...prev, [entry.id]: { password, notas } }));
    } catch {
      setListError('Erro ao revelar credencial.');
    }
  };

  const buildEncryptedInput = async (): Promise<PersonalVaultEntryInput | null> => {
    if (!cryptoKey) return null;
    if (!form.titulo.trim()) {
      setFormError('Informe um título.');
      return null;
    }
    const existing = editingId ? entries.find((e) => e.id === editingId) : undefined;

    let passwordEncrypted: PersonalVaultEntryInput['passwordEncrypted'] = null;
    if (form.password) {
      passwordEncrypted = await encryptText(form.password, cryptoKey);
    } else if (existing?.password_iv && existing.password_ciphertext) {
      passwordEncrypted = {
        iv: existing.password_iv,
        ciphertext: existing.password_ciphertext,
      };
    }

    let notasEncrypted: PersonalVaultEntryInput['notasEncrypted'] = null;
    if (form.notas) {
      notasEncrypted = await encryptText(form.notas, cryptoKey);
    } else if (existing?.notas_iv && existing.notas_ciphertext) {
      notasEncrypted = { iv: existing.notas_iv, ciphertext: existing.notas_ciphertext };
    }

    return {
      titulo: form.titulo,
      usuario_login: form.usuario_login,
      url: form.url,
      categoria: form.categoria,
      passwordEncrypted,
      notasEncrypted,
    };
  };

  const handleSave = async () => {
    if (!userId) return;
    setFormError(null);
    setBusy(true);
    try {
      const payload = await buildEncryptedInput();
      if (!payload) return;
      if (editingId) {
        await updatePersonalVaultEntry(editingId, userId, payload);
      } else {
        await createPersonalVaultEntry(userId, payload);
      }
      setModalOpen(false);
      await loadEntries();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!userId || !window.confirm('Excluir esta credencial?')) return;
    setBusy(true);
    try {
      await deletePersonalVaultEntry(id, userId);
      await loadEntries();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Erro ao excluir.');
    } finally {
      setBusy(false);
    }
  };

  if (!userId) {
    return <p className={styles.muted}>Faça login para usar o cofre pessoal.</p>;
  }

  if (configLoading) {
    return <p className={styles.muted}>Carregando cofre…</p>;
  }

  if (!config) {
    return (
      <div className={vaultStyles.panel}>
        <div className={vaultStyles.unlockCard}>
          <h2>Criar seu cofre pessoal</h2>
          <p>
            Defina uma senha mestra só sua. As senhas guardadas são criptografadas no servidor com
            AES-256 — só você consegue ler com a senha mestra.
          </p>
          {unlockError && <div className="error-banner">{unlockError}</div>}
          <div className={vaultStyles.field}>
            <label htmlFor="personal-vault-setup-pass">Senha mestra</label>
            <input
              id="personal-vault-setup-pass"
              type="password"
              autoComplete="new-password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
            />
          </div>
          <div className={vaultStyles.field}>
            <label htmlFor="personal-vault-setup-confirm">Confirmar senha mestra</label>
            <input
              id="personal-vault-setup-confirm"
              type="password"
              autoComplete="new-password"
              value={masterConfirm}
              onChange={(e) => setMasterConfirm(e.target.value)}
            />
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleSetup()}>
            {busy ? 'Configurando…' : 'Criar cofre'}
          </button>
          <p className={vaultStyles.hint}>
            Não há recuperação automática — guarde a senha mestra em local seguro.
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className={vaultStyles.panel}>
        <div className={vaultStyles.unlockCard}>
          <h2>Cofre bloqueado</h2>
          <p>Digite sua senha mestra. A chave fica só nesta sessão do navegador.</p>
          {unlockError && <div className="error-banner">{unlockError}</div>}
          <div className={vaultStyles.field}>
            <label htmlFor="personal-vault-unlock-pass">Senha mestra</label>
            <input
              id="personal-vault-unlock-pass"
              type="password"
              autoComplete="current-password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleUnlock()}
            />
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleUnlock()}>
            {busy ? 'Desbloqueando…' : 'Desbloquear'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={vaultStyles.panel}>
      <div className={vaultStyles.toolbar}>
        <div className={vaultStyles.filterBar}>
          <div className={vaultStyles.filterField}>
            <label className={vaultStyles.filterLabel} htmlFor="personal-vault-search">
              Buscar
            </label>
            <div className={vaultStyles.filterControl}>
              <input
                id="personal-vault-search"
                className={`${vaultStyles.filterInput} ${vaultStyles.filterInputSearch}`}
                type="search"
                placeholder="Título, login ou URL…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className={vaultStyles.filterField}>
            <label className={vaultStyles.filterLabel} htmlFor="personal-vault-categoria">
              Categoria
            </label>
            <select
              id="personal-vault-categoria"
              className={vaultStyles.filterSelect}
              value={filterCategoria}
              onChange={(e) => setFilterCategoria(e.target.value as PersonalVaultCategoria | '')}
            >
              <option value="">Todas</option>
              {PERSONAL_VAULT_CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className={styles.actionsRow}>
          <button type="button" className="btn-primary" onClick={openCreate}>
            Nova credencial
          </button>
          <button type="button" className="btn-secondary" onClick={lock}>
            Bloquear cofre
          </button>
        </div>
      </div>

      {listError && <div className="error-banner">{listError}</div>}
      {loadingEntries && <p className={styles.muted}>Carregando…</p>}

      {!loadingEntries && filtered.length === 0 && (
        <p className={styles.empty}>Nenhuma credencial{search || filterCategoria ? ' com esse filtro' : ''}.</p>
      )}

      <div className={vaultStyles.list}>
        {filtered.map((entry) => {
          const show = revealed[entry.id];
          return (
            <article key={entry.id} className={vaultStyles.entry}>
              <div className={vaultStyles.entryHead}>
                <div>
                  <h3 className={vaultStyles.entryTitle}>{entry.titulo}</h3>
                  <p className={vaultStyles.entryMeta}>
                    {entry.usuario_login && <span>{entry.usuario_login}</span>}
                    {entry.usuario_login && entry.url && ' · '}
                    {entry.url && (
                      <a href={entry.url} target="_blank" rel="noopener noreferrer">
                        {entry.url}
                      </a>
                    )}
                  </p>
                </div>
                <span className={vaultStyles.badge}>{categoriaLabel(entry.categoria)}</span>
              </div>

              {show && (
                <div className={vaultStyles.entryBody}>
                  <span className={vaultStyles.secretValue}>{show.password || '—'}</span>
                  {show.notas && (
                    <p className={vaultStyles.entryMeta} style={{ whiteSpace: 'pre-wrap' }}>
                      {show.notas}
                    </p>
                  )}
                </div>
              )}

              <div className={vaultStyles.entryFooter}>
                {!show ? (
                  <button
                    type="button"
                    className={vaultStyles.entryBtnPrimary}
                    onClick={() => void toggleReveal(entry)}
                  >
                    Revelar
                  </button>
                ) : (
                  <button
                    type="button"
                    className={vaultStyles.entryBtn}
                    onClick={() => void copyText(show.password)}
                  >
                    Copiar senha
                  </button>
                )}
                <button
                  type="button"
                  className={vaultStyles.entryBtn}
                  onClick={() => void openEdit(entry)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  className={`${vaultStyles.entryBtn} ${vaultStyles.entryBtnDanger}`}
                  disabled={busy}
                  onClick={() => void handleDelete(entry.id)}
                >
                  Excluir
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {modalOpen && (
        <div className={vaultStyles.modalBackdrop} role="presentation" onClick={() => setModalOpen(false)}>
          <div
            className={vaultStyles.modal}
            role="dialog"
            aria-labelledby="personal-vault-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="personal-vault-modal-title">{editingId ? 'Editar credencial' : 'Nova credencial'}</h2>
            {formError && <div className="error-banner">{formError}</div>}
            <div className={vaultStyles.field}>
              <label htmlFor="pv-titulo">Título</label>
              <input
                id="pv-titulo"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className={vaultStyles.field}>
              <label htmlFor="pv-login">Login / usuário</label>
              <input
                id="pv-login"
                value={form.usuario_login}
                onChange={(e) => setForm((f) => ({ ...f, usuario_login: e.target.value }))}
              />
            </div>
            <div className={vaultStyles.field}>
              <label htmlFor="pv-url">URL</label>
              <input
                id="pv-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className={vaultStyles.field}>
              <label htmlFor="pv-categoria">Categoria</label>
              <select
                id="pv-categoria"
                value={form.categoria}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoria: e.target.value as PersonalVaultCategoria }))
                }
              >
                {PERSONAL_VAULT_CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={vaultStyles.field}>
              <label htmlFor="pv-password">Senha</label>
              <input
                id="pv-password"
                type="password"
                autoComplete="new-password"
                value={form.password}
                placeholder={editingId ? 'Deixe em branco para manter' : ''}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className={vaultStyles.field}>
              <label htmlFor="pv-notas">Notas</label>
              <textarea
                id="pv-notas"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </div>
            <div className={vaultStyles.modalActions}>
              <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </button>
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleSave()}>
                {busy ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
