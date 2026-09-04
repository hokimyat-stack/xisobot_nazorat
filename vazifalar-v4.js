// Xisobot Nazorat V4 — Vazifalar markazi
(function () {
  'use strict';
  const HOLAT_NOMI = {
    kutilmoqda:'Yangi', korildi:'Ko‘rildi', jarayonda:'Jarayonda', tekshiruvda:'Tekshiruvda',
    bajarildi:'Bajarildi', tasdiqlandi:'Tasdiqlandi', qaytarildi:'Qaytarildi',
    muddat_otdi:'Muddati o‘tgan', bekor_qilindi:'Bekor qilingan'
  };
  const TURI_NOMI = {
    tasdiq:'Oddiy tasdiq', bir_martalik:'1 bosqichli',
    uch_bosqichli:'3 bosqichli', kop_bosqichli:'Ko‘p bosqichli'
  };
  function safe(v) {
    return typeof window.htmlQochir === 'function'
      ? window.htmlQochir(String(v == null ? '' : v))
      : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function attr(v) { return safe(v).replace(/`/g, '&#96;'); }
  function sana(v) {
    if (!v) return 'Muddatsiz';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? safe(v) : d.toLocaleString('uz-UZ', {
      timeZone:'Asia/Tashkent', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'
    });
  }
  function localDateValue(date) {
    const d = date instanceof Date ? date : new Date(date);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function holatKlass(h) {
    if (['bajarildi','tasdiqlandi'].includes(h)) return 'yashil';
    if (['muddat_otdi','qaytarildi','bekor_qilindi'].includes(h)) return 'qizil';
    if (h === 'tekshiruvda') return 'binafsha';
    if (h === 'jarayonda') return 'kok';
    return 'sariq';
  }

  function uniqueText(list) {
    return [...new Set((list || []).map(x => String(x || '').trim()).filter(Boolean))];
  }

  function initialsName(fio) {
    const p=String(fio||'').trim().split(/\s+/).filter(Boolean);
    return (p[0]?.[0]||'')+(p[1]?.[0]||'') || 'X';
  }

  function guruhKontekst(g) {
    const rows=Array.isArray(g?.xodimlar)?g.xodimlar:[];
    if(rows.length===1) {
      const v=rows[0]||{};
      return {
        turi:'Yakka xodim',
        nomi:v.xodim_fio||'Xodim',
        meta:[v.mfy_nomi,v.kategoriya_nomi].filter(Boolean).join(' · ')
      };
    }
    const mfys=uniqueText(rows.map(v=>v.mfy_nomi));
    const kats=uniqueText(rows.map(v=>v.kategoriya_nomi));
    if(mfys.length===1 && kats.length===1) return {turi:'Tashkilot / kategoriya',nomi:mfys[0]+' · '+kats[0],meta:rows.length+' nafar xodim'};
    if(mfys.length===1) return {turi:'Tashkilot',nomi:mfys[0],meta:rows.length+' nafar xodim'};
    if(kats.length===1) return {turi:'Kategoriya',nomi:kats[0],meta:rows.length+' nafar xodim'};
    return {turi:'Guruh vazifasi',nomi:rows.length+' nafar xodim',meta:(mfys.length?mfys.length+' tashkilot':'')+(mfys.length&&kats.length?' · ':'')+(kats.length?kats.length+' kategoriya':'')};
  }

  function taskImgSrc(url,size) {
    try { return typeof window.rasmURL==='function' ? window.rasmURL(url,size||600) : String(url||''); }
    catch(e) { return String(url||''); }
  }

  function taskImgFull(url) {
    try { return typeof window.rasmFullURL==='function' ? window.rasmFullURL(url) : String(url||''); }
    catch(e) { return String(url||''); }
  }

  function taskTime(v) {
    try { return typeof window.formatVaqt==='function' ? window.formatVaqt(v) : sana(v); }
    catch(e) { return sana(v); }
  }

  function taskStageHtml(nom, vaqt, tavsif, rasmlar, lat, lng) {
    if(!vaqt) return '<div class="taskReportStage empty"><div class="taskReportStageTitle"><span>'+safe(nom)+'</span><span class="mini kul">Yuklanmagan</span></div></div>';
    const list=Array.isArray(rasmlar)?rasmlar:[];
    const gallery=list.length?'<div class="taskReportGallery">'+list.map(r=>{
      const src=taskImgSrc(r,420),full=taskImgFull(r);
      return '<img src="'+attr(src)+'" data-full="'+attr(full)+'" onclick="zoom(this.dataset.full)" loading="lazy" alt="Hisobot rasmi">';
    }).join('')+'</div>':'';
    const gps=(lat!==null&&lat!==undefined&&lat!==''&&lng!==null&&lng!==undefined&&lng!=='')
      ? '<a class="taskReportGps" href="https://www.google.com/maps?q='+encodeURIComponent(lat+','+lng)+'" target="_blank" rel="noopener">GPS xaritada ochish</a>'
      : '';
    return '<div class="taskReportStage"><div class="taskReportStageTitle"><span>'+safe(nom)+'</span><span class="mini yashil">Yuklangan</span></div>'+
      '<div class="taskReportStageTime">'+safe(taskTime(vaqt))+'</div>'+
      '<div class="taskReportStageDesc">'+safe(tavsif||'Tavsif kiritilmagan')+'</div>'+gallery+gps+'</div>';
  }

  function taskHisobotHtml(h) {
    const isBirBosqichli=!h.d_vaqt && h.y_vaqt;
    let stages='';
    if(isBirBosqichli) {
      stages=taskStageHtml('Yakunlangan ish',h.y_vaqt||h.b_vaqt,h.y_tavsif||h.b_tavsif,(h.y_rasmlar&&h.y_rasmlar.length?h.y_rasmlar:h.b_rasmlar),h.y_lat??h.b_lat,h.y_lng??h.b_lng);
    } else {
      stages=
        taskStageHtml('1. Boshlandi',h.b_vaqt,h.b_tavsif,h.b_rasmlar,h.b_lat,h.b_lng)+
        taskStageHtml('2. Davom etmoqda',h.d_vaqt,h.d_tavsif,h.d_rasmlar,h.d_lat,h.d_lng)+
        taskStageHtml('3. Yakunlandi',h.y_vaqt,h.y_tavsif,h.y_rasmlar,h.y_lat,h.y_lng);
    }
    return '<div class="taskReportCard">'+
      '<div class="taskReportCardHead"><div><b>'+safe(h.ishNomi||h.ishTuri||'Vazifa hisoboti')+'</b><small>'+safe(h.sana||'')+' · '+safe(h.bosqich||'')+'</small></div>'+
      '<button class="mini kok" onclick="vazifaHisobotOch(\''+attr(h.id)+'\',\''+attr(h.xodimId)+'\')">To‘liq ochish</button></div>'+
      '<div class="taskReportStages">'+stages+'</div></div>';
  }

  window.vazifaHolatVariantlari = tanlangan => Object.entries(HOLAT_NOMI).map(([id,nom]) =>
    '<option value="'+id+'" '+(id===tanlangan?'selected':'')+'>'+nom+'</option>'
  ).join('');
  window.vazifaGuruhQator = function(g) {
    const foiz = g.jami ? Math.round(Number(g.bajarildi||0)/g.jami*100) : 0;
    const rowClass = g.ustuvorlik==='shoshilinch'?'taskUrgent':(g.ustuvorlik==='muhim'?'taskImportant':'');
    const k=guruhKontekst(g);
    const single=(g.xodimlar||[]).length===1;
    const identity=single
      ? '<div class="taskIdentity"><div class="taskIdentityTop"><span class="taskTargetChip">Yakka xodim</span><span class="taskAssigneeName">'+safe(k.nomi)+'</span></div><div class="taskTitle">'+safe(g.sarlavha)+'</div><div class="taskTargetMeta">'+safe(k.meta||'')+'</div><div class="taskDesc">'+safe((g.tavsif||'').slice(0,180))+'</div></div>'
      : '<div class="taskIdentity"><div class="taskIdentityTop"><span class="taskTargetChip">'+safe(k.turi)+'</span><span class="taskAssigneeName">'+safe(k.nomi)+'</span></div><div class="taskTitle">'+safe(g.sarlavha)+'</div><div class="taskTargetMeta">'+safe(k.meta||'')+'</div><div class="taskDesc">'+safe((g.tavsif||'').slice(0,180))+'</div></div>';
    return '<tr class="'+rowClass+' taskClickableRow" onclick="vazifaGuruhOch(\''+attr(g.guruhId)+'\')"><td>'+identity+
      '<div style="margin-top:7px"><span class="mini '+(g.ustuvorlik==='shoshilinch'?'qizil':g.ustuvorlik==='muhim'?'sariq':'kul')+'">'+safe(g.ustuvorlik||'oddiy')+'</span></div></td>'+
      '<td><span class="mini kok">'+safe(TURI_NOMI[g.bajarishTuri]||g.bajarishTuri)+'</span></td><td style="white-space:nowrap">'+sana(g.muddatAt)+'</td>'+
      '<td><b>'+Number(g.jami||0)+'</b> ta<br><small>'+safe(k.turi)+'</small></td>'+
      '<td><div class="taskProgress"><i style="width:'+foiz+'%"></i></div><small>'+foiz+'% · '+Number(g.jarayonda||0)+' jarayonda</small></td>'+
      '<td><span class="mini yashil">'+Number(g.bajarildi||0)+' bajarildi</span> '+(g.tekshiruvda?'<span class="mini binafsha">'+g.tekshiruvda+' tekshiruvda</span> ':'')+
      (g.muddatOtdi?'<span class="mini qizil">'+g.muddatOtdi+' kechikkan</span>':'')+'</td>'+
      '<td style="white-space:nowrap"><button class="mini kok" onclick="event.stopPropagation();vazifaGuruhOch(\''+attr(g.guruhId)+'\')">Ko‘rish</button> '+
      '<button class="mini binafsha" onclick="event.stopPropagation();vazifaGuruhTahrir(\''+attr(g.guruhId)+'\')">Tahrirlash</button> '+
      '<button class="mini kul" onclick="event.stopPropagation();vazifaGuruhMuddat(\''+attr(g.guruhId)+'\')">Muddat</button> '+
      '<button class="mini qizil" onclick="event.stopPropagation();vazifaBekorGuruh(\''+attr(g.guruhId)+'\')">Bekor qilish</button></td></tr>';
  };
  window.vazifaFiltrQolla = function() {
    window.vazifaFiltr = {
      q:(document.getElementById('vFQ')?.value||'').trim(),
      holat:document.getElementById('vFHolat')?.value||'',
      mfy:document.getElementById('vFMfy')?.value||'',
      kategoriya:document.getElementById('vFKat')?.value||''
    };
    window.bYukla();
  };
  window.vazifaFiltrTozala = function() { window.vazifaFiltr={q:'',holat:'',mfy:'',kategoriya:''}; window.bYukla(); };
  function selected(id) { return [...(document.getElementById(id)?.selectedOptions||[])].map(o=>o.value).filter(Boolean); }
  function targetPayload() {
    const uiTuri=document.getElementById('vTanlashTuri')?.value||'yakka';
    let xodimIdlar=selected('vXodimlar');
    if(uiTuri==='yakka') xodimIdlar=xodimIdlar.slice(0,1);
    return {
      tanlashTuri:['yakka','qolda'].includes(uiTuri)?'qolda':uiTuri,
      xodimIdlar, mfyIdlar:selected('vMfylar'), kategoriyaIdlar:selected('vKategoriyalar'),
      sababliHam:document.getElementById('vSababliHam')?.checked===true
    };
  }
  window.vazifaTargetKorinish = function() {
    const turi=document.getElementById('vTanlashTuri')?.value||'yakka';
    const x=document.getElementById('vXodimWrap'),m=document.getElementById('vMfyWrap'),k=document.getElementById('vKatWrap');
    if(x)x.style.display=['yakka','qolda'].includes(turi)?'block':'none';
    if(m)m.style.display=['tashkilot','kesishma'].includes(turi)?'block':'none';
    if(k)k.style.display=['kategoriya','kesishma'].includes(turi)?'block':'none';
    const xs=document.getElementById('vXodimlar'); if(xs)xs.multiple=turi!=='yakka';
    const info=document.getElementById('vPreview'); if(info)info.textContent='Qamrovni tekshirish tugmasini bosing.';
  };
  window.vazifaXodimQidir = function(q) {
    const sel = document.getElementById('vXodimlar');
    if (!sel) return;

    const needle = String(q || '').trim().toLocaleLowerCase('uz-UZ');
    const avvalTanlangan = new Set(
      [...(sel.selectedOptions || [])].map(o => String(o.value))
    );

    const barcha = window.xodimlar || [];
    const mos = barcha.filter(x => {
      const id = String(x.id || '');
      if (avvalTanlangan.has(id)) return true;

      if (!needle) return true;

      const haystack = [
        x.fio,
        x.pinfl,
        x.mfyNomi,
        x.kategoriyaNomi
      ].filter(Boolean).join(' ').toLocaleLowerCase('uz-UZ');

      return haystack.includes(needle);
    });

    sel.innerHTML = mos.map(x =>
      '<option value="' + attr(x.id) + '">' +
      safe(x.fio) + ' · ' +
      safe(x.mfyNomi || '') + ' · ' +
      safe(x.kategoriyaNomi || '') +
      '</option>'
    ).join('');

    let qaytaTanlandi = false;
    [...sel.options].forEach(o => {
      if (avvalTanlangan.has(String(o.value))) {
        o.selected = true;
        qaytaTanlandi = true;
      }
    });

    if (!qaytaTanlandi && avvalTanlangan.size === 0) {
      sel.selectedIndex = -1;
    }

    const count = document.getElementById('vXodimQidirSoni');
    if (count) {
      const haqiqiyMos = needle
        ? barcha.filter(x => {
            const haystack = [
              x.fio,
              x.pinfl,
              x.mfyNomi,
              x.kategoriyaNomi
            ].filter(Boolean).join(' ').toLocaleLowerCase('uz-UZ');
            return haystack.includes(needle);
          }).length
        : barcha.length;
      count.textContent = haqiqiyMos + ' ta xodim';
    }
  };

  window.vazifaTuriKorinish = function() {
    const box=document.getElementById('vBosqichlarWrap');
    if(box)box.style.display=document.getElementById('vBajarishTuri')?.value==='kop_bosqichli'?'block':'none';
  };
  async function shablonlarniOl() {
    const r=await window.api('vazifaShablonlar');
    window.vazifaShablonlar=r.ok?(r.shablonlar||[]):[];
    return window.vazifaShablonlar;
  }
  window.vazifaForma = async function() {
    if(!window.xodimlar?.length&&typeof window.xodimlarYukla==='function')await window.xodimlarYukla();
    window.vazifaIlovalar=[];
    const ertaga=new Date(Date.now()+86400000); ertaga.setHours(18,0,0,0);
    const form=document.getElementById('forma'); form.className='taskForm';
    form.innerHTML=`
      <div class="taskDetailHead"><div><h3>Yangi maxsus vazifa</h3><div class="izoh">Yakka xodim, tanlangan guruh, tashkilot yoki kategoriya bo‘yicha biriktiring.</div></div><button class="mini kul" onclick="formaYop()">Yopish</button></div>
      <div style="margin:14px 0;padding:14px;border-radius:14px;background:var(--binafsha-och);border:1px solid rgba(var(--binafsha-rgb),.22)">
        <label>Hisobchi AI orqali loyiha tayyorlash</label><div style="display:flex;gap:8px"><input id="vAiBuyruq" placeholder="Masalan: barcha IT xodimlariga juma kuni 17:00 gacha 3 bosqichli vazifa..."><button type="button" class="mini binafsha" onclick="vazifaAiTayyorla()">AI tayyorlasin</button></div>
        <div class="taskHint">AI o‘zi yubormaydi. Tayyorlangan ma’lumotlarni administrator tekshirib tasdiqlaydi.</div>
      </div>
      <div class="taskFormGrid">
        <div><label>Shablondan foydalanish</label><select id="vShablon" onchange="vazifaShablonQolla(this.value)"><option value="">— Shablonsiz —</option></select></div>
        <div><label>Ustuvorlik</label><select id="vUstuvorlik"><option value="oddiy">Oddiy</option><option value="muhim">Muhim</option><option value="shoshilinch">Shoshilinch</option></select></div>
        <div class="full"><label>Vazifa sarlavhasi *</label><input id="vSarlavha" maxlength="180" placeholder="Aniq va qisqa nom"></div>
        <div class="full"><label>To‘liq topshiriq *</label><textarea id="vTavsif" maxlength="5000" placeholder="Nima bajarilishi va qanday natija kutilishini yozing"></textarea></div>
        <div><label>Bajarish turi</label><select id="vBajarishTuri" onchange="vazifaTuriKorinish()"><option value="tasdiq">Oddiy tasdiqlash</option><option value="bir_martalik" selected>1 bosqichli hisobot</option><option value="uch_bosqichli">3 bosqichli hisobot</option><option value="kop_bosqichli">Ko‘p bosqichli uzoq muddatli</option></select></div>
        <div><label>Minimal rasm soni</label><input id="vMinRasm" type="number" min="0" max="10" value="1"></div>
        <div><label>Boshlanish vaqti</label><input id="vBoshlanish" type="datetime-local" value="${localDateValue(new Date())}"></div>
        <div><label>Yakuniy muddat</label><input id="vMuddat" type="datetime-local" value="${localDateValue(ertaga)}"></div>
        <div><label>GPS talabi</label><select id="vGps"><option value="true">Majburiy</option><option value="false">Talab qilinmaydi</option></select></div>
        <div><label>Administrator tasdig‘i</label><select id="vTasdiq"><option value="true">Talab qilinadi</option><option value="false">Avtomatik bajarildi</option></select></div>
        <div id="vBosqichlarWrap" class="full" style="display:none"><label>Maxsus bosqichlar — har satrda bittadan</label><textarea id="vBosqichlar" placeholder="1. Joyni o‘rganish&#10;2. Ishni bajarish&#10;3. Yakuniy natija"></textarea><div class="taskHint">Har bir bosqich uchun xodim alohida foto/GPS hisobot yuboradi.</div></div>
        <div class="full"><label>Kimlarga biriktiriladi</label><select id="vTanlashTuri" onchange="vazifaTargetKorinish()"><option value="yakka">Bitta xodim</option><option value="qolda">Bir nechta xodim</option><option value="tashkilot">Tashkilot bo‘yicha</option><option value="kategoriya">Kategoriya bo‘yicha</option><option value="kesishma">Tashkilot + kategoriya kesishmasi</option><option value="barchasi">Barcha faol xodimlar</option></select></div>
        <div class="full taskTargetGrid">
          <div id="vXodimWrap">
            <label>Xodimlar</label>
            <div class="taskXodimSearch">
              <div class="taskXodimSearchBox">
                <input id="vXodimQidir" type="search" autocomplete="off"
                  placeholder="F.I.Sh., PINFL, tashkilot yoki kategoriya bo‘yicha qidiring..."
                  oninput="vazifaXodimQidir(this.value)">
              </div>
              <div class="taskXodimSearchCount" id="vXodimQidirSoni">${(window.xodimlar||[]).length} ta xodim</div>
            </div>
            <select id="vXodimlar" size="7">${(window.xodimlar||[]).map(x=>'<option value="'+attr(x.id)+'">'+safe(x.fio)+' · '+safe(x.mfyNomi||'')+' · '+safe(x.kategoriyaNomi||'')+'</option>').join('')}</select>
          </div>
          <div id="vMfyWrap" style="display:none"><label>Tashkilotlar</label><select id="vMfylar" multiple size="7">${(window.mfylar||[]).map(m=>'<option value="'+attr(m.id)+'">'+safe(m.nomi)+'</option>').join('')}</select></div>
          <div id="vKatWrap" style="display:none"><label>Kategoriyalar</label><select id="vKategoriyalar" multiple size="7">${(window.kategoriyalar||[]).map(k=>'<option value="'+attr(k.id)+'">'+safe(k.nomi)+'</option>').join('')}</select></div>
        </div>
        <div class="full"><label><input id="vSababliHam" type="checkbox" style="width:auto"> Sababli/ta’til holatidagi faol xodimlarni ham qo‘shish</label></div>
        <div><label>Takrorlanish</label><select id="vTakror"><option value="yoq">Takrorlanmaydi</option><option value="kunlik">Har kuni</option><option value="haftalik">Har hafta</option><option value="oylik">Har oy</option></select></div>
        <div><label>Takrorlash oralig‘i</label><input id="vTakrorInterval" type="number" min="1" max="365" value="1"></div>
        <div class="full"><label>Qo‘shimcha fayllar (R2, 12 MB gacha)</label><input id="vFayllar" type="file" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" onchange="vazifaFaylTanla(this.files)"><div id="vFaylInfo" class="taskHint">Fayl biriktirilmagan</div></div>
        <div class="full"><label><input id="vShablonSaqlash" type="checkbox" style="width:auto"> Ushbu vazifani shablon sifatida ham saqlash</label></div>
      </div>
      <div id="vPreview" class="taskPreview" style="margin-top:14px">Qamrovni tekshirish tugmasini bosing.</div>
      <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;flex-wrap:wrap"><button type="button" onclick="vazifaNishonTekshir()">Qamrovni tekshirish</button><button id="vYuborBtn" type="button" class="qoshBtn" style="margin:0" onclick="vazifaYubor()">Vazifani biriktirish</button></div>`;
    document.getElementById('formaFon').style.display='flex';
    const templates=await shablonlarniOl(), sel=document.getElementById('vShablon');
    if(sel)sel.innerHTML='<option value="">— Shablonsiz —</option>'+templates.map(t=>'<option value="'+attr(t.id)+'">'+safe(t.nomi)+'</option>').join('');
  };
  window.vazifaShablonQolla = function(id) {
    const t=(window.vazifaShablonlar||[]).find(x=>String(x.id)===String(id)); if(!t)return;
    document.getElementById('vSarlavha').value=t.sarlavha||'';
    document.getElementById('vTavsif').value=t.tavsif||'';
    document.getElementById('vUstuvorlik').value=t.ustuvorlik||'oddiy';
    document.getElementById('vBajarishTuri').value=t.bajarish_turi||'bir_martalik';
    document.getElementById('vMinRasm').value=Number(t.min_rasm==null?1:t.min_rasm);
    document.getElementById('vGps').value=String(t.gps_talab!==false);
    document.getElementById('vTasdiq').value=String(t.tasdiq_talab!==false);
    document.getElementById('vBosqichlar').value=(t.bosqichlar||[]).map(b=>b.nomi+(b.tavsif?' — '+b.tavsif:'')).join('\n');
    window.vazifaTuriKorinish();
  };
  window.vazifaAiTayyorla = async function() {
    const buyruq=(document.getElementById('vAiBuyruq')?.value||'').trim();
    if(!buyruq)return window.toast('AI uchun vazifa mazmunini kiriting','xato');
    window.toast('AI vazifa loyihasini tayyorlamoqda...','info');
    const r=await window.apiPost('aiVazifaLoyiha',{buyruq});
    if(!r.ok)return window.toast(r.xato||'AI xatosi','xato');
    const t=r.loyiha||{};
    document.getElementById('vSarlavha').value=t.sarlavha||'';
    document.getElementById('vTavsif').value=t.tavsif||'';
    document.getElementById('vUstuvorlik').value=t.ustuvorlik||'oddiy';
    document.getElementById('vBajarishTuri').value=t.bajarishTuri||'bir_martalik';
    document.getElementById('vMinRasm').value=Number(t.minRasm==null?1:t.minRasm);
    document.getElementById('vGps').value=String(t.gpsTalab!==false);
    document.getElementById('vTasdiq').value=String(t.tasdiqTalab!==false);
    document.getElementById('vBosqichlar').value=(t.bosqichlar||[]).map(b=>b.nomi+(b.tavsif?' — '+b.tavsif:'')).join('\n');
    window.vazifaTuriKorinish(); window.toast('AI loyihasi tayyor. Tekshirib, qamrovni tanlang.');
  };
  function fileBase64(file) {
    return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||'').split(',').pop());r.onerror=reject;r.readAsDataURL(file);});
  }
  window.vazifaFaylTanla = async function(files) {
    const list=[...(files||[])].slice(0,10),info=document.getElementById('vFaylInfo'); if(!list.length)return;
    if(info)info.textContent='Fayllar yuklanmoqda...';
    for(const f of list){
      if(f.size>12*1024*1024){window.toast(f.name+' 12 MB dan katta','xato');continue;}
      const r=await window.apiPost('vazifaIlovaYukla',{base64:await fileBase64(f),nomi:f.name,turi:f.type||'application/octet-stream'});
      if(r.ok&&r.fayl)window.vazifaIlovalar.push(r.fayl);else window.toast((r.xato||'Fayl yuklanmadi')+': '+f.name,'xato');
    }
    if(info)info.textContent=window.vazifaIlovalar.length?window.vazifaIlovalar.map(f=>f.nomi).join(', '):'Fayl biriktirilmagan';
  };
  function bosqichlarOl() {
    return (document.getElementById('vBosqichlar')?.value||'').split('\n').map((line,i)=>{
      const p=line.split('—'),nomi=p.shift();
      return {nomi:nomi.replace(/^[0-9 .)-]+/,'').trim(),tavsif:p.join('—').trim(),tartib:i+1};
    }).filter(x=>x.nomi);
  }
  function vazifaPayload() {
    const b=document.getElementById('vBoshlanish')?.value,m=document.getElementById('vMuddat')?.value,t=document.getElementById('vTakror')?.value||'yoq';
    return {...targetPayload(),sarlavha:(document.getElementById('vSarlavha')?.value||'').trim(),tavsif:(document.getElementById('vTavsif')?.value||'').trim(),
      ustuvorlik:document.getElementById('vUstuvorlik')?.value||'oddiy',bajarishTuri:document.getElementById('vBajarishTuri')?.value||'bir_martalik',
      boshlanishAt:b?new Date(b).toISOString():null,muddatAt:m?new Date(m).toISOString():null,minRasm:Number(document.getElementById('vMinRasm')?.value||0),
      gpsTalab:document.getElementById('vGps')?.value!=='false',tasdiqTalab:document.getElementById('vTasdiq')?.value!=='false',
      bosqichlar:bosqichlarOl(),ilovalar:window.vazifaIlovalar||[],takrorlash:t==='yoq'?null:{turi:t,interval:Number(document.getElementById('vTakrorInterval')?.value||1)}};
  }
  window.vazifaNishonTekshir = async function() {
    const r=await window.apiPost('vazifaNishonlar',targetPayload()),info=document.getElementById('vPreview');
    if(!r.ok){if(info)info.textContent=r.xato||'Qamrov aniqlanmadi';return window.toast(r.xato||'Qamrov aniqlanmadi','xato');}
    const noms=(r.xodimlar||[]).slice(0,8).map(x=>x.fio).join(', ');
    if(info)info.innerHTML='<b>'+Number(r.soni||0)+' nafar xodim</b> biriktiriladi. '+safe(noms)+((r.soni||0)>8?' va boshqalar.':'');
  };
  window.vazifaYubor = async function() {
    const p=vazifaPayload(); if(!p.sarlavha||!p.tavsif)return window.toast('Sarlavha va topshiriq matnini kiriting','xato');
    if(p.bajarishTuri==='kop_bosqichli'&&p.bosqichlar.length<2)return window.toast('Kamida 2 ta bosqich kiriting','xato');
    const btn=document.getElementById('vYuborBtn');if(btn){btn.disabled=true;btn.textContent='Biriktirilmoqda...';}
    try{
      const r=await window.apiPost('vazifaGuruhQosh',p);if(!r.ok)return window.toast(r.xato||'Vazifa biriktirilmadi','xato');
      if(document.getElementById('vShablonSaqlash')?.checked)await window.apiPost('vazifaShablonSaqla',{nomi:p.sarlavha,sarlavha:p.sarlavha,tavsif:p.tavsif,ustuvorlik:p.ustuvorlik,bajarishTuri:p.bajarishTuri,minRasm:p.minRasm,gpsTalab:p.gpsTalab,tasdiqTalab:p.tasdiqTalab,bosqichlar:p.bosqichlar});
      window.formaYop();window.toast(r.biriktirildi+' nafar xodimga vazifa biriktirildi. Push: '+r.pushYuborildi);window.bYukla();
    }finally{if(btn){btn.disabled=false;btn.textContent='Vazifani biriktirish';}}
  };
  window.vazifaGuruhOch = async function(guruhId) {
    const modal=document.getElementById('modal');
    modal.innerHTML=`
      <div class="mBosh">
        <div><h3 style="margin-bottom:0">Vazifa yuklanmoqda...</h3><div class="mSub">Guruh ma'lumotlari olinmoqda</div></div>
        <button class="yop" onclick="modalYop()">×</button>
      </div>
      <div class="mBody"><div class="yuklanmoqda" style="min-height:180px">Yuklanmoqda...</div></div>`;
    document.getElementById('modalFon').style.display='flex';

    const r=await window.api('vazifaGuruhDetail',{guruhId});
    if(!r.ok){
      window.modalYop();
      return window.toast(r.xato||'Vazifa ochilmadi','xato');
    }

    const rows=Array.isArray(r.vazifalar)?r.vazifalar:[];
    if(!rows.length){
      window.modalYop();
      return window.toast('Vazifa topilmadi','xato');
    }

    // Bitta xodim vazifasi: to'g'ridan-to'g'ri tezkor detail endpoint.
    if(rows.length===1) return window.vazifaXodimOch(rows[0].id);

    const first=rows[0];
    const g={
      guruhId,
      sarlavha:first.sarlavha||first.matn||'Vazifa',
      tavsif:first.tavsif||first.matn||'',
      muddatAt:first.muddatAt||first.muddat_at||first.muddat,
      jami:rows.length,
      bajarildi:0,
      tekshiruvda:0,
      muddatOtdi:0,
      jarayonda:0,
      xodimlar:rows
    };

    rows.forEach(v=>{
      const h=v.samaraliHolat||v.holat;
      if(h==='bajarildi'||h==='tasdiqlandi') g.bajarildi++;
      else if(h==='tekshiruvda') g.tekshiruvda++;
      else if(h==='muddat_otdi') g.muddatOtdi++;
      else if(h==='jarayonda'||h==='korildi') g.jarayonda++;
    });

    const reportCount=new Map(
      Object.entries(r.hisobotSoni||{}).map(([id,son])=>[String(id),Number(son||0)])
    );

    const k=guruhKontekst(g);
    modal.innerHTML=`
      <div class="mBosh">
        <div><h3 style="margin-bottom:0">${safe(g.sarlavha)}</h3><div class="mSub">${safe(k.turi)} · ${safe(k.nomi)} · ${sana(g.muddatAt)}</div></div>
        <button class="yop" onclick="modalYop()">×</button>
      </div>
      <div class="mBody">
        <div class="taskGroupInfo">
          <h4>Vazifa tavsifi</h4>
          <div style="white-space:pre-wrap;line-height:1.6">${safe(g.tavsif||'')}</div>
          <div class="taskEmployeeBadges">
            <span class="mini sirena">${safe(k.turi)}</span>
            <span class="mini kul">${safe(k.nomi)}</span>
            <span class="mini kok">${Number(g.jami||0)} xodim</span>
            <span class="mini yashil">${Number(g.bajarildi||0)} bajarildi</span>
            ${g.tekshiruvda?'<span class="mini binafsha">'+Number(g.tekshiruvda)+' tekshiruvda</span>':''}
            ${g.muddatOtdi?'<span class="mini qizil">'+Number(g.muddatOtdi)+' kechikkan</span>':''}
          </div>
        </div>
        <div class="taskReportSectionTitle"><h4>Biriktirilgan xodimlar</h4><span class="taskHint">Xodim ustiga bosing — uning vazifaga oid hisobotlari va rasmlari ochiladi.</span></div>
        <div class="taskMemberGrid">
          ${rows.map(v=>{
            const h=v.samaraliHolat||v.holat;
            const rc=reportCount.get(String(v.id))||0;
            return '<div class="taskMemberCard" onclick="vazifaXodimOch(\''+attr(v.id)+'\')">'+
              '<div class="taskMemberAvatar">'+safe(initialsName(v.xodim_fio||v.xodimFio))+'</div>'+
              '<div class="taskMemberBody"><b>'+safe(v.xodim_fio||v.xodimFio)+'</b>'+
              '<div class="taskMemberMeta">'+safe(v.mfy_nomi||v.mfyNomi||'—')+' · '+safe(v.kategoriya_nomi||v.kategoriyaNomi||'—')+'</div>'+
              '<div class="taskMemberFoot"><span class="mini '+holatKlass(h)+'">'+safe(HOLAT_NOMI[h]||h)+'</span>'+
              '<span class="mini kul">'+Number(v.bajarilganBosqich||0)+' / '+Number(v.jamiBosqich||0)+' bosqich</span>'+
              (v.muddat_sorovi_holat==='kutilmoqda'?'<span class="mini sariq">Muddat so‘rovi</span>':'')+
              '<span class="taskReportCount">'+rc+' ta hisobot</span></div></div></div>';
          }).join('')}
        </div>
      </div>`;
  };
  window.vazifaGuruhTahrir=async function(guruhId){
    const r=await window.api('vazifalar',{guruhId});if(!r.ok)return window.toast(r.xato||'Vazifa olinmadi','xato');
    const v=r.vazifalar?.[0];if(!v)return window.toast('Vazifa topilmadi','xato');
    const form=document.getElementById('forma');form.className='taskForm';form.innerHTML=`
      <div class="taskDetailHead"><div><h3>Vazifani tahrirlash</h3><div class="taskHint">Bajarish turi va bosqichlar xodimlar ish boshlagach o‘zgartirilmaydi.</div></div><button class="mini kul" onclick="formaYop()">Yopish</button></div>
      <label>Sarlavha *</label><input id="vEditTitle" maxlength="180" value="${attr(v.sarlavha||v.matn||'')}">
      <label>Topshiriq *</label><textarea id="vEditDesc" maxlength="5000" style="min-height:150px">${safe(v.tavsif||v.matn||'')}</textarea>
      <div class="taskFormGrid"><div><label>Ustuvorlik</label><select id="vEditPriority"><option value="oddiy" ${v.ustuvorlik==='oddiy'?'selected':''}>Oddiy</option><option value="muhim" ${v.ustuvorlik==='muhim'?'selected':''}>Muhim</option><option value="shoshilinch" ${v.ustuvorlik==='shoshilinch'?'selected':''}>Shoshilinch</option></select></div>
      <div><label>Yakuniy muddat</label><input id="vEditDue" type="datetime-local" value="${v.muddat_at?localDateValue(v.muddat_at):''}"></div>
      <div><label>Administrator tasdig‘i</label><select id="vEditApproval"><option value="true" ${v.tasdiq_talab!==false?'selected':''}>Talab qilinadi</option><option value="false" ${v.tasdiq_talab===false?'selected':''}>Avtomatik</option></select></div></div>
      <div class="fAmallar"><button class="bekorB" onclick="formaYop()">Bekor qilish</button><button class="saqlaB" id="vEditSave">Saqlash</button></div>`;
    document.getElementById('formaFon').style.display='flex';document.getElementById('vEditSave').onclick=async()=>{const s=(document.getElementById('vEditTitle').value||'').trim(),d=(document.getElementById('vEditDesc').value||'').trim(),due=document.getElementById('vEditDue').value;if(!s||!d)return window.toast('Sarlavha va topshiriq majburiy','xato');const rr=await window.apiPost('vazifaTahrir',{guruhId,sarlavha:s,tavsif:d,ustuvorlik:document.getElementById('vEditPriority').value,muddatAt:due?new Date(due).toISOString():null,tasdiqTalab:document.getElementById('vEditApproval').value!=='false'});if(!rr.ok)return window.toast(rr.xato||'Vazifa yangilanmadi','xato');window.formaYop();window.toast(rr.yangilandi+' ta birikma yangilandi');window.bYukla();};
  };
  window.vazifaXodimOch = async function(vazifaId) {
    const modal=document.getElementById('modal');

    // Modal darhol ochiladi — foydalanuvchi javob kelguncha bo'sh kutmaydi.
    modal.innerHTML=`
      <div class="mBosh">
        <div><h3 style="margin-bottom:0">Vazifa yuklanmoqda...</h3><div class="mSub">Hisobotlar va izohlar olinmoqda</div></div>
        <button class="yop" onclick="modalYop()">×</button>
      </div>
      <div class="mBody"><div class="yuklanmoqda" style="min-height:220px">Yuklanmoqda...</div></div>`;
    document.getElementById('modalFon').style.display='flex';

    // FAST PATH: 1 so'rov = vazifa + faqat shu vazifa hisobotlari + izohlar.
    const dr=await window.api('vazifaDetail',{vazifaId});
    if(!dr.ok){
      window.modalYop();
      return window.toast(dr.xato||'Vazifa topilmadi','xato');
    }

    const v=dr.vazifa;
    if(!v){
      window.modalYop();
      return window.toast('Vazifa topilmadi','xato');
    }

    const reports=Array.isArray(dr.hisobotlar)?dr.hisobotlar:[];
    reports.sort((a,b)=>new Date(b.b_vaqt||b.y_vaqt||0)-new Date(a.b_vaqt||a.y_vaqt||0));
    const izohlar=Array.isArray(dr.izohlar)?dr.izohlar:[];

    // "To'liq ochish" tugmasi reportlarni qayta yuklamaydi.
    window.joriyVazifaHisobotlar=reports;

    const h=v.samaraliHolat||v.holat;
    const bosqichlar=Array.isArray(v.bosqichlar)?v.bosqichlar:[];
    const ilovalar=Array.isArray(v.ilovalar)?v.ilovalar:[];

    modal.innerHTML=`
      <div class="mBosh">
        <div>
          <h3 style="margin-bottom:0">${safe(v.xodim_fio||v.xodimFio||'Xodim')}</h3>
          <div class="mSub">${safe(v.mfy_nomi||v.mfyNomi||'')} · ${safe(v.kategoriya_nomi||v.kategoriyaNomi||'')}</div>
        </div>
        <button class="yop" onclick="modalYop()">×</button>
      </div>
      <div class="mBody">
        <div class="taskEmployeeHero">
          <div class="taskEmployeeName">${safe(v.xodim_fio||v.xodimFio||'')}</div>
          <div class="taskEmployeeTitle">${safe(v.sarlavha||v.matn||'Vazifa')}</div>
          <div class="taskEmployeeDesc">${safe(v.tavsif||v.matn||'')}</div>
          <div class="taskEmployeeBadges">
            <span class="mini ${holatKlass(h)}">${safe(HOLAT_NOMI[h]||h)}</span>
            <span class="mini sirena">Muddat: ${sana(v.muddat_at||v.muddatAt||v.muddat)}</span>
            <span class="mini kok">${safe(TURI_NOMI[v.bajarish_turi||v.bajarishTuri]||v.bajarish_turi||v.bajarishTuri||'')}</span>
            <span class="mini kul">${reports.length} ta bog‘langan hisobot</span>
          </div>
        </div>

        ${v.qaytarish_izohi?'<div class="taskPreview" style="margin:14px 26px 0;background:var(--qizil-och);color:var(--qizil)"><b>Qaytarish izohi:</b> '+safe(v.qaytarish_izohi)+'</div>':''}

        ${v.muddat_sorovi_holat==='kutilmoqda'
          ? '<div class="taskPreview" style="margin:14px 26px 0;background:var(--sariq-och);color:var(--sariq)"><b>Muddat uzaytirish so‘rovi:</b> '+safe(v.muddat_sorovi||'Sabab ko‘rsatilmagan')+'</div>'
          : ''}

        <div class="taskReportSectionTitle">
          <h4>Mobil ilovadan kelgan ish hisobotlari</h4>
          <span class="taskHint">${reports.length ? reports.length+' ta hisobot topildi' : 'Hali vazifa bo‘yicha hisobot yuborilmagan'}</span>
        </div>
        <div class="taskReportList">
          ${reports.length?reports.map(taskHisobotHtml).join(''):'<div class="taskNoReports">Xodim mobil ilovada ushbu vazifa bo‘yicha ish yuborganda tavsiflar va rasmlar shu yerda avtomatik ko‘rinadi.</div>'}
        </div>

        <div class="taskEmployeeExtras">
          ${bosqichlar.length?'<h4>Vazifa bosqichlari</h4>'+bosqichlar.map(b=>'<div class="taskStep '+(['bajarildi','tasdiqlandi'].includes(b.holat)?'done':'')+'"><b>'+safe(b.tartib)+'.</b><div><b>'+safe(b.nomi)+'</b><div class="taskHint">'+safe(b.tavsif||'')+'</div><span class="mini '+holatKlass(b.holat)+'">'+safe(HOLAT_NOMI[b.holat]||b.holat)+'</span> '+(b.hisobotId?'<button class="mini kok" onclick="vazifaHisobotOch(\''+attr(b.hisobotId)+'\',\''+attr(v.xodim_id||v.xodimId)+'\')">Hisobotni ochish</button>':'')+'</div></div>').join(''):''}

          ${ilovalar.length?'<h4>Vazifaga biriktirilgan fayllar</h4>'+ilovalar.map(f=>'<a class="mini kok" href="'+attr(f.url)+'" target="_blank" rel="noopener">'+safe(f.nomi||'Fayl')+'</a> ').join(''):''}

          <h4>Vazifa izohlari</h4>
          <div>${izohlar.map(i=>'<div class="taskComment"><small>'+safe(i.muallif_fio)+' · '+safe(i.muallif_rol)+' · '+sana(i.created_at)+'</small>'+safe(i.matn)+'</div>').join('')||'<div class="taskHint">Hozircha izoh yo‘q.</div>'}</div>
          <div style="display:flex;gap:8px;margin-top:10px"><input id="vAdminIzoh" placeholder="Izoh yozing..." style="flex:1"><button class="mini kok" onclick="vazifaIzohYubor('${attr(v.id)}')">Yuborish</button></div>
        </div>

        <div class="taskEmployeeActions">
          ${v.muddat_sorovi_holat==='kutilmoqda'
            ? '<button class="mini sariq" onclick="vazifaMuddatSorovJavob(\''+attr(v.id)+'\',true)">Muddatni uzaytirish</button><button class="mini kul" onclick="vazifaMuddatSorovJavob(\''+attr(v.id)+'\',false)">So‘rovni rad etish</button>'
            : ''}
          ${h==='tekshiruvda'
            ? '<button class="mini yashil" onclick="vazifaTasdiqla(\''+attr(v.id)+'\')">Vazifani tasdiqlash</button><button class="mini qizil" onclick="vazifaQaytar(\''+attr(v.id)+'\')">Qaytarish</button>'
            : ''}
          <button class="mini kul" onclick="vazifaShaxsiyMuddat('${attr(v.id)}')">Shaxsiy muddat</button>
        </div>
      </div>`;
  };
  window.vazifaHisobotOch=async function(hisobotId,xodimId){
    const cache=Array.isArray(window.joriyVazifaHisobotlar)?window.joriyVazifaHisobotlar:[];
    if(cache.some(h=>String(h.id)===String(hisobotId))){
      window.joriyHisobotlar=cache;
      return window.modalOch(hisobotId);
    }
    const r=await window.api('hisobotlar',{xodim:xodimId});
    if(!r.ok)return window.toast(r.xato||'Hisobot ochilmadi','xato');
    window.joriyHisobotlar=r.hisobotlar||[];
    window.modalOch(hisobotId);
  };
  window.vazifaIzohYubor=async function(id){const matn=(document.getElementById('vAdminIzoh')?.value||'').trim();if(!matn)return;const r=await window.apiPost('vazifaIzohQosh',{vazifaId:id,matn});if(!r.ok)return window.toast(r.xato||'Izoh yuborilmadi','xato');window.vazifaXodimOch(id);};
  window.vazifaTasdiqla=async function(id){const r=await window.apiPost('vazifaTasdiq',{vazifaId:id});if(!r.ok)return window.toast(r.xato||'Tasdiqlanmadi','xato');window.modalYop();window.toast('Vazifa tasdiqlandi');window.bYukla();};
  window.vazifaQaytar=function(id){window.glassPrompt('Qaytarish sababini yozing','',async izoh=>{if(!izoh)return;const r=await window.apiPost('vazifaQaytar',{vazifaId:id,izoh});if(!r.ok)return window.toast(r.xato||'Qaytarilmadi','xato');window.modalYop();window.toast('Vazifa xodimga qaytarildi');window.bYukla();});};
  window.vazifaBekorGuruh=function(id){window.glassPrompt('Guruh vazifasini bekor qilish sababi','',async sabab=>{if(!sabab)return;const r=await window.apiPost('vazifaBekor',{guruhId:id,sabab});if(!r.ok)return window.toast(r.xato||'Bekor qilinmadi','xato');window.toast(r.bekorQilindi+' ta birikma bekor qilindi');window.bYukla();});};
  function muddatPrompt(id,guruh){
    window.glassPrompt(guruh?'Yangi guruh muddati (YYYY-MM-DD HH:mm)':'Xodim uchun yangi muddat (YYYY-MM-DD HH:mm)','',async qiymat=>{
      if(!qiymat)return;const d=new Date(qiymat.replace(' ','T'));if(Number.isNaN(d.getTime()))return window.toast('Sana formati noto‘g‘ri','xato');
      const r=await window.apiPost('vazifaTahrir',guruh?{guruhId:id,muddatAt:d.toISOString()}:{vazifaId:id,muddatAt:d.toISOString()});
      if(!r.ok)return window.toast(r.xato||'Muddat yangilanmadi','xato');window.toast('Muddat yangilandi');if(guruh)window.bYukla();else window.vazifaXodimOch(id);
    });
  }
  window.vazifaGuruhMuddat=id=>muddatPrompt(id,true);window.vazifaShaxsiyMuddat=id=>muddatPrompt(id,false);
  window.vazifaMuddatSorovJavob=function(id,qabul){
    if(!qabul)return window.apiPost('vazifaMuddatJavob',{vazifaId:id,qabul:false}).then(r=>{if(r.ok){window.modalYop();window.toast('Muddat so‘rovi rad etildi');window.bYukla();}else window.toast(r.xato||'Xato','xato');});
    window.glassPrompt('Yangi muddat (YYYY-MM-DD HH:mm)','',async qiymat=>{if(!qiymat)return;const d=new Date(qiymat.replace(' ','T'));if(Number.isNaN(d.getTime()))return window.toast('Sana formati noto‘g‘ri','xato');const r=await window.apiPost('vazifaMuddatJavob',{vazifaId:id,qabul:true,yangiMuddatAt:d.toISOString()});if(!r.ok)return window.toast(r.xato||'Xato','xato');window.modalYop();window.toast('Muddat uzaytirildi');window.bYukla();});
  };
  window.vazifalarExcel=async function(){
    const f=window.vazifaFiltr||{},r=await window.api('vazifalar',{q:f.q||'',holat:f.holat||'',mfyId:f.mfy||'',kategoriyaId:f.kategoriya||''});if(!r.ok)return window.toast(r.xato||'Eksport xatosi','xato');
    const rows=(r.vazifalar||[]).map(v=>({'Vazifa':v.sarlavha||v.matn,'Xodim':v.xodim_fio,'Tashkilot':v.mfy_nomi,'Kategoriya':v.kategoriya_nomi,'Turi':TURI_NOMI[v.bajarish_turi]||v.bajarish_turi,'Ustuvorlik':v.ustuvorlik,'Holat':HOLAT_NOMI[v.samaraliHolat]||v.samaraliHolat,'Bosqich':Number(v.bajarilganBosqich||0)+'/'+Number(v.jamiBosqich||0),'Muddat':sana(v.muddat_at||v.muddat),'Yaratuvchi':v.yaratuvchi_fio}));
    const ws=XLSX.utils.json_to_sheet(rows),wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Vazifalar');XLSX.writeFile(wb,'Xisobot_Vazifalar_'+new Date().toISOString().slice(0,10)+'.xlsx');
  };
  window.vazifaShablonlarOch=async function(){
    const list=await shablonlarniOl();document.getElementById('modal').innerHTML=`<div class="taskDetailHead"><div><h3>Vazifa shablonlari</h3><div class="mSub">Yangi vazifa formasidan shablon yaratish mumkin.</div></div><button class="mini kul" onclick="modalYop()">Yopish</button></div><div style="overflow:auto;max-height:65vh"><table class="jadval"><tr><th>Nomi</th><th>Turi</th><th>Rasm/GPS</th><th>Amal</th></tr>${list.map(t=>'<tr><td><b>'+safe(t.nomi)+'</b><br><small>'+safe((t.tavsif||'').slice(0,120))+'</small></td><td>'+safe(TURI_NOMI[t.bajarish_turi]||t.bajarish_turi)+'</td><td>'+Number(t.min_rasm||0)+' rasm · '+(t.gps_talab!==false?'GPS':'GPSsiz')+'</td><td><button class="mini qizil" onclick="vazifaShablonOchir(\''+attr(t.id)+'\')">O‘chirish</button></td></tr>').join('')||'<tr><td colspan="4">Shablon yo‘q</td></tr>'}</table></div>`;document.getElementById('modalFon').style.display='flex';
  };
  window.vazifaShablonOchir=async function(id){const r=await window.apiPost('vazifaShablonOchir',{id});if(!r.ok)return window.toast(r.xato||'O‘chirilmadi','xato');window.toast('Shablon o‘chirildi');window.vazifaShablonlarOch();};
})();
