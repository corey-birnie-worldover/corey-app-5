import { getSupabaseAdminClient } from '../_shared/client.ts'
import { handlePreflight, json } from '../_shared/http.ts'

Deno.serve(async (request) => {
  const preflightResponse = handlePreflight(request)
  if (preflightResponse) {
    return preflightResponse
  }

  if (request.method !== 'GET') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('ingredients')
      .select('id, name, category, quantity_value, quantity_unit, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      return json({ error: 'Failed to load ingredients.' }, 500)
    }

    return json({ ingredients: data ?? [] })
  } catch (error) {
    console.error(error)
    return json({ error: 'Unexpected server error.' }, 500)
  }
})
