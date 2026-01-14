import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import knowledgeRoutes from './routes/knowledge.js'
import governanceRoutes from './routes/governance.js'
import lookupsRoutes from './routes/lookups.js'
import trainingRoutes from './routes/training.js'
import kpiRoutes from './routes/kpi.js'
import userRoutes from './routes/users.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan('dev'))

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Mobile Web Component API', version: '1.0.0' })
})

app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/governance', governanceRoutes)
app.use('/api/lookups', lookupsRoutes)
app.use('/api/training', trainingRoutes)
app.use('/api/kpi', kpiRoutes)
app.use('/api/users', userRoutes)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      status: err.status || 500
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
})
