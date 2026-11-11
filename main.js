import { createClient } from '@supabase/supabase-js';
import './style.css';

const env = import.meta.env;
const supabaseReady = Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
const supabase = supabaseReady
  ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
  : null;
const whatsapp = (env.VITE_WHATSAPP_NUMBER || '244933049775').replace(/\D/g, '');

let products = [];
let cart = [];
let currentUser = null;
let isAdmin = false;
let activeView = 'store';

const app = document.querySelector('#app');
const money = value => `${Number(value || 0).toLocaleString('pt-PT')} Kz`;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const placeholder = 'https://placehold.co/600x750/f2f0ec/252525?text=Xavier+Store';

function shell() {
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" id="homeLink"><span class="brand-mark">X</span><span>XAVIER <b>STORE</b><small>MODA & ACESSÓRIOS</small></span></a>
      <nav><button class="nav-link active" id="storeNav">Loja</button><button class="nav-link" id="cartNav">Carrinho <span id="cartCount">0</span></button><button class="nav-link" id="adminNav">${currentUser && isAdmin ? 'Administração' : 'Área privada'}</button></nav>
    </header>
    <main id="view"></main>
    <footer><b>XAVIER STORE</b><span>Moda • Huambo, Angola</span><a href="https://wa.me/${whatsapp}" target="_blank" rel="noreferrer">Falar pelo WhatsApp</a></footer>`;
  document.querySelector('#homeLink').onclick = e => { e.preventDefault(); showStore(); };
  document.querySelector('#storeNav').onclick = showStore;
  document.querySelector('#cartNav').onclick = showCart;
  document.querySelector('#adminNav').onclick = showAdmin;
  updateCartCount();
}

function updateCartCount() {
  const node = document.querySelector('#cartCount');
  if (node) node.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
}

async function loadProducts() {
  if (!supabase) {
    products = [];
    return;
  }
  const { data, error } = await supabase.from('products')
    .select('*').eq('active', true).order('created_at', { ascending: false });
  if (error) throw error;
  products = data || [];
}

function productCard(p) {
  return `<article class="product-card">
    <div class="product-image"><img src="${escapeHTML(p.image_url || placeholder)}" alt="${escapeHTML(p.name)}" onerror="this.src='${placeholder}'">
      ${p.stock <= 0 ? '<span class="sold">Esgotado</span>' : ''}
    </div>
    <div class="product-info"><div class="product-category">${escapeHTML(p.category || 'Colecção')}</div>
      <h3>${escapeHTML(p.name)}</h3><strong>${money(p.price)}</strong>
      <p>${escapeHTML(p.sizes || 'Tamanhos sob consulta')}</p>
      <button class="button dark add-button" data-id="${p.id}" ${p.stock <= 0 ? 'disabled' : ''}>${p.stock <= 0 ? 'Indisponível' : 'Adicionar ao carrinho'}</button>
    </div></article>`;
}

async function showStore() {
  activeView = 'store';
  shell();
  const view = document.querySelector('#view');
  view.innerHTML = `<section class="hero"><div><span class="eyebrow">A SUA LOJA DE MODA</span><h1>Vista-se com<br><i>identidade.</i></h1><p>Descubra as novidades da Xavier Store. Escolha os seus produtos e faça a encomenda pelo WhatsApp.</p><a href="#catalogo" class="button light">Ver catálogo</a></div><div class="hero-side"><span>X</span><small>XAVIER STORE · HUAMBO</small></div></section>
    <section class="catalog section" id="catalogo"><div class="section-heading"><div><span class="eyebrow">SELECÇÃO XAVIER</span><h2>Catálogo</h2></div><span id="productTotal" class="muted"></span></div>
    ${!supabaseReady ? '<div class="notice">A ligação à base de dados ainda não foi configurada. O catálogo ficará disponível depois da configuração do Supabase.</div>' : '<div id="productGrid" class="product-grid"><p class="muted">A carregar produtos…</p></div>'}</section>`;
  if (supabaseReady) {
    try {
      await loadProducts();
      document.querySelector('#productTotal').textContent = `${products.length} produto(s)`;
      document.querySelector('#productGrid').innerHTML = products.length
        ? products.map(productCard).join('')
        : '<div class="empty">Ainda não existem produtos publicados. Adicione produtos no painel de administração.</div>';
      document.querySelectorAll('.add-button').forEach(btn => btn.onclick = () => addToCart(btn.dataset.id));
    } catch (e) {
      document.querySelector('#productGrid').innerHTML = `<div class="notice">Não foi possível carregar o catálogo: ${escapeHTML(e.message)}</div>`;
    }
  }
}

function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const existing = cart.find(x => String(x.id) === String(id));
  if (existing) existing.qty += 1;
  else cart.push({ id: p.id, name: p.name, price: Number(p.price), qty: 1, size: '' });
  updateCartCount();
  toast('Produto adicionado ao carrinho.');
}

function toast(message) {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = message;
  document.body.append(el); setTimeout(() => el.remove(), 2400);
}

function showCart() {
  activeView = 'cart'; shell();
  const view = document.querySelector('#view');
  if (!cart.length) {
    view.innerHTML = `<section class="section narrow"><span class="eyebrow">A SUA SELECÇÃO</span><h1>Carrinho</h1><div class="empty">O carrinho está vazio.</div><button class="button dark" id="backStore">Voltar à loja</button></section>`;
    document.querySelector('#backStore').onclick = showStore; return;
  }
  view.innerHTML = `<section class="section narrow"><span class="eyebrow">A SUA SELECÇÃO</span><h1>Carrinho</h1>
    <div class="cart-list">${cart.map((item, i) => `<div class="cart-row"><div><b>${escapeHTML(item.name)}</b><small>${money(item.price)} / unidade</small></div><div class="quantity"><button data-minus="${i}">−</button><span>${item.qty}</span><button data-plus="${i}">+</button></div><strong>${money(item.price * item.qty)}</strong><button class="remove" data-remove="${i}" aria-label="Remover">×</button></div>`).join('')}</div>
    <div class="cart-total"><span>Total estimado</span><strong>${money(cart.reduce((s,x)=>s+x.price*x.qty,0))}</strong></div>
    <div class="form-grid"><label>O teu nome<input id="customerName" placeholder="Nome completo" required></label><label>Localidade / bairro<input id="customerArea" placeholder="Ex.: Huambo, São João" required></label><label class="full">Observações (opcional)<textarea id="customerNotes" placeholder="Tamanhos, cores ou outras indicações"></textarea></label></div>
    <button class="button green full-button" id="sendOrder">Enviar encomenda pelo WhatsApp</button><p class="hint">A encomenda será preparada numa mensagem. O pagamento e a entrega serão combinados directamente com a Xavier Store.</p></section>`;
  document.querySelectorAll('[data-minus]').forEach(b => b.onclick = () => { cart[+b.dataset.minus].qty = Math.max(1, cart[+b.dataset.minus].qty-1); showCart(); });
  document.querySelectorAll('[data-plus]').forEach(b => b.onclick = () => { cart[+b.dataset.plus].qty++; showCart(); });
  document.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => { cart.splice(+b.dataset.remove,1); showCart(); });
  document.querySelector('#sendOrder').onclick = sendOrder;
}

async function sendOrder() {
  const name = document.querySelector('#customerName').value.trim();
  const area = document.querySelector('#customerArea').value.trim();
  const notes = document.querySelector('#customerNotes').value.trim();
  if (!name || !area) return toast('Preencha o nome e a localidade.');
  const total = cart.reduce((s,x)=>s+x.price*x.qty,0);
  const order = { customer_name:name, customer_area:area, notes, items:cart, total, status:'nova' };
  if (supabase) {
    const { error } = await supabase.from('orders').insert(order);
    if (error) return toast(`Não foi possível registar a encomenda: ${error.message}`);
  } else {
    return toast('A aplicação ainda não está ligada à base de dados.');
  }
  const lines = cart.map(x => `• ${x.name} — ${x.qty} × ${money(x.price)} = ${money(x.qty*x.price)}`);
  const message = `Olá, Xavier Store. Quero fazer esta encomenda:\n\n${lines.join('\n')}\n\nTotal estimado: ${money(total)}\nNome: ${name}\nLocalidade: ${area}\nObservações: ${notes || 'Nenhuma'}\n\nAguardo confirmação de disponibilidade, entrega e pagamento.`;
  window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  cart = []; updateCartCount();
  toast('Encomenda registada. A abrir o WhatsApp…');
}

async function checkAdmin(user) {
  if (!user || !supabase) return false;
  const { data, error } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  return !error && data?.role === 'admin';
}

async function showAdmin() {
  activeView = 'admin'; shell();
  const view = document.querySelector('#view');
  if (!supabaseReady) {
    view.innerHTML = `<section class="section narrow"><h1>Área privada</h1><div class="notice">Configure primeiro a ligação ao Supabase. Consulte o ficheiro README incluído no projecto.</div></section>`;
    return;
  }
  const { data } = await supabase.auth.getSession();
  currentUser = data.session?.user || null;
  isAdmin = await checkAdmin(currentUser);
  shell();
  const target = document.querySelector('#view');
  if (!currentUser) {
    target.innerHTML = `<section class="section narrow"><span class="eyebrow">ACESSO RESTRITO</span><h1>Administração</h1><form id="loginForm" class="stack"><label>E-mail<input id="loginEmail" type="email" required placeholder="O teu e-mail"></label><label>Palavra-passe<input id="loginPassword" type="password" required placeholder="Palavra-passe"></label><button class="button dark">Entrar</button><p id="loginError" class="error"></p></form></section>`;
    document.querySelector('#loginForm').onsubmit = async e => {
      e.preventDefault();
      const { error } = await supabase.auth.signInWithPassword({ email:document.querySelector('#loginEmail').value, password:document.querySelector('#loginPassword').value });
      if (error) document.querySelector('#loginError').textContent = error.message;
      else showAdmin();
    };
    return;
  }
  if (!isAdmin) {
    target.innerHTML = `<section class="section narrow"><h1>Acesso sem permissões</h1><p>Esta conta não está autorizada a administrar a Xavier Store.</p><button class="button dark" id="logout">Terminar sessão</button></section>`;
    document.querySelector('#logout').onclick = async () => { await supabase.auth.signOut(); currentUser=null; showAdmin(); };
    return;
  }
  await loadAdmin();
}

async function loadAdmin() {
  const view = document.querySelector('#view');
  const [{ data: items }, { data: orders }] = await Promise.all([
    supabase.from('products').select('*').order('created_at',{ascending:false}),
    supabase.from('orders').select('*').order('created_at',{ascending:false}).limit(50)
  ]);
  const allProducts = items || [], allOrders = orders || [];
  view.innerHTML = `<section class="section admin-section"><div class="section-heading"><div><span class="eyebrow">PAINEL PRIVADO</span><h1>Administração</h1></div><button class="button outline" id="logout">Terminar sessão</button></div>
    <div class="stats"><div><small>Produtos</small><b>${allProducts.length}</b></div><div><small>Encomendas</small><b>${allOrders.length}</b></div><div><small>Novas</small><b>${allOrders.filter(o=>o.status==='nova').length}</b></div></div>
    <div class="admin-columns"><section class="admin-panel"><h2 id="productFormTitle">Adicionar produto</h2><form id="productForm" class="stack">
      <input type="hidden" id="productId"><label>Nome do produto<input id="pName" required placeholder="Ex.: Vestido feminino"></label>
      <div class="two"><label>Preço (Kz)<input id="pPrice" type="number" min="0" required></label><label>Stock<input id="pStock" type="number" min="0" value="1" required></label></div>
      <div class="two"><label>Categoria<input id="pCategory" placeholder="Vestidos, calças…"></label><label>Tamanhos<input id="pSizes" placeholder="S, M, L, XL"></label></div>
      <label>Endereço da fotografia<input id="pImage" type="url" placeholder="https://…"></label>
      <label class="check"><input id="pActive" type="checkbox" checked> Publicar na loja</label>
      <div class="two"><button class="button dark" id="saveProduct">Guardar produto</button><button class="button outline" type="button" id="clearForm">Limpar</button></div><p id="productError" class="error"></p>
    </form></section><section class="admin-panel"><h2>Produtos registados</h2><div class="admin-list">${allProducts.length ? allProducts.map(p=>`<div class="admin-item"><img src="${escapeHTML(p.image_url||placeholder)}" onerror="this.src='${placeholder}'"><div><b>${escapeHTML(p.name)}</b><small>${money(p.price)} · Stock: ${p.stock} · ${p.active?'Publicado':'Oculto'}</small></div><button class="mini" data-edit="${p.id}">Editar</button><button class="mini danger" data-delete="${p.id}">×</button></div>`).join('') : '<p class="muted">Ainda não há produtos.</p>'}</div></section></div>
    <section class="admin-panel orders-panel"><h2>Encomendas recentes</h2>${allOrders.length ? allOrders.map(o=>`<div class="order-item"><div><b>${escapeHTML(o.customer_name)}</b><small>${escapeHTML(o.customer_area)} · ${new Date(o.created_at).toLocaleString('pt-PT')}</small><small>${(o.items||[]).map(i=>`${escapeHTML(i.name)} × ${i.qty}`).join(' · ')}</small></div><strong>${money(o.total)}</strong><select data-status="${o.id}"><option value="nova" ${o.status==='nova'?'selected':''}>Nova</option><option value="confirmada" ${o.status==='confirmada'?'selected':''}>Confirmada</option><option value="em_entrega" ${o.status==='em_entrega'?'selected':''}>Em entrega</option><option value="concluida" ${o.status==='concluida'?'selected':''}>Concluída</option><option value="cancelada" ${o.status==='cancelada'?'selected':''}>Cancelada</option></select></div>`).join('') : '<p class="muted">Ainda não foram recebidas encomendas.</p>'}</section></section>`;
  document.querySelector('#logout').onclick = async () => { await supabase.auth.signOut(); currentUser=null; isAdmin=false; showAdmin(); };
  document.querySelector('#clearForm').onclick = clearProductForm;
  document.querySelector('#productForm').onsubmit = saveProduct;
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editProduct(allProducts.find(p=>String(p.id)===b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
  document.querySelectorAll('[data-status]').forEach(s=>s.onchange=async()=>{ const {error}=await supabase.from('orders').update({status:s.value}).eq('id',s.dataset.status); if(error) toast(error.message); else toast('Estado actualizado.'); });
}

function clearProductForm() {
  document.querySelector('#productForm').reset();
  document.querySelector('#productId').value='';
  document.querySelector('#pActive').checked=true;
  document.querySelector('#productFormTitle').textContent='Adicionar produto';
}
function editProduct(p) {
  if (!p) return;
  document.querySelector('#productId').value=p.id;
  document.querySelector('#pName').value=p.name;
  document.querySelector('#pPrice').value=p.price;
  document.querySelector('#pStock').value=p.stock;
  document.querySelector('#pCategory').value=p.category||'';
  document.querySelector('#pSizes').value=p.sizes||'';
  document.querySelector('#pImage').value=p.image_url||'';
  document.querySelector('#pActive').checked=p.active;
  document.querySelector('#productFormTitle').textContent='Editar produto';
  document.querySelector('#pName').scrollIntoView({behavior:'smooth',block:'center'});
}
async function saveProduct(e) {
  e.preventDefault();
  const id=document.querySelector('#productId').value;
  const record={name:document.querySelector('#pName').value.trim(),price:Number(document.querySelector('#pPrice').value),stock:Number(document.querySelector('#pStock').value),category:document.querySelector('#pCategory').value.trim(),sizes:document.querySelector('#pSizes').value.trim(),image_url:document.querySelector('#pImage').value.trim()||null,active:document.querySelector('#pActive').checked};
  const result=id ? await supabase.from('products').update(record).eq('id',id) : await supabase.from('products').insert(record);
  if(result.error) document.querySelector('#productError').textContent=result.error.message;
  else { toast('Produto guardado.'); await loadAdmin(); }
}
async function deleteProduct(id) {
  if (!confirm('Eliminar este produto?')) return;
  const {error}=await supabase.from('products').delete().eq('id',id);
  if(error) toast(error.message); else { toast('Produto eliminado.'); await loadAdmin(); }
}

supabase?.auth.onAuthStateChange((_event, session) => {
  currentUser=session?.user||null;
});
showStore();
