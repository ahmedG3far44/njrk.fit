import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { progressService } from '../../services/progress'
import { Dumbbell, Flame, Zap, Trophy, Target, X, Copy } from 'lucide-react'
import UpdateStatsModal from '../../components/UpdateStatsModal'
import PageActionButtons from '../../components/PageActionButtons'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const useMockData = true

const mockDashboardData = {
  weightTrend: [
    { _id: 'Day 1', weightKg: 82.5 },
    { _id: 'Day 2', weightKg: 82.2 },
    { _id: 'Day 3', weightKg: 81.8 },
    { _id: 'Day 4', weightKg: 81.5 },
    { _id: 'Day 5', weightKg: 81.2 },
    { _id: 'Day 6', weightKg: 80.9 },
    { _id: 'Day 7', weightKg: 80.5 },
  ],
  stepData: [
    { _id: 'Mon', steps: 6500 },
    { _id: 'Tue', steps: 8200 },
    { _id: 'Wed', steps: 7100 },
    { _id: 'Thu', steps: 5400 },
    { _id: 'Fri', steps: 9100 },
    { _id: 'Sat', steps: 12500 },
    { _id: 'Sun', steps: 4800 },
  ],
  latestWeight: 80.5,
  totalLogs: 28,
  totalWorkouts: 15,
  weightLost: 2.0,
  avgProtein: 145,
  streakDays: 12,
}

const mockFeelings = [
  { date: '2026-04-22', tags: ['Feeling energetic', 'Lost weight'], notes: 'Great workout!' },
  { date: '2026-04-21', tags: ['Feeling strong'], notes: '' },
]

const ProgressPage = () => {
  const [timeframe, setTimeframe] = useState('7days')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  
  // حالات نافذة المشاركة
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['progress', timeframe],
    queryFn: () => progressService.getDashboard(timeframe),
    enabled: !useMockData,
  })

  const data = useMockData ? mockDashboardData : apiData

  const weightChange = mockDashboardData.weightTrend.length > 1
    ? mockDashboardData.weightTrend[mockDashboardData.weightTrend.length - 1].weightKg - mockDashboardData.weightTrend[0].weightKg
    : 0

  // --------------------------------------------------------
  // دوال الطباعة والمشاركة
  // --------------------------------------------------------
  const handlePrint = async (e?: any) => {
    // نمنع الزر من تحديث الصفحة أو إرسال طلبين بالغلط
    if (e) e.preventDefault(); 
    
    try {
      const data = await progressService.exportPdf();
      
      // نتأكد 100% إنه Blob عشان المتصفح ما يرمي Error
      const blob = data instanceof Blob ? data : new Blob([data as any], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Progress_Report.pdf');
      document.body.appendChild(link);
      link.click();
      
      // تنظيف
      if (link.parentNode) link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      // طبعنا الخطأ في الكونسول عشان لو صار شيء نعرف وش هو بالضبط
      console.error('Failed to export PDF:', error);
      alert('حدث خطأ أثناء تصدير التقرير! (شيك على الـ Console)');
    }
  };

  const shareMutation = useMutation({
    mutationFn: () => progressService.shareReport(),
    onSuccess: (data) => {
      if (data.success) {
        setShareUrl(data.shareUrl);
        setShowShareModal(true);
      }
    },
  });

  const handleShare = () => {
    shareMutation.mutate();
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    alert('تم نسخ الرابط بنجاح! 📋');
  };

  // --------------------------------------------------------
  // واجهة المستخدم (UI)
  // --------------------------------------------------------
  if(isLoading){
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* الترويسة والأزرار */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Your Progress</h1>
          <p className="text-gray-500 text-sm mt-1">Track your fitness journey</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="7weeks">Last 7 Weeks</option>
          </select>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            <Target className="w-4 h-4" />
            Update My Stats
          </button>
          
          {/* أزرار المشاركة والطباعة */}
          <PageActionButtons onShare={handleShare} onPrint={handlePrint} />
        </div>
      </div>

      {/* بطاقات الإحصائيات (Stats Cards) */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.totalWorkouts || 0}</p>
              <p className="text-sm text-gray-500">Total Workouts</p>
            </div>
          </div>
          <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">+3 this week</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.weightLost?.toFixed(1) || '0.0'} kg</p>
              <p className="text-sm text-gray-500">Weight Lost</p>
            </div>
          </div>
          <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
            {weightChange < 0 ? `${weightChange.toFixed(1)} kg` : '+0.0 kg'}
          </span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.avgProtein || 0}g</p>
              <p className="text-sm text-gray-500">Avg. Protein</p>
            </div>
          </div>
          <span className="inline-block mt-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Daily avg</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{data?.streakDays || 0}</p>
              <p className="text-sm text-gray-500">Streak Days</p>
            </div>
          </div>
          {data?.streakDays && data.streakDays > 0 && (
            <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Personal Best!
            </span>
          )}
        </div>
      </div>

      {/* الرسومات البيانية (Charts) */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Weight Trend (kg)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.weightTrend || []}>
                <defs>
                  <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333ea" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9333ea" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" fontSize={12} stroke="#9ca3af" />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} fontSize={12} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="weightKg"
                  stroke="#9333ea"
                  strokeWidth={2}
                  fill="url(#weightGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Daily Steps</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stepData || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="_id" fontSize={12} stroke="#9ca3af" />
                <YAxis fontSize={12} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="steps" fill="#9333ea" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* قائمة الإنجازات/المشاعر الأخيرة */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h3 className="font-semibold mb-4">Recent Feelings</h3>
        <div className="space-y-3">
          {mockFeelings.map((entry, i) => (
            <div key={i} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 w-20">{entry.date}</div>
              <div className="flex-1">
                <div className="flex flex-wrap gap-2 mb-1">
                  {entry.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                {entry.notes && <p className="text-sm text-gray-600">{entry.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* نافذة التحديث المنبثقة */}
      {showUpdateModal && (
        <UpdateStatsModal
          onClose={() => setShowUpdateModal(false)}
          onUpdated={() => {
            setShowUpdateModal(false)
            refetch()
          }}
        />
      )}

      {/* نافذة المشاركة المنبثقة (Share Modal) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Share Progress Report</h2>
              <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">
              Share your fitness journey! The link expires in 7 days.
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-xl">
              <input
                type="text"
                value={`${window.location.origin}${shareUrl}`}
                readOnly
                className="flex-1 bg-transparent text-sm outline-none"
              />
              <button
                onClick={handleCopyLink}
                className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProgressPage