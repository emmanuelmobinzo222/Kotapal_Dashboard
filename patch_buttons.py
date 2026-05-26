# -*- coding: utf-8 -*-
"""Patch index.html to wire action buttons."""
import re

path = "index.html"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

MODALS = """
    <motion id="adminDetailModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2200;align-items:center;justify-content:center;padding:20px;">
        <div style="background:white;padding:24px;border-radius:12px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;">
            <h3 id="adminDetailModalTitle" style="margin-bottom:12px;">Details</h3>
            <div id="adminDetailModalBody" style="font-size:14px;color:#374151;line-height:1.6;white-space:pre-wrap;"></div>
            <div style="display:flex;gap:10px;margin-top:20px;justify-content:flex-end;">
                <button type="button" class="admin-btn admin-btn-secondary" onclick="closeAdminDetailModal()">Close</button>
            </div>
        </div>
    </div>

    <div id="adminProductEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2200;align-items:center;justify-content:center;padding:20px;">
        <motion style="background:white;padding:24px;border-radius:12px;max-width:480px;width:100%;">
            <h3 id="adminProductEditTitle" style="margin-bottom:16px;">Edit Product</h3>
            <input type="hidden" id="adminProductEditId">
            <div class="admin-form-group"><label>Name</label><input type="text" id="adminProductEditName" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Category</label><input type="text" id="adminProductEditCategory" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Price ($)</label><input type="number" step="0.01" id="adminProductEditPrice" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Stock</label><input type="number" id="adminProductEditStock" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></motion>
            <div class="admin-form-group"><label>Status</label><select id="adminProductEditStatus" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"><option value="Active">Active</option><option value="Draft">Draft</option><option value="Archived">Archived</option></select></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="button" class="admin-btn" onclick="saveAdminProductEdit()">Save</button>
                <button type="button" class="admin-btn admin-btn-secondary" onclick="closeAdminProductEditModal()">Cancel</button>
            </div>
        </div>
    </div>

    <div id="adminPlanEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2200;align-items:center;justify-content:center;padding:20px;">
        <div style="background:white;padding:24px;border-radius:12px;max-width:480px;width:100%;">
            <h3 id="adminPlanEditTitle" style="margin-bottom:16px;">Edit Plan</h3>
            <input type="hidden" id="adminPlanEditId">
            <div class="admin-form-group"><label>Plan name</label><input type="text" id="adminPlanEditName" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Monthly price ($)</label><input type="number" step="1" id="adminPlanEditPrice" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Features (one per line)</label><textarea id="adminPlanEditFeatures" rows="5" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></textarea></div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="button" class="admin-btn" onclick="saveAdminPlanEdit()">Save</button>
                <button type="button" class="admin-btn admin-btn-secondary" onclick="closeAdminPlanEditModal()">Cancel</button>
            </div>
        </div>
    </div>

    <div id="adminRoleEditModal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:2200;align-items:center;justify-content:center;padding:20px;">
        <div style="background:white;padding:24px;border-radius:12px;max-width:480px;width:100%;">
            <h3 id="adminRoleEditTitle" style="margin-bottom:16px;">Edit Role</h3>
            <input type="hidden" id="adminRoleEditKey">
            <div class="admin-form-group"><label>Role name</label><input type="text" id="adminRoleEditName" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <div class="admin-form-group"><label>Admin email</label><input type="email" id="adminRoleEditEmail" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"></div>
            <motion class="admin-form-group"><label>Permissions</label><select id="adminRoleEditPermissions" style="width:100%;padding:10px;border:1px solid #e5e7eb;border-radius:8px;"><option value="Full Access">Full Access</option><option value="Limited Access">Limited Access</option><option value="Read Only">Read Only</option></select></motion>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button type="button" class="admin-btn" onclick="saveAdminRoleEdit()">Save</button>
                <button type="button" class="admin-btn admin-btn-secondary" onclick="closeAdminRoleEditModal()">Cancel</button>
            </div>
        </div>
    </div>
"""
MODALS = MODALS.replace("<motion ", "<div ").replace("</motion>", "</div>")

marker = "    <!-- Admin Setup (create admin account) -->"
if "adminDetailModal" not in content:
    content = content.replace(marker, MODALS + "\n" + marker)

content = content.replace(
    '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;">\n                <button type="button" class="admin-btn" onclick="adminUserManageSaveProfile()">Save profile</button>',
    '<motion id="adminUserManageActions" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;">\n                <button type="button" class="admin-btn" id="adminUserManageSaveProfileBtn" onclick="adminUserManageSaveProfile()">Save profile</button>',
    1,
)
content = content.replace("<motion id=\"adminUserManageActions\"", '<div id="adminUserManageActions"')

content = content.replace(
    'onclick="adminUserManageSaveBlocks()">Save blocks</button>',
    'id="adminUserManageSaveBlocksBtn" onclick="adminUserManageSaveBlocks()">Save blocks</button>',
    1,
)
content = content.replace(
    'style="background:rgba(239,68,68,0.12);color:#b91c1c;" onclick="adminUserManageDeleteFirestore()"',
    'id="adminUserManageDeleteBtn" style="background:rgba(239,68,68,0.12);color:#b91c1c;" onclick="adminUserManageDeleteFirestore()"',
    1,
)

content = content.replace(
    'data-admin-demo="New billing plans require Stripe / payment integration in production. Settings saved locally for preview." style="width:auto;background:var(--admin-primary);color:#fff;"><i class="fas fa-plus"></i> Create Plan</button>',
    'data-admin-action="create-plan" style="width:auto;background:var(--admin-primary);color:#fff;"><i class="fas fa-plus"></i> Create Plan</button>',
)

content = content.replace(
    'data-admin-nav="settings" data-admin-demo="Role permissions are configured in Platform Settings and Firestore rules.">Edit</button></td></tr><tr><td>Support Admin</td><td>support@kotapal.com</td><td>Limited Access</td><td><button type="button" class="admin-btn-sm admin-btn-secondary" data-admin-nav="settings" data-admin-demo="Support admin roles are preview-only until IAM is connected.">Edit</button>',
    'data-admin-action="edit-role" data-role-key="super">Edit</button></td></tr><tr><td>Support Admin</td><td>support@kotapal.com</td><td>Limited Access</td><td><button type="button" class="admin-btn-sm admin-btn-secondary" data-admin-action="edit-role" data-role-key="support">Edit</button>',
)

content = re.sub(
    r"<tbody><tr><td>Wireless Headphones</td>.*?</tbody>",
    '<tbody id="adminProductsTableBody"></tbody>',
    content,
    count=1,
    flags=re.DOTALL,
)

content = content.replace('data-admin-action="open-users-manage"', 'data-admin-action="open-add-product"', 1)
content = content.replace(
    '<button type="submit" class="btn btn-primary">Create Block</button>',
    '<button type="submit" class="btn btn-primary" id="newBlockSubmitBtn">Create Block</button>',
)
content = content.replace(
    '<h1 class="page-title">Create New SmartBlock</h1>',
    '<h1 class="page-title" id="newBlockPageTitle">Create New SmartBlock</h1>',
)

if 'id="embedBlockSelect"' not in content:
    embed_html = """
                    <div class="card" style="margin-top:20px;">
                        <div class="card-header"><h3 class="card-title">Embed Anywhere</h3></motion>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="embedBlockSelect">Select block</label>
                                <select id="embedBlockSelect" class="form-control" style="max-width:320px;"></select>
                            </div>
                            <div class="form-group">
                                <label>Embed code</label>
                                <textarea id="embedCodeTextarea" class="form-control" rows="3" readonly></textarea>
                            </div>
                            <button type="button" class="btn btn-secondary" id="copyEmbedCodeBtn">Copy embed code</button>
                            <p id="embedDragBlockTitle" style="margin-top:12px;font-size:0.9rem;color:var(--gray);"></p>
                        </div>
                    </div>""".replace("<motion>", "<div>").replace("</motion>", "</motion>")
    embed_html = embed_html.replace("</motion>", "</div>")
    content = content.replace(
        '<motion id="blocksContainer" class="blocks-grid"></div>',
        '<div id="blocksContainer" class="blocks-grid"></div>' + embed_html,
    )

if 'id="saveAmazonApiKey"' not in content:
    api_settings = """
                    <div class="card" style="margin-top:20px;">
                        <div class="card-header"><h3 class="card-title">Product search API</h3></div>
                        <div class="card-body">
                            <div class="form-group">
                                <label for="amazonApiKey">SearchAPI.io key (Amazon product search)</label>
                                <input type="password" id="amazonApiKey" class="form-control" placeholder="Enter your SearchAPI key">
                                <p id="amazonApiKeyStatus" style="margin-top:8px;font-size:0.85rem;color:var(--gray);"></p>
                            </div>
                            <button type="button" class="btn btn-primary" id="saveAmazonApiKey">Save API key</button>
                        </div>
                    </div>"""
    content = content.replace(
        "                            <button type=\"submit\" class=\"btn btn-primary\">Save Changes</button>\n                        </form>\n                    </div>\n                    </div>\n                </div>\n            </motion>",
        "                            <button type=\"submit\" class=\"btn btn-primary\">Save Changes</button>\n                        </form>\n                    </div>" + api_settings + "\n                    </div>\n                </div>\n            </div>",
        1,
    )

if "productLibrarySearchRetailersBtn" not in content:
    retailer_search = """
                            <div style="display:flex;gap:12px;margin-bottom:12px;flex-wrap:wrap;align-items:flex-end;">
                                <select id="productLibraryRetailer" class="form-control" style="max-width:160px;">
                                    <option value="amazon">Amazon</option>
                                    <option value="walmart">Walmart</option>
                                </select>
                                <input id="productLibraryRetailerQuery" class="form-control" placeholder="Search retailers..." style="max-width:240px;">
                                <button type="button" class="btn btn-secondary" id="productLibrarySearchRetailersBtn">Search retailers</button>
                                <span id="productLibrarySearchStatus" style="font-size:0.9rem;color:var(--gray);"></span>
                            </div>
                            <div id="productLibrarySearchResults" style="margin-bottom:16px;"></div>
"""
    content = content.replace(
        '<div id="productLibraryContainer" style="display:grid;',
        retailer_search + '                            <div id="productLibraryContainer" style="display:grid;',
    )

if "function getAdminPlanOverrides" not in content:
    content = content.replace(
        "function getKotaPlan(planId) {\n            return KOTAPAL_PLANS[String(planId || 'starter').toLowerCase()] || KOTAPAL_PLANS.starter;\n        }",
        "function getAdminPlanOverrides() {\n            try { return JSON.parse(localStorage.getItem('admin_plan_overrides') || '{}'); } catch (e) { return {}; }\n        }\n        function getKotaPlan(planId) {\n            var base = KOTAPAL_PLANS[String(planId || 'starter').toLowerCase()] || KOTAPAL_PLANS.starter;\n            var ov = getAdminPlanOverrides()[base.id] || {};\n            if (!ov || !Object.keys(ov).length) return base;\n            var merged = Object.assign({}, base);\n            if (ov.name) merged.name = ov.name;\n            if (ov.price != null) merged.price = Number(ov.price);\n            if (ov.features) merged.features = ov.features.slice();\n            return merged;\n        }",
    )

content = content.replace(
    'data-admin-demo="Editing \' + plan.name + \' plan (preview — connect billing in production).">Edit Plan</button>',
    'data-admin-action="edit-plan" data-plan-id="' + "' + id + '\">Edit Plan</button>",
)

content = content.replace(
    "if (pageName === 'plans' && typeof renderAdminPlansGrid === 'function') renderAdminPlansGrid();",
    "if (pageName === 'plans' && typeof renderAdminPlansGrid === 'function') renderAdminPlansGrid();\n                if (pageName === 'blocks' && typeof renderAdminProductsTable === 'function') renderAdminProductsTable();",
)

content = content.replace(
    "')\">View</button><button type=\"button\" class=\"admin-btn-sm admin-btn-primary\" onclick=\"openAdminManageUser('",
    "','view')\">View</button><button type=\"button\" class=\"admin-btn-sm admin-btn-primary\" onclick=\"openAdminManageUser('",
    1,
)

# Fix subscription view only - second occurrence pattern
content = content.replace(
    "+ status + '\\')\">View</button></motion></td></tr>';",
    "+ status + '\\',\\'view\\')\">View</button></div></td></tr>';",
)
content = content.replace("</motion></td></tr>';", "</motion></td></tr>';")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
print("HTML patches applied")
