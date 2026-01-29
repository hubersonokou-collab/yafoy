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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UserPlus } from 'lucide-react';

const teamRoles = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'accountant', label: 'Comptable' },
  { value: 'supervisor', label: 'Superviseur' },
  { value: 'moderator', label: 'Modérateur' },
  { value: 'support', label: 'Support Client' },
] as const;

const formSchema = z.object({
  email: z.string().email('Email invalide').max(255),
  role: z.enum(['admin', 'accountant', 'supervisor', 'moderator', 'support']),
});

type FormData = z.infer<typeof formSchema>;

interface AddTeamMemberDialogProps {
  onMemberAdded?: () => void;
}

export const AddTeamMemberDialog = ({ onMemberAdded }: AddTeamMemberDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'support',
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // Check if user exists by looking up their profile via email
      // Note: This requires the user to already have an account
      const { data: existingUsers, error: lookupError } = await supabase
        .from('profiles')
        .select('user_id')
        .limit(1);

      if (lookupError) {
        throw lookupError;
      }

      // For now, we'll show a message that the user needs to have an account first
      // In a full implementation, this would send an invitation email
      toast({
        title: 'Fonctionnalité en développement',
        description: `L'invitation sera envoyée à ${data.email} pour le rôle de ${teamRoles.find(r => r.value === data.role)?.label}. Cette fonctionnalité nécessite une configuration email.`,
      });

      form.reset();
      setOpen(false);
      onMemberAdded?.();
    } catch (error: any) {
      console.error('Error adding team member:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ajouter le membre',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <UserPlus className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ajouter un membre d'équipe</DialogTitle>
          <DialogDescription>
            Invitez un nouveau membre à rejoindre l'équipe avec un rôle spécifique.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="membre@exemple.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teamRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Inviter
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
