import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Users, Shield, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { VidalLogo } from '@/components/VidalLogo';

interface UserItem {
  user_id: string;
  display_name: string;
  role: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change
  const [changePasswordUserId, setChangePasswordUserId] = useState<string | null>(null);
  const [newUserPassword, setNewUserPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  const fetchUsers = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'list-users' },
    });

    if (res.data) {
      const { profiles, roles } = res.data;
      const merged = (profiles || []).map((p: any) => {
        const userRole = (roles || []).find((r: any) => r.user_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          role: userRole?.role || 'user',
        };
      });
      setUsers(merged);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsCreating(true);

    const email = `${newUsername}@vidalpedalboard.com`;

    const res = await supabase.functions.invoke('manage-users', {
      body: {
        action: 'create-user',
        email,
        password: newPassword,
        display_name: newName || newUsername,
      },
    });

    if (res.error || res.data?.error) {
      setError(res.data?.error || res.error?.message || 'Erro ao criar usuário');
    } else {
      setSuccess('Usuário criado com sucesso!');
      setNewUsername('');
      setNewPassword('');
      setNewName('');
      fetchUsers();
    }
    setIsCreating(false);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;

    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'delete-user', user_id: userId },
    });

    if (!res.error && !res.data?.error) {
      fetchUsers();
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newUserPassword || newUserPassword.length < 6) {
      setPasswordMsg('Senha deve ter pelo menos 6 caracteres');
      return;
    }
    setPasswordMsg('');

    const res = await supabase.functions.invoke('manage-users', {
      body: { action: 'change-password', user_id: userId, new_password: newUserPassword },
    });

    if (res.error || res.data?.error) {
      setPasswordMsg(res.data?.error || 'Erro ao alterar senha');
    } else {
      setPasswordMsg('Senha alterada com sucesso!');
      setNewUserPassword('');
      setTimeout(() => {
        setChangePasswordUserId(null);
        setPasswordMsg('');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <VidalLogo />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span className="text-xs font-mono">ADMIN</span>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full space-y-6">
        {/* Create User */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-4">
          <h2 className="flex items-center gap-2 font-semibold text-sm">
            <Plus className="w-4 h-4" /> Criar Usuário
          </h2>
          <form onSubmit={handleCreateUser} className="space-y-3">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome de exibição"
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              value={newUsername}
              onChange={e => setNewUsername(e.target.value)}
              required
              placeholder="Usuário (login)"
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Senha (mín 6 caracteres)"
              className="w-full px-3 py-2.5 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-primary">{success}</p>}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2.5 rounded-lg font-semibold text-sm text-primary-foreground bg-primary hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              {isCreating ? 'Criando...' : 'Criar Usuário'}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-sm">
            <Users className="w-4 h-4" /> Usuários ({users.length})
          </h2>
          <div className="space-y-2">
            {users.map(u => (
              <div key={u.user_id} className="bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-medium">{u.display_name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase">{u.role}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setChangePasswordUserId(changePasswordUserId === u.user_id ? null : u.user_id)}
                      className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Alterar senha"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => handleDeleteUser(u.user_id)}
                        className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                {changePasswordUserId === u.user_id && (
                  <div className="px-3 pb-3 flex gap-2">
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={e => setNewUserPassword(e.target.value)}
                      placeholder="Nova senha"
                      minLength={6}
                      className="flex-1 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      onClick={() => handleChangePassword(u.user_id)}
                      className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-95"
                    >
                      Salvar
                    </button>
                    {passwordMsg && <span className="text-xs self-center text-muted-foreground">{passwordMsg}</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
