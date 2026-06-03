import { useEffect, useRef, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { UserAvatar } from '../components/UserAvatar';
import { useAuth } from '../contexts/AuthContext';
import { removeProfileAvatar, uploadProfileAvatar } from '../lib/profileAvatar';
import { supabase, supabaseErrorMessage } from '../lib/supabase';
import styles from './ProfilePage.module.css';

export function ProfilePage() {
  const { user, profile, refreshProfile, configured } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nome, setNome] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setNome(profile?.nome ?? '');
  }, [profile?.nome]);

  const clearFeedback = () => {
    setError(null);
    setSuccess(null);
  };

  const saveNome = async () => {
    if (!supabase || !user?.id) return;
    const trimmed = nome.trim();
    if (!trimmed) {
      setError('Informe um nome.');
      return;
    }
    setSavingProfile(true);
    clearFeedback();
    try {
      const { error: updateError } = await supabase
        .from('hub_profiles')
        .update({ nome: trimmed })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Nome atualizado.');
    } catch (e) {
      setError(supabaseErrorMessage(e));
    } finally {
      setSavingProfile(false);
    }
  };

  const onPhotoSelected = async (file: File | undefined) => {
    if (!file || !user?.id) return;
    setUploadingPhoto(true);
    clearFeedback();
    try {
      const url = await uploadProfileAvatar(user.id, file);
      const { error: updateError } = await supabase!
        .from('hub_profiles')
        .update({ avatar_url: url })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Foto atualizada.');
    } catch (e) {
      setError(supabaseErrorMessage(e));
    } finally {
      setUploadingPhoto(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removePhoto = async () => {
    if (!user?.id) return;
    setUploadingPhoto(true);
    clearFeedback();
    try {
      await removeProfileAvatar(user.id);
      const { error: updateError } = await supabase!
        .from('hub_profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);
      if (updateError) throw updateError;
      await refreshProfile();
      setSuccess('Foto removida.');
    } catch (e) {
      setError(supabaseErrorMessage(e));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const savePassword = async () => {
    if (!supabase) return;
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.');
      return;
    }
    setSavingPassword(true);
    clearFeedback();
    try {
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPassword('');
      setPasswordConfirm('');
      setSuccess('Senha alterada.');
    } catch (e) {
      setError(supabaseErrorMessage(e));
    } finally {
      setSavingPassword(false);
    }
  };

  if (!configured) {
    return (
      <div>
        <PageHeader badge="Conta" title="Meu perfil" subtitle="Supabase não configurado neste ambiente." />
        <div className="error-banner">Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        badge="Conta"
        title="Meu perfil"
        subtitle="Foto, nome e senha da sua conta no Hub."
      />

      {error && (
        <div className="error-banner" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && <div className={styles.success} style={{ marginBottom: '1rem' }}>{success}</div>}

      <div className={styles.layout}>
        <section className={`card ${styles.photoCard}`}>
          <UserAvatar
            size="lg"
            name={profile?.nome}
            email={user?.email}
            avatarUrl={profile?.avatar_url}
          />
          <p className={styles.hint}>JPEG, PNG, WebP ou GIF · máx. 2 MB</p>
          <div className={styles.photoActions}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className={styles.fileInput}
              id="profile-avatar-input"
              onChange={(e) => void onPhotoSelected(e.target.files?.[0])}
              disabled={uploadingPhoto}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={uploadingPhoto}
              onClick={() => fileRef.current?.click()}
            >
              {uploadingPhoto ? 'Enviando…' : 'Alterar foto'}
            </button>
            {profile?.avatar_url && (
              <button
                type="button"
                className="btn-ghost"
                disabled={uploadingPhoto}
                onClick={() => void removePhoto()}
              >
                Remover
              </button>
            )}
          </div>
        </section>

        <section className={`card ${styles.formCard}`}>
          <div>
            <h2 className={styles.sectionTitle}>Dados do perfil</h2>
            <div className={styles.field}>
              <label className={styles.fieldLabel} htmlFor="profile-nome">
                Nome exibido
              </label>
              <input
                id="profile-nome"
                className="input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className={styles.grid2} style={{ marginTop: '1rem' }}>
              <div>
                <span className={styles.fieldLabel}>Usuário</span>
                <p className={styles.readOnly}>{profile?.usuario ?? '—'}</p>
              </div>
              <div>
                <span className={styles.fieldLabel}>Cargo</span>
                <p className={styles.readOnly}>{profile?.cargo ?? '—'}</p>
              </div>
            </div>
            <div className={styles.field} style={{ marginTop: '0.75rem' }}>
              <span className={styles.fieldLabel}>E-mail</span>
              <p className={styles.readOnlyMuted}>{profile?.email ?? user?.email ?? '—'}</p>
            </div>
            <div className={styles.actions} style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-primary"
                disabled={savingProfile || nome.trim() === (profile?.nome ?? '')}
                onClick={() => void saveNome()}
              >
                {savingProfile ? 'Salvando…' : 'Salvar nome'}
              </button>
            </div>
          </div>

          <hr className={styles.divider} />

          <div>
            <h2 className={styles.sectionTitle}>Segurança</h2>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="profile-password">
                  Nova senha
                </label>
                <input
                  id="profile-password"
                  type="password"
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="profile-password-confirm">
                  Confirmar senha
                </label>
                <input
                  id="profile-password-confirm"
                  type="password"
                  className="input"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className={styles.actions} style={{ marginTop: '1rem' }}>
              <button
                type="button"
                className="btn-primary"
                disabled={savingPassword || !password}
                onClick={() => void savePassword()}
              >
                {savingPassword ? 'Alterando…' : 'Alterar senha'}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
