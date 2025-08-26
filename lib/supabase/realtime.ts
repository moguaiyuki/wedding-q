import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export type GameStateChangeHandler = (payload: any) => void
export type AnswersChangeHandler = (payload: any) => void
export type ParticipantsChangeHandler = (count: number) => void

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private supabase = createClient()
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map()
  
  // Game State subscription with auto-reconnect
  subscribeToGameState(handler: GameStateChangeHandler): () => void {
    const channelName = 'game-state'
    
    // Prevent multiple subscriptions to the same channel
    if (this.channels.has(channelName)) {
      console.log('Already subscribed to game state, skipping...')
      return () => {
        this.unsubscribe(channelName)
      }
    }
    
    const subscribe = () => {
      // Check again to prevent duplicate subscription during reconnect
      if (this.channels.has(channelName)) {
        console.log('Channel already exists, skipping subscribe...')
        return
      }
      
      const channel = this.supabase
        .channel('game-state-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'game_state',
          },
          (payload) => {
            console.log('Game state change:', payload)
            handler(payload)
          }
        )
        .subscribe((status, error) => {
          console.log('Game state subscription status:', status, error)
          
          // Only reconnect on specific errors, not on CLOSED
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.log('Reconnecting game state subscription...')
            this.scheduleReconnect(channelName, subscribe)
          } else if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to game state changes')
          }
        })

      this.channels.set(channelName, channel)
    }
    
    subscribe()

    return () => {
      this.unsubscribe(channelName)
    }
  }

  // Answers subscription for real-time statistics
  subscribeToAnswers(questionId: string, handler: AnswersChangeHandler): () => void {
    const channelName = `answers-${questionId}`
    
    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${questionId}`,
        },
        (payload) => {
          console.log('New answer:', payload)
          handler(payload)
        }
      )
      .subscribe((status) => {
        console.log(`Answers subscription status for ${questionId}:`, status)
      })

    this.channels.set(channelName, channel)

    return () => {
      this.unsubscribe(channelName)
    }
  }

  // User sessions subscription for participant count
  subscribeToParticipants(handler: ParticipantsChangeHandler): () => void {
    const channel = this.supabase
      .channel('participants-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_sessions',
        },
        async () => {
          // Fetch updated count
          const { count } = await this.supabase
            .from('user_sessions')
            .select('*', { count: 'exact', head: true })
            .gte('last_active', new Date(Date.now() - 5 * 60 * 1000).toISOString())

          handler(count || 0)
        }
      )
      .subscribe((status) => {
        console.log('Participants subscription status:', status)
      })

    this.channels.set('participants', channel)

    return () => {
      this.unsubscribe('participants')
    }
  }

  // Schedule reconnection with exponential backoff
  private scheduleReconnect(channelName: string, subscribeFn: () => void) {
    // Prevent scheduling multiple reconnects for the same channel
    if (this.reconnectTimers.has(channelName)) {
      console.log(`Reconnect already scheduled for ${channelName}, skipping...`)
      return
    }
    
    // Unsubscribe existing channel before reconnecting
    const channel = this.channels.get(channelName)
    if (channel) {
      this.channels.delete(channelName) // Remove from map first
      this.supabase.removeChannel(channel) // Then remove channel
    }
    
    // Schedule reconnection after delay
    const timer = setTimeout(() => {
      console.log(`Attempting to reconnect ${channelName}...`)
      this.reconnectTimers.delete(channelName)
      subscribeFn()
    }, 3000) // Reconnect after 3 seconds
    
    this.reconnectTimers.set(channelName, timer)
  }

  // Unsubscribe from a specific channel
  private unsubscribe(channelName: string) {
    // Clear reconnection timer first
    const timer = this.reconnectTimers.get(channelName)
    if (timer) {
      clearTimeout(timer)
      this.reconnectTimers.delete(channelName)
    }
    
    // Then remove channel
    const channel = this.channels.get(channelName)
    if (channel) {
      this.channels.delete(channelName) // Remove from map first
      try {
        this.supabase.removeChannel(channel) // Then remove channel
      } catch (error) {
        console.error(`Error removing channel ${channelName}:`, error)
      }
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    // Clear all reconnection timers
    this.reconnectTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    this.reconnectTimers.clear()
    
    // Remove all channels
    this.channels.forEach((channel) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
  }
}

// Singleton instance
let realtimeManager: RealtimeManager | null = null

export function getRealtimeManager(): RealtimeManager {
  if (!realtimeManager) {
    realtimeManager = new RealtimeManager()
  }
  return realtimeManager
}