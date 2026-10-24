
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cfg = window.MEDAURA_SUPABASE;
const db = createClient(cfg.url, cfg.publishableKey);
const panel = document.getElementById('v2-panel');
const $ = id => document.getElementById(id);

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
}[c]));

async function isSuper() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return false;

  const r = await db.from('admin_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return r.data?.role === 'super_admin';
}

async function call(action, payload = {}) {
  const { data: { session } } = await db.auth.getSession();
  if (!session) throw Error('يرجى تسجيل الدخول');

  const res = await fetch(`${cfg.url}/functions/v1/media-users`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'apikey': cfg.publishableKey,
      'authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, ...payload })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Error(data.error || 'تعذر تنفيذ العملية');

  return data;
}

function openPanel(title, html) {
  $('legacy-panels').hidden = true;
  panel.hidden = false;

  document.querySelectorAll('[data-tab]').forEach(b =>
    b.setAttribute('aria-pressed', 'false')
  );

  panel.innerHTML = `<h2>${esc(title)}</h2>${html}`;
}

async function users() {
  openPanel('إدارة الإعلاميين', `
    <p class="muted">
      حسابان للجنة الإعلامية. يستخدمان نفس زر تسجيل الدخول في الموقع.
    </p>
    <p id="media-notice" role="status"></p>

    <form id="media-create">
      <div class="row">
        <div>
          <label>البريد الإلكتروني</label>
          <input name="email" type="email" required>
        </div>
        <div>
          <label>الاسم الظاهر</label>
          <input name="display_name" maxlength="80" required>
        </div>
      </div>

      <label>كلمة المرور الأولية</label>
      <input name="password" type="password"
        autocomplete="new-password" minlength="12" required>

      <p><button>إنشاء حساب إعلامي</button></p>
    </form>

    <hr>
    <div id="media-list">جارٍ التحميل...</div>
  `);

  const notice = $('media-notice');

  const refresh = async () => {
    const data = await call('list');
    $('media-list').replaceChildren();

    for (const u of data.users || []) {
      const row = document.createElement('div');
      row.className = 'item';

      const info = document.createElement('div');
      info.textContent =
        `${u.display_name} · ${u.email} · ${u.disabled ? 'معطّل' : 'نشط'}`;

      const actions = document.createElement('div');

      for (const [label, action] of [
        ['تغيير الاسم', 'rename'],
        ['تعيين كلمة مرور', 'password'],
        [u.disabled ? 'تفعيل' : 'تعطيل', 'toggle']
      ]) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'secondary';
        b.textContent = label;

        b.onclick = async () => {
          try {
            let payload = { user_id: u.user_id };

            if (action === 'rename') {
              const name = prompt('الاسم الجديد', u.display_name);
              if (name === null) return;
              payload.display_name = name;
            }

            if (action === 'password') {
              const dialog = document.createElement('dialog');

              dialog.innerHTML = `
                <form method="dialog">
                  <label>كلمة المرور الجديدة (12 حرفًا على الأقل)</label>
                  <input type="password" minlength="12"
                    autocomplete="new-password" required>
                  <div class="toolbar">
                    <button value="save">تغيير</button>
                    <button class="secondary" value="cancel"
                      formnovalidate>إلغاء</button>
                  </div>
                </form>
              `;

              document.body.append(dialog);
              dialog.showModal();

              const result = await new Promise(resolve => {
                dialog.addEventListener('close', () => resolve({
                  choice: dialog.returnValue,
                  password: dialog.querySelector('input').value
                }), { once: true });
              });

              dialog.remove();

              if (result.choice !== 'save') return;
              payload.password = result.password;
            }

            if (action === 'toggle') {
              if (!confirm(
                `تأكيد ${u.disabled ? 'تفعيل' : 'تعطيل'} الحساب؟`
              )) return;

              payload.disabled = !u.disabled;
            }

            await call(action, payload);
            notice.textContent = 'تم التحديث';
            await refresh();

          } catch (e) {
            notice.textContent = e.message;
          }
        };

        actions.append(b);
      }

      row.append(info, actions);
      $('media-list').append(row);
    }

    if (!data.users?.length) {
      $('media-list').textContent = 'لا توجد حسابات إعلامية بعد.';
    }
  };

  $('media-create').onsubmit = async e => {
    e.preventDefault();
    const b = e.submitter;
    b.disabled = true;

    try {
      const f = new FormData(e.currentTarget);

      await call('create', {
        email: f.get('email'),
        display_name: f.get('display_name'),
        password: f.get('password')
      });

      e.currentTarget.reset();
      notice.textContent = 'تم إنشاء الحساب';
      await refresh();

    } catch (err) {
      notice.textContent = err.message;
    } finally {
      b.disabled = false;
    }
  };

  try {
    await refresh();
  } catch (e) {
    notice.textContent = e.message;
  }
}

/* ===== سجل النشاط باللغة العربية ===== */

const actionNames = {
  INSERT: 'إضافة',
  UPDATE: 'تعديل',
  DELETE: 'حذف'
};

const tableNames = {
  work_posts: 'منشور',
  gallery_albums: 'ألبوم',
  gallery_photos: 'صورة'
};

const fieldNames = {
  title: 'العنوان',
  title_ar: 'العنوان بالعربي',
  title_en: 'العنوان بالإنجليزي',
  name: 'الاسم',
  description: 'الوصف',
  description_ar: 'الوصف بالعربي',
  description_en: 'الوصف بالإنجليزي',
  content: 'المحتوى',
  body: 'المحتوى',
  summary: 'الملخص',
  excerpt: 'النبذة',
  caption: 'وصف الصورة',
  alt_text: 'النص البديل',
  slug: 'الرابط المختصر',
  status: 'الحالة',
  published: 'حالة النشر',
  is_published: 'حالة النشر',
  published_at: 'تاريخ النشر',
  cover_url: 'صورة الغلاف',
  image_url: 'رابط الصورة',
  sort_order: 'الترتيب',
  position: 'الترتيب',
  album_id: 'الألبوم',
  post_id: 'المنشور',
  updated_at: 'تاريخ التعديل',
  created_at: 'تاريخ الإنشاء'
};

const ignoredFields = new Set([
  'id',
  'created_at',
  'updated_at',
  'created_by',
  'updated_by'
]);

function recordTitle(record) {
  if (!record || typeof record !== 'object') return '';

  for (const key of [
    'title_ar', 'title', 'title_en',
    'name', 'caption', 'description_ar', 'description'
  ]) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim().slice(0, 120);
    }
  }

  return '';
}

function valueText(value, field = '') {
  if (value === null || value === undefined || value === '') {
    return 'فارغ';
  }

  if (typeof value === 'boolean') {
    return value ? 'نعم' : 'لا';
  }

  if (field === 'status') {
    const statuses = {
      draft: 'مسودة',
      published: 'منشور',
      archived: 'مؤرشف',
      active: 'نشط',
      inactive: 'غير نشط'
    };
    return statuses[value] || String(value);
  }

  if (field === 'published' || field === 'is_published') {
    if (value === true || value === 'true') return 'منشور';
    if (value === false || value === 'false') return 'غير منشور';
  }

  if (typeof value === 'object') {
    return JSON.stringify(value).slice(0, 180);
  }

  const text = String(value);
  return text.length > 180 ? text.slice(0, 180) + '…' : text;
}

function describeChanges(oldData, newData) {
  if (!oldData || !newData) return [];

  const changes = [];
  const keys = new Set([
    ...Object.keys(oldData),
    ...Object.keys(newData)
  ]);

  for (const key of keys) {
    if (ignoredFields.has(key)) continue;

    const before = oldData[key];
    const after = newData[key];

    if (JSON.stringify(before) === JSON.stringify(after)) continue;

    const label = fieldNames[key] || key;

    changes.push(
      `${label}: من «${valueText(before, key)}» إلى «${valueText(after, key)}»`
    );
  }

  return changes;
}

async function activity() {
  openPanel('سجل النشاط', `
    <p class="muted">
      سجل إضافات وتعديلات وحذف منشورات وألبومات وصور أعمالنا.
      عمليات ملفات Storage ليست ضمن هذا السجل بعد.
    </p>
    <div id="activity-list" aria-live="polite">
      جارٍ التحميل...
    </div>
  `);

  const host = $('activity-list');

  const r = await db.from('admin_activity_log')
    .select('id,actor_id,action,table_name,record_id,old_data,new_data,created_at')
    .order('created_at', { ascending: false })
    .limit(100);

  if (r.error) {
    host.textContent = 'تعذر تحميل سجل النشاط: ' + r.error.message;
    return;
  }

  const entries = r.data || [];
  host.replaceChildren();

  if (!entries.length) {
    host.textContent = 'لا يوجد نشاط مسجّل بعد.';
    return;
  }

  const actorNames = new Map();

  // جلب الأسماء الظاهرة للحسابات الإعلامية إن كانت الصلاحيات تسمح.
  const actorIds = [...new Set(
    entries.map(e => e.actor_id).filter(Boolean)
  )];

  if (actorIds.length) {
    const profiles = await db.from('media_admin_profiles')
      .select('user_id,display_name')
      .in('user_id', actorIds);

    if (!profiles.error) {
      for (const p of profiles.data || []) {
        actorNames.set(p.user_id, p.display_name);
      }
    }

    // مصدر إضافي للأسماء من وظيفة إدارة الحسابات.
    try {
      const result = await call('list');

      for (const u of result.users || []) {
        if (u.user_id && u.display_name) {
          actorNames.set(u.user_id, u.display_name);
        }
      }
    } catch (e) {
      // لا نوقف السجل إذا تعذّر جلب أسماء الحسابات.
    }
  }

  const currentUser = (await db.auth.getUser()).data?.user;

  for (const entry of entries) {
    const div = document.createElement('div');
    div.className = 'item';

    const content = document.createElement('div');

    const oldData = entry.old_data || {};
    const newData = entry.new_data || {};

    const title =
      recordTitle(newData) ||
      recordTitle(oldData) ||
      '';

    const action =
      actionNames[entry.action] ||
      entry.action ||
      'عملية';

    const table =
      tableNames[entry.table_name] ||
      entry.table_name ||
      'عنصر';

    let actor = 'مستخدم غير معروف';

    if (entry.actor_id) {
      actor = actorNames.get(entry.actor_id) ||
        (entry.actor_id === currentUser?.id
          ? 'مدير الموقع (أنت)'
          : 'مستخدم غير معروف');
    } else {
      actor = 'غير محدد';
    }

    const heading = document.createElement('strong');

    heading.textContent =
      `${actor} · ${action} ${table}` +
      (title ? ` «${title}»` : '');

    const date = document.createElement('div');
    date.className = 'muted';

    date.textContent = new Date(entry.created_at)
      .toLocaleString('ar', {
        dateStyle: 'medium',
        timeStyle: 'short'
      });

    content.append(heading, date);

    if (entry.action === 'UPDATE') {
      const changes = describeChanges(
        entry.old_data,
        entry.new_data
      );

      if (changes.length) {
        const list = document.createElement('ul');

        for (const change of changes) {
          const li = document.createElement('li');
          li.textContent = change;
          list.append(li);
        }

        content.append(list);
      } else {
        const note = document.createElement('p');
        note.className = 'muted';
        note.textContent =
          'لا توجد تفاصيل تغييرات متاحة لهذا التعديل.';
        content.append(note);
      }
    }

    if (entry.action === 'INSERT') {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = title
        ? `تمت إضافة ${table} جديد بعنوان «${title}».`
        : `تمت إضافة ${table} جديد.`;
      content.append(note);
    }

    if (entry.action === 'DELETE') {
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = title
        ? `تم حذف ${table} «${title}».`
        : `تم حذف ${table}.`;
      content.append(note);
    }

    div.append(content);
    host.append(div);
  }
}

async function init() {
  if (!(await isSuper())) return;

  for (const id of ['media-users-tab', 'activity-tab']) {
    const element = $(id);
    if (element) element.hidden = false;
  }

  const usersTab = $('media-users-tab');
  const activityTab = $('activity-tab');

  if (usersTab) usersTab.onclick = () => users();
  if (activityTab) activityTab.onclick = () => activity();
}

// تحديث الواجهة بعد تسجيل الدخول دون تغيير نظام الدخول الحالي.
db.auth.onAuthStateChange(() => {
  setTimeout(init, 0);
});

init();
