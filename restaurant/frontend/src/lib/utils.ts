export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2,
  }).format(value)

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR')

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('fr-FR')

export const formatTime = (value: string) =>
  value.slice(0, 5)

export const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(' ')
