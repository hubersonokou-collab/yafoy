import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreHorizontal, Pencil, UserCog, Trash2, Loader2 } from 'lucide-react';
import { EditTeamMemberDialog } from './EditTeamMemberDialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';

interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
    location?: string | null;
  };
}

interface TeamMemberActionsProps {
  member: TeamMember;
  currentUserRole: string;
  currentUserId: string;
  onMemberUpdated: () => void;
}

export const TeamMemberActions = ({
  member,
  currentUserRole,
  currentUserId,
  onMemberUpdated,
}: TeamMemberActionsProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const isSuperAdmin = currentUserRole === 'super_admin';
  const isAdmin = currentUserRole === 'admin';
  const canManage = isSuperAdmin || isAdmin;

  // Check if current user can modify this member
  const canModifyMember = () => {
    if (!canManage) return false;
    if (member.user_id === currentUserId) return false;
    if (member.role === 'super_admin') return false;
    if (!isSuperAdmin && member.role === 'admin') return false;
    return true;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        throw new Error('Session expirée');
      }

      const response = await fetch(
        `https://dvbgytmkysaztbdqosup.supabase.co/functions/v1/manage-team-member`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionData.session.access_token}`,
          },
          body: JSON.stringify({ userId: member.user_id }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la suppression');
      }

      toast({
        title: 'Membre supprimé',
        description: `${member.profile?.full_name || 'Le membre'} a été supprimé de l'équipe`,
      });

      onMemberUpdated();
    } catch (error: any) {
      console.error('Error deleting member:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer le membre',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (!canModifyMember()) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Modifier le profil
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowRoleDialog(true)}>
            <UserCog className="mr-2 h-4 w-4" />
            Changer le rôle
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce membre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le compte de{' '}
              <strong>{member.profile?.full_name || 'ce membre'}</strong> sera
              définitivement supprimé ainsi que son accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Profile Dialog */}
      <EditTeamMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={member}
        onSuccess={onMemberUpdated}
      />

      {/* Change Role Dialog */}
      <ChangeRoleDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        member={member}
        currentUserRole={currentUserRole}
        onSuccess={onMemberUpdated}
      />
    </>
  );
};
