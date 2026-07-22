import { supabase } from './supabase'

export interface AuditLogPayload {
  event: string
  category?:
    'Authentication' | 'RBAC & Roles' | 'Storage & Files' | 'Billing & Payments' | 'System Config'
  severity?: 'Info' | 'Warning' | 'Medium' | 'Critical'
  actor_email?: string
  actor_role?: string
  metadata?: Record<string, unknown>
}

export const auditService = {
  async insertLog(payload: AuditLogPayload) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      let email = payload.actor_email || 'anonymous'
      let role = payload.actor_role || 'guest'

      if (user && (!payload.actor_email || !payload.actor_role)) {
        email = user.email || 'anonymous'
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        role = roleData?.role || 'user'
      }

      // Try fetching public IP
      let ip = '127.0.0.1'
      try {
        const response = await fetch('https://api.ipify.org?format=json')
        const ipData = await response.json()
        ip = ipData.ip || '127.0.0.1'
      } catch {
        // use local loopback fallback on error
      }

      const dbPayload = {
        event: payload.event,
        category: payload.category || 'System Config',
        severity: payload.severity || 'Info',
        actor_email: email,
        actor_role: role,
        ip_address: ip,
        user_agent: navigator.userAgent || 'unknown',
        location: 'Local Client',
        metadata: {
          ...(payload.metadata || {}),
          actor_id: user?.id || null,
        },
      }

      const { error } = await supabase.from('audit_logs').insert(dbPayload)
      if (error) {
        console.error('Database write error during audit log insertion:', {
          message: error.message,
          code: error.code,
          details: error.details,
          payload: dbPayload,
        })
      }
    } catch (err) {
      console.error('Audit log insertion encountered an unexpected error:', err)
    }
  },
}
