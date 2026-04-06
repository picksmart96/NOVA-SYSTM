import { useState, useEffect, useRef } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { 
  useGetAssignment, 
  useListAssignmentStops, 
  useUpdateAssignmentStop, 
  useUpdateAssignment,
  getGetAssignmentQueryKey,
  getListAssignmentStopsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, ArrowLeft, Volume2, CheckCircle2, Box, Headphones } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

type SessionState = 
  | 'intro'
  | 'pallet_alpha'
  | 'pallet_bravo'
  | 'picking'
  | 'wrong_code'
  | 'confirm_qty'
  | 'outro'
  | 'completed';

export default function VoiceSessionPage() {
  const [, params] = useRoute("/nova/voice/:id");
  const id = params?.id || "";
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: assignment, isLoading: loadingAssignment } = useGetAssignment(id, {
    query: { enabled: !!id, queryKey: getGetAssignmentQueryKey(id) }
  });

  const { data: stops, isLoading: loadingStops } = useListAssignmentStops(id, {
    query: { enabled: !!id, queryKey: getListAssignmentStopsQueryKey(id) }
  });

  const updateStop = useUpdateAssignmentStop();
  const updateAssignment = useUpdateAssignment();

  const [sessionState, setSessionState] = useState<SessionState>('intro');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [codeInput, setCodeInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session state based on assignment status
  useEffect(() => {
    if (assignment && stops && stops.length > 0) {
      if (assignment.status === 'completed') {
        setSessionState('completed');
      } else {
        const nextPendingStopIndex = stops.findIndex(s => s.status !== 'picked');
        if (nextPendingStopIndex === -1) {
          setSessionState('outro');
        } else {
          setCurrentStopIndex(nextPendingStopIndex);
          if (assignment.status === 'active' && nextPendingStopIndex > 0) {
            setSessionState('picking');
          } else {
            setSessionState('intro');
          }
        }
      }
    }
  }, [assignment, stops]);

  // Start timer when active
  useEffect(() => {
    if (sessionState !== 'completed' && sessionState !== 'intro' && assignment?.status === 'active') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState, assignment?.status]);

  // Simulate speaking
  const speak = (text: string) => {
    setTranscript(text);
    setIsSpeaking(true);
    // Simulate speaking duration based on length
    const duration = Math.max(1500, text.length * 60);
    setTimeout(() => {
      setIsSpeaking(false);
    }, duration);
  };

  useEffect(() => {
    if (!assignment || !stops) return;

    if (sessionState === 'intro') {
      speak(`Start aisle ${assignment.startAisle}. End aisle ${assignment.endAisle}. Total case count ${assignment.totalCases}. Total pallets ${assignment.totalPallets}. Goal time ${assignment.goalTimeMinutes} minutes. To continue, say ready.`);
    } else if (sessionState === 'pallet_alpha') {
      speak("Position Alpha pallet. Get CHEP.");
    } else if (sessionState === 'pallet_bravo') {
      speak("Position Bravo pallet.");
    } else if (sessionState === 'picking') {
      const currentStop = stops[currentStopIndex];
      if (currentStop) {
        speak(`${currentStop.aisle} ${currentStop.slot} check.`);
        setCodeInput("");
      }
    } else if (sessionState === 'outro') {
      speak(`Last case complete. Proceed to printer ${assignment.printerNumber}. Apply label ${assignment.alphaLabelNumber} to pallet Alpha. Deliver Alpha pallet to door ${assignment.doorNumber}. Assignment complete.`);
    }
  }, [sessionState, currentStopIndex, assignment, stops]);

  const handleNext = () => {
    if (isSpeaking) return;

    switch (sessionState) {
      case 'intro':
        setSessionState('pallet_alpha');
        break;
      case 'pallet_alpha':
        if (assignment?.totalPallets && assignment.totalPallets > 1) {
          setSessionState('pallet_bravo');
        } else {
          setSessionState('picking');
        }
        break;
      case 'pallet_bravo':
        setSessionState('picking');
        break;
      case 'confirm_qty':
        // Mark current stop as picked
        if (stops && stops[currentStopIndex]) {
          const currentStop = stops[currentStopIndex];
          updateStop.mutate({
            id: id,
            stopId: currentStop.id,
            data: { status: 'picked', pickedAt: new Date().toISOString() }
          }, {
            onSuccess: () => {
              queryClient.invalidateQueries({ queryKey: getListAssignmentStopsQueryKey(id) });
              
              if (currentStopIndex < stops.length - 1) {
                setCurrentStopIndex(prev => prev + 1);
                setSessionState('picking');
              } else {
                setSessionState('outro');
              }
            }
          });
        }
        break;
      case 'outro':
        // Complete assignment
        updateAssignment.mutate({
          id: id,
          data: { status: 'completed', completedAt: new Date().toISOString() }
        }, {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetAssignmentQueryKey(id) });
            setSessionState('completed');
            toast.success("Assignment Completed!");
            setTimeout(() => setLocation('/nova'), 3000);
          }
        });
        break;
    }
  };

  const handleCheckCode = () => {
    if (!stops || !stops[currentStopIndex] || isSpeaking) return;
    
    const currentStop = stops[currentStopIndex];
    if (codeInput.toUpperCase() === currentStop.checkCode.toUpperCase()) {
      // Correct code
      speak(`Confirmed. Grab ${currentStop.qty}.`);
      setSessionState('confirm_qty');
    } else {
      // Wrong code
      speak(`Invalid. ${codeInput}. ${currentStop.aisle} ${currentStop.slot} check.`);
      setCodeInput("");
      setSessionState('wrong_code');
    }
  };

  if (loadingAssignment || loadingStops) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary"><Volume2 className="h-12 w-12 animate-pulse" /></div>;
  }

  if (!assignment || !stops) return null;

  const currentStop = stops[currentStopIndex];
  const nextStop = stops[currentStopIndex + 1];
  const progress = Math.round((stops.filter(s => s.status === 'picked').length / stops.length) * 100);
  
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (sessionState === 'completed') {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center p-4">
        <CheckCircle2 className="h-24 w-24 text-green-500 mb-6" />
        <h1 className="text-4xl font-black text-foreground mb-2">Assignment Complete</h1>
        <p className="text-muted-foreground text-xl mb-8">Good job. Returning to assignments...</p>
        <Link href="/nova">
          <Button variant="outline" size="lg">Return Now</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0f141a] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-black/40 backdrop-blur-md border-b border-white/10">
        <Link href={`/nova/assignments/${id}`}>
          <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 h-4 w-4" /> Exit Session
          </Button>
        </Link>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md font-mono text-sm tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {formatTime(elapsedSeconds)}
          </div>
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-xs font-bold text-white/70 uppercase tracking-widest">
            {assignment.voiceMode.replace('_', ' ')}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20 pb-32 z-0 relative">
        
        {/* Pulsing NOVA Indicator */}
        <div className="mb-12 relative flex justify-center items-center h-48 w-full">
          {isSpeaking && (
            <>
              <div className="absolute w-32 h-32 bg-primary/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute w-48 h-48 bg-primary/10 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.2s' }} />
              <div className="absolute w-64 h-64 bg-primary/5 rounded-full animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.4s' }} />
            </>
          )}
          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${isSpeaking ? 'bg-primary shadow-[0_0_50px_rgba(250,204,21,0.5)] scale-110' : 'bg-secondary border-2 border-primary/50'}`}>
            <Headphones className={`h-10 w-10 ${isSpeaking ? 'text-black' : 'text-primary'}`} />
          </div>
        </div>

        {/* Transcript */}
        <div className="text-center max-w-2xl px-4 mb-12 min-h-[100px] flex items-center justify-center">
          <p className={`text-2xl md:text-3xl font-medium leading-relaxed ${isSpeaking ? 'text-white' : 'text-white/50'}`}>
            "{transcript}"
          </p>
        </div>

        {/* Controls based on state */}
        <div className="w-full max-w-md mx-auto">
          {(sessionState === 'picking' || sessionState === 'wrong_code') ? (
            <Card className="bg-black/50 border-white/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <p className="text-white/50 text-sm font-bold uppercase tracking-widest mb-1">Current Location</p>
                  <p className="text-5xl font-black text-white tracking-tight">{currentStop?.aisle} - {currentStop?.slot}</p>
                </div>
                <div className="flex gap-2">
                  <Input 
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Enter Check Code" 
                    className="bg-white/5 border-white/20 text-white font-mono text-center text-xl h-14 uppercase placeholder:text-white/20"
                    onKeyDown={(e) => e.key === 'Enter' && handleCheckCode()}
                    disabled={isSpeaking}
                    autoFocus
                  />
                  <Button 
                    onClick={handleCheckCode}
                    disabled={!codeInput || isSpeaking}
                    className="h-14 px-8 bg-primary text-black font-bold hover:bg-primary/90"
                  >
                    Send
                  </Button>
                </div>
                {sessionState === 'wrong_code' && !isSpeaking && (
                  <p className="text-red-400 text-sm text-center mt-3 font-medium">Try again</p>
                )}
              </CardContent>
            </Card>
          ) : sessionState === 'confirm_qty' ? (
            <Card className="bg-primary/10 border-primary/30 backdrop-blur-sm shadow-[0_0_30px_rgba(250,204,21,0.1)]">
              <CardContent className="p-8 text-center">
                <p className="text-primary/70 font-bold uppercase tracking-widest mb-2">Quantity Required</p>
                <p className="text-7xl font-black text-primary mb-8">{currentStop?.qty}</p>
                <Button 
                  onClick={handleNext}
                  disabled={isSpeaking}
                  size="lg"
                  className="w-full h-16 text-xl bg-primary text-black font-black hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(250,204,21,0.4)]"
                >
                  <Mic className="mr-3 h-6 w-6" /> READY
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Button 
              onClick={handleNext}
              disabled={isSpeaking}
              size="lg"
              className="w-full h-16 text-xl bg-white/10 text-white font-bold hover:bg-white/20 border border-white/20"
            >
              <Mic className="mr-3 h-5 w-5" /> Say "READY"
            </Button>
          )}
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-md border-t border-white/10 p-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-6 justify-between">
            <div className="flex-1 w-full flex items-center gap-4">
              <div className="w-12 text-right font-mono text-sm text-white/50">
                {progress}%
              </div>
              <div className="flex-1 h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="w-24 text-sm text-white/50 font-medium text-right">
                {stops.filter(s => s.status === 'picked').length} / {stops.length} stops
              </div>
            </div>
            
            {nextStop && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg border border-white/5">
                <Box className="h-4 w-4 text-white/40" />
                <div>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Next Stop</p>
                  <p className="text-sm font-mono text-white/80">{nextStop.aisle} - {nextStop.slot}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}