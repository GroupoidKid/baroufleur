// ==UserScript==
// @name         [Mountyhall] Le Baroufleur
// @namespace    Mountyhall
// @description  Assistant Baroufle
// @author       Dabihul
// @version      0.3a.1.3
// @updateURL    http://weblocal/scripts_externes/baroufleur/baroufleur.user.js
// @include      */mountyhall/MH_Play/Actions/Competences/Play_a_Competence43b*
// @grant        none
// ==/UserScript==

//---------------------- À l'intention des programmeurs ----------------------//

//...

//---------------------------- Variables Globales ----------------------------//

var url = window.location.pathname;
window.console.log("[Baroufleur] Script ON sur : %s", url);

var
	// Listes des Sons disponibles
	// {son: code}
	objCodeDuSon = {},
	// {code: son}
	objSonParCode = {},
	// [son]
	ordreAlphabétiqueSons = [],
	// [son]
	ordreAlphabétiqueEffets = [],
	
	// Table principale de la comp'
	tableComp,
	
	// Nombre de PA du Baroufle
	nombreDePAs,
	
	// Mode du clavier
	// 1: clavier avec son
	// 2: clavier avec effets
	// 3: clavier avec son+effets
	typeClavier = 1,
	
	// Nombre de sons par ligne en mode clavier
	sonsParLigne = 3;

//----------------------- Base de données sur les sons -----------------------//

const
	BDD_Sons = {
//	"Son": {
//		seuil: s'il y a un seuil (number),
//		multiple: si le seuil s'applique plusieurs fois (boolean),
//		effet: {
//			"carac": multiplicateur (number),
//		},
//		description: "description"
//	},
	"Bababoum"    : {
		effet: {
			"Att": 1
		},
		description: "Attaque +1 par seuil dépensé"
	},
	"Booong"      : {
		effet: {
			"Deg": 1,
			"Esq": -1
		},
		description: "Dégâts +1 | Esquive -1 par seuil dépensé"
	},
	"Gaaaw"       : {
		effet: {
			"Fatigue": 1
		},
		description: "Fatigue +1 par seuil dépensé"
	},
	"Huitsch"     : {
		effet: {
			"Deg": -1
		},
		description: "Dégâts -1 par seuil dépensé"
	},
	"Kliketiiik"  : {
		effet: {
			"Esq": -1,
			"Concentration": -1
		},
		description: "Esquive -1 | Concentration -1 par seuil dépensé"
	},
	"Krouiiik"    : {
		effet: {
			"Concentration": -2
		},
		description: "Concentration -2 par seuil dépensé"
	},
	"Kssksss"     : {
		effet: {
			"Esq": 1
		},
		description: "Esquive +1 par seuil dépensé"
	},
	"Praaaouuut"  : {
		effet: {
			"Reg": -1
		},
		description: "Régénération -1 par seuil dépensé"
	},
	"Sssrileur"   : {
		seuil: 6,
		multiple: false,
		effet: {
			"Rend visible": 1
		},
		description: "Rend visible (seuil 6)"
	},
	"Tagadagada"  : {
		seuil: 2,
		multiple: true,
		effet: {
			"Durée": 1
		},
		description: "Durée +1 par 2 seuils dépensés"
	},
	"Tuutuuuut"   : {
		effet: {
			"Att": -1
		},
		description: "Attaque -1 par seuil dépensé"
	},
	"Whaaag"      : {
		seuil: 4,
		multiple: true,
		effet: {
			"Portée": 1
		},
		description: "Portée horizontale +1 par 4 seuils dépensés"
	},
	"Whoooom"     : {
		effet: {
			"Concentration": 2
		},
		description: "Concentration +2 par seuil dépensé"
	},
	"Ytseukayndof": {
		seuil: 2,
		multiple: false,
		effet: {
			"BM Magiques": 1
		},
		description: "Rend les bonus magiques (seuil 2)"
	},
	"Zbouing"     : {
		effet: {
			"Reg": 1
		},
		description: "Régénération +1 par seuil dépensé"
	}
}

//-------------------------- Utilitaires génériques --------------------------//

// Gestion perso des objets pour Storage
Storage.prototype.setObject = function(key, value) {
	if(typeof value!=="object") {
		window.console.warn(
			"[setObject] given value is not of object type: %o",
			value
		);
	} else {
		this.setItem(key, JSON.stringify(value));
	}
}

Storage.prototype.getObject = function(key) {
	var	value = this.getItem(key), obj;
	if(!value) {
		window.console.warn(
			"[getObject] nothing found at key: %s", key
		);
		return {};
	}
	try {
		obj = JSON.parse(value);
	} catch(e) {
		window.console.error(
			"[getObject] Parsing error. Non-JSON value at key: %s\n%o",
			key, e
		);
		return {};
	}
	return obj;
}

function epure(texte) {
// Supprime les caractères spéciaux
	return texte.
		replace(/[àâä]/g, 'a').
		replace(/Â/g, 'A').
		replace(/ç/g, 'c').
		replace(/[éêèë]/g, 'e').
		replace(/[ïî]/g, 'i').
		replace(/[ôöõ]/g, 'o').
		replace(/[ùûü]/g, 'u');
}

function relatif(num) {
// Force l'affichage du signe d'un relatif
	num = Number(num);
	return (isNaN(num) || num<0) ? String(num) : "+"+num;
}

function ordinal(num) {
// Retourne l'ordinal associé au nombre
	return num==1 ? "1er" : num+"ème"
}

//------------------------------ Gestion du DOM ------------------------------//

function ajouteTexte(parent, text, bold, italic) {
// Ajoute un textNode contenant 'text' à 'parent',
// si nécessaire entre des balises gras et/ou italique.
	if(bold) {
		var b = document.createElement('b');
		parent.appendChild(b);
		parent = b;
	}
	if(italic) {
		var i = document.createElement('i');
		parent.appendChild(i);
		parent = i;
	}
	parent.appendChild(document.createTextNode(text));
}

function ajouteBouton(parent, value) {
// Ajoute un bouton de valeur 'value' de classe 'mh_form_submit' à 'parent'
	var input = document.createElement("input");
	input.type = "button";
	input.className = "mh_form_submit";
	if(value) {
		input.value = value;
	}
	parent.appendChild(input);
	return input;
}

//-------------------------- Extraction de données ---------------------------//

function getSonsDisponibles() {
// Extrait la liste des sons disponibles pour Baroufler.
// 
// Nécessite: -
// Effectue:
// - initialise objCodeDuSon
// - initialise objSonParCode
// - initialise ordreAlphabétiqueSons
// - initialise ordreAlphabétiqueEffets
	try {
		var selectPremierSon = document.getElementsByName("ai_N1")[0];
	} catch(e) {
		window.console.error(
			"[Baroufleur] Liste de sons non trouvée - Abandon", e
		);
		return false;
	}
	var i, option, son, effet, listeEffets = {};
	
	for(i=0 ; i<selectPremierSon.options.length ; i++) {
		option = selectPremierSon.options[i];
		if(option.value) {
			son = option.textContent.trim();
			if(son.indexOf("-")!=-1) {
				son = son.replace(/-/,"").trim();
			}
			objCodeDuSon[son] = option.value;
			objSonParCode[option.value] = son;
			ordreAlphabétiqueSons.push(son);
			ordreAlphabétiqueEffets.push(son);
			listeEffets[son] = "";
			for(effet in BDD_Sons[son].effet) {
				listeEffets[son] += effet;
			}
		}
	}
	ordreAlphabétiqueSons.sort();
	ordreAlphabétiqueEffets.sort(function(a, b) {
		return listeEffets[a]>listeEffets[b];
	});
	
	return true;
}

function getTableComp() {
// Recherche la table principale de la comp'
// Nécessite: -
// Effectue: définit tableComp
	try {
		tableComp = document.querySelector("#mhPlay form table");
	} catch(e) {
		window.console.error(
			"[Baroufleur] Table principale non trouvée - Abandon", e
		);
		return false;
	}
	return true;
}

//------------------------ Enrichissement des listes -------------------------//

function effetDuSon(son, rang) {
// Retourne une chaîne de caractères correspondant à l'effet exact du son,
// déterminé par le type du son et son rang dans la mélodie.
// Nécessite: BDD_Sons
	var
		texte = "",
		effet;
	if(nombreDePAs && rang>nombreDePAs) {
		rang = 0;
	}
	
	for(effet in BDD_Sons[son].effet) {
		if(texte.length>2) {
			texte += " | ";
		}
		if(BDD_Sons[son].seuil) {
			if(BDD_Sons[son].multiple) {
				texte += effet+" +"+rang+"/"+BDD_Sons[son].seuil;
			} else {
				texte += effet+": "+rang+"/"+BDD_Sons[son].seuil;
			}
		} else {
			texte += effet+" "+relatif(BDD_Sons[son].effet[effet]*rang);
		}
	}
	
	return 	texte.
		replace(/Concentration/, "Conc.").
		replace(/BM Magiques/, "BMM");
}

function initialiseListesSons() {
// Initialisation générale du script.
// 
// Nécessite: BDD_Sons
// Effectue:
// - ajoute les données de BM dans les selects
// - ajoute les handlers sur les selects
// - initialise nombreDePAs
	var
		i=1, j, option, son, texte, effet,
		selects = document.getElementsByName("ai_N1");
	
	while(selects[0]) {
		for(j=0 ; j<selects[0].options.length ; j++) {
			option = selects[0].options[j];
			if(!option.value) {
				// Ignorer les "Choisissez une note"
				continue;
			}
			
			// Identification du son
			son = option.textContent;
			if(son.indexOf("-")!=-1) {
				son = son.replace(/-/,"");
			}
			son = son.trim();
			if(!BDD_Sons[son]) {
				window.console.warn(
					"[mmassistant] Le son "+son+" est inconnu"
				);
				continue;
			}
			
			// Ajouter la description
			option.title = BDD_Sons[son].description;
			
			// Ajouter l'effet
			ajouteTexte(option, " ("+effetDuSon(son, i)+")");
		}
		
		// Ajout du Handler
		selects[0].onchange = onSelectChange;
		
		// Passage au select suivant
		i++;
		selects = document.getElementsByName("ai_N"+i);
	}
	
	// Décompte du nombre de PAs du Baroufle (=nb de selects)
	nombreDePAs = i-1;
}

//---------------------------- Interface clavier -----------------------------//

function initialiseClavier() {
// Crée un clavier, *vide* et *invisible*, en dessous des sélecteurs,
// et lui adjoint une copie de la zone 'baroufleur_effettotal'.
// 
// Nécessite : 
// - tableComp
// - la mise en place préalable de la zone 'baroufleur_effettotal'
// Effectue : la création d'un clavier prêt à remplir
	var
		ulRef = document.getElementById("baroufleur_effettotal"),
		tr, td, span, ul,
		table, str, std, input, i, j, son;
	
	// Crée le clavier
	tr = tableComp.insertRow(tableComp.rows.length-1);
	tr.id = "baroufleur_clavier";
	tr.style.display = "none";
	td = tr.insertCell(0);
	td.className = "mh_tdpage";
	td.style.textAlign = "center";
	td.style.fintWeight = "bold";
	td.colSpan = 2;
	ajouteTexte(td, "Mélodie: ", true);
	span = document.createElement("span");
	span.id = "baroufleur_rang";
	td.appendChild(span);
	div = document.createElement("div");
	div.style.fontWeight = "bold";
	div.style.fontStyle = "italic";
	for(i=1 ; i<=nombreDePAs ; i++) {
		if(i>1) {
			ajouteTexte(div," - ");
		}
		span = document.createElement("span");
		span.id = "baroufleur_son"+i;
		span.style.cursor = "pointer";
		span.rang = i;
		span.onclick = reinitialiseSon;
		div.appendChild(span);
	}
	td.appendChild(div);
	table = document.createElement("table");
	table.style.margin = "auto";
	table.style.textAlign = "center";
	table.style.border = "1px solid black;"
	td.appendChild(table);
	str = table.insertRow(0);
	
	j=0;
	for(i=0 ; i<ordreAlphabétiqueSons.length ; i++) {
		std = str.insertCell(j);
		input = ajouteBouton(std);
		input.id = "baroufleur_btn"+i;
		input.style.margin = "2px";
		input.onclick = valideNote;
		j++;
		if(j==sonsParLigne) {
			j=0;
			str = table.insertRow(-1);
		}
	}
	
	// Clone la liste des effets
	td = tr.insertCell(1);
	td.className = "mh_tdtitre";
	td.style.width = "25%";
	ajouteTexte(td, "Effet total:", true);
	ul = ulRef.cloneNode(true);
	ul.id = "baroufleur_inactif";
	td.appendChild(ul);
	
	// Ajoute le bouton de désactivation du clavier
	input = ajouteBouton(td, "Désactiver le clavier");
	input.onclick = basculeInterface;
	
	return tr;
}

function majClavier(rangActif) {
// Met à jour les boutons du clavier et la mélodie en fonction du modeClavier
// et du rangActif si spécifié
// 
// Nécessite :
// - la création préalable du clavier
// - ordreAlphabétiqueSons || ordreAlphabétiqueEffets
// - BDD_Sons
	var
		rang = document.getElementById("baroufleur_rang"),
		chercheActif = false,
		ordreDesBoutons = ordreAlphabétiqueSons,
		i, span, select, son, input;
	if(!rangActif) {
		chercheActif = true;
		rangActif = 1;
	}
	if(typeClavier==2) {
		ordreDesBoutons = ordreAlphabétiqueEffets;
	}
	
	// Màj de la mélodie
	// (et éventuelle recherche du premier son non défini)
	for(i=1 ; i<=nombreDePAs ; i++) {
		span = document.getElementById("baroufleur_son"+i);
		select = document.getElementsByName("ai_N"+i)[0];
		if(select.value) {
			if(chercheActif) {
				rangActif++;
			}
			son = objSonParCode[select.value];
			span.innerHTML = son;
			span.title = effetDuSon(son, i);
		} else {
			chercheActif = false;
			span.innerHTML = "?";
			span.removeAttribute("title");
		}
	}
	
	// Màj des touches du clavier
	for(i=0 ; i<ordreDesBoutons.length ; i++) {
		input = document.getElementById("baroufleur_btn"+i);
		input.rang = rangActif;
		son = ordreDesBoutons[i];
		input.son = son;
		switch(typeClavier) {
			case 1:
				input.value = son;
				input.title = BDD_Sons[son].description;
				break;
			case 2:
				input.value = effetDuSon(son, rangActif);
				input.title = son;
				break;
			case 3:
				input.value = son+" ("+effetDuSon(son, rangActif)+")";
				input.title = BDD_Sons[son].description;
		}
	}
	
	// Màj des infos sur la mélodie
	if(rangActif<=nombreDePAs) {
		rang.innerHTML = "choix du "+ordinal(rangActif)+" son";
	} else {
		rang.innerHTML = "";
	}
}

//------------------------- Gestion de l'effet total -------------------------//

function ajouteZoneTotal() {
// Crée la zone où le total des effets est affiché.
// Nécessite: nombreDePAs
// Effectue: ajout du td avec l'ul 'baroufleur_effettotal'
	var
		tr = tableComp.rows[1],
		td, ul, input;
	
	// Insère l'effet total comme 3e colonne dans la table
	tableComp.rows[0].cells[0].colSpan = 3;
	tableComp.rows[tableComp.rows.length-1].cells[0].colSpan = 3;
	td = tr.insertCell(2);
	td.className = "mh_tdtitre";
	td.rowSpan = nombreDePAs;
	td.style.width = "25%";
	ajouteTexte(td, "Effet total:", true);
	
	// Ajoute la liste des effets totaux (vide)
	ul = document.createElement("ul");
	ul.id = "baroufleur_effettotal";
	ul.style.textAlign = "left";
	ul.style.margin = "0px";
	td.appendChild(ul);
	
	// Ajoute le bouton d'actvation du clavier
	input = ajouteBouton(td, "Activer le clavier");
	input.onclick = basculeInterface;
}

function majEffetTotal() {
// Mise à jour de la liste des effets 'baroufleur_effettotal'
// en fonction des sons sélectionnés.
// 
// Nécessite:
// - la mise en place de la liste (ul) 'baroufleur_effettotal'
// - BDD_Sons
// - objSonParCode
// - nombreDePAs
// Effectue: mise à jour de l'ul
	var
		// Scope = fonction
		objEffetsTotaux = {}, objSeuils = {},
		
		// Scope = for inital
		i, code, son, effet,
		
		// Scope = affichage final
		ordreAlphaEffetsActifs = [],
		//son, effet,
		li, texte, italic, total, seuil, q, r,
		ulTotal = document.getElementById("baroufleur_effettotal");
	
	// Récupération des effets des sons sélectionnés
	for(i=1 ; i<=nombreDePAs ; i++) {
		code = document.getElementsByName("ai_N"+i)[0].value;
		if(code) {
			son = objSonParCode[code];
			for(effet in BDD_Sons[son].effet) {
				if(objEffetsTotaux[effet]) {
					objEffetsTotaux[effet] += BDD_Sons[son].effet[effet]*i;
				} else {
					objEffetsTotaux[effet] = BDD_Sons[son].effet[effet]*i;
				}
				if(BDD_Sons[son].seuil && !objSeuils[effet]) {
					objSeuils[effet] = {
						seuil: BDD_Sons[son].seuil,
						multiple: BDD_Sons[son].multiple
					};
				}
			}
		}
	}
	
	// Màj de la liste baroufleur_effettotal:
	// Effacement ancienne liste
	while(ulTotal.firstChild) {
		ulTotal.removeChild(ulTotal.firstChild);
	}
	
	// Création de l'ordre alphabétique des effets actifs
	for(effet in objEffetsTotaux) {
		if(objEffetsTotaux[effet]!=0) {
			ordreAlphaEffetsActifs.push(effet);
		}
	}
	ordreAlphaEffetsActifs.sort();
	
	// Génération de la liste des effets
	for(i=0 ; i<ordreAlphaEffetsActifs.length ; i++) {
		effet = ordreAlphaEffetsActifs[i];
		total = objEffetsTotaux[effet];
		italic = false;
		texte = effet;
		li = document.createElement("li");
		if(objSeuils[effet]) {
			seuil = objSeuils[effet].seuil;
			q = Math.floor(total/seuil);
			r = Math.floor(total%seuil);
			if(total<seuil) {
				italic = true;
			}
			if(objSeuils[effet].multiple) {
				texte += " "+relatif(q);
				if(r) {
					texte += " (+"+r+"/"+seuil+")";
				}
			} else if(total!=seuil) {
				texte += " ("+total+"/"+seuil+")";
			}
		} else {
			texte += " "+relatif(objEffetsTotaux[effet]);
		}
		ajouteTexte(li, texte, false, italic);
		ulTotal.appendChild(li);
	}
}

//--------------------------------- Handlers ---------------------------------//

function basculeInterface() {
// Bascule entre les interfaces classique (selects) et clavier
	var clavier = document.getElementById("baroufleur_clavier");
	if(!clavier) {
		clavier = initialiseClavier();
	}
	var
		ulActive = document.getElementById("baroufleur_effettotal"),
		ulInactive = document.getElementById("baroufleur_inactif"),
		i;
	
	if(clavier.style.display=="none") {
		clavier.style.display = "";
		// Masque les lignes d'origine
		for(i=1 ; i<=nombreDePAs ; i++) {
			tableComp.rows[i].style.display = "none";
		}
	} else {
		clavier.style.display = "none";
		// Affiche les lignes d'origine
		for(i=1 ; i<=nombreDePAs ; i++) {
			tableComp.rows[i].style.display = "";
		}
	}
	majClavier();
	ulActive.id = "baroufleur_inactif";
	ulInactive.id = "baroufleur_effettotal";
	majEffetTotal();
}

function valideNote() {
// Gère les clics sur les touches du clavier
	var
		son = this.son,
		rang = this.rang,
		select = document.getElementsByName("ai_N"+rang)[0];
	if(rang<=nombreDePAs) {
		select.value = objCodeDuSon[son];
		majEffetTotal();
		majClavier();
	}
}

function reinitialiseSon() {
// Gère les clics sur les notes de la mélodie
	var rang = this.rang;
	document.getElementsByName("ai_N"+rang)[0].value = "";
	majEffetTotal();
	majClavier(rang);
}

function onSelectChange() {
// Gère les changements sur les selects (interface classique)
	majEffetTotal();
}

//-------------------------------- Code actif --------------------------------//

if(getSonsDisponibles() && getTableComp()) {
	initialiseListesSons();
	ajouteZoneTotal();
}

window.console.debug(
	objSonParCode,
	objCodeDuSon,
	ordreAlphabétiqueSons,
	ordreAlphabétiqueEffets
);

window.console.log("[Baroufleur] Script OFF sur: %s", url);
