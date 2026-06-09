import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useVault } from '../contexts/VaultContext';
import { VaultProviderIcon } from '../components/vault/VaultProviderIcon';
import {
  createVaultEntry,
  deleteVaultEntry,
  fetchVaultClientes,
  fetchVaultConfig,
  fetchVaultEntries,
  saveVaultConfig,
  updateVaultEntry,
  VAULT_CATEGORIAS,
  type HubVaultCliente,
  type HubVaultEntry,
  type VaultCategoria,
  type VaultEntryInput,
} from '../lib/vault';
import {
  getVaultProvedor,
  VAULT_PROVEDORES,
  type VaultProvedorId,
} from '../lib/vaultProviders';
import {
  createVaultVerifier,
  decryptText,
  encryptText,
  generateSalt,
} from '../lib/vaultCrypto';
import styles from './VaultPage.module.css';

interface EntryFormState {
  titulo: string;
  usuario_login: string;
  url: string;
  categoria: VaultCategoria;
  cliente_id: string;
  provedor: VaultProvedorId | '';
  password: string;
  notas: string;
}

const emptyForm = (): EntryFormState => ({
  titulo: '',
  usuario_login: '',
  url: '',
  categoria: 'outro',
  cliente_id: '',
  provedor: '',
  password: '',
  notas: '',
});

export function VaultPage() {
  const { user } = useAuth();
  const {
    config,
    configLoading,
    unlocked,
    cryptoKey,
    unlock,
    lock,
    setCryptoKey,
    refreshConfig,
  } = useVault();

  const [masterPassword, setMasterPassword] = useState('');
  const [masterConfirm, setMasterConfirm] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [entries, setEntries] = useState<HubVaultEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<HubVaultCliente[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<VaultCategoria | ''>('');
  const [filterCliente, setFilterCliente] = useState('');
  const [filterProvedor, setFilterProvedor] = useState<VaultProvedorId | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EntryFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [revealed, setRevealed] = useState<Record<string, { password: string; notas: string }>>({});

  const loadEntries = useCallback(async () => {
    if (!unlocked) return;
    setLoadingEntries(true);
    setListError(null);
    try {
      const rows = await fetchVaultEntries();
      setEntries(rows);
      setRevealed({});
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Erro ao carregar cofre.');
    } finally {
      setLoadingEntries(false);
    }
  }, [unlocked]);

  useEffect(() => {
    void refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    if (!unlocked) return;
    void fetchVaultClientes()
      .then(setClientes)
      .catch(() => setClientes([]));
  }, [unlocked]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (filterCategoria && e.categoria !== filterCategoria) return false;
      if (filterCliente && e.cliente_id !== filterCliente) return false;
      if (filterProvedor && e.provedor !== filterProvedor) return false;
      if (!q) return true;
      return (
        e.titulo.toLowerCase().includes(q) ||
        (e.usuario_login ?? '').toLowerCase().includes(q) ||
        (e.url ?? '').toLowerCase().includes(q) ||
        (e.cliente_nome ?? '').toLowerCase().includes(q) ||
        (getVaultProvedor(e.provedor)?.label ?? '').toLowerCase().includes(q)
      );
    });
  }, [entries, search, filterCategoria, filterCliente, filterProvedor]);

  const selectProvedor = (id: VaultProvedorId) => {
    const prov = getVaultProvedor(id);
    setForm((f) => ({
      ...f,
      provedor: id,
      url: f.url.trim() || prov?.defaultUrl || f.url,
    }));
  };

  const handleSetup = async () => {
    setUnlockError(null);
    const existing = await fetchVaultConfig();
    if (existing) {
      await refreshConfig();
      setUnlockError('O cofre já foi configurado. Use a senha mestra para desbloquear.');
      return;
    }
    if (masterPassword.length < 8) {
      setUnlockError('A senha mestra deve ter pelo menos 8 caracteres.');
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
      await saveVaultConfig({
        kdf_salt: salt,
        verifier_iv: verifier.iv,
        verifier_ciphertext: verifier.ciphertext,
      });
      await refreshConfig();
      setCryptoKey(key);
      setMasterPassword('');
      setMasterConfirm('');
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Erro ao configurar cofre.');
    } finally {
      setBusy(false);
    }
  };

  const handleUnlock = async () => {
    setUnlockError(null);
    setBusy(true);
    try {
      const ok = await unlock(masterPassword);
      if (!ok) setUnlockError('Senha mestra incorreta.');
      else setMasterPassword('');
    } finally {
      setBusy(false);
    }
  };

  const handleLock = () => {
    lock();
    setRevealed({});
    setEntries([]);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = async (entry: HubVaultEntry) => {
    if (!cryptoKey) return;
    setEditingId(entry.id);
    setFormError(null);
    try {
      const password = await decryptText(
        { iv: entry.password_iv, ciphertext: entry.password_ciphertext },
        cryptoKey
      );
      const notas = entry.notas_iv && entry.notas_ciphertext
        ? await decryptText({ iv: entry.notas_iv, ciphertext: entry.notas_ciphertext }, cryptoKey)
        : '';
      setForm({
        titulo: entry.titulo,
        usuario_login: entry.usuario_login ?? '',
        url: entry.url ?? '',
        categoria: entry.categoria,
        cliente_id: entry.cliente_id ?? '',
        provedor: entry.provedor ?? '',
        password,
        notas,
      });
      setModalOpen(true);
    } catch {
      setFormError('Não foi possível descriptografar este item.');
    }
  };

  const revealEntry = async (entry: HubVaultEntry) => {
    if (!cryptoKey) return;
    try {
      const password = await decryptText(
        { iv: entry.password_iv, ciphertext: entry.password_ciphertext },
        cryptoKey
      );
      const notas =
        entry.notas_iv && entry.notas_ciphertext
          ? await decryptText({ iv: entry.notas_iv, ciphertext: entry.notas_ciphertext }, cryptoKey)
          : '';
      setRevealed((prev) => ({ ...prev, [entry.id]: { password, notas } }));
    } catch {
      setListError('Falha ao descriptografar credencial.');
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const buildEncryptedInput = async (): Promise<VaultEntryInput | null> => {
    if (!cryptoKey || !user) return null;
    if (!form.titulo.trim()) {
      setFormError('Informe um título.');
      return null;
    }
    if (!form.password) {
      setFormError('Informe a senha.');
      return null;
    }
    const passwordEncrypted = await encryptText(form.password, cryptoKey);
    const notasTrim = form.notas.trim();
    const notasEncrypted = notasTrim ? await encryptText(notasTrim, cryptoKey) : null;
    return {
      titulo: form.titulo,
      usuario_login: form.usuario_login,
      url: form.url,
      categoria: form.categoria,
      cliente_id: form.cliente_id || null,
      provedor: form.provedor || null,
      passwordEncrypted,
      notasEncrypted,
    };
  };

  const handleSave = async () => {
    if (!user) return;
    setFormError(null);
    setBusy(true);
    try {
      const payload = await buildEncryptedInput();
      if (!payload) return;
      if (editingId) {
        await updateVaultEntry(editingId, user.id, payload);
      } else {
        await createVaultEntry(user.id, payload);
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
    if (!window.confirm('Excluir esta credencial do cofre?')) return;
    setBusy(true);
    try {
      await deleteVaultEntry(id);
      await loadEntries();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Erro ao excluir.');
    } finally {
      setBusy(false);
    }
  };

  if (configLoading) {
    return <p style={{ color: 'var(--muted)' }}>Carregando cofre…</p>;
  }

  if (!config) {
    return (
      <div className={styles.panel}>
        <PageHeader
          badge="Segurança"
          title="Cofre de senhas"
          subtitle="Configure a senha mestra da equipe (apenas uma vez). Ela nunca é enviada ao servidor."
        />
        <div className={styles.unlockCard}>
          <h2>Primeira configuração do cofre</h2>
          <p>
            Crie uma senha mestra compartilhada com a gestão (CEO, CTO, Administrador). As
            credenciais ficam criptografadas no banco; só quem souber a senha mestra consegue ler.
          </p>
          {unlockError && <div className="error-banner">{unlockError}</div>}
          <div className={styles.field}>
            <label htmlFor="vault-setup-pass">Senha mestra</label>
            <input
              id="vault-setup-pass"
              type="password"
              autoComplete="new-password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="vault-setup-confirm">Confirmar senha mestra</label>
            <input
              id="vault-setup-confirm"
              type="password"
              autoComplete="new-password"
              value={masterConfirm}
              onChange={(e) => setMasterConfirm(e.target.value)}
            />
          </div>
          <button type="button" className="btn-primary" disabled={busy} onClick={() => void handleSetup()}>
            {busy ? 'Configurando…' : 'Criar cofre'}
          </button>
          <p className={styles.hint}>
            Use AES-256-GCM no navegador. Guarde a senha mestra em local seguro — não há recuperação automática.
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className={styles.panel}>
        <PageHeader
          badge="Segurança"
          title="Cofre de senhas"
          subtitle="Desbloqueie com a senha mestra para ver e editar credenciais."
        />
        <div className={styles.unlockCard}>
          <h2>Cofre bloqueado</h2>
          <p>Digite a senha mestra da equipe. A chave permanece só nesta sessão do navegador.</p>
          {unlockError && <div className="error-banner">{unlockError}</div>}
          <div className={styles.field}>
            <label htmlFor="vault-unlock-pass">Senha mestra</label>
            <input
              id="vault-unlock-pass"
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
    <div className={styles.panel}>
      <PageHeader
        badge="Segurança"
        title="Cofre de senhas"
        subtitle="Credenciais criptografadas — compartilhadas com a gestão."
      />

      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          <input
            className={styles.search}
            type="search"
            placeholder="Buscar…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value as VaultCategoria | '')}
          >
            <option value="">Todas categorias</option>
            {VAULT_CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={filterCliente} onChange={(e) => setFilterCliente(e.target.value)}>
            <option value="">Todos clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <select
            value={filterProvedor}
            onChange={(e) => setFilterProvedor(e.target.value as VaultProvedorId | '')}
          >
            <option value="">Todos sistemas</option>
            {VAULT_PROVEDORES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary" onClick={openCreate}>
            Nova credencial
          </button>
        </div>
        <button type="button" className={`btn-ghost ${styles.lockBtn}`} onClick={handleLock}>
          Bloquear cofre
        </button>
      </div>

      {listError && <div className="error-banner">{listError}</div>}
      {loadingEntries && <p style={{ color: 'var(--muted)' }}>Carregando credenciais…</p>}

      <div className={styles.list}>
        {filtered.map((entry) => {
          const cat = VAULT_CATEGORIAS.find((c) => c.value === entry.categoria);
          const prov = getVaultProvedor(entry.provedor);
          const show = revealed[entry.id];
          return (
            <article key={entry.id} className={styles.entry}>
              <div className={styles.entryRow}>
                <div className={styles.entryIcon}>
                  {entry.provedor ? (
                    <VaultProviderIcon provider={entry.provedor} size={22} />
                  ) : (
                    <VaultProviderIcon provider="outro" size={22} />
                  )}
                </div>
                <div className={styles.entryContent}>
                  <div className={styles.entryHead}>
                    <div>
                      <h3 className={styles.entryTitle}>
                        {entry.titulo}
                        {prov && (
                          <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: '0.85em' }}>
                            {' '}
                            · {prov.label}
                          </span>
                        )}
                      </h3>
                      <p className={styles.entryMeta}>
                        {entry.usuario_login && <span>{entry.usuario_login}</span>}
                        {entry.usuario_login && entry.url && ' · '}
                        {entry.url && (
                          <a href={entry.url} target="_blank" rel="noopener noreferrer">
                            {entry.url}
                          </a>
                        )}
                      </p>
                      {entry.cliente_nome && (
                        <span className={styles.clienteTag}>Cliente: {entry.cliente_nome}</span>
                      )}
                    </div>
                    <span className={styles.badge}>{cat?.label ?? entry.categoria}</span>
                  </div>

              {show ? (
                <div className={styles.entryBody}>
                  <div className={styles.secretRow}>
                    <span className={styles.secretValue}>{show.password}</span>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => void copyText(show.password)}
                    >
                      Copiar senha
                    </button>
                  </div>
                  {show.notas && (
                    <p className={styles.entryMeta} style={{ whiteSpace: 'pre-wrap' }}>
                      {show.notas}
                    </p>
                  )}
                </div>
              ) : (
                <div className={styles.entryActions}>
                  <button type="button" className="btn-primary" onClick={() => void revealEntry(entry)}>
                    Revelar
                  </button>
                </div>
              )}

                  <div className={styles.entryActions}>
                    <button type="button" className="btn-ghost" onClick={() => void openEdit(entry)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn-ghost"
                      disabled={busy}
                      onClick={() => void handleDelete(entry.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        {!loadingEntries && filtered.length === 0 && (
          <p style={{ color: 'var(--muted)' }}>Nenhuma credencial encontrada.</p>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setModalOpen(false)}>
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-form-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="vault-form-title">{editingId ? 'Editar credencial' : 'Nova credencial'}</h2>
            {formError && <div className="error-banner">{formError}</div>}
            <div className={styles.field}>
              <label htmlFor="vault-titulo">Título</label>
              <input
                id="vault-titulo"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-user">Usuário / login</label>
              <input
                id="vault-user"
                value={form.usuario_login}
                onChange={(e) => setForm((f) => ({ ...f, usuario_login: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-url">URL</label>
              <input
                id="vault-url"
                type="url"
                value={form.url}
                onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>Sistema / provedor</label>
              <div className={styles.providerGrid} role="listbox" aria-label="Provedor">
                {VAULT_PROVEDORES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="option"
                    aria-selected={form.provedor === p.id}
                    className={`${styles.providerOption} ${form.provedor === p.id ? styles.providerOptionOn : ''}`}
                    onClick={() => selectProvedor(p.id)}
                  >
                    <VaultProviderIcon provider={p.id} size={26} />
                    <span className={styles.providerLabel}>{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-cliente">Cliente</label>
              <select
                id="vault-cliente"
                value={form.cliente_id}
                onChange={(e) => setForm((f) => ({ ...f, cliente_id: e.target.value }))}
              >
                <option value="">Nenhum / interno NEXUS</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-cat">Categoria</label>
              <select
                id="vault-cat"
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value as VaultCategoria }))}
              >
                {VAULT_CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-pass">Senha</label>
              <input
                id="vault-pass"
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="vault-notas">Notas (opcional, criptografadas)</label>
              <textarea
                id="vault-notas"
                value={form.notas}
                onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              />
            </div>
            <div className={styles.modalActions}>
              <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>
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
