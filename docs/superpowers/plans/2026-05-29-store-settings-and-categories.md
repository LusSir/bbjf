# Store Settings And Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build admin-editable store settings and category management for the Beibei home textile mini program.

**Architecture:** Add a focused `settings` cloud function for store/category persistence, a front-end settings service with local fallback, and two admin pages. Existing product and storefront pages consume the new service while keeping local defaults as fallback.

**Tech Stack:** WeChat Mini Program native pages, WeChat Cloud Functions, Node.js CommonJS test scripts.

---

### Task 1: Settings Model

**Files:**
- Create: `miniprogram/utils/settings-model.js`
- Create: `scripts/test-settings-model.js`

- [ ] Add tests for store normalization, category normalization, active-category filtering, and image list merging.
- [ ] Implement the model helpers used by both front-end service and admin pages.
- [ ] Run `node scripts/test-settings-model.js`.

### Task 2: Cloud Function

**Files:**
- Create: `cloudfunctions/settings/index.js`
- Create: `cloudfunctions/settings/package.json`

- [ ] Implement `getStore`, `saveStore`, `listCategories`, `saveCategory`, and `setCategoryStatus`.
- [ ] Reuse the existing admin check pattern against `users.role === "admin"`.
- [ ] Treat missing collections as empty/default results.
- [ ] Run `node --check cloudfunctions/settings/index.js`.

### Task 3: Front-End Service

**Files:**
- Create: `miniprogram/utils/settings-service.js`
- Modify: `miniprogram/utils/contact.js`

- [ ] Add `getStore`, `saveStore`, `listCategories`, `saveCategory`, and `setCategoryStatus` wrappers.
- [ ] Use local `config/store.js` and `data/categories.js` as fallback.
- [ ] Let contact helpers accept a runtime store object.

### Task 4: Admin Pages

**Files:**
- Create: `miniprogram/pages/admin-store/*`
- Create: `miniprogram/pages/admin-categories/*`
- Modify: `miniprogram/pages/admin/*`
- Modify: `miniprogram/app.json`

- [ ] Add admin entry buttons for store settings and category management.
- [ ] Build store form with image upload for QR code and store photos.
- [ ] Build category list/form with save and enable/disable actions.

### Task 5: Consumer Pages

**Files:**
- Modify: `miniprogram/pages/home/home.js`
- Modify: `miniprogram/pages/products/products.js`
- Modify: `miniprogram/pages/store/store.js`
- Modify: `miniprogram/pages/admin-products/admin-products.js`
- Modify: `miniprogram/pages/admin-product-form/admin-product-form.js`

- [ ] Load cloud store settings on home/store pages.
- [ ] Load active categories on home/products/product form.
- [ ] Load all categories in admin product list to preserve names for disabled categories.
- [ ] Keep existing fallback behavior when cloud settings are unavailable.

### Task 6: Verification And Publish

**Files:**
- All touched files.

- [ ] Run new and existing Node tests.
- [ ] Run `node --check` for changed JS files.
- [ ] Run `git diff --check`.
- [ ] Commit and push.
