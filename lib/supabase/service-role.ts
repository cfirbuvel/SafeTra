import { createClient } from "@supabase/supabase-js"
import { Database } from "@/lib/types/database"

let serviceRoleClient: ReturnType<typeof createClient<Database>> | null = null

export function getServiceRoleClient() {
  if (!serviceRoleClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase environment variables for Service Role Client")
    }

    serviceRoleClient = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }
  return serviceRoleClient
}
