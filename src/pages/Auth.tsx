import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Loader2, 
  LogIn, 
  UserPlus, 
  Lock, 
  User,
  Sparkles,
  Shield,
  Mic,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { z } from 'zod';
import { VoiceAssistant } from '@/components/voice';
import logoYafoy from '@/assets/logo-yafoy.png';

// Validation schemas
const emailSchema = z.string().email("Email invalide").max(255);
const passwordSchema = z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").max(100);
const phoneSchema = z.string().regex(/^\+?[1-9]\d{7,14}$/, "Numéro de téléphone invalide");

type AuthMode = 'login' | 'signup';
type UserRoleType = 'client' | 'provider';
type SignupMethod = 'phone' | 'email';

const Auth = () => {
  const navigate = useNavigate();
  const { user, signUp, signIn, signInWithPhone, signUpWithPhone, signInAsGuest, loading, userRole, isAdmin, isSuperAdmin, isProvider } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<AuthMode>('login');
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('phone');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRoleType>('client');
  const [errors, setErrors] = useState<{ username?: string; email?: string; phone?: string; password?: string; confirmPassword?: string }>({});

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      if (user.is_anonymous) {
        navigate('/client');
        return;
      }
      
      if (userRole === null) {
        return;
      }
      
      // Redirect based on role
      switch (userRole) {
        case 'super_admin':
        case 'admin':
          navigate('/admin');
          break;
        case 'provider':
          navigate('/provider');
          break;
        case 'accountant':
          navigate('/team/accountant');
          break;
        case 'supervisor':
          navigate('/team/supervisor');
          break;
        case 'moderator':
          navigate('/team/moderator');
          break;
        case 'support':
          navigate('/team/support');
          break;
        default:
          navigate('/client');
      }
    }
  }, [user, loading, userRole, navigate]);

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isPhone = (value: string) => /^\+?[1-9]\d{7,14}$/.test(value);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (mode === 'login') {
      if (!username.trim()) {
        newErrors.username = "Email ou numéro de téléphone requis";
      } else if (!isEmail(username) && !isPhone(username)) {
        newErrors.username = "Format invalide (email ou numéro de téléphone)";
      }
    } else {
      if (signupMethod === 'phone') {
        const phoneResult = phoneSchema.safeParse(phone);
        if (!phoneResult.success) {
          newErrors.phone = phoneResult.error.errors[0].message;
        }
      } else {
        const emailResult = emailSchema.safeParse(email);
        if (!emailResult.success) {
          newErrors.email = emailResult.error.errors[0].message;
        }
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
        if (signupMethod === 'phone') {
          result = await signUpWithPhone(phone, password, selectedRole);
        } else {
          result = await signUp(email, password, selectedRole);
        }

        if (!result.error) {
          toast({
            title: "🎉 Bienvenue dans la famille YAFOY !",
            description: signupMethod === 'email' 
              ? "Vérifiez votre email pour confirmer votre compte."
              : "Votre compte a été créé avec succès. Explorez notre catalogue !",
            className: "bg-success text-success-foreground",
          });
        }
      } else {
        if (isEmail(username)) {
          result = await signIn(username, password);
        } else {
          result = await signInWithPhone(username, password);
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
        navigate('/client');
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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground animate-pulse">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left side - Branding & Features (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-20">
          <div className="max-w-lg">
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-3 group mb-12">
              <img src={logoYafoy} alt="YAFOY" className="h-16 w-auto" />
            </Link>

            {/* Headline */}
            <h1 className="text-4xl xl:text-5xl font-bold text-secondary leading-tight mb-6">
              Organisez vos <span className="text-primary">cérémonies</span> en toute simplicité
            </h1>
            
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Découvrez la première plateforme de location d'équipements pour événements en Côte d'Ivoire. 
              Mariages, baptêmes, anniversaires — tout ce dont vous avez besoin, à portée de main.
            </p>

            {/* Features */}
            <div className="space-y-5">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary mb-1">Commande vocale</h3>
                  <p className="text-sm text-muted-foreground">
                    Naviguez et réservez avec votre voix. "Chercher des tentes pour un mariage"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary mb-1">Prestataires vérifiés</h3>
                  <p className="text-sm text-muted-foreground">
                    Tous nos prestataires sont évalués et certifiés pour votre tranquillité
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-colors">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-secondary mb-1">+500 équipements</h3>
                  <p className="text-sm text-muted-foreground">
                    Mobilier, sono, décoration, traiteur — tout pour réussir votre événement
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth Form */}
        <div className="flex w-full lg:w-1/2 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md animate-fade-in">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link to="/" className="inline-flex items-center justify-center gap-3 group">
                <img src={logoYafoy} alt="YAFOY" className="h-14 w-auto" />
              </Link>
              <p className="mt-3 text-sm text-muted-foreground">
                La marketplace de location pour vos cérémonies
              </p>
            </div>

            <Card className="border-border/50 shadow-2xl shadow-black/5 backdrop-blur-sm bg-card/95">
              <CardContent className="p-8">
                {/* Welcome Text */}
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-secondary mb-2">
                    {mode === 'login' ? 'Bon retour !' : 'Créer un compte'}
                  </h2>
                  <p className="text-muted-foreground">
                    {mode === 'login' 
                      ? 'Connectez-vous pour accéder à votre espace' 
                      : 'Rejoignez des milliers d\'utilisateurs satisfaits'}
                  </p>
                </div>

                {/* Tabs */}
                <Tabs value={mode} onValueChange={(v) => setMode(v as AuthMode)} className="mb-6">
                  <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/50">
                    <TabsTrigger 
                      value="login" 
                      className="flex items-center gap-2 h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
                    >
                      <LogIn className="h-4 w-4" />
                      Connexion
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="flex items-center gap-2 h-12 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium"
                    >
                      <UserPlus className="h-4 w-4" />
                      Inscription
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Login: Username field */}
                  {mode === 'login' && (
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-sm font-medium text-secondary">
                        Email ou téléphone
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="email@exemple.com ou +225..."
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`h-14 pl-12 text-base bg-muted/30 border-border/50 focus:border-primary focus:ring-primary/20 ${errors.username ? "border-destructive" : ""}`}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.username && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.username}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Signup: Full name */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium text-secondary">
                        Nom complet <span className="text-muted-foreground">(optionnel)</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Jean Kouamé"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={isSubmitting}
                          className="h-14 pl-12 text-base bg-muted/30 border-border/50 focus:border-primary"
                        />
                      </div>
                    </div>
                  )}

                  {/* Signup: Method selection */}
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-secondary">S'inscrire avec</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          type="button"
                          variant={signupMethod === 'phone' ? 'default' : 'outline'}
                          onClick={() => setSignupMethod('phone')}
                          className={`h-14 text-base gap-2 ${signupMethod === 'phone' ? 'shadow-lg shadow-primary/25' : 'hover:border-primary/50'}`}
                          disabled={isSubmitting}
                        >
                          <Phone className="h-5 w-5" />
                          Téléphone
                        </Button>
                        <Button
                          type="button"
                          variant={signupMethod === 'email' ? 'default' : 'outline'}
                          onClick={() => setSignupMethod('email')}
                          className={`h-14 text-base gap-2 ${signupMethod === 'email' ? 'shadow-lg shadow-primary/25' : 'hover:border-primary/50'}`}
                          disabled={isSubmitting}
                        >
                          <Mail className="h-5 w-5" />
                          Email
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Signup: Phone input */}
                  {mode === 'signup' && signupMethod === 'phone' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-secondary">
                        Numéro de téléphone
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+225 07 XX XX XX XX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`h-14 pl-12 text-base bg-muted/30 border-border/50 focus:border-primary ${errors.phone ? "border-destructive" : ""}`}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.phone}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Signup: Email input */}
                  {mode === 'signup' && signupMethod === 'email' && (
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium text-secondary">
                        Adresse email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@exemple.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`h-14 pl-12 text-base bg-muted/30 border-border/50 focus:border-primary ${errors.email ? "border-destructive" : ""}`}
                          disabled={isSubmitting}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-destructive" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-secondary">
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`h-14 pl-12 pr-12 text-base bg-muted/30 border-border/50 focus:border-primary ${errors.password ? "border-destructive" : ""}`}
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-destructive" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password - signup only */}
                  {mode === 'signup' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium text-secondary">
                          Confirmer le mot de passe
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`h-14 pl-12 pr-12 text-base bg-muted/30 border-border/50 focus:border-primary ${errors.confirmPassword ? "border-destructive" : ""}`}
                            disabled={isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                        {errors.confirmPassword && (
                          <p className="text-sm text-destructive flex items-center gap-1">
                            <span className="h-1 w-1 rounded-full bg-destructive" />
                            {errors.confirmPassword}
                          </p>
                        )}
                      </div>

                      {/* Role selection */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-secondary">Je suis...</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedRole('client')}
                            disabled={isSubmitting}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                              selectedRole === 'client'
                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                : 'border-border/50 hover:border-primary/30'
                            }`}
                          >
                            {selectedRole === 'client' && (
                              <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                            )}
                            <span className="text-2xl mb-2 block">🎉</span>
                            <span className="font-semibold text-secondary">Client</span>
                            <p className="text-xs text-muted-foreground mt-1">Je recherche des équipements</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedRole('provider')}
                            disabled={isSubmitting}
                            className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                              selectedRole === 'provider'
                                ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10'
                                : 'border-border/50 hover:border-primary/30'
                            }`}
                          >
                            {selectedRole === 'provider' && (
                              <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />
                            )}
                            <span className="text-2xl mb-2 block">🏪</span>
                            <span className="font-semibold text-secondary">Prestataire</span>
                            <p className="text-xs text-muted-foreground mt-1">Je propose mes services</p>
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Chargement...
                      </>
                    ) : mode === 'login' ? (
                      <>
                        Se connecter
                        <ArrowRight className="h-5 w-5" />
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-card px-4 text-muted-foreground">ou</span>
                  </div>
                </div>

                {/* Guest Login */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGuestLogin}
                  disabled={isSubmitting}
                  className="w-full h-12 gap-2 border-border/50 hover:border-primary/30 hover:bg-primary/5"
                >
                  <User className="h-5 w-5" />
                  Continuer en tant qu'invité
                </Button>

                {/* Footer links */}
                <div className="mt-6 text-center space-y-2">
                  <Link 
                    to="/comment-ca-marche" 
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    Comment ça marche ?
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    En continuant, vous acceptez nos conditions d'utilisation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Voice Assistant */}
      <VoiceAssistant />
    </div>
  );
};

export default Auth;
