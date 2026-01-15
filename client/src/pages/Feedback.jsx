import { useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

export default function Feedback() {
  const [form, setForm] = useState({ subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In a real app, this would send to an API
    console.log('Feedback submitted:', form)
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setForm({ subject: '', message: '' })
    }, 3000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Feedback</h1>
        <p className="text-gray-600 mt-1">Share your thoughts and suggestions with us</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feedback Form */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Submit Feedback</h2>
          
          {submitted ? (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Thank you!</h3>
              <p className="text-purple-700">Your feedback has been submitted successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="What's this about?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="6"
                  placeholder="Share your feedback, suggestions, or report issues..."
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-medium"
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>

        {/* Info Section */}
        <div className="space-y-6">
          <div className="bg-purple-50 rounded-lg shadow-md p-6 border border-purple-100">
            <ChatBubbleLeftRightIcon className="w-12 h-12 text-purple-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">We Value Your Input</h3>
            <p className="text-gray-600 mb-4">
              Your feedback helps us improve the Digital Knowledge Network. Whether it's a bug report, 
              feature request, or general suggestion, we want to hear from you.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Be specific about the issue or suggestion</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Include steps to reproduce if reporting a bug</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Share your use case when requesting features</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-600 mr-2">•</span>
                <span>Check existing announcements before reporting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
