import { useState, useEffect, forwardRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useVoice } from '@/hooks/useVoice';
import { toast } from 'sonner';

interface VoiceInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
}

export const VoiceInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, VoiceInputProps>(
  ({
    value: controlledValue,
    onChange,
    placeholder = 'Tapez ou utilisez le microphone...',
    className,
    multiline = false,
    rows = 3,
    disabled = false,
  }, ref) => {
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
      continuous: true,
      interimResults: true,
      onResult: (text) => {
        // Append transcript to existing value
        const newValue = value ? `${value} ${text}` : text;
        if (onChange) {
          onChange(newValue);
        } else {
          setInternalValue(newValue);
        }
      },
      onError: (error) => {
        toast.error(error);
      },
    });

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const newValue = e.target.value;
      if (onChange) {
        onChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    };

    const handleToggleVoice = () => {
      if (disabled) return;
      
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

    const InputComponent = multiline ? Textarea : Input;

    return (
      <div className={cn('relative', className)}>
        <InputComponent
          ref={ref as any}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={multiline ? rows : undefined}
          className={cn(
            'pr-12',
            isListening && 'ring-2 ring-primary'
          )}
        />
        
        {isSupported && (
          <Button
            type="button"
            variant={isListening ? 'default' : 'ghost'}
            size="icon"
            className={cn(
              'absolute right-2 top-2 h-8 w-8',
              isListening && 'bg-primary animate-pulse'
            )}
            onClick={handleToggleVoice}
            disabled={disabled}
          >
            {isListening ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </Button>
        )}

        {isListening && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-xs text-primary">
            <span className="animate-pulse">●</span>
            <span>Écoute...</span>
          </div>
        )}
      </div>
    );
  }
);

VoiceInput.displayName = 'VoiceInput';
