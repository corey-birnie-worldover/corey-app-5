import { getSupabaseAdminClient } from '../_shared/client.ts'
import { handlePreflight, json } from '../_shared/http.ts'

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (request) => {
  const preflightResponse = handlePreflight(request)
  if (preflightResponse) {
    return preflightResponse
  }

  if (request.method !== 'DELETE') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')

    if (!id || !uuidRegex.test(id)) {
      return json({ error: 'A valid ingredient id is required.' }, 400)
    }

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
      .select('id')
      .maybeSingle()

    if (error) {
      console.error(error)
      return json({ error: 'Failed to delete ingredient.' }, 500)
    }

    if (!data) {
      return json({ error: 'Ingredient not found.' }, 404)
    }

    return json({ deletedId: data.id })
  } catch (error) {
    console.error(error)
    return json({ error: 'Unexpected server error.' }, 500)
  }
})
