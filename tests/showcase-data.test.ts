import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

type Showcase={legacyDemoSlugs:string[];restaurants:Array<{slug:string;logoUrl:string;template:string;categories:Array<{slug:string}>;products:Array<{name:string;category:string;videoUrl:string;videoSourceUrl:string}>}>};
const showcase=JSON.parse(readFileSync("supabase/showcase-data.json","utf8")) as Showcase;

describe("showcase canónico",()=>{
  it("define una única carta demo completa",()=>{
    expect(showcase.restaurants).toHaveLength(1);
    expect(showcase.restaurants[0].slug).toBe("bistro-nube");
    expect(showcase.legacyDemoSlugs).toEqual(["pizzeria-roma","cafe-central","la-brasa","sushi-yume"]);
    expect(showcase.restaurants[0].categories).toHaveLength(7);
    expect(new Set(showcase.restaurants.flatMap(item=>item.products.map(product=>product.name))).size).toBe(15);
  });

  it("mantiene cada producto dentro de las categorías de su restaurante",()=>{
    for(const restaurant of showcase.restaurants){
      const categories=new Set(restaurant.categories.map(category=>category.slug));
      expect(restaurant.logoUrl).toMatch(/^\/demo\/logos\/[a-z-]+\.svg$/);
      expect(restaurant.categories).toHaveLength(7);
      expect(restaurant.products).toHaveLength(15);
      for(const product of restaurant.products){
        expect(categories.has(product.category)).toBe(true);
        expect(product.videoUrl).toMatch(/^https:\/\/videos\.pexels\.com\/video-files\//);
        expect(product.videoSourceUrl).toMatch(/^https:\/\/www\.pexels\.com\/video\//);
      }
    }
  });
});
