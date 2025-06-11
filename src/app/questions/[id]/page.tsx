import supabase from '@/lib/supabase' // Changed import
import { notFound } from 'next/navigation'
import ChallengeDetail from '@/app/_components/challenges/ChallengeDetail'

export default async function ChallengePage({
  params
}: {
  params: { id: string }
}) {
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !challenge) {
    notFound()
  }

  const { data: { user } } = await supabase.auth.getUser()

  return <ChallengeDetail challenge={challenge} user={user} />
}