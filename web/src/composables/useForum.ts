import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export interface PostWithProfile {
    id: string
    user_id: string
    content: string
    created_at: string
    profiles: {
        username: string
        display_name: string | null
        avatar_url: string | null
        wallet_address: string | null
    }
}

const posts = ref<PostWithProfile[]>([])

export function useForum() {
    async function fetchPosts() {
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(username, display_name, avatar_url, wallet_address)')
            .order('created_at', { ascending: false })
            .limit(50)
        if (error) throw error
        posts.value = (data ?? []) as PostWithProfile[]
    }

    async function fetchPostsByUser(userId: string): Promise<PostWithProfile[]> {
        const { data, error } = await supabase
            .from('posts')
            .select('*, profiles(username, display_name, avatar_url, wallet_address)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []) as PostWithProfile[]
    }

    async function createPost(content: string) {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { error } = await supabase.from('posts').insert({ content, user_id: user.id })
        if (error) throw error
        await fetchPosts()
    }

    async function deletePost(id: string) {
        const { error } = await supabase.from('posts').delete().eq('id', id)
        if (error) throw error
        posts.value = posts.value.filter((p) => p.id !== id)
    }

    function subscribe() {
        const channel = supabase
            .channel('posts-feed')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                () => { fetchPosts() },
            )
            .subscribe()
        return () => supabase.removeChannel(channel)
    }

    return { posts, fetchPosts, fetchPostsByUser, createPost, deletePost, subscribe }
}
