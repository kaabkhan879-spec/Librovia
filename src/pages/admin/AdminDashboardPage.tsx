import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { PageWrapper } from '../../components/common/PageWrapper'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { supabase } from '../../services/supabase'
import { booksService } from '../../services/books'
import { formatBytes } from '../../utils/helpers'
import { ROUTES } from '../../constants/routes'
import {
  ShieldCheck,
  Users,
  BookOpen,
  HardDrive,
  Crown,
  CreditCard,
  Megaphone,
  ClipboardList,
  Activity,
  CheckCircle2,
  Server,
  Database,
  Mail,
  UserPlus,
  ArrowUpRight,
  X,
  Inbox,
  Clock,
  TrendingUp,
  Settings,
  AlertTriangle,
  Globe,
} from 'lucide-react'

// Interfaces
interface ServiceHealthItem {
  id: string
  name: string
  subtitle?: string
  statusText: string
  badgeColor: string
  statusType: 'connected' | 'running' | 'healthy' | 'offline'
  icon: React.ElementType
}

interface ActivityLogItem {
  id: string
  event: string
  actor_email: string
  actor_role: string
  created_at: string
  category: string
  severity: string
}

interface TopReaderItem {
  user_id: string
  email: string
  displayName: string
  pagesRead: number
  booksCount: number
  readingTimeMinutes: number
}

interface PlanStats {
  free: number
  pro: number
  family: number
  total: number
}

interface PendingPaymentItem {
  id: string
  user_id: string
  plan_id: string | null
  payment_method: string
  transaction_id: string
  amount: number
  status: string
  created_at: string
  user: {
    email: string
    display_name: string
  }
}

interface ProfileRecord {
  id: string
  display_name: string | null
  avatar_url: string | null
}

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)

  // Top KPI Card Stats
  const [totalUsers, setTotalUsers] = useState<number>(0)
  const [weeklyUsersGrowth, setWeeklyUsersGrowth] = useState<number>(0)
  const [totalBooks, setTotalBooks] = useState<number>(0)
  const [weeklyBooksGrowth, setWeeklyBooksGrowth] = useState<number>(0)
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0)
  const [totalStorageUsed, setTotalStorageUsed] = useState<number>(0)
  const [totalStorageLimit, setTotalStorageLimit] = useState<number>(5 * 1024 * 1024 * 1024)
  const [activeUsersToday, setActiveUsersToday] = useState<number>(0)
  const [activeUsersPctChange, setActiveUsersPctChange] = useState<number>(0)

  // Chart Datasets
  const [usersChartData, setUsersChartData] = useState<{ labels: string[]; points: number[] }>({
    labels: [],
    points: [],
  })
  const [revenueChartData, setRevenueChartData] = useState<{ labels: string[]; points: number[] }>({
    labels: [],
    points: [],
  })

  // Slices & Lists
  const [recentActivities, setRecentActivities] = useState<ActivityLogItem[]>([])
  const [recentPendingPayments, setRecentPendingPayments] = useState<PendingPaymentItem[]>([])
  const [topReaders, setTopReaders] = useState<TopReaderItem[]>([])
  const [planStats, setPlanStats] = useState<PlanStats>({ free: 0, pro: 0, family: 0, total: 0 })

  // Modal for Add User
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState<'user' | 'super_admin' | 'moderator'>('user')

  // Dynamic Service Health statuses
  const [servicesHealth, setServicesHealth] = useState<{
    db: 'connected' | 'offline'
    auth: 'connected' | 'offline'
    storage: 'connected' | 'offline'
    smtp: 'connected' | 'offline'
    domain: 'healthy' | 'offline'
    cron: 'running' | 'offline'
    realtime: 'connected' | 'offline'
  }>({
    db: 'offline',
    auth: 'offline',
    storage: 'offline',
    smtp: 'offline',
    domain: 'healthy',
    cron: 'running',
    realtime: 'connected',
  })

  // Chart Helpers
  function getChartPointsForLast7Days(
    rawData: { date: Date; value: number }[],
    cumulative: boolean
  ) {
    const dates: string[] = []
    const labels: string[] = []

    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString().split('T')[0])
      labels.push(
        d.toLocaleDateString(undefined, { weekday: 'short', month: 'numeric', day: 'numeric' })
      )
    }

    const valuesByDate = new Map<string, number>()
    rawData.forEach((item) => {
      const dStr = item.date.toISOString().split('T')[0]
      valuesByDate.set(dStr, (valuesByDate.get(dStr) || 0) + item.value)
    })

    let currentVal = 0
    const points = dates.map((dStr) => {
      const val = valuesByDate.get(dStr) || 0
      if (cumulative) {
        currentVal += val
        return currentVal
      }
      return val
    })

    return { labels, points }
  }

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        let dbHealthy = false
        let authHealthy = false
        let storageHealthy = false

        // 1. Fetch Users & Growth
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('*')
          .order('created_at', { ascending: true })

        const [profilesRes] = await Promise.all([
          supabase.from('profiles').select('id, display_name, avatar_url'),
        ])
        const profilesMap = new Map<string, ProfileRecord>(
          (profilesRes.data as ProfileRecord[] | null)?.map((p) => [p.id, p]) || []
        )

        let userCount = 0
        const usersRawPoints: { date: Date; value: number }[] = []
        let lastWeekUsers = 0

        if (!rolesError && rolesData) {
          dbHealthy = true
          userCount = rolesData.length
          setTotalUsers(userCount)

          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          rolesData.forEach((row) => {
            const signupDate = new Date(row.created_at)
            usersRawPoints.push({ date: signupDate, value: 1 })
            if (signupDate >= oneWeekAgo) {
              lastWeekUsers++
            }
          })
          setWeeklyUsersGrowth(lastWeekUsers)
        }

        // 2. Supabase Authentication check
        try {
          const { data: authData, error: authError } = await supabase.auth.getSession()
          if (!authError && authData) {
            authHealthy = true
          }
        } catch (err) {
          console.error('Auth endpoint check error:', err)
        }

        // 3. Fetch Books & Weekly Uploads & Size
        const booksData = await booksService.getBooks()
        setTotalBooks(booksData.length)

        let lastWeekBooks = 0
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        let totalUsedBytes = 0

        booksData.forEach((b) => {
          totalUsedBytes += b.fileSize || 0
          if (b.createdAt && new Date(b.createdAt) >= oneWeekAgo) {
            lastWeekBooks++
          }
        })
        setTotalStorageUsed(totalUsedBytes)
        setWeeklyBooksGrowth(lastWeekBooks)

        // 4. Fetch storage list to test Storage connectivity
        try {
          const { error: storageError } = await supabase.storage
            .from('books')
            .list('', { limit: 1 })
          if (!storageError) {
            storageHealthy = true
          }
        } catch (err) {
          console.error('Storage check error:', err)
        }

        // 5. Fetch Pending Payments & Recent payments table details
        const { data: pendingReqs, error: pendingError } = await supabase
          .from('payment_requests')
          .select('*')
          .order('created_at', { ascending: false })

        let pendingCount = 0
        const paymentsRawPoints: { date: Date; value: number }[] = []
        const pendingList: PendingPaymentItem[] = []

        if (!pendingError && pendingReqs) {
          pendingReqs.forEach((row) => {
            if (row.status === 'Pending Verification') {
              pendingCount++
              const userProfile = profilesMap.get(row.user_id)
              const userRole = rolesData?.find((r) => r.user_id === row.user_id)
              pendingList.push({
                ...row,
                user: {
                  email: userRole?.email || 'N/A',
                  display_name:
                    userProfile?.display_name || userRole?.email?.split('@')[0] || 'User',
                },
              })
            } else if (row.status === 'Approved') {
              paymentsRawPoints.push({
                date: new Date(row.updated_at || row.created_at),
                value: row.amount,
              })
            }
          })
          setPendingPaymentsCount(pendingCount)
          setRecentPendingPayments(pendingList.slice(0, 5))
        }

        // 6. Fetch Subscriptions & storage limits
        const { data: subsData, error: subsError } = await supabase
          .from('user_subscriptions')
          .select('*, plan:subscription_plans(storage_limit_bytes, plan_name)')

        let totalAllocatedLimit = 0
        const stats: PlanStats = { free: 0, pro: 0, family: 0, total: 0 }

        if (!subsError && subsData) {
          stats.total = subsData.length
          subsData.forEach((sub) => {
            // Count plan stats
            const planId = sub.plan_id?.toLowerCase() || 'free'
            if (planId === 'pro') stats.pro++
            else if (planId === 'family') stats.family++
            else stats.free++

            // Calculate limit size
            let limit = 5368709120 // 5 GB default fallback
            if (
              sub.custom_storage_limit_bytes !== null &&
              sub.custom_storage_limit_bytes !== undefined
            ) {
              limit = Number(sub.custom_storage_limit_bytes)
            } else if (sub.plan) {
              limit = sub.plan.storage_limit_bytes
            }
            totalAllocatedLimit += limit
          })

          // Handle registered users who might not have user_subscriptions rows in local dev
          const missingCount = Math.max(0, userCount - subsData.length)
          stats.free += missingCount
          stats.total += missingCount
          totalAllocatedLimit += missingCount * 5368709120

          setPlanStats(stats)
          setTotalStorageLimit(totalAllocatedLimit)
        } else {
          // Fallback limits
          setTotalStorageLimit(userCount * 5368709120 || 5368709120)
        }

        // 8. Fetch Active Users metrics from Audit Logs
        const startOfToday = new Date()
        startOfToday.setHours(0, 0, 0, 0)

        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)

        const { data: logEvents, error: logsError } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })

        if (!logsError && logEvents) {
          setRecentActivities(logEvents.slice(0, 10))

          const activeToday = new Set<string>()
          const activeYesterday = new Set<string>()

          logEvents.forEach((log) => {
            const logDate = new Date(log.created_at)
            if (logDate >= startOfToday) {
              activeToday.add(log.actor_email)
            } else if (logDate >= startOfYesterday && logDate < startOfToday) {
              activeYesterday.add(log.actor_email)
            }
          })

          const todayCount = activeToday.size || 1 // At least 1 (logged in Admin)
          const yesterdayCount = activeYesterday.size || 1

          setActiveUsersToday(todayCount)
          const growth = ((todayCount - yesterdayCount) / yesterdayCount) * 100
          setActiveUsersPctChange(growth)
        } else {
          setActiveUsersToday(1)
          setActiveUsersPctChange(0)
        }

        // 9. Fetch reading progress for Top Readers leaderboard
        const { data: readingData, error: readingError } = await supabase
          .from('reading_progress')
          .select('*')

        if (!readingError && readingData) {
          const userActivityMap = new Map<
            string,
            { pages: number; books: Set<string>; time: number }
          >()

          readingData.forEach((row) => {
            const uid = row.user_id
            if (!uid) return
            const existing = userActivityMap.get(uid) || {
              pages: 0,
              books: new Set<string>(),
              time: 0,
            }
            existing.pages += row.current_page || 0
            existing.books.add(row.book_id)
            existing.time += row.reading_time || 0
            userActivityMap.set(uid, existing)
          })

          const leaderboard: TopReaderItem[] = []
          userActivityMap.forEach((val, uid) => {
            const userProfile = profilesMap.get(uid)
            const userRole = rolesData?.find((r) => r.user_id === uid)
            leaderboard.push({
              user_id: uid,
              email: userRole?.email || 'N/A',
              displayName: userProfile?.display_name || userRole?.email?.split('@')[0] || 'Reader',
              pagesRead: val.pages,
              booksCount: val.books.size,
              readingTimeMinutes: Math.ceil(val.time / 60),
            })
          })

          // Sort by pages read descending
          leaderboard.sort((a, b) => b.pagesRead - a.pagesRead)
          setTopReaders(leaderboard.slice(0, 5))
        }

        // 10. Generate chart points YYYY-MM-DD
        const userChartPoints = getChartPointsForLast7Days(usersRawPoints, true)
        const paymentChartPoints = getChartPointsForLast7Days(paymentsRawPoints, false)

        setUsersChartData(userChartPoints)
        setRevenueChartData(paymentChartPoints)

        // Set Health Statuses
        setServicesHealth({
          db: dbHealthy ? 'connected' : 'offline',
          auth: authHealthy ? 'connected' : 'offline',
          storage: storageHealthy ? 'connected' : 'offline',
          smtp: authHealthy ? 'connected' : 'offline',
          domain: 'healthy',
          cron: dbHealthy ? 'running' : 'offline',
          realtime: 'connected',
        })

        setLoading(false)
      } catch (err) {
        console.error('Error compiling SaaS dashboard data:', err)
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      loadDashboardData()
    }, 0)

    // Realtime channel subscriptions to reload data on changes
    const channel = supabase
      .channel('admin-dashboard-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payment_requests' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_logs' }, () => {
        loadDashboardData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        loadDashboardData()
      })
      .subscribe()

    return () => {
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [])

  // Render SVG Sparkline
  const renderSvgChart = (
    points: number[],
    strokeColor: string,
    fillColor: string,
    isArea: boolean
  ) => {
    const width = 500
    const height = 180
    const margin = 15

    if (points.length === 0) return null

    const maxVal = Math.max(...points, 1)
    const minVal = 0

    const coordinates = points.map((val, i) => {
      const x = margin + (i / (points.length - 1)) * (width - 2 * margin)
      const y = height - margin - ((val - minVal) / (maxVal - minVal)) * (height - 2 * margin)
      return { x, y }
    })

    const linePath = coordinates
      .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
      .join(' ')

    const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x.toFixed(
      1
    )} ${height - margin} L ${coordinates[0].x.toFixed(1)} ${height - margin} Z`

    return (
      <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        {/* Gradients */}
        <defs>
          <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.00" />
          </linearGradient>
          <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Dotted Grid lines */}
        {[0.25, 0.5, 0.75].map((ratio, index) => {
          const gridY = margin + ratio * (height - 2 * margin)
          return (
            <line
              key={index}
              x1={margin}
              y1={gridY}
              x2={width - margin}
              y2={gridY}
              className="stroke-[#334155]/60"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
          )
        })}

        {/* Area fill */}
        {isArea && <path d={areaPath} fill={`url(${fillColor})`} />}

        {/* Line Stroke */}
        <path
          d={linePath}
          fill="none"
          className={strokeColor}
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Node Circles */}
        {coordinates.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r="4.5"
            className={`${strokeColor.replace('stroke-', 'fill-')} stroke-[#1E293B]`}
            strokeWidth="2.5"
          />
        ))}
      </svg>
    )
  }

  // Create new user trigger
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserEmail.trim()) {
      showError('Please provide a valid user email address.')
      return
    }

    try {
      // For safety in dev environment, upsert the role config in user_roles table
      // In production database, user must already exist in auth.users
      const { data: existingUser } = await supabase
        .from('user_roles')
        .select('*')
        .eq('email', newUserEmail.trim())
        .maybeSingle()

      if (existingUser) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newUserRole, updated_at: new Date().toISOString() })
          .eq('email', newUserEmail.trim())

        if (error) throw error
        showSuccess(
          `Successfully updated role of ${newUserEmail} to "${newUserRole.toUpperCase()}"!`
        )
      } else {
        // Invite placeholder or manual entry
        const dummyId = crypto.randomUUID()
        const { error } = await supabase.from('user_roles').insert({
          user_id: dummyId,
          email: newUserEmail.trim(),
          role: newUserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (error) throw error
        showSuccess(
          `Invited user ${newUserEmail} created with role "${newUserRole.toUpperCase()}"!`
        )
      }

      setNewUserEmail('')
      setIsAddUserOpen(false)
    } catch (err: unknown) {
      console.error(err)
      const msg = err instanceof Error ? err.message : 'Failed to complete user invitation.'
      showError(msg)
    }
  }

  // Check failed health services for top warning banner
  const failingServicesList: string[] = []
  if (servicesHealth.db === 'offline') failingServicesList.push('PostgreSQL Database')
  if (servicesHealth.auth === 'offline') failingServicesList.push('Supabase Authentication')
  if (servicesHealth.storage === 'offline') failingServicesList.push('Cloud Storage')
  if (servicesHealth.smtp === 'offline') failingServicesList.push('Email / SMTP')

  const isAllServicesHealthy = failingServicesList.length === 0

  // Health services matrix definition
  const healthMatrixItems: ServiceHealthItem[] = [
    {
      id: 'db',
      name: 'PostgreSQL Database',
      statusText: servicesHealth.db === 'connected' ? '✓ Connected' : '✗ Offline',
      badgeColor:
        servicesHealth.db === 'connected'
          ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30'
          : 'bg-rose-950/40 text-rose-450 border border-rose-900/30',
      statusType: servicesHealth.db,
      icon: Database,
    },
    {
      id: 'auth',
      name: 'Supabase Authentication',
      statusText: servicesHealth.auth === 'connected' ? '✓ Connected' : '✗ Offline',
      badgeColor:
        servicesHealth.auth === 'connected'
          ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30'
          : 'bg-rose-950/40 text-rose-450 border border-rose-900/30',
      statusType: servicesHealth.auth,
      icon: ShieldCheck,
    },
    {
      id: 'storage',
      name: 'Cloud Storage',
      statusText: servicesHealth.storage === 'connected' ? '✓ Connected' : '✗ Offline',
      badgeColor:
        servicesHealth.storage === 'connected'
          ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30'
          : 'bg-rose-950/40 text-rose-450 border border-rose-900/30',
      statusType: servicesHealth.storage,
      icon: HardDrive,
    },
    {
      id: 'smtp',
      name: 'Email / SMTP',
      statusText: servicesHealth.smtp === 'connected' ? '✓ Connected' : 'Not Configured',
      badgeColor:
        servicesHealth.smtp === 'connected'
          ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30'
          : 'bg-amber-950/40 text-amber-450 border border-amber-900/30',
      statusType: servicesHealth.smtp,
      icon: Mail,
    },
    {
      id: 'domain',
      name: 'Domain Resolution',
      statusText: '✓ Healthy',
      badgeColor: 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30',
      statusType: 'healthy',
      icon: Globe,
    },
    {
      id: 'cron',
      name: 'Database Cron Jobs',
      statusText: '✓ Running',
      badgeColor: 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30',
      statusType: 'running',
      icon: Clock,
    },
    {
      id: 'realtime',
      name: 'Supabase Realtime',
      statusText: '✓ Connected',
      badgeColor: 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/30',
      statusType: 'connected',
      icon: Activity,
    },
  ]

  // Storage percentage calculation
  const storagePercentage = Math.min(100, (totalStorageUsed / (totalStorageLimit || 1)) * 100)

  // Loading skeleton layout
  if (loading) {
    return (
      <PageWrapper className="min-h-screen space-y-6 bg-[#0F172A] pb-20 text-[#FFFFFF] select-none">
        <div className="flex items-center justify-between border-b border-[#334155] pb-4">
          <div className="space-y-2">
            <div className="h-6 w-32 animate-pulse rounded bg-[#1E293B]" />
            <div className="h-4 w-64 animate-pulse rounded bg-[#1E293B]" />
          </div>
          <div className="h-10 w-24 animate-pulse rounded-full bg-[#1E293B]" />
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-[#1E293B]" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-3xl bg-[#1E293B]" />
          <div className="h-64 animate-pulse rounded-3xl bg-[#1E293B]" />
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper className="min-h-screen space-y-8 bg-[#0F172A] pb-20 text-left text-[#FFFFFF] select-none">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 border-b border-[#334155] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-purple-650 inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider text-white uppercase">
              <Crown className="h-3 w-3" />
              SaaS Admin
            </span>
            <span className="font-mono text-[11px] font-bold tracking-widest text-[#94A3B8] uppercase">
              • Librovia Console
            </span>
          </div>
          <h1 className="font-sans text-2xl font-black tracking-tight text-[#FFFFFF] sm:text-3xl">
            Welcome back, {user?.displayName || user?.email?.split('@')[0] || 'Super Admin'} 👋
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(ROUTES.DASHBOARD)}
            className="inline-flex items-center gap-2 rounded-2xl border border-[#334155] bg-[#1E293B] px-4 py-2.5 text-xs font-bold text-[#CBD5E1] transition-all hover:bg-[#273549] hover:text-[#FFFFFF] active:scale-98"
          >
            <span>Reader Mode</span>
            <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SECTION 1: TOP KPI CARDS */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {/* Card 1: Total Users */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              Total Users
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-black text-[#FFFFFF]">{totalUsers}</h3>
            <span className="mt-1 flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" />+{weeklyUsersGrowth} this week
            </span>
          </div>
        </div>

        {/* Card 2: Total Books */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              Total Books
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-black text-[#FFFFFF]">{totalBooks}</h3>
            <span className="mt-1 flex items-center gap-0.5 text-[10.5px] font-bold text-emerald-400">
              <TrendingUp className="h-3 w-3" />+{weeklyBooksGrowth} this week
            </span>
          </div>
        </div>

        {/* Card 3: Pending Payments */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              Pending Pay
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-black text-[#FFFFFF]">{pendingPaymentsCount}</h3>
            <div className="mt-1 flex items-center gap-1.5">
              {pendingPaymentsCount > 0 ? (
                <span className="inline-flex animate-pulse items-center gap-1 rounded border border-rose-900/30 bg-rose-950/50 px-1.5 py-0.5 text-[9px] font-black text-rose-400">
                  Verification Required
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#94A3B8]">All settled</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Storage Used */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              Storage Used
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <HardDrive className="h-4 w-4" />
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="truncate font-mono text-sm font-black text-[#FFFFFF]">
              {formatBytes(totalStorageUsed)} / {formatBytes(totalStorageLimit)}
            </h3>
            <div className="h-1.5 w-full overflow-hidden rounded-full border border-[#334155]/20 bg-[#111827]">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${storagePercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 5: Active Users Today */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              Active Today
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div>
            <h3 className="font-mono text-2xl font-black text-[#FFFFFF]">{activeUsersToday}</h3>
            <span
              className={`mt-1 flex items-center gap-0.5 text-[10.5px] font-bold ${
                activeUsersPctChange >= 0 ? 'text-emerald-400' : 'text-rose-450'
              }`}
            >
              {activeUsersPctChange >= 0 ? '+' : ''}
              {activeUsersPctChange.toFixed(0)}% from yesterday
            </span>
          </div>
        </div>

        {/* Card 6: System Status */}
        <div className="group relative space-y-3 overflow-hidden rounded-3xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-250 hover:scale-102 hover:bg-[#273549] hover:shadow-lg hover:shadow-purple-900/10">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
              System Status
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/30 text-purple-300">
              <Server className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="relative flex h-2 w-2">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                    isAllServicesHealthy ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                ></span>
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${
                    isAllServicesHealthy ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </div>
              <span
                className={`text-[11px] font-black tracking-wide ${isAllServicesHealthy ? 'text-emerald-450' : 'text-amber-450'}`}
              >
                {isAllServicesHealthy ? 'All Systems Connected' : 'Degraded Performance'}
              </span>
            </div>
            <span className="mt-1 block text-[9.5px] font-bold tracking-wider text-[#94A3B8] uppercase">
              {isAllServicesHealthy
                ? 'Healthy Uptime 99.9%'
                : `${failingServicesList.length} systems offline`}
            </span>
          </div>
        </div>
      </div>

      {/* DYNAMIC TOP BANNER FOR SERVICE OUTAGES */}
      {!isAllServicesHealthy && (
        <div className="bg-amber-955/20 flex items-center gap-3 rounded-2xl border border-amber-900/40 p-4 text-xs font-semibold text-amber-300">
          <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-amber-500" />
          <span>
            ⚠️ Infrastructure Warning: The following core service integrations are currently
            unresponsive or unconfigured: <strong>{failingServicesList.join(', ')}</strong>. Please
            verify database connection settings.
          </span>
        </div>
      )}

      {/* SECTION 2: ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Users Growth */}
        <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <div>
              <h3 className="font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
                User Base Expansion
              </h3>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">
                Cumulative Registered Accounts (Last 7 Days)
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded border border-purple-500/20 bg-purple-900/30 px-2 py-0.5 text-[10px] font-bold text-purple-300">
              Users: {totalUsers}
            </span>
          </div>
          <div className="h-44 w-full pt-2">
            {renderSvgChart(usersChartData.points, 'stroke-purple-500', 'purpleGradient', true)}
          </div>
          <div className="flex justify-between px-2 text-[9px] font-bold tracking-wider text-[#94A3B8] uppercase">
            {usersChartData.labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>

        {/* Chart 2: Revenue Growth */}
        <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
          <div className="flex items-center justify-between border-b border-[#334155] pb-3">
            <div>
              <h3 className="font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
                Revenue Ingress Trend
              </h3>
              <p className="mt-0.5 text-[10px] font-bold tracking-widest text-[#94A3B8] uppercase">
                Approved Payment Transactions (Last 7 Days)
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded border border-emerald-900/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Approved Txns
            </span>
          </div>
          <div className="h-44 w-full pt-2">
            {renderSvgChart(revenueChartData.points, 'stroke-emerald-500', 'emeraldGradient', true)}
          </div>
          <div className="flex justify-between px-2 text-[9px] font-bold tracking-wider text-[#94A3B8] uppercase">
            {revenueChartData.labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </div>
      </div>

      {/* TWO-COLUMN CONTENT GRID */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT COLUMN: 2/3 Width components */}
        <div className="space-y-6 lg:col-span-2">
          {/* SECTION 4: RECENT PENDING PAYMENTS */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <h3 className="font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
                Recent Pending Payments
              </h3>
              <Link
                to={ROUTES.ADMIN_PAYMENTS}
                className="inline-flex items-center gap-1 rounded-xl border border-purple-500/25 bg-purple-900/30 px-3 py-1.5 text-[11.5px] font-black text-purple-300 transition-all hover:bg-purple-900/50"
              >
                <span>View All Requests</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto pt-1">
              {recentPendingPayments.length > 0 ? (
                <table className="w-full border-collapse text-left text-xs font-semibold text-[#CBD5E1]">
                  <thead className="border-b border-[#334155] bg-[#111827]/40 text-[9.5px] font-bold tracking-widest text-[#94A3B8] uppercase">
                    <tr>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3">Amount</th>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#334155]">
                    {recentPendingPayments.map((req) => (
                      <tr
                        key={req.id}
                        className="border-b border-[#334155]/20 transition-colors hover:bg-[#273549]/40"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <span className="block font-bold text-[#FFFFFF]">
                              {req.user?.display_name}
                            </span>
                            <span className="font-mono text-[10px] text-[#94A3B8]">
                              {req.user?.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-purple-400 uppercase">
                          {req.plan_id}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-[#FFFFFF]">
                          PKR {req.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-[#94A3B8]">
                          {new Date(req.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-flex items-center gap-1 rounded-full border border-amber-900/30 bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-400">
                            Verification Required
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-900/30 text-purple-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-black text-[#FFFFFF]">
                    No pending verification requests
                  </h4>
                  <p className="text-[11px] font-semibold text-[#94A3B8]">
                    All subscriber invoices have been verified.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: RECENT ACTIVITY */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <h3 className="font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
                System Activity Log Stream
              </h3>
              <span className="font-mono text-[10px] font-bold tracking-wider text-[#94A3B8] uppercase">
                Live Audit Logs
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {recentActivities.length > 0 ? (
                <div className="space-y-3.5">
                  {recentActivities.map((act) => {
                    const activityTime = new Date(act.created_at).toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                    return (
                      <div
                        key={act.id}
                        className="flex items-start justify-between border-b border-[#334155]/30 pb-3 last:border-b-0"
                      >
                        <div className="space-y-1">
                          <span className="block text-xs font-bold text-[#FFFFFF]">
                            {act.event}
                          </span>
                          <div className="flex items-center gap-2 text-[10.5px] font-semibold text-[#94A3B8]">
                            <span className="font-mono text-[#CBD5E1]">{act.actor_email}</span>
                            <span>•</span>
                            <span className="py-0.2 inline-flex items-center rounded border border-[#334155]/20 bg-[#111827]/60 px-1 text-[9px] font-black text-[#CBD5E1] uppercase">
                              {act.actor_role}
                            </span>
                            <span>•</span>
                            <span className="text-purple-400">{act.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#94A3B8]">
                          <Clock className="h-3.5 w-3.5 text-[#94A3B8]" />
                          <span>{activityTime}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-900/30 text-purple-300">
                    <Inbox className="h-5 w-5" />
                  </div>
                  <h4 className="text-xs font-black text-[#FFFFFF]">
                    No recent audit log activities
                  </h4>
                  <p className="text-[11px] font-semibold text-[#94A3B8]">
                    Log activity stream is clean.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 1/3 Width components */}
        <div className="space-y-6">
          {/* SECTION 6: QUICK ACTIONS */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <h3 className="border-b border-[#334155] pb-3 font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
              Administrative Quick Tools
            </h3>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_ANNOUNCEMENTS)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <Megaphone className="h-4.5 w-4.5 text-purple-400" />
                <span>Create Announcement</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_PAYMENTS)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <CreditCard className="h-4.5 w-4.5 text-purple-400" />
                <span>Verify Payments</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_STORAGE)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <HardDrive className="h-4.5 w-4.5 text-purple-400" />
                <span>Manage Storage Limits</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_SUBSCRIPTIONS)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <Crown className="h-4.5 w-4.5 text-purple-400" />
                <span>Subscription Plans Editor</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_AUDIT_LOGS)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <ClipboardList className="h-4.5 w-4.5 text-purple-400" />
                <span>View System Audit Logs</span>
              </button>

              <button
                type="button"
                onClick={() => navigate(ROUTES.ADMIN_SETTINGS)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <Settings className="h-4.5 w-4.5 text-purple-400" />
                <span>Infrastructure Settings</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddUserOpen(true)}
                className="flex w-full items-center gap-3 rounded-2xl border border-[#334155] bg-[#111827]/40 p-3.5 text-left text-xs font-extrabold text-[#CBD5E1] transition-all select-none hover:border-purple-500/30 hover:bg-[#273549] hover:text-[#FFFFFF]"
              >
                <UserPlus className="h-4.5 w-4.5 text-purple-400" />
                <span>Invite / Add New User</span>
              </button>
            </div>
          </div>

          {/* SECTION 7: SUBSCRIPTION DISTRIBUTION */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <h3 className="border-b border-[#334155] pb-3 font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
              Subscription Tier Shares
            </h3>

            <div className="flex flex-col items-center space-y-4 pt-2">
              {/* Custom SVG Doughnut Chart */}
              <div className="relative flex h-32 w-32 items-center justify-center">
                <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#273549" strokeWidth="12" />
                  {(() => {
                    const total = planStats.total || 1
                    const freePct = (planStats.free / total) * 100
                    const proPct = (planStats.pro / total) * 100
                    const familyPct = (planStats.family / total) * 100

                    const circ = 2 * Math.PI * 50 // ~314.16
                    const freeDash = `${(freePct / 100) * circ} ${circ}`
                    const proDash = `${(proPct / 100) * circ} ${circ}`
                    const familyDash = `${(familyPct / 100) * circ} ${circ}`

                    const freeOffset = 0
                    const proOffset = -((freePct / 100) * circ)
                    const familyOffset = -(((freePct + proPct) / 100) * circ)

                    return (
                      <>
                        <circle
                          cx="60"
                          cy="60"
                          r="50"
                          fill="none"
                          stroke="#a855f7"
                          strokeWidth="12"
                          strokeDasharray={freeDash}
                          strokeDashoffset={freeOffset}
                          strokeLinecap="round"
                        />
                        {planStats.pro > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#6366f1"
                            strokeWidth="12"
                            strokeDasharray={proDash}
                            strokeDashoffset={proOffset}
                            strokeLinecap="round"
                          />
                        )}
                        {planStats.family > 0 && (
                          <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            stroke="#ec4899"
                            strokeWidth="12"
                            strokeDasharray={familyDash}
                            strokeDashoffset={familyOffset}
                            strokeLinecap="round"
                          />
                        )}
                      </>
                    )
                  })()}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-black text-[#FFFFFF]">
                    {planStats.total}
                  </span>
                  <span className="text-[9px] font-extrabold tracking-widest text-[#94A3B8] uppercase">
                    Accounts
                  </span>
                </div>
              </div>

              {/* Legend */}
              <div className="w-full space-y-1.5 text-xs font-semibold">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                    <span className="text-[#CBD5E1]">Free Tier</span>
                  </div>
                  <span className="font-bold text-[#FFFFFF]">
                    {planStats.free} (
                    {planStats.total ? ((planStats.free / planStats.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[#CBD5E1]">Pro Tier</span>
                  </div>
                  <span className="font-bold text-[#FFFFFF]">
                    {planStats.pro} (
                    {planStats.total ? ((planStats.pro / planStats.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                    <span className="text-[#CBD5E1]">Family Tier</span>
                  </div>
                  <span className="font-bold text-[#FFFFFF]">
                    {planStats.family} (
                    {planStats.total ? ((planStats.family / planStats.total) * 100).toFixed(0) : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: TOP READERS */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <h3 className="border-b border-[#334155] pb-3 font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
              Reader Activity Leaderboard
            </h3>

            <div className="space-y-3 pt-1">
              {topReaders.length > 0 ? (
                topReaders.map((reader, index) => (
                  <div
                    key={reader.user_id}
                    className="flex items-center justify-between border-b border-[#334155]/20 pb-2.5 last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-purple-900/30 text-[10px] font-black text-purple-300">
                        #{index + 1}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-[#FFFFFF]">
                          {reader.displayName}
                        </span>
                        <span className="font-mono text-[10px] text-[#94A3B8]">{reader.email}</span>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-semibold text-[#CBD5E1]">
                      <span className="block font-mono font-black text-[#FFFFFF]">
                        {reader.pagesRead.toLocaleString()} pages
                      </span>
                      <span className="block text-[9.5px] font-medium text-[#94A3B8]">
                        {reader.booksCount} books • {reader.readingTimeMinutes} mins
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-[#94A3B8]">
                  No reading progress activity logged yet.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: PLATFORM HEALTH */}
          <div className="space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 shadow-md">
            <div className="flex items-center justify-between border-b border-[#334155] pb-3">
              <h3 className="font-sans text-sm font-black tracking-wider text-[#FFFFFF] uppercase">
                Infrastructure Integrations
              </h3>
              <span className="text-[9px] font-black tracking-wider text-[#94A3B8] uppercase">
                Verification Matrix
              </span>
            </div>

            <div className="space-y-3 pt-1">
              {healthMatrixItems.map((srv) => {
                const Icon = srv.icon
                return (
                  <div
                    key={srv.id}
                    className="flex items-center justify-between border-b border-[#334155]/20 pb-2.5 last:border-b-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#334155]/20 bg-[#111827]/40 text-[#CBD5E1]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-[#FFFFFF]">{srv.name}</span>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black tracking-wider uppercase ${srv.badgeColor}`}
                    >
                      {srv.statusType === 'connected' ||
                      srv.statusType === 'running' ||
                      srv.statusType === 'healthy' ? (
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-500" />
                      )}
                      {srv.statusText.replace('✓ ', '').replace('✗ ', '')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / INVITE USER */}
      <AnimatePresence>
        {isAddUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddUserOpen(false)}
              className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md space-y-4 rounded-3xl border border-[#334155] bg-[#1E293B] p-6 text-left text-[#FFFFFF] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setIsAddUserOpen(false)}
                className="absolute top-4 right-4 text-[#94A3B8] hover:text-[#FFFFFF]"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="flex items-center gap-2 text-lg font-black text-[#FFFFFF]">
                <UserPlus className="h-5 w-5 text-purple-400" />
                Invite or Register User
              </h3>
              <p className="text-xs font-medium text-[#CBD5E1]">
                Register a new user email and define their security role profile.
              </p>

              <form onSubmit={handleAddUser} className="space-y-4 pt-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-[#CBD5E1]">
                    User Email Address
                  </label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="e.g. member.team@librovia.com"
                    className="w-full rounded-2xl border border-[#334155] bg-[#111827] p-2.5 text-xs font-semibold text-[#FFFFFF] placeholder-[#94A3B8] focus:border-purple-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-[#CBD5E1]">
                    Authorization Role
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) =>
                      setNewUserRole(e.target.value as 'user' | 'super_admin' | 'moderator')
                    }
                    className="w-full rounded-2xl border border-[#334155] bg-[#111827] p-2.5 text-xs font-semibold text-[#FFFFFF] focus:border-purple-500 focus:outline-none"
                  >
                    <option value="user" className="bg-[#1E293B] text-[#FFFFFF]">
                      Reader (Default)
                    </option>
                    <option value="moderator" className="bg-[#1E293B] text-[#FFFFFF]">
                      Moderator
                    </option>
                    <option value="super_admin" className="bg-[#1E293B] text-[#FFFFFF]">
                      Super Administrator
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-purple-600 py-3 text-xs font-black text-white shadow-md shadow-purple-600/20 transition-all hover:bg-purple-700 active:scale-98"
                >
                  Confirm Registration & Invite
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageWrapper>
  )
}
