// FPT Force Refresh — Paste vào Console trên thiết bị bị lỗi % chưa đúng

(async function() {
    'use strict';
    const courseId = new URLSearchParams(window.location.search).get('oid');
    if (!courseId) { console.error('❌ Mở trang khóa học có ?oid=... rồi chạy lại'); return; }
    const H = { 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With':'XMLHttpRequest' };

    console.log('🔄 Force refresh khóa học...\n');

    // 1. Clear cache
    await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function(){});
    console.log('✅ Đã clear cache dashboard');

    // 2. Lấy danh sách bài
    const r = await fetch(`/Curriculum/User_Curriculums?oid=${courseId}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
    const html = await r.text();
    const items = [...new Set([...html.matchAll(/LoadViewCur\((\d+)\)/g)].map(m => m[1]))];
    console.log(`📋 ${items.length} bài học`);

    // 3. Visit từng bài để trigger sync trạng thái
    let done = 0;
    for (let i = 0; i < items.length; i += 20) {
        const batch = items.slice(i, i + 20);
        await Promise.all(batch.map(id =>
            fetch('/Curriculum/User_ViewCur', { method:'POST', headers:H, body:`oid=${courseId}&id=${id}` }).catch(function(){})
        ));
        done += batch.length;
        console.log(`🔄 ${done}/${items.length}`);
    }

    // 4. Clear cache lần nữa
    await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function(){});

    // 5. Thử gọi thêm các endpoint sync khác
    try {
        await fetch(`/Curriculum/User_ViewCourse?oid=${courseId}&mlid=1`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
        await fetch(`/Curriculum/AjaxGetCourseDashboard?courseId=${courseId}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
    } catch(e) {}

    console.log('🟢 Xong!');
})();
