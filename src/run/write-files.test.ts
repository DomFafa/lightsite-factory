import test from "node:test";
import assert from "node:assert/strict";
import { validateGeneratedSiteFiles, type GeneratedFile } from "./write-files";

test("allows copy that says no login or database is required", () => {
  assert.doesNotThrow(() =>
    validateGeneratedSiteFiles(
      siteFiles(`<!doctype html>
        <html>
          <head>
            <link rel="stylesheet" href="css/style.css">
          </head>
          <body>
            <main>No login required. No database. Educational local-only estimate.</main>
            <script src="js/app.js"></script>
          </body>
        </html>`)
    )
  );
});

test("allows copy that explicitly says no backend server, database storage, or server-side API", () => {
  assert.doesNotThrow(() =>
    validateGeneratedSiteFiles(
      siteFiles(`<!doctype html>
        <html>
          <head><link rel="stylesheet" href="css/style.css"></head>
          <body>
            <main>No backend server. No database storage. No server-side API.</main>
            <script src="js/app.js"></script>
          </body>
        </html>`)
    )
  );
});

test("allows educational copy about signing up for an employer 401k plan", () => {
  assert.doesNotThrow(() =>
    validateGeneratedSiteFiles(
      siteFiles(`<!doctype html>
        <html>
          <head><link rel="stylesheet" href="css/style.css"></head>
          <body>
            <main>Sign up for your employer's 401(k) plan before using this estimate.</main>
            <script src="js/app.js"></script>
          </body>
        </html>`)
    )
  );
});

test("blocks password input as login functionality", () => {
  assert.throws(
    () =>
      validateGeneratedSiteFiles(
        siteFiles(`<!doctype html>
          <html>
            <head><link rel="stylesheet" href="css/style.css"></head>
            <body>
              <form><input type="password" name="password"></form>
              <script src="js/app.js"></script>
            </body>
          </html>`)
      ),
    /login, database, or backend/
  );
});

test("blocks login and signup links", () => {
  assert.throws(
    () =>
      validateGeneratedSiteFiles(
        siteFiles(`<!doctype html>
          <html>
            <head><link rel="stylesheet" href="css/style.css"></head>
            <body>
              <a href="/login">Log in</a>
              <a href="/signup">Sign up</a>
              <script src="js/app.js"></script>
            </body>
          </html>`)
      ),
    /login, database, or backend/
  );
});

test("blocks sign-in providers and account creation", () => {
  assert.throws(
    () =>
      validateGeneratedSiteFiles(
        siteFiles(`<!doctype html>
          <html>
            <head><link rel="stylesheet" href="css/style.css"></head>
            <body>
              <main>Sign in with Google to create an account.</main>
              <script src="js/app.js"></script>
            </body>
          </html>`)
      ),
    /login, database, or backend/
  );
});

test("blocks backend API endpoints", () => {
  const files = siteFiles(`<!doctype html>
    <html>
      <head><link rel="stylesheet" href="css/style.css"></head>
      <body><main>Calculator</main><script src="js/app.js"></script></body>
    </html>`);
  const app = files.find((file) => file.path === "site/js/app.js");
  if (app) app.content = "fetch('/api/calculate')";

  assert.throws(() => validateGeneratedSiteFiles(files), /login, database, or backend/);
});

test("blocks external backend API calls", () => {
  const files = siteFiles(`<!doctype html>
    <html>
      <head><link rel="stylesheet" href="css/style.css"></head>
      <body><main>Calculator</main><script src="js/app.js"></script></body>
    </html>`);
  const app = files.find((file) => file.path === "site/js/app.js");
  if (app) app.content = "fetch('https://api.example.com/calculate')";

  assert.throws(() => validateGeneratedSiteFiles(files), /login, database, or backend/);
});

function siteFiles(html: string): GeneratedFile[] {
  return [
    { path: "site/index.html", content: html },
    { path: "site/css/style.css", content: "body { font-family: sans-serif; }" },
    { path: "site/js/app.js", content: "console.log('local calculator');" },
    { path: "site/robots.txt", content: "User-agent: *\nAllow: /\n" },
    { path: "site/sitemap.xml", content: "<urlset></urlset>" }
  ];
}
