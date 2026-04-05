# Supabase Configuration Checklist

## 📋 Data Configuration Required

### 1. **Banner** (CREATE or UPDATE)

**Location:** Supabase → `site_content` table

**Key:** `banner`

**JSON Value:**
```json
{
  "text": "MEGA SALE – TAKE 10% OFF",
  "visible": true
}
```

**Steps:**
1. Go to Supabase Dashboard → project
2. Navigate to `site_content` table
3. Look for row with `key = 'banner'`
   - If exists: Click **Edit** → Update the `value` JSON
   - If not exists: Click **Insert** → Add new row:
     - `key`: `banner`
     - `value`: (paste JSON above)
     - `updated_at`: (auto)

✅ **Status:** [ ] PENDING

---

### 2. **Footer** (UPDATE with correct data)

**Location:** Supabase → `site_content` table

**Key:** `footer`

**JSON Value:**
```json
{
  "brandName": "LIA",
  "whatsapp": "5491133631325",
  "email": "liazapatos2001@gmail.com",
  "tiktokUrl": "https://www.tiktok.com/@liazapatos",
  "facebookUrl": "https://www.facebook.com/zapatos.lia.2020/",
  "tiktokUser": "liazapatos",
  "facebookUser": "zapatos.lia.2020",
  "address": "Avelino Díaz 153, Buenos Aires",
  "mapQuery": "Avelino Díaz 153, Buenos Aires",
  "description": "Somos Lia, una tienda de ropa y zapatos pensada para vos.",
  "copyright": "© Lia - Todos los derechos reservados"
}
```

**Steps:**
1. Go to Supabase Dashboard → project
2. Navigate to `site_content` table
3. Find row with `key = 'footer'`
4. Click **Edit** → Replace entire `value` JSON with above
5. Click **Save**

⚠️ **NOTE:** The current data has incorrect URLs (Waze links instead of social media). Make sure to replace with correct data above.

✅ **Status:** [ ] PENDING

---

## 🔧 Backend Endpoint Verification

### Endpoint: `GET /api/shipping?postalCode=XXXX`

**Route:** `/api/shipping`

**Controller:** `back/lia-ecommerce/controllers/shippingController.js`

**Logic:**
- `C1XXXX` (CABA) → $150, 2-3 días hábiles
- `1XXXX-9XXXX` (GBA) → $250, 3-5 días hábiles
- Other → $450, 5-7 días hábiles

**Test it locally:**
```bash
curl "http://localhost:3000/api/shipping?postalCode=C1234"
# Expected response:
# {"cost": 150, "days": "2-3 días hábiles"}

curl "http://localhost:3000/api/shipping?postalCode=1900"
# Expected response:
# {"cost": 250, "days": "3-5 días hábiles"}

curl "http://localhost:3000/api/shipping?postalCode=3000"
# Expected response:
# {"cost": 450, "days": "5-7 días hábiles"}
```

✅ **Status:** [ ] VERIFIED

---

## 📊 Current DB State

| Key | Status | Notes |
|-----|--------|-------|
| `footer` | ❌ INCORRECT | Has wrong URLs |
| `banner` | ❌ MISSING | Need to create |
| `hero_image` | ✅ OK | - |
| `about` | ✅ OK | - |

---

## ✅ Checklist Summary

- [ ] Create `banner` record in Supabase
- [ ] Update `footer` record in Supabase with correct data
- [ ] Test `/api/shipping?postalCode=` endpoint locally
- [ ] Verify frontend ProductDetail.tsx consumes response correctly
- [ ] Test in browser: open a product, enter postal code, calculate shipping

