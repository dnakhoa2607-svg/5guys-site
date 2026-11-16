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
      if(p.product_type==='physical')$('#game-stock').textContent=p.available_stock>0?'Tồn kho mẫu: '+p.available_stock:'Tạm hết hàng';else $('#game-stock').textContent='Giao kỹ thuật số sau khi thanh toán';
      const add=$('#game-add');add.dataset.add='';add.dataset.name=p.title;add.dataset.kind=p.product_type;add.dataset.id=p.id;add.dataset.price=Number(p.price)/25000;add.disabled=p.product_type==='physical'&&p.available_stock===0;
      $('#buy-now').addEventListener('click',async()=>{if(add.disabled)return;if(!G5.user()){add.click();return;}try{await G5.add(p.title,p.product_type,Number(p.price)/25000,1,p.id);location.href='cart.html';}catch{G5.notify('Không thể thêm sản phẩm vào giỏ.');}});
      $('#favorite').addEventListener('click',()=>{const key='5guys_favorites',ids=JSON.parse(localStorage.getItem(key)||'[]'),on=ids.includes(p.slug);localStorage.setItem(key,JSON.stringify(on?ids.filter(x=>x!==p.slug):ids.concat(p.slug)));$('#favorite').textContent=on?'♡ Yêu thích':'♥ Đã yêu thích';});
      const media=$('#game-media');(p.media||[]).filter(x=>x.media_type==='screenshot').forEach(m=>{const img=el('img','w-full rounded-2xl border border-white/10');img.src=m.media_url;img.alt=m.caption||p.title;media.appendChild(img);});
      const trailer=(p.media||[]).find(x=>x.media_type==='trailer');if(trailer){const a=el('a','btn mt-4 inline-flex','Xem trailer và ảnh trên Steam');a.href=trailer.media_url;a.target='_blank';a.rel='noopener noreferrer';$('#trailer-slot').appendChild(a);}
      const r=$('#game-reviews');(p.reviews||[]).forEach(review=>{const card=el('article','card p-4');card.append(el('div','font-bold text-white',review.title||'Đánh giá'),el('p','text-sm text-outline mt-1',review.display_name+' · '+Number(review.rating).toFixed(1)+' ★'+(review.verified_purchase?' · ✔ Đã mua':'')),el('p','mt-3 text-gray-200',review.body));r.appendChild(card);});if(!r.children.length)r.append(el('p','text-outline','Chưa có đánh giá được duyệt.'));reviewForm(p,r);
      const requirements=p.requirements; if(requirements){$('#minimum-requirements').replaceChildren(reqList(requirements.minimum_requirements));$('#recommended-requirements').replaceChildren(reqList(requirements.recommended_requirements));}
      root.classList.remove('hidden');$('#detail-loading').classList.add('hidden');
    } catch {$('#detail-loading').textContent='Không tìm thấy game hoặc API chưa hoạt động. Hãy kiểm tra server rồi thử lại.';}
  }
  document.addEventListener('DOMContentLoaded',init);
})();
