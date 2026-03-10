import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, ArrowRight, Info, LogOut, QrCode, Sparkles, Settings, User } from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/QRScanner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { InteractiveGlobe } from "@/components/ui/interactive-globe";
import { ShootingStars } from "@/components/ui/shooting-stars";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const createRoom = () => {
    const newRoomId = nanoid(10);
    toast({ title: "Room created!", description: `Room ID: ${newRoomId}` });
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast({ title: "Error", description: "Please enter a room ID", variant: "destructive" });
      return;
    }
    navigate(`/room/${roomId}`);
  };

  const handleScanSuccess = (decodedText: string) => {
    try {
      const url = new URL(decodedText);
      const pathParts = url.pathname.split('/');
      const scannedRoomId = pathParts[pathParts.length - 1];
      if (scannedRoomId) {
        toast({ title: "Room found!", description: `Joining room: ${scannedRoomId}` });
        setShowScanner(false);
        navigate(`/room/${scannedRoomId}`);
      }
    } catch {
      if (decodedText) {
        toast({ title: "Room found!", description: `Joining room: ${decodedText}` });
        setShowScanner(false);
        navigate(`/room/${decodedText}`);
      } else {
        toast({ title: "Invalid QR Code", description: "Please scan a valid room invite QR code", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Shooting Stars Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <ShootingStars minSpeed={15} maxSpeed={35} minDelay={800} maxDelay={3000} starColor="#7c3aed" trailColor="#06b6d4" starWidth={12} starHeight={1} />
        <ShootingStars minSpeed={10} maxSpeed={25} minDelay={1500} maxDelay={4500} starColor="#06b6d4" trailColor="#7c3aed" starWidth={8} starHeight={1} />
      </div>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 relative z-10">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-primary" />
          <span className="font-semibold text-foreground text-sm">CodeSync</span>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/playground">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Sparkles className="h-4 w-4 mr-1.5" />
              Playground
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Info className="h-4 w-4 mr-1.5" />
              About Us
            </Button>
          </Link>
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4 mr-1.5" />
                  Profile
                </Button>
              </Link>
              <Link to="/settings">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4 mr-1.5" />
                  Settings
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={async () => {
                  await supabase.auth.signOut();
                  toast({ title: "Signed out" });
                }}
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/auth">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="max-w-6xl w-full flex flex-col md:flex-row items-center gap-8 md:gap-16">
          {/* Left: Text + Actions */}
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
                <Code2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Code<span className="text-primary">Sync</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md">
                Real-time collaborative code editor. Write, share, and build together.
              </p>
            </div>

            <div className="space-y-3 max-w-sm mx-auto md:mx-0">
              <Button
                onClick={createRoom}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11"
              >
                Create Room
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <div className="flex gap-2">
                <Input
                  placeholder="Enter room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && joinRoom()}
                  className="bg-input border-border h-11"
                />
                <Button onClick={joinRoom} variant="outline" className="h-11 px-5 border-border">
                  Join
                </Button>
              </div>

              <Button
                onClick={() => setShowScanner(true)}
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <QrCode className="mr-1.5 h-4 w-4" />
                Scan QR Code
              </Button>
            </div>
          </div>

          {/* Right: Globe */}
          <div className="flex-1 flex items-center justify-center max-w-[500px]">
            <InteractiveGlobe
              size={450}
              dotColor="rgba(6, 182, 212, ALPHA)"
              arcColor="rgba(6, 182, 212, 0.45)"
              markerColor="rgba(6, 182, 212, 1)"
              autoRotateSpeed={0.002}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center relative z-10">
        <p className="text-xs text-muted-foreground">Built by Alin and Saidul</p>
      </footer>

      {showScanner && (
        <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Index;
