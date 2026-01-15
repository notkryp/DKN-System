import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import knowledgeRoutes from './routes/knowledge.js'
import governanceRoutes from './routes/governance.js'
import lookupsRoutes from './routes/lookups.js'
import trainingRoutes from './routes/training.js'
import kpiRoutes from './routes/kpi.js'
import userRoutes from './routes/users.js'
import feedbackRoutes from './routes/feedback.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
const missingEnv = requiredEnv.filter((key) => !process.env[key])

if (missingEnv.length) {
  console.error(`Missing environment variables: ${missingEnv.join(', ')}`)
  console.error('Set them in Render dashboard or a local .env file before starting the server.')
  process.exit(1)
}

// Initialize Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// CORS with explicit allow-list and dev-safe fallback
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
)

if (allowedOrigins.size === 0) {
  allowedOrigins.add('http://localhost:5173')
}

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true)
    }
    console.warn(`CORS blocked origin: ${origin}`)
    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}

// Middleware
app.use(helmet())
app.use(compression())
app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'))

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Mobile Web Component API', version: '1.0.0' })
})

app.get('/healthz', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/knowledge', knowledgeRoutes)
app.use('/api/governance', governanceRoutes)
app.use('/api/lookups', lookupsRoutes)
app.use('/api/training', trainingRoutes)
app.use('/api/kpi', kpiRoutes)
app.use('/api/users', userRoutes)
app.use('/api/feedback', feedbackRoutes)

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
  console.log(`📝 Environment: ${NODE_ENV}`)
})
