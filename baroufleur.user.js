// ==UserScript==
// @name         [Mountyhall] Le Baroufleur
// @namespace    Mountyhall
// @description  Assistant Baroufle
// @author       Dabihul
// @version      0.2.3.7
// @updateURL    http://weblocal/scripts_externes/baroufleur/baroufleur.user.js
// @include      */mountyhall/MH_Play/Actions/Competences/Play_a_Competence43b*
// @grant        none
// ==/UserScript==


//---------------------------- Variables Globales ----------------------------//

var WHEREARTTHOU = window.location.pathname;
window.console.log("[Baroufleur] Script ON! sur : " + WHEREARTTHOU);

var
	// Listes des Sons disponibles
	// {son: code}
	objCodeDuSon = {},
	// {code: son}
	objSonParCode = {
		"dummy": "not an array, sicko!"
	},
	// [son]
	ordreAlphabétiqueSons = [],
	
	// Table principale de la comp'
	tableComp,
	
	// Nombre de PA du Baroufle
	nombreDePAs = 3;

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

// Gestion des objets par Storage
// https://stackoverflow.com/questions/2010892/storing-objects-in-html5-localstorage#answer-3146971
Storage.prototype.setObject = function(key, value) {
    this.setItem(key, JSON.stringify(value));
}

Storage.prototype.getObject = function(key) {
    var value = this.getItem(key);
    return value && JSON.parse(value);
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

//------------------------------ Gestion du DOM ------------------------------//

function appendText(parent, text, bold, italic) {
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

//-------------------------- Extraction de données ---------------------------//

function getSonsDisponibles() {
// Extrait la liste des sons disponibles pour Baroufler.
// 
// Nécessite: -
// Effectue:
// - initialise objCodeDuSon
// - initialise objSonParCode
// - initialise ordreAlphabétiqueSons
	try {
		var selectPremierSon = document.getElementsByName("ai_N1")[0];
	} catch(e) {
		window.console.error(
			"[Baroufleur] Liste de sons non trouvée - Abandon", e
		);
		return false;
	}
	var i, option, texte;
	
	for(i=0 ; i<selectPremierSon.options.length ; i++) {
		option = selectPremierSon.options[i];
		if(option.value) {
			texte = option.textContent.trim();
			if(texte.indexOf("-")!=-1) {
				texte = texte.replace(/-/,"").trim();
			}
			objCodeDuSon[texte] = option.value;
			objSonParCode[option.value] = texte;
			ordreAlphabétiqueSons.push(texte);
		}
	}
	ordreAlphabétiqueSons.sort();
	
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
// Retourne une chaîne de caractère correspondant à l'effet exact du son,
// déterminé par le type du son et son rang dans la mélodie.
	var
		texte = " (",
		effet;
	
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
	texte += ")";
	
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
// - ajoute les Handlers sur les selects
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
			appendText(option, effetDuSon(son, i));
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

//------------------------- Gestion de l'effet total -------------------------//

function ajouteZoneTotal() {
// Crée la zone ou le total des effets est affiché.
// Nécessite: nombreDePAs
// Effectue: ajout du td avec l'ul 'baroufleur_effettotal'
	var
		tr = tableComp.rows[1],
		td, ul;
	
	// Insère l'effet total comme 3e colonne dans la table
	tableComp.rows[0].cells[0].colSpan = 3;
	tableComp.rows[tableComp.rows.length-1].cells[0].colSpan = 3;
	td = tr.insertCell(2);
	td.className = "mh_tdtitre";
	td.rowSpan = nombreDePAs;
	td.style.width = "25%";
	appendText(td, "Effet total:", true);
	
	// Ajoute la liste des effets totaux (vide)
	ul = document.createElement("ul");
	ul.id = "baroufleur_effettotal";
	ul.style.textAlign = "left";
	ul.style.margin = "0px";
	td.appendChild(ul);
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
		
		// Scope = while inital
		i=1, numero, son, effet,
		selects = document.getElementsByName("ai_N1"),
		
		// Scope = affichage final
		ordreAlphabétiqueEffets = [],
		//son, effet,
		li, texte, italic, total, seuil, q, r,
		ulTotal = document.getElementById("baroufleur_effettotal");
	
	// Récupération des effets des sons sélectionnés
	while(selects[0]) {
		numero = selects[0].value;
		if(numero) {
			son = objSonParCode[numero];
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
		i++;
		selects = document.getElementsByName("ai_N"+i);
	}
	
	// Màj de la liste baroufleur_effettotal:
	// Effacement ancienne liste
	while(ulTotal.firstChild) {
		ulTotal.removeChild(ulTotal.firstChild);
	}
	
	// Création de l'ordre alphabétique des effets
	for(effet in objEffetsTotaux) {
		if(objEffetsTotaux[effet]!=0) {
			ordreAlphabétiqueEffets.push(effet);
		}
	}
	ordreAlphabétiqueEffets.sort();
	
	// Génération de la liste des effets
	for(i=0 ; i<ordreAlphabétiqueEffets.length ; i++) {
		texte = effet = ordreAlphabétiqueEffets[i];
		total = objEffetsTotaux[effet];
		italic = false;
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
		appendText(li, texte, false, italic);
		ulTotal.appendChild(li);
	}
}

//--------------------------------- Handlers ---------------------------------//

function onSelectChange() {
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
	ordreAlphabétiqueSons
);

window.console.log("[Baroufleur] Script OFF sur : " + WHEREARTTHOU);

