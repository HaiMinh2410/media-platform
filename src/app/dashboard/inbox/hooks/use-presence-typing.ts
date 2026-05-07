'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/infrastructure/supabase/client';
import { getCurrentUserWorkspaceAction } from '@/application/actions/workspace.actions';

export type TypingUser = {
  senderId: string;
  name: string;
  avatar?: string | null;
  timestamp: number;
};

export type PresenceUser = {
  userId: string;
  name: string;
  avatar?: string | null;
  typing?: boolean;
};

export function usePresenceAndTyping(
  conversationId: string,
  customerName: string,
  customerAvatar?: string | null
) {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([]);
  const [me, setMe] = useState<{ userId: string; name: string; avatar?: string | null } | null>(null);

  const supabase = createClient();
  const typingTimers = useRef<{ [senderId: string]: NodeJS.Timeout }>({});

  // 1. Fetch current user info
  useEffect(() => {
    let isMounted = true;
    getCurrentUserWorkspaceAction().then((res) => {
      if (isMounted && res.data?.user) {
        // Generate a stable-ish client-side unique ID for this session
        const userId = `${res.data.user.name}-${Math.random().toString(36).substring(2, 6)}`;
        setMe({
          userId,
          name: res.data.user.name,
          avatar: res.data.user.avatar,
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Setup typing indicator broadcast subscription
  useEffect(() => {
    if (!conversationId) return;

    const channelName = `conversation:${conversationId}`;
    const channel = supabase.channel(channelName);

    channel
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const data = payload.payload;
        if (!data) return;

        const { senderId, eventType } = data;
        console.log('[PresenceTyping] Received typing event:', eventType, 'from:', senderId);

        if (eventType === 'typing_on') {
          // If it's myself, ignore
          if (me && senderId === me.userId) return;

          // Check if this sender ID is one of the active presence agents
          const presUser = presenceUsers.find((u) => u.userId === senderId);
          if (!presUser) return;

          const name = presUser.name;
          const avatar = presUser.avatar;

          setTypingUsers((prev) => {
            const filtered = prev.filter((u) => u.senderId !== senderId);
            return [
              ...filtered,
              {
                senderId,
                name,
                avatar,
                timestamp: Date.now(),
              },
            ];
          });

          // Set/Reset 8 seconds auto-clear timer
          if (typingTimers.current[senderId]) {
            clearTimeout(typingTimers.current[senderId]);
          }
          typingTimers.current[senderId] = setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u.senderId !== senderId));
            delete typingTimers.current[senderId];
          }, 8000);

        } else if (eventType === 'typing_off') {
          setTypingUsers((prev) => prev.filter((u) => u.senderId !== senderId));
          if (typingTimers.current[senderId]) {
            clearTimeout(typingTimers.current[senderId]);
            delete typingTimers.current[senderId];
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Clean up timers on unmount or id change
      Object.values(typingTimers.current).forEach(clearTimeout);
      typingTimers.current = {};
    };
  }, [conversationId, me, presenceUsers, customerName, customerAvatar]);

  // 3. Setup presence subscription
  useEffect(() => {
    if (!conversationId || !me) return;

    const presenceChannelName = `conversation:${conversationId}:presence`;
    const channel = supabase.channel(presenceChannelName);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = Object.values(state)
          .flatMap((presence: any) => presence)
          .map((p: any) => ({
            userId: p.userId,
            name: p.name,
            avatar: p.avatar,
            typing: p.typing || false,
          }));

        // Filter out duplicate user ids
        const uniqueUsers = users.filter(
          (user, index, self) =>
            self.findIndex((u) => u.userId === user.userId) === index
        );

        setPresenceUsers(uniqueUsers);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: me.userId,
            name: me.name,
            avatar: me.avatar,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, me]);

  // 4. Function to broadcast current agent's typing state to database / other agents
  const sendTypingState = async (isTyping: boolean) => {
    if (!conversationId) return;

    try {
      await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isTyping ? 'typing_on' : 'typing_off',
          senderId: me?.userId,
        }),
      });
    } catch (err) {
      console.error('[sendTypingState] Failed to sync typing status:', err);
    }
  };

  return {
    typingUsers,
    presenceUsers,
    sendTypingState,
    me,
  };
}
