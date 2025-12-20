import { Routes, Route } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SharePointProvider } from './context/SharePointContext'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import './App.css'

function App() {
  return (
    <SharePointProvider>
      <ThemeProvider>
        <Layout>
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
        </Layout>
      </ThemeProvider>
    </SharePointProvider>
  )
}

export default App