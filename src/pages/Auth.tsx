import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-comunica.png";
import { Loader2 } from "lucide-react";

interface InvitationData {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Invite flow states
  const [inviteLoading, setInviteLoading] = useState(!!inviteToken);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check for existing session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user && !inviteToken) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !inviteToken) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, inviteToken]);

  // Validate invite token
  useEffect(() => {
    if (!inviteToken) return;

    const validateInvite = async () => {
      setInviteLoading(true);
      try {
        const { data, error } = await supabase
          .from("invitations")
          .select("id, email, role, status, expires_at")
          .eq("token", inviteToken)
          .single();

        if (error || !data) {
          setInviteError("Convite não encontrado ou inválido.");
          return;
        }

        if (data.status !== "pending") {
          setInviteError("Este convite já foi utilizado.");
          return;
        }

        const expiresAt = new Date(data.expires_at);
        if (expiresAt < new Date()) {
          setInviteError("Este convite expirou.");
          return;
        }

        setInvitation(data);
        setEmail(data.email);
      } catch (err) {
        setInviteError("Erro ao validar convite.");
      } finally {
        setInviteLoading(false);
      }
    };

    validateInvite();
  }, [inviteToken]);

  const handleInviteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) return;

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Erro",
        description: "A senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create the user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name || invitation.email.split("@")[0],
          },
        },
      });

      if (signUpError) {
        toast({
          title: "Erro ao criar conta",
          description: signUpError.message,
          variant: "destructive",
        });
        return;
      }

      // Update invitation status
      await supabase
        .from("invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);

      toast({
        title: "Conta criada com sucesso!",
        description: "Você está sendo conectado...",
      });

      // The onAuthStateChange will handle the redirect
      setTimeout(() => {
        navigate("/");
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Erro ao entrar",
              description: "E-mail ou senha incorretos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao entrar",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
            },
          },
        });

        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Erro ao cadastrar",
              description: "Este e-mail já está cadastrado",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao cadastrar",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Conta criada!",
            description: "Você foi conectado automaticamente.",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Loading state for invite validation
  if (inviteLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Validando convite...</p>
        </div>
      </div>
    );
  }

  // Error state for invite
  if (inviteToken && inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-6 text-center">
          <img src={logo} alt="Comunica.in" className="h-10 mx-auto" />
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-destructive">Convite Inválido</h1>
            <p className="text-muted-foreground">{inviteError}</p>
          </div>
          <Button onClick={() => navigate("/auth")} variant="outline">
            Ir para Login
          </Button>
        </div>
      </div>
    );
  }

  // Invite signup form
  if (invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md p-8 space-y-6">
          <div className="flex flex-col items-center space-y-2">
            <img src={logo} alt="Comunica.in" className="h-10" />
          </div>

          <div className="text-center space-y-1">
            <h1 className="text-xl font-semibold">Bem-vindo ao Compass!</h1>
            <p className="text-sm text-muted-foreground">
              Você foi convidado como <span className="font-medium">{invitation.role}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Crie sua senha para acessar a plataforma
            </p>
          </div>

          <form onSubmit={handleInviteSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">E-mail</Label>
              <Input
                id="invite-email"
                type="email"
                value={invitation.email}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-name">Seu nome</Label>
              <Input
                id="invite-name"
                type="text"
                placeholder="Como você quer ser chamado"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-password">Senha</Label>
              <Input
                id="invite-password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-confirm-password">Confirmar senha</Label>
              <Input
                id="invite-confirm-password"
                type="password"
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar conta e entrar"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Regular login/signup form
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="flex flex-col items-center space-y-2">
          <img src={logo} alt="Comunica.in" className="h-10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." : isLogin ? "Entrar" : "Criar conta"}
          </Button>
        </form>

      </div>
    </div>
  );
}
