import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MissionButton } from "@/components/ui/mission-button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2 } from "lucide-react";

interface RawDataPanelProps {
  rawData: string[];
  textMessages: Array<{ text: string; timestamp: number }>;
  isLive: boolean;
  onClearData: () => void;
}

export const RawDataPanel = ({ 
  rawData, 
  textMessages, 
  isLive, 
  onClearData 
}: RawDataPanelProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new data arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [rawData, textMessages]);

  const formatTimestamp = (index: number) => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">RAW DATA STREAM</h3>
          {isLive && (
            <Badge className="bg-mission-success text-background animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
        
        <MissionButton
          variant="outline"
          size="sm"
          onClick={onClearData}
          disabled={rawData.length === 0 && textMessages.length === 0}
        >
          <Trash2 className="h-4 w-4" />
          Clear
        </MissionButton>
      </div>

      {/* Text Messages Section */}
      {textMessages.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">
            FLIGHT EVENTS
          </h4>
          <div className="space-y-1">
            {textMessages.slice(-5).map((message, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded bg-mission-warning/20 border border-mission-warning/30"
              >
                <Badge variant="outline" className="text-xs">
                  {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Badge>
                <span className="font-mono text-sm text-mission-warning">
                  {message.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Stream */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          TELEMETRY STREAM
        </h4>
        <ScrollArea className="h-64 w-full">
          <div ref={scrollRef} className="space-y-1 font-mono text-xs">
            {rawData.length === 0 ? (
              <div className="text-muted-foreground italic p-2">
                No data received yet. Connect to rocket to start streaming...
              </div>
            ) : (
              rawData.slice(-50).map((line, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-1 hover:bg-muted/20 rounded"
                >
                  <Badge variant="outline" className="text-xs shrink-0">
                    {String(index + 1).padStart(3, '0')}
                  </Badge>
                  <span className="text-foreground/80 break-all">
                    {line}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {rawData.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Showing last 50 entries • Total: {rawData.length} lines
        </div>
      )}
    </Card>
  );
};