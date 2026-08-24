import {z} from "zod";

export const ORDERING_SESSION_MINUTES=90;
export const ACTIVE_ORDER_STATUSES=["pending","accepted","preparing","ready"] as const;
export const orderStatusSchema=z.enum(["pending","accepted","preparing","ready","delivered","rejected","cancelled"]);
export type OrderStatus=z.infer<typeof orderStatusSchema>;

export const publicOrderSchema=z.object({
  tableCode:z.string().uuid(),
  requestId:z.string().uuid(),
  lines:z.array(z.object({
    productId:z.string().uuid(),
    quantity:z.number().int().min(1).max(20),
    note:z.string().trim().max(300).default(""),
  })).min(1).max(30),
  customerNote:z.string().trim().max(300).default(""),
}).superRefine((value,context)=>{
  const unique=new Set(value.lines.map(line=>line.productId));
  if(unique.size!==value.lines.length)context.addIssue({code:"custom",path:["lines"],message:"No se permiten productos duplicados"});
});

const transitions:Record<OrderStatus,readonly OrderStatus[]>={
  pending:["ready","rejected","cancelled"],
  accepted:["ready","cancelled"],
  preparing:["ready","cancelled"],
  ready:["delivered"],
  delivered:[],rejected:["pending"],cancelled:["pending"],
};

export function canTransitionOrder(from:OrderStatus,to:OrderStatus){return transitions[from].includes(to)}
export function sessionExpiresAt(now=new Date(),minutes=ORDERING_SESSION_MINUTES){return new Date(now.getTime()+minutes*60_000)}
export function isOpenSession(session:{status:string;expires_at:string},now=new Date()){return session.status==="open"&&new Date(session.expires_at)>now}
