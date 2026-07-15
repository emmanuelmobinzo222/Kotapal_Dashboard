/**
 * Kotapal Admin — Firestore realtime layer
 * Replaces localStorage / demo stubs with live collections.
 */
(function (global) {
  'use strict';

  var unsubs = [];
  var state = {
    products: [],
    payments: [],
    activityLogs: [],
    loginActivity: [],
    apiKeys: [],
    notifications: [],
    roles: null,
    planOverrides: {},
    general: null,
    branding: null,
    security: null,
    webhooks: null,
    emailPayment: null,
    apiUsage: null
  };

  function db() {
    return global.firebaseDb || (typeof firebase !== 'undefined' && firebase.firestore && firebase.firestore()) || null;
  }

  function ts() {
    try {
      return firebase.firestore.FieldValue.serverTimestamp();
    } catch (e) {
      return new Date().toISOString();
    }
  }

  function toast(msg, type) {
    if (typeof global.adminToast === 'function') global.adminToast(msg, type || 'info');
  }

  function adminEmail() {
    try {
      return (firebase.auth().currentUser && firebase.auth().currentUser.email) || '';
    } catch (e) {
      return '';
    }
  }

  function clearUnsubs() {
    unsubs.forEach(function (u) {
      try {
        if (typeof u === 'function') u();
      } catch (e) {}
    });
    unsubs = [];
  }

  function listen(queryOrRef, onData, onErr) {
    var u = queryOrRef.onSnapshot(onData, onErr || function (err) {
      console.warn('Admin realtime:', err);
    });
    unsubs.push(u);
    return u;
  }

  /** Write a platform activity log (realtime Activity Logs page). */
  global.adminLogActivity = function (action, details, userEmail) {
    var d = db();
    if (!d) return Promise.resolve();
    return d.collection('activityLogs').add({
      action: action || 'action',
      details: details || '',
      user: userEmail || adminEmail() || 'admin',
      time: new Date().toISOString(),
      createdAt: ts()
    }).catch(function (e) {
      console.warn('adminLogActivity', e);
    });
  };

  /** Record a payment / subscription charge in Firestore. */
  global.adminWritePayment = function (payload) {
    var d = db();
    if (!d) return Promise.resolve(null);
    var row = Object.assign({
      status: 'paid',
      type: 'subscription',
      date: new Date().toISOString(),
      createdAt: ts(),
      createdBy: adminEmail()
    }, payload || {});
    return d.collection('payments').add(row).then(function (ref) {
      return ref.id;
    }).catch(function (e) {
      console.warn('adminWritePayment', e);
      return null;
    });
  };

  global.adminRecordLoginActivity = async function (email) {
    var d = db();
    var device = (navigator.userAgent || 'Unknown').slice(0, 120);
    var ip = 'unknown';
    var location = 'Browser';
    try {
      var res = await fetch('https://api.ipify.org?format=json');
      var data = await res.json();
      if (data && data.ip) ip = data.ip;
    } catch (e) {}
    var row = {
      user: email || adminEmail() || 'admin',
      ip: ip,
      location: location,
      device: device,
      date: new Date().toISOString(),
      status: 'Success',
      createdAt: ts()
    };
    if (!d) return;
    try {
      await d.collection('adminLoginActivity').add(row);
    } catch (e) {
      console.warn('adminRecordLoginActivity', e);
    }
  };

  function maskKey(key) {
    if (!key || key.length < 12) return '••••••••';
    return key.slice(0, 10) + '••••' + key.slice(-4);
  }

  function randomApiKey() {
    var bytes = new Uint8Array(24);
    if (global.crypto && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    var hex = Array.prototype.map.call(bytes, function (b) {
      return ('0' + b.toString(16)).slice(-2);
    }).join('');
    return 'pk_live_' + hex;
  }

  // ——— Products ———
  global.loadAdminProducts = function () {
    return state.products.slice();
  };
  global.saveAdminProducts = function () {
    /* no-op: writes go per-document via saveAdminProductEdit */
  };
  global.renderAdminProductsTable = function () {
    var tbody = document.getElementById('adminProductsTableBody');
    if (!tbody) return;
    var products = state.products;
    function esc(s) {
      return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
    var categoryFilter = document.getElementById('adminProductCategoryFilter');
    var statusFilter = document.getElementById('adminProductStatusFilter');
    if (categoryFilter) {
      var currentCat = categoryFilter.value || 'All Categories';
      var categories = ['All Categories'];
      products.forEach(function (p) {
        var c = p.category || 'Uncategorized';
        if (categories.indexOf(c) === -1) categories.push(c);
      });
      categoryFilter.innerHTML = categories.map(function (c) {
        return '<option' + (c === currentCat ? ' selected' : '') + '>' + esc(c) + '</option>';
      }).join('');
    }
    if (statusFilter) {
      var currentStatus = statusFilter.value || 'All';
      var statuses = ['All'];
      products.forEach(function (p) {
        var s = p.status || 'Active';
        if (statuses.indexOf(s) === -1) statuses.push(s);
      });
      statusFilter.innerHTML = statuses.map(function (s) {
        return '<option' + (s === currentStatus ? ' selected' : '') + '>' + esc(s) + '</option>';
      }).join('');
    }
    var cat = categoryFilter ? categoryFilter.value : 'All Categories';
    var stat = statusFilter ? statusFilter.value : 'All';
    var visible = products.filter(function (p) {
      var catOk = !cat || cat === 'All Categories' || String(p.category || 'Uncategorized') === cat;
      var statOk = !stat || stat === 'All' || String(p.status || 'Active') === stat;
      return catOk && statOk;
    });
    if (!visible.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;color:#6b7280;text-align:center;">No products yet. Click Add Product.</td></tr>';
      return;
    }
    tbody.innerHTML = visible.map(function (p) {
      var badge = p.status === 'Active' ? 'completed' : 'pending';
      var thumb = (p.image || p.thumbnail || '').trim() || 'https://via.placeholder.com/80?text=Product';
      return '<tr><td><div class="admin-product-cell"><img src="' + esc(thumb) + '" alt="" class="admin-product-thumb" onerror="this.onerror=null;this.src=\'https://via.placeholder.com/80?text=Product\'"><span>' + esc(p.name) + '</span></div></td><td>' + esc(p.category) + '</td><td>$' + Number(p.price || 0).toFixed(2) + '</td><td>' + esc(p.stock) + '</td><td>' + esc(p.sales) + '</td><td><span class="status-badge ' + badge + '">' + esc(p.status) + '</span></td><td><div class="action-btns"><button type="button" class="admin-btn-sm admin-btn-secondary" data-admin-action="edit-product" data-product-id="' + esc(p.id) + '">Edit</button><button type="button" class="admin-btn-sm admin-btn-primary" data-admin-action="view-product" data-product-id="' + esc(p.id) + '">View</button><button type="button" class="admin-btn-sm admin-btn-danger" data-admin-action="delete-product" data-product-id="' + esc(p.id) + '">Delete</button></div></td></tr>';
    }).join('');
  };

  global.saveAdminProductEdit = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var id = (document.getElementById('adminProductEditId') && document.getElementById('adminProductEditId').value) || '';
    var imageUrl = (document.getElementById('adminProductEditImage') && document.getElementById('adminProductEditImage').value || '').trim();
    var item = {
      name: (document.getElementById('adminProductEditName') && document.getElementById('adminProductEditName').value || '').trim(),
      image: imageUrl,
      category: (document.getElementById('adminProductEditCategory') && document.getElementById('adminProductEditCategory').value || '').trim(),
      price: parseFloat(document.getElementById('adminProductEditPrice') && document.getElementById('adminProductEditPrice').value) || 0,
      stock: parseInt(document.getElementById('adminProductEditStock') && document.getElementById('adminProductEditStock').value, 10) || 0,
      status: (document.getElementById('adminProductEditStatus') && document.getElementById('adminProductEditStatus').value) || 'Active',
      updatedAt: ts()
    };
    if (!item.name) {
      toast('Product name is required.', 'warn');
      return;
    }
    try {
      if (id) {
        var existing = state.products.find(function (x) { return x.id === id; });
        if (existing && existing.sales != null) item.sales = existing.sales;
        else item.sales = item.sales || 0;
        await d.collection('products').doc(id).set(item, { merge: true });
      } else {
        item.sales = 0;
        item.createdAt = ts();
        await d.collection('products').add(item);
      }
      if (typeof global.closeAdminProductEditModal === 'function') global.closeAdminProductEditModal();
      toast('Product saved.', 'success');
      global.adminLogActivity('product_save', item.name);
    } catch (e) {
      toast('Failed to save product: ' + (e.message || e), 'warn');
    }
  };

  global.deleteAdminProduct = async function (id) {
    if (!id || !confirm('Delete this product?')) return;
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    try {
      await d.collection('products').doc(id).delete();
      toast('Product deleted.', 'success');
      global.adminLogActivity('product_delete', id);
    } catch (e) {
      toast('Delete failed: ' + (e.message || e), 'warn');
    }
  };

  global.viewAdminProduct = function (id) {
    var p = state.products.find(function (x) { return x.id === id; });
    if (!p) {
      toast('Product not found.', 'warn');
      return;
    }
    var detail = 'Category: ' + p.category + '\nPrice: $' + Number(p.price).toFixed(2) + '\nStock: ' + p.stock + '\nSales: ' + p.sales + '\nStatus: ' + p.status;
    if (p.image) detail += '\nImage: ' + p.image;
    if (typeof global.openAdminDetailModal === 'function') global.openAdminDetailModal(p.name, detail);
  };

  global.openAdminProductEdit = function (id) {
    var p = state.products.find(function (x) { return x.id === id; });
    if (!p) {
      toast('Product not found.', 'warn');
      return;
    }
    document.getElementById('adminProductEditId').value = p.id;
    document.getElementById('adminProductEditName').value = p.name || '';
    var imgInp = document.getElementById('adminProductEditImage');
    if (imgInp) imgInp.value = p.image || p.thumbnail || '';
    if (typeof global.syncAdminProductImagePreview === 'function') {
      /* optional */
    }
    var prev = document.getElementById('adminProductEditImagePreview');
    if (prev) {
      if (p.image) {
        prev.src = p.image;
        prev.style.display = 'block';
      } else {
        prev.style.display = 'none';
      }
    }
    document.getElementById('adminProductEditCategory').value = p.category || '';
    document.getElementById('adminProductEditPrice').value = p.price || 0;
    document.getElementById('adminProductEditStock').value = p.stock || 0;
    document.getElementById('adminProductEditStatus').value = p.status || 'Active';
    document.getElementById('adminProductEditTitle').textContent = 'Edit Product';
    document.getElementById('adminProductEditModal').style.display = 'flex';
  };

  // ——— Plans / roles (in-memory from Firestore) ———
  global.getAdminPlanOverrides = function () {
    return state.planOverrides || {};
  };

  global.saveAdminPlanEdit = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var id = (document.getElementById('adminPlanEditId').value || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!id) id = 'custom_' + Date.now();
    var name = document.getElementById('adminPlanEditName').value.trim();
    if (!name) {
      toast('Plan name is required.', 'warn');
      return;
    }
    var overrides = Object.assign({}, state.planOverrides);
    overrides[id] = {
      name: name,
      price: parseFloat(document.getElementById('adminPlanEditPrice').value) || 0,
      features: document.getElementById('adminPlanEditFeatures').value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    try {
      await d.collection('config').doc('plans').set({ overrides: overrides, updatedAt: ts() }, { merge: true });
      if (typeof global.closeAdminPlanEditModal === 'function') global.closeAdminPlanEditModal();
      toast('Plan saved.', 'success');
      global.adminLogActivity('plan_save', name);
    } catch (e) {
      toast('Failed to save plan: ' + (e.message || e), 'warn');
    }
  };

  global.loadAdminRoles = function () {
    return state.roles || {
      super: { name: 'Super Admin', email: 'admin@kotapal.com', permissions: 'Full Access' },
      support: { name: 'Support Admin', email: 'support@kotapal.com', permissions: 'Limited Access' }
    };
  };

  global.saveAdminRoleEdit = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var key = document.getElementById('adminRoleEditKey').value;
    var roles = Object.assign({}, global.loadAdminRoles());
    roles[key] = {
      name: document.getElementById('adminRoleEditName').value.trim(),
      email: document.getElementById('adminRoleEditEmail').value.trim(),
      permissions: document.getElementById('adminRoleEditPermissions').value
    };
    try {
      await d.collection('config').doc('roles').set({ roles: roles, updatedAt: ts() }, { merge: true });
      if (typeof global.closeAdminRoleEditModal === 'function') global.closeAdminRoleEditModal();
      toast('Role updated.', 'success');
      global.adminLogActivity('role_update', key + ' → ' + roles[key].email);
    } catch (e) {
      toast('Failed to save role: ' + (e.message || e), 'warn');
    }
  };

  // ——— API keys ———
  global.adminRenderApiKeysTable = function () {
    var tb = document.getElementById('adminApiKeysTableBody');
    if (!tb) return;
    var keys = state.apiKeys.filter(function (k) { return !k.revokedAt; });
    if (!keys.length) {
      tb.innerHTML = '<tr><td colspan="4" style="padding:24px;color:#6b7280;text-align:center;">No API keys yet. Click Generate Key.</td></tr>';
      return;
    }
    tb.innerHTML = keys.map(function (k) {
      function escHtml(s) {
        var el = document.createElement('div');
        el.textContent = s == null ? '' : s;
        return el.innerHTML;
      }
      var created = k.created || (k.createdAt && k.createdAt.toDate ? k.createdAt.toDate().toLocaleDateString() : '-');
      return '<tr data-key-id="' + escHtml(k.id) + '"><td>' + escHtml(k.name) + '</td><td>' + escHtml(k.keyMasked || maskKey(k.keyPrefix || '')) + '</td><td>' + escHtml(created) + '</td><td><button type="button" class="admin-btn-sm admin-btn-secondary admin-api-revoke-btn" data-key-id="' + escHtml(k.id) + '">Revoke</button></td></tr>';
    }).join('');
  };

  global.adminGenerateApiKey = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var full = randomApiKey();
    var name = 'Key ' + (state.apiKeys.filter(function (k) { return !k.revokedAt; }).length + 1);
    try {
      var ref = await d.collection('apiKeys').add({
        name: name,
        keyPrefix: full.slice(0, 12),
        keyMasked: maskKey(full),
        keyHash: full, /* stored for admin verification; rotate via revoke */
        created: new Date().toLocaleDateString(),
        createdAt: ts(),
        createdBy: adminEmail(),
        revokedAt: null
      });
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(full).catch(function () {});
      }
      if (typeof global.openAdminDetailModal === 'function') {
        global.openAdminDetailModal('New API key', 'Name: ' + name + '\nKey: ' + full + '\n\nCopy this key now — it will not be shown in full again.\n(Also copied to clipboard.)', { showCopy: true });
      }
      toast('API key created.', 'success');
      global.adminLogActivity('api_key_create', name + ' (' + ref.id + ')');
    } catch (e) {
      toast('Failed to create key: ' + (e.message || e), 'warn');
    }
  };

  global.adminRevokeApiKey = async function (keyId) {
    var d = db();
    if (!d || !keyId) return;
    try {
      await d.collection('apiKeys').doc(keyId).set({ revokedAt: ts() }, { merge: true });
      toast('API key revoked.', 'success');
      global.adminLogActivity('api_key_revoke', keyId);
    } catch (e) {
      toast('Revoke failed: ' + (e.message || e), 'warn');
    }
  };

  global.adminRenderApiUsage = function () {
    var usage = state.apiUsage || { requests: 0, limit: 100000, rateLimitPerMin: 1000 };
    var reqLabel = document.querySelector('#admin-page-api .admin-card:nth-child(2) [data-admin-usage-requests]');
    var bar = document.querySelector('#admin-page-api [data-admin-usage-bar]');
    var rateLabel = document.querySelector('#admin-page-api [data-admin-usage-rate]');
    var reqs = Number(usage.requests || 0);
    var limit = Number(usage.limit || 100000) || 100000;
    var pct = Math.min(100, Math.round((reqs / limit) * 100));
    if (reqLabel) reqLabel.textContent = reqs.toLocaleString() + ' / ' + limit.toLocaleString();
    if (bar) bar.style.width = pct + '%';
    if (rateLabel) rateLabel.textContent = (usage.rateLimitPerMin || 1000).toLocaleString() + ' req/min';
  };

  // ——— Webhooks / settings ———
  global.loadAdminWebhookSettings = function () {
    var wh = state.webhooks || {};
    var whInp = document.getElementById('adminWebhookUrlInput');
    if (whInp) whInp.value = wh.url || '';
    var pay = document.getElementById('adminWebhookEventPayment');
    var sub = document.getElementById('adminWebhookEventSubscription');
    var reg = document.getElementById('adminWebhookEventUserRegistered');
    var events = wh.events || { paymentCompleted: true, subscriptionCreated: true, userRegistered: false };
    if (pay) pay.checked = !!events.paymentCompleted;
    if (sub) sub.checked = !!events.subscriptionCreated;
    if (reg) reg.checked = !!events.userRegistered;
    var statusEl = document.getElementById('adminWebhookStatus');
    if (statusEl) {
      statusEl.textContent = wh.url ? ('Live endpoint: ' + wh.url) : 'Enter a webhook URL and choose events, then save.';
    }
  };

  global.adminSaveWebhook = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var url = (document.getElementById('adminWebhookUrlInput') && document.getElementById('adminWebhookUrlInput').value || '').trim();
    if (!url) {
      toast('Enter a valid webhook URL first.', 'warn');
      return;
    }
    try {
      new URL(url);
    } catch (e) {
      toast('Webhook URL must be a valid URL.', 'warn');
      return;
    }
    var events = {
      paymentCompleted: !!(document.getElementById('adminWebhookEventPayment') && document.getElementById('adminWebhookEventPayment').checked),
      subscriptionCreated: !!(document.getElementById('adminWebhookEventSubscription') && document.getElementById('adminWebhookEventSubscription').checked),
      userRegistered: !!(document.getElementById('adminWebhookEventUserRegistered') && document.getElementById('adminWebhookEventUserRegistered').checked)
    };
    try {
      await d.collection('config').doc('webhooks').set({ url: url, events: events, updatedAt: ts() }, { merge: true });
      toast('Webhook settings saved.', 'success');
      global.adminLogActivity('webhook_save', url);
    } catch (e) {
      toast('Save failed: ' + (e.message || e), 'warn');
    }
  };

  global.adminApplyGeneralSettings = function () {
    var data = state.general || {};
    var nameEl = document.getElementById('adminPlatformName');
    var descEl = document.getElementById('adminPlatformDescription');
    var emailEl = document.getElementById('adminContactEmail');
    var schedEl = document.getElementById('adminReportSchedule');
    if (nameEl && data.platformName != null) nameEl.value = data.platformName;
    if (descEl && data.description != null) descEl.value = data.description;
    if (emailEl && data.contactEmail != null) emailEl.value = data.contactEmail;
    if (schedEl && data.reportSchedule != null) schedEl.value = data.reportSchedule;
    var brandName = document.querySelector('#admin-view .brand-name');
    if (brandName && data.platformName) brandName.textContent = data.platformName;
  };

  global.adminApplyBranding = function () {
    var data = state.branding || {};
    var primary = data.primary || '#6366f1';
    var secondary = data.secondary || '#06b6d4';
    var pc = document.getElementById('adminPrimaryColor');
    var pch = document.getElementById('adminPrimaryColorHex');
    var sc = document.getElementById('adminSecondaryColor');
    var sch = document.getElementById('adminSecondaryColorHex');
    if (pc) pc.value = primary;
    if (pch) pch.value = primary;
    if (sc) sc.value = secondary;
    if (sch) sch.value = secondary;
    document.documentElement.style.setProperty('--admin-primary', primary);
    document.documentElement.style.setProperty('--admin-secondary', secondary);
    if (data.logoUrl) {
      var zone = document.getElementById('adminLogoDropZone');
      if (zone && !zone.querySelector('img[data-admin-logo]')) {
        zone.innerHTML = '<img data-admin-logo src="' + data.logoUrl + '" alt="Logo" style="max-height:80px;max-width:100%;object-fit:contain;"><input type="file" id="adminLogoFileInput" accept="image/*" style="display:none;">';
      }
    }
  };

  global.adminApplyEmailPaymentSettings = function () {
    var data = state.emailPayment || {};
    ['adminSmtpHost', 'adminSmtpPort', 'adminSmtpUsername', 'adminPaymentProvider', 'adminPaymentApiKey', 'adminPaymentWebhookSecret'].forEach(function (id) {
      var key = id.replace(/^admin/, '');
      key = key.charAt(0).toLowerCase() + key.slice(1);
      var map = {
        adminSmtpHost: 'smtpHost',
        adminSmtpPort: 'smtpPort',
        adminSmtpUsername: 'smtpUsername',
        adminPaymentProvider: 'paymentProvider',
        adminPaymentApiKey: 'paymentApiKey',
        adminPaymentWebhookSecret: 'paymentWebhookSecret'
      };
      var el = document.getElementById(id);
      if (el && data[map[id]] != null) el.value = data[map[id]];
    });
  };

  global.adminApplySecuritySettings = function () {
    var sec = state.security || {};
    function styleToggle(trackEl, knobEl, on) {
      if (!trackEl || !knobEl) return;
      trackEl.style.background = on ? 'var(--admin-success)' : 'var(--admin-gray-200)';
      knobEl.style.left = on ? 'auto' : '4px';
      knobEl.style.right = on ? '4px' : 'auto';
    }
    var on2fa = sec.require2fa !== false;
    var onIp = !!sec.ipRestrict;
    var onMaint = !!sec.maintenanceMode;
    var t2 = document.getElementById('adminToggle2FA');
    var tip = document.getElementById('adminToggleIP');
    var mt = document.getElementById('adminMaintenanceToggle');
    styleToggle(document.getElementById('admin2FATrack'), document.getElementById('admin2FAKnob'), on2fa);
    styleToggle(document.getElementById('adminIPTrack'), document.getElementById('adminIPKnob'), onIp);
    styleToggle(document.getElementById('adminMaintenanceTrack'), document.getElementById('adminMaintenanceKnob'), onMaint);
    if (t2) t2.setAttribute('aria-pressed', on2fa ? 'true' : 'false');
    if (tip) tip.setAttribute('aria-pressed', onIp ? 'true' : 'false');
    if (mt) mt.setAttribute('aria-pressed', onMaint ? 'true' : 'false');
    document.body.classList.toggle('admin-maintenance-on', onMaint);
    var wrap = document.getElementById('adminIpAllowlistWrap');
    if (wrap) wrap.style.display = onIp ? 'block' : 'none';
    var list = document.getElementById('adminIpAllowlist');
    if (list && Array.isArray(sec.ipAllowlist)) list.value = sec.ipAllowlist.join(', ');
    else if (list && typeof sec.ipAllowlist === 'string') list.value = sec.ipAllowlist;
  };

  async function patchSecurity(partial) {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var next = Object.assign({}, state.security || {}, partial, { updatedAt: ts() });
    await d.collection('config').doc('security').set(next, { merge: true });
  }

  global.adminSetSecurityFlag = function (field, value) {
    var partial = {};
    partial[field] = value;
    return patchSecurity(partial).then(function () {
      toast('Security setting updated.', 'success');
      global.adminLogActivity('security_update', field + '=' + value);
    }).catch(function (e) {
      toast('Failed: ' + (e.message || e), 'warn');
    });
  };

  // ——— Billing / activity render from state ———
  global.loadAdminBilling = function () {
    var users = global.adminUsers || [];
    var payments = state.payments.slice();
    var planPrices = typeof global.getKotaPlanPricesMap === 'function' ? global.getKotaPlanPricesMap() : {};
    var byPlan = {};
    users.forEach(function (u) {
      var p = u.plan || 'starter';
      byPlan[p] = (byPlan[p] || 0) + 1;
    });
    var totalRev = payments.reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
    var failed = payments.filter(function (p) {
      var st = String(p.status || '').toLowerCase();
      return st === 'failed' || st === 'refund' || st === 'refunded';
    }).length;
    var el = document.getElementById('admin-billing-total');
    if (el) el.textContent = '$' + totalRev.toLocaleString();
    el = document.getElementById('admin-billing-transactions');
    if (el) el.textContent = payments.length;
    var failedEl = document.getElementById('admin-billing-failed');
    if (failedEl) failedEl.textContent = String(failed);
    var tbody = document.getElementById('adminBillingTableBody');
    if (tbody) {
      if (!payments.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:24px;color:#6b7280;text-align:center;">No payment records yet. Plan changes create payment rows automatically.</td></tr>';
      } else {
        global.adminPaymentsByIndex = {};
        global.adminPaymentsByUser = {};
        function html(s) {
          var x = document.createElement('div');
          x.textContent = s;
          return x.innerHTML;
        }
        tbody.innerHTML = payments.slice(0, 50).map(function (p, idx) {
          global.adminPaymentsByIndex[idx] = p;
          if (p.user) global.adminPaymentsByUser[String(p.user)] = p;
          var d = p.date ? new Date(p.date).toLocaleDateString() : '-';
          var st = (p.status || 'paid').toLowerCase();
          var badge = st === 'refund' || st === 'refunded' || st === 'failed' ? 'refunded' : st === 'pending' ? 'pending' : 'completed';
          var stLabel = badge === 'refunded' ? (st === 'failed' ? 'Failed' : 'Refunded') : badge === 'pending' ? 'Pending' : 'Completed';
          return '<tr><td>' + html(p.id || ('TX-' + String(idx + 1).padStart(4, '0'))) + '</td><td>' + html(p.user || '-') + '</td><td>$' + html(p.amount || 0) + '</td><td>' + html(p.type || 'Subscription') + '</td><td><span class="status-badge ' + badge + '">' + stLabel + '</span></td><td>' + html(d) + '</td><td><div class="action-btns"><button type="button" class="admin-btn-sm admin-btn-secondary" data-admin-action="billing-invoice" data-payment-idx="' + idx + '">Invoice</button><button type="button" class="admin-btn-sm admin-btn-primary" data-admin-action="billing-detail" data-payment-idx="' + idx + '">View</button></div></td></tr>';
        }).join('');
      }
    }
    var subTbody = document.getElementById('adminSubscriptionsTableBody');
    if (subTbody && typeof global.getAdminPlanIds === 'function') {
      var rows = global.getAdminPlanIds().map(function (plan) {
        var cnt = byPlan[plan] || 0;
        var planInfo = global.getKotaPlan(plan);
        return '<tr><td>' + planInfo.name + '</td><td>' + cnt + '</td><td>$' + (cnt * (planPrices[plan] || planInfo.price || 0)).toLocaleString() + '</td></tr>';
      });
      subTbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="3" style="padding:24px;color:#6b7280;text-align:center;">No subscription data.</td></tr>';
    }
    var subMir = document.getElementById('adminSubscriptionsTableBodyMirror');
    if (subMir && subTbody) subMir.innerHTML = subTbody.innerHTML;
  };

  global.loadAdminActivity = function () {
    var logs = state.activityLogs;
    var tbody = document.getElementById('adminActivityTableBody');
    if (!tbody) return;
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="padding:24px;color:#6b7280;text-align:center;">No activity logs yet.</td></tr>';
      return;
    }
    function html(s) {
      var x = document.createElement('div');
      x.textContent = s;
      return x.innerHTML;
    }
    tbody.innerHTML = logs.slice(0, 100).map(function (l) {
      var t = l.time ? new Date(l.time).toLocaleString() : '-';
      return '<tr><td>' + html(t) + '</td><td>' + html(l.user || '-') + '</td><td>' + html(l.action || '-') + '</td><td>' + html(l.details || '-') + '</td></tr>';
    }).join('');
  };

  global.adminRenderLoginActivity = function () {
    var tbody = document.getElementById('adminLoginActivityBody');
    if (!tbody) return;
    var logs = state.loginActivity;
    if (!logs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:24px;color:#6b7280;text-align:center;">No login activity recorded yet.</td></tr>';
      return;
    }
    function esc(s) {
      var x = document.createElement('div');
      x.textContent = s == null ? '' : s;
      return x.innerHTML;
    }
    tbody.innerHTML = logs.slice(0, 25).map(function (row) {
      var d = row.date ? new Date(row.date).toLocaleString() : '-';
      var badge = (row.status || 'Success') === 'Success' ? 'completed' : 'refunded';
      return '<tr><td>' + esc(row.user) + '</td><td>' + esc(row.ip) + '</td><td>' + esc(row.location) + '</td><td>' + esc(row.device) + '</td><td>' + esc(d) + '</td><td><span class="status-badge ' + badge + '">' + esc(row.status || 'Success') + '</span></td></tr>';
    }).join('');
  };

  global.adminRenderNotifyQueue = function () {
    var tbody = document.getElementById('adminNotifyQueueBody');
    if (!tbody) return;
    var q = state.notifications;
    if (!q.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="padding:24px;color:#6b7280;text-align:center;">No notifications sent yet.</td></tr>';
      return;
    }
    function esc(s) {
      var x = document.createElement('div');
      x.textContent = s == null ? '' : s;
      return x.innerHTML;
    }
    tbody.innerHTML = q.slice(0, 30).map(function (item) {
      var when = item.at ? new Date(item.at).toLocaleString() : (item.createdAt && item.createdAt.toDate ? item.createdAt.toDate().toLocaleString() : '-');
      return '<tr><td>' + esc(when) + '</td><td>' + esc(item.type || 'email') + '</td><td>' + esc(item.audience || 'all') + '</td><td>' + esc(item.subject || '-') + '</td><td>' + esc(item.recipientCount != null ? item.recipientCount : '-') + '</td></tr>';
    }).join('');
  };

  global.adminSendNotification = async function () {
    var d = db();
    if (!d) {
      toast('Firebase not connected.', 'warn');
      return;
    }
    var sub = (document.getElementById('adminNotifySubject') && document.getElementById('adminNotifySubject').value || '').trim();
    var msg = (document.getElementById('adminNotifyMessage') && document.getElementById('adminNotifyMessage').value || '').trim();
    var type = (document.getElementById('adminNotifyType') && document.getElementById('adminNotifyType').value) || 'email';
    var audience = (document.getElementById('adminNotifyAudience') && document.getElementById('adminNotifyAudience').value) || 'all';
    if (!sub || !msg) {
      toast('Enter subject and message first.', 'warn');
      return;
    }
    var targets = typeof global.adminFilterUsersByAudience === 'function' ? global.adminFilterUsersByAudience(audience) : (global.adminUsers || []);
    try {
      await d.collection('adminNotifications').add({
        subject: sub,
        message: msg,
        type: type,
        audience: audience,
        recipientCount: targets.length,
        recipients: targets.slice(0, 200).map(function (u) {
          return { email: u.email || '', uid: u.id || u.uid || '' };
        }),
        at: new Date().toISOString(),
        createdAt: ts(),
        createdBy: adminEmail(),
        status: 'sent'
      });
      if (document.getElementById('adminNotifySubject')) document.getElementById('adminNotifySubject').value = '';
      if (document.getElementById('adminNotifyMessage')) document.getElementById('adminNotifyMessage').value = '';
      toast((type === 'email' ? 'Email' : type === 'in-app' ? 'In-app' : 'Email + In-app') + ' notification sent to ' + targets.length + ' user(s).', 'success');
      global.adminLogActivity('notification_send', sub + ' → ' + audience);
    } catch (e) {
      toast('Send failed: ' + (e.message || e), 'warn');
    }
  };

  /** Build chart series from live users + payments */
  global.adminBuildChartSeries = function () {
    var users = global.adminUsers || [];
    var payments = state.payments || [];
    var now = new Date();
    var months = [];
    var newUsers = [];
    var activeUsers = [];
    var revenue = [];
    for (var i = 6; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      var label = d.toLocaleString(undefined, { month: 'short' });
      months.push(label);
      var y = d.getFullYear();
      var m = d.getMonth();
      var nu = users.filter(function (u) {
        if (!u.joined || u.joined === '-') return false;
        var jd = new Date(u.joined);
        return jd.getFullYear() === y && jd.getMonth() === m;
      }).length;
      newUsers.push(nu);
      var au = users.filter(function (u) {
        return String(u.status || 'active').toLowerCase() !== 'suspended';
      }).length;
      activeUsers.push(au);
      var rev = payments.filter(function (p) {
        if (!p.date) return false;
        var pd = new Date(p.date);
        return pd.getFullYear() === y && pd.getMonth() === m;
      }).reduce(function (s, p) { return s + (Number(p.amount) || 0); }, 0);
      revenue.push(rev);
    }
    var planCounts = { free: 0, starter: 0, pro: 0, creatorplus: 0, agency: 0, other: 0 };
    users.forEach(function (u) {
      var p = String(u.plan || 'starter').toLowerCase();
      if (planCounts[p] != null) planCounts[p]++;
      else planCounts.other++;
    });
    return { months: months, newUsers: newUsers, activeUsers: activeUsers, revenue: revenue, planCounts: planCounts };
  };

  function refreshDashboardFromState() {
    if (typeof global.updateDashboardPage === 'function') global.updateDashboardPage();
    if (typeof global.loadAdminBilling === 'function') global.loadAdminBilling();
    if (typeof global.initAdminRevenueChart === 'function') {
      var page = document.getElementById('admin-page-dashboard');
      if (page && page.classList.contains('active')) global.initAdminRevenueChart();
    }
    if (typeof global.initAdminAnalyticsCharts === 'function') {
      var stats = document.getElementById('admin-page-stats');
      if (stats && stats.classList.contains('active')) global.initAdminAnalyticsCharts();
    }
  }

  global.adminGetPayments = function () {
    return state.payments.slice();
  };
  global.adminGetProducts = function () {
    return state.products.slice();
  };

  /**
   * Start all admin realtime listeners. Call once after admin login.
   */
  global.startAdminRealtimeListeners = function () {
    var d = db();
    if (!d) {
      toast('Firebase unavailable — admin data cannot sync.', 'warn');
      return;
    }
    clearUnsubs();

    listen(d.collection('products'), function (snap) {
      state.products = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      if (typeof global.renderAdminProductsTable === 'function') global.renderAdminProductsTable();
      refreshDashboardFromState();
    });

    listen(d.collection('payments').orderBy('date', 'desc').limit(200), function (snap) {
      state.payments = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      refreshDashboardFromState();
    }, function () {
      listen(d.collection('payments').limit(200), function (snap) {
        state.payments = snap.docs.map(function (doc) {
          var o = doc.data();
          o.id = doc.id;
          if (!o.date && o.createdAt && o.createdAt.toDate) o.date = o.createdAt.toDate().toISOString();
          return o;
        });
        state.payments.sort(function (a, b) {
          return new Date(b.date || 0) - new Date(a.date || 0);
        });
        refreshDashboardFromState();
      });
    });

    listen(d.collection('activityLogs').orderBy('time', 'desc').limit(100), function (snap) {
      state.activityLogs = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      if (typeof global.loadAdminActivity === 'function') global.loadAdminActivity();
    }, function () {
      listen(d.collection('activityLogs').limit(100), function (snap) {
        state.activityLogs = snap.docs.map(function (doc) {
          var o = doc.data();
          o.id = doc.id;
          return o;
        });
        state.activityLogs.sort(function (a, b) {
          return new Date(b.time || 0) - new Date(a.time || 0);
        });
        if (typeof global.loadAdminActivity === 'function') global.loadAdminActivity();
      });
    });

    listen(d.collection('adminLoginActivity').orderBy('date', 'desc').limit(50), function (snap) {
      state.loginActivity = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      if (typeof global.adminRenderLoginActivity === 'function') global.adminRenderLoginActivity();
    }, function () {
      listen(d.collection('adminLoginActivity').limit(50), function (snap) {
        state.loginActivity = snap.docs.map(function (doc) {
          var o = doc.data();
          o.id = doc.id;
          return o;
        });
        if (typeof global.adminRenderLoginActivity === 'function') global.adminRenderLoginActivity();
      });
    });

    listen(d.collection('apiKeys'), function (snap) {
      state.apiKeys = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      if (typeof global.adminRenderApiKeysTable === 'function') global.adminRenderApiKeysTable();
    });

    listen(d.collection('adminNotifications').orderBy('at', 'desc').limit(50), function (snap) {
      state.notifications = snap.docs.map(function (doc) {
        var o = doc.data();
        o.id = doc.id;
        return o;
      });
      if (typeof global.adminRenderNotifyQueue === 'function') global.adminRenderNotifyQueue();
    }, function () {
      listen(d.collection('adminNotifications').limit(50), function (snap) {
        state.notifications = snap.docs.map(function (doc) {
          var o = doc.data();
          o.id = doc.id;
          return o;
        });
        if (typeof global.adminRenderNotifyQueue === 'function') global.adminRenderNotifyQueue();
      });
    });

    listen(d.collection('config').doc('plans'), function (snap) {
      state.planOverrides = (snap.exists && snap.data().overrides) || {};
      if (typeof global.renderAdminPlansGrid === 'function') global.renderAdminPlansGrid();
    });

    listen(d.collection('config').doc('roles'), function (snap) {
      state.roles = (snap.exists && snap.data().roles) || null;
      if (typeof global.renderAdminRolesTable === 'function') global.renderAdminRolesTable();
      if (typeof global.updateAdminSuperAccessUI === 'function') global.updateAdminSuperAccessUI();
    });

    listen(d.collection('config').doc('general'), function (snap) {
      state.general = snap.exists ? snap.data() : null;
      if (typeof global.adminApplyGeneralSettings === 'function') global.adminApplyGeneralSettings();
    });

    listen(d.collection('config').doc('branding'), function (snap) {
      state.branding = snap.exists ? snap.data() : null;
      if (typeof global.adminApplyBranding === 'function') global.adminApplyBranding();
    });

    listen(d.collection('config').doc('security'), function (snap) {
      state.security = snap.exists ? snap.data() : { require2fa: true, ipRestrict: false, maintenanceMode: false };
      if (typeof global.adminApplySecuritySettings === 'function') global.adminApplySecuritySettings();
    });

    listen(d.collection('config').doc('webhooks'), function (snap) {
      state.webhooks = snap.exists ? snap.data() : null;
      if (typeof global.loadAdminWebhookSettings === 'function') global.loadAdminWebhookSettings();
    });

    listen(d.collection('config').doc('emailPayment'), function (snap) {
      state.emailPayment = snap.exists ? snap.data() : null;
      if (typeof global.adminApplyEmailPaymentSettings === 'function') global.adminApplyEmailPaymentSettings();
    });

    listen(d.collection('config').doc('apiUsage'), function (snap) {
      state.apiUsage = snap.exists ? snap.data() : { requests: 0, limit: 100000, rateLimitPerMin: 1000 };
      if (typeof global.adminRenderApiUsage === 'function') global.adminRenderApiUsage();
    });

    // Users realtime (Firestore directory — Sync Auth still merges Auth-only accounts)
    if (!global._adminUsersUnsub) {
      global._adminUsersUnsub = d.collection('users').onSnapshot(function (snap) {
        var byId = {};
        (global.adminUsers || []).forEach(function (u) {
          if (u && u.id) byId[u.id] = u;
        });
        snap.docs.forEach(function (doc) {
          var data = doc.data();
          byId[doc.id] = {
            id: doc.id,
            email: data.email || '-',
            name: data.displayName || data.name || '-',
            plan: data.plan || 'starter',
            status: data.status || 'active',
            joined: data.signupDate || data.createdAt || '',
            lastSignIn: data.lastSignIn || ''
          };
        });
        global.adminUsers = Object.keys(byId).map(function (k) { return byId[k]; });
        if (typeof global.renderAdminUsersTable === 'function') global.renderAdminUsersTable(global.adminUsers);
        if (typeof global.updateStatsPage === 'function') global.updateStatsPage();
        refreshDashboardFromState();
      }, function (err) {
        console.warn('users onSnapshot', err);
      });
      unsubs.push(function () {
        if (global._adminUsersUnsub) {
          global._adminUsersUnsub();
          global._adminUsersUnsub = null;
        }
      });
    }
  };

  global.stopAdminRealtimeListeners = function () {
    clearUnsubs();
    if (global._adminUsersUnsub) {
      try { global._adminUsersUnsub(); } catch (e) {}
      global._adminUsersUnsub = null;
    }
  };

  global._adminRealtimeState = state;
})(typeof window !== 'undefined' ? window : this);
