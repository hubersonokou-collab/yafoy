import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, UserCircle, Eye, EyeOff, Loader2, LogIn, UserPlus, Lock, User } from 'lucide-react';
import { z } from 'zod';

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255).optional().or(z.literal(''));
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Numéro de téléphone invalide");

type AuthMode = 'login' | 'signup';
type UserRoleType = 'client' | 'provider';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithPhone, signUpWithPhone, signInAsGuest, loading } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Phone is required for signup, optional for login
    if (mode === 'signup') {
      const phoneResult = phoneSchema.safeParse(phone);
      if (!phoneResult.success) {
        newErrors.phone = phoneResult.error.errors[0].message;
      }
    } else {
      // For login, either phone or email is required
      if (!phone && !email) {
        newErrors.phone = "Numéro de téléphone ou email requis";
      } else if (phone) {
        const phoneResult = phoneSchema.safeParse(phone);
        if (!phoneResult.success) {
          newErrors.phone = phoneResult.error.errors[0].message;
        }
      } else if (email) {
        const emailResult = z.string().email("Email invalide").safeParse(email);
        if (!emailResult.success) {
          newErrors.email = emailResult.error.errors[0].message;
        }
      }
    }

    // Email is optional for signup
    if (email && email.trim() !== '') {
      const emailResult = z.string().email("Email invalide").safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
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
        // For signup, always use phone (required)
        result = await signUpWithPhone(phone, password, selectedRole);

        if (!result.error) {
          toast({
            title: "Compte créé !",
            description: "Votre compte a été créé avec succès.",
            className: "bg-success text-success-foreground",
          });
        }
      } else {
        // For login, use phone if provided, otherwise email
        if (phone) {
          result = await signInWithPhone(phone, password);
        } else {
          result = await signIn(email, password);
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
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo et titre */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <span className="text-3xl font-bold text-primary">Y</span>
          </div>
          <h1 className="text-2xl font-bold text-secondary">
            YAFOY
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            La marketplace de location pour vos cérémonies
          </p>
        </div>

        <Card className="border-border shadow-lg">
          <CardContent className="pt-6">
            {/* Tabs pour mode connexion/inscription */}
            <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 h-12">
                <TabsTrigger value="login" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <LogIn className="h-4 w-4" />
                  Connexion
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <UserPlus className="h-4 w-4" />
                  Inscription
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom complet - only for signup */}
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    Nom complet (optionnel)
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12"
                  />
                </div>
              )}

              {/* Numéro de téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Numéro de téléphone {mode === 'signup' ? '' : '(ou email)'}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+225 XX XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`h-12 ${errors.phone ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email {mode === 'signup' ? '(optionnel)' : ''}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 ${errors.email ? "border-destructive" : ""}`}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Mot de passe */}
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pr-10 ${errors.password ? "border-destructive" : ""}`}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Confirmer mot de passe - only for signup */}
              {mode === 'signup' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-muted-foreground">
                      <Lock className="h-4 w-4" />
                      Confirmer le mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`h-12 pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Role selection */}
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Je suis...</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        type="button"
                        variant={selectedRole === 'client' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('client')}
                        className="w-full h-12"
                        disabled={isSubmitting}
                      >
                        Client
                      </Button>
                      <Button
                        type="button"
                        variant={selectedRole === 'provider' ? 'default' : 'outline'}
                        onClick={() => setSelectedRole('provider')}
                        className="w-full h-12"
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
                className="w-full h-12 text-base font-medium" 
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

          <CardFooter className="flex flex-col gap-4 pb-6">
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-primary">OU</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Continuer en tant qu'invité
            </Button>
          </CardFooter>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          En continuant, vous acceptez nos{' '}
          <a href="#" className="text-primary hover:underline">
            conditions d'utilisation
          </a>{' '}
          et notre{' '}
          <a href="#" className="text-primary hover:underline">
            politique de confidentialité
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default Auth;
