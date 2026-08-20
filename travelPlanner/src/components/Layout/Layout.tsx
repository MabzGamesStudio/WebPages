import { Link } from 'react-router-dom'
import { MapPin, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import styles from './Layout.module.scss'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [darkMode, setDarkMode] = useState(true)

  useEffect(() => {
    document.documentElement.style.setProperty('--bg-primary', darkMode ? '#0f1117' : '#f8f9fc')
    document.documentElement.style.setProperty('--bg-secondary', darkMode ? '#161922' : '#ffffff')
    document.documentElement.style.setProperty('--bg-tertiary', darkMode ? '#1e212b' : '#eef0f5')
    document.documentElement.style.setProperty('--bg-card', darkMode ? '#1a1d26' : '#ffffff')
    document.documentElement.style.setProperty('--bg-hover', darkMode ? '#252a36' : '#e8eaf0')
    document.documentElement.style.setProperty('--text-primary', darkMode ? '#e8eaed' : '#1a1d26')
    document.documentElement.style.setProperty('--text-secondary', darkMode ? '#9aa0a6' : '#5f6368')
    document.documentElement.style.setProperty('--text-muted', darkMode ? '#5f6368' : '#9aa0a6')
    document.documentElement.style.setProperty('--border', darkMode ? '#2a2e3a' : '#d1d5db')
  }, [darkMode])

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>
          <MapPin size={24} />
          <span>TravelDash</span>
        </Link>
        <button
          className={styles.themeToggle}
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>
      <main className={styles.main}>{children}</main>
      <footer className={styles.footer}>
        <p>Travel Dashboard &middot; Built with OpenStreetMap & Open-Meteo</p>
      </footer>
    </div>
  )
}
