(function () {
  const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat('vi-VN').format(Number(n)||0)+'đ';
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
  function line(parent,label,value){const row=el('div','flex justify-between gap-4 border-b border-white/10 py-3');row.append(el('span','text-outline',label),el('span','text-right font-semibold text-white',value||'Đang cập nhật'));parent.appendChild(row);}
  function reqList(data){const list=el('ul','space-y-2 text-sm text-gray-300');for(const [k,v] of Object.entries(data||{})){const li=el('li');li.append(el('strong','text-white',k+': '),document.createTextNode(String(v)));list.appendChild(li);}return list;}
  // Form viet danh gia (can dang nhap va backend dang chay)
  function reviewForm(p,list){
    const box=el('div','card p-5 mt-5');box.id='review-form';
    if(!G5.user()){box.append(el('p','text-sm text-outline','Đăng nhập để viết đánh giá cho game này.'));list.insertAdjacentElement('afterend',box);return;}
    let score=5;
    box.append(el('h3','font-bold text-white mb-3','Viết đánh giá của bạn'));
    const stars=el('div','text-2xl mb-3 cursor-pointer select-none');
    const draw=()=>{stars.replaceChildren(...[1,2,3,4,5].map(i=>{const s=el('span',i<=score?'text-yellow-400':'text-gray-600','★');s.onclick=()=>{score=i;draw();};return s;}));};draw();
    const title=el('input','inp w-full mb-2 text-sm');title.placeholder='Tiêu đề (không bắt buộc)';title.maxLength=180;
    const body=el('textarea','inp w-full text-sm');body.rows=3;body.placeholder='Cảm nhận của bạn về game...';
    const send=el('button','btn mt-3','Gửi đánh giá');const note=el('p','text-sm mt-2 text-outline');
    send.onclick=async()=>{
      if(body.value.trim().length<3){note.textContent='Nội dung tối thiểu 3 ký tự.';return;}
      send.disabled=true;
      try{const res=await G5.api('/products/'+p.id+'/reviews',{method:'POST',body:{rating:score,title:title.value.trim(),body:body.value.trim()}});
        note.textContent='Đã gửi đánh giá'+(res.verifiedPurchase?' (đã xác minh mua hàng)':'')+'. Đang tải lại...';setTimeout(()=>location.reload(),800);}
      catch(err){note.textContent=G5.errorText(err);}finally{send.disabled=false;}
    };
    box.append(stars,title,body,send,note);list.insertAdjacentElement('afterend',box);
  }
  // ===== Khoi dac ta ban vat ly (chi hien khi dang xem phien ban "Vat ly") =====
  function physicalSpecs(){
    const box=el('div','mt-5 rounded-2xl border border-brand/40 bg-gradient-to-br from-brand/15 via-white/[0.03] to-transparent p-4');box.id='physical-specs';
    const head=el('p','flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-light');head.innerHTML='<i class="fa-solid fa-compact-disc"></i>';head.append(document.createTextNode('Đặc tả bản vật lý'));
    const list=el('dl','mt-3 space-y-3 text-sm');
    const row=(icon,k,v,parent)=>{const r=el('div','flex gap-3 min-w-0');const ic=el('i','fa-solid '+icon+' mt-1 w-4 shrink-0 text-center text-brand-light/80');const w=el('div','min-w-0');w.append(el('dt','text-xs text-outline',k),el('dd','font-semibold text-white leading-snug',v));r.append(ic,w);parent.appendChild(r);};
    row('fa-certificate','Tình trạng','Nguyên Seal (Brand New 100%)',list);
    row('fa-box-open','Định dạng đóng gói','Hộp đĩa Blu-ray PS5 tiêu chuẩn (kèm bìa lót & booklet)',list);
    const pair=el('div','grid gap-3 sm:grid-cols-[auto_1fr] sm:gap-6 border-t border-white/10 pt-3');
    row('fa-weight-hanging','Trọng lượng','180g',pair);row('fa-truck-fast','Vận chuyển','Giao tiêu chuẩn (2-3 ngày) hoặc Hỏa tốc nội thành',pair);
    list.appendChild(pair);box.append(head,list);return box;
  }

  // ===== Trinh xem Trailer & Anh chup ngay tren 5GUYS (khong dieu huong sang Steam) =====
  const STEAM_CDN='https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/';
  function steamAppId(p){const src=[p.cover_url].concat((p.media||[]).map(m=>m.media_url)).join(' ');const m=src.match(/\/apps?\/(\d{3,})(?:\/|\s|$)/);return m?m[1]:null;}
  let hlsLoader=null;
  function loadHls(){if(window.Hls)return Promise.resolve(window.Hls);return hlsLoader||(hlsLoader=new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js';s.onload=()=>res(window.Hls);s.onerror=rej;document.head.appendChild(s);}));}
  function createGalleryModal(title){
    let list=[],idx=0,hls=null;
    const ov=el('div','fixed inset-0 z-[100] hidden items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-6');ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-label','Trailer và ảnh chụp '+title);
    const panel=el('div','w-full max-w-5xl overflow-hidden rounded-3xl border border-brand/40 bg-[#0d0914] shadow-[0_20px_60px_rgba(0,0,0,.7)]');
    const head=el('div','flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3');
    const ht=el('div','min-w-0'),name=el('p','truncate text-sm font-bold text-white'),count=el('p','text-xs text-outline');ht.append(name,count);
    const close=el('button','grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 text-gray-300 transition-colors hover:border-brand-light hover:text-white');close.type='button';close.setAttribute('aria-label','Đóng');close.innerHTML='<i class="fa-solid fa-xmark"></i>';head.append(ht,close);
    const stage=el('div','relative aspect-video max-h-[70vh] w-full bg-black');
    const navBtn=(icon,label,pos)=>{const b=el('button','absolute top-1/2 -translate-y-1/2 '+pos+' z-10 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/60 text-white transition-colors hover:bg-brand');b.type='button';b.setAttribute('aria-label',label);b.innerHTML='<i class="fa-solid '+icon+'"></i>';return b;};
    const prev=navBtn('fa-chevron-left','Trước','left-3'),next=navBtn('fa-chevron-right','Tiếp','right-3');
    const strip=el('div','flex gap-2 overflow-x-auto border-t border-white/10 p-3');
    panel.append(head,stage,strip);ov.appendChild(panel);document.body.appendChild(ov);
    const stopMedia=()=>{if(hls){hls.destroy();hls=null;}stage.querySelectorAll('video').forEach(v=>v.pause());};
    const failNote=text=>el('p','absolute inset-0 grid place-items-center p-6 text-center text-sm text-outline',text);
    function imageNode(item){const img=el('img','h-full w-full object-contain');img.src=item.src;img.alt=item.name;img.onerror=()=>img.replaceWith(failNote('Không tải được ảnh này.'));return img;}
    function videoNode(item){
      const v=el('video','h-full w-full bg-black');v.controls=true;v.autoplay=true;v.playsInline=true;if(item.poster)v.poster=item.poster;
      const fail=()=>{if(v.isConnected)v.replaceWith(failNote('Không phát được trailer này. Hãy thử trailer khác hoặc xem ảnh chụp.'));};
      if(item.mp4||item.webm){[[item.mp4,'video/mp4'],[item.webm,'video/webm']].filter(x=>x[0]).forEach(([src,type],i,arr)=>{const s=el('source');s.src=src;s.type=type;if(i===arr.length-1)s.addEventListener('error',fail);v.appendChild(s);});}
      else if(item.hls){if(v.canPlayType('application/vnd.apple.mpegurl')){v.src=item.hls;v.addEventListener('error',fail);}
        else loadHls().then(H=>{if(list[idx]!==item||ov.classList.contains('hidden'))return;if(!H||!H.isSupported())return fail();hls=new H();hls.on(H.Events.ERROR,(_,d)=>{if(d&&d.fatal)fail();});hls.loadSource(item.hls);hls.attachMedia(v);}).catch(fail);}
      return v;
    }
    function show(i){
      if(!list.length)return;idx=(i+list.length)%list.length;const item=list[idx];stopMedia();
      stage.replaceChildren(item.type==='video'?videoNode(item):imageNode(item),prev,next);
      prev.classList.toggle('hidden',list.length<2);next.classList.toggle('hidden',list.length<2);
      name.textContent=item.name;count.textContent=(item.type==='video'?'Trailer':'Ảnh chụp')+' · '+(idx+1)+' / '+list.length;
      [...strip.children].forEach((b,j)=>{const on=j===idx;b.style.borderColor=on?'#c77dff':'transparent';b.style.opacity=on?'1':'.6';b.setAttribute('aria-current',on?'true':'false');if(on)strip.scrollTo({left:b.offsetLeft-strip.clientWidth/2+b.clientWidth/2,behavior:'smooth'});});
    }
    function buildStrip(){strip.replaceChildren();list.forEach((item,j)=>{const b=el('button','relative h-14 w-24 shrink-0 overflow-hidden rounded-lg border-2 bg-black transition-opacity hover:!opacity-100');b.type='button';b.setAttribute('aria-label',item.name);if(item.thumb){const im=el('img','h-full w-full object-cover');im.src=item.thumb;im.alt='';im.loading='lazy';b.appendChild(im);}if(item.type==='video'){const ic=el('span','absolute inset-0 grid place-items-center bg-black/35 text-white');ic.innerHTML='<i class="fa-solid fa-circle-play text-lg"></i>';b.appendChild(ic);}b.onclick=()=>show(j);strip.appendChild(b);});strip.classList.toggle('hidden',list.length<2);}
    function open(items,start){list=items.slice();if(!list.length)return;buildStrip();ov.classList.remove('hidden');ov.classList.add('flex');document.body.style.overflow='hidden';show(start||0);close.focus();}
    function hide(){stopMedia();stage.replaceChildren();ov.classList.add('hidden');ov.classList.remove('flex');document.body.style.overflow='';}
    close.onclick=hide;ov.addEventListener('click',e=>{if(e.target===ov)hide();});prev.onclick=()=>show(idx-1);next.onclick=()=>show(idx+1);
    document.addEventListener('keydown',e=>{if(ov.classList.contains('hidden'))return;if(e.key==='Escape')hide();else if(e.target.tagName!=='VIDEO'&&e.key==='ArrowLeft')show(idx-1);else if(e.target.tagName!=='VIDEO'&&e.key==='ArrowRight')show(idx+1);});
    return {open};
  }
  function setupGallery(p){
    const appId=steamAppId(p),slot=$('#trailer-slot'),thumbs=$('#game-media'),gallery=createGalleryModal(p.title);
    let items=(p.media||[]).filter(x=>x.media_type==='screenshot').map(m=>({type:'image',src:m.media_url,thumb:m.media_url,name:m.caption||p.title}));
    if(appId)[['library_hero.jpg','Ảnh nền chính thức'],['header.jpg','Ảnh bìa ngang'],['capsule_616x353.jpg','Ảnh quảng bá']].forEach(([f,n])=>items.push({type:'image',src:STEAM_CDN+appId+'/'+f,thumb:STEAM_CDN+appId+'/'+f,name:n}));
    if(!items.length){slot.replaceChildren();return;}
    const launch=el('button','group relative mt-4 flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-brand/40 bg-dark-surface p-3 text-left transition-colors hover:border-brand-light');launch.type='button';
    const poster=el('span','relative grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl bg-black');
    const pimg=el('img','absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity group-hover:opacity-95');pimg.alt='';pimg.src=items.find(i=>i.name==='Ảnh bìa ngang')?.src||items[0].thumb;pimg.onerror=()=>pimg.remove();
    const play=el('span','relative grid h-9 w-9 place-items-center rounded-full bg-brand text-white shadow-[0_0_18px_rgba(157,78,221,.7)] transition-transform group-hover:scale-110');play.innerHTML='<i class="fa-solid fa-play ml-0.5 text-xs"></i>';poster.append(pimg,play);
    const text=el('span','min-w-0'),t2=el('span','mt-1 block text-xs text-outline','Đang tải thư viện media…');text.append(el('strong','block text-sm text-white','Xem Trailer & Ảnh chụp màn hình'),t2);
    launch.append(poster,text);launch.onclick=()=>gallery.open(items,0);slot.replaceChildren(launch);
    const renderThumbs=()=>{thumbs.replaceChildren();items.filter(i=>i.type==='image').slice(0,4).forEach(item=>{const b=el('button','group relative overflow-hidden rounded-2xl border border-white/10 transition-colors hover:border-brand-light');b.type='button';b.setAttribute('aria-label','Phóng to: '+item.name);const im=el('img','aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105');im.src=item.thumb;im.alt=item.name;im.loading='lazy';im.onerror=()=>b.remove();b.appendChild(im);b.onclick=()=>gallery.open(items,items.indexOf(item));thumbs.appendChild(b);});};
    const summary=()=>{const v=items.filter(i=>i.type==='video').length;t2.textContent=(v?v+' trailer · ':'')+(items.length-v)+' ảnh · Xem trực tiếp trên 5GUYS';};
    renderThumbs();summary();
    // Backend lay danh sach trailer/anh chinh thuc (proxy + cache), trinh duyet chi phat media tai cho
    G5.api('/products/'+encodeURIComponent(p.slug)+'/gallery').then(d=>{
      const vids=(d.movies||[]).filter(m=>m.mp4||m.webm||m.hls).map(m=>({type:'video',name:m.name||'Trailer',thumb:m.thumbnail,poster:m.thumbnail,mp4:m.mp4,webm:m.webm,hls:m.hls}));
      const shots=(d.screenshots||[]).map((s,i)=>({type:'image',src:s.full,thumb:s.thumb||s.full,name:'Ảnh chụp màn hình '+(i+1)}));
      if(vids.length||shots.length){items=vids.concat(shots.length?shots:items);renderThumbs();}
      summary();
    }).catch(summary);
  }
  async function init(){
    const slug=new URLSearchParams(location.search).get('slug'), root=$('#game-detail');
    if(!slug){root.replaceChildren(el('p','text-center py-20 text-outline','Thiếu mã game.'));return;}
    try {
      const {product:p}=await G5.api('/products/'+encodeURIComponent(slug));document.title=p.title+' | 5GUYS';
      $('#crumb-title').textContent=p.title;$('#game-title').textContent=p.title;$('#game-byline').textContent=[p.developer,p.publisher].filter(Boolean).join(' · ');
      const cover=$('#game-cover');cover.src=String(p.cover_url||'').replace('https://cdn.akamai.steamstatic.com/steam/apps/','https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/');cover.alt='Ảnh bìa '+p.title;cover.onerror=()=>{cover.classList.add('hidden');const fallback=$('#game-cover-fallback');fallback.textContent=p.title;fallback.classList.remove('hidden');};
      $('#game-description').textContent=p.description||'Thông tin game đang được cập nhật.';
      const formatBox=$('#game-formats'),formatOptions=formatBox.querySelector('div');
      if((p.formats||[]).length>1){formatBox.classList.remove('hidden');(p.formats||[]).forEach(function(f){const option=el('a','rounded-2xl border px-4 py-3 transition-colors '+(f.slug===p.slug?'border-brand bg-brand/15 text-white':'border-white/10 bg-white/5 text-gray-300 hover:border-brand/60'));option.href='detail.html?slug='+encodeURIComponent(f.slug);option.setAttribute('aria-current',f.slug===p.slug?'true':'false');const label=el('strong','block text-sm',f.product_type==='digital'?'Kỹ thuật số':'Vật lý');const meta=el('span','block mt-1 text-xs text-outline',(f.platform||'')+' · '+money(f.price)+(f.product_type==='physical'?' · Tồn kho mẫu: '+(f.available_stock||0):''));option.append(label,meta);formatOptions.appendChild(option);});}
      line($('#game-specs'),'Nhà phát triển',p.developer);line($('#game-specs'),'Nhà phát hành',p.publisher);line($('#game-specs'),'Thể loại',p.genre);line($('#game-specs'),'Ngày phát hành',p.release_date?new Date(p.release_date).toLocaleDateString('vi-VN',{timeZone:'UTC'}):'Đang cập nhật');line($('#game-specs'),'Nền tảng',[...new Set((p.formats||[]).map(f=>f.platform).filter(Boolean))].join(' · ')||p.platform);line($('#game-specs'),'Định dạng',[...new Set((p.formats||[]).map(f=>f.product_type))].map(t=>t==='digital'?'Kỹ thuật số':'Vật lý').join(' · ')|| (p.product_type==='digital'?'Kỹ thuật số':'Vật lý'));
      $('#game-price').textContent=money(p.price);if(p.original_price&&Number(p.original_price)>Number(p.price)){const old=$('#game-original-price');old.textContent=money(p.original_price);old.classList.remove('hidden');}
      const editions=$('#game-editions');(p.editions||[]).forEach(e=>{const row=el('div','rounded-xl border border-white/10 bg-white/5 p-3 flex justify-between gap-4');row.append(el('strong','text-white',e.edition_name),el('span','text-brand-light font-bold',money(e.price)));editions.appendChild(row);});if(!editions.children.length)editions.append(el('p','text-sm text-outline','Chưa có thông tin phiên bản.'));
      if(p.product_type==='physical')editions.insertAdjacentElement('afterend',physicalSpecs());
      if(p.product_type==='physical')$('#game-stock').textContent=p.available_stock>0?'Tồn kho mẫu: '+p.available_stock:'Tạm hết hàng';else $('#game-stock').textContent='Giao kỹ thuật số sau khi thanh toán';
      const add=$('#game-add');add.dataset.add='';add.dataset.name=p.title;add.dataset.kind=p.product_type;add.dataset.id=p.id;add.dataset.price=Number(p.price)/25000;add.disabled=p.product_type==='physical'&&p.available_stock===0;
      $('#buy-now').addEventListener('click',async()=>{if(add.disabled)return;if(!G5.user()){add.click();return;}try{await G5.add(p.title,p.product_type,Number(p.price)/25000,1,p.id);location.href='cart.html';}catch{G5.notify('Không thể thêm sản phẩm vào giỏ.');}});
      $('#favorite').addEventListener('click',()=>{const key='5guys_favorites',ids=JSON.parse(localStorage.getItem(key)||'[]'),on=ids.includes(p.slug);localStorage.setItem(key,JSON.stringify(on?ids.filter(x=>x!==p.slug):ids.concat(p.slug)));$('#favorite').textContent=on?'♡ Yêu thích':'♥ Đã yêu thích';});
      setupGallery(p);
      const r=$('#game-reviews');(p.reviews||[]).forEach(review=>{const card=el('article','card p-4');card.append(el('div','font-bold text-white',review.title||'Đánh giá'),el('p','text-sm text-outline mt-1',review.display_name+' · '+Number(review.rating).toFixed(1)+' ★'+(review.verified_purchase?' · ✔ Đã mua':'')),el('p','mt-3 text-gray-200',review.body));r.appendChild(card);});if(!r.children.length)r.append(el('p','text-outline','Chưa có đánh giá được duyệt.'));reviewForm(p,r);
      const requirements=p.requirements; if(requirements){$('#minimum-requirements').replaceChildren(reqList(requirements.minimum_requirements));$('#recommended-requirements').replaceChildren(reqList(requirements.recommended_requirements));}
      root.classList.remove('hidden');$('#detail-loading').classList.add('hidden');
    } catch {$('#detail-loading').textContent='Không tìm thấy game hoặc API chưa hoạt động. Hãy kiểm tra server rồi thử lại.';}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
