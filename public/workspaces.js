(function(){
  const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(Number(n)||0);
  const today = () => new Date().toISOString().slice(0,10);
  async function api(url, options={}) {
    const response=await fetch(url,{...options,headers:{"Content-Type":"application/json",...(options.headers||{})},credentials:"same-origin"});
    const data=await response.json().catch(()=>({}));
    if(!response.ok) throw new Error(data.error||"Request failed.");
    return data;
  }
  function page(id,title,subtitle,html){
    if(document.getElementById("workspace-"+id))return;
    const main=document.querySelector("#dashboardPage main, #dashboardPage .main-content"); if(!main)return;
    const s=document.createElement("section");s.id="workspace-"+id;s.className="content-section extended-workspace";s.hidden=true;
    s.innerHTML=`<div class="section-title"><div><span class="bi-eyebrow">BUSINESS OPERATIONS</span><h2>${title}</h2><p>${subtitle}</p></div></div><article class="bi-panel">${html}</article>`;
    main.appendChild(s);
  }
  function setupExtendedWorkspaces(){
    page("suppliers","Supplier payments","Track supplier bills, due dates and payments.",`
      <div class="extended-stats" id="supplierStats"></div>
      <h3>Add supplier</h3><form id="supplierForm" class="extended-form"><label>Supplier name<input name="name" required maxlength="120"></label><label>Phone<input name="phone" maxlength="40"></label><label>Notes<input name="notes" maxlength="500"></label><button class="bi-action-button bi-action-primary">Add supplier</button></form>
      <h3>Add bill</h3><form id="billForm" class="extended-form"><label>Supplier<select name="supplierId" id="supplierSelect" required></select></label><label>Bill description<input name="description" required maxlength="255"></label><label>Amount (₹)<input name="amount" type="number" min=".01" step=".01" required></label><label>Bill date<input name="billDate" type="date" value="${today()}" required></label><label>Due date<input name="dueDate" type="date" value="${today()}" required></label><button class="bi-action-button bi-action-primary">Save bill</button></form>
      <p id="supplierStatus" class="bi-report-status" aria-live="polite"></p><div class="credit-table-wrap"><table class="credit-table"><thead><tr><th>Supplier</th><th>Bill</th><th>Due</th><th>Amount</th><th>Paid</th><th>Outstanding</th><th>Action</th></tr></thead><tbody id="billRows"></tbody></table></div>`);
    page("inventory","Inventory management","Track stock levels, estimated stock value and low-stock warnings.",`
      <div class="extended-stats" id="inventoryStats"></div><form id="inventoryForm" class="extended-form"><label>Product name<input name="name" required maxlength="150"></label><label>SKU / code<input name="sku" maxlength="80"></label><label>Quantity<input name="quantity" type="number" min="0" step=".01" value="0" required></label><label>Unit cost (₹)<input name="unitCost" type="number" min="0" step=".01" value="0" required></label><label>Low-stock threshold<input name="lowStockThreshold" type="number" min="0" step=".01" value="5" required></label><button class="bi-action-button bi-action-primary">Add item</button></form><p id="inventoryStatus" class="bi-report-status" aria-live="polite"></p><div class="credit-table-wrap"><table class="credit-table"><thead><tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Unit cost</th><th>Stock value</th><th>Status</th><th>Action</th></tr></thead><tbody id="inventoryRows"></tbody></table></div>`);
    page("cashflow","Cash-flow intelligence","A planning view combining recorded transactions, customer receivables and supplier payables.",`
      <div class="extended-stats" id="cashflowStats"></div><h3>Business signals</h3><ul id="cashflowSignals"></ul><p class="muted">Potential position is a planning estimate, not a bank balance or formal accounting statement. Only recorded data is included.</p><button class="bi-action-button" id="refreshCashflow">Refresh analysis</button>`);
    page("ai","AI business assistant","Ask about your recorded business figures. Optional AI requires a provider API key; without one, a rule-based fallback is used.",`
      <div class="ai-workspace-note">Your transaction summary is used to ground the response. Avoid entering passwords, bank credentials or sensitive customer details.</div><form id="aiQuestionForm" class="extended-form"><label class="wide">Your question<textarea name="question" rows="3" maxlength="1000" required placeholder="How can I reduce costs based on my recorded transactions?"></textarea></label><button class="bi-action-button bi-action-primary">Ask assistant</button></form><p id="aiStatus" class="bi-report-status" aria-live="polite"></p><div id="aiAnswer" class="ai-answer" hidden></div>`);
    document.getElementById("supplierForm")?.addEventListener("submit", async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api(`/api/suppliers/${businessId}`,{method:"POST",body:JSON.stringify(Object.fromEntries(f))});e.currentTarget.reset();status("supplierStatus","Supplier added.");await loadSuppliers();}catch(x){status("supplierStatus",x.message);}});
    document.getElementById("billForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{await api(`/api/supplier-bills/${businessId}`,{method:"POST",body:JSON.stringify(Object.fromEntries(f))});status("supplierStatus","Bill added.");e.currentTarget.reset();e.currentTarget.elements.billDate.value=today();e.currentTarget.elements.dueDate.value=today();await loadSuppliers();}catch(x){status("supplierStatus",x.message);}});
    document.getElementById("billRows")?.addEventListener("click",async e=>{const b=e.target.closest("[data-pay-bill]");if(!b)return;const amount=prompt("Payment amount (₹):");if(amount===null)return;try{await api(`/api/supplier-bills/${b.dataset.payBill}/payments`,{method:"POST",body:JSON.stringify({amount,paymentDate:today(),note:"Payment recorded from dashboard"})});status("supplierStatus","Payment recorded.");await loadSuppliers();await loadCashflow();}catch(x){status("supplierStatus",x.message);}});
    document.getElementById("inventoryForm")?.addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget),d=Object.fromEntries(f);for(const k of ["quantity","unitCost","lowStockThreshold"])d[k]=Number(d[k]);try{await api(`/api/inventory/${businessId}`,{method:"POST",body:JSON.stringify(d)});e.currentTarget.reset();status("inventoryStatus","Inventory item added.");await loadInventory();}catch(x){status("inventoryStatus",x.message);}});
    document.getElementById("inventoryRows")?.addEventListener("click",async e=>{const b=e.target.closest("[data-edit-item]");if(!b)return;const row=b.closest("tr"),quantity=prompt("New quantity:",row.dataset.quantity);if(quantity===null)return;const unitCost=prompt("Unit cost (₹):",row.dataset.cost);if(unitCost===null)return;const threshold=prompt("Low-stock threshold:",row.dataset.threshold);if(threshold===null)return;try{await api(`/api/inventory/items/${b.dataset.editItem}`,{method:"PATCH",body:JSON.stringify({quantity,unitCost,lowStockThreshold:threshold})});status("inventoryStatus","Inventory updated.");await loadInventory();}catch(x){status("inventoryStatus",x.message);}});
    document.getElementById("refreshCashflow")?.addEventListener("click",loadCashflow);
    document.getElementById("aiQuestionForm")?.addEventListener("submit",async e=>{e.preventDefault();status("aiStatus","Thinking…");const answer=document.getElementById("aiAnswer");answer.hidden=true;try{const d=await api("/api/ai/ask",{method:"POST",body:JSON.stringify({businessId,question:new FormData(e.currentTarget).get("question")})});answer.textContent=d.answer;answer.hidden=false;status("aiStatus",d.mode==="gemini"?"Answered using configured AI provider.":"Answered using rule-based fallback.");}catch(x){status("aiStatus",x.message);}});
  }
  function status(id,msg){const e=document.getElementById(id);if(e)e.textContent=msg;}
  async function loadSuppliers(){
    if(!businessId)return;
    try{
      const [suppliers,bills]=await Promise.all([api(`/api/suppliers/${businessId}`),api(`/api/supplier-bills/${businessId}`)]);
      const select=document.getElementById("supplierSelect");select.innerHTML=suppliers.map(s=>`<option value="${s.id}">${escapeHtml(s.name)}</option>`).join("")||`<option value="">Add a supplier first</option>`;
      const outstanding=bills.reduce((s,b)=>s+Number(b.outstanding),0),overdue=bills.filter(b=>b.outstanding>0&&b.due_date<today()).reduce((s,b)=>s+Number(b.outstanding),0);
      document.getElementById("supplierStats").innerHTML=stat("Outstanding",money(outstanding))+stat("Overdue",money(overdue))+stat("Suppliers",suppliers.length);
      document.getElementById("billRows").innerHTML=bills.map(b=>`<tr><td>${escapeHtml(b.supplier_name)}</td><td>${escapeHtml(b.description)}</td><td>${escapeHtml(String(b.due_date).slice(0,10))}</td><td>${money(b.amount)}</td><td>${money(b.paid)}</td><td>${money(b.outstanding)}</td><td>${Number(b.outstanding)>0?`<button class="bi-action-button" data-pay-bill="${b.id}">Record payment</button>`:"Paid"}</td></tr>`).join("")||`<tr><td colspan="7">No supplier bills yet.</td></tr>`;
    }catch(e){status("supplierStatus",e.message);}
  }
  async function loadInventory(){if(!businessId)return;try{const items=await api(`/api/inventory/${businessId}`);document.getElementById("inventoryStats").innerHTML=stat("Products",items.length)+stat("Stock value",money(items.reduce((s,i)=>s+Number(i.stock_value),0)))+stat("Low stock",items.filter(i=>i.low_stock).length);document.getElementById("inventoryRows").innerHTML=items.map(i=>`<tr data-quantity="${i.quantity}" data-cost="${i.unit_cost}" data-threshold="${i.low_stock_threshold}"><td>${escapeHtml(i.name)}</td><td>${escapeHtml(i.sku||"—")}</td><td>${i.quantity}</td><td>${money(i.unit_cost)}</td><td>${money(i.stock_value)}</td><td>${i.low_stock?'<span class="low-stock">LOW STOCK</span>':'In stock'}</td><td><button class="bi-action-button" data-edit-item="${i.id}">Update</button></td></tr>`).join("")||`<tr><td colspan="7">No inventory items yet.</td></tr>`;}catch(e){status("inventoryStatus",e.message);}}
  async function loadCashflow(){if(!businessId)return;try{const d=await api(`/api/cashflow/${businessId}`);document.getElementById("cashflowStats").innerHTML=stat("Recorded net",money(d.recordedNet))+stat("Customer receivables",money(d.customerReceivables))+stat("Supplier payables",money(d.supplierPayables))+stat("Potential position",money(d.adjustedPotentialPosition));document.getElementById("cashflowSignals").innerHTML=d.signals.map(s=>`<li>${escapeHtml(s)}</li>`).join("");}catch(e){status("cashflowSignals",e.message);}}
  function stat(label,value){return `<div class="extended-stat"><span>${label}</span><strong>${value}</strong></div>`;}
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  const originalSetup = window.setupWorkspaceNavigation;
  // The existing app invokes setupWorkspaceNavigation when its dashboard is ready.
  const install = () => {
    const dashboard=document.getElementById("dashboardPage");
    if(!dashboard||!document.getElementById("workspaceNavigation")||!document.getElementById("customerCreditPage"))return false;
    setupExtendedWorkspaces();
    const nav=document.getElementById("workspaceNavigation");
    if(!nav.dataset.extendedBound){nav.dataset.extendedBound="1";nav.addEventListener("click",e=>{const b=e.target.closest("[data-workspace-view]");if(!b)return;const v=b.dataset.workspaceView;if(["suppliers","inventory","cashflow","ai"].includes(v)){e.preventDefault();e.stopImmediatePropagation();window.showWorkspaceView(v);}} ,true);}
    const oldShow=window.showWorkspaceView;
    if(!window.__extendedShowPatched){window.showWorkspaceView=function(view){const main=document.querySelector("#dashboardPage main, #dashboardPage .main-content");if(!main)return;const target=view==="customers"?document.getElementById("customerCreditPage"):view==="overview"?null:document.getElementById("workspace-"+view);Array.from(main.children).forEach(child=>{child.hidden=view==="overview"?(child===document.getElementById("customerCreditPage")||child.id?.startsWith("workspace-")):child!==target;});document.querySelectorAll("[data-workspace-view]").forEach(button=>{const active=button.dataset.workspaceView===view;button.classList.toggle("active",active);button.setAttribute("aria-current",active?"page":"false");});if(view==="customers"&&typeof loadCreditCustomers==="function")loadCreditCustomers();if(view==="suppliers")loadSuppliers();if(view==="inventory")loadInventory();if(view==="cashflow")loadCashflow();window.scrollTo({top:0,behavior:"smooth"});};window.__extendedShowPatched=true;}
    return true;
  };
  let attempts=0;const timer=setInterval(()=>{attempts++;if(install()||attempts>60)clearInterval(timer);},250);
  window.addEventListener("businessManagerReady",install);
})();
