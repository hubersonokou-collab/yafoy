import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, Calculator, Eye, Flag, HeadphonesIcon } from 'lucide-react';

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrateur', icon: Shield, color: 'bg-orange-100 text-orange-700' },
  accountant: { label: 'Comptable', icon: Calculator, color: 'bg-green-100 text-green-700' },
  supervisor: { label: 'Superviseur', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  moderator: { label: 'Modérateur', icon: Flag, color: 'bg-purple-100 text-purple-700' },
  support: { label: 'Support Client', icon: HeadphonesIcon, color: 'bg-cyan-100 text-cyan-700' },
};

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ChangeRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  currentUserRole: string;
  onSuccess: () => void;
}

export const ChangeRoleDialog = ({
  open,
  onOpenChange,
  member,
  currentUserRole,
  onSuccess,
}: ChangeRoleDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(member.role);
  const { toast } = useToast();

  const isSuperAdmin = currentUserRole === 'super_admin';

  // Available roles based on current user's permissions
  const availableRoles = isSuperAdmin
    ? ['admin', 'accountant', 'supervisor', 'moderator', 'support']
    : ['accountant', 'supervisor', 'moderator', 'support'];

  const handleSubmit = async () => {
    if (selectedRole === member.role) {
      onOpenChange(false);
      return;
    }

    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Session expirée');
      }

      const response = await fetch(
        `https://dvbgytmkysaztbdqosup.supabase.co/functions/v1/manage-team-member`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({
            userId: member.user_id,
            action: 'update_role',
            data: { role: selectedRole },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      toast({
        title: 'Rôle mis à jour',
        description: `${member.profile?.full_name || 'Le membre'} est maintenant ${roleConfig[selectedRole]?.label || selectedRole}`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de modifier le rôle',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const CurrentRoleIcon = roleConfig[member.role]?.icon || Shield;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Changer le rôle</DialogTitle>
          <DialogDescription>
            Modifiez le rôle de {member.profile?.full_name || 'ce membre'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current role display */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">Rôle actuel</Label>
            <Badge className={`gap-1 ${roleConfig[member.role]?.color || 'bg-gray-100 text-gray-700'}`}>
              <CurrentRoleIcon className="h-3 w-3" />
              {roleConfig[member.role]?.label || member.role}
            </Badge>
          </div>

          {/* New role selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Nouveau rôle</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => {
                  const config = roleConfig[role];
                  const Icon = config?.icon || Shield;
                  return (
                    <SelectItem key={role} value={role}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        {config?.label || role}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || selectedRole === member.role}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
