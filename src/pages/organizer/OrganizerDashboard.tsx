import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useChatRoom } from '@/hooks/useChatRoom';
import {
  Loader2,
  Search,
  Users,
  Calendar,
  MessageSquare,
  Send,
  Package,
  Calculator,
  Image,
  Paperclip,
  Mic,
  Plus,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string | null;
  eventName: string | null;
  eventType: string;
  eventDate: string | null;
  guestCount: number;
  status: string;
  chatRoomId: string | null;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price_per_day: number;
  category_name: string | null;
  images: string[] | null;
}

interface Category {
  id: string;
  name: string;
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  mariage: 'Mariage',
  bapteme: 'Baptême',
  anniversaire: 'Anniversaire',
  fete_entreprise: "Fête d'entreprise",
  communion: 'Communion',
  fiancailles: 'Fiançailles',
  autre: 'Autre',
};

const OrganizerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [loadingReservations, setLoadingReservations] = useState(true);

  // Chat state
  const { messages, sendMessage, isSending, uploadFile } = useChatRoom(
    selectedReservation?.chatRoomId || null
  );
  const [newMessage, setNewMessage] = useState('');

  // Catalog search state
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Price calculator state
  const [calcCategory, setCalcCategory] = useState('');
  const [calcProductName, setCalcProductName] = useState('');
  const [calcQuantity, setCalcQuantity] = useState(1);
  const [calcUnitPrice, setCalcUnitPrice] = useState(0);

  // Right panel active tab
  const [rightTab, setRightTab] = useState<'calcul' | 'catalogue' | 'devis'>('calcul');

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  // Fetch reservations assigned to this organizer
  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) return;

      try {
        const { data: assignments } = await supabase
          .from('client_organizer_assignments')
          .select('client_id')
          .eq('organizer_id', user.id)
          .eq('status', 'active');

        if (!assignments || assignments.length === 0) {
          setReservations([]);
          setLoadingReservations(false);
          return;
        }

        const clientIds = assignments.map((a) => a.client_id);

        const { data: events } = await supabase
          .from('event_planning_requests')
          .select('*')
          .in('user_id', clientIds)
          .in('status', ['pending_contact', 'contacted', 'confirmed', 'pending'])
          .order('created_at', { ascending: false });

        if (!events) {
          setReservations([]);
          setLoadingReservations(false);
          return;
        }

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url')
          .in('user_id', clientIds);

        const profileMap = (profiles || []).reduce(
          (acc, p) => {
            acc[p.user_id] = p;
            return acc;
          },
          {} as Record<string, { full_name: string | null; avatar_url: string | null }>
        );

        const eventIds = events.map((e) => e.id);
        const { data: chatRooms } = await supabase
          .from('chat_rooms')
          .select('id, event_planning_id')
          .in('event_planning_id', eventIds);

        const chatRoomMap = (chatRooms || []).reduce(
          (acc, r) => {
            acc[r.event_planning_id] = r.id;
            return acc;
          },
          {} as Record<string, string>
        );

        const reservationData: Reservation[] = events.map((e) => ({
          id: e.id,
          clientId: e.user_id,
          clientName: profileMap[e.user_id]?.full_name || 'Client',
          clientAvatar: profileMap[e.user_id]?.avatar_url || null,
          eventName: e.event_name,
          eventType: e.event_type,
          eventDate: e.event_date,
          guestCount: e.guest_count,
          status: e.status,
          chatRoomId: chatRoomMap[e.id] || null,
          createdAt: e.created_at,
        }));

        setReservations(reservationData);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les réservations',
          variant: 'destructive',
        });
      } finally {
        setLoadingReservations(false);
      }
    };

    fetchReservations();
  }, [user, toast]);

  // Search products
  const handleSearchProducts = async () => {
    if (!searchQuery.trim()) return;

    setLoadingProducts(true);
    try {
      const { data } = await supabase
        .from('products')
        .select(`id, name, price_per_day, images, categories:category_id(name)`)
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(20);

      setProducts(
        (data || []).map((p) => ({
          id: p.id,
          name: p.name,
          price_per_day: p.price_per_day,
          category_name: (p.categories as any)?.name || null,
          images: p.images,
        }))
      );
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Calculate total price
  const calculatedTotal = calcQuantity * calcUnitPrice;

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;
    await sendMessage(newMessage, 'text');
    setNewMessage('');
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = await uploadFile(file);
    if (url) {
      const isImage = file.type.startsWith('image/');
      await sendMessage(file.name, isImage ? 'image' : 'file', url, file.name, file.size);
    }
  };

  // Send quote to chat
  const handleSendQuote = async () => {
    if (!selectedReservation?.chatRoomId || calculatedTotal === 0) return;
    
    const priceMessage = `💰 **Devis**\n\n📦 ${calcProductName || 'Article'}\n📁 Catégorie: ${calcCategory || 'Non spécifié'}\n🔢 Quantité: ${calcQuantity}\n💵 Prix unitaire: ${calcUnitPrice.toLocaleString()} FCFA\n\n**Total: ${calculatedTotal.toLocaleString()} FCFA**`;
    await sendMessage(priceMessage, 'text');
    toast({
      title: 'Devis envoyé',
      description: 'Le devis a été envoyé au client',
    });
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-secondary">Dashboard Organisateur</h1>
        <p className="text-muted-foreground">Gestion des réservations et conversations clients</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Left Panel - Conversations List */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4" />
              Conversations ({reservations.length})
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1">
            {loadingReservations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation</p>
              </div>
            ) : (
              <div className="divide-y">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedReservation?.id === res.id
                        ? 'bg-primary text-primary-foreground'
                        : ''
                    }`}
                    onClick={() => setSelectedReservation(res)}
                  >
                    <p className={`font-medium text-sm ${selectedReservation?.id === res.id ? 'text-primary-foreground' : ''}`}>
                      Réservation - {res.eventName || EVENT_TYPE_LABELS[res.eventType]}
                    </p>
                    <p className={`text-xs ${selectedReservation?.id === res.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {res.eventDate
                        ? format(new Date(res.eventDate), 'd MMM', { locale: fr })
                        : format(new Date(res.createdAt), 'd MMM', { locale: fr })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Center Panel - Chat */}
        <Card className="lg:col-span-5 flex flex-col">
          {selectedReservation ? (
            <>
              <CardHeader className="py-3 px-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Réservation - {selectedReservation.eventName || EVENT_TYPE_LABELS[selectedReservation.eventType]}
                  </CardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="h-4 w-4" />
                    <span>{selectedReservation.guestCount}</span>
                  </div>
                </div>
              </CardHeader>
              
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Démarrez la conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className="flex items-end gap-2 max-w-[80%]">
                            {!isOwn && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-muted">U</AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              {!isOwn && (
                                <p className="text-xs text-muted-foreground mb-1">Utilisateur</p>
                              )}
                              {isOwn && (
                                <p className="text-xs text-muted-foreground mb-1 text-right">Moi</p>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isOwn
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                {msg.message_type === 'image' && msg.file_url && (
                                  <img
                                    src={msg.file_url}
                                    alt="Image"
                                    className="rounded-lg max-w-full mb-2"
                                  />
                                )}
                                {msg.content && (
                                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                )}
                              </div>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-right' : ''} text-muted-foreground`}>
                                {format(new Date(msg.created_at), 'HH:mm')}
                              </p>
                            </div>
                            {isOwn && (
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">Moi</AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat Input */}
              <div className="border-t p-3">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Image className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = '*/*';
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <Paperclip className="h-5 w-5 text-primary" />
                  </Button>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <Mic className="h-5 w-5 text-muted-foreground" />
                  </Button>
                  <Input
                    placeholder="Écrivez un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={isSending} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </Card>

        {/* Right Panel - Tools */}
        <Card className="lg:col-span-4 flex flex-col">
          <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as any)} className="flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 m-2 mr-4">
              <TabsTrigger value="calcul" className="text-sm">
                <Calculator className="h-4 w-4 mr-1" />
                Calcul
              </TabsTrigger>
              <TabsTrigger value="catalogue" className="text-sm">
                <Package className="h-4 w-4 mr-1" />
                Catalogue
              </TabsTrigger>
              <TabsTrigger value="devis" className="text-sm">
                Devis
              </TabsTrigger>
            </TabsList>

            {/* Calcul Tab */}
            <TabsContent value="calcul" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="h-5 w-5" />
                  <h3 className="font-semibold">Calculateur de Prix</h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">Catégorie</Label>
                    <Select value={calcCategory} onValueChange={setCalcCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Article</Label>
                    <Input
                      value={calcProductName}
                      onChange={(e) => setCalcProductName(e.target.value)}
                      placeholder="Ex: Gâteau 3 étages"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Quantité / Nb Personnes</Label>
                    <Input
                      type="number"
                      value={calcQuantity}
                      onChange={(e) => setCalcQuantity(Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Prix unitaire (FCFA)</Label>
                    <Input
                      type="number"
                      value={calcUnitPrice}
                      onChange={(e) => setCalcUnitPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <Button className="w-full bg-primary" onClick={handleSendQuote} disabled={!selectedReservation?.chatRoomId}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>

                {calculatedTotal > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total:</span>
                      <span className="font-bold text-primary text-xl">
                        {calculatedTotal.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Catalogue Tab */}
            <TabsContent value="catalogue" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Rechercher un produit..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchProducts()}
                  />
                  <Button onClick={handleSearchProducts} disabled={loadingProducts} size="icon">
                    {loadingProducts ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100vh-400px)]">
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Recherchez un produit</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => {
                            setCalcProductName(product.name);
                            setCalcUnitPrice(product.price_per_day);
                            setCalcCategory(product.category_name || '');
                            setRightTab('calcul');
                          }}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-muted-foreground">{product.category_name}</p>
                            </div>
                            <p className="text-sm font-semibold text-primary whitespace-nowrap">
                              {product.price_per_day.toLocaleString()} F
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>

            {/* Devis Tab */}
            <TabsContent value="devis" className="flex-1 p-4 pt-0 overflow-auto">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Historique des devis envoyés</p>
                <p className="text-xs mt-1">Fonctionnalité bientôt disponible</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default OrganizerDashboard;