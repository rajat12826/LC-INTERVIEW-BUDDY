import supabase from '@/lib/supabase' // Changed import
import { Trophy, Medal, Award } from 'lucide-react'

export default async function LeaderboardPage() {
  const { data: leaderboard } = await supabase
    .from('user_progress')
    .select(`
      user_id,
      profiles!inner(username, full_name, avatar_url),
      completed,
      completed_at
    `)
    .eq('completed', true)
    .order('completed_at', { ascending: true })
  // Group by user and count completions
  const userStats = leaderboard?.reduce((acc: any, curr: any) => {
    const userId = curr.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: curr.profiles,
        completedChallenges: 0,
        lastCompleted: curr.completed_at
      }
    }
    acc[userId].completedChallenges++
    if (new Date(curr.completed_at) > new Date(acc[userId].lastCompleted)) {
      acc[userId].lastCompleted = curr.completed_at
    }
    return acc
  }, {})

  const sortedUsers = Object.values(userStats || {})
    .sort((a: any, b: any) => b.completedChallenges - a.completedChallenges)
    .slice(0, 50)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Leaderboard</h1>
        <p className="text-lg text-gray-600">
          See how you rank against other developers
        </p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Top Performers</h2>
        </div>

        <div className="divide-y divide-gray-200">
          {sortedUsers.map((userStat: any, index) => (
            <div key={userStat.user.username} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {index < 3 ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        index === 0 ? 'bg-yellow-100' :
                        index === 1 ? 'bg-gray-100' :
                        'bg-orange-100'
                      }`}>
                        {index === 0 && <Trophy className="h-5 w-5 text-yellow-600" />}
                        {index === 1 && <Medal className="h-5 w-5 text-gray-600" />}
                        {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {userStat.user.full_name || userStat.user.username || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      @{userStat.user.username || 'anonymous'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {userStat.completedChallenges}
                  </p>
                  <p className="text-sm text-gray-500">
                    challenges completed
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedUsers.length === 0 && (
          <div className="px-6 py-12 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No completed challenges yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  )
}