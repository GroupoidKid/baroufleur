// ==UserScript==
// @name         [Mountyhall] Le Baroufleur
// @namespace    Mountyhall
// @description  Assistant Baroufle
// @author       Dabihul
// @version      0.0.27
// @include      */mountyhall/MH_Play/Actions/Competences/Play_a_Competence43b*
// @grant        none
// ==/UserScript==


// Variables Globales --------------------------------------------------------//

var WHEREARTTHOU = window.location.pathname;
window.console.log("[Baroufleur] Script ON! sur : " + WHEREARTTHOU);

var
	objSonsDisponibles = {},
	nombreDePAs = 3;
	
var BDD_Sons = {
//	"Son": {
//		option      : "ajouté dans <option>"
//		description : "description"
//	},
	"Bababoum"    : {
		option      : "Att +x",
		description : "Attaque +1 par seuil dépensé"
	},
	"Booong"      : {
		option      : "Deg +x | Esq -x",
		description : "Dégâts +1 | Esquive -1 par seuil dépensé"
	},
	"Gaaaw"       : {
		option      : "Fatigue +x",
		description : "Fatigue +1 par seuil dépensé"
	},
	"Huitsch"     : {
		option      : "Deg -x",
		description : "Dégâts -1 par seuil dépensé"
	},
	"Kliketiiik"  : {
		option      : "Esq -x | Concentr. -x",
		description : "Esq -1 | Concentration -1 par seuil dépensé"
	},
	"Krouiiik"    : {
		doubler     : true,
		option      : "Concentration -x",
		description : "Concentration -2 par seuil dépensé"
	},
	"Kssksss"     : {
		option      : "Esq +x",
		description : "Esquive +1 par seuil dépensé"
	},
	"Praaaouuut"  : {
		option      : "Reg -x",
		description : "Régénération +1 par seuil dépensé"
	},
	"Sssrileur"   : {
		seuil       : 6,
		option      : "Désinvi.",
		description : "Rend visible (seuil 6)"
	},
	"Tagadagada"  : {
		seuil       : 2,
		multiple    : true,
		option      : "Durée +x",
		description : "Durée +1 par 2 seuils dépensés"
	},
	"Tuutuuuut"   : {
		option      : "Att -x",
		description : "Attaque -1 par seuil dépensé"
	},
	"Whaaag"      : {
		seuil       : 4,
		multiple    : true,
		option      : "Portée +x",
		description : "Portée horizontale +1 par 4 seuils dépensés"
	},
	"Whoooom"     : {
		doubler     : true,
		option      : "Concentr. +x",
		description : "Concentration +2 par seuil dépensé"
	},
	"Ytseukayndof": {
		seuil       : 2,
		option      : "BMM",
		description : "Rend les bonus magiques (seuil 2)"
	},
	"Zbouing"     : {
		option      : "Reg +x",
		description : "Régénération +1 par seuil dépensé"
	}
}


// Utilitaires génériques ----------------------------------------------------//

function trim(str) {
	return str.replace(/(^\s*)|(\s*$)/g,'');
}

function epure(texte) {
	return texte.
		replace(/[àâä]/g, 'a').
		replace(/Â/g, 'A').
		replace(/ç/g, 'c').
		replace(/[éêèë]/g, 'e').
		replace(/[ïî]/g, 'i').
		replace(/[ôöõ]/g, 'o').
		replace(/[ùûü]/g, 'u');
}


// Gestion du DOM ------------------------------------------------------------//

function insertBefore(next, el) {
	next.parentNode.insertBefore(el, next);
}

function appendText(paren, text, bold) {
	if (bold) {
		var b = document.createElement('b');
		b.appendChild(document.createTextNode(text));
		paren.appendChild(b);
	} else {
		paren.appendChild(document.createTextNode(text));
	}
}


// Extraction de données -----------------------------------------------------//

function getSonsDisponibles() {
// Extrait la liste des sons disponibles pour Baroufler
	try {
		var selectPremierSon = document.getElementsByName("ai_N1")[0];
	} catch(e) {
		window.console.error(
			"[Baroufleur] Liste de sons non trouvée - Abandon"
		);
		return false;
	}
	var i, option, texte;
	
	for(i=0 ; i<selectPremierSon.options.length ; i++) {
		option = selectPremierSon.options[i];
		if(option.value) {
			texte = trim(option.textContent);
			if(texte.indexOf("-")!=-1) {
				texte = trim(texte.replace(/-/,""));
			}
			objSonsDisponibles[texte] = option.value;
		}
	}
	
	return true;
}

function getNombreDePAs() {
// Récupère le nombre de PAs du Baroufle en testant le nombre de selects
// Doit y avoir moyen de le récupérer direct dans la page?
	var
		selects,
		i=3;
		
	do {
		i++;
		selects = document.getElementsByName("ai_N"+i);
	} while(selects[0]);
	
	nombreDePAs = i-1;
}


// Enrichissement des listes -------------------------------------------------//

function enrichirListesSons() {
	var
		i=1, j, son, option, texte,
		selects = document.getElementsByName("ai_N1");
	
	while(selects[0]) {
		for(j=0 ; j<selects[0].options.length ; j++) {
			option = selects[0].options[j];
			// Ajouter les données de BDD_Sons
			for(son in BDD_Sons) {
				if(
					!BDD_Sons[son].seuil &&
					option.textContent.indexOf(son)!=-1
				) {
					if(BDD_Sons[son].doubler) {
						texte = BDD_Sons[son].option.replace(/x/,2*i);
					} else {
						texte = BDD_Sons[son].option.replace(/x/g,i);
					}
					appendText(option, " ("+texte+")");
					break;
				}
			}
		}
		i++;
		selects = document.getElementsByName("ai_N"+i);
	}
}

// Code actif ----------------------------------------------------------------//

getSonsDisponibles();
getNombreDePAs();
window.console.debug(objSonsDisponibles);
window.console.debug(nombreDePAs);

enrichirListesSons();

window.console.log("[Baroufleur] Script OFF sur : " + WHEREARTTHOU);

