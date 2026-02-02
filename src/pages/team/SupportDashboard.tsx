import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import {
  Loader2,
  HeadphonesIcon,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  User,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
        .order('created_at', { ascending: false })
        .limit(100);

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
      open: { label: 'Ouvert', className: 'bg-blue-100 text-blue-700' },
      in_progress: { label: 'En cours', className: 'bg-yellow-100 text-yellow-700' },
      resolved: { label: 'Résolu', className: 'bg-green-100 text-green-700' },
      closed: { label: 'Fermé', className: 'bg-gray-100 text-gray-700' },
    };
    const { label, className } = config[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
    return <Badge className={className}>{label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { className: string }> = {
      low: { className: 'bg-gray-100 text-gray-700' },
      medium: { className: 'bg-blue-100 text-blue-700' },
      high: { className: 'bg-orange-100 text-orange-700' },
      urgent: { className: 'bg-red-100 text-red-700' },
    };
    return <Badge className={config[priority]?.className || 'bg-gray-100 text-gray-700'}>{priority}</Badge>;
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
        <div>
          <h1 className="text-2xl font-bold text-secondary">Tableau de bord Support</h1>
          <p className="text-muted-foreground">
            Gérez les tickets de support et assistez les utilisateurs
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <HeadphonesIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ouverts</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">En cours</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Résolus</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  {tickets.map((ticket) => (
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
                          <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                            <DialogHeader>
                              <DialogTitle>{ticket.subject}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="flex-1 flex flex-col min-h-0">
                              {/* Ticket Info */}
                              <div className="flex gap-4 mb-4 pb-4 border-b">
                                <div>
                                  <p className="text-sm text-muted-foreground">Utilisateur</p>
                                  <p className="font-medium">{ticket.userProfile?.full_name || 'Anonyme'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Statut</p>
                                  <Select
                                    value={ticket.status}
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
                                </div>
                              </div>

                              {/* Description */}
                              {ticket.description && (
                                <div className="mb-4 p-3 bg-muted rounded-lg">
                                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                                  <p>{ticket.description}</p>
                                </div>
                              )}

                              {/* Messages */}
                              <ScrollArea className="flex-1 pr-4">
                                <div className="space-y-4">
                                  {ticket.messages?.map((message) => (
                                    <div
                                      key={message.id}
                                      className={`p-3 rounded-lg ${
                                        message.sender_id === user?.id
                                          ? 'bg-primary/10 ml-8'
                                          : 'bg-muted mr-8'
                                      }`}
                                    >
                                      <p className="text-xs text-muted-foreground mb-1">
                                        {message.sender_id === user?.id ? 'Vous' : 'Client'} • 
                                        {format(new Date(message.created_at), ' dd MMM HH:mm', { locale: fr })}
                                      </p>
                                      <p>{message.message}</p>
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>

                              {/* Reply Input */}
                              <div className="flex gap-2 pt-4 mt-4 border-t">
                                <Textarea
                                  value={newMessage}
                                  onChange={(e) => setNewMessage(e.target.value)}
                                  placeholder="Tapez votre réponse..."
                                  className="flex-1"
                                  rows={2}
                                />
                                <Button
                                  onClick={handleSendMessage}
                                  disabled={!newMessage.trim() || sendingMessage}
                                  className="self-end"
                                >
                                  {sendingMessage ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SupportDashboard;
