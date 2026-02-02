import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100),
  phone: z.string().optional(),
  location: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

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

interface EditTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember;
  onSuccess: () => void;
}

export const EditTeamMemberDialog = ({
  open,
  onOpenChange,
  member,
  onSuccess,
}: EditTeamMemberDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: member.profile?.full_name || '',
      phone: member.profile?.phone || '',
      location: member.profile?.location || '',
    },
  });

  const onSubmit = async (data: FormData) => {
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
            action: 'update_profile',
            data: {
              fullName: data.fullName,
              phone: data.phone || null,
              location: data.location || null,
            },
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la mise à jour');
      }

      toast({
        title: 'Profil mis à jour',
        description: 'Les informations du membre ont été modifiées',
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le profil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Modifiez les informations de {member.profile?.full_name || 'ce membre'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom complet</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean Kouamé" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Téléphone</FormLabel>
                  <FormControl>
                    <Input placeholder="+225 07 00 00 00 00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localisation</FormLabel>
                  <FormControl>
                    <Input placeholder="Abidjan, Côte d'Ivoire" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
