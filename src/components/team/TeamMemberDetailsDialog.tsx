import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield,
  Calculator,
  Eye,
  Flag,
  HeadphonesIcon,
  Users,
  KeyRound,
  Pencil,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
    location?: string | null;
  };
}

interface TeamMemberDetailsDialogProps {
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserRole: string;
  onMemberUpdated: () => void;
}

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
  admin: { label: 'Administrateur', icon: Shield, color: 'bg-orange-100 text-orange-700' },
  accountant: { label: 'Comptable', icon: Calculator, color: 'bg-green-100 text-green-700' },
  supervisor: { label: 'Superviseur', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  moderator: { label: 'Modérateur', icon: Flag, color: 'bg-purple-100 text-purple-700' },
  support: { label: 'Support Client', icon: HeadphonesIcon, color: 'bg-cyan-100 text-cyan-700' },
};

export const TeamMemberDetailsDialog = ({
  member,
  open,
  onOpenChange,
  currentUserRole,
  onMemberUpdated,
}: TeamMemberDetailsDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  useEffect(() => {
    if (open && member) {
      fetchMemberEmail();
    } else {
      setEmail(null);
    }
  }, [open, member]);

  const fetchMemberEmail = async () => {
    if (!member) return;
    
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://dvbgytmkysaztbdqosup.supabase.co/functions/v1/manage-team-member?userId=${member.user_id}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (response.ok && data.email) {
        setEmail(data.email);
      }
    } catch (error) {
      console.error('Error fetching member email:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) return;
    
    setResettingPassword(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      
      const response = await fetch(
        'https://dvbgytmkysaztbdqosup.supabase.co/functions/v1/manage-team-member',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'reset_password',
            userId: member?.user_id,
          }),
        }
      );

      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Email envoyé',
          description: 'Un email de réinitialisation a été envoyé au membre.',
        });
      } else {
        throw new Error(data.error || 'Erreur lors de la réinitialisation');
      }
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'envoyer l\'email de réinitialisation.',
        variant: 'destructive',
      });
    } finally {
      setResettingPassword(false);
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!member) return null;

  const config = roleConfig[member.role] || {
    label: member.role,
    icon: Users,
    color: 'bg-gray-100 text-gray-700',
  };
  const RoleIcon = config.icon;
  const isSuperAdmin = currentUserRole === 'super_admin';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Détails du membre
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header with Avatar */}
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg">
                  {getInitials(member.profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-semibold">
                  {member.profile?.full_name || 'Nom non défini'}
                </h3>
                <Badge className={`gap-1 ${config.color}`}>
                  <RoleIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Account Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Informations du compte
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : email ? (
                    <span>{email}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Non disponible</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Ajouté le {new Date(member.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground italic">
                    Mot de passe sécurisé (non visible)
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Profile Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Profil
              </h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {member.profile?.phone ? (
                    <span>{member.profile.phone}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Non renseigné</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {member.profile?.location ? (
                    <span>{member.profile.location}</span>
                  ) : (
                    <span className="text-muted-foreground italic">Non renseigné</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditDialog(true)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Modifier
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowRoleDialog(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Changer le rôle
              </Button>
            </div>
            
            {isSuperAdmin && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={handleResetPassword}
                disabled={resettingPassword || !email}
              >
                {resettingPassword ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Réinitialiser le mot de passe
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <EditTeamMemberDialog
        member={member}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={() => {
          onMemberUpdated();
          setShowEditDialog(false);
        }}
      />

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        member={member}
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        currentUserRole={currentUserRole}
        onSuccess={() => {
          onMemberUpdated();
          setShowRoleDialog(false);
        }}
      />
    </>
  );
};
