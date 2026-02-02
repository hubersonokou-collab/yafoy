import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  User,
  AlertCircle,
  UserPlus,
  LayoutDashboard,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  category: string | null;
  created_at: string;
  updated_at: string;
  messages?: Message[];
  userProfile?: {
    full_name: string | null;
  };
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
}

const SupportDashboard = () => {
  const { user, loading: authLoading, isSupport, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    inProgress: 0,
    resolved: 0,
  });
  
  // Tab management with URL params
  const currentTab = searchParams.get('tab') || 'dashboard';
  const setCurrentTab = (tab: string) => {
    setSearchParams({ tab });
  };
  
  // Account creation state
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    fullName: '',
    role: 'client' as 'client' | 'provider',
  });

  // Pagination
  const ticketsPagination = usePagination(tickets, { itemsPerPage: 10 });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (!authLoading && user && !isSupport() && !isAdmin() && !isSuperAdmin()) {
      navigate('/');
      return;
    }

    if (user && (isSupport() || isAdmin() || isSuperAdmin())) {
      fetchTickets();
    }
  }, [user, authLoading, navigate]);

  const fetchTickets = async () => {
    try {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Fetch user profiles and messages for each ticket
      const ticketsWithDetails = await Promise.all(
        (ticketsData || []).map(async (ticket) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', ticket.user_id)
            .single();

          const { data: messages } = await supabase
            .from('support_messages')
            .select('*')
            .eq('ticket_id', ticket.id)
            .order('created_at', { ascending: true });

          return {
            ...ticket,
            userProfile: profile || { full_name: null },
            messages: messages || [],
          };
        })
      );

      setTickets(ticketsWithDetails);

      // Calculate stats
      setStats({
        total: ticketsWithDetails.length,
        open: ticketsWithDetails.filter((t) => t.status === 'open').length,
        inProgress: ticketsWithDetails.filter((t) => t.status === 'in_progress').length,
        resolved: ticketsWithDetails.filter((t) => t.status === 'resolved').length,
      });
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          status: newStatus,
          assigned_to: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) throw error;
      fetchTickets();
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !newMessage.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user?.id,
        message: newMessage.trim(),
        is_internal: false,
      });

      if (error) throw error;

      // Update ticket status to in_progress if it was open
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', assigned_to: user?.id })
          .eq('id', selectedTicket.id);
      }

      setNewMessage('');
      fetchTickets();
      
      // Refresh selected ticket
      const updatedTicket = tickets.find((t) => t.id === selectedTicket.id);
      if (updatedTicket) {
        setSelectedTicket(updatedTicket);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      open: { label: 'Ouvert', className: 'bg-primary/20 text-primary' },
      in_progress: { label: 'En cours', className: 'bg-warning/20 text-warning-foreground' },
      resolved: { label: 'Résolu', className: 'bg-success/20 text-success' },
      closed: { label: 'Fermé', className: 'bg-muted text-muted-foreground' },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-muted text-muted-foreground' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string }> = {
      low: { className: 'bg-muted text-muted-foreground' },
      medium: { className: 'bg-primary/20 text-primary' },
      high: { className: 'bg-warning/20 text-warning-foreground' },
      urgent: { className: 'bg-destructive/20 text-destructive' },
    };
    return <Badge className={config[priority]?.className || 'bg-muted text-muted-foreground'}>{priority}</Badge>;
  };

  const handleCreateAccount = async () => {
    if (!newUserData.email || !newUserData.password || !newUserData.fullName) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive',
      });
      return;
    }

    if (newUserData.password.length < 6) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe doit contenir au moins 6 caractères',
        variant: 'destructive',
      });
      return;
    }

    setCreatingAccount(true);
    try {
      // Create user via Supabase auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUserData.email,
        password: newUserData.password,
        options: {
          data: { full_name: newUserData.fullName },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Insert user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: authData.user.id, role: newUserData.role });

        if (roleError) throw roleError;

        toast({
          title: 'Compte créé',
          description: `Le compte ${newUserData.role === 'client' ? 'client' : 'prestataire'} a été créé avec succès`,
        });

        setNewUserData({ email: '', password: '', fullName: '', role: 'client' });
        setShowCreateAccount(false);
      }
    } catch (error: any) {
      console.error('Error creating account:', error);
      let errorMessage = 'Une erreur est survenue lors de la création du compte';
      if (error.message?.includes('already registered')) {
        errorMessage = 'Un compte existe déjà avec cet email';
      }
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setCreatingAccount(false);
    }
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
            <h1 className="text-2xl font-bold text-secondary">Tableau de bord Support</h1>
            <p className="text-muted-foreground">
              Gérez les tickets de support et assistez les utilisateurs
            </p>
          </div>
          <Dialog open={showCreateAccount} onOpenChange={setShowCreateAccount}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Créer un compte
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un compte utilisateur</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    placeholder="jean@exemple.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type de compte</Label>
                  <Select
                    value={newUserData.role}
                    onValueChange={(value: 'client' | 'provider') =>
                      setNewUserData({ ...newUserData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="provider">Prestataire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateAccount}
                  disabled={creatingAccount}
                >
                  {creatingAccount ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Créer le compte
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards - clickable */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('tickets')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/20 text-secondary">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('tickets')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('tickets')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20 text-warning-foreground">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setCurrentTab('tickets')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20 text-success">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Tableau de bord
            </TabsTrigger>
            <TabsTrigger value="tickets" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Tickets ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="create-account" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Créer un compte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Tickets récents</CardTitle>
                </CardHeader>
                <CardContent>
                  {tickets.slice(0, 5).map((ticket) => (
                    <div key={ticket.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {ticket.userProfile?.full_name || 'Anonyme'} - {format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      {getStatusBadge(ticket.status)}
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => setCurrentTab('tickets')}
                  >
                    Voir tous les tickets
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Résumé</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <span className="text-muted-foreground">Total tickets</span>
                    <span className="font-bold text-lg">{stats.total}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg">
                    <span className="text-primary">Ouverts</span>
                    <span className="font-bold text-lg">{stats.open}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-warning/10 rounded-lg">
                    <span className="text-warning-foreground">En cours</span>
                    <span className="font-bold text-lg">{stats.inProgress}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg">
                    <span className="text-success">Résolus</span>
                    <span className="font-bold text-lg">{stats.resolved}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            {/* Tickets Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Tickets de support
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tickets.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Aucun ticket</p>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Sujet</TableHead>
                          <TableHead>Priorité</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketsPagination.paginatedItems.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell>
                              {format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                {ticket.userProfile?.full_name || 'Anonyme'}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                            <TableCell>{getPriorityBadge(ticket.priority)}</TableCell>
                            <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                            <TableCell>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => setSelectedTicket(ticket)}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                    Répondre
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                                  <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                      {ticket.subject}
                                      <Select
                                        defaultValue={ticket.status}
                                        onValueChange={(value) => handleStatusChange(ticket.id, value)}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="open">Ouvert</SelectItem>
                                          <SelectItem value="in_progress">En cours</SelectItem>
                                          <SelectItem value="resolved">Résolu</SelectItem>
                                          <SelectItem value="closed">Fermé</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </DialogTitle>
                                  </DialogHeader>
                                  
                                  {/* Description */}
                                  {ticket.description && (
                                    <div className="rounded-lg bg-muted p-3">
                                      <p className="text-sm font-medium mb-1">Description</p>
                                      <p className="text-sm text-muted-foreground">{ticket.description}</p>
                                    </div>
                                  )}

                                  {/* Messages */}
                                  <ScrollArea className="flex-1 max-h-64 pr-4">
                                    <div className="space-y-3">
                                      {ticket.messages?.map((msg) => (
                                        <div
                                          key={msg.id}
                                          className={`p-3 rounded-lg ${
                                            msg.sender_id === user?.id
                                              ? 'bg-primary/10 ml-8'
                                              : 'bg-muted mr-8'
                                          }`}
                                        >
                                          <p className="text-sm">{msg.message}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(msg.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>

                                  {/* Reply form */}
                                  <div className="flex gap-2 pt-4 border-t">
                                    <Textarea
                                      value={newMessage}
                                      onChange={(e) => setNewMessage(e.target.value)}
                                      placeholder="Votre réponse..."
                                      className="flex-1"
                                      rows={2}
                                    />
                                    <Button
                                      onClick={handleSendMessage}
                                      disabled={sendingMessage || !newMessage.trim()}
                                    >
                                      {sendingMessage ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Send className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <PaginationControls
                      currentPage={ticketsPagination.currentPage}
                      totalPages={ticketsPagination.totalPages}
                      startIndex={ticketsPagination.startIndex}
                      endIndex={ticketsPagination.endIndex}
                      totalItems={ticketsPagination.totalItems}
                      onPreviousPage={ticketsPagination.goToPreviousPage}
                      onNextPage={ticketsPagination.goToNextPage}
                      onGoToPage={ticketsPagination.goToPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create-account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Créer un compte utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="max-w-md">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="create-fullName">Nom complet</Label>
                    <Input
                      id="create-fullName"
                      value={newUserData.fullName}
                      onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      placeholder="jean@exemple.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="create-password">Mot de passe</Label>
                    <Input
                      id="create-password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type de compte</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value: 'client' | 'provider') =>
                        setNewUserData({ ...newUserData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="provider">Prestataire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleCreateAccount}
                    disabled={creatingAccount}
                  >
                    {creatingAccount ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <UserPlus className="h-4 w-4 mr-2" />
                    )}
                    Créer le compte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
