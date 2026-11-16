(function () {
  const money = value => new Intl.NumberFormat('vi-VN').format(Number(value) || 0) + 'đ';
  const coverUrl = url => String(url || '').replace('https://cdn.akamai.steamstatic.com/steam/apps/', 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/');
  function node(tag, cls, text) { const e=document.createElement(tag); if(cls)e.className=cls; if(text!=null)e.textContent=text; return e; }
  function gameCard(game, compact) {
    const article=node('article',compact?'vault-card rounded-2xl overflow-hidden flex flex-col group':'game-card card overflow-hidden group flex flex-col');
    const link=node('a','relative block aspect-[3/4] overflow-hidden bg-black/30');link.href='detail.html?slug='+encodeURIComponent(game.slug);link.setAttribute('aria-label','Xem chi tiết '+game.title);
    const image=node('img','absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105');image.src=coverUrl(game.cover_url);image.alt='Ảnh bìa '+game.title;image.loading='lazy';image.onerror=()=>{image.remove();link.classList.add('grid','place-items-center','cover-fallback');link.appendChild(node('span','text-center p-5 text-brand-light font-bold',game.title));};link.appendChild(image);
    const body=node('div',(compact?'p-4':'p-4 sm:p-5')+' flex flex-col flex-1 bg-dark-surface border-t border-dark-border');
    const formats=node('div','flex flex-wrap gap-1.5');String(game.available_formats||game.product_type).split(',').forEach(function(type){if(type==='digital'||type==='physical')formats.appendChild(node('span','chip '+(type==='digital'?'dg':'ph'),type==='digital'?'KỸ THUẬT SỐ':'VẬT LÝ'));});body.appendChild(formats);
    const title=node('a','mt-3 text-lg font-bold text-white hover:text-brand-light transition-colors',game.title);title.href='detail.html?slug='+encodeURIComponent(game.slug);body.appendChild(title);
    body.appendChild(node('p','mt-1 text-xs text-outline',[(game.genre||'Game'),game.platform].filter(Boolean).join(' · ')));
    if(game.product_type==='physical')body.appendChild(node('p','mt-2 text-xs '+(game.available_stock>0?'text-emerald-300':'text-amber-300'),game.available_stock>0?'Tồn kho mẫu: '+game.available_stock:'Tạm hết hàng'));
    const bottom=node('div','mt-auto pt-4 flex items-center justify-between gap-3');
    const prices=node('div','flex flex-col');if(game.original_price&&Number(game.original_price)>Number(game.price))prices.appendChild(node('del','text-xs text-outline',money(game.original_price)));
    prices.appendChild(node('strong','text-lg font-black text-primary-container',money(game.price)));bottom.appendChild(prices);
    const add=node('button','btn !px-3 !py-2');add.type='button';add.dataset.add='';add.dataset.name=game.title;add.dataset.kind=game.product_type;add.dataset.id=game.id;add.dataset.price=Number(game.price)/25000;add.disabled=game.product_type==='physical'&&game.available_stock===0;add.title='Thêm vào giỏ hàng';add.appendChild(node('i','fa-solid fa-cart-plus'));bottom.appendChild(add);body.appendChild(bottom);article.append(link,body);return article;
  }
  function renderGrid(container, products, compact) { container.replaceChildren(...products.map(p=>gameCard(p,compact))); }
  async function loadGrid(id, type, compact) {
    const box=document.getElementById(id);if(!box)return;
    box.replaceChildren(node('p','text-outline col-span-full py-10 text-center','Đang tải danh mục…'));
    try {const data=await G5.api('/products?limit=100'+(type?'&type='+type:''));const products=data.products||[];if(!products.length){box.replaceChildren(node('p','text-outline col-span-full py-10 text-center','Chưa có game trong danh mục.'));return;}renderGrid(box,products,compact);}
    catch {box.replaceChildren(node('p','text-amber-200 col-span-full py-10 text-center','Không tải được catalog. Hãy khởi động API và MySQL rồi thử tải lại.'));}
  }
  window.G5Catalog={loadGrid,renderGrid,gameCard,money};
  document.addEventListener('DOMContentLoaded',()=>{
    loadGrid('home-games-grid',null,true);
    loadGrid('digital-games-grid','digital',false);
    loadGrid('physical-games-grid','physical',false);
  });
})();
