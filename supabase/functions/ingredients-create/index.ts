import { getSupabaseAdminClient } from '../_shared/client.ts'
import { handlePreflight, json } from '../_shared/http.ts'

type IngredientPayload = {
  name: unknown
  category: unknown
  quantity_value: unknown
  quantity_unit: unknown
}

function normalizeInput(payload: IngredientPayload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : ''
  const category =
    typeof payload.category === 'string' ? payload.category.trim() : ''
  const quantityValue =
    typeof payload.quantity_value === 'number'
      ? payload.quantity_value
      : Number(payload.quantity_value)
  const quantityUnit =
    typeof payload.quantity_unit === 'string' ? payload.quantity_unit.trim() : ''

  if (!name || name.length > 80) {
    throw new Error('Name is required and must be 1-80 characters.')
  }

  if (!category || category.length > 60) {
    throw new Error('Category is required and must be 1-60 characters.')
  }

  if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
    throw new Error('Quantity value must be a number greater than 0.')
  }

  if (!quantityUnit || quantityUnit.length > 30) {
    throw new Error('Quantity unit is required and must be 1-30 characters.')
  }

  return {
    name,
    category,
    quantity_value: Number(quantityValue.toFixed(2)),
    quantity_unit: quantityUnit,
  }
}

Deno.serve(async (request) => {
  const preflightResponse = handlePreflight(request)
  if (preflightResponse) {
    return preflightResponse
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  try {
    const payload = (await request.json()) as IngredientPayload
    const normalized = normalizeInput(payload)

    const supabase = getSupabaseAdminClient()

    const { data, error } = await supabase
      .from('ingredients')
      .insert(normalized)
      .select('id, name, category, quantity_value, quantity_unit, created_at')
      .single()

    if (error) {
      console.error(error)
      return json({ error: 'Failed to create ingredient.' }, 500)
    }

    return json({ ingredient: data }, 201)
  } catch (error) {
    if (error instanceof Error) {
      return json({ error: error.message }, 400)
    }

    console.error(error)
    return json({ error: 'Unexpected server error.' }, 500)
  }
})
