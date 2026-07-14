import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

type Showcase={restaurants:Array<{slug:string;logoUrl:string;template:string;categories:Array<{slug:string}>;products:Array<{name:string;category:string;videoUrl:string;videoSourceUrl:string}>}>};
const showcase=JSON.parse(readFileSync("supabase/showcase-data.json","utf8")) as Showcase;

describe("showcase multi-restaurante",()=>{
  it("define cinco cartas diferenciadas y completas",()=>{
    expect(showcase.restaurants).toHaveLength(5);
    expect(new Set(showcase.restaurants.map(item=>item.slug)).size).toBe(5);
    expect(new Set(showcase.restaurants.map(item=>item.template)).size).toBe(5);
    expect(new Set(showcase.restaurants.flatMap(item=>item.products.map(product=>product.name))).size).toBe(15);
  });

  it("mantiene cada producto dentro de las categorías de su restaurante",()=>{
    for(const restaurant of showcase.restaurants){
      const categories=new Set(restaurant.categories.map(category=>category.slug));
      expect(restaurant.logoUrl).toMatch(/^\/demo\/logos\/[a-z-]+\.svg$/);
      expect(restaurant.categories).toHaveLength(3);
      expect(restaurant.products).toHaveLength(3);
      for(const product of restaurant.products){
        expect(categories.has(product.category)).toBe(true);
        expect(product.videoUrl).toMatch(/^https:\/\/videos\.pexels\.com\/video-files\//);
        expect(product.videoSourceUrl).toMatch(/^https:\/\/www\.pexels\.com\/video\//);
      }
    }
  });
});
