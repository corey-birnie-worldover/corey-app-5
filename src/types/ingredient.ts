///// -------- Ingredient Types -------- /////

export type Ingredient = {
  id: string
  name: string
  category: string
  quantity_value: number
  quantity_unit: string
  created_at: string
}

export type IngredientPayload = Pick<
  Ingredient,
  'name' | 'category' | 'quantity_value' | 'quantity_unit'
>
