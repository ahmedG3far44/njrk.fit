import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { familyService } from '../services/family';
import { Users, Trophy, Activity, UserPlus, Check, X, Search, Trash2 } from 'lucide-react';

const FamilyPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. جلب البيانات من الباك إند
  const { data: familyData, refetch: refetchFamily } = useQuery({
    queryKey: ['family'],
    queryFn: familyService.getFamily,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: familyService.getLeaderboard,
  });

  const { data: feedData } = useQuery({
    queryKey: ['feed'],
    queryFn: familyService.getFeed,
  });

  const { data: searchResults } = useQuery({
    queryKey: ['familySearch', searchQuery],
    queryFn: () => familyService.searchUsers(searchQuery),
    enabled: searchQuery.length > 2, 
  });

  // 2. عمليات الإرسال والتعديل (Mutations)
  const inviteMutation = useMutation({
    mutationFn: familyService.inviteUser,
    onSuccess: () => {
      alert('تم إرسال الدعوة بنجاح! 📨');
      setSearchQuery('');
    },
    onError: (error: any) => alert(error.response?.data?.error || 'حدث خطأ'),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'accept' | 'reject' }) => 
      familyService.respondToInvitation(id, action), 
    onSuccess: () => refetchFamily(),
  });

  const removeMutation = useMutation({
    mutationFn: familyService.removeMember,
    onSuccess: () => refetchFamily(),
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-600" /> My Family
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your family and track progress together</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* العمود الأول والثاني: لوحة الصدارة والنشاطات */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 🏆 لوحة الصدارة */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" /> Family Leaderboard
            </h2>
            <div className="space-y-3">
              {/* التعديل هنا: تأكدنا إن المصفوفة موجودة وفيها عناصر قبل ما نعرضها */}
              {leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0 ? (
                leaderboardData.leaderboard.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-200 flex items-center justify-center font-bold text-purple-700">
                        {user.rank}
                      </div>
                      <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} alt={user.name} className="w-10 h-10 rounded-full" />
                      <div>
                        <p className="font-semibold text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">Level {user.level}</p>
                      </div>
                    </div>
                    <div className="font-bold text-purple-600">{user.points} pts</div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">لا يوجد بيانات حالياً.</p>
              )}
            </div>
          </div>

          {/* 📰 شريط النشاطات */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-green-500" /> Recent Activity
            </h2>
            <div className="space-y-4">
              {/* التعديل هنا */}
              {feedData?.feed && feedData.feed.length > 0 ? (
                feedData.feed.map((item: any) => (
                  <div key={item.id} className="flex gap-3 border-b border-gray-50 pb-3 last:border-0">
                    <img src={item.user.avatarUrl || `https://ui-avatars.com/api/?name=${item.user.name}`} alt="avatar" className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold">{item.user.name}</span> {item.action}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(item.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">لا توجد نشاطات مسجلة.</p>
              )}
            </div>
          </div>
        </div>

        {/* العمود الثالث: إدارة العائلة والدعوات */}
        <div className="space-y-6">
          
          {/* 👨‍👩‍👧 قائمة العائلة الحالية */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {/* التعديل هنا */}
            <h2 className="font-bold mb-4">Family Members ({familyData?.familyMembers?.length ?? 0})</h2>
            <div className="space-y-3">
              {familyData?.familyMembers?.map((member: any) => (
                <div key={member._id || member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}`} className="w-8 h-8 rounded-full" />
                    <span className="text-sm font-medium">{member.name}</span>
                  </div>
                  <button onClick={() => removeMutation.mutate(member._id || member.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 📩 الدعوات المعلقة */}
          {/* التعديل هنا */}
          {familyData?.pendingInvitations && familyData.pendingInvitations.length > 0 && (
            <div className="bg-orange-50 rounded-xl border border-orange-200 p-5">
              <h2 className="font-bold text-orange-800 mb-3">Pending Invites</h2>
              <div className="space-y-3">
                {familyData.pendingInvitations.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between bg-white p-2 rounded-lg shadow-sm">
                    <span className="text-sm">{invite.user.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => respondMutation.mutate({ id: invite.id, action: 'accept' })} className="text-green-600 bg-green-100 p-1 rounded hover:bg-green-200"><Check className="w-4 h-4" /></button>
                      <button onClick={() => respondMutation.mutate({ id: invite.id, action: 'reject' })} className="text-red-600 bg-red-100 p-1 rounded hover:bg-red-200"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🔍 البحث وإضافة أشخاص */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-purple-600" /> Add Member
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* نتائج البحث */}
            {/* التعديل هنا */}
            {searchResults?.results && searchResults.results.length > 0 && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                {searchResults.results.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-sm">
                    <span>{user.name}</span>
                    <button 
                      onClick={() => inviteMutation.mutate(user.id)}
                      className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
                    >
                      Invite
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default FamilyPage;