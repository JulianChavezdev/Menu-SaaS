import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

const login=readFileSync("src/app/(auth)/login/page.tsx","utf8");
describe("remembered login",()=>{
  it("exposes standard fields to device password managers",()=>{expect(login).toContain('name="email"');expect(login).toContain('name="password"');expect(login).toContain('autoComplete="username"');expect(login).toContain('autoComplete="current-password"');expect(login).toContain('autoComplete="on"')});
  it("remembers only the email and never stores the password",()=>{expect(login).toContain('localStorage.setItem("carta-video:login-email",email.trim())');expect(login).not.toMatch(/localStorage\.setItem\([^\n]*password/);expect(login).toContain("Recordar mi correo en este dispositivo")});
  it("replaces login history after successful authentication",()=>{expect(login).toContain('router.replace("/dashboard")');expect(login).toContain("router.refresh()")});
  it("skips the form when a persistent session already exists",()=>{expect(login).toContain("auth.getUser()");expect(login).toContain("if(data.user)router.replace")});
});
