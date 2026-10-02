# IndianExamInfo Frontend — Deployment Guide

> **Public host:** `https://www.indianexaminfo.com`

## How production actually deploys (current truth)

The frontend is a **Hostinger "Web App" connected to GitHub**. There is no manual
build/upload. The real flow:

1. Push to `main` on GitHub.
2. Hostinger detects the push and runs the deploy automatically — it clones the
   repo and builds **on the Hostinger server**.
3. The result appears on **Hostinger → Web Apps → your app → Deployments**, which
   has a **Redeploy** button to re-run the same build on demand.
4. **A failed build leaves the previous successful build live** — a bad push does
   not take the site down; it simply does not go *current*.

**Node version and the exact build command Hostinger uses: `TODO`** — to be
filled in from the owner's Hostinger "Web App" settings screenshot. Do not
assume; the historical PM2 / Nginx / rsync procedure below is **not** what runs.

### Verify what is live (no login, view-source)

The root layout bakes a build stamp into the HTML head:

```html
<meta name="build" content="<sha> <clean|dirty> <iso time>" />
```

- Open `view-source:https://www.indianexaminfo.com` and search for `name="build"`.
- `sha` is the commit Hostinger built. If it is not the commit you expect, the
  deploy did not go current — check the Deployments page for a failed build.
- `dirty` means the tree had uncommitted changes at build time; the build log
  also prints the offending `git status --porcelain` file list.

### Environment variables (set in Hostinger, not in the repo)

Names only — never commit real values:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_GA_ID
NEXT_PUBLIC_GSC_VERIFY
REVALIDATE_TOKEN   (server-only — guards POST /api/revalidate)
CMS_ORIGIN         (server-only — allowed revalidate caller origin)
```

---

# Legacy — NOT used in production

> Everything below is the **historical self-managed VPS** procedure (manual
> `rsync`, PM2, Nginx) and the `deploy-frontend.sh` helper. It predates the
> Hostinger GitHub auto-deploy above and is kept **for reference only**. It is
> **not** how the live site is deployed — to ship a change, push to `main`.

## Stack
- Next.js 15 (App Router) + TypeScript + Tailwind CSS
- Node 20.x LTS
- PM2 (cluster mode, 2 instances)
- Nginx (reverse proxy + SSL)
- Hostinger VPS

---

## 1. Server Setup (first time only)

```bash
# Install Node 20 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Install PM2 globally
npm install -g pm2

# Install Nginx
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx

# Create web directory
sudo mkdir -p /var/www/indianexaminfo-frontend
sudo chown $USER:$USER /var/www/indianexaminfo-frontend
```

---

## 2. SSL Certificate

```bash
sudo certbot --nginx -d indianexaminfo.com -d www.indianexaminfo.com
```

---

## 3. Nginx Config

```bash
sudo cp nginx.conf /etc/nginx/sites-available/indianexaminfo
sudo ln -s /etc/nginx/sites-available/indianexaminfo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 4. Deploy Application

```bash
# On your local machine — build and transfer
npm run build
rsync -avz --exclude node_modules --exclude .git \
  ./ user@your-vps-ip:/var/www/indianexaminfo-frontend/

# On VPS
cd /var/www/indianexaminfo-frontend
npm install --omit=dev

# Set environment variables
cp .env.example .env.local
nano .env.local   # fill in real values

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup   # follow the printed command to enable on boot
```

---

## 5. Update Deployment

```bash
# On local — build first
npm run build

# Sync to VPS
rsync -avz --exclude node_modules --exclude .git \
  ./ user@your-vps-ip:/var/www/indianexaminfo-frontend/

# On VPS — reload without downtime
cd /var/www/indianexaminfo-frontend
npm install --omit=dev
pm2 reload indianexaminfo-frontend
```

---

## 6. Environment Variables (.env.local on VPS)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_GSC_VERIFY=your-gsc-verification-token
REVALIDATE_TOKEN=your-long-random-secret
```

---

## 7. Trigger ISR Revalidation

When CMS content changes, hit:

```bash
curl -X POST https://www.indianexaminfo.com/api/revalidate \
  -H "x-revalidate-token: your-long-random-secret" \
  -H "Content-Type: application/json" \
  -d '{"path": "/sarkari-naukri/banking/ibps-po"}'
```

Or revalidate all critical paths:

```bash
curl -X POST https://www.indianexaminfo.com/api/revalidate \
  -H "x-revalidate-token: your-long-random-secret" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 8. PM2 Commands

```bash
pm2 status                          # check status
pm2 logs indianexaminfo-frontend    # view logs
pm2 reload indianexaminfo-frontend  # zero-downtime reload
pm2 restart indianexaminfo-frontend # hard restart
pm2 stop indianexaminfo-frontend    # stop
```

---

## 9. Supabase Swap (when CMS is ready)

Replace mock data in each service function:

```typescript
// BEFORE (mock)
export async function getExamsByPillar(pillar: Pillar) {
  return allExams.filter((e) => e.pillar === pillar);
}

// AFTER (Supabase)
export async function getExamsByPillar(pillar: Pillar) {
  const { data } = await supabase
    .from("exams")
    .select("*")
    .eq("pillar", pillar);
  return data ?? [];
}
```

Only `services/` files need changing. All pages remain untouched.
