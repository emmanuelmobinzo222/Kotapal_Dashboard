
        // --- Action button handlers (registration, admin modals, block edit, auth) ---
        function showAuthSubForm(formId) {
            document.querySelectorAll('#authModal .auth-form').forEach(function(f) {
                f.classList.remove('active');
                f.style.display = 'none';
            });
            var form = document.getElementById(formId);
            if (form) { form.style.display = 'block'; form.classList.add('active'); }
            document.querySelectorAll('.auth-tab').forEach(function(t) { t.classList.remove('active'); });
        }
        function showAuthLoginForm() {
            showAuthSubForm('loginForm');
            var tab = document.querySelector('.auth-tab[data-tab="login"]');
            if (tab) tab.classList.add('active');
        }
        function setResetStatus(message, type) {
            var ids = ['forgotPasswordStatus', 'resetPasswordStatus', 'resetMessage', 'authMessage'];
            for (var i = 0; i < ids.length; i++) {
                var el = document.getElementById(ids[i]);
                if (el) {
                    el.style.display = 'block';
                    el.textContent = message;
                    el.style.color = type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : 'var(--gray)';
                    return;
                }
            }
            if (typeof showNotification === 'function') showNotification(message, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info', 'Password Reset');
        }
        async function handleNewPasswordSubmit(e) {
            if (e) e.preventDefault();
            var oobCode = (document.getElementById('resetToken') && document.getElementById('resetToken').value) || '';
            var newPass = document.getElementById('resetNewPassword') ? document.getElementById('resetNewPassword').value : '';
            var confirmPass = document.getElementById('resetConfirmPassword') ? document.getElementById('resetConfirmPassword').value : '';
            if (newPass !== confirmPass) { setResetStatus('Passwords do not match.', 'error'); return; }
            if (!newPass || newPass.length < 6) { setResetStatus('Password must be at least 6 characters.', 'error'); return; }
            if (!auth) { setResetStatus('Firebase is not configured.', 'error'); return; }
            try {
                if (oobCode) {
                    await auth.confirmPasswordReset(oobCode, newPass);
                } else if (auth.currentUser) {
                    await auth.currentUser.updatePassword(newPass);
                } else {
                    setResetStatus('Open the reset link from your email or sign in first.', 'error');
                    return;
                }
                setResetStatus('Password updated. You can log in with your new password.', 'success');
                setTimeout(showAuthLoginForm, 1500);
            } catch (err) {
                setResetStatus(err.message || 'Failed to reset password.', 'error');
            }
        }
        function checkPasswordResetLink() {
            var params = new URLSearchParams(window.location.search);
            if (params.get('mode') === 'resetPassword' && params.get('oobCode')) {
                if (typeof showAuthModal === 'function') showAuthModal();
                showAuthSubForm('resetPasswordForm');
                var token = document.getElementById('resetToken');
                if (token) token.value = params.get('oobCode');
            }
        }
        window.closeAdminDetailModal = function() {
            var m = document.getElementById('adminDetailModal');
            if (m) m.style.display = 'none';
        };
        window.openAdminDetailModal = function(title, body) {
            var m = document.getElementById('adminDetailModal');
            var t = document.getElementById('adminDetailModalTitle');
            var b = document.getElementById('adminDetailModalBody');
            if (t) t.textContent = title || 'Details';
            if (b) b.textContent = body || '';
            if (m) m.style.display = 'flex';
        };
        function getDefaultAdminProducts() {
            return [
                { id: 'prod_1', name: 'Wireless Headphones', category: 'Electronics', price: 99, stock: 120, sales: 342, status: 'Active' },
                { id: 'prod_2', name: 'Smart Watch Pro', category: 'Wearables', price: 249, stock: 45, sales: 189, status: 'Active' }
            ];
        }
        function loadAdminProducts() {
            try {
                var list = JSON.parse(localStorage.getItem('admin_products_catalog') || 'null');
                if (!list || !list.length) list = getDefaultAdminProducts();
                return list;
            } catch (e) { return getDefaultAdminProducts(); }
        }
        function saveAdminProducts(list) {
            localStorage.setItem('admin_products_catalog', JSON.stringify(list));
        }
        window.renderAdminProductsTable = function() {
            var tbody = document.getElementById('adminProductsTableBody');
            if (!tbody) return;
            var products = loadAdminProducts();
            function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
            tbody.innerHTML = products.map(function(p) {
                var badge = p.status === 'Active' ? 'completed' : 'pending';
                return '<tr><td>' + esc(p.name) + '</td><td>' + esc(p.category) + '</td><td>$' + Number(p.price || 0).toFixed(2) + '</td><td>' + esc(p.stock) + '</td><td>' + esc(p.sales) + '</td><td><span class="status-badge ' + badge + '">' + esc(p.status) + '</span></td><td><div class="action-btns"><button type="button" class="admin-btn-sm admin-btn-secondary" data-admin-action="edit-product" data-product-id="' + esc(p.id) + '">Edit</button><button type="button" class="admin-btn-sm admin-btn-primary" data-admin-action="view-product" data-product-id="' + esc(p.id) + '">View</button></div></td></tr>';
            }).join('');
        };
        window.openAdminProductEdit = function(id) {
            var p = loadAdminProducts().find(function(x) { return x.id === id; });
            if (!p) { adminToast('Product not found.', 'warn'); return; }
            document.getElementById('adminProductEditId').value = p.id;
            document.getElementById('adminProductEditName').value = p.name || '';
            document.getElementById('adminProductEditCategory').value = p.category || '';
            document.getElementById('adminProductEditPrice').value = p.price || 0;
            document.getElementById('adminProductEditStock').value = p.stock || 0;
            document.getElementById('adminProductEditStatus').value = p.status || 'Active';
            document.getElementById('adminProductEditTitle').textContent = 'Edit Product';
            document.getElementById('adminProductEditModal').style.display = 'flex';
        };
        window.openAdminProductCreate = function() {
            document.getElementById('adminProductEditId').value = '';
            document.getElementById('adminProductEditName').value = '';
            document.getElementById('adminProductEditCategory').value = '';
            document.getElementById('adminProductEditPrice').value = '';
            document.getElementById('adminProductEditStock').value = '';
            document.getElementById('adminProductEditStatus').value = 'Active';
            document.getElementById('adminProductEditTitle').textContent = 'Add Product';
            document.getElementById('adminProductEditModal').style.display = 'flex';
        };
        window.closeAdminProductEditModal = function() {
            var m = document.getElementById('adminProductEditModal');
            if (m) m.style.display = 'none';
        };
        window.saveAdminProductEdit = function() {
            var id = document.getElementById('adminProductEditId').value || ('prod_' + Date.now());
            var item = {
                id: id,
                name: document.getElementById('adminProductEditName').value.trim(),
                category: document.getElementById('adminProductEditCategory').value.trim(),
                price: parseFloat(document.getElementById('adminProductEditPrice').value) || 0,
                stock: parseInt(document.getElementById('adminProductEditStock').value, 10) || 0,
                sales: 0,
                status: document.getElementById('adminProductEditStatus').value
            };
            if (!item.name) { adminToast('Product name is required.', 'warn'); return; }
            var list = loadAdminProducts();
            var idx = list.findIndex(function(x) { return x.id === id; });
            if (idx >= 0) { item.sales = list[idx].sales || 0; list[idx] = item; } else list.push(item);
            saveAdminProducts(list);
            renderAdminProductsTable();
            closeAdminProductEditModal();
            adminToast('Product saved.', 'success');
        };
        window.viewAdminProduct = function(id) {
            var p = loadAdminProducts().find(function(x) { return x.id === id; });
            if (!p) { adminToast('Product not found.', 'warn'); return; }
            openAdminDetailModal(p.name, 'Category: ' + p.category + '\nPrice: $' + Number(p.price).toFixed(2) + '\nStock: ' + p.stock + '\nSales: ' + p.sales + '\nStatus: ' + p.status);
        };
        function getDefaultAdminRoles() {
            return {
                super: { name: 'Super Admin', email: 'admin@kotapal.com', permissions: 'Full Access' },
                support: { name: 'Support Admin', email: 'support@kotapal.com', permissions: 'Limited Access' }
            };
        }
        function loadAdminRoles() {
            try {
                var r = JSON.parse(localStorage.getItem('admin_roles') || 'null');
                if (!r) r = getDefaultAdminRoles();
                return r;
            } catch (e) { return getDefaultAdminRoles(); }
        }
        window.openAdminRoleEdit = function(key) {
            var roles = loadAdminRoles();
            var r = roles[key] || { name: '', email: '', permissions: 'Full Access' };
            document.getElementById('adminRoleEditKey').value = key;
            document.getElementById('adminRoleEditName').value = r.name || '';
            document.getElementById('adminRoleEditEmail').value = r.email || '';
            document.getElementById('adminRoleEditPermissions').value = r.permissions || 'Full Access';
            document.getElementById('adminRoleEditModal').style.display = 'flex';
        };
        window.closeAdminRoleEditModal = function() {
            var m = document.getElementById('adminRoleEditModal');
            if (m) m.style.display = 'none';
        };
        window.saveAdminRoleEdit = function() {
            var key = document.getElementById('adminRoleEditKey').value;
            var roles = loadAdminRoles();
            roles[key] = {
                name: document.getElementById('adminRoleEditName').value.trim(),
                email: document.getElementById('adminRoleEditEmail').value.trim(),
                permissions: document.getElementById('adminRoleEditPermissions').value
            };
            localStorage.setItem('admin_roles', JSON.stringify(roles));
            closeAdminRoleEditModal();
            adminToast('Role updated.', 'success');
        };
        window.openAdminPlanEdit = function(planId) {
            var plan = getKotaPlan(planId);
            document.getElementById('adminPlanEditId').value = plan.id;
            document.getElementById('adminPlanEditName').value = plan.name;
            document.getElementById('adminPlanEditPrice').value = plan.price;
            document.getElementById('adminPlanEditFeatures').value = (plan.features || []).join('\n');
            document.getElementById('adminPlanEditTitle').textContent = planId ? 'Edit Plan' : 'Create Plan';
            document.getElementById('adminPlanEditModal').style.display = 'flex';
        };
        window.closeAdminPlanEditModal = function() {
            var m = document.getElementById('adminPlanEditModal');
            if (m) m.style.display = 'none';
        };
        window.saveAdminPlanEdit = function() {
            var id = document.getElementById('adminPlanEditId').value || ('custom_' + Date.now());
            var overrides = {};
            try { overrides = JSON.parse(localStorage.getItem('admin_plan_overrides') || '{}'); } catch (e) {}
            overrides[id] = {
                name: document.getElementById('adminPlanEditName').value.trim(),
                price: parseFloat(document.getElementById('adminPlanEditPrice').value) || 0,
                features: document.getElementById('adminPlanEditFeatures').value.split('\n').map(function(s) { return s.trim(); }).filter(Boolean)
            };
            localStorage.setItem('admin_plan_overrides', JSON.stringify(overrides));
            closeAdminPlanEditModal();
            if (typeof renderAdminPlansGrid === 'function') renderAdminPlansGrid();
            adminToast('Plan saved locally.', 'success');
        };
        window.setAdminUserManageMode = function(mode) {
            var isView = mode === 'view';
            ['adminUserManageUid', 'adminUserManageEmail', 'adminUserManageName', 'adminUserManageBlocksJson'].forEach(function(id) {
                var el = document.getElementById(id);
                if (el) el.readOnly = isView;
            });
            var planEl = document.getElementById('adminUserManagePlan');
            var statusEl = document.getElementById('adminUserManageStatus');
            if (planEl) planEl.disabled = isView;
            if (statusEl) statusEl.disabled = isView;
            var uidEl = document.getElementById('adminUserManageUid');
            if (uidEl && document.getElementById('adminUserManageMode').value !== 'add') uidEl.readOnly = true;
            var actions = document.getElementById('adminUserManageActions');
            if (actions) actions.style.display = isView ? 'none' : 'flex';
        };
        window.openBlockEditor = function(blockId) {
            var block = (currentBlocks || []).find(function(b) { return b.id === blockId; });
            if (!block) return;
            window._editingBlockId = blockId;
            selectedProductsList = (block.productsList || []).slice();
            currentLayout = block.layout || 'grid';
            var titleEl = document.getElementById('blockTitle');
            var ctaEl = document.getElementById('ctaText');
            if (titleEl) titleEl.value = block.title || '';
            if (ctaEl) ctaEl.value = block.ctaText || 'Buy Now';
            document.querySelectorAll('.layout-btn').forEach(function(btn) {
                btn.classList.toggle('active', btn.getAttribute('data-layout') === currentLayout);
            });
            var pageTitle = document.getElementById('newBlockPageTitle');
            var submitBtn = document.getElementById('newBlockSubmitBtn');
            if (pageTitle) pageTitle.textContent = 'Edit SmartBlock';
            if (submitBtn) submitBtn.textContent = 'Save Changes';
            if (typeof updateSelectedProducts === 'function') updateSelectedProducts();
            showDashboardPage('new-block');
        };
        function resetBlockEditorForm() {
            window._editingBlockId = null;
            selectedProductsList = [];
            currentLayout = 'grid';
            var titleEl = document.getElementById('blockTitle');
            var ctaEl = document.getElementById('ctaText');
            if (titleEl) titleEl.value = '';
            if (ctaEl) ctaEl.value = 'Buy Now';
            var pageTitle = document.getElementById('newBlockPageTitle');
            var submitBtn = document.getElementById('newBlockSubmitBtn');
            if (pageTitle) pageTitle.textContent = 'Create New SmartBlock';
            if (submitBtn) submitBtn.textContent = 'Create Block';
            if (typeof updateSelectedProducts === 'function') updateSelectedProducts();
        }
