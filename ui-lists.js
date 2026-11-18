// Listes libellé / valeur : une ligne par élément (prix, recettes, stocks, comparaisons) au lieu d'un texte « à la suite ».
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function pairsHtml(pairs,note=''){
 if(!pairs?.length)return note?'<p class="kv-note">'+escapeHtml(note)+'</p>':'';
 return '<dl class="kv-list">'+pairs.map(([label,value])=>'<div><dt>'+escapeHtml(label)+'</dt><dd>'+escapeHtml(value)+'</dd></div>').join('')+'</dl>'+(note?'<p class="kv-note">'+escapeHtml(note)+'</p>':'');
}

// L'interface se rafraîchit plusieurs fois par seconde : ne toucher au DOM que si le contenu change réellement.
export function renderPairs(host,pairs,note=''){
 if(!host)return;
 const signature=JSON.stringify([pairs||[],note]);
 if(host.dataset.kv===signature)return;
 host.dataset.kv=signature;
 host.innerHTML=pairsHtml(pairs,note);
}
