import { useState, useRef, useEffect } from "react";
import { Volume2, VolumeX, TestTube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface VoiceAlertsProps {
  onSpeak: (speakFn: (text: string) => void) => void;
}

export const VoiceAlerts = ({ onSpeak }: VoiceAlertsProps) => {
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState([0.8]);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  const speak = (text: string) => {
    if (!isEnabled || !synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume[0];
    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') ||
      voice.name.toLowerCase().includes('zira') ||
      (voice.lang.includes('en-US') && voice.name.toLowerCase().includes('samantha'))
    ) || voices.find(voice => voice.lang.includes('en-US'));

    if (femaleVoice) utterance.voice = femaleVoice;
    synthRef.current.speak(utterance);
  };

  useEffect(() => {
    onSpeak(speak);
  }, [isEnabled, volume, onSpeak]);

  return (
    <Card className="p-3 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">VOICE ALERTS</h4>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEnabled(!isEnabled)}
            className="h-8 w-8 p-0"
          >
            {isEnabled ? (
              <Volume2 className="h-4 w-4 text-mission-success" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {isEnabled && (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>Volume</span>
                <span>{Math.round(volume[0] * 100)}%</span>
              </div>
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={1}
                min={0}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => speak("Voice alerts system test successful")}
              className="w-full h-8 text-xs"
            >
              <TestTube className="h-3 w-3 mr-1" />
              TEST
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};