import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Code2, ArrowRight, Info, LogOut, QrCode } from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { QRScanner } from "@/components/QRScanner";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { PixelTrail } from "@/components/ui/pixel-trail";
import { useScreenSize } from "@/components/hooks/use-screen-size";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const screenSize = useScreenSize();

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
      {/* Pixel Trail Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 24 : 16}
          fadeDuration={800}
          delay={0}
          pixelClassName="bg-primary/20 rounded-full"
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground text-sm">CodeSync</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/about">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4 mr-1.5" />
                About Us
              </Button>
            </Link>
            {user ? (
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
            ) : (
              <Link to="/auth">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Hero */}
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg w-full text-center space-y-10">
            <div className="space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20">
                <Code2 className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground tracking-tight">
                Code<span className="text-primary">Sync</span>
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-md mx-auto">
                Real-time collaborative code editor. Write, share, and build together.
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 max-w-sm mx-auto">
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
        </main>

        {/* Footer */}
        <footer className="py-4 text-center">
          <p className="text-xs text-muted-foreground">Built by Akash Mishra</p>
        </footer>
      </div>

      {showScanner && (
        <QRScanner onScanSuccess={handleScanSuccess} onClose={() => setShowScanner(false)} />
      )}
    </div>
  );
};

export default Index;
