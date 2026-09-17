import {describe,it,expect,vi,beforeEach} from "vitest";
const mocks=vi.hoisted(()=>({from:vi.fn(),active:vi.fn(),revalidate:vi.fn()}));
vi.mock("@/lib/permissions",()=>({activeRestaurant:mocks.active}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
import {saveProductCustomization} from "@/app/dashboard/menu/customization-actions";
const id=(n:number)=>`00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const valid={enabled:true,groups:[{id:id(2),name:"EXTRA",min:0,max:1,options:[{id:id(3),name:"Nata",priceCents:0,available:true,imageUrl:null}]}]};
beforeEach(()=>{vi.clearAllMocks();mocks.active.mockResolvedValue({supabase:{from:mocks.from},restaurant:{id:id(4),slug:"test"},member:{role:"owner"}})});
describe("customization validation responses",()=>{
  it("returns a useful validation error without throwing or writing to the database",async()=>{
    const input=structuredClone(valid);input.groups[0].max=8;
    await expect(saveProductCustomization(id(1),input)).resolves.toMatchObject({ok:false,error:expect.stringContaining("opciones creadas (1)")});expect(mocks.from).not.toHaveBeenCalled();
  });
  it("rejects inverted limits and unauthorized editing without a server exception",async()=>{
    const input=structuredClone(valid);input.groups[0].min=2;
    await expect(saveProductCustomization(id(1),input)).resolves.toMatchObject({ok:false,error:expect.stringContaining("mínimo (2)")});
    mocks.active.mockResolvedValue({member:{role:"kitchen"}});await expect(saveProductCustomization(id(1),valid)).resolves.toMatchObject({ok:false,error:expect.stringContaining("permisos")});expect(mocks.from).not.toHaveBeenCalled();
  });
  it("saves valid limits using the restaurant scope",async()=>{
    const eq=vi.fn().mockReturnThis();mocks.from.mockReturnValue({update:vi.fn().mockReturnValue({eq,select:vi.fn().mockReturnValue({maybeSingle:vi.fn().mockResolvedValue({data:{id:id(1)},error:null})})})});
    await expect(saveProductCustomization(id(1),valid)).resolves.toEqual({ok:true});expect(eq).toHaveBeenCalledWith("restaurant_id",id(4));expect(mocks.revalidate).toHaveBeenCalledWith("/dashboard/menu");
  });
});
