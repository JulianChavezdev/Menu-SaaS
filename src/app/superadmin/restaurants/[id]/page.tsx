import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  RotateCcw,
} from "lucide-react";
import { MENU_TEMPLATES } from "@/lib/menu-templates";
import { requireSuperadmin } from "@/lib/superadmin";
import {
  setManagedCategoryVisibility,
  setManagedProductAvailability,
  setRestaurantSuspension,
  updateManagedRestaurant,
} from "@/app/superadmin/actions";
import { SupportContentEditor } from "@/components/superadmin/support-content-editor";
import { ManualPaymentPanel } from "@/components/superadmin/manual-payment-panel";
import { RestaurantRestorePanel } from "@/components/superadmin/restaurant-restore-panel";
import { DeleteRestaurantPanel } from "@/components/superadmin/delete-restaurant-panel";

export default async function ManagedRestaurantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    payment?: string;
    restored?: string;
  }>;
}) {
  const [{ id }, { saved, payment, restored }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { admin, user } = await requireSuperadmin();
  const [
    { data: restaurant, error },
    { data: categories },
    { data: products },
    { data: audit },
    { data: subscription },
    { data: payments },
    { data: backups },
  ] = await Promise.all([
    admin.from("restaurants").select("*").eq("id", id).maybeSingle(),
    admin
      .from("categories")
      .select("id,name,is_active,sort_order")
      .eq("restaurant_id", id)
      .order("sort_order"),
    admin
      .from("products")
      .select(
        "id,name,description,price_cents,category_id,is_available,is_featured,video_url,categories(name)",
      )
      .eq("restaurant_id", id)
      .order("sort_order"),
    admin
      .from("superadmin_audit_log")
      .select("id,action,details,created_at")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(12),
    admin
      .from("subscriptions")
      .select("provider,status,current_period_end")
      .eq("restaurant_id", id)
      .maybeSingle(),
    admin
      .from("manual_payments")
      .select(
        "id,amount_cents,currency,method,paid_at,period_end,reference,notes",
      )
      .eq("restaurant_id", id)
      .order("paid_at", { ascending: false })
      .limit(24),
    admin
      .from("restaurant_backups")
      .select("id,reason,category_count,product_count,created_at")
      .eq("restaurant_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  if (error || !restaurant) notFound();
  const owner = await admin.auth.admin.getUserById(restaurant.owner_id);
  return (
    <main className="mx-auto max-w-7xl p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-5">
        <div>
          <Link
            href="/superadmin"
            className="text-sm text-orange-700 hover:text-orange-800"
          >
            ← Volver a restaurantes
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">{restaurant.name}</h1>
            {restaurant.access_suspended ? (
              <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase text-red-700">
                Acceso suspendido
              </span>
            ) : (
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold uppercase text-emerald-800">
                Con acceso
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Propietario: {owner.data.user?.email ?? restaurant.owner_id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={`/superadmin-preview/${restaurant.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-2 text-sm"
          >
            <ExternalLink size={16} />
            Vista previa
          </a>
          <form action={setRestaurantSuspension}>
            <input type="hidden" name="restaurant_id" value={restaurant.id} />
            <input
              type="hidden"
              name="suspended"
              value={restaurant.access_suspended ? "false" : "true"}
            />
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold ${restaurant.access_suspended ? "bg-emerald-600" : "bg-red-600"}`}
            >
              {restaurant.access_suspended ? (
                <>
                  <RotateCcw size={16} />
                  Restaurar acceso
                </>
              ) : (
                <>
                  <Ban size={16} />
                  Suspender por impago
                </>
              )}
            </button>
          </form>
        </div>
      </div>
      {saved && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          Cambios administrativos guardados.
        </div>
      )}
      {payment && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-800">
          <CheckCircle2 size={18} />
          Pago registrado y acceso premium activado.
        </div>
      )}
      {restored && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-950">
          <CheckCircle2 size={18} />
          Restaurante recuperado en modo seguro: permanece suspendido y sin
          publicar hasta que revises y guardes su configuración.
        </div>
      )}

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.6fr)]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold">Configuración del restaurante</h2>
          <p className="mt-1 text-sm text-slate-500">
            Los cambios se aplican con la service role y quedan registrados.
          </p>
          <form
            action={updateManagedRestaurant}
            className="mt-5 grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" name="restaurant_id" value={restaurant.id} />
            <Field label="Nombre">
              <input name="name" required defaultValue={restaurant.name} />
            </Field>
            <Field label="Slug público">
              <input name="slug" required defaultValue={restaurant.slug} />
            </Field>
            <Field label="Correo">
              <input
                name="email"
                type="email"
                defaultValue={restaurant.email ?? ""}
              />
            </Field>
            <Field label="Teléfono">
              <input name="phone" defaultValue={restaurant.phone ?? ""} />
            </Field>
            <Field label="Dirección" wide>
              <input name="address" defaultValue={restaurant.address ?? ""} />
            </Field>
            <Field label="Descripción" wide>
              <textarea
                name="description"
                defaultValue={restaurant.description ?? ""}
                className="min-h-24"
              />
            </Field>
            <Field label="Estado de suscripción">
              <select
                name="subscription_status"
                defaultValue={restaurant.subscription_status}
              >
                <option value="active">Activo / acceso premium</option>
                <option value="past_due">Pago pendiente</option>
                <option value="canceled">Cancelado</option>
              </select>
            </Field>
            <Field label="Plantilla">
              <select
                name="menu_template"
                defaultValue={restaurant.menu_template}
              >
                {Object.values(MENU_TEMPLATES).map((template) => (
                  <option key={template.key} value={template.key}>
                    {template.name} ·{" "}
                    {template.tier === "free" ? "Gratis" : "Premium"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Idioma base">
              <select name="locale" defaultValue={restaurant.locale}>
                <option value="es-ES">Español (España)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-MX">Español (México)</option>
              </select>
            </Field>
            <Field label="Moneda">
              <select name="currency" defaultValue={restaurant.currency}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="MXN">MXN</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 p-3">
              <input
                name="is_published"
                type="checkbox"
                defaultChecked={restaurant.is_published}
              />
              Carta publicada
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-stone-200 p-3">
              <input
                name="language_switcher_enabled"
                type="checkbox"
                defaultChecked={restaurant.language_switcher_enabled}
              />
              Selector de idioma
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[.04] p-3">
              <input
                name="access_suspended"
                type="checkbox"
                defaultChecked={restaurant.access_suspended}
              />
              Suspender acceso
            </label>
            <Field label="Motivo de suspensión">
              <input
                name="suspension_reason"
                defaultValue={restaurant.suspension_reason ?? ""}
                placeholder="Ej. Pago pendiente"
              />
            </Field>
            <button className="rounded-xl bg-orange-600 px-5 py-3 font-bold md:col-span-2">
              Guardar cambios administrativos
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.04] p-5">
            <h2 className="font-bold">Exportar y respaldar</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              Descarga los datos antes de realizar cambios de soporte
              importantes. Los vídeos se referencian, pero no se incluyen como
              archivos binarios.
            </p>
            <div className="mt-4 grid gap-2">
              <a
                href={`/api/superadmin/restaurants/${restaurant.id}/export`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold hover:bg-cyan-500"
              >
                <Download size={17} />
                Copia completa JSON
              </a>
              <a
                href={`/api/superadmin/restaurants/${restaurant.id}/export?format=csv`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 px-4 py-3 text-sm font-semibold hover:bg-stone-100"
              >
                <FileSpreadsheet size={17} />
                Carta en CSV
              </a>
            </div>
          </section>
          <RestaurantRestorePanel
            restaurantId={restaurant.id}
            restaurantSlug={restaurant.slug}
            backups={
              (backups ?? []) as {
                id: string;
                reason: "daily" | "manual" | "pre_restore";
                category_count: number;
                product_count: number;
                created_at: string;
              }[]
            }
          />
          <section className="rounded-3xl border border-stone-200 bg-white p-5">
            <h2 className="font-bold">Resumen</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Summary label="Productos" value={products?.length ?? 0} />
              <Summary label="Categorías" value={categories?.length ?? 0} />
              <Summary label="Estado" value={restaurant.subscription_status} />
              <Summary
                label="Creado"
                value={new Intl.DateTimeFormat("es-ES", {
                  dateStyle: "medium",
                }).format(new Date(restaurant.created_at))}
              />
            </dl>
          </section>
          <section className="rounded-3xl border border-stone-200 bg-white p-5">
            <h2 className="font-bold">Actividad administrativa</h2>
            <div className="mt-4 space-y-3">
              {(audit ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="border-l-2 border-orange-400/30 pl-3"
                >
                  <p className="text-sm font-semibold">{entry.action}</p>
                  <p className="text-xs text-slate-500">
                    {new Intl.DateTimeFormat("es-ES", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(entry.created_at))}
                  </p>
                </div>
              ))}
              {!audit?.length && (
                <p className="text-sm text-slate-500">
                  Todavía no hay acciones registradas.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-bold">Categorías</h2>
          <div className="mt-4 space-y-2">
            {(categories ?? []).map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 p-3"
              >
                <div>
                  <p className="font-semibold">{category.name}</p>
                  <p className="text-xs text-slate-500">
                    {category.is_active ? "Visible" : "Oculta"}
                  </p>
                </div>
                <form action={setManagedCategoryVisibility}>
                  <input
                    type="hidden"
                    name="restaurant_id"
                    value={restaurant.id}
                  />
                  <input type="hidden" name="category_id" value={category.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={category.is_active ? "false" : "true"}
                  />
                  <button className="rounded-lg border border-stone-300 px-3 py-2 text-xs">
                    {category.is_active ? "Ocultar" : "Mostrar"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-3xl border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-bold">Productos</h2>
          <div className="mt-4 space-y-2">
            {(products ?? []).map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{product.name}</p>
                  <p className="truncate text-xs text-slate-500">
                    {(product.categories as unknown as { name: string } | null)
                      ?.name ?? "Sin categoría"}{" "}
                    · {(product.price_cents / 100).toFixed(2)} € ·{" "}
                    {product.video_url ? "Con vídeo" : "Sin vídeo"}
                  </p>
                </div>
                <form action={setManagedProductAvailability}>
                  <input
                    type="hidden"
                    name="restaurant_id"
                    value={restaurant.id}
                  />
                  <input type="hidden" name="product_id" value={product.id} />
                  <input
                    type="hidden"
                    name="available"
                    value={product.is_available ? "false" : "true"}
                  />
                  <button className="rounded-lg border border-stone-300 px-3 py-2 text-xs">
                    {product.is_available ? "Ocultar" : "Mostrar"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      </div>
      <SupportContentEditor
        restaurantId={restaurant.id}
        categories={categories ?? []}
        products={products ?? []}
      />
      <ManualPaymentPanel
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        phone={restaurant.phone}
        email={restaurant.email}
        currency={restaurant.currency}
        subscription={subscription}
        payments={payments ?? []}
      />
      <DeleteRestaurantPanel
        restaurantId={restaurant.id}
        restaurantName={restaurant.name}
        restaurantSlug={restaurant.slug}
        superadminEmail={user.email ?? ""}
      />
    </main>
  );
}

function Field({
  label,
  wide = false,
  children,
}: {
  label: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={wide ? "md:col-span-2" : ""}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-stone-200 [&_input]:bg-stone-100 [&_input]:p-3 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-stone-200 [&_select]:bg-stone-100 [&_select]:p-3 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-stone-200 [&_textarea]:bg-stone-100 [&_textarea]:p-3">
        {children}
      </div>
    </label>
  );
}
function Summary({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-white p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 font-bold capitalize">{value}</dd>
    </div>
  );
}
