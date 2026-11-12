
/* Eventa Manager — interactive SUPER ADMIN demonstration.
 * All records below are fictional. Changes are saved in the browser only.
 * There is no account provisioning, server-side authorization or email sending.
 */
(function () {
  "use strict";
  const KEY = "eventa-admin-demo-v1";
  const INITIAL = {
    organizations: [
      { id:"x", name:"Xevent", sector:"Organisation d’événements", status:"Actif", created:"2026-11-01" },
      { id:"t", name:"TraiteurX", sector:"Traiteur et réceptions", status:"Actif", created:"2026-11-02" }
    ],
    users: [
      {id:"u1",name:"Administration Eventa",email:"superadmin@eventa.example",org:"a",role:"Super administrateur",status:"Actif"},
      {id:"u2",name:"Responsable Xevent",email:"admin.xevent@eventa.example",org:"x",role:"Administrateur",status:"Actif"},
      {id:"u3",name:"Coordinatrice Xevent",email:"equipe.xevent@eventa.example",org:"x",role:"Collaborateur",status:"Actif"},
      {id:"u4",name:"Responsable TraiteurX",email:"admin.traiteurx@eventa.example",org:"t",role:"Administrateur",status:"Actif"}
    ],
    audit: [
      {text:"Compte administrateur TraiteurX créé",time:"2026-11-10",kind:"user"},
      {text:"Organisation TraiteurX créée",time:"2026-11-02",kind:"org"},
      {text:"Organisation Xevent créée",time:"2026-11-01",kind:"org"}
    ]
  };
  const clone = x=>JSON.parse(JSON.stringify(x));
  let store;
  try {
    const restored=JSON.parse(localStorage.getItem(KEY)||"null");
    store=restored&&Array.isArray(restored.organizations)&&Array.isArray(restored.users)?restored:clone(INITIAL);
  } catch (_) { store=clone(INITIAL); }
  store.audit=Array.isArray(store.audit)?store.audit:[];
  let orgFilter="",userFilter="",userOrgFilter="all",activeOrg="x";
  const activeOrganizations=()=>store.organizations.filter(o=>o.status==="Actif");
  const findOrg=id=>store.organizations.find(o=>o.id===id);
  const findUser=id=>store.users.find(u=>u.id===id);
  const labelOrg=id=>id==="a"?"Plateforme Eventa":findOrg(id)?.name||"Organisation inconnue";
  const nextId=(prefix,list)=>prefix+Math.max(Date.now(),...list.map(item=>Number(item.id.replace(/\D/g,""))||0)+1);
  const dateToday=()=>new Date().toLocaleDateString("fr-FR");
  function persist(){
    try {localStorage.setItem(KEY,JSON.stringify(store));} catch(_){}
  }
  function activity(message,kind){
    store.audit.unshift({text:message,time:dateToday(),kind});
    store.audit=store.audit.slice(0,50);
    persist();
  }
  function syncTenants(){
    store.organizations.forEach(o=>{
      if(!D[o.id])D[o.id]={name:o.name,events:[],stats:["0","0","0","0 MAD"],tasks:[],vendors:[]};
      D[o.id].name=o.name;
    });
  }
  function syncDropdown(){
    const select=$("org");if(!select)return;
    let options='<option value="a">Super Admin</option>';
    activeOrganizations().forEach(o=>{options+='<option value="'+safe(o.id)+'">'+safe(o.name)+'</option>'});
    select.innerHTML=options;
    if(S.org!=="a"&&!activeOrganizations().some(o=>o.id===S.org)){
      S.org="a";
    }
    select.value=S.org;
  }
  function showModal(title,body){
    $("dialog").classList.remove("billing-dialog");
    $("dialog").innerHTML='<div class="dialog-head"><h2>'+safe(title)+'</h2><button class="close" onclick="closemodal()" aria-label="Fermer">×</button></div>'+body;
    $("modal").classList.remove("hidden");
  }
  function badge(status){
    return '<span class="admin-badge '+(status==="Actif"?"admin-active":"admin-paused")+'"><span class="admin-badge-dot"></span>'+safe(status)+'</span>';
  }
  function summaryCard(icon,label,value,caption){
    return '<div class="card admin-summary-card"><span class="admin-summary-icon">'+icon+'</span><div class="admin-summary-copy"><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong><small>'+safe(caption)+'</small></div></div>';
  }
  function counts(){
    const organizations=store.organizations.length;
    const activeOrgs=activeOrganizations().length;
    const users=store.users.length;
    const activeUsers=store.users.filter(u=>u.status==="Actif").length;
    const events=store.organizations.reduce((total,o)=>total+(D[o.id]?.events.length||0)+S.extra.filter(e=>e.org===o.id).length,0);
    return {organizations,activeOrgs,users,activeUsers,events};
  }
  function actionLog(limit=5){
    return '<div class="admin-activity">'+(store.audit.slice(0,limit).map(a=>'<div class="admin-activity-line"><span class="admin-activity-dot"></span><div><span>'+safe(a.text)+'</span><small>'+safe(a.time)+'</small></div></div>').join('')||'<p class="muted">Aucune activité.</p>')+'</div>';
  }
  function orgCard(o){
    const eventCount=(D[o.id]?.events.length||0)+S.extra.filter(e=>e.org===o.id).length;
    const userCount=store.users.filter(u=>u.org===o.id).length;
    return '<button class="admin-org-card" type="button" onclick="EventaAdmin.openOrg(\''+safe(o.id)+'\')">'+
      '<span class="admin-org-icon">'+safe(o.name.slice(0,1).toUpperCase())+'</span>'+
      '<span class="admin-org-main"><strong>'+safe(o.name)+'</strong><small>'+safe(o.sector)+'</small><span class="admin-org-meta">'+eventCount+' événements · '+userCount+' utilisateurs</span></span>'+
      badge(o.status)+'<span class="admin-open-arrow">›</span></button>';
  }
  function overview(){
    const n=counts();
    return '<div class="admin-hero"><div><div class="eyebrow">PLATEFORME / SUPER ADMIN</div><h1>Vue d’ensemble</h1><p>Contrôlez vos organisations, les comptes et l’activité de votre plateforme.</p></div><div class="admin-header-actions"><button class="btn ghost" onclick="go(\'organizations\')">Organisations</button><button class="btn" onclick="EventaAdmin.orgEditor()">＋ Nouvelle organisation</button></div></div>'+
    '<div class="admin-metrics">'+summaryCard("▦","Organisations",n.organizations,n.activeOrgs+" actives")+summaryCard("♙","Utilisateurs",n.users,n.activeUsers+" actifs")+summaryCard("▣","Événements visibles",n.events,"Données de démonstration")+summaryCard("◉","Accès isolés",n.activeOrgs,"Espaces distincts")+'</div>'+
    '<div class="admin-overview-grid"><div class="card admin-panel"><div class="heading"><div><h3>Organisations</h3><p class="muted small">Accédez à chaque espace et à ses utilisateurs.</p></div><button class="link" onclick="go(\'organizations\')">Tout voir</button></div><div class="admin-org-list">'+store.organizations.map(orgCard).join('')+'</div></div>'+
    '<div class="card admin-panel"><div class="heading"><h3>Activité récente</h3><button class="link" onclick="go(\'reports\')">Voir le journal</button></div>'+actionLog(6)+'</div></div>'+
    '<div class="admin-help-row"><div><span class="admin-help-symbol">◎</span><div><strong>Accès et rôles</strong><p>Chaque organisation possède ses propres utilisateurs. Le Super Admin pilote l’ensemble.</p></div></div><button class="btn sm" onclick="go(\'users\')">Gérer les utilisateurs</button></div>';
  }
  function organizationsPage(){
    return '<div class="admin-page-head"><div><div class="eyebrow">SUPER ADMIN</div><h1>Organisations</h1><p>Créez, configurez et gérez les espaces de travail.</p></div><button class="btn" onclick="EventaAdmin.orgEditor()">＋ Organisation</button></div>'+
      '<section class="card admin-panel"><div class="admin-toolbar"><div class="admin-toolbar-label"><h3>Liste des organisations</h3><small>'+store.organizations.length+' espace(s) configuré(s)</small></div><input class="admin-search" id="adminOrgSearch" placeholder="Rechercher une organisation…" value="'+safe(orgFilter)+'" aria-label="Rechercher une organisation" oninput="EventaAdmin.filterOrgs(this.value)"></div><div id="adminOrgRows">'+orgRows()+'</div></section>';
  }
  function orgRows(){
    const rows=store.organizations.filter(o=>(o.name+" "+o.sector+" "+o.status).toLocaleLowerCase().includes(orgFilter.toLocaleLowerCase()));
    return rows.length?'<div class="admin-org-list">'+rows.map(orgCard).join('')+'</div>':'<div class="admin-no-data">Aucune organisation trouvée.</div>';
  }
  function filterOrgs(value){orgFilter=value;const node=$("adminOrgRows");if(node)node.innerHTML=orgRows();}
  function orgDetails(){
    const o=findOrg(activeOrg);
    if(!o)return organizationsPage();
    const nEvents=(D[o.id]?.events.length||0)+S.extra.filter(e=>e.org===o.id).length;
    const members=store.users.filter(u=>u.org===o.id);
    return '<div class="admin-detail"><button class="admin-back" onclick="go(\'organizations\')">← Retour aux organisations</button>'+
      '<div class="admin-page-head"><div><div class="eyebrow">FICHE ORGANISATION</div><h1>'+safe(o.name)+'</h1><p>'+safe(o.sector)+'</p></div><div class="admin-header-actions">'+badge(o.status)+'<button class="btn ghost" onclick="EventaAdmin.orgEditor(\''+safe(o.id)+'\')">Modifier</button></div></div>'+
      '<div class="admin-metrics admin-metrics-three">'+summaryCard("▣","Événements",nEvents,"Dans cet espace")+summaryCard("♙","Membres",members.length,"Comptes rattachés")+summaryCard("◉","Statut",o.status,"Créée le "+o.created)+'</div>'+
      '<div class="admin-overview-grid"><section class="card admin-panel"><div class="heading"><h3>Informations générales</h3></div><dl class="admin-info"><div><dt>Organisation</dt><dd>'+safe(o.name)+'</dd></div><div><dt>Activité</dt><dd>'+safe(o.sector)+'</dd></div><div><dt>Création</dt><dd>'+safe(o.created)+'</dd></div><div><dt>Statut</dt><dd>'+badge(o.status)+'</dd></div></dl><div class="admin-detail-actions"><button class="btn ghost" onclick="EventaAdmin.toggleOrg(\''+safe(o.id)+'\')">'+(o.status==="Actif"?"Suspendre":"Réactiver")+'</button>'+(o.status==="Actif"?'<button class="btn" onclick="EventaAdmin.enterOrganization(\''+safe(o.id)+'\')">Ouvrir cet espace →</button>':'')+'</div></section>'+
      '<section class="card admin-panel"><div class="heading"><h3>Membres de l’organisation</h3><button class="link" onclick="EventaAdmin.userEditor(null,\''+safe(o.id)+'\')">＋ Utilisateur</button></div><div class="admin-member-list">'+(members.length?members.map(u=>'<button class="admin-member" onclick="EventaAdmin.userEditor(\''+safe(u.id)+'\')"><span class="admin-avatar">'+safe(u.name[0]?.toUpperCase()||"?")+'</span><span><strong>'+safe(u.name)+'</strong><small>'+safe(u.role)+' · '+safe(u.status)+'</small></span><span class="admin-open-arrow">›</span></button>').join(''):'<p class="muted">Aucun membre associé.</p>')+'</div></section></div></div>';
  }
  function roles(){
    return '<div class="admin-roles"><div><strong>Super administrateur</strong><small>Vision globale et gestion des organisations</small></div><div><strong>Administrateur</strong><small>Gestion d’une seule organisation</small></div><div><strong>Collaborateur</strong><small>Travail sur les événements de son espace</small></div></div>';
  }
  function usersPage(){
    return '<div class="admin-page-head"><div><div class="eyebrow">SUPER ADMIN</div><h1>Utilisateurs</h1><p>Attribuez les rôles et contrôlez les accès aux espaces.</p></div><button class="btn" onclick="EventaAdmin.userEditor()">＋ Utilisateur</button></div>'+
    '<section class="card admin-panel"><div class="admin-toolbar"><div class="admin-toolbar-label"><h3>Comptes de démonstration</h3><small>'+store.users.length+' compte(s) enregistrés</small></div><div class="admin-filters"><input class="admin-search" id="adminUserSearch" placeholder="Nom ou e-mail…" value="'+safe(userFilter)+'" oninput="EventaAdmin.filterUsers(this.value)" aria-label="Rechercher un utilisateur"><select class="admin-search" onchange="EventaAdmin.filterUserOrg(this.value)" aria-label="Filtrer par organisation"><option value="all">Toutes les organisations</option><option value="a" '+(userOrgFilter==="a"?"selected":"")+'>Plateforme</option>'+store.organizations.map(o=>'<option value="'+safe(o.id)+'" '+(userOrgFilter===o.id?"selected":"")+'>'+safe(o.name)+'</option>').join('')+'</select></div></div><div id="adminUserRows">'+userRows()+'</div></section>'+
    '<section class="card admin-panel admin-roles-panel"><h3>Rôles et autorisations</h3><p class="small muted">Dans la version réelle, les droits seront appliqués côté serveur.</p>'+roles()+'</section>';
  }
  function userRows(){
    const users=store.users.filter(u=>(userOrgFilter==="all"||u.org===userOrgFilter)&&(u.name+" "+u.email+" "+u.role+" "+labelOrg(u.org)).toLowerCase().includes(userFilter.toLowerCase()));
    return users.length?'<div class="admin-user-list">'+users.map(u=>'<div class="admin-user-row"><span class="admin-avatar">'+safe(u.name.slice(0,1).toUpperCase())+'</span><div class="admin-user-name"><strong>'+safe(u.name)+'</strong><small>'+safe(u.email)+'</small></div><div class="admin-user-meta"><small>ORGANISATION</small><span>'+safe(labelOrg(u.org))+'</span></div><div class="admin-user-meta"><small>RÔLE</small><span>'+safe(u.role)+'</span></div>'+badge(u.status)+'<button class="btn ghost sm" onclick="EventaAdmin.userEditor(\''+safe(u.id)+'\')">Modifier</button></div>').join('')+'</div>':'<div class="admin-no-data">Aucun utilisateur trouvé.</div>';
  }
  function filterUsers(value){userFilter=value;const node=$("adminUserRows");if(node)node.innerHTML=userRows();}
  function filterUserOrg(value){userOrgFilter=value;const node=$("adminUserRows");if(node)node.innerHTML=userRows();}
  function reportsPage(){
    const c=counts(), most=Math.max(1,...store.organizations.map(o=>(D[o.id]?.events.length||0)+S.extra.filter(e=>e.org===o.id).length));
    return '<div class="admin-page-head"><div><div class="eyebrow">SUPER ADMIN</div><h1>Rapports & activité</h1><p>Vue synthétique des organisations et de leurs événements.</p></div></div>'+
    '<div class="admin-metrics">'+summaryCard("▦","Organisations",c.organizations,c.activeOrgs+" actives")+summaryCard("♙","Utilisateurs",c.users,c.activeUsers+" actifs")+summaryCard("▣","Événements visibles",c.events,"Données fictives")+summaryCard("◉","Journal",store.audit.length,"Opérations locales")+'</div>'+
    '<div class="admin-overview-grid"><section class="card admin-panel"><div class="heading"><h3>Événements par organisation</h3></div><div class="admin-bars">'+store.organizations.map(o=>{
      const count=(D[o.id]?.events.length||0)+S.extra.filter(e=>e.org===o.id).length;
      return '<div class="admin-bar-row"><div class="admin-bar-label"><span>'+safe(o.name)+'</span><strong>'+count+'</strong></div><div class="admin-bar-track"><span style="width:'+(count/most*100)+'%"></span></div></div>';
    }).join('')+'</div><p class="small muted">Ces chiffres concernent uniquement les événements fictifs de la démonstration.</p></section>'+
    '<section class="card admin-panel"><div class="heading"><h3>Journal d’activité</h3></div>'+actionLog(25)+'</section></div>';
  }
  function settingsPage(){
    return '<div class="admin-page-head"><div><div class="eyebrow">SUPER ADMIN</div><h1>Paramètres</h1><p>Configuration et état de la démonstration.</p></div></div>'+
    '<section class="card admin-panel admin-settings"><h3>Environnement</h3><div class="admin-settings-row"><span>Nom de la plateforme</span><strong>Eventa Manager</strong></div><div class="admin-settings-row"><span>Mode</span><strong>Démo locale</strong></div><div class="admin-settings-row"><span>Devise des exemples</span><strong>MAD</strong></div><div class="admin-settings-row"><span>Authentification réelle</span><strong>Non activée dans cet aperçu</strong></div></section>'+
    '<section class="card admin-panel admin-settings"><h3>Données de démonstration</h3><p>Les organisations et utilisateurs ajoutés sont conservés dans le navigateur de cet appareil. Ils ne créent aucun vrai compte.</p><button class="btn ghost" onclick="EventaAdmin.reset()">Réinitialiser les organisations et utilisateurs fictifs</button></section>';
  }
  function orgEditor(id){
    const o=id?findOrg(id):null;
    if(id&&!o)return;
    showModal(o?"Modifier l’organisation":"Nouvelle organisation",'<p class="small muted">Démonstration uniquement : aucune organisation réelle n’est créée.</p><form onsubmit="EventaAdmin.saveOrg(event,'+(id?"'"+safe(id)+"'":"null")+')">'+
    '<label class="field">Nom de l’organisation<input required id="ad-org-name" maxlength="65" placeholder="Ex. Agence Horizon" value="'+safe(o?.name||"")+'"></label>'+
    '<label class="field">Type d’activité<select id="ad-org-sector">'+["Organisation d’événements","Traiteur et réceptions","Agence événementielle","Autre"].map(x=>'<option '+(o?.sector===x?"selected":"")+'>'+safe(x)+'</option>').join('')+'</select></label>'+
    (o?'<label class="field">Statut<select id="ad-org-status"><option '+(o.status==="Actif"?"selected":"")+'>Actif</option><option '+(o.status==="Suspendu"?"selected":"")+'>Suspendu</option></select></label>':'')+
    '<div class="admin-form-actions"><button type="button" class="btn ghost" onclick="closemodal()">Annuler</button><button class="btn" type="submit">'+(o?"Enregistrer":"Créer l’organisation")+'</button></div></form>');
  }
  function saveOrg(e,id){
    e.preventDefault();
    const name=$("ad-org-name").value.trim(),sector=$("ad-org-sector").value;
    if(name.length<2){toast("Saisissez un nom d’organisation.");return;}
    if(store.organizations.some(o=>o.id!==id&&o.name.toLowerCase()===name.toLowerCase())){toast("Cette organisation existe déjà.");return;}
    if(id){
      const o=findOrg(id);if(!o)return;
      const previous=o.status;
      o.name=name;o.sector=sector;o.status=$("ad-org-status").value;
      activity("Organisation "+o.name+" mise à jour","org");
      if(previous!==o.status)activity(o.name+" : "+o.status.toLowerCase(),"org");
    }else{
      id=nextId("org",store.organizations);
      store.organizations.push({id,name,sector,status:"Actif",created:dateToday()});
      activity("Organisation "+name+" créée","org");
    }
    syncTenants();closemodal();render();toast("Organisation enregistrée dans cette démo.");
  }
  function toggleOrg(id){
    const o=findOrg(id);if(!o)return;
    const newStatus=o.status==="Actif"?"Suspendu":"Actif";
    if(newStatus==="Suspendu"&&!confirm("Suspendre "+o.name+" dans cette démonstration ? Son espace sera masqué du sélecteur."))return;
    o.status=newStatus;activity(o.name+" : "+newStatus.toLowerCase(),"org");
    render();toast("Statut mis à jour.");
  }
  function openOrg(id){activeOrg=id;S.page="org-detail";render();window.scrollTo(0,0);}
  function enterOrganization(id){
    if(findOrg(id)?.status!=="Actif"){toast("Cet espace est suspendu.");return;}
    S.org=id;S.page="dashboard";S.filter="";render();window.scrollTo(0,0);
  }
  function userEditor(id,defaultOrg){
    const u=id?findUser(id):null;
    if(id&&!u)return;
    const isProtected=u?.role==="Super administrateur";
    const choices='<option value="a" '+(u?.org==="a"?"selected":"")+'>Plateforme Eventa</option>'+activeOrganizations().map(o=>'<option value="'+safe(o.id)+'" '+((u?.org||defaultOrg)===o.id?"selected":"")+'>'+safe(o.name)+'</option>').join('');
    showModal(u?"Modifier l’utilisateur":"Nouvel utilisateur",'<p class="small muted">Les utilisateurs de cet aperçu sont fictifs ; aucun e-mail n’est envoyé.</p><form onsubmit="EventaAdmin.saveUser(event,'+(id?"'"+safe(id)+"'":"null")+')">'+
    '<label class="field">Nom complet<input required id="ad-user-name" maxlength="80" value="'+safe(u?.name||"")+'" placeholder="Ex. Samira Test"></label>'+
    '<label class="field">Adresse e-mail fictive<input required type="email" id="ad-user-email" maxlength="110" value="'+safe(u?.email||"")+'" placeholder="prenom@example.com"></label>'+
    '<label class="field">Organisation<select id="ad-user-org" '+(isProtected?"disabled":"")+' onchange="EventaAdmin.updateRoleSelect(this.value)">'+choices+'</select></label>'+
    '<label class="field">Rôle<select id="ad-user-role" '+(isProtected?"disabled":"")+'></select></label>'+
    (u?'<label class="field">Statut<select id="ad-user-status" '+(isProtected?"disabled":"")+'><option '+(u.status==="Actif"?"selected":"")+'>Actif</option><option '+(u.status==="Suspendu"?"selected":"")+'>Suspendu</option></select></label>':'')+
    '<div class="admin-form-actions"><button class="btn ghost" type="button" onclick="closemodal()">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>');
    updateRoleSelect(u?.org||defaultOrg||"a",u?.role||null);
  }
  function updateRoleSelect(org,selectedRole){
    const target=$("ad-user-role");if(!target)return;
    const roles=org==="a"?["Super administrateur"]:["Administrateur","Collaborateur"];
    target.innerHTML=roles.map(role=>'<option '+(role===selectedRole?"selected":"")+'>'+safe(role)+'</option>').join("");
  }
  function saveUser(e,id){
    e.preventDefault();
    const u=id?findUser(id):null;
    const name=$("ad-user-name").value.trim(),email=$("ad-user-email").value.trim().toLowerCase();
    const org=$("ad-user-org").value,role=$("ad-user-role").value,status=$("ad-user-status")?.value||"Actif";
    if(name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){toast("Vérifiez le nom et l’adresse e-mail.");return;}
    if(store.users.some(x=>x.id!==id&&x.email.toLowerCase()===email)){toast("Cet e-mail existe déjà dans la démonstration.");return;}
    if(!id&&org==="a"){toast("La démonstration ne crée pas de nouveaux Super Admins.");return;}
    if(org!=="a"&&!findOrg(org)){toast("Organisation introuvable.");return;}
    if(u?.role==="Super administrateur"){u.name=name;u.email=email;}
    else if(u){Object.assign(u,{name,email,org,role,status});}
    else store.users.push({id:nextId("u",store.users),name,email,org,role,status:"Actif"});
    activity("Compte "+name+(u?" modifié":" créé"),"user");
    closemodal();render();toast("Compte fictif enregistré.");
  }
  function reset(){
    if(!confirm("Effacer les modifications Super Admin enregistrées dans ce navigateur ?"))return;
    store=clone(INITIAL);orgFilter="";userFilter="";userOrgFilter="all";activeOrg="x";persist();S.org="a";S.page="dashboard";render();toast("Démonstration Super Admin réinitialisée.");
  }
  const baseDashboard=dashboard,baseOther=other,baseRender=render;
  dashboard=function(){
    if(S.org==="a")return overview();
    if(!evt().length)return title("Tableau de bord","Nouvel espace de démonstration.")+
      '<section class="card admin-panel"><h3>Aucun événement pour le moment</h3><p class="muted" style="margin:12px 0">Cet espace est indépendant des autres organisations.</p><button class="btn" onclick="newEvent()">＋ Ajouter un événement</button></section>';
    return baseDashboard();
  };
  other=function(){
    if(S.org==="a"){
      if(S.page==="organizations")return organizationsPage();
      if(S.page==="org-detail")return orgDetails();
      if(S.page==="users")return usersPage();
      if(S.page==="reports")return reportsPage();
      if(S.page==="settings")return settingsPage();
    }
    return baseOther();
  };
  render=function(){
    syncTenants();baseRender();syncDropdown();
    if(S.org==="a"&&S.page==="org-detail"){
      const nav=$("nav");
      if(nav)Array.from(nav.querySelectorAll(".nav")).forEach(button=>button.classList.toggle("active",button.textContent.includes("Organisations")));
    }
  };
  // Explicitly expose only click handlers. No privileged server requests are performed.
  window.EventaAdmin={
    orgEditor,saveOrg,openOrg,toggleOrg,filterOrgs,enterOrganization,
    userEditor,saveUser,filterUsers,filterUserOrg,updateRoleSelect,reset
  };
  syncTenants();
})();
