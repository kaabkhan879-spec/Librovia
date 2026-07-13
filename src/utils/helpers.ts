/**
 * Formats a file size in bytes to a human-readable string (KB, MB, GB).
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Calculates reading percentage.
 */
export const calculatePercentage = (current: number, total: number): number => {
  if (!total || total === 0) return 0
  return Math.min(Math.round((current / total) * 100), 100)
}

/**
 * Formats a date string into a clean user-friendly display date.
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  } catch (error) {
    console.error('Error formatting date:', error)
    return dateString
  }
}
