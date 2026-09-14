import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({set:vi.fn(),getAll:vi.fn(),createServerClient:vi.fn()}));
vi.mock("next/headers",()=>({cookies:async()=>({set:mocks.set,getAll:mocks.getAll})}));
vi.mock("@supabase/ssr",()=>({createServerClient:mocks.createServerClient}));
import {createClient} from "../src/lib/supabase/server";

describe("server session persistence",()=>{
  beforeEach(()=>vi.resetAllMocks());
  it("writes all session cookies and preserves security and expiration options",async()=>{
    await createClient();
    const adapter=mocks.createServerClient.mock.calls[0][2].cookies;
    const options={path:"/",sameSite:"lax",secure:true,maxAge:3600};
    adapter.setAll([{name:"sb-session.0",value:"part-one",options},{name:"sb-session.1",value:"part-two",options}]);
    expect(mocks.set).toHaveBeenNthCalledWith(1,"sb-session.0","part-one",options);
    expect(mocks.set).toHaveBeenNthCalledWith(2,"sb-session.1","part-two",options);
  });
  it("expires cookies when the auth client clears a session",async()=>{
    await createClient();
    mocks.createServerClient.mock.calls[0][2].cookies.setAll([{name:"sb-session",value:"",options:{maxAge:0}}]);
    expect(mocks.set).toHaveBeenCalledWith("sb-session","",{maxAge:0});
  });
  it("allows read-only rendering while middleware handles cookie refresh",async()=>{
    mocks.set.mockImplementation(()=>{throw new Error("Cookies are read-only")});
    await createClient();
    expect(()=>mocks.createServerClient.mock.calls[0][2].cookies.setAll([{name:"sb-session",value:"new",options:{}}])).not.toThrow();
  });
});
