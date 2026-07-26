import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      persons: {
        Row: Person
        Insert: Omit<Person, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Person, 'id' | 'created_at'>>
      }
      marriages: {
        Row: Marriage
        Insert: Omit<Marriage, 'id' | 'created_at'>
        Update: Partial<Omit<Marriage, 'id' | 'created_at'>>
      }
    }
  }
}

export interface Person {
  id: string
  name: string
  nickname?: string | null
  gender: 'male' | 'female'
  birth_date?: string | null
  death_date?: string | null
  is_alive: boolean
  photo_url?: string | null
  bio?: string | null
  birthplace?: string | null
  generation: number
  parent_id?: string | null
  created_at: string
  updated_at: string
}

export interface Marriage {
  id: string
  husband_id: string
  wife_id: string
  marriage_date?: string | null
  divorce_date?: string | null
  is_active: boolean
  notes?: string | null
  created_at: string
}

export interface PersonWithRelations extends Person {
  children?: Person[]
  spouse?: Person | null
  marriages?: Marriage[]
}
