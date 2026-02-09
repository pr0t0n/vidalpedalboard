import { useState } from 'react';
import { VidalLogo } from '@/components/VidalLogo';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<{ error: any }>;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const { error: loginError } = await onLogin(email, password);
    if (loginError) {
      setError('Email ou senha incorretos.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex justify-center">
          <VidalLogo />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl font-semibold text-sm text-primary-foreground transition-all active:scale-95"
            style={{
              background: 'linear-gradient(180deg, hsl(142, 60%, 40%) 0%, hsl(142, 65%, 30%) 100%)',
            }}
          >
            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>

        <p className="text-center text-[10px] text-muted-foreground/50 font-mono">
          ACESSO RESTRITO • CONTATE O ADMIN
        </p>
      </div>
    </div>
  );
}
