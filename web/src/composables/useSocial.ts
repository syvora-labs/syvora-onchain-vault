import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export interface FollowStats {
    followers_count: number
    following_count: number
}

// Module-level: profile IDs the current authenticated user follows
const followingIds = ref<Set<string>>(new Set())

export function useSocial() {
    async function fetchFollowingIds(currentUserId: string): Promise<void> {
        const { data } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
        followingIds.value = new Set((data ?? []).map((r: { following_id: string }) => r.following_id))
    }

    function isFollowing(profileId: string): boolean {
        return followingIds.value.has(profileId)
    }

    async function followUser(targetId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { error } = await supabase
            .from('follows')
            .insert({ follower_id: user.id, following_id: targetId })
        if (error) throw error
        followingIds.value = new Set([...followingIds.value, targetId])
    }

    async function unfollowUser(targetId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { error } = await supabase
            .from('follows')
            .delete()
            .eq('follower_id', user.id)
            .eq('following_id', targetId)
        if (error) throw error
        const next = new Set(followingIds.value)
        next.delete(targetId)
        followingIds.value = next
    }

    async function getFollowStats(profileId: string): Promise<FollowStats> {
        const [followersRes, followingRes] = await Promise.all([
            supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('following_id', profileId),
            supabase
                .from('follows')
                .select('*', { count: 'exact', head: true })
                .eq('follower_id', profileId),
        ])
        return {
            followers_count: followersRes.count ?? 0,
            following_count: followingRes.count ?? 0,
        }
    }

    return {
        followingIds,
        isFollowing,
        fetchFollowingIds,
        followUser,
        unfollowUser,
        getFollowStats,
    }
}
