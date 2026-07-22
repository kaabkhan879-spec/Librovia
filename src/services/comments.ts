import { supabase } from './supabase'
import { auditService } from './audit'

export interface Comment {
  id: string
  userId: string
  bookId: string
  commentText: string
  createdAt: string
  updatedAt: string
}

export const commentsService = {
  async getCommentsForBook(bookId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      bookId: row.book_id,
      commentText: row.comment_text,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }))
  },

  async createComment(bookId: string, commentText: string): Promise<Comment> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        book_id: bookId,
        comment_text: commentText,
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting comment to database:', error)
      throw error
    }

    await auditService.insertLog({
      event: 'Comment Create',
      category: 'Storage & Files',
      severity: 'Info',
      metadata: { commentId: data.id, bookId: data.book_id },
    })

    return {
      id: data.id,
      userId: data.user_id,
      bookId: data.book_id,
      commentText: data.comment_text,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  },

  async deleteComment(id: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('User not authenticated')

    const { data: existing } = await supabase
      .from('comments')
      .select('book_id, user_id')
      .eq('id', id)
      .maybeSingle()

    if (!existing) throw new Error('Comment not found')

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    const isSuperAdmin = roleData?.role === 'super_admin'

    if (existing.user_id !== user.id && !isSuperAdmin) {
      throw new Error('Permission denied. You do not own this comment.')
    }

    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      console.error('Error deleting comment from database:', error)
      throw error
    }

    await auditService.insertLog({
      event: 'Comment Delete',
      category: 'Storage & Files',
      severity: 'Warning',
      metadata: { commentId: id, bookId: existing.book_id },
    })
  },
}
