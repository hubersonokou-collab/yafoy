 import { useState, useEffect } from 'react';
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
   CheckCircle,
   XCircle,
   Clock,
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
 
 const EVENT_TYPE_LABELS: Record<string, string> = {
   mariage: 'Mariage',
   bapteme: 'Baptême',
   anniversaire: 'Anniversaire',
   fete_entreprise: "Fête d'entreprise",
   communion: 'Communion',
   fiancailles: 'Fiançailles',
   autre: 'Autre',
 };
 
 const STATUS_LABELS: Record<string, { label: string; color: string }> = {
   pending_contact: { label: 'En attente', color: 'bg-yellow-500' },
   contacted: { label: 'Contacté', color: 'bg-blue-500' },
   confirmed: { label: 'Confirmé', color: 'bg-green-500' },
   cancelled: { label: 'Annulé', color: 'bg-red-500' },
 };
 
 const OrganizerDashboard = () => {
   const { user, loading: authLoading } = useAuth();
   const navigate = useNavigate();
   const { toast } = useToast();
 
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
 
   // Price calculator state
   const [calcProductName, setCalcProductName] = useState('');
   const [calcQuantity, setCalcQuantity] = useState(1);
   const [calcUnitPrice, setCalcUnitPrice] = useState(0);
   const [calcDays, setCalcDays] = useState(1);
   const [calcPersons, setCalcPersons] = useState(1);
 
   useEffect(() => {
     if (!authLoading && !user) {
       navigate('/auth');
     }
   }, [user, authLoading, navigate]);
 
   // Fetch reservations assigned to this organizer
   useEffect(() => {
     const fetchReservations = async () => {
       if (!user) return;
 
       try {
         // Get assignments for this organizer
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
 
         // Fetch event planning requests from these clients
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
 
         // Fetch client profiles
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
 
         // Fetch chat rooms for these events
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
         .select(
           `
           id,
           name,
           price_per_day,
           images,
           categories:category_id(name)
         `
         )
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
   const calculatedTotal = calcQuantity * calcUnitPrice * calcDays * calcPersons;
 
   // Send message
   const handleSendMessage = async () => {
     if (!newMessage.trim() || isSending) return;
     await sendMessage(newMessage, 'text');
     setNewMessage('');
   };
 
   // Update reservation status
   const handleUpdateStatus = async (
     reservationId: string,
     newStatus: string
   ) => {
     try {
       const { error } = await supabase
         .from('event_planning_requests')
         .update({ status: newStatus })
         .eq('id', reservationId);
 
       if (error) throw error;
 
       setReservations((prev) =>
         prev.map((r) =>
           r.id === reservationId ? { ...r, status: newStatus } : r
         )
       );
 
       if (selectedReservation?.id === reservationId) {
         setSelectedReservation((prev) =>
           prev ? { ...prev, status: newStatus } : null
         );
       }
 
       toast({
         title: 'Statut mis à jour',
         description: `Réservation ${STATUS_LABELS[newStatus]?.label || newStatus}`,
       });
     } catch (error) {
       console.error('Error updating status:', error);
       toast({
         title: 'Erreur',
         description: 'Impossible de mettre à jour le statut',
         variant: 'destructive',
       });
     }
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
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-120px)]">
         {/* Left Panel - Reservations List */}
         <Card className="lg:col-span-1 flex flex-col">
           <CardHeader className="pb-3">
             <CardTitle className="flex items-center gap-2">
               <Users className="h-5 w-5 text-primary" />
               Réservations
             </CardTitle>
           </CardHeader>
           <CardContent className="flex-1 p-0">
             <ScrollArea className="h-[calc(100vh-240px)]">
               {loadingReservations ? (
                 <div className="flex items-center justify-center p-8">
                   <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 </div>
               ) : reservations.length === 0 ? (
                 <div className="text-center p-8 text-muted-foreground">
                   <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                   <p>Aucune réservation en attente</p>
                 </div>
               ) : (
                 <div className="divide-y">
                   {reservations.map((res) => (
                     <div
                       key={res.id}
                       className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                         selectedReservation?.id === res.id ? 'bg-muted' : ''
                       }`}
                       onClick={() => setSelectedReservation(res)}
                     >
                       <div className="flex items-start gap-3">
                         <Avatar>
                           <AvatarImage src={res.clientAvatar || undefined} />
                           <AvatarFallback>
                             {res.clientName.charAt(0)}
                           </AvatarFallback>
                         </Avatar>
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2">
                             <p className="font-medium truncate">
                               {res.clientName}
                             </p>
                             <Badge
                               variant="secondary"
                               className={`text-xs text-white ${
                                 STATUS_LABELS[res.status]?.color || 'bg-gray-500'
                               }`}
                             >
                               {STATUS_LABELS[res.status]?.label || res.status}
                             </Badge>
                           </div>
                           <p className="text-sm text-muted-foreground truncate">
                             {res.eventName || EVENT_TYPE_LABELS[res.eventType]}
                           </p>
                           <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                             <Calendar className="h-3 w-3" />
                             {res.eventDate
                               ? format(new Date(res.eventDate), 'dd MMM', { locale: fr })
                               : 'Non défini'}
                             <Users className="h-3 w-3 ml-2" />
                             {res.guestCount}
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
             </ScrollArea>
           </CardContent>
         </Card>
 
         {/* Right Panel - Chat + Catalog */}
         <div className="lg:col-span-2 flex flex-col gap-4">
           {selectedReservation ? (
             <>
               {/* Selected Reservation Header */}
               <Card>
                 <CardContent className="p-4">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <Avatar className="h-12 w-12">
                         <AvatarImage src={selectedReservation.clientAvatar || undefined} />
                         <AvatarFallback>
                           {selectedReservation.clientName.charAt(0)}
                         </AvatarFallback>
                       </Avatar>
                       <div>
                         <h3 className="font-semibold">{selectedReservation.clientName}</h3>
                         <p className="text-sm text-muted-foreground">
                           {selectedReservation.eventName ||
                             EVENT_TYPE_LABELS[selectedReservation.eventType]}{' '}
                           • {selectedReservation.guestCount} invités
                         </p>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() =>
                           handleUpdateStatus(selectedReservation.id, 'contacted')
                         }
                       >
                         <Clock className="h-4 w-4 mr-1" />
                         Contacté
                       </Button>
                       <Button
                         size="sm"
                         className="bg-green-600 hover:bg-green-700"
                         onClick={() =>
                           handleUpdateStatus(selectedReservation.id, 'confirmed')
                         }
                       >
                         <CheckCircle className="h-4 w-4 mr-1" />
                         Confirmer
                       </Button>
                       <Button
                         size="sm"
                         variant="destructive"
                         onClick={() =>
                           handleUpdateStatus(selectedReservation.id, 'cancelled')
                         }
                       >
                         <XCircle className="h-4 w-4 mr-1" />
                         Annuler
                       </Button>
                     </div>
                   </div>
                 </CardContent>
               </Card>
 
               <Tabs defaultValue="chat" className="flex-1 flex flex-col">
                 <TabsList className="grid w-full grid-cols-3">
                   <TabsTrigger value="chat">
                     <MessageSquare className="h-4 w-4 mr-2" />
                     Discussion
                   </TabsTrigger>
                   <TabsTrigger value="catalog">
                     <Package className="h-4 w-4 mr-2" />
                     Catalogue
                   </TabsTrigger>
                   <TabsTrigger value="calculator">
                     <Calculator className="h-4 w-4 mr-2" />
                     Calculateur
                   </TabsTrigger>
                 </TabsList>
 
                 {/* Chat Tab */}
                 <TabsContent value="chat" className="flex-1 mt-4">
                   <Card className="h-[calc(100vh-380px)] flex flex-col">
                     <ScrollArea className="flex-1 p-4">
                       <div className="space-y-4">
                         {messages.length === 0 ? (
                           <div className="text-center py-12 text-muted-foreground">
                             <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                             <p>Aucun message</p>
                           </div>
                         ) : (
                           messages.map((msg) => {
                             const isOwn = msg.sender_id === user?.id;
                             return (
                               <div
                                 key={msg.id}
                                 className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                               >
                                 <div
                                   className={`max-w-[70%] rounded-2xl px-4 py-2 ${
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
                                   {msg.content && <p className="text-sm">{msg.content}</p>}
                                   <p
                                     className={`text-xs mt-1 ${
                                       isOwn
                                         ? 'text-primary-foreground/70'
                                         : 'text-muted-foreground'
                                     }`}
                                   >
                                     {format(new Date(msg.created_at), 'HH:mm')}
                                   </p>
                                 </div>
                               </div>
                             );
                           })
                         )}
                       </div>
                     </ScrollArea>
                     <div className="border-t p-4">
                       <div className="flex gap-2">
                         <Input
                           placeholder="Votre message..."
                           value={newMessage}
                           onChange={(e) => setNewMessage(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                         />
                         <Button onClick={handleSendMessage} disabled={isSending}>
                           <Send className="h-4 w-4" />
                         </Button>
                       </div>
                     </div>
                   </Card>
                 </TabsContent>
 
                 {/* Catalog Tab */}
                 <TabsContent value="catalog" className="flex-1 mt-4">
                   <Card className="h-[calc(100vh-380px)]">
                     <CardHeader className="pb-3">
                       <div className="flex gap-2">
                         <Input
                           placeholder="Rechercher un produit (ex: gâteau 3 étages)..."
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           onKeyPress={(e) => e.key === 'Enter' && handleSearchProducts()}
                         />
                         <Button onClick={handleSearchProducts} disabled={loadingProducts}>
                           {loadingProducts ? (
                             <Loader2 className="h-4 w-4 animate-spin" />
                           ) : (
                             <Search className="h-4 w-4" />
                           )}
                         </Button>
                       </div>
                     </CardHeader>
                     <CardContent>
                       <ScrollArea className="h-[calc(100vh-500px)]">
                         {products.length === 0 ? (
                           <div className="text-center py-8 text-muted-foreground">
                             <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                             <p>Recherchez un produit dans le catalogue</p>
                           </div>
                         ) : (
                           <div className="grid grid-cols-2 gap-4">
                             {products.map((product) => (
                               <Card
                                 key={product.id}
                                 className="cursor-pointer hover:shadow-md transition-shadow"
                                 onClick={() => {
                                   setCalcProductName(product.name);
                                   setCalcUnitPrice(product.price_per_day);
                                 }}
                               >
                                 <CardContent className="p-3">
                                   {product.images?.[0] && (
                                     <img
                                       src={product.images[0]}
                                       alt={product.name}
                                       className="w-full h-24 object-cover rounded mb-2"
                                     />
                                   )}
                                   <p className="font-medium text-sm truncate">
                                     {product.name}
                                   </p>
                                   <p className="text-xs text-muted-foreground">
                                     {product.category_name}
                                   </p>
                                   <p className="text-sm font-semibold text-primary mt-1">
                                     {product.price_per_day.toLocaleString()} FCFA/jour
                                   </p>
                                 </CardContent>
                               </Card>
                             ))}
                           </div>
                         )}
                       </ScrollArea>
                     </CardContent>
                   </Card>
                 </TabsContent>
 
                 {/* Calculator Tab */}
                 <TabsContent value="calculator" className="flex-1 mt-4">
                   <Card className="h-[calc(100vh-380px)]">
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <Calculator className="h-5 w-5" />
                         Calculateur de prix
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div className="col-span-2">
                           <Label>Nom du produit/service</Label>
                           <Input
                             value={calcProductName}
                             onChange={(e) => setCalcProductName(e.target.value)}
                             placeholder="Ex: Gâteau 3 étages"
                           />
                         </div>
                         <div>
                           <Label>Prix unitaire (FCFA)</Label>
                           <Input
                             type="number"
                             value={calcUnitPrice}
                             onChange={(e) => setCalcUnitPrice(Number(e.target.value))}
                           />
                         </div>
                         <div>
                           <Label>Quantité</Label>
                           <Input
                             type="number"
                             value={calcQuantity}
                             onChange={(e) => setCalcQuantity(Number(e.target.value))}
                             min={1}
                           />
                         </div>
                         <div>
                           <Label>Nombre de jours</Label>
                           <Input
                             type="number"
                             value={calcDays}
                             onChange={(e) => setCalcDays(Number(e.target.value))}
                             min={1}
                           />
                         </div>
                         <div>
                           <Label>Nombre de personnes</Label>
                           <Input
                             type="number"
                             value={calcPersons}
                             onChange={(e) => setCalcPersons(Number(e.target.value))}
                             min={1}
                           />
                         </div>
                       </div>
 
                       <div className="border-t pt-4">
                         <div className="flex items-center justify-between text-lg">
                           <span>Total:</span>
                           <span className="font-bold text-primary text-2xl">
                             {calculatedTotal.toLocaleString()} FCFA
                           </span>
                         </div>
                         <p className="text-sm text-muted-foreground mt-1">
                           {calcProductName || 'Produit'} × {calcQuantity} × {calcDays} jour(s) × {calcPersons} pers.
                         </p>
                       </div>
 
                       <Button
                         className="w-full"
                         onClick={async () => {
                           if (selectedReservation?.chatRoomId) {
                             const priceMessage = `💰 Devis: ${calcProductName}\n${calcQuantity} × ${calcUnitPrice.toLocaleString()} FCFA × ${calcDays} jour(s) × ${calcPersons} pers.\n\n**Total: ${calculatedTotal.toLocaleString()} FCFA**`;
                             await sendMessage(priceMessage, 'text');
                             toast({
                               title: 'Devis envoyé',
                               description: 'Le devis a été envoyé au client',
                             });
                           }
                         }}
                         disabled={!selectedReservation?.chatRoomId || calculatedTotal === 0}
                       >
                         <Send className="h-4 w-4 mr-2" />
                         Envoyer le devis au client
                       </Button>
                     </CardContent>
                   </Card>
                 </TabsContent>
               </Tabs>
             </>
           ) : (
             <Card className="flex-1 flex items-center justify-center">
               <div className="text-center text-muted-foreground">
                 <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
                 <p className="text-lg font-medium">Sélectionnez une réservation</p>
                 <p className="text-sm">Cliquez sur une réservation pour voir les détails</p>
               </div>
             </Card>
           )}
         </div>
       </div>
     </DashboardLayout>
   );
 };
 
 export default OrganizerDashboard;