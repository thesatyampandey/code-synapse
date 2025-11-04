import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, User, Mail, Calendar, Code2, Users, FileCode, Smile } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const Profile = () => {
  const { toast } = useToast();
  const [username, setUsername] = useState("User123");
  const [email, setEmail] = useState("user@example.com");
  const [bio, setBio] = useState("Passionate developer and collaborative coding enthusiast");
  const [profileEmoji, setProfileEmoji] = useState("👨‍💻");

  const emojis = ["👨‍💻", "👩‍💻", "🧑‍💻", "😎", "🤓", "🚀", "💻", "⚡", "🔥", "✨", "🎯", "🎨", "🎮", "🎵", "🌟", "💡", "🦄", "🐱", "🐶", "🦊"];

  const saveProfile = () => {
    toast({
      title: "Profile updated",
      description: "Your changes have been saved successfully",
    });
  };

  const stats = [
    { label: "Rooms Created", value: "12", icon: Users },
    { label: "Sessions Joined", value: "28", icon: Code2 },
    { label: "Files Edited", value: "156", icon: FileCode },
  ];

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="h-16 border-b border-border flex items-center px-6">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile Header */}
        <div className="flex items-center gap-6">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-border hover:ring-primary transition-all">
                  <AvatarFallback className="bg-gradient-primary text-white text-5xl">
                    {profileEmoji}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <Smile className="h-8 w-8 text-white" />
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-card border-border">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-foreground mb-3">Choose Profile Emoji</h4>
                <div className="grid grid-cols-5 gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setProfileEmoji(emoji)}
                      className={`text-3xl p-2 rounded-lg hover:bg-muted transition-colors ${
                        profileEmoji === emoji ? 'bg-primary/20 ring-2 ring-primary' : ''
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{username}</h1>
            <p className="text-muted-foreground mt-1">{email}</p>
          </div>
        </div>

        <Separator />

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="bg-card border-border">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <stat.icon className="h-8 w-8 text-primary mb-2" />
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Edit Profile */}
        <Card className="bg-card border-border shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Edit Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-input border-border"
              />
            </div>

            <Button onClick={saveProfile} className="bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border shadow-panel">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest coding sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { room: "Project Alpha", time: "2 hours ago", action: "Edited index.tsx" },
              { room: "React Workshop", time: "5 hours ago", action: "Created components.tsx" },
              { room: "Team Collab", time: "1 day ago", action: "Fixed bug in utils.ts" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <div className="font-medium text-foreground">{activity.room}</div>
                  <div className="text-sm text-muted-foreground">{activity.action}</div>
                </div>
                <div className="text-xs text-muted-foreground">{activity.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
