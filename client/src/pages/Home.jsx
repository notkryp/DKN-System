import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const personas = [
  { title: 'Consultant', text: 'Search, filter, and consume knowledge tailored to your region and role.' },
  { title: 'Expert Contributor', text: 'Upload, tag, and version knowledge items, ready for governance review.' },
  { title: 'Governance & Supervisors', text: 'Validate, audit, flag outdated items, and orchestrate training.' },
  { title: 'Top Management', text: 'Track KPIs: duplication rate, onboarding speed, collaboration index.' }
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="min-h-[calc(100vh-theme(spacing.32))] bg-gray-50">
      <section className="bg-gradient-to-r from-primary-700 to-indigo-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.25em] text-primary-100">Digital Knowledge Network</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">One hub for knowledge, governance, and training</h1>
            <p className="text-lg text-primary-100">
              Align content creation, validation, training, and KPI tracking in a single workspace built to mirror the PDF blueprint.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {!user && (
                <>
                  <Link to="/register" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition">
                    Create account
                  </Link>
                  <Link to="/login" className="border border-white/70 text-white hover:bg-white hover:text-primary-700 font-semibold py-3 px-6 rounded-lg transition">
                    Sign in
                  </Link>
                </>
              )}
              {user && (
                <Link to="/dashboard" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold py-3 px-6 rounded-lg transition">
                  Go to dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-2xl space-y-4">
            <div className="flex justify-between text-sm text-primary-100">
              <span>Latest KPIs</span>
              <span>January 2026</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-primary-100">Duplication rate</p>
                <p className="text-2xl font-bold">3.2%</p>
              </div>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-primary-100">Onboarding time</p>
                <p className="text-2xl font-bold">2.4 wks</p>
              </div>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-primary-100">Collaboration index</p>
                <p className="text-2xl font-bold">78</p>
              </div>
              <div className="p-4 bg-white/10 rounded-xl">
                <p className="text-xs uppercase tracking-wide text-primary-100">Training coverage</p>
                <p className="text-2xl font-bold">92%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-3">Built for every role</h2>
          <p className="text-center text-gray-600 mb-10">Mapped directly to the PDF type model and use cases.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {personas.map((p) => (
              <div key={p.title} className="card h-full">
                <h3 className="text-xl font-semibold mb-2">{p.title}</h3>
                <p className="text-gray-600 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
