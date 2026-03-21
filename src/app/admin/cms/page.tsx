'use client'

import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/use-api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/rich-text-editor'
import { Badge } from '@/components/ui/badge'
import { FileText, CheckCircle2, Loader2, Save } from 'lucide-react'

interface CmsPage {
  id: string
  key: string
  title: string
  content: string
  updatedAt: string
}

const CMS_KEYS = [
  { key: 'about', label: 'About Us', description: 'Company/gym description shown on the About page' },
  { key: 'terms_user', label: 'Terms & Conditions (User Sign Up)', description: 'T&C displayed to users during registration' },
  { key: 'terms_pro', label: 'Terms & Conditions (Professional Sign Up)', description: 'T&C displayed to coaches/professionals during registration' },
  { key: 'privacy', label: 'Privacy Policy', description: 'Privacy policy accessible from the app footer/settings' },
]

export default function AdminCMSPage() {
  const { data, loading, refetch } = useApi<CmsPage[]>('/api/admin/cms')
  const [contents, setContents] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)

  useEffect(() => {
    if (data) {
      const map: Record<string, string> = {}
      data.forEach(p => { map[p.key] = p.content })
      setContents(map)
    }
  }, [data])

  async function handleSave(key: string) {
    setSaving(key)
    await fetch('/api/admin/cms', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, content: contents[key] || '' }),
    })
    setSaving(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
    refetch()
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const pages: CmsPage[] = data || []

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Management System</h1>
        <p className="text-gray-400 mt-1">Manage static pages and legal documents shown across the app</p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading CMS pages...
        </div>
      ) : (
        <div className="space-y-6">
          {CMS_KEYS.map(({ key, label, description }) => {
            const page = pages.find(p => p.key === key)
            const wordCount = (contents[key] || '').trim().split(/\s+/).filter(Boolean).length

            return (
              <Card key={key} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <FileText className="w-4 h-4 text-orange-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-base">{label}</CardTitle>
                        <p className="text-gray-400 text-xs mt-0.5">{description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {page?.updatedAt && (
                        <span className="text-gray-500 text-xs">
                          Last saved: {formatDate(page.updatedAt)}
                        </span>
                      )}
                      <Badge className="bg-gray-700 text-gray-400 text-xs">{wordCount} words</Badge>
                      <Button
                        onClick={() => handleSave(key)}
                        disabled={saving === key}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        size="sm"
                      >
                        {saving === key ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : saved === key ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-green-300" />
                        ) : (
                          <Save className="w-3 h-3 mr-1" />
                        )}
                        {saved === key ? 'Saved!' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <RichTextEditor
                    value={contents[key] || ''}
                    onChange={(html) => setContents(prev => ({ ...prev, [key]: html }))}
                    placeholder={`Enter ${label} content here...`}
                    minHeight="200px"
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
