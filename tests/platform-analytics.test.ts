import {describe,expect,it} from "vitest";
import {analyticsPeriodStart,summarizePlatformAnalytics,type PlatformAnalyticsRow} from "../src/lib/platform-analytics";

const base={event_date:"2026-07-15",restaurant_id:"r1",product_id:null,locale:"es",restaurants:{name:"Bistro",slug:"bistro"},products:null};
const row=(event_type:string,event_count:number,extra:Partial<PlatformAnalyticsRow>={}):PlatformAnalyticsRow=>({...base,event_type,event_count,...extra});

describe("analíticas globales",()=>{
  it("valida periodos y calcula el inicio inclusivo",()=>{expect(analyticsPeriodStart("7",new Date("2026-07-15T12:00:00Z"))).toEqual({period:"7",from:"2026-07-09"});expect(analyticsPeriodStart("all").from).toBeNull();expect(analyticsPeriodStart("invalid").period).toBe("30")});
  it("resume embudo, restaurantes, productos e idiomas",()=>{const summary=summarizePlatformAnalytics([row("menu_view",10),row("product_view",20,{product_id:"p1",products:{name:"Burger"}}),row("video_play",8,{product_id:"p1",products:{name:"Burger"}}),row("cart_add",5,{product_id:"p1",products:{name:"Burger"}}),row("share",2,{locale:"en"}),row("contact_click",1)]);expect(summary.totals).toEqual({menuViews:10,productViews:20,videoPlays:8,cartAdds:5,shares:2,contactClicks:1});expect(summary.rates).toEqual({productsPerVisit:2,videoPlayRate:40,cartRate:25,contactRate:10});expect(summary.restaurants[0]).toMatchObject({name:"Bistro",menuViews:10,cartAdds:5});expect(summary.products[0]).toMatchObject({name:"Burger",views:20,videoPlays:8,cartAdds:5});expect(summary.languages).toEqual({es:44,en:2,other:0})});
});
