import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Users, Shield, Calculator, Eye, Flag, Headphones, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type TeamRole = 'admin' | 'accountant' | 'supervisor' | 'moderator' | 'support';

const roleLabels: Record<TeamRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrateur', icon: Shield, color: 'bg-red-100 text-red-700' },
  accountant: { label: 'Comptable', icon: Calculator, color: 'bg-emerald-100 text-emerald-700' },
  supervisor: { label: 'Superviseur', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  moderator: { label: 'Modérateur', icon: Flag, color: 'bg-purple-100 text-purple-700' },
  support: { label: 'Support', icon: Headphones, color: 'bg-amber-100 text-amber-700' },
};

const AdminTeam = () => {
  const { user, loading, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<TeamRole>('support');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
    if (!loading && user && !isAdmin() && !isSuperAdmin()) navigate('/');
  }, [user, loading, navigate, isAdmin, isSuperAdmin]);

  const fetchTeamMembers = async () => {
    try {
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'accountant', 'supervisor', 'moderator', 'support']);

      if (roles && roles.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, phone')
          .in('user_id', roles.map(r => r.user_id));

        const members = roles.map(r => ({
          ...r,
          profile: profiles?.find(p => p.user_id === r.user_id),
        }));
        setTeamMembers(members);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && (isAdmin() || isSuperAdmin())) fetchTeamMembers();
  }, [user, isAdmin, isSuperAdmin]);

  const handleAddMember = async () => {
    toast({
      title: 'Information',
      description: 'Pour ajouter un membre, créez d\'abord son compte via la page d\'inscription, puis modifiez son rôle depuis la base de données.',
    });
    setIsDialogOpen(false);
  };

  if (loading || isLoading) {
    return <DashboardLayout><div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary">Équipe</h1>
            <p className="text-muted-foreground">Gérer les membres de l'équipe et leurs rôles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4 mr-2" />Ajouter un membre</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Ajouter un membre</DialogTitle></DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="email@exemple.com" value={newMemberEmail} onChange={(e) => setNewMemberEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Rôle</Label>
                  <Select value={newMemberRole} onValueChange={(v) => setNewMemberRole(v as TeamRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleLabels).map(([key, { label }]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleAddMember} disabled={isSubmitting}>{isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Membres de l'équipe ({teamMembers.length})</CardTitle></CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun membre d'équipe</p>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => {
                  const roleInfo = roleLabels[member.role as TeamRole];
                  const Icon = roleInfo?.icon || Users;
                  return (
                    <div key={member.user_id} className="flex items-center justify-between p-4 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${roleInfo?.color || 'bg-muted'}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{member.profile?.full_name || 'Non renseigné'}</p>
                          <Badge className={roleInfo?.color}>{roleInfo?.label || member.role}</Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminTeam;
