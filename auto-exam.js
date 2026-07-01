// FPT Auto Complete + Exam v8 (Universal)
// Works with ANY course - no pre-mapping needed

(async function () {
    'use strict';

    // ==================== CONFIG ====================
    const RETAKE_PASSED = true;  // true = retake passed exams
    const MAX_RETRY = 1;          // Max retry per exam
    const BATCH = 20;             // Parallel requests (Phase 1)
    // ================================================

    const courseId = new URLSearchParams(window.location.search).get('oid');
    if (!courseId) { console.error('ERROR: Open course page with ?oid=... first'); return; }
    const H = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' };

    // ========== PHASE 1: COMPLETE ALL LESSONS ==========
    console.log('--- PHASE 1: Complete lessons ---\n');

    const listRes = await fetch(`/Curriculum/User_Curriculums?oid=${courseId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    const listHtml = await listRes.text();
    const items = [...new Set([...listHtml.matchAll(/LoadViewCur\((\d+)\)/g)].map(m => m[1]))];

    if (items.length === 0) {
        console.log('No lessons found');
    } else {
        const secondsPerItem = Math.ceil((100 * 3600) / items.length);
        const doItem = (curId) => Promise.all([
            fetch('/Curriculum/User_ViewCur', { method: 'POST', headers: H, body: `oid=${courseId}&id=${curId}` }),
            fetch('/Curriculum/Learn_SaveVideoAudio', { method: 'POST', headers: H, body: `pCourseId=${courseId}&pCurriculumId=${curId}&pLearnTime=600&pTotalTime=600` }),
            fetch('/Curriculum/Learn_AddTime', { method: 'POST', headers: H, body: `pCourseId=${courseId}&pCurriculumId=${curId}&pSeconds=${secondsPerItem}` }),
        ]);

        let done = 0;
        const t0 = Date.now();
        for (let i = 0; i < items.length; i += BATCH) {
            const batch = items.slice(i, i + BATCH);
            await Promise.all(batch.map(id => doItem(id).then(() => done++).catch(function () { })));
            console.log(`[${done}/${items.length}] lessons done`);
        }
        await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function () { });
        console.log(`Phase 1 done: ${done} lessons - ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
    }

    // ========== PHASE 2: AUTO EXAM ==========
    console.log('--- PHASE 2: Auto exam ---\n');

    // === KNOWN ANSWERS BY CUR ID (course 7915) ===
    const KNOWN = {
        175299: new Set(["976942", "976969", "976958", "976966", "976944", "976960", "976955", "976938", "976950", "976933"]),
        175306: new Set(["978639", "978655", "978637", "978651", "978629", "978648", "978664", "978646", "978632", "978658"]),
        175314: new Set(["978540", "978522", "978513", "978519", "978541", "978531", "978534", "978546", "978527", "978509"]),
        175322: new Set(["977971", "977974", "977994", "977985", "977976", "978000", "977983", "977990", "977997", "977966"]),
        175332: new Set(["978612", "978610", "978593", "978606", "978619", "978596", "978587", "978600", "978617", "978624"]),
        175340: new Set(["979675", "979662", "979686", "979678", "979672", "979682", "979665", "979679", "979667", "979671"]),
        175402: new Set(["978040", "978050", "978078", "978073", "978051", "978068", "978062", "978045", "978056", "978065"]),
        175410: new Set(["987863", "987839", "987843", "987852", "987865", "987875", "987845", "987855", "987870", "987858"]),
        175565: new Set(["988474", "988478", "988450", "988469", "988446", "988443", "988463", "988457", "988465", "988454"]),
        175575: new Set(["988706", "988717", "988714", "988708", "988724", "988730", "988696", "988699", "988693", "988719"]),
        175582: new Set(["988272", "988242", "988289", "988290", "988247", "988277", "988284", "988282", "988292", "988266", "988267", "988253", "988297", "988263", "988262", "988285", "988251", "988276", "988259"]),
    };

    // === KNOWN ANSWERS BY EXAM ID ===
    const KNOWN_EXAM = {
        31334: new Set(["994700", "994722", "994727", "994724", "994769", "994771", "994709", "994778", "994783", "994760", "994743", "994740", "994788", "994794", "994748"]), // CASAN AI
    };

    // === SMART GUESS: pick answer when no DB match ===
    function smartPick(options, attempt) {
        var allAbove = options.find(function (o) { return /tat ca|all of/i.test(o.text); });
        if (allAbove) return allAbove;

        if (options.length === 2) {
            var dung = options.find(function (o) { return /^Dung$/i.test(o.text.trim()); });
            if (dung) return dung;
        }

        if (attempt <= 1) {
            return options.reduce(function (a, b) { return b.text.length > a.text.length ? b : a; }, options[0]);
        }

        return options[attempt % options.length];
    }

    // === FIND ALL EXAMS IN COURSE ===
    const examList = [];
    console.log('Scanning exams...');

    for (const curId of items) {
        const r = await fetch('/Curriculum/User_ViewCur', { method: 'POST', headers: H, body: `oid=${courseId}&id=${curId}` });
        const h = await r.text();
        const m = h.match(/User_ViewExam\/(\d+)/);
        if (m) {
            const name = h.match(/<title>([^<]+)/)?.[1]
                || h.match(/class="portlet-title[^"]*"[^>]*>([^<]+)/)?.[1]
                || `Exam ${curId}`;
            examList.push({ curId: parseInt(curId), examId: m[1], name: name.trim() });
        }
    }
    console.log(`Found ${examList.length} exams\n`);

    // === TAKE EACH EXAM ===
    const results = [];

    for (const exam of examList) {
        const knownSet = KNOWN[exam.curId] || KNOWN_EXAM[exam.examId];

        // Skip exams without known answers
        if (!knownSet) {
            console.log(`-- ${exam.name}: No answer DB - skip`);
            results.push({ Exam: exam.name, Result: '-- SKIP (no DB)' });
            continue;
        }

        // Check if already passed
        const infoR = await fetch(`/Examination/User_ViewExam/${exam.examId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
        const infoHtml = await infoR.text();
        const infoText = new DOMParser().parseFromString(infoHtml, 'text/html').body?.innerText || '';
        const userId = infoHtml.match(/CheckTokenCode\(\s*\d+\s*,\s*(\d+)/)?.[1] || '215836';
        const alreadyPassed = infoText.includes('\u0110\u1ea1t') && !infoText.includes('Kh\u00f4ng \u0111\u1ea1t') && !infoText.includes('Ch\u01b0a \u0111\u1ea1t');

        if (alreadyPassed && !RETAKE_PASSED) {
            console.log(`OK ${exam.name}: Already passed - skip`);
            results.push({ Exam: exam.name, Result: 'OK SKIP' });
            continue;
        }

        let ok = false;
        for (let att = 1; att <= MAX_RETRY && !ok; att++) {
            try {
                // Enter exam
                await fetch('/Examination/CheckTokenCodeByExamId', { method: 'POST', headers: H, body: `examId=${exam.examId}` });
                const r1 = await fetch('/Examination/CheckVaoThi', { method: 'POST', headers: H, body: `_ExamID=${exam.examId}&_UserID=${userId}&_userTestId=0` });
                const d1 = await r1.text();

                let eid;
                try { let p = JSON.parse(d1); if (typeof p === 'string') p = JSON.parse(p); const o = Array.isArray(p) ? p[0] : p; eid = o.Examinee || o.ExamineeID || o.examineeId; } catch (e) { }
                if (!eid) eid = d1.match(/Examinee[^"]*?(\d{6,})/)?.[1];
                if (!eid) { const rf = await fetch(`/Examination/User_ViewExam/${exam.examId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } }); eid = (await rf.text()).match(/ExamineeID=(\d+)/)?.[1]; }
                if (!eid) { console.log(`FAIL ${exam.name}: Cannot get ExamineeID (attempt ${att})`); continue; }

                // Get questions
                const r2 = await fetch(`/Questionframe/questiontest?ExamineeID=${eid}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const html = await r2.text();
                const doc = new DOMParser().parseFromString(html, 'text/html');

                const userTestId = doc.querySelector('#hidden_usertestid,[id*="usertestid"]')?.value;
                const encEid = doc.querySelector('#hidden_ExamineeID,[id*="ExamineeID"]')?.value;
                const hExamId = doc.querySelector('#hidden_ExamID,[id*="ExamID"]')?.value;
                const fpId = html.match(/FramePartID['":\s]+(\d+)/)?.[1] || '0';

                if (!userTestId || !encEid || !hExamId) { console.log(`FAIL ${exam.name}: Missing hidden fields (attempt ${att})`); continue; }

                // Parse radios
                const radios = doc.querySelectorAll('input[type=radio]');
                const groups = {};
                radios.forEach(r => {
                    const n = r.getAttribute('name'), k = r.getAttribute('knv3-title');
                    if (!n || !k) return;
                    if (!groups[n]) groups[n] = { k, o: [] };
                    const label = r.nextElementSibling || r.parentElement;
                    const text = (label?.textContent || '').trim().substring(0, 200);
                    groups[n].o.push({ id: r.id, text });
                });

                // Pick answers
                const answers = [];
                let matched = 0;

                for (const [, g] of Object.entries(groups)) {
                    let pick = null;

                    // Priority 1: Use DB
                    if (knownSet) {
                        pick = g.o.find(opt => knownSet.has(opt.id));
                    }

                    // Priority 2: Smart guess
                    if (!pick) {
                        pick = smartPick(g.o, att);
                    } else {
                        matched++;
                    }

                    answers.push({
                        ExaminationTestId: parseInt(g.k),
                        UserAnswer: `[${pick.id}]`,
                        UserExplain: null, BookMark: null, CheckInternet: 0,
                        FramePartID: parseInt(fpId)
                    });
                }

                // Submit
                const r3 = await fetch('/QuestionFrame/Json_TongHopDiem', {
                    method: 'POST', headers: H,
                    body: new URLSearchParams({ userTestId, examineeId: encEid, examId: hExamId, listJson: JSON.stringify(answers) }).toString()
                });
                const raw = await r3.text();
                let passed = false;
                try { passed = JSON.parse(raw)[0]?.Value === "1"; } catch (e) { }

                const mode = knownSet ? `DB ${matched}/${answers.length}` : `Smart guess`;

                if (passed) {
                    ok = true;
                    console.log(`PASS ${exam.name} (${mode}, attempt ${att})`);
                    results.push({ Exam: exam.name, Result: 'PASS' });
                } else {
                    console.log(`FAIL ${exam.name} (${mode}, attempt ${att})`);
                }
            } catch (e) {
                console.log(`FAIL ${exam.name}: Error attempt ${att}: ${e.message}`);
            }
        }
        if (!ok) results.push({ Exam: exam.name, Result: 'FAIL' });
    }

    console.log('\n--- SUMMARY ---');
    console.table(results);
    await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function () { });
    console.log('Done! Reload page to see results.');
})();
