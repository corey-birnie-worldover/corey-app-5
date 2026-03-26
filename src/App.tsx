import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createIngredient,
  deleteIngredient,
  listIngredients,
} from "@/lib/ingredients-api";
import type { Ingredient } from "@/types/ingredient";

const ingredientFormSchema = z.object({
  name: z.string().trim().min(1, "Ingredient name is required.").max(80),
  category: z.string().trim().min(1, "Category is required.").max(60),
  quantity_value: z.number().positive("Quantity value must be greater than 0."),
  quantity_unit: z.string().trim().min(1, "Unit is required.").max(30),
});

type IngredientFormValues = {
  name: string;
  category: string;
  quantity_value: string;
  quantity_unit: string;
};

const EMPTY_FORM: IngredientFormValues = {
  name: "",
  category: "",
  quantity_value: "",
  quantity_unit: "",
};

function toTitleCase(value: string) {
  return value
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatQuantity(ingredient: Ingredient) {
  const numeric = Number(ingredient.quantity_value);
  const normalized = Number.isInteger(numeric)
    ? numeric.toString()
    : numeric.toFixed(2).replace(/\.00$/, "");

  return `${normalized} ${ingredient.quantity_unit}`;
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function App() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [formValues, setFormValues] =
    useState<IngredientFormValues>(EMPTY_FORM);
  const [initialLoading, setInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ingredientCount = useMemo(() => ingredients.length, [ingredients]);

  const fetchIngredients = useCallback(async () => {
    try {
      setError(null);
      const items = await listIngredients();
      setIngredients(items);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error
          ? fetchError.message
          : "Could not load ingredients.";
      setError(message);
    } finally {
      setInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIngredients();
  }, [fetchIngredients]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = ingredientFormSchema.safeParse({
      name: formValues.name,
      category: formValues.category,
      quantity_value: Number(formValues.quantity_value),
      quantity_unit: formValues.quantity_unit,
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Please check your input values."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const ingredient = await createIngredient({
        ...parsed.data,
        category: toTitleCase(parsed.data.category),
      });

      setIngredients((current) => [ingredient, ...current]);
      setFormValues(EMPTY_FORM);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not add ingredient.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(ingredientId: string) {
    try {
      setDeletingId(ingredientId);
      setError(null);
      await deleteIngredient(ingredientId);
      setIngredients((current) =>
        current.filter((item) => item.id !== ingredientId)
      );
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete ingredient.";
      setError(message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-8 lg:px-12">
      <header className="mb-8 space-y-4 md:mb-10">
        <Badge
          variant="outline"
          className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-700"
        >
          Ingredient Register
        </Badge>
        <h1 className="inked-title text-4xl text-slate-900 sm:text-5xl">
          Keep your pantry inventory tidy10.
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          Add ingredients with category and quantity, then remove them when
          stock runs out. This app uses Supabase Edge Functions for all database
          operations.
        </p>
      </header>

      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.7fr]">
        <Card className="surface-glow border border-blue-100/70 bg-white/95 backdrop-blur-sm">
          <CardHeader className="gap-2">
            <CardTitle className="text-lg text-slate-900">
              Add ingredient
            </CardTitle>
            <CardDescription>
              Use precise quantities so inventory stays actionable.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Chickpeas"
                  value={formValues.name}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Pulses"
                  value={formValues.category}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="quantity-value">Quantity</Label>
                  <Input
                    id="quantity-value"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formValues.quantity_value}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        quantity_value: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quantity-unit">Unit</Label>
                  <Input
                    id="quantity-unit"
                    placeholder="kg"
                    value={formValues.quantity_unit}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        quantity_unit: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-10 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add ingredient
                  </>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-between bg-blue-50/60 text-xs text-blue-700">
            <span>Environment-backed by Supabase</span>
            <span>{ingredientCount} items</span>
          </CardFooter>
        </Card>

        <Card className="surface-glow border border-blue-100/70 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-900">
              Current ingredients
            </CardTitle>
            <CardDescription>
              Newest ingredients appear first for quick updates.
            </CardDescription>
          </CardHeader>
          <Separator className="bg-blue-100/80" />
          <CardContent className="pt-4">
            {initialLoading ? (
              <div className="flex min-h-44 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/50 text-sm text-blue-800">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Loading ingredients...
              </div>
            ) : ingredientCount === 0 ? (
              <div className="min-h-44 rounded-xl border border-dashed border-blue-200 bg-blue-50/40 p-6 text-center text-sm text-blue-800">
                No ingredients yet. Add your first item from the form.
              </div>
            ) : (
              <Table>
                <TableCaption className="text-xs text-slate-500">
                  Inventory rows are stored in your active Supabase environment.
                </TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingredient</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ingredient) => (
                    <TableRow key={ingredient.id}>
                      <TableCell className="font-medium text-slate-900">
                        {ingredient.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="rounded-full bg-blue-100 px-2.5 text-blue-700"
                        >
                          {ingredient.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatQuantity(ingredient)}</TableCell>
                      <TableCell>
                        {formatTimestamp(ingredient.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:bg-red-50 hover:text-red-600"
                          onClick={() => void handleDelete(ingredient.id)}
                          disabled={deletingId === ingredient.id}
                        >
                          {deletingId === ingredient.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Trash2 className="size-4" />
                          )}
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

export default App;
