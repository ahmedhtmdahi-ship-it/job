// Runs only against our local, disposable CI app. No external platform automation.
const { createRequire } = require("node:module");
const { randomBytes } = require("node:crypto");
const { mkdir } = require("node:fs/promises");
const path = require("node:path");
const requireWeb = createRequire(path.resolve(__dirname, "../../web/package.json"));
const { chromium, expect } = requireWeb("@playwright/test");
const baseURL = "http://localhost:3737";

async function main() {
  const deadline = Date.now() + 90_000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseURL}/signin`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) { ready = true; break; }
    } catch { /* Server is still starting. */ }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error("Production app did not become ready within 90 seconds");
  const output = path.join(process.env.RUNNER_TEMP, "m0-screenshots");
  await mkdir(output, { recursive: true });
  const password = randomBytes(32).toString("hex");
  console.log(`::add-mask::${password}`);
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const page = await context.newPage();
    page.setDefaultTimeout(30_000);
    await page.goto(`${baseURL}/signup`);
    await page.getByLabel("Full Name", { exact: true }).fill("Demo User (FICTIONAL)");
    await page.getByLabel("Email", { exact: true }).fill("demo@example.com");
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create an account", exact: true }).click();
    await expect(page).toHaveURL(`${baseURL}/dashboard`);
    // Confirm one and only one fictional account in this fresh CI database.
    const { PrismaClient } = requireWeb("@prisma/client");
    const db = new PrismaClient();
    try {
      const users = await db.user.findMany({ select: { email: true, name: true } });
      expect(users).toEqual([{ email: "demo@example.com", name: "Demo User (FICTIONAL)" }]);
    } finally { await db.$disconnect(); }
    await context.close();

    // A new browser context proves login works without the signup session.
    const loginContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
    const login = await loginContext.newPage();
    login.setDefaultTimeout(30_000);
    await login.goto(`${baseURL}/signin`);
    await expect(login.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    await login.evaluate(() => document.fonts.ready);
    await login.screenshot({ path: path.join(output, "login.png"), fullPage: true, animations: "disabled" });
    await login.getByLabel("Email", { exact: true }).fill("demo@example.com");
    await login.getByLabel("Password", { exact: true }).fill(password);
    await login.getByRole("button", { name: "Login", exact: true }).click();
    await expect(login).toHaveURL(`${baseURL}/dashboard`);
    await expect(login.getByRole("button", { name: "User menu" })).toBeVisible();
    await expect(login).toHaveTitle(/Dashboard/);
    await expect(login.getByRole("button", { name: "Add Job", exact: true })).toBeVisible();
    await login.evaluate(() => document.fonts.ready);
    await login.screenshot({ path: path.join(output, "dashboard.png"), fullPage: true, animations: "disabled" });
    await loginContext.close();
    console.log("PASS: one fictional user, fresh-session login, dashboard and two screenshots");
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); console.error("M0 browser smoke failed; screenshots were not certified."); process.exitCode = 1; });
