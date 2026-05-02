import Link from 'next/link'
import { Bot, Zap, Shield, ShoppingCart, Settings, ArrowRight, Check, Github, Sparkles } from 'lucide-react'
import { NeoButton } from '@/components/ui/neo-button'
import { NeoCard, NeoCardContent } from '@/components/ui/neo-card'

const features = [
  {
    icon: Bot,
    title: 'Bot Telegram',
    description: 'Buat bot Telegram dengan mudah untuk menerima pesanan otomatis dari pelanggan Anda',
    gradient: 'from-primary/20 to-primary/5',
    iconBg: 'bg-primary/20 text-primary',
  },
  {
    icon: ShoppingCart,
    title: 'Auto Order',
    description: 'Sistem pesanan otomatis yang memproses order pelanggan 24/7 tanpa henti',
    gradient: 'from-secondary/20 to-secondary/5',
    iconBg: 'bg-secondary/20 text-secondary',
  },
  {
    icon: Settings,
    title: 'Kelola Produk',
    description: 'Dashboard lengkap untuk mengelola produk, harga, dan stok dengan mudah',
    gradient: 'from-accent/20 to-accent/5',
    iconBg: 'bg-accent/20 text-accent',
  },
  {
    icon: Shield,
    title: 'Aman & Terpercaya',
    description: 'Data Anda tersimpan aman dengan enkripsi dan backup otomatis ke GitHub',
    gradient: 'from-success/20 to-success/5',
    iconBg: 'bg-success/20 text-success',
  },
]

const steps = [
  { number: '01', title: 'Daftar Akun', description: 'Buat akun gratis dalam hitungan detik', color: 'primary' },
  { number: '02', title: 'Setup Bot', description: 'Masukkan token bot dari BotFather', color: 'secondary' },
  { number: '03', title: 'Tambah Produk', description: 'Upload produk yang ingin dijual', color: 'accent' },
  { number: '04', title: 'Mulai Jualan', description: 'Bot siap menerima pesanan otomatis', color: 'success' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen dev-bg relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/50 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg">
              <Bot className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight">SewaBot</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <Link href="/login">
              <NeoButton variant="ghost">Masuk</NeoButton>
            </Link>
            <Link href="/register">
              <NeoButton>Daftar</NeoButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Platform Bot Auto Order #1
                </span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-6 text-balance">
                Otomatisasi <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Jualan</span> dengan Bot Telegram
              </h1>
              
              <p className="text-lg text-muted-foreground mb-8 text-pretty leading-relaxed">
                Buat bot Telegram sendiri untuk menerima pesanan otomatis. 
                Kelola produk, pantau pesanan, dan tingkatkan penjualan Anda 24/7.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/register">
                  <NeoButton size="lg">
                    Mulai Gratis
                    <ArrowRight className="w-5 h-5" />
                  </NeoButton>
                </Link>
                <Link href="/login">
                  <NeoButton variant="outline" size="lg">
                    Lihat Demo
                  </NeoButton>
                </Link>
              </div>
              
              <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span>Gratis Selamanya</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-success/20 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-success" />
                  </div>
                  <span>Tanpa Kartu Kredit</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl border border-border p-6 shadow-2xl backdrop-blur-sm">
                <div className="bg-muted/50 rounded-xl p-4 mb-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-secondary to-secondary/70 rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">AutoOrderBot</p>
                      <p className="text-xs text-muted-foreground">Online</p>
                    </div>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-sm border border-border/50">
                    Halo! Selamat datang di toko kami. Ketik /menu untuk melihat produk.
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl p-4 text-center border border-accent/20">
                    <p className="text-2xl font-bold text-accent">1,234</p>
                    <p className="text-xs text-muted-foreground">Pesanan</p>
                  </div>
                  <div className="bg-gradient-to-br from-success/20 to-success/5 rounded-xl p-4 text-center border border-success/20">
                    <p className="text-2xl font-bold text-success">Rp 50M</p>
                    <p className="text-xs text-muted-foreground">Omset</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-secondary/30 to-secondary/10 rounded-2xl blur-sm" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-accent/30 to-accent/10 rounded-2xl blur-sm" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Fitur Lengkap
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk menjalankan bisnis auto order dengan bot Telegram
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`bg-gradient-to-br ${feature.gradient} rounded-2xl p-6 border border-border/50 hover:border-border transition-all hover:-translate-y-1 cursor-pointer`}
              >
                <div className={`w-14 h-14 ${feature.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Cara Kerja
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hanya butuh 4 langkah sederhana untuk memulai bisnis auto order Anda
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className={`bg-gradient-to-br from-${step.color}/20 to-${step.color}/5 rounded-2xl p-6 border border-${step.color}/20 h-full`}>
                  <span className={`text-5xl font-bold text-${step.color}/30`}>{step.number}</span>
                  <h3 className="font-semibold text-lg mt-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10 w-4 h-4 items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20 rounded-3xl p-8 lg:p-12 border border-border text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-card/50 backdrop-blur-sm" />
            <div className="relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Siap Mulai Jualan?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Daftar sekarang dan buat bot auto order pertama Anda dalam hitungan menit!
              </p>
              <Link href="/register">
                <NeoButton size="lg">
                  Daftar Gratis
                  <ArrowRight className="w-5 h-5" />
                </NeoButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border relative">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">SewaBot</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              2024 SewaBot. Platform Bot Auto Order.
            </p>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
