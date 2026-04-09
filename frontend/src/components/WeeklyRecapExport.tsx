import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

type WeeklyStats = {
  hoursFocused: number
  topSubject: string
  consistencyScore: number
}

const stats: WeeklyStats = {
  hoursFocused: 26.5,
  topSubject: 'Data Structures',
  consistencyScore: 87,
}

export function WeeklyRecapExport() {
  const [isExporting, setIsExporting] = useState(false)
  const exportTemplateRef = useRef<HTMLDivElement | null>(null)

  const exportRecap = async () => {
    if (!exportTemplateRef.current || isExporting) {
      return
    }

    setIsExporting(true)

    try {
      const canvas = await html2canvas(exportTemplateRef.current, {
        backgroundColor: null,
        scale: 2,
      })

      const imageData = canvas.toDataURL('image/png')
      const imageLink = document.createElement('a')
      imageLink.href = imageData
      imageLink.download = 'weekly-recap.png'
      imageLink.click()

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height],
      })

      pdf.addImage(imageData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save('weekly-recap.pdf')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <button
        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        onClick={exportRecap}
      >
        {isExporting ? 'Preparing recap...' : 'Share Recap'}
      </button>

      <div className="fixed -left-[9999px] top-0 opacity-0" aria-hidden>
        <div
          ref={exportTemplateRef}
          className="w-[900px] rounded-[28px] border border-white/70 p-8"
          style={{
            background:
              'linear-gradient(150deg, rgba(255,255,255,0.7), rgba(255,255,255,0.35)), radial-gradient(circle at 0% 0%, rgba(56,189,248,0.28), transparent 28%), radial-gradient(circle at 100% 0%, rgba(249,115,22,0.25), transparent 30%), #f8fafc',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Weekly Retrospective</p>
          <h3 className="mt-3 font-['Space_Grotesk'] text-4xl font-bold text-slate-900">Smart Study Tracker</h3>
          <p className="mt-2 text-slate-600">Card-style recap generated on-device.</p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Hours Focused</p>
              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">{stats.hoursFocused}</p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Top Subject</p>
              <p className="mt-2 font-['Space_Grotesk'] text-2xl font-bold text-slate-900">{stats.topSubject}</p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/75 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Consistency</p>
              <p className="mt-2 font-['Space_Grotesk'] text-3xl font-bold text-slate-900">{stats.consistencyScore}%</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
