import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Suspense, lazy } from 'react'
import { SharePointProvider } from './context/SharePointContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout/Layout'
import './App.css'

// Lazy load route components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

// Loading fallback component
const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '1.1rem',
    color: 'var(--text-muted)'
  }}>
    Loading page...
  </div>
)

function App() {
  return (
    <SharePointProvider>
      <ThemeProvider>
        <Layout>
          <Suspense fallback={<PageLoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={
                <>
                  <Helmet>
                    <title>Page Not Found - ITG Dashboard</title>
                    <meta name="description" content="The page you're looking for doesn't exist" />
                  </Helmet>
                  <div style={{
                    textAlign: 'center',
                    padding: '50px',
                    fontFamily: 'Arial, sans-serif'
                  }}>
                    <h1 style={{ fontSize: '3rem', color: '#666' }}>404</h1>
                    <h2 style={{ color: '#999' }}>Page Not Found</h2>
                    <p style={{ color: '#777', marginBottom: '20px' }}>
                      The page you're looking for doesn't exist or has been moved.
                    </p>
                    <a
                      href="/"
                      style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '5px'
                      }}
                    >
                      Go to Dashboard
                    </a>
                  </div>
                </>
              } />
            </Routes>
          </Suspense>
        </Layout>
      </ThemeProvider>
    </SharePointProvider>
  )
}

export default App