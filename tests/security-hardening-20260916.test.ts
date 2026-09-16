import {describe,it,expect} from "vitest";
import {safeExternalUrl} from "@/lib/safe-url";
import {contentSecurityPolicy} from "@/lib/content-security-policy";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {parseRestaurantBackup} from "@/lib/restaurant-restore";
describe("injection defenses",()=>{
 it("rejects executable, embedded, obfuscated and credential-bearing links",()=>{
  for(const value of ['javascript:alert(1)','JaVaScRiPt:alert(1)','data:text/html,<script>alert(1)</script>','vbscript:msgbox(1)','//evil.test','https://name:password@example.com','java\nscript:alert(1)','https://example.com/\u0000'])expect(safeExternalUrl(value)).toBeNull();
  expect(safeExternalUrl('https://example.com/menu?a=1')).toBe('https://example.com/menu?a=1');
 });
 it("requires nonces, blocks event handlers and disallows eval in production",()=>{
  const policy=contentSecurityPolicy("nonceOne");const scripts=policy.split('; ').find(d=>d.startsWith('script-src '))!;
  expect(scripts).toContain("'nonce-nonceOne'");expect(scripts).toContain("'strict-dynamic'");expect(scripts).not.toContain('unsafe-inline');expect(scripts).not.toContain('unsafe-eval');expect(policy).toContain("script-src-attr 'none'");expect(()=>contentSecurityPolicy("x'; script-src *")).toThrow();
 });
 it("renders product and customer text without executing markup",()=>{
  const html=renderToStaticMarkup(createElement('p',null,'<img src=x onerror=alert(1)>'));expect(html).not.toContain('<img');expect(html).toContain('&lt;img');
 });
 it("rejects executable URLs inside uploaded backups",()=>{
  const id='11111111-1111-4111-8111-111111111111';const base={format:'carta-video.restaurant-backup',version:1,exportedAt:'2026-09-16T12:00:00Z',mediaFilesIncluded:false,restaurant:{id,name:'Test',slug:'test',menu_template:'cinematic',currency:'EUR',locale:'es',timezone:'Europe/Madrid',is_published:false},categories:[],products:[]};
  expect(()=>parseRestaurantBackup(base,id)).not.toThrow();for(const field of ['logo_url','website_url','instagram_url'])expect(()=>parseRestaurantBackup({...base,restaurant:{...base.restaurant,[field]:'javascript:alert(1)'}},id)).toThrow('URL');
 });
});
