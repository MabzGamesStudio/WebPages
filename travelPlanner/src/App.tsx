import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard/Dashboard'
import LocationDetail from './pages/LocationDetail/LocationDetail'

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/location/:lat/:lon" element={<LocationDetail />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
