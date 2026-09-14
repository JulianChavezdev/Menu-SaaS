import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({createClient:vi.fn(),configuredCloudinary:vi.fn(),sign:vi.fn()}));
vi.mock("@/lib/supabase/server",()=>({createClient:mocks.createClient}));
vi.mock("@/lib/supabase/admin-env",()=>({getSupabaseSecretKey:()=>undefined}));
vi.mock("@/lib/cloudinary",()=>({CLOUDINARY_VIDEO_TRANSFORMATION:"optimized",configuredCloudinary:mocks.configuredCloudinary}));
import {POST as signUpload} from "../src/app/api/media/cloudinary-signature/route";
import {POST as analytics} from "../src/app/api/analytics/route";
import {POST as orders} from "../src/app/api/public/orders/route";

const restaurantId="11111111-1111-4111-8111-111111111111";
const productId="22222222-2222-4222-8222-222222222222";
function request(origin="https://menuly.test"){
  return new Request("https://menuly.test/api/media/cloudinary-signature",{method:"POST",headers:{origin,"Content-Type":"application/json"},body:JSON.stringify({restaurantId,productId})});
}
function session(role:string,status="active",suspended=false){
  const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),maybeSingle:vi.fn()};
  query.maybeSingle.mockResolvedValueOnce({data:{role,restaurants:{subscription_status:status,access_suspended:suspended}}}).mockResolvedValueOnce({data:{id:productId}});
  const from=vi.fn(()=>query);
  mocks.createClient.mockResolvedValue({auth:{getUser:async()=>({data:{user:{id:"user"}}})},from});
  return from;
}
describe("media authorization",()=>{
  beforeEach(()=>{
    vi.resetAllMocks();
    mocks.configuredCloudinary.mockReturnValue({cloudName:"test",apiKey:"public",apiSecret:"private",client:{utils:{api_sign_request:mocks.sign}}});
    mocks.sign.mockReturnValue("signature");
  });
  it.each(["waiter","kitchen","unknown"])("denies %s before accessing products or signing",async role=>{
    const from=session(role);
    expect((await signUpload(request())).status).toBe(403);
    expect(from).toHaveBeenCalledTimes(1);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it.each(["past_due","canceled"])("denies %s subscriptions",async status=>{
    session("owner",status);
    expect((await signUpload(request())).status).toBe(403);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it("denies suspended restaurants",async()=>{
    session("owner","active",true);
    expect((await signUpload(request())).status).toBe(403);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
  it.each(["owner","admin","editor"])("allows %s to sign a scoped upload",async role=>{
    session(role);
    const response=await signUpload(request());
    expect(response.status).toBe(200);
    expect((await response.json()).expectedPublicId).toMatch(new RegExp(`^carta-video/${restaurantId}/products/${productId}/`));
    expect(mocks.sign).toHaveBeenCalledTimes(1);
  });
});
describe.each([["upload",signUpload],["analytics",analytics],["orders",orders]] as const)("%s origin validation",(_name,handler)=>{
  it.each(["null","not-a-url","https://attacker.test"])("rejects %s without throwing",async origin=>{
    expect((await handler(request(origin))).status).toBe(403);
  });
});
