import { useState, useEffect } from 'react';
import { Mic, MicOff, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

interface VoiceSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  autoSearch?: boolean;
}

export const VoiceSearch = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Rechercher ou dites "Rechercher..."',
  className,
  autoSearch = true,
}: VoiceSearchProps) => {
  const [internalValue, setInternalValue] = useState('');
  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
  } = useVoice({
    language: 'fr-FR',
    continuous: false,
    interimResults: true,
    onResult: (text, isFinal) => {
      // Update the search input with transcript
      const newValue = text;
      if (onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }

      // Auto-search when speech ends
      if (isFinal && autoSearch && onSearch && text.trim()) {
        onSearch(text.trim());
      }
    },
    onError: (error) => {
      toast.error(error);
    },
  });

  // Sync transcript with input when listening
  useEffect(() => {
    if (isListening && transcript) {
      if (onChange) {
        onChange(transcript);
      } else {
        setInternalValue(transcript);
      }
    }
  }, [transcript, isListening, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const handleSearch = () => {
    if (onSearch && value.trim()) {
      onSearch(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    if (onChange) {
      onChange('');
    } else {
      setInternalValue('');
    }
    resetTranscript();
  };

  const handleToggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      if (!isSupported) {
        toast.error('La reconnaissance vocale n\'est pas supportée');
        return;
      }
      resetTranscript();
      startListening();
    }
  };

  return (
    <div className={cn('relative flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-10',
            isListening && 'ring-2 ring-primary animate-pulse'
          )}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isSupported && (
        <Button
          variant={isListening ? 'default' : 'outline'}
          size="icon"
          className={cn(
            'shrink-0',
            isListening && 'bg-primary animate-pulse'
          )}
          onClick={handleToggleVoice}
        >
          {isListening ? (
            <MicOff className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
        </Button>
      )}

      <Button onClick={handleSearch}>
        <Search className="mr-2 h-4 w-4" />
        Rechercher
      </Button>
    </div>
  );
};
