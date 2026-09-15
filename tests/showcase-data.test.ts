import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

type Showcase={legacyDemoSlugs:string[];restaurants:Array<{slug:string;logoUrl:string;template:string;categories:Array<{slug:string}>;products:Array<{name:string;category:string;videoUrl:string;videoSourceUrl:string;allergens:string[];recommendations?:string[]}>}>};
const showcase=JSON.parse(readFileSync("supabase/showcase-data.json","utf8")) as Showcase;

describe("showcase canónico",()=>{
  it("define una única carta demo completa",()=>{
    expect(showcase.restaurants).toHaveLength(1);
    expect(showcase.restaurants[0].slug).toBe("bistro-nube");
    expect(showcase.legacyDemoSlugs).toEqual(["pizzeria-roma","cafe-central","la-brasa","sushi-yume"]);
    expect(showcase.restaurants[0].categories).toHaveLength(4);
    expect(showcase.restaurants[0].products).toHaveLength(9);
    expect(new Set(showcase.restaurants[0].products.map(product=>product.videoUrl)).size).toBe(9);
  });

  it("mantiene cada producto dentro de las categorías de su restaurante",()=>{
    for(const restaurant of showcase.restaurants){
      const categories=new Set(restaurant.categories.map(category=>category.slug));
      expect(restaurant.logoUrl).toMatch(/^\/demo\/logos\/[a-z-]+\.svg$/);
      expect(restaurant.categories).toHaveLength(4);
      expect(restaurant.products).toHaveLength(9);
      for(const category of restaurant.categories){
        expect(restaurant.products.filter(product=>product.category===category.slug).length).toBeGreaterThanOrEqual(1);
      }
      const productNames=new Set(restaurant.products.map(product=>product.name));
      for(const product of restaurant.products){
        expect(categories.has(product.category)).toBe(true);
        expect(product.videoUrl).toMatch(/^https:\/\/videos\.pexels\.com\/video-files\//);
        expect(product.videoSourceUrl).toMatch(/^https:\/\/www\.pexels\.com\/es-es\/video\//);
        expect(Array.isArray(product.allergens)).toBe(true);
        expect(product.recommendations?.length??0).toBeGreaterThan(0);
        expect(product.recommendations?.length??0).toBeLessThanOrEqual(3);
        for(const recommendation of product.recommendations??[]){expect(productNames.has(recommendation)).toBe(true);expect(recommendation).not.toBe(product.name)}
      }
    }
  });
});
