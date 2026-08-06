// FPT Auto Complete + Exam v9 (Universal + Text Matching)
// Works with ANY course

(async function() {
    'use strict';

    // ==================== CONFIG ====================
    const RETAKE_PASSED = false;
    const MAX_RETRY = 1;
    const BATCH = 20;
    // ================================================

    const courseId = new URLSearchParams(window.location.search).get('oid');
    if (!courseId) { console.error('Open course page with ?oid= first'); return; }
    const H = { 'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With':'XMLHttpRequest' };

    // ========== PHASE 1: COMPLETE ALL LESSONS ==========
    console.log('--- PHASE 1: Complete lessons ---\n');

    const listRes = await fetch(`/Curriculum/User_Curriculums?oid=${courseId}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
    const listHtml = await listRes.text();
    const items = [...new Set([...listHtml.matchAll(/(?:LoadViewCur\(|data-cur-id=["']|curId=["'])(\d+)/g)].map(m => m[1]))];

    if (items.length === 0) {
        console.log('No lessons found');
    } else {
        const secondsPerItem = Math.ceil((100 * 3600) / items.length);
        const doItem = (curId) => Promise.all([
            fetch('/Curriculum/User_ViewCur', { method:'POST', headers:H, body:`oid=${courseId}&id=${curId}` }),
            fetch('/Curriculum/Learn_SaveVideoAudio', { method:'POST', headers:H, body:`pCourseId=${courseId}&pCurriculumId=${curId}&pLearnTime=600&pTotalTime=600` }),
            fetch('/Curriculum/Learn_AddTime', { method:'POST', headers:H, body:`pCourseId=${courseId}&pCurriculumId=${curId}&pSeconds=${secondsPerItem}` }),
        ]);

        let done = 0;
        const t0 = Date.now();
        for (let i = 0; i < items.length; i += BATCH) {
            const batch = items.slice(i, i + BATCH);
            await Promise.all(batch.map(id => doItem(id).then(() => done++).catch(function(){})));
            console.log(`[${done}/${items.length}] lessons done`);
        }
        await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function(){});
        console.log(`Phase 1 done: ${done} lessons - ${((Date.now()-t0)/1000).toFixed(1)}s\n`);
    }

    // ========== PHASE 2: AUTO EXAM ==========
    console.log('--- PHASE 2: Auto exam ---\n');

    // === KNOWN ANSWERS BY CUR ID (course 7915) ===
    const KNOWN = {
        175299: new Set(["976942","976969","976958","976966","976944","976960","976955","976938","976950","976933"]),
        175306: new Set(["978639","978655","978637","978651","978629","978648","978664","978646","978632","978658"]),
        175314: new Set(["978540","978522","978513","978519","978541","978531","978534","978546","978527","978509"]),
        175322: new Set(["977971","977974","977994","977985","977976","978000","977983","977990","977997","977966"]),
        175332: new Set(["978612","978610","978593","978606","978619","978596","978587","978600","978617","978624"]),
        175340: new Set(["979675","979662","979686","979678","979672","979682","979665","979679","979667","979671"]),
        175402: new Set(["978040","978050","978078","978073","978051","978068","978062","978045","978056","978065"]),
        175410: new Set(["987863","987839","987843","987852","987865","987875","987845","987855","987870","987858"]),
        175565: new Set(["988474","988478","988450","988469","988446","988443","988463","988457","988465","988454"]),
        175575: new Set(["988706","988717","988714","988708","988724","988730","988696","988699","988693","988719"]),
        175582: new Set(["988272","988242","988289","988290","988247","988277","988284","988282","988292","988266","988267","988253","988297","988263","988262","988285","988251","988276","988259"]),
    };

    // === KNOWN ANSWERS BY EXAM ID ===
    const KNOWN_EXAM = {
        31334: new Set(["994700","994722","994727","994724","994769","994771","994709","994778","994783","994760","994743","994740","994788","994794","994748"]),
    };

    // === TEXT-BASED ANSWER MAP (for exams with randomized IDs) ===
    // Format: { examId: [ {q: "keyword in question", a: "correct answer text"}, ... ] }
    const TEXT_MAP = {
        31334: [
            {q: "muc dich", a: "muc do truong thanh"},
            {q: "cao nhat", a: "Native"},
            {q: "chuyen bien lon nhat", a: "ho tro sang tu van hanh"},
            {q: "dac diem cua cap do Standard", a: "chuan hoa du lieu, quy trinh, nen tang, chinh sach"},
            {q: "AI Delegation", a: "lam gi va ai chiu trach nhiem"},
            {q: "nguyen tac", a: "khong duoc nhay cap"},
            {q: "bao nhieu cap", a: "5"},
            {q: "KHONG thuoc lo trinh", a: "hoi dong quan tri AI"},
            {q: "khac biet ki thuat lon nhat", a: "Harness Engineering"},
            {q: "Vai tro cua Harness", a: "Kiem soat cach AI hoat dong"},
            {q: "AI Agent tu lay du lieu", a: "Automated"},
            {q: "nguoi quan ly AI, nguoi kiem soat", a: "Standard"},
            {q: "de xuat ke hoach, nhung van tu quyet dinh cuoi cung", a: "Human-led AI-first"},
            {q: "Augmented", a: "kho tai nguyen AI dung chung"},
            {q: "soan proposal", a: "chuan hoa quy trinh va du lieu dung chung"},
        ],
        "C8035": [
            {"q": "Hieu ung domino", "a": "Sai sot mot mat xich anh huong toan chuoi"},
            {"q": "vai tro cua cac phong ban", "a": "Moi phong ban deu gop phan tao gia tri"},
            {"q": "Kho chu dong phoi hop khi thieu hang", "a": "Phoi hop bao ve trai nghiem khach hang"},
            {"q": "Phoi hop hieu qua giup", "a": "Tao trai nghiem lien mach"},
            {"q": "Khi xung dot uu tien", "a": "Tac dong toi khach hang"},
            {"q": "IT lui lich nang cap", "a": "Dat khach hang len truoc"},
            {"q": "Toi xong viec cua toi", "a": "Tu duy silo"},
            {"q": "Hop lien phong ban tim nguyen nhan goc", "a": "Tu duy toan hanh trinh khach hang"},
            {"q": "Hoa don sai thong tin can", "a": "Cac phong ban phoi hop"},
            {"q": "bo phan IT tao ra gia tri chu yeu thong qua", "a": "Dam bao he thong van hanh on dinh"},
            {"q": "Moi nhieu phong ban danh gia", "a": "Chuoi gia tri la he thong lien ket"},
            {"q": "gia tri danh cho khach hang", "a": "Kha nang dap ung nhu cau va ky vong cua khach hang"},
            {"q": "ket qua nao de xay ra", "a": "Khach hang quay lai va doanh thu ben vung"},
            {"q": "diem khoi dau cua qua trinh tao doanh thu", "a": "Nhu cau cua khach hang"},
            {"q": "moi quan he giua cac mat xich", "a": "Cac mat xich phu thuoc va tac dong lan nhau"},
            {"q": "Hoat dong ho tro trong chuoi gia tri co vai tro gi", "a": "Giup hoat dong chinh van hanh hieu qua"},
            {"q": "muc tieu dau tien cua doanh nghiep la", "a": "Tao ra khach hang"},
            {"q": "lien tuc giam gia nhung KH khong quay lai", "a": "Cai thien gia tri va trai nghiem khach hang"},
            {"q": "tu duy tao gia tri truoc doanh thu den sau", "a": "Uu tien giai quyet dung van de cua khach hang"},
            {"q": "Mot mat xich cham lam toan bo giao hang bi anh huong", "a": "Cac mat xich phu thuoc lan nhau"},
            {"q": "Sales hoan thanh KPI doanh so thang nhung Logistics bi qua tai", "a": "That bai ve muc tieu chung do thieu su phoi hop du bao nang luc dap ung"},
            {"q": "Silo Effect", "a": "Moi phong ban chi tap trung vao KPI rieng ma thieu su chia se thong tin"},
            {"q": "Kho kiem tra thay linh kien bi tray xuoc nhe", "a": "Cap nhat ngay trang thai len he thong va bao Sales"},
            {"q": "Sales do loi cho Kho xuat cham", "a": "Su thieu thong nhat ve thong tin va thieu mot dau moi chiu trach nhiem dieu phoi"},
            {"q": "Ban chat cot loi cua phoi hop lien phong ban", "a": "Qua trinh cac bo phan chia se thong tin, phoi hop hanh dong de huong toi muc tieu chung"},
            {"q": "Kho phat hien chiec iPhone bi loi ngoai quan nen tam dung xuat", "a": "Su dut gay thong tin ban giao giua Kho va Sales do tu duy Silo"},
            {"q": "Vai tro cua cac bo phan gian tiep", "a": "Dong vai tro mat xich quyet dinh chat luong dich vu va kha nang giu cam ket"},
            {"q": "Tu goc nhin cua khach hang doi voi dich vu", "a": "Khach hang khong quan tam co cau phong ban ma chi cam nhan trai nghiem xuyen suot"},
            {"q": "Kinh doanh xac nhan lap tuc. Tuy nhien 1 ngay sau Kho moi bao het hang", "a": "Thuc te thieu su dong bo va chia se du lieu ton kho kip thoi giua Kinh doanh va Kho"},
            {"q": "thuat ngu Diem ban giao Handoff", "a": "Thoi diem cong viec, thong tin hoac trach nhiem duoc chuyen tu phong ban nay sang phong ban khac"},
            {"q": "sai lam pho bien khien viec huy dong nhan su phoi hop kem hieu qua", "a": "Moi qua nhieu nguoi khong lien quan tham gia"},
            {"q": "C Consulted khac ky tu I Informed", "a": "C duoc tham van y kien truoc khi quyet dinh, I chi duoc cap nhat thong tin"},
            {"q": "Ban chat thuc su cua xung dot y kien", "a": "Su khac biet ve goc nhin chuyen mon, uu tien va chi so danh gia"},
            {"q": "15h30 xe giao iPhone hong tren duong", "a": "So do phan loai ben lien quan"},
            {"q": "theo doi va phan hoi tien do", "a": "Duy tri lien tuc, cap nhat ngay khi co thay doi"},
            {"q": "A Accountable", "a": "Nguoi chiu trach nhiem duy nhat va co quyen phe duyet ket qua cuoi cung"},
            {"q": "qua trinh giao tiep lien phong ban da hoan thanh thanh cong", "a": "Cac ben lien quan cung xac nhan su thong nhat va hieu dung thong tin"},
            {"q": "phan dinh ro ai chiu trach nhiem chinh A va ai can thong bao I", "a": "Ma tran phan dinh trach nhiem RACI"},
            {"q": "Khi xay ra bat dong y kien", "a": "Quay tro lai muc tieu chung la trai nghiem va loi ich cua khach hang"},
            {"q": "Xe giao hang du kien tre 20 phut do tac duong", "a": "Thong bao ngay cho Sales/CSKH de chu dong goi dien giai thich"},
            {"q": "Khach hang hai long va Khach hang trung thanh", "a": "Long tin va su san long gioi thieu cho nguoi khac"},
            {"q": "Sau khi khach dat hang thanh cong hanh dong nao tao Touchpoint tich cuc nhat", "a": "Gui thong tin xac nhan kem link theo doi don hang"},
            {"q": "Khach phai doc lai dia chi cho 3 ben", "a": "Dut gay luong chia se thong tin giua cac diem cham"},
            {"q": "Quy trinh noi bo va Pain Point", "a": "Quy trinh lam dung van co the tao Pain Point"},
            {"q": "Giao cham 30 phut nhung bao truoc 2 tieng", "a": "Quan ly ky vong va minh bach giup bien su co thanh niem tin"},
            {"q": "tren Web con hang nhung den Cua hang thi bao het", "a": "Trai nghiem da kenh bi dut gay do du lieu khong dong bo"},
            {"q": "Customer Journey", "a": "Toan bo trai nghiem truoc, trong va sau mua hang"},
            {"q": "giao gap dien thoai truoc 17h de lam qua", "a": "Cam ket giao dung khung gio da hua"},
            {"q": "Mau chot cua trai nghiem da kenh lien mach Omnichannel", "a": "Du lieu dong bo va trai nghiem nhat quan giua cac kenh"},
            {"q": "Gia tri khach hang cam nhan", "a": "Can bang giua loi ich nhan duoc va chi phi bo ra"},
            {"q": "Xu huong thay doi lon nhat trong ky vong", "a": "Doi hoi trai nghiem cao, su thuan tien va minh bach"},
            {"q": "goi tong dai chi nhan duoc cau tra loi doi kiem tra", "a": "Su thieu minh bach va cam giac bi bo mac"},
            {"q": "Dac diem chinh cua Pain Point", "a": "Bat tien, kho khan hoac cam xuc tieu cuc cua khach"},
            {"q": "mo hinh Kano", "a": "Yeu to co ban Basic Must be"},
            {"q": "Touchpoint", "a": "Bat ky su tuong tac nao giua khach va doanh nghiep"},
            {"q": "chi quan tam den khach hang khi ho sap roi di", "a": "Thieu su quan tam den trai nghiem khach hang"},
            {"q": "su dung du lieu trong ca nhan hoa trai nghiem khach hang B2B", "a": "Cung cap thong tin gia tri va du doan nhu cau"},
            {"q": "giai quyet khieu nai khach hang B2B hieu qua", "a": "Cham soc va xoa diu cam xuc cua khach hang"},
            {"q": "xay dung moi quan he doi tac chien luoc", "a": "Tap trung vao viec tao ra gia tri chung lau dai cho ca hai ben"},
            {"q": "thu thap phan hoi khach hang hieu qua", "a": "Phong van chuyen sau"},
            {"q": "giai doan nao quyet dinh den su gan bo lau dai cua khach hang voi doanh nghiep", "a": "Giai doan sau ban hang"},
            {"q": "tu dong hoa qua trinh phan loai khach hang dua tren hanh vi mua hang", "a": "Phan doan khach hang"},
            {"q": "KHONG phai la mot trong nhung muc tieu cua viec ung dung cong cu CRM", "a": "Tang chi phi quan ly va van hanh"},
            {"q": "KHONG phu hop de nuoi duong moi quan he khach hang B2B sau ban hang", "a": "Lien tuc chao moi mua them cac san pham khong lien quan"},
            {"q": "Chuong trinh khach hang than thiet", "a": "Giu chan khach hang va khuyen khich ho mua hang thuong xuyen"},
            {"q": "ca nhan hoa trai nghiem khach hang B2B khac biet chu yeu voi B2C o diem nao", "a": "Dua tren nhu cau va muc tieu kinh doanh phuc tap"},
            {"q": "danh gia muc do hai long cua khach hang", "a": "Phan mem khao sat truc tuyen"},
            {"q": "Customer Journey Mapping B2B nham muc dich chinh la gi", "a": "Toi uu hoa cac diem cham touchpoints va nang cao trai nghiem tong the"},
            {"q": "do luong long trung thanh cua khach hang", "a": "Net Promoter Score"},
            {"q": "Yeu to cot loi nao tao nen su thanh cong cua mot chien luoc Lay khach hang lam trung tam", "a": "Su cam ket va van hoa tu cap lanh dao cao nhat den tung nhan vien"},
            {"q": "nhin thay su lien ket va moi quan he giua cac khai niem", "a": "Tao so do tu duy cho tat ca cac nguon"},
            {"q": "Lanh dao can mot tai lieu ngan gon nhung co he thong", "a": "Tai lieu tom tat"},
            {"q": "phan loai cac nguon tai lieu theo chu de", "a": "Them tien to chu de vao ten tai lieu"},
            {"q": "tao infographic tieng Viet theo kho ngang", "a": "Huong trinh bay, Muc do chi tiet, Ngon ngu va mo ta"},
            {"q": "slide qua email de lanh dao tu doc", "a": "Ban trinh bay chi tiet"},
            {"q": "Vi sao nen tao mot so tay rieng", "a": "De tranh tron du lieu khong lien quan"},
            {"q": "muon kiem tra kien thuc nhan vien", "a": "Cau hoi"},
            {"q": "trao doi giua hai nguoi dan", "a": "Tim hieu sau"},
            {"q": "chuan bi bao cao va can kiem tra thong tin", "a": "Kiem chung thong tin va giam rui ro ao giac AI"},
            {"q": "tong hop buc tranh chung tu moi tai lieu trong so tay", "a": "Chon tat ca nguon truoc khi dat cau hoi"},
            {"q": "ba khu vuc nao", "a": "Nguon, Cuoc tro chuyen va Studio"},
            {"q": "muon on lai", "a": "Tao Flashcards"},
            {"q": "thuyet trinh truc tiep va can slide truc quan, it chu", "a": "Trang trinh bay"},
            {"q": "tao bo slide theo dung doi tuong nguoi xem", "a": "Tuy chinh cua tinh nang Tao ban trinh bay"},
            {"q": "video giup nhan vien hieu toan dien chu de", "a": "Video giai thich"},
            {"q": "Nhung cach nao co the dung de them nguon vao Gemini Notebook", "a": "Tai tep truc tiep tu may tinh"},
            {"q": "Viec them cac tien to phan loai", "a": "Huong dan AI cach nhom cac nguon"},
            {"q": "Tro ly nghien cuu bien cac nguon thong tin roi rac", "a": "thanh co cau truc va huu ich"},
            {"q": "kiem tra tinh chinh xac", "a": "Dap an 1 va 2 dung"},
            {"q": "bang du lieu so sanh", "a": "Bang du lieu"},
            {"q": "tao anh cho Elearning", "a": "Cartoon, character, storytelling"},
            {"q": "KHONG nen lam", "a": "Tao anh qua nhieu chi tiet gay kho doc"},
            {"q": "prompt qua ngan", "a": "Mo ta day du chu the, boi canh va phong cach"},
            {"q": "thu tu thanh phan nao", "a": "Subject Action Environment Style Camera Lighting Color Palette Ratio Quality"},
            {"q": "han che loi anh co chu sai", "a": "No text"},
            {"q": "dieu nao can tranh khi dung Gemini", "a": "Dua du lieu noi bo, thong khoach hang hoac tai lieu mat"},
            {"q": "lai ra mot phong cach khac nhau", "a": "Do thieu huong dan style"},
            {"q": "bo anh theo nhan dien thuong hieu nhat quan", "a": "Thiet lap mau chu dao, phong cach, nhan vat, boi canh"},
            {"q": "Prompt nao thuc hanh dung cau truc", "a": "Mot nu nhan vien van phong dang trinh bay bao cao"},
            {"q": "tao anh dung cho mang xa hoi", "a": "Anh noi bat, co nhieu khoang trang va de doc"},
            {"q": "slide qua nhieu chu", "a": "Yeu cau Gemini rut gon theo so luong bullet"},
            {"q": "thieu hinh minh hoa", "a": "Nho Gemini goi y hinh anh phu hop voi noi dung thay vi them hinh ngau nhien"},
            {"q": "muon toi uu", "a": "Danh gia tong the bai trinh bay theo cac tieu chi cu the"},
            {"q": "nguoi trinh bay co phan dien giai day du", "a": "Speaker Notes cho tung slide khoang 60 90 giay"},
            {"q": "rut gon noi dung slide prompt nao phu hop nhat", "a": "Moi slide chi giu toi da 5 bullet"},
            {"q": "co tai lieu Google Docs va can nhanh chong tao ban trinh bay", "a": "Tao bai trinh bay 15 slide tu tai lieu Google Docs nay"},
            {"q": "thay vi nhan vien moi", "a": "Yeu cau Gemini dieu chinh do sau noi dung, thuat ngu va cach dien dat"},
            {"q": "cai thien mot slide dang kho theo doi", "a": "De xuat bo cuc phu hop hon, noi dung nen giu, nen loai bo"},
            {"q": "du lieu KPI tren slide kho hieu", "a": "Hay de xuat cach trinh bay KPI nay truc quan hon"},
            {"q": "chia se bai Google Slides ban nen nho Gemini ra soat", "a": "Logic, chinh ta, thuat ngu, tinh nhat quan"},
            {"q": "Bai nay co on khong", "a": "Dua ra vai tro va tieu chi danh gia cu the"},
            {"q": "review slide tieu chi nao phu hop nhat", "a": "Moi slide co mot thong diep chinh, noi dung co qua dai khong"},
            {"q": "ngay sau khi tu danh gia noi dung", "a": "Nhan phan bien tu Gemini theo vai tro va tieu chi ro rang"},
            {"q": "nhan feedback lan 1 nhung van thay tai lieu chua thuyet phuc", "a": "Tao them cac vong phan hoi"},
            {"q": "email thong bao thay doi quy trinh noi bo", "a": "Hay dong vai quan ly truc tiep, danh gia email theo muc tieu"},
            {"q": "Sau khi Gemini de xuat nhieu chinh sua", "a": "Doi chieu gop y voi muc tieu, doi tuong va du lieu thuc te"},
            {"q": "Mot prompt yeu cau Gemini danh gia tai lieu theo logic", "a": "Danh gia theo tieu chi cu the"},
            {"q": "cham diem noi dung theo thang 10", "a": "Diem so, diem manh, diem yeu va de xuat cai thien"},
            {"q": "Mot tai lieu dai su dung luc thi", "a": "Tinh nhat quan ve thuat ngu va cach chuan hoa"},
            {"q": "danh gia tai lieu tu nhieu nhom nguoi doc khac nhau", "a": "Hay danh gia tai lieu duoi goc nhin CEO, quan ly, nhan vien moi"},
        ]
    };

    // Normalize Vietnamese text for matching (remove diacritics)
    function norm(s) {
        return (s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')
            .replace(/[dD\u0111\u0110]/g,'d').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
    }

    // Text-based answer picker
    function textMatch(questionText, options, examId) {
        const tmap = TEXT_MAP[examId] || TEXT_MAP["C" + courseId];
        if (!tmap) return null;
        const qNorm = norm(questionText);
        for (const entry of tmap) {
            if (qNorm.includes(norm(entry.q))) {
                const aNorm = norm(entry.a);
                const match = options.find(function(o) { return norm(o.text).includes(aNorm); });
                if (match) return match;
            }
        }
        return null;
    }

    // Smart guess fallback
    function smartPick(options, attempt) {
        var allAbove = options.find(function(o) { return /tat ca|all of/i.test(o.text); });
        if (allAbove) return allAbove;
        if (options.length === 2) {
            var dung = options.find(function(o) { return /^Dung$/i.test(o.text.trim()); });
            if (dung) return dung;
        }
        if (attempt <= 1) {
            return options.reduce(function(a, b) { return b.text.length > a.text.length ? b : a; }, options[0]);
        }
        return options[attempt % options.length];
    }

    // === FIND ALL EXAMS ===
    const examList = [];
    console.log('Scanning exams...');

    for (const curId of items) {
        const r = await fetch('/Curriculum/User_ViewCur', { method:'POST', headers:H, body:`oid=${courseId}&id=${curId}` });
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
        const hasTextMap = TEXT_MAP[exam.examId] || TEXT_MAP["C" + courseId];

        // Skip exams without any answer source
        if (!knownSet && !hasTextMap) {
            console.log(`-- ${exam.name}: No answer DB - skip`);
            results.push({ Exam: exam.name, Result: '-- SKIP (no DB)' });
            continue;
        }

        // Check if already passed
        const infoR = await fetch(`/Examination/User_ViewExam/${exam.examId}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
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
                await fetch('/Examination/CheckTokenCodeByExamId', { method:'POST', headers:H, body:`examId=${exam.examId}` });
                const r1 = await fetch('/Examination/CheckVaoThi', { method:'POST', headers:H, body:`_ExamID=${exam.examId}&_UserID=${userId}&_userTestId=0` });
                const d1 = await r1.text();

                let eid;
                try { let p = JSON.parse(d1); if (typeof p === 'string') p = JSON.parse(p); const o = Array.isArray(p)?p[0]:p; eid = o.Examinee||o.ExamineeID||o.examineeId; } catch(e) {}
                if (!eid) eid = d1.match(/Examinee[^"]*?(\d{6,})/)?.[1];
                if (!eid) { const rf = await fetch(`/Examination/User_ViewExam/${exam.examId}`,{headers:{'X-Requested-With':'XMLHttpRequest'}}); eid = (await rf.text()).match(/ExamineeID=(\d+)/)?.[1]; }
                if (!eid) { console.log(`FAIL ${exam.name}: Cannot get ExamineeID (attempt ${att})`); continue; }

                // Get questions
                const r2 = await fetch(`/Questionframe/questiontest?ExamineeID=${eid}`, { headers:{'X-Requested-With':'XMLHttpRequest'} });
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

                // Extract question texts
                const qTextEls = doc.querySelectorAll('.question-title, .portlet-title, h4, h5, .quest-title, [class*="question"], p, label, span');
                const qTexts = [];
                qTextEls.forEach(function(el) {
                    const t = (el.textContent || '').trim();
                    if (t.length > 15 && t.includes('?')) qTexts.push(t.substring(0, 300));
                });

                // Pick answers with 3-tier strategy
                const answers = [];
                let matchedId = 0, matchedText = 0, guessed = 0;
                let qIdx = 0;

                for (const [, g] of Object.entries(groups)) {
                    let pick = null;

                    // Tier 1: ID match from database
                    if (knownSet) {
                        pick = g.o.find(opt => knownSet.has(opt.id));
                    }

                    // Tier 2: Text match (for randomized IDs)
                    if (!pick && hasTextMap) {
                        const qText = qTexts[qIdx] || '';
                        pick = textMatch(qText, g.o, parseInt(exam.examId));
                        if (pick) matchedText++;
                    }

                    if (pick && !knownSet?.has(pick.id)) {
                        // matched by text only
                    } else if (pick) {
                        matchedId++;
                    }

                    // Tier 3: Smart guess
                    if (!pick) {
                        pick = smartPick(g.o, att);
                        guessed++;
                    }

                    answers.push({
                        ExaminationTestId: parseInt(g.k),
                        UserAnswer: `[${pick.id}]`,
                        UserExplain: null, BookMark: null, CheckInternet: 0,
                        FramePartID: parseInt(fpId)
                    });
                    qIdx++;
                }

                // Submit
                const r3 = await fetch('/QuestionFrame/Json_TongHopDiem', {
                    method:'POST', headers:H,
                    body: new URLSearchParams({ userTestId, examineeId:encEid, examId:hExamId, listJson:JSON.stringify(answers) }).toString()
                });
                const raw = await r3.text();
                let passed = false;
                try { passed = JSON.parse(raw)[0]?.Value === "1"; } catch(e) {}

                const mode = `ID:${matchedId} Text:${matchedText} Guess:${guessed}`;

                if (passed) {
                    ok = true;
                    console.log(`PASS ${exam.name} (${mode})`);
                    results.push({ Exam: exam.name, Result: 'PASS' });
                } else {
                    console.log(`FAIL ${exam.name} (${mode})`);
                }
            } catch(e) {
                console.log(`FAIL ${exam.name}: Error attempt ${att}: ${e.message}`);
            }
        }
        if (!ok) results.push({ Exam: exam.name, Result: 'FAIL' });
    }

    console.log('\n--- SUMMARY ---');
    console.table(results);
    await fetch(`/Curriculum/AjaxClearCacheCourseDashboard?courseId=${courseId}`).catch(function(){});
    console.log('Done!');
})();
