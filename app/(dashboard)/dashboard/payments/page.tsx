'use client'

import { useState, useEffect } from 'react'
import { CreditCard, DollarSign, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { NeoBadge } from '@/components/ui/neo-badge'
import type { Payment } from '@/types'

interface PaymentWithDetails extends Payment {
  productName?: string
  buyerName?: string
}

export default function PaymentTrackingPage() {
  const [payments, setPayments] = useState<PaymentWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all')
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    pendingAmount: 0,
    successRate: 0,
  })

  useEffect(() => {
    fetchPayments()
  }, [])

  async function fetchPayments() {
    try {
      const res = await fetch('/api/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments || [])
        calculateStats(data.payments || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(paymentsData: PaymentWithDetails[]) {
    const totalTransactions = paymentsData.length
    const totalRevenue = paymentsData
      .filter((p) => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0)
    const pendingAmount = paymentsData
      .filter((p) => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0)
    const successCount = paymentsData.filter((p) => p.status === 'paid').length
    const successRate = totalTransactions > 0 ? Math.round((successCount / totalTransactions) * 100) : 0

    setStats({
      totalTransactions,
      totalRevenue,
      pendingAmount,
      successRate,
    })
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
        return <Clock className="w-5 h-5 text-amber-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  function getStatusBadgeVariant(status: string): 'success' | 'warning' | 'destructive' {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'failed':
        return 'destructive'
      default:
        return 'warning'
    }
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString('id-ID')
  }

  const filteredPayments =
    filter === 'all' ? payments : payments.filter((p) => p.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-12 h-12 bg-primary/20 rounded-xl animate-pulse flex items-center justify-center">
          <div className="w-5 h-5 rounded-full bg-primary animate-ping" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pelacakan Pembayaran</h1>
        <p className="text-muted-foreground text-sm">Pantau semua transaksi pembayaran Anda</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transactions */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Transaksi</p>
              <p className="text-2xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Pendapatan</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Pending Amount */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Menunggu Pembayaran</p>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="p-5 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Tingkat Sukses</p>
              <p className="text-2xl font-bold text-blue-600">{stats.successRate}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'pending'
              ? 'bg-amber-100 text-amber-900'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Menunggu
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'paid'
              ? 'bg-green-100 text-green-900'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Berhasil
        </button>
        <button
          onClick={() => setFilter('failed')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'failed'
              ? 'bg-red-100 text-red-900'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Gagal
        </button>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Order ID
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Jumlah
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Metode Pembayaran
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                  Tanggal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <p className="text-muted-foreground">Tidak ada pembayaran</p>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono">
                      {payment.orderId.slice(0, 12)}...
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize">
                        {payment.paymentMethod === 'orkut' ? 'Orkut QRIS' : 'Midtrans QRIS'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        <NeoBadge variant={getStatusBadgeVariant(payment.status)}>
                          {payment.status === 'pending'
                            ? 'Menunggu'
                            : payment.status === 'paid'
                            ? 'Berhasil'
                            : 'Gagal'}
                        </NeoBadge>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {formatDate(payment.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
