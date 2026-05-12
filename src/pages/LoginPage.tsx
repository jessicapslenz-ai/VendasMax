import React from 'react';
import { useAuth } from '../components/AuthContext';
import { Navigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Store, LogIn } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, signIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="animate-pulse text-2xl font-bold text-primary">VendaMax...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex flex-col items-center space-y-2">
          <div className="rounded-2xl bg-primary p-4 text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95">
            <Store className="h-12 w-12" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            VendaMax
          </h1>
          <p className="text-xl text-muted-foreground">
            Sua gestão de vendas simplificada.
          </p>
        </div>

        <div className="rounded-3xl border bg-card p-8 shadow-xl">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-card-foreground">Bem-vindo</h2>
            <p className="text-muted-foreground">
              Faça login para salvar seus lançamentos e acessar sua loja de qualquer lugar.
            </p>
          </div>

          <div className="mt-8">
            <Button
              onClick={() => signIn()}
              size="lg"
              className="w-full space-x-3 rounded-xl py-6 text-lg font-semibold transition-all hover:shadow-lg hover:shadow-primary/10 active:scale-95"
            >
              <LogIn className="h-5 w-5" />
              <span>Entrar com Google</span>
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Ao entrar, você concorda com nossos Termos de Uso.
        </p>
      </div>
    </div>
  );
};
