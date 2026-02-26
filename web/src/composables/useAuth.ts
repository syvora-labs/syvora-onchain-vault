import { ref, computed } from 'vue'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface Profile {
    id: string
    username: string
    display_name: string | null
    bio: string | null
    avatar_url: string | null
    website: string | null
    wallet_address: string | null
    created_at: string
}

const currentUser = ref<User | null>(null)
const currentProfile = ref<Profile | null>(null)

async function fetchProfile(userId: string) {
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
    currentProfile.value = data as Profile | null
}

supabase.auth.getSession().then(({ data }) => {
    currentUser.value = data.session?.user ?? null
    if (currentUser.value) fetchProfile(currentUser.value.id)
})

supabase.auth.onAuthStateChange((_event, session) => {
    currentUser.value = session?.user ?? null
    if (currentUser.value) {
        fetchProfile(currentUser.value.id)
    } else {
        currentProfile.value = null
    }
})

export function useAuth() {
    const isAuthenticated = computed(() => currentUser.value !== null)

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
    }

    async function signUp(email: string, password: string, username: string) {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.user) throw new Error('No user returned after sign-up')
        const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, username })
        if (profileError) throw profileError
        await fetchProfile(data.user.id)
    }

    async function signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
    }

    async function linkWallet(address: string) {
        if (!currentUser.value) return
        const { error } = await supabase
            .from('profiles')
            .update({ wallet_address: address })
            .eq('id', currentUser.value.id)
        if (error) throw error
        await fetchProfile(currentUser.value.id)
    }

    async function updateProfile(updates: {
        display_name?: string | null
        bio?: string | null
        website?: string | null
        avatar_url?: string | null
    }) {
        if (!currentUser.value) return
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.value.id)
        if (error) throw error
        await fetchProfile(currentUser.value.id)
    }

    async function uploadAvatar(file: File): Promise<string> {
        if (!currentUser.value) throw new Error('Not authenticated')
        const ext = file.name.split('.').pop() ?? 'jpg'
        const path = `${currentUser.value.id}/avatar.${ext}`
        const { error } = await supabase.storage
            .from('avatars')
            .upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('avatars').getPublicUrl(path)
        return data.publicUrl
    }

    return {
        currentUser,
        currentProfile,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        linkWallet,
        updateProfile,
        uploadAvatar,
    }
}
