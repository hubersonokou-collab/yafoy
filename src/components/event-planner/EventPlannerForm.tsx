import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Users, MapPin, Wallet, ArrowRight } from 'lucide-react';

const EVENT_TYPES = [
  { value: 'mariage', label: 'Mariage' },
  { value: 'bapteme', label: 'Baptême' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'fete_entreprise', label: 'Fête d\'entreprise' },
  { value: 'communion', label: 'Communion' },
  { value: 'fiancailles', label: 'Fiançailles' },
  { value: 'autre', label: 'Autre' },
];

const SERVICES = [
  { id: 'decoration', label: 'Décoration' },
  { id: 'mobilier', label: 'Mobilier' },
  { id: 'sonorisation', label: 'Sonorisation' },
  { id: 'eclairage', label: 'Éclairage' },
  { id: 'vaisselle', label: 'Vaisselle' },
  { id: 'transport', label: 'Transport' },
  { id: 'photographie', label: 'Photographie' },
  { id: 'traiteur', label: 'Traiteur' },
];

interface EventFormData {
  eventType: string;
  eventName: string;
  budgetMin: number;
  budgetMax: number;
  guestCount: number;
  eventDate: string;
  eventLocation: string;
  servicesNeeded: string[];
  additionalNotes: string;
}

interface EventPlannerFormProps {
  onSubmit: (data: EventFormData) => void;
  initialData?: Partial<EventFormData>;
}

export const EventPlannerForm = ({ onSubmit, initialData }: EventPlannerFormProps) => {
  const [formData, setFormData] = useState<EventFormData>({
    eventType: initialData?.eventType || '',
    eventName: initialData?.eventName || '',
    budgetMin: initialData?.budgetMin || 0,
    budgetMax: initialData?.budgetMax || 0,
    guestCount: initialData?.guestCount || 0,
    eventDate: initialData?.eventDate || '',
    eventLocation: initialData?.eventLocation || '',
    servicesNeeded: initialData?.servicesNeeded || [],
    additionalNotes: initialData?.additionalNotes || '',
  });

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicesNeeded: prev.servicesNeeded.includes(serviceId)
        ? prev.servicesNeeded.filter(s => s !== serviceId)
        : [...prev.servicesNeeded, serviceId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Planifiez votre événement
        </CardTitle>
        <CardDescription>
          Décrivez votre événement pour recevoir des recommandations personnalisées
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Event Type & Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventType">Type d'événement *</Label>
              <Select
                value={formData.eventType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez..." />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventName">Nom de l'événement</Label>
              <Input
                id="eventName"
                value={formData.eventName}
                onChange={(e) => setFormData(prev => ({ ...prev, eventName: e.target.value }))}
                placeholder="Ex: Mariage de Sarah & Moussa"
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Budget (FCFA)
            </Label>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Input
                  type="number"
                  value={formData.budgetMin || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetMin: Number(e.target.value) }))}
                  placeholder="Minimum"
                />
              </div>
              <div>
                <Input
                  type="number"
                  value={formData.budgetMax || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, budgetMax: Number(e.target.value) }))}
                  placeholder="Maximum *"
                  required
                />
              </div>
            </div>
          </div>

          {/* Guests & Date */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="guestCount" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Nombre d'invités *
              </Label>
              <Input
                id="guestCount"
                type="number"
                value={formData.guestCount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, guestCount: Number(e.target.value) }))}
                placeholder="150"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventDate">Date de l'événement</Label>
              <Input
                id="eventDate"
                type="date"
                value={formData.eventDate}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="eventLocation" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Lieu de l'événement
            </Label>
            <Input
              id="eventLocation"
              value={formData.eventLocation}
              onChange={(e) => setFormData(prev => ({ ...prev, eventLocation: e.target.value }))}
              placeholder="Dakar, Sénégal"
            />
          </div>

          {/* Services Needed */}
          <div className="space-y-3">
            <Label>Services recherchés</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {SERVICES.map(service => (
                <div
                  key={service.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={service.id}
                    checked={formData.servicesNeeded.includes(service.id)}
                    onCheckedChange={() => handleServiceToggle(service.id)}
                  />
                  <label
                    htmlFor={service.id}
                    className="text-sm cursor-pointer"
                  >
                    {service.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Notes supplémentaires</Label>
            <Textarea
              id="additionalNotes"
              value={formData.additionalNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
              placeholder="Décrivez vos besoins spécifiques, thème, contraintes..."
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={!formData.eventType || !formData.budgetMax || !formData.guestCount}
          >
            Continuer avec l'assistant IA
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
