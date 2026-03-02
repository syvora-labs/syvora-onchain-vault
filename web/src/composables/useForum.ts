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
    post_likes: { user_id: string }[]
    post_comments: { id: string }[]
}

export interface CommentWithProfile {
    id: string
    post_id: string
    user_id: string
    content: string
    created_at: string
    profiles: {
        username: string
        display_name: string | null
        avatar_url: string | null
    }
}

const posts = ref<PostWithProfile[]>([])

const SELECT_POSTS = [
    '*',
    'profiles!posts_user_id_fkey(username, display_name, avatar_url, wallet_address)',
    'post_likes(user_id)',
    'post_comments(id)',
].join(', ')

export function useForum() {
    async function fetchPosts() {
        const { data, error } = await supabase
            .from('posts')
            .select(SELECT_POSTS)
            .order('created_at', { ascending: false })
            .limit(50)
        if (error) throw error
        posts.value = (data ?? []) as unknown as PostWithProfile[]
    }

    async function fetchPostsByUser(userId: string): Promise<PostWithProfile[]> {
        const { data, error } = await supabase
            .from('posts')
            .select(SELECT_POSTS)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []) as unknown as PostWithProfile[]
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

    async function toggleLike(postId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')

        const post = posts.value.find(p => p.id === postId)
        const isLiked = post?.post_likes.some(l => l.user_id === user.id) ?? false

        if (isLiked) {
            const { error } = await supabase
                .from('post_likes')
                .delete()
                .eq('post_id', postId)
                .eq('user_id', user.id)
            if (error) throw error
            if (post) post.post_likes = post.post_likes.filter(l => l.user_id !== user.id)
        } else {
            const { error } = await supabase
                .from('post_likes')
                .insert({ post_id: postId, user_id: user.id })
            if (error) throw error
            if (post) post.post_likes.push({ user_id: user.id })
        }
    }

    async function fetchComments(postId: string): Promise<CommentWithProfile[]> {
        const { data, error } = await supabase
            .from('post_comments')
            .select('*, profiles(username, display_name, avatar_url)')
            .eq('post_id', postId)
            .order('created_at', { ascending: true })
        if (error) throw error
        return (data ?? []) as CommentWithProfile[]
    }

    async function addComment(postId: string, content: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Not authenticated')
        const { error } = await supabase
            .from('post_comments')
            .insert({ post_id: postId, user_id: user.id, content })
        if (error) throw error
        const post = posts.value.find(p => p.id === postId)
        if (post) post.post_comments.push({ id: crypto.randomUUID() })
    }

    async function deleteComment(id: string, postId: string): Promise<void> {
        const { error } = await supabase.from('post_comments').delete().eq('id', id)
        if (error) throw error
        const post = posts.value.find(p => p.id === postId)
        if (post) post.post_comments = post.post_comments.filter(c => c.id !== id)
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

    return {
        posts,
        fetchPosts,
        fetchPostsByUser,
        createPost,
        deletePost,
        toggleLike,
        fetchComments,
        addComment,
        deleteComment,
        subscribe,
    }
}
