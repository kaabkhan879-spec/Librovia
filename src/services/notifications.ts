import { supabase } from './supabase'

export interface Notification {
  id: string
  userId: string
  type: 'upload' | 'delete' | 'note' | 'collection' | 'goal' | 'streak' | 'storage' | 'system'
  title: string
  description: string
  isRead: boolean
  createdAt: string
}

const LOCAL_NOTIFICATIONS_KEY = 'librovia-fallback-notifications'

export const notificationsService = {
  // Test if Supabase notifications table is available
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('notifications').select('id').limit(1)
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  async getNotifications(): Promise<Notification[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching notifications from Supabase:', error)
        return this.getLocalNotifications(user.id)
      }

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type as Notification['type'],
        title: row.title,
        description: row.description,
        isRead: row.is_read,
        createdAt: row.created_at,
      }))
    } else {
      return this.getLocalNotifications(user.id)
    }
  },

  async addNotification(
    type: Notification['type'],
    title: string,
    description: string
  ): Promise<Notification> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const isLive = await this.isSupabaseAvailable()
    const now = new Date().toISOString()
    const tempId = Math.random().toString(36).substr(2, 9)

    const newNotif: Notification = {
      id: tempId,
      userId: user.id,
      type,
      title,
      description,
      isRead: false,
      createdAt: now,
    }

    if (isLive) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert({
            user_id: user.id,
            type,
            title,
            description,
            is_read: false,
          })
          .select()
          .single()

        if (error) {
          console.error('Failed to save notification to Supabase:', error)
          this.saveLocalNotification(newNotif)
          return newNotif
        }

        return {
          id: data.id,
          userId: data.user_id,
          type: data.type as Notification['type'],
          title: data.title,
          description: data.description,
          isRead: data.is_read,
          createdAt: data.created_at,
        }
      } catch (err) {
        console.error('Failed to insert notification:', err)
        this.saveLocalNotification(newNotif)
        return newNotif
      }
    } else {
      this.saveLocalNotification(newNotif)
      return newNotif
    }
  },

  async markAsRead(id: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id)

      if (error) {
        console.error('Failed to mark notification as read on Supabase:', error)
        this.markLocalAsRead(id)
      }
    } else {
      this.markLocalAsRead(id)
    }
  },

  async markAllAsRead(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)

      if (error) {
        console.error('Failed to mark all notifications as read on Supabase:', error)
        this.markAllLocalAsRead(user.id)
      }
    } else {
      this.markAllLocalAsRead(user.id)
    }
  },

  async clearAll(): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id)

      if (error) {
        console.error('Failed to clear notifications on Supabase:', error)
        this.clearAllLocal(user.id)
      }
    } else {
      this.clearAllLocal(user.id)
    }
  },

  // Fallback Local Storage Methods
  getLocalNotifications(userId: string): Notification[] {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
      if (!stored) return []
      const list = JSON.parse(stored) as Notification[]
      return list.filter((n) => n.userId === userId)
    } catch {
      return []
    }
  },

  saveLocalNotification(notif: Notification): void {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
      const list = stored ? (JSON.parse(stored) as Notification[]) : []
      list.unshift(notif)
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(list))
    } catch (err) {
      console.error('Failed to write to local notifications cache:', err)
    }
  },

  markLocalAsRead(id: string): void {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
      if (!stored) return
      const list = JSON.parse(stored) as Notification[]
      const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }
  },

  markAllLocalAsRead(userId: string): void {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
      if (!stored) return
      const list = JSON.parse(stored) as Notification[]
      const updated = list.map((n) => (n.userId === userId ? { ...n, isRead: true } : n))
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(updated))
    } catch (err) {
      console.error(err)
    }
  },

  clearAllLocal(userId: string): void {
    try {
      const stored = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY)
      if (!stored) return
      const list = JSON.parse(stored) as Notification[]
      const filtered = list.filter((n) => n.userId !== userId)
      localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(filtered))
    } catch (err) {
      console.error(err)
    }
  },
}
