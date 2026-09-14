import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({activeRestaurant:vi.fn(),resource:vi.fn(),destroy:vi.fn()}));
vi.mock("@/lib/permissions",()=>({activeRestaurant:mocks.activeRestaurant,canAddCategory:vi.fn(),canAddProduct:vi.fn()}));
vi.mock("@/lib/supabase/admin-env",()=>({getSupabaseSecretKey:()=>undefined}));
vi.mock("next/cache",()=>({revalidatePath:vi.fn()}));
vi.mock("@/lib/cloudinary",()=>({
  configuredCloudinary:()=>({client:{api:{resource:mocks.resource}}}),
  destroyCloudinaryVideo:mocks.destroy,
  optimizedCloudinaryVideoUrl:()=>"https://res.cloudinary.com/test/video.mp4",
  cloudinaryVideoPosterUrl:()=>"https://res.cloudinary.com/test/poster.jpg",
}));
import {assignCloudinaryVideo} from "../src/app/dashboard/actions";

const restaurantId="11111111-1111-4111-8111-111111111111";
const productId="22222222-2222-4222-8222-222222222222";
const publicId=`carta-video/${restaurantId}/products/${productId}/33333333-3333-4333-8333-333333333333`;
function setup(role="owner",previousPath="cloudinary:old-video",updateFails=false){
  const save=vi.fn(async()=>{if(updateFails)throw new Error("No rows updated");return{data:{id:productId}}});
  const query={select:vi.fn().mockReturnThis(),eq:vi.fn().mockReturnThis(),update:vi.fn().mockReturnThis(),single:vi.fn()};
  query.single.mockReturnValueOnce(Promise.resolve({data:{video_path:previousPath,image_path:null},error:null})).mockReturnValueOnce({throwOnError:save});
  mocks.activeRestaurant.mockResolvedValue({member:{role},restaurant:{id:restaurantId,slug:"test",subscription_status:"active"},supabase:{from:()=>query}});
  return save;
}
describe("Cloudinary assignment",()=>{
  beforeEach(()=>vi.resetAllMocks());
  it.each(["waiter","kitchen"])("blocks %s before any external media operation",async role=>{
    setup(role);
    await expect(assignCloudinaryVideo(productId,publicId)).rejects.toThrow("permiso");
    expect(mocks.resource).not.toHaveBeenCalled();
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
  it("preserves the existing video when database update is denied",async()=>{
    setup("owner","cloudinary:old-video",true);
    await expect(assignCloudinaryVideo(productId,publicId)).rejects.toThrow("No rows updated");
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
  it("does not delete the active video when assignment is retried",async()=>{
    const save=setup("owner",`cloudinary:${publicId}`);
    await assignCloudinaryVideo(productId,publicId);
    expect(save).toHaveBeenCalled();
    expect(mocks.destroy).not.toHaveBeenCalled();
  });
  it("cleans the previous video after a successful replacement",async()=>{
    const save=setup();
    await assignCloudinaryVideo(productId,publicId);
    expect(save).toHaveBeenCalled();
    expect(mocks.destroy).toHaveBeenCalledWith("cloudinary:old-video");
  });
});
