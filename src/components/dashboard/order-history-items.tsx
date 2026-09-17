import type {OptionSnapshot} from "@/lib/product-customization";

export type OrderHistoryItem={
  id:string;product_name:string;quantity:number;unit_price_cents:number;
  line_total_cents:number;note:string|null;selected_options:OptionSnapshot[];
};

export function OrderHistoryItems({items,currency}:{items:OrderHistoryItem[];currency:string}){
  const money=(cents:number)=>new Intl.NumberFormat("es-ES",{style:"currency",currency}).format(cents/100);
  if(!items.length)return <p role="status" className="mt-3 border-y border-stone-100 py-3 text-sm text-slate-600">No se ha podido recuperar el detalle de este pedido. Actualiza la página; si sigue igual, contacta con soporte.</p>;
  return <ul aria-label="Productos del pedido" className="mt-3 divide-y divide-stone-100 border-y border-stone-100 text-sm">
    {items.map(item=><li key={item.id} className="py-3">
      <div className="flex items-start justify-between gap-4"><strong>{item.quantity}× {item.product_name}</strong><strong className="shrink-0 tabular-nums">{money(item.line_total_cents)}</strong></div>
      <p className="mt-1 text-xs text-slate-500">{money(item.unit_price_cents)} por unidad, opciones incluidas</p>
      {!!item.selected_options?.length&&<ul aria-label={`Opciones de ${item.product_name.trim()}`} className="mt-2 space-y-1 text-xs text-slate-600">{item.selected_options.map(option=><li key={`${option.groupId}:${option.optionId}`}><span className="font-semibold">{option.groupName}:</span> {option.name}{option.priceCents>0&&` (+${money(option.priceCents)} por unidad)`}</li>)}</ul>}
      {item.note&&<p className="mt-2 text-xs text-amber-800">Nota del producto: {item.note}</p>}
    </li>)}
  </ul>;
}
