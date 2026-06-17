// FPT Auto Exam v5 — https://github.com/YOUR_USERNAME/fpt-auto-exam
// Console: fetch('https://YOUR_USERNAME.github.io/fpt-auto-exam/auto-exam.js').then(r=>r.text()).then(eval)

(async function() {
    'use strict';

    // ==================== CẤU HÌNH (EDIT Ở ĐÂY) ====================
    const RETAKE_PASSED = false;  // true = thi lại bài đã đạt | false = bỏ qua
    const MAX_RETRY = 3;          // Số lần thi lại tối đa
    // ================================================================

    const EXAMS = [
        { curId:175299, name:"Quản lý thời gian bằng Time Blocking",
          ids:new Set(["976942","976969","976958","976966","976944","976960","976955","976938","976950","976933"]) },
        { curId:175306, name:"Kỹ năng báo cáo tiến độ & quản trị deadline",
          ids:new Set(["978639","978655","978637","978651","978629","978648","978664","978646","978632","978658"]) },
        { curId:175314, name:"Định luật Parkinson",
          ids:new Set(["978540","978522","978513","978519","978541","978531","978534","978546","978527","978509"]) },
        { curId:175322, name:"Kỹ năng xử lý mâu thuẫn nhẹ",
          ids:new Set(["977971","977974","977994","977985","977976","978000","977983","977990","977997","977966"]) },
        { curId:175332, name:"Tư duy dịch vụ nội bộ",
          ids:new Set(["978612","978610","978593","978606","978619","978596","978587","978600","978617","978624"]) },
        { curId:175340, name:"Growth Mindset",
          ids:new Set(["979675","979662","979686","979678","979672","979682","979665","979679","979667","979671"]) },
        { curId:175402, name:"Tư duy đổi mới sáng tạo",
          ids:new Set(["978040","978050","978078","978073","978051","978068","978062","978045","978056","978065"]) },
        { curId:175410, name:"Kỹ năng kể câu chuyện đằng sau những con số",
          ids:new Set(["987863","987839","987843","987852","987865","987875","987845","987855","987870","987858"]) },
        { curId:175565, name:"Kỹ năng tạo động lực cho đội nhóm",
          ids:new Set(["988474","988478","988450","988469","988446","988443","988463","988457","988465","988454"]) },
        { curId:175575, name:"Gắn kết nhân viên",
          ids:new Set(["988706","988717","988714","988708","988724","988730","988696","988699","988693","988719"]) },
        { curId:175582, name:"Mô hình GROW",
          ids:new Set(["988272","988242","988289","988290","988247","988277","988284","988282","988292","988266","988267","988253","988297","988263","988262","988285","988251","988276","988259"]),
          // Khi 2 đáp án cùng match 1 nhóm, chọn theo keyword trong câu hỏi
          dmap:{"988263":"tương ứng","988262":"đang xảy ra","988266":"hiện trạng","988267":"nhược điểm","988284":"cuối cùng","988282":"xuất phát","988289":"nào thuộc","988290":"KHÔNG"} },
    ];

    const courseId = new URLSearchParams(window.location.search).get('oid') || '7915';
    const H = { 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With':'XMLHttpRequest' };

    async function getExamId(curId) {
        const r = await fetch('/Curriculum/User_ViewCur', { method:'POST', headers:H, body:`oid=${courseId}&id=${curId}` });
        return (await r.text()).match(/User_ViewExam\/(\d+)/)?.[1];
    }

    async function getExamInfo(examId) {
        const r = await fetch(`/Examination/User_ViewExam/${examId}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
        const html = await r.text();
        const text = new DOMParser().parseFromString(html, 'text/html').body?.innerText || '';
        const userId = html.match(/CheckTokenCode\(\s*\d+\s*,\s*(\d+)/)?.[1] || '215836';
        const passed = text.includes('Đạt') && !text.includes('Không đạt') && !text.includes('Chưa đạt');
        return { userId, passed };
    }

    async function doExam(examId, userId, exam) {
        const correctSet = exam.ids;
        const dmap = exam.dmap || {};
        await fetch('/Examination/CheckTokenCodeByExamId', { method:'POST', headers:H, body:`examId=${examId}` });
        const r1 = await fetch('/Examination/CheckVaoThi', { method:'POST', headers:H, body:`_ExamID=${examId}&_UserID=${userId}&_userTestId=0` });
        const d1 = await r1.text();

        let eid;
        try {
            let parsed = JSON.parse(d1);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            const obj = Array.isArray(parsed) ? parsed[0] : parsed;
            eid = obj.Examinee || obj.ExamineeID || obj.examineeId;
        } catch(e) {}
        if (!eid) eid = d1.match(/Examinee[^"]*?(\d{6,})/)?.[1];
        if (!eid) { const r = await fetch(`/Examination/User_ViewExam/${examId}`,{headers:{'X-Requested-With':'XMLHttpRequest'}}); eid = (await r.text()).match(/ExamineeID=(\d+)/)?.[1]; }
        if (!eid) return null;

        const r2 = await fetch(`/Questionframe/questiontest?ExamineeID=${eid}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
        const html = await r2.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        const userTestId = doc.querySelector('#hidden_usertestid,[id*="usertestid"]')?.value || html.match(/hidden_usertestid['"]\s*value\s*=\s*['"](\d+)/i)?.[1];
        const encEid = doc.querySelector('#hidden_ExamineeID,[id*="ExamineeID"]')?.value || html.match(/hidden_ExamineeID['"]\s*value\s*=\s*['"]([^'"]+)/i)?.[1];
        const hExamId = doc.querySelector('#hidden_ExamID,[id*="ExamID"]')?.value || html.match(/hidden_ExamID['"]\s*value\s*=\s*['"](\d+)/i)?.[1];
        const fpId = html.match(/FramePartID['":\s]+(\d+)/)?.[1] || '0';

        const radios = doc.querySelectorAll('input[type=radio]');
        const groups = {};
        radios.forEach(r => {
            const n = r.getAttribute('name'), k = r.getAttribute('knv3-title');
            if (!n || !k) return;
            if (!groups[n]) groups[n] = { k, o: [] };
            const label = r.nextElementSibling || r.parentElement;
            const text = (label?.textContent || '').trim().substring(0, 120);
            groups[n].o.push({ id: r.id, text });
        });

        const questionTexts = {};
        doc.querySelectorAll('.question-title, .portlet-title, h4, h5, .quest-title, [class*="question"], p').forEach(el => {
            const t = (el.textContent || '').trim();
            if (t.length > 15 && t.includes('?')) questionTexts[Object.keys(questionTexts).length] = t.substring(0, 200);
        });

        const answers = []; let matched = 0;
        const unmatchedQs = [];
        let qIdx = 0;

        for (const [name, g] of Object.entries(groups)) {
            // Tìm tất cả đáp án match từ database
            const matches = g.o.filter(opt => correctSet.has(opt.id));
            let aid = null;

            if (matches.length === 1) {
                aid = matches[0];
            } else if (matches.length > 1) {
                // Nhiều đáp án match → dùng dmap để phân biệt theo text câu hỏi
                const qText = questionTexts[qIdx] || '';
                for (const m of matches) {
                    const keyword = dmap[m.id];
                    if (keyword && qText.includes(keyword)) { aid = m; break; }
                }
                if (!aid) aid = matches[0]; // fallback: chọn đáp án đầu
            }

            if (aid) {
                matched++;
                answers.push({ ExaminationTestId:parseInt(g.k), UserAnswer:`[${aid.id}]`, UserExplain:null, BookMark:null, CheckInternet:0, FramePartID:parseInt(fpId) });
            } else {
                const pick = g.o[Math.floor(Math.random()*g.o.length)];
                answers.push({ ExaminationTestId:parseInt(g.k), UserAnswer:`[${pick.id}]`, UserExplain:null, BookMark:null, CheckInternet:0, FramePartID:parseInt(fpId) });
                unmatchedQs.push({ name, questionText: questionTexts[qIdx] || '(không lấy được text)', options: g.o });
            }
            qIdx++;
        }

        if (!userTestId || !encEid || !hExamId) return null;

        const r3 = await fetch('/QuestionFrame/Json_TongHopDiem', {
            method:'POST', headers:H,
            body: new URLSearchParams({ userTestId, examineeId:encEid, examId:hExamId, listJson:JSON.stringify(answers) }).toString()
        });
        const raw = await r3.text();
        let passed = false;
        try { passed = JSON.parse(raw)[0]?.Value === "1"; } catch(e) {}

        return { matched, total: answers.length, passed, unmatchedQs };
    }

    console.log('FPT AUTO EXAM v5\n');
    const results = [];

    for (const exam of EXAMS) {
        const examId = await getExamId(exam.curId);
        if (!examId) { console.log(`🔴 ${exam.name}: không tìm thấy`); continue; }

        const info = await getExamInfo(examId);

        if (info.passed && !RETAKE_PASSED) {
            console.log(`🟢 ${exam.name}: Đã đạt — bỏ qua`);
            results.push({ Bài: exam.name, KQ: '🟢 SKIP' });
            continue;
        }

        let ok = false;
        for (let att = 1; att <= MAX_RETRY && !ok; att++) {
            const r = await doExam(examId, info.userId, exam);
            if (!r) { console.log(`🔴 ${exam.name}: Lỗi (lần ${att})`); continue; }

            if (r.passed) {
                ok = true;
                console.log(`🟢 ${exam.name}: PASS (${r.matched}/${r.total} matched, lần ${att})`);
                results.push({ Bài: exam.name, KQ: '🟢 PASS' });
            } else {
                console.log(`🔴 ${exam.name}: FAIL (${r.matched}/${r.total} matched, lần ${att})${att < MAX_RETRY ? ' → thi lại...' : ''}`);
                if (r.unmatchedQs && r.unmatchedQs.length > 0) {
                    console.log(`\n  ⚠️ ${r.unmatchedQs.length} CÂU MỚI CHƯA CÓ TRONG DATABASE:`);
                    r.unmatchedQs.forEach((q, i) => {
                        console.log(`  ❓ ${q.questionText}`);
                        q.options.forEach(opt => console.log(`     [${opt.id}] ${opt.text}`));
                        console.log('');
                    });
                }
            }
        }
        if (!ok) results.push({ Bài: exam.name, KQ: '🔴 FAIL' });
    }

    console.log('\nTổng hợp:');
    console.table(results);
    fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(()=>{});
    console.log('Xong!');
})();
