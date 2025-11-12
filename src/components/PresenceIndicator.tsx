import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";

interface UserPresence {
  user_id: string;
  email: string;
  avatar_url?: string;
  online_at: string;
}

interface PresenceIndicatorProps {
  roomId: string;
}

export const PresenceIndicator = ({ roomId }: PresenceIndicatorProps) => {
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUser(user.id);

      // Get user profile for avatar
      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();

      channel = supabase.channel(`room:${roomId}:presence`);

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel!.presenceState();
          const users: UserPresence[] = [];
          Object.values(state).forEach((presences: any) => {
            presences.forEach((presence: any) => {
              if (presence.user_id) {
                users.push(presence as UserPresence);
              }
            });
          });
          setPresence(users);
        })
        .on("presence", { event: "join" }, ({ newPresences }) => {
          console.log("User joined:", newPresences);
        })
        .on("presence", { event: "leave" }, ({ leftPresences }) => {
          console.log("User left:", leftPresences);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel!.track({
              user_id: user.id,
              email: user.email,
              avatar_url: profile?.avatar_url,
              online_at: new Date().toISOString(),
            });
          }
        });
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [roomId]);

  if (presence.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{presence.length} online</span>
      <div className="flex -space-x-2">
        {presence.slice(0, 5).map((user) => (
          <Avatar key={user.user_id} className="h-8 w-8 border-2 border-background">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback className="text-xs">
              {user.email?.charAt(0).toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
        ))}
        {presence.length > 5 && (
          <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
            <span className="text-xs text-muted-foreground">+{presence.length - 5}</span>
          </div>
        )}
      </div>
    </div>
  );
};
