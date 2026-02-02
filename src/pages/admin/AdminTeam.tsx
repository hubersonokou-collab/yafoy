import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { AddTeamMemberDialog, TeamMemberActions, TeamMemberDetailsDialog } from '@/components/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Shield, Calculator, Eye, Flag, HeadphonesIcon } from 'lucide-react';

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

const roleConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  super_admin: { label: 'Super Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
  admin: { label: 'Administrateur', icon: Shield, color: 'bg-orange-100 text-orange-700' },
  accountant: { label: 'Comptable', icon: Calculator, color: 'bg-green-100 text-green-700' },
  supervisor: { label: 'Superviseur', icon: Eye, color: 'bg-blue-100 text-blue-700' },
  moderator: { label: 'Modérateur', icon: Flag, color: 'bg-purple-100 text-purple-700' },
  support: { label: 'Support Client', icon: HeadphonesIcon, color: 'bg-cyan-100 text-cyan-700' },
};

const AdminTeam = () => {
  const { user, loading: authLoading, isSuperAdmin, isAdmin, userRole } = useAuth();
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isSuperAdmin() && !isAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isSuperAdmin() || isAdmin())) {
      fetchTeamMembers();
    }
  }, [user, authLoading, navigate]);

  const fetchTeamMembers = async () => {
    try {
      const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*')
        .in('role', ['super_admin', 'admin', 'accountant', 'supervisor', 'moderator', 'support'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each team member
      const membersWithProfiles = await Promise.all(
        (roles || []).map(async (role) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, phone, location')
            .eq('user_id', role.user_id)
            .single();

          return {
            ...role,
            profile: profile || { full_name: null, avatar_url: null, phone: null, location: null },
          };
        })
      );

      setTeamMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
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

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-secondary">Gestion de l'équipe</h1>
            <p className="text-muted-foreground">
              Gérez les membres de votre équipe et leurs rôles
            </p>
          </div>
          <AddTeamMemberDialog onMemberAdded={fetchTeamMembers} />
        </div>

        {/* Team Stats */}
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Object.entries(roleConfig).map(([role, config]) => {
            const count = teamMembers.filter((m) => m.role === role).length;
            const Icon = config.icon;
            return (
              <Card key={role}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground">{config.label}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Membres de l'équipe ({teamMembers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Users className="mb-2 h-12 w-12" />
                <p>Aucun membre d'équipe pour le moment</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => {
                  const config = roleConfig[member.role] || {
                    label: member.role,
                    icon: Users,
                    color: 'bg-gray-100 text-gray-700',
                  };
                  const Icon = config.icon;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => {
                        setSelectedMember(member);
                        setShowDetailsDialog(true);
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={member.profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {getInitials(member.profile?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {member.profile?.full_name || 'Nom non défini'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ajouté le {new Date(member.created_at).toLocaleDateString('fr-FR')}
                          </p>
                          {member.profile?.phone && (
                            <p className="text-xs text-muted-foreground">
                              {member.profile.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={`gap-1 ${config.color}`}>
                          <Icon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        <div onClick={(e) => e.stopPropagation()}>
                          <TeamMemberActions
                            member={member}
                            currentUserRole={userRole || ''}
                            currentUserId={user?.id || ''}
                            onMemberUpdated={fetchTeamMembers}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <TeamMemberDetailsDialog
          member={selectedMember}
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          currentUserRole={userRole || ''}
          onMemberUpdated={() => {
            fetchTeamMembers();
            setShowDetailsDialog(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminTeam;
