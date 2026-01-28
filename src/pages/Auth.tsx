import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, UserCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Numéro de téléphone invalide");

type AuthMode = 'login' | 'signup';
type AuthMethod = 'email' | 'phone';
type UserRoleType = 'client' | 'provider';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithPhone, signUpWithPhone, signInAsGuest, loading } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [method, setMethod] = useState<AuthMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('client');
  const [errors, setErrors] = useState<{ email?: string; phone?: string; password?: string; confirmPassword?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (method === 'email') {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    } else {
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      let result;

      if (mode === 'signup') {
        if (method === 'email') {
          result = await signUp(email, password, selectedRole);
        } else {
          result = await signUpWithPhone(phone, password, selectedRole);
        }

        if (!result.error) {
          toast({
            title: "Compte créé !",
            description: method === 'email' 
              ? "Vérifiez votre email pour confirmer votre compte." 
              : "Votre compte a été créé avec succès.",
            className: "bg-success text-success-foreground",
          });
        }
      } else {
        if (method === 'email') {
          result = await signIn(email, password);
        } else {
          result = await signInWithPhone(phone, password);
        }
      }

      if (result?.error) {
        let errorMessage = "Une erreur est survenue";
        
        if (result.error.message.includes('Invalid login credentials')) {
          errorMessage = "Identifiants incorrects";
        } else if (result.error.message.includes('Email not confirmed')) {
          errorMessage = "Veuillez confirmer votre email avant de vous connecter";
        } else if (result.error.message.includes('User already registered')) {
          errorMessage = "Un compte existe déjà avec cet identifiant";
        } else {
          errorMessage = result.error.message;
        }

        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setIsSubmitting(true);
    try {
      const result = await signInAsGuest();
      if (result.error) {
        toast({
          title: "Erreur",
          description: "Impossible de se connecter en mode invité",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Bienvenue !",
          description: "Vous êtes connecté en tant qu'invité",
        });
        navigate('/');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo et titre */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-secondary">
            YAFOY
          </h1>
          <p className="mt-2 text-muted-foreground">
            Marketplace pour vos cérémonies
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {mode === 'login' ? 'Connexion' : 'Inscription'}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === 'login' 
                ? 'Connectez-vous à votre compte' 
                : 'Créez votre compte YAFOY'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Tabs pour mode connexion/inscription */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Connexion</TabsTrigger>
                <TabsTrigger value="signup">Inscription</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Tabs pour méthode email/téléphone */}
            <Tabs value={method} onValueChange={(v) => setMethod(v as AuthMethod)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Téléphone
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {method === 'email' ? (
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="phone">Numéro de téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={errors.phone ? "border-destructive" : ""}
                    disabled={isSubmitting}
                  />
                  {errors.phone && (
                    <p className="text-sm text-destructive">{errors.phone}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-destructive" : ""}
                      disabled={isSubmitting}
                    />
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Je suis...</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={selectedRole === 'client' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('client')}
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        Client
                      </Button>
                      <Button
                        type="button"
                        variant={selectedRole === 'provider' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('provider')}
                        className="w-full"
                        disabled={isSubmitting}
                      >
                        Prestataire
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {mode === 'login' ? 'Connexion...' : 'Inscription...'}
                  </>
                ) : (
                  mode === 'login' ? 'Se connecter' : "S'inscrire"
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Ou</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
            >
              <UserCircle className="mr-2 h-4 w-4" />
              Continuer en tant qu'invité
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          En continuant, vous acceptez nos{' '}
          <a href="#" className="text-accent hover:underline">
            Conditions d'utilisation
          </a>{' '}
          et notre{' '}
          <a href="#" className="text-accent hover:underline">
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
};

export default Auth;
