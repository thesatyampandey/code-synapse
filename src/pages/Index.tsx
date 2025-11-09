import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Users, Zap, MessageSquare, ArrowRight, Info, Settings, Sparkles } from "lucide-react";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roomId, setRoomId] = useState("");

  const createRoom = () => {
    const newRoomId = nanoid(10);
    toast({
      title: "Room created!",
      description: `Room ID: ${newRoomId}`,
    });
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a room ID",
        variant: "destructive",
      });
      return;
    }
    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-background dark flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <Code2 className="h-6 w-6 text-primary" />
          <span className="font-semibold text-foreground">CodeSync</span>
        </div>
        <div className="flex gap-2">
          <Link to="/playground">
            <Button variant="ghost" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Playground
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="ghost" size="sm">
              Profile
            </Button>
          </Link>
          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" size="sm">
              <Info className="h-4 w-4 mr-2" />
              About Us
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-4xl w-full text-center space-y-8">
          {/* Logo & Title */}
          <div className="space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary shadow-glow">
              <Code2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-foreground tracking-tight">
              Code<span className="text-primary">Sync</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Real-time collaborative code editor. Write, share, and build together with your team.
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
            <Card className="bg-card border-border hover:border-primary transition-smooth shadow-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Create Room
                </CardTitle>
                <CardDescription>Start a new collaborative session</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={createRoom}
                  className="w-full bg-gradient-primary hover:opacity-90 text-white font-medium shadow-glow"
                >
                  Create New Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border hover:border-primary transition-smooth shadow-panel">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-secondary" />
                  Join Room
                </CardTitle>
                <CardDescription>Enter an existing room ID</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="Enter room ID..."
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                  className="bg-input border-border focus:border-primary"
                />
                <Button 
                  onClick={joinRoom}
                  variant="secondary"
                  className="w-full"
                >
                  Join Room
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto mt-16">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Real-time Editing</h3>
              <p className="text-sm text-muted-foreground">
                See changes instantly as your team codes together
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Built-in Chat</h3>
              <p className="text-sm text-muted-foreground">
                Communicate with your team without leaving the editor
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Monaco Editor</h3>
              <p className="text-sm text-muted-foreground">
                Powered by the same engine as VS Code
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="h-16 border-t border-border flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Built by Akash Mishra
        </p>
      </footer>
    </div>
  );
};

export default Index;
