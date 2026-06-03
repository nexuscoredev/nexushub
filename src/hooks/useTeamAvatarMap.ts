import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { normalizeUsuario } from '../lib/usuarios';
import type { AssigneeHub } from '../lib/todoistAssignees';

export interface TeamMemberAvatar {
  name: string;
  email: string;
  avatarUrl: string | null;
}

export type TeamAvatarMap = Partial<Record<AssigneeHub, TeamMemberAvatar>>;

const TEAM_USUARIOS: AssigneeHub[] = ['vinicius', 'rafael', 'felipe'];

export function useTeamAvatarMap(): TeamAvatarMap {
  const [map, setMap] = useState<TeamAvatarMap>({});

  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from('hub_profiles')
      .select('usuario, nome, email, avatar_url')
      .in('usuario', TEAM_USUARIOS)
      .then(({ data }) => {
        const next: TeamAvatarMap = {};
        for (const row of data ?? []) {
          const hub = normalizeUsuario(row.usuario) as AssigneeHub;
          if (!TEAM_USUARIOS.includes(hub)) continue;
          next[hub] = {
            name: row.nome,
            email: row.email,
            avatarUrl: row.avatar_url ?? null,
          };
        }
        setMap(next);
      });
  }, []);

  return map;
}
