import { z } from 'zod'

import type { Ingredient, IngredientPayload } from '@/types/ingredient'

const ingredientSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  quantity_value: z.number(),
  quantity_unit: z.string(),
  created_at: z.string(),
})

const listResponseSchema = z.object({
  ingredients: z.array(ingredientSchema),
})

const createResponseSchema = z.object({
  ingredient: ingredientSchema,
})

const deleteResponseSchema = z.object({
  deletedId: z.string().uuid(),
})

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const functionsBaseUrl = (
  import.meta.env.VITE_EDGE_FUNCTIONS_BASE_URL ?? `${supabaseUrl}/functions/v1`
).replace(/\/$/, '')

function getHeaders() {
  if (!supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_ANON_KEY in environment variables.')
  }

  return {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
  }
}

async function requestJson<T>(
  endpoint: string,
  init: RequestInit,
  schema: z.ZodSchema<T>,
): Promise<T> {
  if (!supabaseUrl) {
    throw new Error('Missing VITE_SUPABASE_URL in environment variables.')
  }

  const response = await fetch(`${functionsBaseUrl}/${endpoint}`, {
    ...init,
    headers: {
      ...getHeaders(),
      ...init.headers,
    },
  })

  const body = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      typeof body?.error === 'string' ? body.error : 'Request failed. Please try again.'

    throw new Error(message)
  }

  return schema.parse(body)
}

export async function listIngredients() {
  const data = await requestJson(
    'ingredients-list',
    { method: 'GET' },
    listResponseSchema,
  )

  return data.ingredients
}

export async function createIngredient(payload: IngredientPayload) {
  const data = await requestJson(
    'ingredients-create',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    createResponseSchema,
  )

  return data.ingredient
}

export async function deleteIngredient(ingredientId: Ingredient['id']) {
  const data = await requestJson(
    `ingredients-delete?id=${ingredientId}`,
    {
      method: 'DELETE',
    },
    deleteResponseSchema,
  )

  return data.deletedId
}
