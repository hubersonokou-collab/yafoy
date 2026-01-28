import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProfileImageUpload } from '@/components/profile/ProfileImageUpload';
import { Loader2, Save, LogOut, Store } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProviderSettings = () => {
  const { user, loading: authLoading, signOut, isProvider } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    location: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isProvider()) {
      navigate('/');
      return;
    }

    if (user && isProvider()) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
          location: data.location || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          phone: formData.phone || null,
          location: formData.location || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées.',
        className: 'bg-success text-success-foreground',
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder le profil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-secondary flex items-center gap-2">
            <Store className="h-6 w-6" />
            Paramètres Prestataire
          </h1>
          <p className="text-muted-foreground">
            Gérez votre profil professionnel
          </p>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profil professionnel</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              {/* Avatar / Logo */}
              {user && (
                <ProfileImageUpload
                  userId={user.id}
                  currentAvatarUrl={profile?.avatar_url || null}
                  onUploadComplete={(url) => {
                    setProfile((prev: any) => ({ ...prev, avatar_url: url }));
                  }}
                  size="lg"
                />
              )}

              {/* Form fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nom de l'entreprise / Prestataire</Label>
                  <Input
                    id="full_name"
                    placeholder="Votre entreprise"
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+225 XX XX XX XX"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Zone de service</Label>
                <Input
                  id="location"
                  placeholder="Ex: Abidjan et environs"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled />
                <p className="text-xs text-muted-foreground">
                  L'email ne peut pas être modifié
                </p>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Public Profile Link */}
        <Card>
          <CardHeader>
            <CardTitle>Profil public</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Votre profil public est visible par tous les clients.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate(`/provider/${user?.id}`)}
            >
              Voir mon profil public
            </Button>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="text-destructive">Zone de danger</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Vous serez déconnecté de votre compte.
            </p>
            <Button variant="destructive" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProviderSettings;
