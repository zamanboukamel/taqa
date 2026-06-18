# Taqa Deployment Playbook

Complete step-by-step instructions to push to GitHub, deploy to Vercel, and connect your domain.

## ⚠️ Three corrections before you start

1. **Google Domains no longer exists.** Google sold its domains business to **Squarespace** in 2023. Your `taqagcc.com` was migrated there. So in Step 11 you'll log into **Squarespace Domains** (account.squarespace.com), *not* Google Domains. The steps are nearly identical.
2. **GitHub will not accept your password when you push.** On Windows, the first `git push` pops open a **browser window to sign in to GitHub** (via "Git Credential Manager"). Sign in there once and it's remembered. If no window appears, see the token fallback in Step 6.
3. **Some files already exist.** `.gitignore`, `.env.local.example`, and `README.md` are already in the repo. You do **not** need to create them. Your repo has `app/`, `lib/`, `public/`, `supabase/` (there is **no** `components/` folder).

---

## STEP 1 — Initialize git locally

Run these **one at a time**, in your project folder.

**1a. Make sure you're in the right folder:**
```bash
cd "C:/Users/Taqa/Documents/Taqa"
```
*Output:* nothing (just a new prompt line). This puts you in your project. → next command.

**1b. Set your git identity** (required, or commits fail). Use the email on your GitHub account:
```bash
git config --global user.name "zamanboukamel"
git config --global user.email "YOUR_GITHUB_EMAIL@example.com"
```
*Output:* nothing. This tells git who you are. → next command.

**1c. Initialize the repository:**
```bash
git init
```
*Output:* `Initialized empty Git repository in C:/Users/Taqa/Documents/Taqa/.git/`. This creates a hidden `.git` folder that tracks your changes. → Step 2.

---

## STEP 2 — `.gitignore` and `.env.local.example` (already created — just verify)

**Your `.gitignore` already blocks the sensitive stuff.** View it:
```bash
cat .gitignore
```
You should see (among other lines): `/node_modules`, `/.next/`, `.env*`, `.vercel`, and the special line `!.env.local.example`. That last line means: *block all env files EXCEPT the safe example.* That's exactly what you want.

**Your `.env.local.example`** (the safe template, no real keys). View it:
```bash
cat .env.local.example
```
It shows the 4 variable names with placeholder values like `your-supabase-project-url-here`. Safe to commit. ✅

> If you ever want to confirm your real secrets are protected, run `git status` (Step 3) and make sure **`.env.local` is NOT listed**.

---

## STEP 3 — Commit your code locally

**3a. See what git will save:**
```bash
git status
```
*Output:* a long list of files in red under "Untracked files" — you should see `app/`, `lib/`, `package.json`, `README.md`, `.env.local.example`, etc. **Critical check: `.env.local` must NOT appear in this list.** (If it does, stop and tell me.) → next.

**3b. Stage all files (that aren't gitignored):**
```bash
git add .
```
*Output:* nothing. The `.` means "everything in this folder." → next.

**3c. Create the commit:**
```bash
git commit -m "Initial commit: Taqa MVP"
```
*Output:* a summary like `[main (root-commit) a1b2c3d] Initial commit: Taqa MVP` followed by `XX files changed, YYYY insertions(+)`. This is your first saved snapshot. → Step 4.

---

## STEP 4 — Create the GitHub repository

In your browser:
1. Go to **https://github.com/new**
2. **Repository name:** `taqa`
3. **Description:** `AI nutrition platform for GCC sports academies`
4. Select **Public**
5. **Do NOT** check "Add a README", "Add .gitignore", or "Add license" (you already have these locally — adding them on GitHub causes a conflict).
6. Click **Create repository**.
7. GitHub shows a setup page with commands — **ignore it**, use mine below. → Step 5.

---

## STEP 5 — Connect local git to GitHub

```bash
git remote add origin https://github.com/zamanboukamel/taqa.git
```
*Output:* nothing (success is silent). This tells your local repo where the GitHub copy lives ("origin" = the nickname for that URL).

**Verify it worked:**
```bash
git remote -v
```
*Output:*
```
origin  https://github.com/zamanboukamel/taqa.git (fetch)
origin  https://github.com/zamanboukamel/taqa.git (push)
```
→ Step 6.

---

## STEP 6 — Push to GitHub

**6a. Name your branch `main`:**
```bash
git branch -M main
```
*Output:* nothing. Renames your current branch to `main` (GitHub's default). → next.

**6b. Push:**
```bash
git push -u origin main
```
**What happens:** a **browser window pops up** asking you to sign in to GitHub → sign in and authorize. (First time only; it's remembered after.)

*Output (after auth):* several lines ending with something like:
```
To https://github.com/zamanboukamel/taqa.git
 * [new branch]      main -> main
branch 'main' set up to track 'origin/main'.
```
That means your code is now on GitHub. → Step 7.

> **If no browser opens and it asks for a password:** GitHub passwords don't work here. Create a token: GitHub → your avatar → **Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)**, check the **`repo`** scope, generate, copy it. When git asks for "Password", paste the **token** instead.

---

## STEP 7 — Verify on GitHub

Go to **https://github.com/zamanboukamel/taqa** and check:
- ✅ You see folders: **`app/`**, **`lib/`**, **`public/`**, **`supabase/`**, and files **`package.json`**, **`README.md`**, **`.env.local.example`**.
- ✅ **`.env.local` is NOT there** (your secrets are safe).
- ✅ **`.env.local.example` IS there** (the safe template).
- ✅ Your README content shows on the repo's front page.

If all of the above is true, it looks right. ✅ → Step 8.

---

## STEP 8 — README.md (already created — just review)

I already wrote `README.md` for you. View it:
```bash
cat README.md
```
It contains: a one-sentence description of Taqa, the stack, exact local-run commands, the env vars, and 3 "what I learned" bullets. **Open it in your editor and tweak the "What I learned" bullets to be in your own words** — it's your project. → Step 9.

---

## STEP 9 — Push the README (and any future doc edits)

(The README is already committed from Step 3, but use this exact 3-command flow any time you change it.)
```bash
git add README.md
git commit -m "Update README"
git push
```
*Output of push:* lines ending in `main -> main`. → Step 10.

---

## STEP 10 — Deploy to Vercel

1. Go to **https://vercel.com** → **Sign Up / Log in** → choose **Continue with GitHub** → authorize.
2. Click **Add New… → Project**.
3. Find **`zamanboukamel/taqa`** in the list → click **Import**.
4. Leave the build settings as detected (Framework: **Next.js** — auto-filled).
5. Expand **Environment Variables** and add these **4** (Name on the left, paste the Value from your `.env.local` on the right):

| Name (type exactly) | Value (copy from your `.env.local`) |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your `https://...supabase.co` URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your `sb_publishable_...` key |
| `SUPABASE_SERVICE_ROLE_KEY` | your `sb_secret_...` key |
| `ANTHROPIC_API_KEY` | your `sk-ant-...` key |

6. Click **Deploy**. Wait ~1–3 minutes. → "🎉 Congratulations" with a screenshot of your site = success. Click **Continue to Dashboard** / **Visit** to see it live at a `taqa-xxxx.vercel.app` URL.

> 🔒 **Now is the time to rotate the keys I warned about.** Since your real `service_role` and `ANTHROPIC_API_KEY` were typed into our chat, regenerate them in the Supabase + Anthropic dashboards, then update them in **two** places: Vercel (Project → Settings → Environment Variables) **and** your local `.env.local`. Redeploy after.

---

## STEP 11 — Connect your domain `taqagcc.com`

**11a. In Vercel:** Project → **Settings → Domains** → type `taqagcc.com` → **Add**.
Vercel will show you DNS instructions. You'll get **one of two** options — pick whichever you find:

- **Option A (simplest — nameservers):** Vercel shows two nameservers like `ns1.vercel-dns.com` and `ns2.vercel-dns.com`. Use these in 11b.
- **Option B (records):** Vercel shows an **A record** (`@` → `76.76.21.21`) and a **CNAME** (`www` → `cname.vercel-dns.com`). Use these in 11b-alt.

**11b. In Squarespace** (your domain lives here now, not Google Domains):
1. Go to **https://account.squarespace.com** → log in → **Domains** → click **taqagcc.com**.
2. **For Option A (nameservers):** find **DNS / Nameservers** → switch to **Use custom nameservers** (or "external nameservers") → delete the existing ones → enter Vercel's two nameservers → **Save**.
3. **For Option B (records) — 11b-alt:** find **DNS Settings** → **Add record** → add the **A** record and the **CNAME** record exactly as Vercel showed → **Save**.

**11c. Wait 5–30 minutes** (sometimes up to a few hours) for DNS to propagate.

**11d. Verify:** back in **Vercel → Settings → Domains**, `taqagcc.com` should show a green **"Valid Configuration"** ✅. Then open **https://taqagcc.com** in your browser — you should see your live Taqa app with a padlock (HTTPS, auto-provided by Vercel).

> If Squarespace doesn't let you edit DNS because the domain still uses Squarespace's defaults, look for a toggle like "Use external DNS" / "Advanced DNS" first.

---

## STEP 12 — Future code changes (your everyday workflow)

Any time you change code, run these three from the project folder:
```bash
git add .
git commit -m "Describe what you changed"
git push
```
That's it. **Vercel watches your GitHub repo and auto-redeploys** within ~1–2 minutes every time you push to `main`. Your live site updates itself — you never re-run the Vercel steps. Check progress at vercel.com → your project → **Deployments**.

> ⚠️ One rule: if you ever add a **new** environment variable, you must also add it in **Vercel → Settings → Environment Variables** (the `.env.local` file is local-only and never pushed). Then redeploy.
