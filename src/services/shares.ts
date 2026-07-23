import { supabase } from './supabase'
import { auditService } from './audit'
import { notificationsService } from './notifications'

export interface BookShare {
  id: string
  book_id: string
  owner_id: string
  recipient_id: string
  recipient_email: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
}

export const sharesService = {
  // Check if book_shares table exists in schema cache
  async isSupabaseAvailable(): Promise<boolean> {
    try {
      const { error } = await supabase.from('book_shares').select('id').limit(1)
      if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
        return false
      }
      return !error
    } catch {
      return false
    }
  },

  // Get fallback local shares list
  getLocalShares(): BookShare[] {
    try {
      const stored = localStorage.getItem('librovia-fallback-shares')
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  },

  // Save fallback local shares list
  saveLocalShares(shares: BookShare[]) {
    try {
      localStorage.setItem('librovia-fallback-shares', JSON.stringify(shares))
    } catch (err) {
      console.error(err)
    }
  },

  // Share book
  async shareBook(bookId: string, recipientEmail: string, ownerEmail: string): Promise<BookShare> {
    // 1. Search recipient user
    const { data: recipientRole, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('email', recipientEmail.trim().toLowerCase())
      .maybeSingle()

    if (roleError || !recipientRole) {
      throw new Error('User not found')
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) throw new Error('Not authenticated')

    const ownerId = currentUser.id
    const recipientId = recipientRole.user_id

    // Check if recipient is sharing with themselves
    if (ownerId === recipientId) {
      throw new Error('You cannot share a book with yourself')
    }

    // 2. Fetch recipient subscription details to verify rules
    const { data: recipientSub } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('user_id', recipientId)
      .maybeSingle()

    const recipientPlan = recipientSub?.plan_id || 'free'
    if (recipientPlan === 'free') {
      throw new Error('Free users cannot receive shared books')
    }

    // 3. Fetch owner subscription limits
    const { data: ownerSub } = await supabase
      .from('user_subscriptions')
      .select('plan_id')
      .eq('user_id', ownerId)
      .maybeSingle()

    const ownerPlan = ownerSub?.plan_id || 'free'
    if (ownerPlan === 'free') {
      throw new Error('Free users cannot share books')
    }

    // 4. Count current active shares by owner to verify limits
    const activeSharesCount = await this.getOwnerActiveSharesCount(ownerId)
    const limit = ownerPlan === 'pro' ? 20 : 100 // pro max 20, family max 100
    if (activeSharesCount >= limit) {
      throw new Error(
        `You have reached the sharing limit of ${limit} active shared books for your tier`
      )
    }

    const isLive = await this.isSupabaseAvailable()
    const now = new Date().toISOString()
    const tempId = Math.random().toString(36).substr(2, 9)

    const newShare: BookShare = {
      id: tempId,
      book_id: bookId,
      owner_id: ownerId,
      recipient_id: recipientId,
      recipient_email: recipientEmail.trim().toLowerCase(),
      status: 'pending',
      created_at: now,
      updated_at: now,
    }

    if (isLive) {
      const { data, error } = await supabase
        .from('book_shares')
        .insert({
          book_id: bookId,
          owner_id: ownerId,
          recipient_id: recipientId,
          recipient_email: recipientEmail.trim().toLowerCase(),
          status: 'pending',
        })
        .select()
        .single()

      if (error) throw error
      newShare.id = data.id
    } else {
      const local = this.getLocalShares()
      // Check duplicate
      const duplicate = local.some((s) => s.book_id === bookId && s.recipient_id === recipientId)
      if (duplicate) throw new Error('You have already shared this book with this user')

      local.push(newShare)
      this.saveLocalShares(local)
    }

    // 5. Send notification to recipient
    const { data: bookDetails } = await supabase
      .from('books')
      .select('title')
      .eq('id', bookId)
      .maybeSingle()

    const bookTitle = bookDetails?.title || 'a book'
    const ownerName = ownerEmail.split('@')[0]

    // Create system notification for recipient ID
    await notificationsService.addNotificationForUser(
      recipientId,
      'system',
      '🤝 Shared Library Invite',
      `${ownerName} shared "${bookTitle}" with you.`
    )

    // 6. Insert audit log
    await auditService.insertLog({
      event: 'Book Shared',
      category: 'Storage & Files',
      metadata: { book_id: bookId, recipient_email: recipientEmail, owner_id: ownerId },
    })

    return newShare
  },

  async getOwnerActiveSharesCount(ownerId: string): Promise<number> {
    const isLive = await this.isSupabaseAvailable()
    if (isLive) {
      const { count } = await supabase
        .from('book_shares')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .eq('status', 'accepted')
      return count || 0
    } else {
      const local = this.getLocalShares()
      return local.filter((s) => s.owner_id === ownerId && s.status === 'accepted').length
    }
  },

  // Get books shared by me
  async getSharedByMe(): Promise<any[]> {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) return []

    const isLive = await this.isSupabaseAvailable()
    let rawShares: BookShare[] = []

    if (isLive) {
      const { data, error } = await supabase
        .from('book_shares')
        .select('*')
        .eq('owner_id', currentUser.id)
      if (!error && data) rawShares = data
    } else {
      rawShares = this.getLocalShares().filter((s) => s.owner_id === currentUser.id)
    }

    // Join with book data & recipient data in memory/query
    const result = []
    for (const share of rawShares) {
      const { data: book } = await supabase
        .from('books')
        .select('title, cover_url, author')
        .eq('id', share.book_id)
        .maybeSingle()

      if (book) {
        result.push({
          ...share,
          book_title: book.title,
          book_cover: book.cover_url,
          book_author: book.author,
        })
      }
    }
    return result
  },

  // Get books shared with me
  async getSharedWithMe(): Promise<any[]> {
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()
    if (!currentUser) return []

    const isLive = await this.isSupabaseAvailable()
    let rawShares: BookShare[] = []

    if (isLive) {
      const { data, error } = await supabase
        .from('book_shares')
        .select('*')
        .eq('recipient_id', currentUser.id)
        .eq('status', 'accepted')
      if (!error && data) rawShares = data
    } else {
      rawShares = this.getLocalShares().filter(
        (s) => s.recipient_id === currentUser.id && s.status === 'accepted'
      )
    }

    const result = []
    for (const share of rawShares) {
      const { data: book } = await supabase
        .from('books')
        .select('id, title, cover_url, author, file_url, file_size, user_id')
        .eq('id', share.book_id)
        .maybeSingle()

      const { data: ownerRole } = await supabase
        .from('user_roles')
        .select('email')
        .eq('user_id', share.owner_id)
        .maybeSingle()

      if (book) {
        result.push({
          ...share,
          book_id: book.id,
          book_title: book.title,
          book_cover: book.cover_url,
          book_author: book.author,
          book_file_url: book.file_url,
          book_file_size: book.file_size,
          owner_email: ownerRole?.email || 'Owner',
          user_id: book.user_id, // keep original owner user_id to correctly trigger restrictions
        })
      }
    }
    return result
  },

  // Accept share request
  async acceptShare(shareId: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    let share: BookShare | undefined

    if (isLive) {
      const { data } = await supabase
        .from('book_shares')
        .select('*')
        .eq('id', shareId)
        .maybeSingle()
      if (data) share = data
    } else {
      share = this.getLocalShares().find((s) => s.id === shareId)
    }

    if (!share) return

    if (isLive) {
      await supabase.from('book_shares').update({ status: 'accepted' }).eq('id', shareId)
    } else {
      const local = this.getLocalShares()
      const idx = local.findIndex((s) => s.id === shareId)
      if (idx !== -1) {
        local[idx].status = 'accepted'
        this.saveLocalShares(local)
      }
    }

    // Notify owner
    const { data: recipientRole } = await supabase
      .from('user_roles')
      .select('email')
      .eq('user_id', share.recipient_id)
      .maybeSingle()

    await notificationsService.addNotificationForUser(
      share.owner_id,
      'system',
      '✅ Share Request Accepted',
      `${recipientRole?.email?.split('@')[0]} accepted your share request.`
    )

    // Audit log
    await auditService.insertLog({
      event: 'Book Share Accepted',
      category: 'Storage & Files',
      metadata: { share_id: shareId, book_id: share.book_id, recipient_id: share.recipient_id },
    })
  },

  // Decline share request
  async declineShare(shareId: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    let share: BookShare | undefined

    if (isLive) {
      const { data } = await supabase
        .from('book_shares')
        .select('*')
        .eq('id', shareId)
        .maybeSingle()
      if (data) share = data
    } else {
      share = this.getLocalShares().find((s) => s.id === shareId)
    }

    if (!share) return

    if (isLive) {
      await supabase.from('book_shares').update({ status: 'declined' }).eq('id', shareId)
    } else {
      const local = this.getLocalShares()
      const idx = local.findIndex((s) => s.id === shareId)
      if (idx !== -1) {
        local[idx].status = 'declined'
        this.saveLocalShares(local)
      }
    }

    // Notify owner
    const { data: recipientRole } = await supabase
      .from('user_roles')
      .select('email')
      .eq('user_id', share.recipient_id)
      .maybeSingle()

    await notificationsService.addNotificationForUser(
      share.owner_id,
      'system',
      '❌ Share Request Declined',
      `${recipientRole?.email?.split('@')[0]} declined your share request.`
    )

    // Audit log
    await auditService.insertLog({
      event: 'Book Share Declined',
      category: 'Storage & Files',
      metadata: { share_id: shareId, book_id: share.book_id, recipient_id: share.recipient_id },
    })
  },

  // Remove access (by owner) or remove shared book (by recipient)
  async removeShare(shareId: string, actorId: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    let share: BookShare | undefined

    if (isLive) {
      const { data } = await supabase
        .from('book_shares')
        .select('*')
        .eq('id', shareId)
        .maybeSingle()
      if (data) share = data
    } else {
      share = this.getLocalShares().find((s) => s.id === shareId)
    }

    if (!share) return

    if (isLive) {
      await supabase.from('book_shares').delete().eq('id', shareId)
    } else {
      const local = this.getLocalShares()
      const updated = local.filter((s) => s.id !== shareId)
      this.saveLocalShares(updated)
    }

    // If owner removed access, notify recipient
    if (actorId === share.owner_id) {
      await notificationsService.addNotificationForUser(
        share.recipient_id,
        'system',
        '🔒 Shared Access Removed',
        `The owner removed access to this book.`
      )

      await auditService.insertLog({
        event: 'Book Access Removed',
        category: 'Storage & Files',
        metadata: { share_id: shareId, book_id: share.book_id, recipient_id: share.recipient_id },
      })
    } else {
      // Recipient declined/removed it
      await auditService.insertLog({
        event: 'Book Share Declined',
        category: 'Storage & Files',
        metadata: { share_id: shareId, book_id: share.book_id, recipient_id: share.recipient_id },
      })
    }
  },

  // Get details of users a book is shared with
  async getBookSharedUsers(bookId: string): Promise<any[]> {
    const isLive = await this.isSupabaseAvailable()
    let sharesList: BookShare[] = []

    if (isLive) {
      const { data } = await supabase.from('book_shares').select('*').eq('book_id', bookId)
      if (data) sharesList = data
    } else {
      sharesList = this.getLocalShares().filter((s) => s.book_id === bookId)
    }

    const result = []
    for (const share of sharesList) {
      // Find full name / tier
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('email, created_at')
        .eq('user_id', share.recipient_id)
        .maybeSingle()

      const { data: sub } = await supabase
        .from('user_subscriptions')
        .select('plan_id')
        .eq('user_id', share.recipient_id)
        .maybeSingle()

      const email = share.recipient_email
      result.push({
        id: share.id,
        recipient_id: share.recipient_id,
        name: email.split('@')[0],
        email: email,
        plan_id: sub?.plan_id || 'free',
        status: share.status,
        joined_date: userRole?.created_at
          ? new Date(userRole.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
            })
          : 'N/A',
      })
    }
    return result
  },

  // Called by owner deleteBook
  async handleBookDeleted(bookId: string, bookTitle: string): Promise<void> {
    const isLive = await this.isSupabaseAvailable()
    let sharesList: BookShare[] = []

    if (isLive) {
      const { data } = await supabase.from('book_shares').select('*').eq('book_id', bookId)
      if (data) sharesList = data
      await supabase.from('book_shares').delete().eq('book_id', bookId)
    } else {
      sharesList = this.getLocalShares().filter((s) => s.book_id === bookId)
      const local = this.getLocalShares()
      const updated = local.filter((s) => s.book_id !== bookId)
      this.saveLocalShares(updated)
    }

    // Notify recipients
    for (const share of sharesList) {
      await notificationsService.addNotificationForUser(
        share.recipient_id,
        'system',
        '🔒 Shared Book Removed',
        `The original book "${bookTitle}" has been removed by the owner.`
      )
    }

    // Insert audit log
    await auditService.insertLog({
      event: 'Book Removed By Owner',
      category: 'Storage & Files',
      metadata: { book_id: bookId, title: bookTitle },
    })
  },
}
