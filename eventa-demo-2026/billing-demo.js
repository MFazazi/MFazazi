/*
 * Eventa Manager — module de facturation de la démonstration.
 * Uniquement des données fictives stockées dans ce navigateur.
 * Les calculs utilisent des centimes entiers pour éviter les erreurs flottantes.
 * Aucune émission de facture légale ni authentification réelle ici.
 */
(function () {
  "use strict";
  const STORAGE_KEY = "eventa-demo-billing-v2";
  let records = {};
  try {
    records = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") || {};
  } catch (_) {
    records = {};
  }
  const asCents = (v) => Math.round(Number(v || 0) * 100);
  const mad = (cents) => (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " MAD";
  const eventKey = (e) => S.org + "|" + e[0] + "|" + e[2];
  const persist = () => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
    catch (_) { /* Private browsing: keep only in-memory state */ }
  };
  function record(index) {
    const e = evt()[index];
    if (!e) return null;
    const key = eventKey(e);
    if (!records[key]) {
      const seeded = index === 0;
      const services = !seeded ? [] : S.org === "t" ? [
        { name: "Cocktail de bienvenue", qty: 180, unitCents: asCents(65) },
        { name: "Menu principal", qty: 180, unitCents: asCents(105) },
        { name: "Service en salle", qty: 4, unitCents: asCents(350) }
      ] : [
        { name: "Décoration florale", qty: 1, unitCents: asCents(12000) },
        { name: "Location salle et mobilier", qty: 1, unitCents: asCents(25000) },
        { name: "Service traiteur", qty: 250, unitCents: asCents(300) },
        { name: "DJ et sonorisation", qty: 1, unitCents: asCents(6000) },
        { name: "Photographie et vidéo", qty: 1, unitCents: asCents(9000) }
      ];
      records[key] = {
        services,
        payments: seeded ? [{ label: "Acompte à la réservation", date: "2026-11-03", method: "Virement", amountCents: asCents(S.org === "t" ? 8000 : 20000) }] : []
      };
      persist();
    }
    return records[key];
  }
  function totals(r) {
    const total = r.services.reduce((sum, item) => sum + item.qty * item.unitCents, 0);
    const paid = r.payments.reduce((sum, pay) => sum + pay.amountCents, 0);
    return { total, paid, due: Math.max(total - paid, 0), excess: Math.max(paid - total, 0) };
  }
  function opener(title, contents) {
    $("dialog").innerHTML = '<div class="dialog-head"><h2>' + safe(title) + '</h2><button class="close" onclick="closemodal()" aria-label="Fermer">×</button></div>' + contents;
    $("modal").classList.remove("hidden");
    $("dialog").classList.add("billing-dialog");
  }
  function show(index, tab = "services") {
    const e = evt()[index], r = record(index);
    if (!e || !r) return;
    const t = totals(r);
    const tabs = [
      ["services", "Prestations client"],
      ["payments", "Acomptes & paiements"],
      ["invoice", "Facture"]
    ].map(([id, label]) => '<button class="bill-tab ' + (tab === id ? "selected" : "") + '" onclick="EventaBilling.show(' + index + ',\'' + id + '\')">' + label + "</button>").join("");
    let content = '<div class="bill-sub">Client : <strong>' + safe(e[1]) + '</strong> · ' + safe(e[2]) + " · " + safe(e[3]) + '</div><div class="bill-tabs">' + tabs + "</div>";
    content += '<div class="bill-totals"><div><small>Total prestations</small><b>' + mad(t.total) + '</b></div><div><small>Acomptes reçus</small><b>' + mad(t.paid) + '</b></div><div class="due"><small>Reste à payer</small><b>' + mad(t.due) + "</b></div></div>";
    if (tab === "services") {
      content += '<div class="bill-section-title"><h3>Demandes & prestations du client</h3><button class="btn sm" onclick="EventaBilling.editService(' + index + ',-1)">＋ Prestation</button></div>';
      content += r.services.length ? '<div class="bill-lines">' + r.services.map((line, i) =>
        '<div class="bill-line"><div class="bill-line-name"><strong>' + safe(line.name) + '</strong><small>' + line.qty + ' × ' + mad(line.unitCents) + '</small></div><b>' + mad(line.qty * line.unitCents) + '</b><div class="bill-row-actions"><button onclick="EventaBilling.editService(' + index + "," + i + ')">Modifier</button><button onclick="EventaBilling.deleteService(' + index + "," + i + ')">Supprimer</button></div></div>'
      ).join("") + "</div>" : '<p class="bill-empty">Aucune prestation renseignée. Ajoute les demandes du client et leur tarif.</p>';
      content += '<p class="bill-hint">Le budget prévisionnel de l’événement est distinct du total des prestations vendues.</p>';
    } else if (tab === "payments") {
      content += '<div class="bill-section-title"><h3>Historique des règlements</h3><button class="btn sm" onclick="EventaBilling.editPayment(' + index + ')">＋ Ajouter un acompte</button></div>';
      content += r.payments.length ? '<div class="bill-lines">' + r.payments.map((p, i) =>
        '<div class="bill-line"><div class="bill-line-name"><strong>' + safe(p.label) + '</strong><small>' + safe(p.date) + ' · ' + safe(p.method) + '</small></div><b>' + mad(p.amountCents) + '</b><div class="bill-row-actions"><button onclick="EventaBilling.deletePayment(' + index + "," + i + ')">Supprimer</button></div></div>'
      ).join("") + "</div>" : '<p class="bill-empty">Aucun règlement reçu pour le moment.</p>';
      if (t.excess) content += '<p class="bill-warning">Trop-perçu : ' + mad(t.excess) + '. Vérifie les règlements.</p>';
    } else {
      content += '<div class="bill-section-title"><h3>Aperçu de la facture</h3><span class="tag">Document de démonstration</span></div>';
      content += '<div class="bill-paper"><div style="display:flex;justify-content:space-between;gap:12px"><div><strong style="font-size:21px;color:#4d1937">Eventa Manager</strong><div class="bill-hint">' + safe(D[S.org].name) + '</div></div><div style="text-align:right"><strong>FACTURE — DÉMO</strong><div class="bill-hint">Réf. DEMO-' + (index + 1) + '-' + S.org.toUpperCase() + '</div></div></div><hr><div class="bill-hint">Client : <b>' + safe(e[1]) + '</b><br>Événement : ' + safe(e[0]) + '<br>Date : ' + safe(e[2]) + '</div>';
      content += '<div class="bill-paper-lines">' + r.services.map(line => '<div><span>' + safe(line.name) + ' — ' + line.qty + ' × ' + mad(line.unitCents) + '</span><strong>' + mad(line.qty * line.unitCents) + '</strong></div>').join("") + '</div><div class="bill-paper-lines"><div><b>TOTAL</b><b>' + mad(t.total) + '</b></div><div><span>Versements reçus</span><b>− ' + mad(t.paid) + '</b></div><div class="bill-due"><b>RESTE À PAYER</b><b>' + mad(t.due) + '</b></div></div><p class="bill-hint">Brouillon de démonstration sans valeur fiscale. Identification de l’émetteur, fiscalité et numérotation réglementaire à configurer avant une émission réelle.</p></div>';
      content += '<button class="btn" style="width:100%;margin-top:15px" onclick="EventaBilling.makePdf(' + index + ')">⇩ Générer la facture PDF</button>';
      if (!r.services.length) content += '<p class="bill-warning">Ajoute au moins une prestation avant de générer le PDF.</p>';
    }
    opener(e[0], content);
  }
  function editService(index, lineIndex) {
    const r = record(index), old = lineIndex >= 0 ? r.services[lineIndex] : null;
    const content = '<p class="bill-sub">Chaque prestation demandée par le client a un tarif et une quantité.</p><form onsubmit="EventaBilling.saveService(event,' + index + "," + lineIndex + ')"><label class="field">Prestation<input id="bill-name" maxlength="120" required value="' + safe(old?.name || "") + '" placeholder="Ex. Décoration, buffet, DJ..."></label><div class="bill-two"><label class="field">Quantité<input id="bill-qty" type="number" min="1" max="100000" step="1" required value="' + (old?.qty || 1) + '"></label><label class="field">Prix unitaire (MAD)<input id="bill-price" type="number" min="0" max="99999999" step="0.01" required value="' + (old ? old.unitCents / 100 : 0) + '"></label></div><div class="bill-form-actions"><button class="btn ghost" type="button" onclick="EventaBilling.show(' + index + ',\'services\')">Annuler</button><button class="btn" type="submit">Enregistrer</button></div></form>';
    opener(old ? "Modifier la prestation" : "Ajouter une prestation", content);
  }
  function saveService(event, index, lineIndex) {
    event.preventDefault();
    const name = $("bill-name").value.trim(), qty = Number($("bill-qty").value), price = Number($("bill-price").value);
    if (!name || !Number.isSafeInteger(qty) || qty < 1 || qty > 100000 || !Number.isFinite(price) || price < 0 || price > 99999999) {
      toast("Vérifie le nom, la quantité et le prix."); return;
    }
    const service = { name, qty, unitCents: asCents(price) };
    const r = record(index);
    if (lineIndex >= 0) r.services[lineIndex] = service; else r.services.push(service);
    persist(); show(index, "services"); toast("Prestation enregistrée.");
  }
  function deleteService(index, lineIndex) {
    if (!confirm("Supprimer cette prestation ?")) return;
    record(index).services.splice(lineIndex, 1); persist(); show(index, "services");
  }
  function editPayment(index) {
    const content = '<p class="bill-sub">Acompte initial ou règlement complémentaire reçu du client.</p><form onsubmit="EventaBilling.savePayment(event,' + index + ')"><label class="field">Libellé<input id="bill-pay-label" required maxlength="100" value="Acompte client"></label><div class="bill-two"><label class="field">Montant reçu (MAD)<input id="bill-pay-amount" type="number" min="0.01" max="99999999" step="0.01" required></label><label class="field">Date de réception<input id="bill-pay-date" type="date" required value="' + new Date().toISOString().slice(0, 10) + '"></label></div><label class="field">Moyen de paiement<select id="bill-pay-method"><option>Virement</option><option>Espèces</option><option>Carte</option><option>Chèque</option><option>Autre</option></select></label><div class="bill-form-actions"><button class="btn ghost" type="button" onclick="EventaBilling.show(' + index + ',\'payments\')">Annuler</button><button class="btn" type="submit">Enregistrer le paiement</button></div></form>';
    opener("Ajouter un règlement", content);
  }
  function savePayment(event, index) {
    event.preventDefault();
    const cents = asCents($("bill-pay-amount").value);
    if (!Number.isSafeInteger(cents) || cents <= 0) { toast("Montant incorrect."); return; }
    record(index).payments.push({
      label: $("bill-pay-label").value.trim() || "Paiement",
      date: $("bill-pay-date").value,
      method: $("bill-pay-method").value,
      amountCents: cents
    });
    persist(); show(index, "payments"); toast("Paiement enregistré.");
  }
  function deletePayment(index, payIndex) {
    if (!confirm("Supprimer ce règlement de la démonstration ?")) return;
    record(index).payments.splice(payIndex, 1); persist(); show(index, "payments");
  }
  function makePdf(index) {
    const e = evt()[index], r = record(index), t = totals(r);
    if (!r.services.length) { toast("Ajoute une prestation pour créer une facture."); return; }
    if (!window.jspdf || !window.jspdf.jsPDF) {
      toast("Bibliothèque PDF indisponible. Vérifie ta connexion Internet puis réessaie."); return;
    }
    const doc = new window.jspdf.jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    const ref = "DEMO-" + S.org.toUpperCase() + "-" + (index + 1);
    doc.setFillColor(77, 25, 55); doc.rect(0, 0, pageWidth, 31, "F");
    doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("EVENTA MANAGER", 16, 18);
    doc.setFontSize(10); doc.text("FACTURE - DEMONSTRATION", 194, 18, { align: "right" });
    doc.setTextColor(54, 39, 48); doc.setFontSize(10);
    doc.text("Organisateur : " + D[S.org].name, 16, 45);
    doc.text("Client : " + e[1], 16, 52);
    doc.text("Evenement : " + e[0], 16, 59);
    doc.text("Date de l'evenement : " + e[2], 16, 66);
    doc.text("Reference : " + ref, 194, 45, { align: "right" });
    doc.text("Emise le : " + new Date().toLocaleDateString("fr-FR"), 194, 52, { align: "right" });
    let y = 80;
    const header = () => {
      doc.setFillColor(248, 239, 242); doc.rect(14, y - 6, 182, 10, "F");
      doc.setFont("helvetica", "bold"); doc.text("Prestation", 17, y); doc.text("Qte", 124, y, { align: "right" });
      doc.text("Prix unitaire", 160, y, { align: "right" }); doc.text("Total", 193, y, { align: "right" });
      doc.setFont("helvetica", "normal"); y += 10;
    };
    header();
    for (const line of r.services) {
      if (y > 258) { doc.addPage(); y = 25; header(); }
      const name = doc.splitTextToSize(line.name, 82);
      const h = Math.max(8, name.length * 5 + 3);
      doc.text(name, 17, y);
      doc.text(String(line.qty), 124, y, { align: "right" });
      doc.text(mad(line.unitCents), 160, y, { align: "right" });
      doc.text(mad(line.qty * line.unitCents), 193, y, { align: "right" });
      doc.setDrawColor(238, 227, 228); doc.line(16, y + h - 4, 194, y + h - 4); y += h;
    }
    if (y > 244) { doc.addPage(); y = 25; }
    y += 8;
    doc.setFont("helvetica", "bold"); doc.text("TOTAL PRESTATIONS", 117, y); doc.text(mad(t.total), 193, y, { align: "right" });
    y += 9; doc.setFont("helvetica", "normal"); doc.text("Acomptes et paiements", 117, y); doc.text("- " + mad(t.paid), 193, y, { align: "right" });
    y += 11; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("RESTE A PAYER", 117, y); doc.text(mad(t.due), 193, y, { align: "right" });
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(140, 95, 109);
    doc.text("DOCUMENT DE DEMONSTRATION - SANS VALEUR FISCALE", 105, 284, { align: "center" });
    doc.save("Facture-demo-" + S.org + "-" + (index + 1) + ".pdf");
  }
  window.EventaBilling = { show, editService, saveService, deleteService, editPayment, savePayment, deletePayment, makePdf };
  window.eventDetail = (index) => show(index, "services");
})();
